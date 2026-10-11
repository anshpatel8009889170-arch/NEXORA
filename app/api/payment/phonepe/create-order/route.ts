import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString, validatePhone } from "@/lib/security/validation";
import { recalculateOrderFromDatabase } from "@/lib/orders/orderCalculator";
import { getCustomerSessionFromRequest } from "@/lib/security/customerAuth";
import { createServerClient } from "@/lib/supabase/server";
import { saveRuntimeOrder } from "@/lib/ordersStore";
import { initiatePhonePePayment } from "@/lib/phonepe";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const rateLimitResponse = enforceRateLimit(req, "phonepe_create_order", {
      limit: 15,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const {
      orderNumber,
      items,
      couponCode,
      customerName,
      customerPhone,
      deliveryAddress,
      targetApp,
    } = body;

    // 2. Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please add at least one dish to your order." },
        { status: 400 }
      );
    }

    // Validate explicit amount if provided (Defense in depth against zero, negative or overflow)
    if (typeof body.amount === "number") {
      if (body.amount <= 0 || body.amount > 500000) {
        return NextResponse.json(
          { success: false, error: "Invalid payment amount specified." },
          { status: 400 }
        );
      }
    }

    // 3. Mandatory Customer Phone Validation
    const phoneValidation = validatePhone(customerPhone || "");
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit Indian mobile number is required (+91)." },
        { status: 400 }
      );
    }
    const cleanPhone = phoneValidation.sanitized;

    const safeOrderNumber = sanitizeString(orderNumber, 40) || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const safeCustomerName = sanitizeString(customerName, 80) || "Royal Guest";
    const safeAddress = sanitizeString(deliveryAddress, 300) || "Sathigva, Amauli-Fatehpur Road, 212631";

    // 4. Authoritative Server-Side Price Recalculation (KAMI 9 SECURITY)
    const recalculated = await recalculateOrderFromDatabase(items, couponCode);

    // 5. Server-side session verification (if logged in)
    const customerSession = await getCustomerSessionFromRequest(req);
    const userId = customerSession?.id || null;

    // 6. Record Pending Order in Database
    const supabase = createServerClient({ admin: true });
    const nowIso = new Date().toISOString();

    const orderRecord = {
      order_number: safeOrderNumber,
      user_id: userId,
      customer_name: safeCustomerName,
      customer_phone: cleanPhone,
      delivery_type: "delivery",
      delivery_address: safeAddress,
      status: "pending",
      payment_method: "phonepe",
      payment_status: "pending",
      subtotal: recalculated.subtotal,
      discount: recalculated.discountAmount,
      delivery_fee: recalculated.deliveryFee,
      tax: recalculated.tax,
      total_amount: recalculated.grandTotal,
      total: recalculated.grandTotal,
      coupon_code: recalculated.couponCode,
      notes: `PhonePe Online PG${recalculated.couponCode ? ` (Coupon: ${recalculated.couponCode})` : ""}`,
      created_at: nowIso,
      updated_at: nowIso,
    };

    let createdOrderId: string | null = null;
    try {
      const { data: insertedOrder, error: orderInsertErr } = await supabase
        .from("orders")
        .insert(orderRecord)
        .select("id")
        .maybeSingle();

      if (orderInsertErr) {
        console.warn("PhonePe order insert notice:", orderInsertErr.message);
      } else if (insertedOrder?.id) {
        createdOrderId = insertedOrder.id;
        if (Array.isArray(recalculated.items) && recalculated.items.length > 0) {
          const itemRows = recalculated.items.map((item) => ({
            order_id: createdOrderId,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit_price: item.price,
            total_price: Math.round(item.price * item.quantity),
          }));
          await supabase.from("order_items").insert(itemRows);
        }
      }
    } catch (dbErr) {
      console.warn("Supabase order insert warning:", dbErr);
    }

    saveRuntimeOrder({
      id: createdOrderId || `ord_${Date.now()}`,
      order_number: safeOrderNumber,
      customer_name: safeCustomerName,
      customer_phone: cleanPhone,
      total: recalculated.grandTotal,
      total_amount: recalculated.grandTotal,
      items: recalculated.items,
      status: "pending",
      payment_method: "phonepe",
      payment_status: "pending",
      status_history: [
        {
          status: "pending",
          previous_status: "pending",
          changed_by: "system@nexora.luxury",
          changed_by_role: "system",
          timestamp: nowIso,
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
    });

    // 7. Initiate PhonePe Payment (Swiggy / Zomato UPI Intent Flow)
    const origin = req.nextUrl.origin || "http://localhost:3000";
    const redirectUrl = `${origin}/payment/status?orderNumber=${safeOrderNumber}`;
    const callbackUrl = `${origin}/api/payment/phonepe/webhook`;

    const phonePeResult = await initiatePhonePePayment({
      orderNumber: safeOrderNumber,
      amount: recalculated.grandTotal,
      customerPhone: cleanPhone,
      customerName: safeCustomerName,
      redirectUrl,
      callbackUrl,
      targetApp: targetApp || "ANY",
    });

    if (!phonePeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: phonePeResult.message || "Failed to connect to PhonePe payment gateway.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "phonepe",
      orderNumber: safeOrderNumber,
      merchantTransactionId: phonePeResult.merchantTransactionId,
      amount: recalculated.grandTotal,
      amountInPaise: phonePeResult.amountInPaise,
      redirectUrl: phonePeResult.redirectUrl,
      calculated: recalculated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PhonePe order initiation failure";
    console.error("PhonePe create-order error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
