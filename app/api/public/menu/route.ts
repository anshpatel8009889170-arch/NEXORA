import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fallbackMenuItems, fallbackCategories } from "@/lib/menuData";
import { enforceRateLimit } from "@/lib/security/rateLimiter";

// GET /api/public/menu
// Public catalog endpoint: Only returns available pure-vegetarian dishes
export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "public_menu", {
      limit: 180,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const supabase = createServerClient();
    const { data: dbItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (!error && dbItems && dbItems.length > 0) {
      return NextResponse.json({
        success: true,
        categories: fallbackCategories,
        items: dbItems,
      });
    }

    // Fallback to active pure-veg items from catalog
    const activeFallback = fallbackMenuItems.filter((item) => item.is_available !== false);
    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      items: activeFallback,
    });
  } catch (error: any) {
    console.warn("GET /api/public/menu fallback:", error?.message);
    const activeFallback = fallbackMenuItems.filter((item) => item.is_available !== false);
    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      items: activeFallback,
    });
  }
}
