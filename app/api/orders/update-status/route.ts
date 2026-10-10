import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { OrderStatus } from "@/types/database";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(req, "update_order_status", { limit: 60, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const { orderNumber, status } = body;

    const cleanOrderNumber = sanitizeString(orderNumber, 64);

    if (!cleanOrderNumber || !status) {
      return NextResponse.json(
        { error: "Order number and valid status are required" },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "delivered",
      "out_for_delivery",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    // Update status in Supabase database using server client
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", cleanOrderNumber)
      .select()
      .single();

    if (error) {
      console.warn("Supabase order update note:", error.message);
    }

    return NextResponse.json({
      success: true,
      orderNumber: cleanOrderNumber,
      status,
      order: data || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
