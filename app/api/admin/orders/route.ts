import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { OrderStatus } from "@/types/database";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString } from "@/lib/security/validation";
import { requireAdmin } from "@/lib/security/requireAdmin";

// GET /api/admin/orders
// Returns all restaurant orders for administration management
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin", "staff"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(request, "admin_get_orders", {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const supabase = createServerClient();
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase orders query notice:", error.message);
      return NextResponse.json({
        success: true,
        orders: [],
        notice: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      orders: dbOrders || [],
    });
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders
// Mutates order status (accept, reject, prepare, deliver, cancel)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, ["owner", "admin", "staff"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(req, "admin_update_order", {
      limit: 60,
      windowMs: 60 * 1000,
    });
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
