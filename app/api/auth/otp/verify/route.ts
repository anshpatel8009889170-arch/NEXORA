import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validatePhone, sanitizeString } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";
import {
  createCustomerSessionToken,
  setCustomerSessionCookie,
} from "@/lib/security/customerAuth";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict rate limiting to prevent brute-forcing OTPs
    const rateLimitResponse = enforceRateLimit(req, "auth_verify_otp", {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

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

    // 4. Retrieve or initialize user profile in database
    let profileData: any = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", verifiedUserId)
        .maybeSingle();
      profileData = data;
    } catch {}

    const isNewUser = !profileData || !profileData.full_name || profileData.full_name === "Guest";
    const userName = profileData?.full_name || "Royal Guest";

    if (!profileData) {
      try {
        await supabase.from("profiles").upsert({
          id: verifiedUserId,
          phone: verifiedPhone,
          full_name: userName,
          role: "customer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch {}
    }

    // 5. Issue cryptographic server-side session token
    const sessionToken = await createCustomerSessionToken({
      id: verifiedUserId,
      phone: verifiedPhone,
      name: userName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: verifiedUserId,
        phone: verifiedPhone,
        name: userName,
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
