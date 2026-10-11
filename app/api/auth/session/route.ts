import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSessionFromRequest,
  createCustomerSessionToken,
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
} from "@/lib/security/customerAuth";
import { validatePhone, sanitizeString } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    // Optionally fetch up-to-date name from database
    let profileName = session.name;
    try {
      const supabase = createServerClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.id)
        .maybeSingle();

      if (profile?.full_name) {
        profileName = profile.full_name;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.id,
        phone: session.phone,
        name: profileName || "Royal Guest",
        role: "customer",
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, phone, name } = body;

    const phoneResult = validatePhone(phone || "");
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit mobile number required." },
        { status: 400 }
      );
    }

    const safeId = sanitizeString(id, 64) || `cust_${Date.now()}`;
    const safeName = sanitizeString(name, 100) || "Royal Guest";

    const token = await createCustomerSessionToken({
      id: safeId,
      phone: phoneResult.sanitized,
      name: safeName,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: safeId,
        phone: phoneResult.sanitized,
        name: safeName,
        role: "customer",
      },
    });

    setCustomerSessionCookie(res, token);
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to establish customer session";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: "Customer session invalidated." });
  clearCustomerSessionCookie(res);
  return res;
}
