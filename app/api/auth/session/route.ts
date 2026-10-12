import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSessionFromRequest,
  createCustomerSessionToken,
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
} from "@/lib/security/customerAuth";
import { validatePhone, sanitizeString } from "@/lib/security/validation";
import { createServerClient } from "@/lib/supabase/server";
import { findCustomerByPhone, upsertCustomerProfile } from "@/lib/customersStore";

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

    // Fetch up-to-date name from customersStore
    const customer = await findCustomerByPhone(session.phone);
    const resolvedName = customer?.full_name || session.name;

    const hasAuthenticName = Boolean(
      resolvedName &&
      resolvedName.trim().length > 0 &&
      resolvedName.trim() !== "Guest" &&
      resolvedName.trim() !== "Royal Guest"
    );

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: customer?.id || session.id,
        phone: session.phone,
        name: hasAuthenticName && resolvedName ? resolvedName.trim() : "",
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
    const safeName = (name && name !== "Royal Guest" && name !== "Guest") ? sanitizeString(name, 100) : "";

    let effectiveId = safeId;
    if (safeName) {
      const saved = await upsertCustomerProfile({
        id: safeId,
        phone: phoneResult.sanitized,
        full_name: safeName,
      });
      effectiveId = saved.id;
    }

    const token = await createCustomerSessionToken({
      id: effectiveId,
      phone: phoneResult.sanitized,
      name: safeName,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: effectiveId,
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
