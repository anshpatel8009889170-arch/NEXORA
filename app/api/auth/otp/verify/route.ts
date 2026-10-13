import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validatePhone, sanitizeString } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";
import {
  createCustomerSessionToken,
  setCustomerSessionCookie,
} from "@/lib/security/customerAuth";
import { findCustomerByPhone, upsertCustomerProfile } from "@/lib/customersStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, token } = body;

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number format." },
        { status: 400 }
      );
    }

    const cleanToken = String(token || "").trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return NextResponse.json(
        { success: false, error: "Verification code must be a 6-digit number." },
        { status: 400 }
      );
    }

    const formattedPhone = phoneCheck.sanitized;
    const rawDigits = formattedPhone.replace(/\D/g, "").slice(-10);

    // 1. Strict rate limiting to prevent brute-forcing OTPs (partitioned by phone number)
    const rateLimitResponse = enforceRateLimit(
      req,
      "auth_verify_otp",
      {
        limit: 30,
        windowMs: 10 * 60 * 1000,
      },
      rawDigits
    );
    if (rateLimitResponse) return rateLimitResponse;
    const isProduction = process.env.NODE_ENV === "production";
    const supabase = createServerClient({ admin: true });

    let verifiedUserId: string | null = null;
    let verifiedPhone: string = formattedPhone;

    // 2. Real Supabase Auth verification
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanToken,
        type: "sms",
      });

      if (!error && data?.user) {
        verifiedUserId = data.user.id;
        verifiedPhone = data.user.phone || formattedPhone;
      }
    } catch {}

    // 3. Environment check for demo fallback
    if (!verifiedUserId) {
      if (isProduction) {
        // In production, arbitrary OTP guesses are strictly rejected
        return NextResponse.json(
          { success: false, error: "Invalid verification code. Please request a new code." },
          { status: 401 }
        );
      }

      // Development / test sandbox verification
      if (cleanToken === "123456" || cleanToken === "000000") {
        const rawPhoneDigits = formattedPhone.replace(/\D/g, "");
        verifiedUserId = `user_${rawPhoneDigits}`;
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid verification code." },
          { status: 401 }
        );
      }
    }

    // 4. Retrieve or initialize user profile in customer store / Supabase
    let customer = await findCustomerByPhone(formattedPhone);

    const incomingName = typeof body.name === "string" ? body.name.trim() : "";
    const incomingEmail = typeof body.email === "string" ? body.email.trim() : undefined;

    if (incomingName && incomingName !== "Guest" && incomingName !== "Royal Guest") {
      customer = await upsertCustomerProfile({
        id: verifiedUserId,
        phone: formattedPhone,
        full_name: incomingName,
        email: incomingEmail,
      });
    }

    const hasRealName = Boolean(
      customer?.full_name &&
      customer.full_name.trim().length > 0 &&
      customer.full_name.trim() !== "Guest" &&
      customer.full_name.trim() !== "Royal Guest"
    );

    const isNewUser = !hasRealName;
    const userName = hasRealName ? customer!.full_name.trim() : "";
    const effectiveUserId = customer?.id || verifiedUserId;

    // 5. Issue cryptographic server-side session token
    const sessionToken = await createCustomerSessionToken({
      id: effectiveUserId,
      phone: verifiedPhone,
      name: userName || "",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: effectiveUserId,
        phone: verifiedPhone,
        name: userName, // empty string for new user, actual name for registered user
        role: "customer",
      },
      isNewUser,
    });

    setCustomerSessionCookie(response, sessionToken);
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to verify OTP";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
