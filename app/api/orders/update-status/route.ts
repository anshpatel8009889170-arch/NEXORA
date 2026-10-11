import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { OrderStatus } from "@/types/database";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString } from "@/lib/security/validation";
import { requireAdmin } from "@/lib/security/requireAdmin";
import {
  findRuntimeOrder,
  updateRuntimeOrderStatus,
  validateStatusTransition,
} from "@/lib/ordersStore";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Server-Side Administrator / Staff Authentication
    const auth = await requireAdmin(req, ["owner", "admin", "staff"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(req, "update_order_status", {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const { orderNumber, status, overridePolicy } = body;

    const cleanOrderNumber = sanitizeString(orderNumber, 64);

    if (!cleanOrderNumber || !status) {
      return NextResponse.json(
        { success: false, error: "Order number and valid target status are required." },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: '${status}'. Supported statuses: ${validStatuses.join(", ")}.` },
        { status: 400 }
      );
    }

    // 2. Fetch the exact order by orderNumber
    const supabase = createServerClient();
    let dbOrder: any = null;
    let dbFetchError: any = null;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", cleanOrderNumber)
        .maybeSingle();

      if (!error && data) {
        dbOrder = data;
      } else if (error) {
        dbFetchError = error;
      }
    } catch (err: any) {
      dbFetchError = err;
    }

    // Also look up in resilient runtime store
    const runtimeOrder = findRuntimeOrder(cleanOrderNumber);

    if (!dbOrder && !runtimeOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Order #${cleanOrderNumber} not found. Please verify the order number.`,
        },
        { status: 404 }
      );
    }

    const currentStatus: OrderStatus = (dbOrder?.status || runtimeOrder?.status) as OrderStatus;

    // 3, 4, 6. Validate State Machine Transitions & Terminal State Guards
    const transitionCheck = validateStatusTransition(
      currentStatus,
      status,
      auth.user.role,
      Boolean(overridePolicy)
    );

    if (!transitionCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: transitionCheck.error,
          currentStatus,
          targetStatus: status,
        },
        { status: transitionCheck.statusCode || 400 }
      );
    }

    // Idempotent transition: already in requested state
    if (transitionCheck.isNoOp) {
      return NextResponse.json({
        success: true,
        orderNumber: cleanOrderNumber,
        status: currentStatus,
        previousStatus: currentStatus,
        order: dbOrder || runtimeOrder,
        message: `Order #${cleanOrderNumber} is already in state '${currentStatus}'.`,
        updatedAt: dbOrder?.updated_at || runtimeOrder?.updated_at || new Date().toISOString(),
      });
    }

    const nowIso = new Date().toISOString();

    // 5. Update in Database with strict error handling (do not pretend success on failure)
    let updatedRecord: any = null;

    if (dbOrder) {
      const { data: updatedDb, error: updateError } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: nowIso,
        })
        .eq("order_number", cleanOrderNumber)
        .select()
        .single();

      if (updateError) {
        console.error("Supabase order update failure:", updateError.message);
        return NextResponse.json(
          {
            success: false,
            error: `Database update failed: ${updateError.message}`,
          },
          { status: 500 }
        );
      }
      updatedRecord = updatedDb;
    }

    // Update in runtime store with full audit history
    const updatedRuntime = updateRuntimeOrderStatus(
      cleanOrderNumber,
      status,
      auth.user.email,
      auth.user.role
    );

    return NextResponse.json({
      success: true,
      orderNumber: cleanOrderNumber,
      previousStatus: currentStatus,
      status,
      order: updatedRecord || updatedRuntime,
      updatedAt: nowIso,
      updatedBy: {
        email: auth.user.email,
        role: auth.user.role,
      },
    });
  } catch (err: any) {
    console.error("POST /api/orders/update-status error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
