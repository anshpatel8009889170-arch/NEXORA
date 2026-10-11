import { NextRequest, NextResponse } from "next/server";
import { checkPhonePeStatus } from "@/lib/phonepe";
import { createServerClient } from "@/lib/supabase/server";
import { updateRuntimeOrderStatus } from "@/lib/ordersStore";
import { sanitizeString } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, transactionId } = body;

    const safeOrderNumber = sanitizeString(orderNumber, 60);
    const safeTxnId = sanitizeString(transactionId, 100);

    if (!safeOrderNumber && !safeTxnId) {
      return NextResponse.json(
        { success: false, error: "Missing orderNumber or transactionId." },
        { status: 400 }
      );
    }

    const txnToQuery = safeTxnId || `MT_${safeOrderNumber}_check`;
    const statusResult = await checkPhonePeStatus(txnToQuery);

    if (!statusResult.success) {
      return NextResponse.json({
        success: false,
        verified: false,
        code: statusResult.code,
        message: statusResult.message,
      });
    }

    // Payment is verified! Update Supabase database idempotently
    try {
      const supabase = createServerClient({ admin: true });
      const nowIso = new Date().toISOString();

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, status, payment_status, total_amount")
        .eq("order_number", safeOrderNumber)
        .maybeSingle();

      if (existingOrder) {
        // Idempotency: Prevent duplicate payment records
        const actualTxnId = statusResult.transactionId || safeTxnId;
        if (actualTxnId) {
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("transaction_id", actualTxnId)
            .maybeSingle();

          if (!existingPayment) {
            await supabase.from("payments").insert({
              order_id: existingOrder.id,
              provider: "phonepe",
              transaction_id: actualTxnId,
              amount: existingOrder.total_amount || statusResult.amount || 0,
              status: "paid",
              created_at: nowIso,
            });
          }
        }

        // State Machine Guard: only transition to 'accepted' if currently 'pending'
        const shouldTransitionStatus = existingOrder.status === "pending";
        const updatePayload: Record<string, unknown> = {
          payment_status: "paid",
          notes: `PhonePe Verified: ${actualTxnId}`,
          updated_at: nowIso,
        };
        if (shouldTransitionStatus) {
          updatePayload.status = "accepted";
        }

        await supabase
          .from("orders")
          .update(updatePayload)
          .eq("order_number", safeOrderNumber);

        if (shouldTransitionStatus) {
          updateRuntimeOrderStatus(
            safeOrderNumber,
            "accepted",
            "system@nexora.luxury",
            "system"
          );
        }
      }
    } catch (dbErr) {
      console.warn("PhonePe status DB update warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      code: statusResult.code || "PAYMENT_SUCCESS",
      orderNumber: safeOrderNumber,
      transactionId: statusResult.transactionId,
      message: "PhonePe payment successfully authenticated and confirmed.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "PhonePe status verification error";
    console.error("PhonePe status check error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber") || "";
  const transactionId = searchParams.get("transactionId") || "";

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({ orderNumber, transactionId }),
    })
  );
}
