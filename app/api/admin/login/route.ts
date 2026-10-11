import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validateEmail, sanitizeString } from "@/lib/security/validation";
import { setAdminCookieOnResponse, AdminRole } from "@/lib/security/adminAuth";

// Deprecated/compromised passwords that must always be rejected immediately
const COMPROMISED_PASSWORDS = new Set([
  "123456",
  "admin123",
  "password",
  "nexora2026",
  "12345678",
  "admin@123",
  "password123",
  "admin",
  "root",
]);

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict rate limiting on admin login (Max 5 attempts / minute per IP)
    const rateLimitResponse = enforceRateLimit(req, "admin_login", {
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const rawEmail = sanitizeString(body?.email, 254);
    const password = String(body?.password || "");

    const { isValid, sanitized: email } = validateEmail(rawEmail);
    if (!isValid || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid administrator email and password." },
        { status: 400 }
      );
    }

    // 2. Reject passwords shorter than 8 characters
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters in length to meet restaurant security standards.",
        },
        { status: 400 }
      );
    }

    // 3. Immediately reject deprecated / compromised test passwords
    if (COMPROMISED_PASSWORDS.has(password.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "This password has been deprecated for security. Please use your strong authorized password.",
        },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    let authUser: { id: string; email: string } | null = null;
    let authRole: AdminRole | null = null;
    let adminName = "NEXORA Administrator";

    // 4. Primary: Authenticate with Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData?.user) {
        authUser = {
          id: authData.user.id,
          email: authData.user.email || email,
        };

        // Step 3 & 4: Server-side profile & role verification from the database
        // Do NOT make a user an admin merely because their email matches!
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", authData.user.id)
          .single();

        if (profile && (profile.role === "owner" || profile.role === "admin" || profile.role === "staff")) {
          authRole = profile.role as AdminRole;
          adminName = profile.full_name || "NEXORA Administrator";
        } else {
          // User exists but has no admin/staff role in database
          return NextResponse.json(
            {
              success: false,
              error: "Access Denied: Your account does not have administrator or staff privileges.",
            },
            { status: 403 }
          );
        }
      }
    } catch {
      // Supabase Auth service fallback to server-configured identity
    }

    // 5. Server-Side Managed Identity Fallback (Environment-Configured Secrets)
    // Used when server-side credentials are configured via environment secrets (NEVER hardcoded in source code)
    if (!authUser || !authRole) {
      const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER_EMAIL || "").trim();
      const envAdminPassword = (process.env.ADMIN_PASSWORD || "").trim();

      if (envAdminEmail && envAdminPassword && email.toLowerCase() === envAdminEmail.toLowerCase()) {
        // Timing-safe constant-time string comparison to prevent timing side-channel attacks
        const bufInput = Buffer.from(password, "utf8");
        const bufTarget = Buffer.from(envAdminPassword, "utf8");

        const passwordsMatch =
          bufInput.length === bufTarget.length &&
          crypto.timingSafeEqual(bufInput, bufTarget);

        if (passwordsMatch) {
          authUser = {
            id: "usr_admin_owner_master",
            email: envAdminEmail,
          };
          authRole = "owner";
          adminName = "Vaibhav Patel (Owner)";

          // Check if database has a role override or display name in profiles
          try {
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("role, full_name")
              .eq("phone", envAdminEmail)
              .single();

            if (dbProfile) {
              if (dbProfile.role === "owner" || dbProfile.role === "admin" || dbProfile.role === "staff") {
                authRole = dbProfile.role as AdminRole;
              }
              if (dbProfile.full_name) adminName = dbProfile.full_name;
            }
          } catch {}
        }
      }
    }

    // 6. If neither Supabase Auth nor server-configured identity validated, reject credentials
    if (!authUser || !authRole) {
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials. Access denied." },
        { status: 401 }
      );
    }

    // 7. Verify authorized role (owner, admin, staff)
    if (authRole !== "owner" && authRole !== "admin" && authRole !== "staff") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Insufficient administrator privileges." },
        { status: 403 }
      );
    }

    const sessionPayload = {
      id: authUser.id,
      email: authUser.email || email,
      role: authRole,
      name: adminName,
    };

    const response = NextResponse.json({
      success: true,
      message: "Administrator session authenticated successfully.",
      user: sessionPayload,
    });

    // 8. Attach Secure Cryptographically Signed HTTP-Only Cookie
    await setAdminCookieOnResponse(response, sessionPayload);

    return response;
  } catch (error: any) {
    console.error("Admin login API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal authentication error." },
      { status: 500 }
    );
  }
}
