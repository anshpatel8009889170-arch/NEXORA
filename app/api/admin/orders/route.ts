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
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(dbOrders)) {
      const formatted = dbOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name || "Royal Guest",
        phone: o.customer_phone || "",
        items: Array.isArray(o.order_items) && o.order_items.length > 0
          ? o.order_items.map((it: any) => `${it.name || "Special Dish"} × ${it.quantity}`)
          : Array.isArray(o.items)
          ? o.items
          : ["Gourmet Selection × 1"],
        total: Number(o.total_amount || o.total || 0),
        status: o.status || "pending",
        paymentMethod: o.payment_method === "cod" ? "Cash on Delivery" : "Online (PhonePe / UPI)",
        paymentStatus: o.payment_status || "pending",
        time: o.created_at
          ? new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        address: o.delivery_address || "Dining Lounge",
        created_at: o.created_at,
        order_number: o.order_number,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        total_amount: o.total_amount,
        delivery_address: o.delivery_address,
      }));

      return NextResponse.json({
        success: true,
        orders: formatted,
      });
    }

    // Secondary fallback only if remote database was unreachable
    const runtime = getRuntimeOrders();
    const formattedRuntime = runtime.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number || o.orderNumber,
      customerName: o.customer_name || o.customerName || "Royal Guest",
      phone: o.customer_phone || o.phone || "",
      items: Array.isArray(o.items) ? o.items : ["Gourmet Selection × 1"],
      total: Number(o.total || o.total_amount || 0),
      status: o.status || "pending",
      paymentMethod: o.payment_method || o.paymentMethod || "Cash on Delivery",
      paymentStatus: o.payment_status || o.paymentStatus || "pending",
      time: o.created_at
        ? new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now",
      address: o.delivery_address || o.address || "Dining Lounge",
      created_at: o.created_at || new Date().toISOString(),
      order_number: o.order_number,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedRuntime,
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
