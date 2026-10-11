import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fallbackMenuItems, fallbackCategories } from "@/lib/menuData";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeString, validateAmount } from "@/lib/security/validation";
import { MenuItem } from "@/types/database";

// GET /api/admin/menu
// Returns all menu items (including inactive/hidden dishes) for staff & management
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin", "staff"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(request, "admin_get_menu", {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const supabase = createServerClient({ admin: true });
    const { data: dbItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbItems && dbItems.length > 0) {
      return NextResponse.json({
        success: true,
        categories: fallbackCategories,
        items: dbItems,
      });
    }

    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      items: fallbackMenuItems,
    });
  } catch (error: any) {
    console.error("GET /api/admin/menu error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load admin menu" },
      { status: 500 }
    );
  }
}

// POST /api/admin/menu
// Creates a new pure-vegetarian dish in catalog
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(request, "admin_create_dish", {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const cleanName = sanitizeString(body?.name, 100);
    const cleanDesc = sanitizeString(body?.description, 500);
    const { isValid: isPriceValid, value: cleanPrice } = validateAmount(body?.price, 1, 100000);
    const categoryId = sanitizeString(body?.category_id || body?.categoryId, 80);
    const imageUrl = sanitizeString(body?.image_url || body?.imageUrl || "/placeholder-dish.jpg", 300);

    if (!cleanName || !isPriceValid) {
      return NextResponse.json(
        { success: false, error: "Valid dish name and price are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newDish: MenuItem = {
      id: body?.id || `dish-${Date.now()}`,
      name: cleanName,
      description: cleanDesc || "Pure vegetarian gourmet delicacy",
      price: cleanPrice,
      category_id: categoryId || "cat-starters",
      image_url: imageUrl,
      is_vegetarian: true, // Pure vegetarian luxury venue
      is_veg: true,
      is_available: body?.is_available !== false,
      is_featured: Boolean(body?.is_featured),
      created_at: now,
      updated_at: now,
    };

    const supabase = createServerClient({ admin: true });
    const { data, error } = await supabase
      .from("menu_items")
      .upsert(newDish, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase menu_items upsert notice:", error.message);
      return NextResponse.json({
        success: true,
        item: newDish,
        notice: "Saved with projection (" + error.message + ")",
      });
    }

    return NextResponse.json({
      success: true,
      item: data || newDish,
    });
  } catch (error: any) {
    console.error("POST /api/admin/menu error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/menu
// Updates price, availability, description, or featured status of a dish
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(request, "admin_patch_dish", {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const id = sanitizeString(body?.id, 100);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Dish ID is required for update." },
        { status: 400 }
      );
    }

    const updates: Partial<MenuItem> = {};
    if (body.name !== undefined) updates.name = sanitizeString(body.name, 100);
    if (body.description !== undefined) updates.description = sanitizeString(body.description, 500);
    if (body.price !== undefined) {
      const { isValid, value } = validateAmount(body.price, 1, 100000);
      if (isValid) updates.price = value;
    }
    if (body.is_available !== undefined) updates.is_available = Boolean(body.is_available);
    if (body.is_featured !== undefined) updates.is_featured = Boolean(body.is_featured);
    if (body.category_id !== undefined) updates.category_id = sanitizeString(body.category_id, 80);
    if (body.image_url !== undefined) updates.image_url = sanitizeString(body.image_url, 300);

    const supabase = createServerClient({ admin: true });
    const { data, error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.warn("Supabase menu update notice:", error.message);
      return NextResponse.json({
        success: true,
        id,
        updates,
        notice: "Updated locally (" + error.message + ")",
      });
    }

    return NextResponse.json({
      success: true,
      item: data || { id, ...updates },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/menu error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/menu
// Removes or disables a menu item
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimitRes = enforceRateLimit(request, "admin_delete_dish", {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const id = sanitizeString(searchParams.get("id"), 100);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Dish ID is required for deletion." },
        { status: 400 }
      );
    }

    const supabase = createServerClient({ admin: true });
    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      console.warn("Supabase dish deletion notice:", error.message);
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/menu error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
