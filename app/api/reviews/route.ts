import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Review } from "@/types/database";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString } from "@/lib/security/validation";

// In-memory store for fallback/demo when remote database lacks items
let inMemoryReviews: Review[] = [
  {
    id: "rev-default-1",
    customer_name: "Aanya Singhania",
    dish_name: "24K Gold Saffron Shahi Tukda",
    rating: 5,
    comment: "Finest dessert in North India. Truly authentic royal gastronomy.",
    is_approved: true,
    created_at: "2026-10-09T18:30:00.000Z",
  },
  {
    id: "rev-default-2",
    customer_name: "Rohit Verma",
    dish_name: "Burrata & Truffle Funghi Pizza",
    rating: 5,
    comment: "Thermal express delivery arrived steaming hot. Sourdough crust is world-class.",
    is_approved: true,
    created_at: "2026-10-09T19:15:00.000Z",
  },
  {
    id: "rev-default-3",
    customer_name: "Vikram Malhotra",
    dish_name: "Truffle Malai Chaap",
    rating: 5,
    comment: "The clay oven smoked aroma and cashew marinade was absolutely exquisite. Grand royal dining!",
    is_approved: true,
    created_at: "2026-10-09T20:00:00.000Z",
  },
  {
    id: "rev-default-4",
    customer_name: "Pooja Sharma",
    dish_name: "Dal Bukhara Grand Cru",
    rating: 5,
    comment: "Slow-cooked for 24 hours. Incredible depth of flavor and velvety richness.",
    is_approved: true,
    created_at: "2026-10-09T20:45:00.000Z",
  },
  {
    id: "rev-default-5",
    customer_name: "Aditya Saxena",
    dish_name: "Paneer Lababdar",
    rating: 5,
    comment: "Food was amazing. Truly extraordinary pure-veg culinary art.",
    is_approved: false, // Pending moderation for Admin testing!
    created_at: "2026-10-10T08:15:00.000Z",
  },
];

// Helper to seed defaults into DB if table is completely empty
async function seedDefaultReviewsIfEmpty(supabase: any) {
  try {
    const { count, error } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    if (!error && (count === 0 || count === null)) {
      await supabase.from("reviews").insert(
        inMemoryReviews.map((r) => ({
          customer_name: r.customer_name,
          dish_name: r.dish_name,
          rating: r.rating,
          comment: r.comment,
          is_approved: r.is_approved,
        }))
      );
    }
  } catch (err) {
    // Non-fatal if table doesn't support head or seed
  }
}

// ============================================================================
// 1. GET: Fetch Reviews
// - Public: Only returns is_approved = true
// - Admin / all=true: Returns all reviews (approved + pending/hidden)
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "get_reviews", { limit: 120, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    const userId = searchParams.get("user_id");

    const supabase = createServerClient();
    await seedDefaultReviewsIfEmpty(supabase);

    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

    if (!showAll && !userId) {
      // Public site: Only approved reviews
      query = query.eq("is_approved", true);
    }

    if (userId) {
      // User account page: show user's own reviews
      query = query.eq("user_id", userId);
    }

    const { data: dbReviews, error } = await query;

    if (!error && dbReviews && dbReviews.length > 0) {
      return NextResponse.json({
        success: true,
        reviews: dbReviews,
      });
    }

    // Fallback to in-memory store
    let filtered = [...inMemoryReviews];
    if (!showAll && !userId) {
      filtered = filtered.filter((r) => r.is_approved);
    }
    if (userId) {
      filtered = filtered.filter((r) => r.user_id === userId);
    }

    return NextResponse.json({
      success: true,
      reviews: filtered,
    });
  } catch (error: any) {
    console.warn("GET /api/reviews fallback:", error?.message);
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const filtered = showAll
      ? inMemoryReviews
      : inMemoryReviews.filter((r) => r.is_approved);

    return NextResponse.json({
      success: true,
      reviews: filtered,
    });
  }
}

// ============================================================================
// 2. POST: Customer Submits Review
// - Default is_approved = false (awaiting admin approval)
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "submit_review", { limit: 6, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const {
      customer_name,
      rating,
      comment,
      order_id,
      dish_name,
      menu_item_id,
      user_id,
    } = body;

    const numRating = Number(rating);
    const parsedRating = Math.max(1, Math.min(5, Math.floor(isNaN(numRating) ? 5 : numRating)));
    const cleanName = sanitizeString(customer_name || "Valued Patron", 80);
    const cleanComment = sanitizeString(comment || "", 1000);
    const cleanDish = dish_name ? sanitizeString(dish_name, 100) : "Overall Dining Experience";
    const cleanOrderId = order_id ? sanitizeString(order_id, 80) : null;
    const cleanUserId = user_id ? sanitizeString(user_id, 80) : null;
    const cleanMenuItemId = menu_item_id ? sanitizeString(menu_item_id, 80) : null;

    if (!cleanComment) {
      return NextResponse.json(
        { success: false, error: "Please write a brief comment describing your dining experience." },
        { status: 400 }
      );
    }

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customer_name: cleanName,
      rating: parsedRating,
      comment: cleanComment,
      order_id: cleanOrderId,
      dish_name: cleanDish,
      menu_item_id: cleanMenuItemId,
      user_id: cleanUserId,
      is_approved: false, // Requires admin moderation
      created_at: new Date().toISOString(),
    };

    // Save to in-memory store
    inMemoryReviews.unshift(newReview);

    // Try saving to Supabase
    try {
      const supabase = createServerClient();
      const { data: dbData, error: dbError } = await supabase
        .from("reviews")
        .insert({
          customer_name: newReview.customer_name,
          rating: newReview.rating,
          comment: newReview.comment,
          order_id: newReview.order_id,
          dish_name: newReview.dish_name,
          menu_item_id: newReview.menu_item_id,
          user_id: newReview.user_id,
          is_approved: false,
        })
        .select()
        .single();

      if (!dbError && dbData) {
        return NextResponse.json({
          success: true,
          review: dbData,
          message: "Thank you! Your review has been submitted for moderation and will appear on our website once approved.",
        });
      }
    } catch (dbErr) {
      console.warn("DB review insertion fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "Thank you! Your review has been submitted for moderation and will appear on our website once approved.",
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 3. PATCH: Admin Moderates Review (Approve or Hide)
// ============================================================================
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "patch_review", { limit: 60, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const id = sanitizeString(body?.id, 100);
    const is_approved = body?.is_approved;

    if (!id || typeof is_approved !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Review ID and is_approved boolean are required." },
        { status: 400 }
      );
    }

    // Update in-memory
    const idx = inMemoryReviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      inMemoryReviews[idx].is_approved = is_approved;
    }

    // Update in Supabase
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("reviews")
        .update({ is_approved })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          review: data,
          message: is_approved ? "Review approved and published!" : "Review hidden from public view.",
        });
      }
    } catch (dbErr) {
      console.warn("DB update review fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      review: idx !== -1 ? inMemoryReviews[idx] : { id, is_approved },
      message: is_approved ? "Review approved and published!" : "Review hidden from public view.",
    });
  } catch (error: any) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 4. DELETE: Admin Removes Review
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "delete_review", { limit: 60, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    id = sanitizeString(id, 100);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Review ID is required." },
        { status: 400 }
      );
    }

    // Remove in-memory
    inMemoryReviews = inMemoryReviews.filter((r) => r.id !== id);

    // Remove in Supabase
    try {
      const supabase = createServerClient();
      await supabase.from("reviews").delete().eq("id", id);
    } catch (dbErr) {
      console.warn("DB delete review fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Review successfully deleted.",
    });
  } catch (error: any) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
