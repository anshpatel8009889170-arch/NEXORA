import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "nexora_webhook_secret_demo";

    if (!signature && webhookSecret !== "nexora_webhook_secret_demo") {
      return NextResponse.json({ error: "Missing webhook signature header" }, { status: 400 });
    }

    // Verify webhook signature
    if (webhookSecret !== "nexora_webhook_secret_demo" && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("🚨 Razorpay Webhook signature mismatch!");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // Handle payment.captured or order.paid events
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const receipt = payment?.notes?.orderNumber || payment?.description;

      console.log(`✅ Webhook received: ${event.event} for order ${orderId || receipt}`);

      // Update database order to paid
      if (receipt) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "accepted",
            notes: `Webhook confirmed paid: ${payment?.id}`,
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", receipt);
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
