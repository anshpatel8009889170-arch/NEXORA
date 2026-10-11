import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { GET as getSettingsHandler, POST as postSettingsHandler } from "@/app/api/settings/route";

// GET /api/admin/settings
// Admin view of restaurant configurations
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin", "staff"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return getSettingsHandler();
}

// POST /api/admin/settings
// Save or update restaurant financial/operational settings (Owner & Admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return postSettingsHandler(request);
}
