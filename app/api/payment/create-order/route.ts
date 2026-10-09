import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
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
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    const amountInPaise = Math.round(amount * 100);
    const razorpay = getRazorpayClient();
    let razorpayOrderId = "";

    if (razorpay) {
      // Create real Razorpay order via official SDK
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderNumber,
        notes: {
          customerName: customerName || "Guest",
          customerPhone: customerPhone || "N/A",
        },
      });
      razorpayOrderId = rzpOrder.id;
    } else {
      // Seamless sandbox order for testing without real credentials
      razorpayOrderId = `order_demo_${Date.now()}`;
    }

    // Record initial order as 'pending' in database
    try {
      await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: customerName || "Guest",
        customer_phone: customerPhone || "N/A",
        delivery_type: "delivery",
        delivery_address: deliveryAddress || "N/A",
        status: "pending",
        payment_method: "online",
        payment_status: "pending",
        subtotal: subtotal || amount,
        discount: discountAmount || 0,
        delivery_fee: deliveryFee || 0,
        tax: 0,
        total_amount: amount,
        notes: `Razorpay Order: ${razorpayOrderId}`,
      });
    } catch (dbErr) {
      console.warn("Supabase order recording notice in create-order:", dbErr);
    }

    return NextResponse.json({
      success: true,
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_nexora_demo",
      orderNumber,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create Razorpay order";
    console.error("Create order error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
