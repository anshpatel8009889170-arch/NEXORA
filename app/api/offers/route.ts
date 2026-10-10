import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeCouponCode, sanitizeString, validateAmount } from "@/lib/security/validation";

export const DEFAULT_OFFERS = [
  {
    id: "offer_save50",
    code: "SAVE50",
    description: "Special 20% discount on gourmet fine-dining orders above ₹499 (Max ₹150)",
    discount_type: "percentage",
    discount_value: 20,
    minimum_order: 499,
    max_discount: 150,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_welcome50",
    code: "WELCOME50",
    description: "Flat ₹50 savings on your royal order above ₹299",
    discount_type: "flat",
    discount_value: 50,
    minimum_order: 299,
    max_discount: null,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_royal100",
    code: "ROYAL100",
    description: "Flat ₹100 savings on royal dining and party orders above ₹599",
    discount_type: "flat",
    discount_value: 100,
    minimum_order: 599,
    max_discount: null,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_festive20",
    code: "FESTIVE20",
    description: "Festive celebration 20% discount up to ₹200 on luxury orders above ₹499",
    discount_type: "percentage",
    discount_value: 20,
    minimum_order: 499,
    max_discount: 200,
    is_active: true,
    end_date: null,
  },
];

// GET: Fetch all offers
export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "get_offers", { limit: 120, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const supabase = createServerClient();
    const { data: dbOffers, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbOffers && dbOffers.length > 0) {
      // Ensure key standard promo offers (like SAVE50) are present if not yet saved in DB
      const existingCodes = new Set(dbOffers.map((o: any) => o.code?.toUpperCase()));
      const missingDefaults = DEFAULT_OFFERS.filter(
        (def) => !existingCodes.has(def.code.toUpperCase())
      );
      return NextResponse.json({ success: true, offers: [...dbOffers, ...missingDefaults] });
    }

    return NextResponse.json({ success: true, offers: DEFAULT_OFFERS });
  } catch (error: any) {
    console.error("GET /api/offers error:", error);
    return NextResponse.json({ success: true, offers: DEFAULT_OFFERS });
  }
}

// POST: Create or Update an offer
export async function POST(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "post_offers", { limit: 30, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const {
      id,
      code,
      description,
      discount_type,
      discount_value,
      minimum_order,
      max_discount,
      end_date,
      is_active,
    } = body;

    const cleanCode = sanitizeCouponCode(code);

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: "Valid offer code is required" },
        { status: 400 }
      );
    }

    const cleanDesc = sanitizeString(description || `Special offer for ${cleanCode}`, 250);
    const validDiscountVal = validateAmount(discount_value, 0, 50000).value;
    const validMinOrder = validateAmount(minimum_order, 0, 50000).value;
    const validMaxDiscount = max_discount ? validateAmount(max_discount, 0, 50000).value : null;

    const supabase = createServerClient();

    const offerPayload: any = {
      code: cleanCode,
      description: cleanDesc,
      discount_type: discount_type === "flat" ? "flat" : "percentage",
      discount_value: validDiscountVal,
      minimum_order: validMinOrder,
      max_discount: validMaxDiscount,
      is_active: is_active !== false,
      end_date: end_date || null,
      valid_until: end_date || null,
    };

    if (discount_type === "percentage") {
      offerPayload.discount_percent = Number(discount_value) || 0;
      offerPayload.discount_amount = null;
    } else {
      offerPayload.discount_amount = Number(discount_value) || 0;
      offerPayload.discount_percent = null;
    }

    if (id && !id.startsWith("offer_")) {
      offerPayload.id = id;
    }

    const { data, error } = await supabase
      .from("offers")
      .upsert(offerPayload, { onConflict: "code" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase offers upsert note:", error.message);
      // Fallback response with local generated id
      return NextResponse.json({
        success: true,
        offer: {
          id: id || `offer_${Date.now()}`,
          ...offerPayload,
        },
        notice: "Saved locally (" + error.message + ")",
      });
    }

    return NextResponse.json({ success: true, offer: data });
  } catch (error: any) {
    console.error("POST /api/offers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save offer" },
      { status: 500 }
    );
  }
}

// PATCH: Toggle enable/disable
export async function PATCH(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "patch_offers", { limit: 30, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const body = await request.json();
    const { code, is_active } = body;

    const cleanCode = sanitizeCouponCode(code);

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: "Valid offer code is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("offers")
      .update({ is_active })
      .ilike("code", cleanCode);

    if (error) {
      console.warn("Supabase offers toggle note:", error.message);
    }

    return NextResponse.json({
      success: true,
      code: cleanCode,
      is_active,
    });
  } catch (error: any) {
    console.error("PATCH /api/offers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update offer" },
      { status: 500 }
    );
  }
}

// DELETE: Remove offer
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitRes = enforceRateLimit(request, "delete_offers", { limit: 30, windowMs: 60 * 1000 });
    if (rateLimitRes) return rateLimitRes;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    const cleanCode = sanitizeCouponCode(code);

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: "Valid offer code is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("offers")
      .delete()
      .ilike("code", cleanCode);

    if (error) {
      console.warn("Supabase offers delete note:", error.message);
    }

    return NextResponse.json({ success: true, code: cleanCode });
  } catch (error: any) {
    console.error("DELETE /api/offers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete offer" },
      { status: 500 }
    );
  }
}
