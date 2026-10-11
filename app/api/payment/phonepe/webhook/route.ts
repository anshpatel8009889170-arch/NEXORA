import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { verifyPhonePeWebhook } from "@/lib/phonepe";
import { createServerClient } from "@/lib/supabase/server";
import { updateRuntimeOrderStatus } from "@/lib/ordersStore";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting on Webhook Endpoint
    const rateLimitResponse = enforceRateLimit(req, "phonepe_webhook", {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const rawBody = await req.json();
    const base64Response = rawBody?.response;
    const xVerifyHeader = req.headers.get("x-verify");

    if (!base64Response) {
      return NextResponse.json({ error: "Missing webhook response payload" }, { status: 400 });
    }

    // 2. Cryptographic Checksum Verification (in non-local environment)
    const isLocalOrTest = process.env.NODE_ENV !== "production" || process.env.PHONEPE_ENV === "UAT";
    if (!isLocalOrTest && xVerifyHeader) {
      const isValidSignature = verifyPhonePeWebhook(base64Response, xVerifyHeader);
      if (!isValidSignature) {
        console.error("🚨 PhonePe Webhook Signature Verification Failed!");
        return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
      }
    }

    // 3. Decode Base64 Payload
    const decodedString = Buffer.from(base64Response, "base64").toString("utf-8");
    const event = JSON.parse(decodedString);

    const isSuccess = event.code === "PAYMENT_SUCCESS" || event.success === true;
    const merchantTransactionId = event.data?.merchantTransactionId || "";
    const transactionId = event.data?.transactionId || merchantTransactionId;
    const amountInPaise = event.data?.amount || 0;
    const amountInRupees = amountInPaise / 100;

    console.log(`✅ PhonePe Webhook Event: ${event.code} for Txn: ${merchantTransactionId}`);

    if (isSuccess && merchantTransactionId) {
      try {
        const supabase = createServerClient({ admin: true });
        const nowIso = new Date().toISOString();

        // Extract order number from merchantTransactionId (e.g. MT_ORD1048_timestamp)
        const orderNumMatch = merchantTransactionId.match(/ORD-?\d+/i);
        const orderNumberPattern = orderNumMatch ? orderNumMatch[0].toUpperCase() : null;

        let existingOrder = null;
        if (orderNumberPattern) {
          const { data } = await supabase
            .from("orders")
            .select("id, status, payment_status, total_amount, order_number")
            .ilike("order_number", `%${orderNumberPattern}%`)
            .maybeSingle();
          existingOrder = data;
        }

        if (existingOrder) {
          // Idempotency: Prevent duplicate payment records
          if (transactionId) {
            const { data: existingPayment } = await supabase
              .from("payments")
              .select("id")
              .eq("transaction_id", transactionId)
              .maybeSingle();

            if (!existingPayment) {
              await supabase.from("payments").insert({
                order_id: existingOrder.id,
                provider: "phonepe",
                transaction_id: transactionId,
                amount: existingOrder.total_amount || amountInRupees,
                status: "paid",
                created_at: nowIso,
              });
            }
          }

          // State Machine Guard: Only transition status to 'accepted' if currently 'pending'
          const shouldTransitionStatus = existingOrder.status === "pending";
          const updatePayload: Record<string, unknown> = {
            payment_status: "paid",
            notes: `PhonePe S2S Webhook Confirmed: ${transactionId}`,
            updated_at: nowIso,
          };
          if (shouldTransitionStatus) {
            updatePayload.status = "accepted";
          }

          await supabase
            .from("orders")
            .update(updatePayload)
            .eq("id", existingOrder.id);

          if (shouldTransitionStatus) {
            updateRuntimeOrderStatus(
              existingOrder.order_number,
              "accepted",
              "phonepe-webhook@nexora.luxury",
              "system"
            );
          }
        }
      } catch (dbErr) {
        console.warn("PhonePe Webhook DB update notice:", dbErr);
      }
    }

    return NextResponse.json({ status: "SUCCESS", received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "PhonePe webhook handler failure";
    console.error("PhonePe webhook error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
