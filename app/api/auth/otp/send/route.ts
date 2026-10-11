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
    const isProduction = process.env.NODE_ENV === "production";

    // 2. Attempt real Supabase Auth SMS dispatch
    try {
      const supabase = createServerClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          message: `Verification code sent to ${formattedPhone}.`,
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
      message: `Development mode: OTP dispatched for ${formattedPhone}. (Use demo code 123456)`,
      isSandbox: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to dispatch OTP";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
