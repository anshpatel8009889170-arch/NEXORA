import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validatePhone } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting to prevent SMS abuse
    const rateLimitResponse = enforceRateLimit(req, "auth_send_otp", {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { phone } = body;

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const formattedPhone = phoneCheck.sanitized;
    const rawDigits = formattedPhone.replace(/\D/g, "").slice(-10);
    const isProduction = process.env.NODE_ENV === "production";

    // 2. Check if this phone number is already registered with a genuine full name
    let isRegistered = false;
    let registeredName: string | null = null;
    try {
      const supabaseAdmin = createServerClient({ admin: true });
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone")
        .or(`phone.ilike.%${rawDigits}%,id.eq.user_${rawDigits}`)
        .maybeSingle();

      if (
        existingProfile?.full_name &&
        existingProfile.full_name.trim().length > 0 &&
        existingProfile.full_name.trim() !== "Guest" &&
        existingProfile.full_name.trim() !== "Royal Guest"
      ) {
        isRegistered = true;
        registeredName = existingProfile.full_name.trim();
      }
    } catch {}

    // 3. Attempt real Supabase Auth SMS dispatch
    try {
      const supabase = createServerClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: isRegistered
            ? `Welcome back${registeredName ? `, ${registeredName}` : ""}! Verification code sent to ${formattedPhone}.`
            : `New account: Verification code sent to ${formattedPhone}.`,
          isRegistered,
          registeredName,
        });
      }

      if (isProduction) {
        return NextResponse.json(
          { success: false, error: error.message || "Failed to send SMS verification code." },
          { status: 502 }
        );
      }
    } catch (err: any) {
      if (isProduction) {
        return NextResponse.json(
          { success: false, error: err.message || "SMS service currently unavailable." },
          { status: 502 }
        );
      }
    }

    // Development sandbox mode
    return NextResponse.json({
      success: true,
      message: isRegistered
        ? `Welcome back${registeredName ? `, ${registeredName}` : ""}! (Use demo code 123456)`
        : `New account detected! Enter code to verify. (Use demo code 123456)`,
      isRegistered,
      registeredName,
      isSandbox: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to dispatch OTP";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
