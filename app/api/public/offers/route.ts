import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { POST as verifyCouponHandler } from "@/app/api/offers/verify/route";
import { DEFAULT_OFFERS } from "@/app/api/offers/route";

// GET /api/public/offers
// Returns ONLY active offers for customers and visitors
export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "public_get_offers", {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const isDemo = request.nextUrl.searchParams.get("demo") === "true";
    if (isDemo && process.env.NODE_ENV !== "production") {
      const activeDefaults = DEFAULT_OFFERS.filter((o) => o.is_active !== false);
      return NextResponse.json({ success: true, offers: activeDefaults, isDemo: true });
    }

    const supabase = createServerClient();
    const { data: dbOffers, error } = await supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(dbOffers)) {
      return NextResponse.json({ success: true, offers: dbOffers });
    }

    return NextResponse.json({ success: true, offers: [] });
  } catch (error: any) {
    console.warn("GET /api/public/offers fallback:", error?.message);
    return NextResponse.json({ success: true, offers: [] });
  }
}

// POST /api/public/offers
// Verifies coupon eligibility for checkout subtotal
export async function POST(request: NextRequest) {
  return verifyCouponHandler(request);
}
