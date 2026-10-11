import { NextRequest } from "next/server";
import { POST as ordersPostHandler } from "@/app/api/admin/orders/route";

// POST /api/admin/orders/update-status
// Canonical admin order status update endpoint
export async function POST(req: NextRequest) {
  return ordersPostHandler(req);
}
