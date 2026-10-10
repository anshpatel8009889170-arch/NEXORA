import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import {
  validateAmount,
  validatePhone,
  sanitizeString,
  sanitizeCouponCode,
} from "@/lib/security/validation";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Prevent automated checkout flood & credit card testing)
    const rateLimitResponse = enforceRateLimit(req, "payment_create_order", {
      limit: 12,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const {
      orderNumber,
      amount,
      customerName,
      customerPhone,
      deliveryAddress,
      subtotal,
      deliveryFee,
      discountAmount,
      couponCode,
    } = body;

    // 2. Strict Input Validation & Sanitization
    const validAmountResult = validateAmount(amount, 1, 150000);
    if (!validAmountResult.isValid) {
      return NextResponse.json(
        { error: "Invalid order amount. Must be a valid positive amount." },
        { status: 400 }
      );
    }

    const safeOrderNumber = sanitizeString(orderNumber, 60) || `ORD-${Date.now()}`;
    const safeCustomerName = sanitizeString(customerName, 100) || "Valued Patron";
    const phoneResult = validatePhone(customerPhone || "");
    const safePhone = phoneResult.isValid ? phoneResult.sanitized : sanitizeString(customerPhone, 20);
    const safeAddress = sanitizeString(deliveryAddress, 300) || "N/A";
    const safeCoupon = sanitizeCouponCode(couponCode);

    const validSubtotal = validateAmount(subtotal, 0, 150000).value || validAmountResult.value;
    const validDeliveryFee = validateAmount(deliveryFee, 0, 1000).value || 0;
    const validDiscount = validateAmount(discountAmount, 0, 10000).value || 0;

    const amountInPaise = Math.round(validAmountResult.value * 100);
    const razorpay = getRazorpayClient();
    let razorpayOrderId = "";

    if (razorpay) {
      // Create real Razorpay order via official SDK
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: safeOrderNumber,
        notes: {
          customerName: safeCustomerName,
          customerPhone: safePhone,
          couponCode: safeCoupon || "None",
        },
      });
      razorpayOrderId = rzpOrder.id;
    } else {
      // Sandbox fallback order for testing without real credentials
      razorpayOrderId = `order_demo_${Date.now()}`;
    }

    // 3. Record initial order as 'pending' in database via Server Supabase client
    try {
      const supabase = createServerClient();
      await supabase.from("orders").insert({
        order_number: safeOrderNumber,
        customer_name: safeCustomerName,
        customer_phone: safePhone,
        delivery_type: "delivery",
        delivery_address: safeAddress,
        status: "pending",
        payment_method: "online",
        payment_status: "pending",
        subtotal: validSubtotal,
        discount: validDiscount,
        delivery_fee: validDeliveryFee,
        tax: 0,
        total_amount: validAmountResult.value,
        total: validAmountResult.value,
        notes: `Razorpay Order initiated: ${razorpayOrderId}${safeCoupon ? ` (Coupon: ${safeCoupon})` : ""}`,
      });
    } catch (dbErr) {
      console.warn("DB insert pending order warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: validAmountResult.value,
      amountInPaise,
      currency: "INR",
      orderNumber: safeOrderNumber,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    console.error("Create order payment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
