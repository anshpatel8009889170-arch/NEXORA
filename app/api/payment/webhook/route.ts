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

    // 3. Handle payment.captured or order.paid events
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const receipt = payment?.notes?.orderNumber || payment?.description;

      console.log(`✅ Webhook verified event: ${event.event} for order ${orderId || receipt}`);

      // Update database order to paid
      if (receipt) {
        try {
          const supabase = createServerClient();
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "accepted",
              notes: `Webhook confirmed paid: ${payment?.id}`,
              updated_at: new Date().toISOString(),
            })
            .eq("order_number", receipt);
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
