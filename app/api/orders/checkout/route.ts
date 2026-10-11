import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString, validatePhone } from "@/lib/security/validation";
import { recalculateOrderFromDatabase } from "@/lib/orders/orderCalculator";
import { getCustomerSessionFromRequest } from "@/lib/security/customerAuth";
import { saveRuntimeOrder } from "@/lib/ordersStore";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (Prevent checkout spam / card attacks)
    const rateLimitResponse = enforceRateLimit(req, "orders_checkout", {
      limit: 15,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const {
      orderNumber,
      paymentMethod,
      items,
      couponCode,
      customerName,
      customerPhone,
      deliveryAddress,
    } = body;

    // 2. Validate items presence
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please add at least one dish to your order." },
        { status: 400 }
      );
    }

    // 3. SERVER-SIDE PRICE & DISCOUNT RECALCULATION
    // Any client-sent 'amount', 'price', 'total', 'isAdmin', or 'paymentStatus' is completely ignored.
    let recalculated;
    try {
      recalculated = await recalculateOrderFromDatabase(items, couponCode);
    } catch (calcErr: any) {
      return NextResponse.json(
        { success: false, error: calcErr.message || "Failed to calculate order pricing." },
        { status: 400 }
      );
    }

    // 4. Sanitize customer inputs
    const safeOrderNumber =
      sanitizeString(orderNumber, 60) || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const safeCustomerName = sanitizeString(customerName, 100) || "Royal Guest";
    const phoneResult = validatePhone(customerPhone || "");
    const safePhone = phoneResult.isValid ? phoneResult.sanitized : sanitizeString(customerPhone, 20);
    const safeAddress = sanitizeString(deliveryAddress, 300) || "NEXORA Dining Lounge";

    const normalizedMethod = String(paymentMethod || "cod").toLowerCase();
    const isOnlinePayment = normalizedMethod !== "cod";

    // 5. Server-side session verification (if logged in)
    const customerSession = await getCustomerSessionFromRequest(req);
    const userId = customerSession?.id || null;

    // 6. Handle Online Payment Gateway (Razorpay)
    let razorpayOrderId: string | null = null;
    const amountInPaise = Math.round(recalculated.grandTotal * 100);

    if (isOnlinePayment) {
      const razorpay = getRazorpayClient();
      if (razorpay) {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: safeOrderNumber,
          notes: {
            customerName: safeCustomerName,
            customerPhone: safePhone,
            couponCode: recalculated.couponCode || "None",
            subtotal: String(recalculated.subtotal),
          },
        });
        razorpayOrderId = rzpOrder.id;
      } else {
        // Deterministic sandbox order id
        razorpayOrderId = `order_demo_${Date.now()}`;
      }
    }

    // 7. Record Order in Database strictly as 'pending' with server-computed amounts
    const supabase = createServerClient({ admin: true });
    const nowIso = new Date().toISOString();

    const orderRecord = {
      order_number: safeOrderNumber,
      user_id: userId,
      customer_name: safeCustomerName,
      customer_phone: safePhone,
      delivery_type: "delivery",
      delivery_address: safeAddress,
      status: "pending", // Enforced server-side
      payment_method: isOnlinePayment ? "online" : "cod",
      payment_status: "pending", // Enforced server-side: online is only 'paid' after verified webhook / signature
      subtotal: recalculated.subtotal,
      discount: recalculated.discountAmount,
      delivery_fee: recalculated.deliveryFee,
      tax: recalculated.tax,
      total_amount: recalculated.grandTotal,
      total: recalculated.grandTotal,
      coupon_code: recalculated.couponCode,
      notes: isOnlinePayment
        ? `Razorpay Order: ${razorpayOrderId}${recalculated.couponCode ? ` (Coupon: ${recalculated.couponCode})` : ""}`
        : recalculated.couponCode
        ? `Coupon: ${recalculated.couponCode}`
        : null,
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
        console.warn("Supabase order insert notice:", orderInsertErr.message);
      } else if (insertedOrder?.id) {
        createdOrderId = insertedOrder.id;
        // Insert order_items with foreign key relationship to orders(id)
        if (Array.isArray(recalculated.items) && recalculated.items.length > 0) {
          const itemRows = recalculated.items.map((item) => ({
            order_id: createdOrderId,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit_price: item.price,
            total_price: Math.round(item.price * item.quantity),
          }));
          const { error: itemsInsertErr } = await supabase
            .from("order_items")
            .insert(itemRows);
          if (itemsInsertErr) {
            console.warn("Supabase order_items insert notice:", itemsInsertErr.message);
          }
        }
      }
    } catch (dbErr) {
      console.warn("Supabase order insert warning:", dbErr);
    }

    // Update resilient runtime orders cache
    saveRuntimeOrder({
      id: createdOrderId || `ord_${Date.now()}`,
      order_number: safeOrderNumber,
      customer_name: safeCustomerName,
      customer_phone: safePhone,
      total: recalculated.grandTotal,
      total_amount: recalculated.grandTotal,
      items: recalculated.items,
      status: "pending",
      payment_method: isOnlinePayment ? "online" : "cod",
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

    if (isOnlinePayment) {
      return NextResponse.json({
        success: true,
        orderNumber: safeOrderNumber,
        paymentMethod: "online",
        orderId: razorpayOrderId,
        amount: recalculated.grandTotal,
        amountInPaise,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
        calculated: recalculated,
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber: safeOrderNumber,
      paymentMethod: "cod",
      amount: recalculated.grandTotal,
      calculated: recalculated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout processing failure";
    console.error("Orders checkout endpoint error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
