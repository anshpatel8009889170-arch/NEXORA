import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSessionFromRequest,
  createCustomerSessionToken,
  setCustomerSessionCookie,
} from "@/lib/security/customerAuth";
import { validatePhone, sanitizeString } from "@/lib/security/validation";
import {
  findCustomerByPhone,
  upsertCustomerProfile,
} from "@/lib/customersStore";

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: true, authenticated: false, customer: null });
    }

    const customer = await findCustomerByPhone(session.phone);
    return NextResponse.json({
      success: true,
      authenticated: true,
      customer: customer || {
        id: session.id,
        phone: session.phone,
        full_name: session.name || "",
        role: "customer",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load customer profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, id } = body;

    const phoneCheck = validatePhone(phone || "");
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit mobile number required." },
        { status: 400 }
      );
    }

    const rawName = body?.name || body?.full_name;
    const trimmedName = sanitizeString(rawName, 100);
    if (!trimmedName || trimmedName === "Guest" || trimmedName === "Royal Guest") {
      return NextResponse.json(
        { success: false, error: "Please enter your genuine full name." },
        { status: 400 }
      );
    }

    const cleanEmail = email ? sanitizeString(email, 120) : undefined;

    // Persist into authoritative customer store
    const savedCustomer = await upsertCustomerProfile({
      id,
      phone: phoneCheck.sanitized,
      full_name: trimmedName,
      email: cleanEmail,
    });

    // Update customer session cookie with authentic registered name
    const sessionToken = await createCustomerSessionToken({
      id: savedCustomer.id,
      phone: savedCustomer.phone,
      name: savedCustomer.full_name,
    });

    const response = NextResponse.json({
      success: true,
      message: `Profile established for ${savedCustomer.full_name}.`,
      customer: savedCustomer,
    });

    setCustomerSessionCookie(response, sessionToken);
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to persist customer profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
