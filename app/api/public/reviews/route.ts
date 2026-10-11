import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { POST as submitReviewHandler, DEMO_BENCHMARK_REVIEWS } from "@/app/api/reviews/route";

// GET /api/public/reviews
// Returns ONLY authentic approved reviews for public display
export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "public_reviews_get", {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const isDemo = request.nextUrl.searchParams.get("demo") === "true";
    if (isDemo && process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        success: true,
        reviews: DEMO_BENCHMARK_REVIEWS.filter((r) => r.is_approved),
        isDemo: true,
      });
    }

    const supabase = createServerClient();
    const { data: dbReviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(dbReviews)) {
      return NextResponse.json({
        success: true,
        reviews: dbReviews,
      });
    }

    return NextResponse.json({
      success: true,
      reviews: [],
    });
  } catch (error: any) {
    console.warn("GET /api/public/reviews fallback:", error?.message);
    return NextResponse.json({
      success: true,
      reviews: [],
    });
  }
}

// POST /api/public/reviews
// Customer submits review for concierge moderation
export async function POST(request: NextRequest) {
  return submitReviewHandler(request);
}
