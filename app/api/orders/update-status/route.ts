import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { OrderStatus } from "@/types/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, status } = body;

    if (!orderNumber || !status) {
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

    // Update status in Supabase database
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderNumber)
      .select()
      .single();

    if (error) {
      console.warn("Supabase order update note:", error.message);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
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
