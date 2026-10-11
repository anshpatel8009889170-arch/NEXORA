import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { GET as getAnalyticsHandler } from "@/app/api/analytics/route";

// GET /api/admin/analytics
// Canonical admin analytics KPI & reporting endpoint
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return getAnalyticsHandler(request);
}
