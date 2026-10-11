import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import {
  GET as getOffersHandler,
  POST as postOffersHandler,
  PATCH as patchOffersHandler,
  DELETE as deleteOffersHandler,
} from "@/app/api/offers/route";

// GET /api/admin/offers
// Returns all promotional offers for admin review
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return getOffersHandler(request);
}

// POST /api/admin/offers
// Creates or updates an offer promo code
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return postOffersHandler(request);
}

// PATCH /api/admin/offers
// Toggles offer active status
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return patchOffersHandler(request);
}

// DELETE /api/admin/offers
// Removes an offer promo code
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }
  return deleteOffersHandler(request);
}
