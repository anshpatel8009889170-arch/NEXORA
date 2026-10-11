import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    // 1. Rate limiting on webhook endpoint
    const rateLimitResponse = enforceRateLimit(req, "payment_webhook", {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "nexora_webhook_secret_demo";

    if (!signature && webhookSecret !== "nexora_webhook_secret_demo") {
      return NextResponse.json({ error: "Missing webhook signature header" }, { status: 400 });
    }

    // 2. Cryptographic HMAC SHA256 Webhook Verification with timing-safe comparison
    if (webhookSecret !== "nexora_webhook_secret_demo" && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf-8");
      const clientBuf = Buffer.from(signature, "utf-8");

      const isValid =
        expectedBuf.length === clientBuf.length &&
        crypto.timingSafeEqual(expectedBuf, clientBuf);

      if (!isValid) {
        console.error("🚨 Razorpay Webhook signature mismatch!");
        return NextResponse.json({ error: "Invalid cryptographic webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // 3. Handle payment.captured or order.paid events with strict idempotency
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const receipt = payment?.notes?.orderNumber || payment?.description;
      const paymentId = payment?.id;

      console.log(`✅ Webhook verified event: ${event.event} for order ${orderId || receipt} (Payment: ${paymentId})`);

      if (receipt) {
        try {
          const supabase = createServerClient({ admin: true });

          // Fetch current order state to ensure idempotency
          const { data: existingOrder } = await supabase
            .from("orders")
            .select("id, status, payment_status, total_amount")
            .eq("order_number", receipt)
            .maybeSingle();

          if (existingOrder) {
            // Idempotency: Prevent duplicate payment records
            if (paymentId) {
              const { data: existingPayment } = await supabase
                .from("payments")
                .select("id")
                .eq("transaction_id", paymentId)
                .maybeSingle();

              if (!existingPayment) {
                await supabase.from("payments").insert({
                  order_id: existingOrder.id,
                  provider: "razorpay",
                  transaction_id: paymentId,
                  amount: existingOrder.total_amount || (payment?.amount ? payment.amount / 100 : 0),
                  status: "paid",
                  created_at: new Date().toISOString(),
                });
              }
            }

            // State machine guard: Only transition status to 'accepted' if currently 'pending'
            // Never regress 'preparing', 'ready', or 'delivered' states on webhook retries
            const shouldTransitionStatus = existingOrder.status === "pending";
            const updatePayload: Record<string, unknown> = {
              payment_status: "paid",
              notes: `Webhook confirmed paid: ${paymentId || "verified"}`,
              updated_at: new Date().toISOString(),
            };
            if (shouldTransitionStatus) {
              updatePayload.status = "accepted";
            }

            await supabase
              .from("orders")
              .update(updatePayload)
              .eq("order_number", receipt);
          }
        } catch (dbErr) {
          console.warn("Webhook DB update warning:", dbErr);
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
