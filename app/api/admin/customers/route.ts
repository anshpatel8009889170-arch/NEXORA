import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { getCustomersList, extractRawPhone } from "@/lib/customersStore";
import { getRuntimeOrders } from "@/lib/ordersStore";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, ["owner", "admin", "staff"]);
    if (!auth.authorized) {
      return auth.response;
    }

    let customers: any[] = [];
    let orders = getRuntimeOrders();

    // 1. PRIMARY: Query Supabase Cloud PostgreSQL profiles
    try {
      const supabase = createServerClient({ admin: true });
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, role, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (Array.isArray(dbProfiles) && dbProfiles.length > 0) {
        for (const p of dbProfiles) {
          if (!p.full_name || p.full_name === "Guest" || p.full_name === "Royal Guest") continue;
          const raw = extractRawPhone(p.phone || "");
          customers.push({
            id: p.id,
            phone: p.phone || `+91 ${raw}`,
            raw_phone: raw,
            full_name: p.full_name,
            email: p.email || null,
            role: "customer",
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          });
        }
      }

      const { data: dbOrders } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, total, status, created_at");
      if (Array.isArray(dbOrders) && dbOrders.length > 0) {
        orders = dbOrders as any;
      }
    } catch {
      // Remote DB offline fallback
    }

    // 2. Secondary fallback if Supabase had zero profiles
    if (customers.length === 0) {
      customers = [...getCustomersList()];
    }

    // Map order counts and dining tiers dynamically
    const enriched = customers.map((c) => {
      const orderCount = orders.filter(
        (o: any) =>
          (o.customer_phone && c.raw_phone && o.customer_phone.includes(c.raw_phone)) ||
          (o.customer_name && o.customer_name.toLowerCase() === c.full_name.toLowerCase())
      ).length;

      const tier = orderCount >= 10 ? "Royal Patron" : orderCount >= 5 ? "Gold Guest" : "Verified Customer";

      return {
        id: c.id,
        name: c.full_name,
        phone: c.phone,
        email: c.email || null,
        orders: orderCount,
        tier,
        joined_at: c.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      customers: enriched,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load customers";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
