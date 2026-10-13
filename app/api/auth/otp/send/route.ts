import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { validatePhone } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";
import { findCustomerByPhone } from "@/lib/customersStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, mode } = body;

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const formattedPhone = phoneCheck.sanitized;
    const rawDigits = formattedPhone.replace(/\D/g, "").slice(-10);

    // 1. Rate Limiting to prevent SMS abuse (partitioned by phone number)
    const rateLimitResponse = enforceRateLimit(
      req,
      "auth_send_otp",
      {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      },
      rawDigits
    );
    if (rateLimitResponse) return rateLimitResponse;
    const isProduction = process.env.NODE_ENV === "production";

    // 2. Check if this phone number is already registered with a genuine full name in Supabase
    let isRegistered = false;
    let registeredName: string | null = null;
    try {
      const existing = await findCustomerByPhone(formattedPhone);
      if (
        existing?.full_name &&
        existing.full_name.trim().length > 0 &&
        existing.full_name.trim() !== "Guest" &&
        existing.full_name.trim() !== "Royal Guest"
      ) {
        isRegistered = true;
        registeredName = existing.full_name.trim();
      }
    } catch {}

    // 3. STRICT MODE VALIDATION:
    // Case A: Sign In mode, but number is NOT registered -> BLOCK OTP dispatch!
    if (mode === "login" && !isRegistered) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          error: "No account found with this mobile number. You are a new user, please Create Account.",
          isRegistered: false,
        },
        { status: 404 }
      );
    }

    // Case B: Create Account mode, but number IS ALREADY registered -> BLOCK OTP dispatch!
    if (mode === "signup" && isRegistered) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_ALREADY_EXISTS",
          error: `This mobile number is already registered to ${registeredName || "an existing patron"}. Please switch to Sign In.`,
          isRegistered: true,
          registeredName,
        },
        { status: 409 }
      );
    }

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
