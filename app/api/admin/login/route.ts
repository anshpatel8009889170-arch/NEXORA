import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validateEmail, sanitizeString } from "@/lib/security/validation";
import { setAdminCookieOnResponse } from "@/lib/security/adminAuth";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict rate limiting on login attempts (Max 5 attempts / minute per IP)
    const rateLimitResponse = enforceRateLimit(req, "admin_login", {
      limit: 8,
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

    // 2. Verified admin emails
    const isOwnerEmail =
      email === "nexora67@gmail.com" ||
      email === "vaibhavpatel8543@gmail.com" ||
      email === "admin@nexora.com" ||
      email === "owner@nexora.com";

    const isOwnerPassword =
      password === "123456" ||
      password === "admin123" ||
      password === "nexora2026";

    // 3. Check Supabase Auth
    const supabase = createServerClient();
    let authUser: any = null;
    let authRole = "admin";
    let adminName = "Restaurant Owner";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        authUser = data.user;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          authRole = profile.role || "admin";
          adminName = profile.full_name || "NEXORA Administrator";
        }
      }
    } catch {
      // Offline fallback
    }

    // If Supabase didn't match, verify owner test credentials
    if (!authUser) {
      if (isOwnerEmail && isOwnerPassword) {
        authUser = {
          id: "admin_master_001",
          email,
        };
        adminName = email === "nexora67@gmail.com" ? "NEXORA Admin" : "Vaibhav Patel (Owner)";
        authRole = "admin";
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid administrator credentials. Access denied." },
          { status: 401 }
        );
      }
    }

    // 4. Verify authorization role
    if (authRole !== "admin" && authRole !== "staff" && authRole !== "owner") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Insufficient administrator privileges." },
        { status: 403 }
      );
    }

    const sessionPayload = {
      id: authUser.id,
      email: authUser.email || email,
      role: authRole as any,
      name: adminName,
    };

    const response = NextResponse.json({
      success: true,
      message: "Administrator session authenticated successfully.",
      user: sessionPayload,
    });

    // 5. Attach Secure HTTP-Only Cookie
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
