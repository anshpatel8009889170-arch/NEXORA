import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { getRuntimeOrders } from "@/lib/ordersStore";
import { POST as updateOrderStatusHandler } from "@/app/api/orders/update-status/route";

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

    const supabase = createServerClient({ admin: true });
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbOrders && dbOrders.length > 0) {
      return NextResponse.json({
        success: true,
        orders: dbOrders,
      });
    }

    // Fallback to active runtime orders
    const runtime = getRuntimeOrders();
    return NextResponse.json({
      success: true,
      orders: runtime,
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
// Mutates order status with strict FSM validation and terminal state guard
export async function POST(req: NextRequest) {
  return updateOrderStatusHandler(req);
}
