import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { GET as getReviewsHandler, PATCH as patchReviewsHandler, DELETE as deleteReviewsHandler } from "@/app/api/reviews/route";

// GET /api/admin/reviews
// Retrieves all customer reviews, including unmoderated pending reviews
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  // Construct request with ?all=true
  const url = new URL(request.url);
  url.searchParams.set("all", "true");
  const adminReq = new NextRequest(url, request);
  return getReviewsHandler(adminReq);
}

// PATCH /api/admin/reviews
// Moderates review (approve or hide)
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return patchReviewsHandler(request);
}

// DELETE /api/admin/reviews
// Permanently removes review from catalog
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return deleteReviewsHandler(request);
}
