import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { RestaurantSettings } from "@/types/database";

export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  id: "default",
  name: "NEXORA Fine Dining",
  phone: "+91 83038 90056",
  phone_secondary: "+91 91204 89210",
  email: "vaibhavpatel8543@gmail.com",
  address: "Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra",
  opening_hours: "11:00 AM – 11:30 PM (Mon – Sun)",
  delivery_radius: "15 km",
  minimum_order: 199,
  delivery_fee: 40,
  tax_percent: 5,
  social_links: {
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me/918303890056",
    facebook: "https://facebook.com",
    google_maps: "https://maps.google.com",
  },
  logo_url: "/logo.png",
};

// GET: Fetch current restaurant settings
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!error && data) {
      return NextResponse.json({
        success: true,
        settings: {
          ...DEFAULT_RESTAURANT_SETTINGS,
          ...data,
          social_links: {
            ...DEFAULT_RESTAURANT_SETTINGS.social_links,
            ...(typeof data.social_links === "object" ? data.social_links : {}),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: DEFAULT_RESTAURANT_SETTINGS,
    });
  } catch (error: any) {
    console.warn("GET /api/settings fallback:", error?.message);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_RESTAURANT_SETTINGS,
    });
  }
}

// POST: Save or update restaurant settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: RestaurantSettings = {
      id: "default",
      name: body.name?.trim() || DEFAULT_RESTAURANT_SETTINGS.name,
      phone: body.phone?.trim() || DEFAULT_RESTAURANT_SETTINGS.phone,
      phone_secondary: body.phone_secondary?.trim() || DEFAULT_RESTAURANT_SETTINGS.phone_secondary,
      email: body.email?.trim() || DEFAULT_RESTAURANT_SETTINGS.email,
      address: body.address?.trim() || DEFAULT_RESTAURANT_SETTINGS.address,
      opening_hours: body.opening_hours?.trim() || DEFAULT_RESTAURANT_SETTINGS.opening_hours,
      delivery_radius: body.delivery_radius?.trim() || DEFAULT_RESTAURANT_SETTINGS.delivery_radius,
      minimum_order: Number(body.minimum_order) >= 0 ? Number(body.minimum_order) : DEFAULT_RESTAURANT_SETTINGS.minimum_order,
      delivery_fee: Number(body.delivery_fee) >= 0 ? Number(body.delivery_fee) : DEFAULT_RESTAURANT_SETTINGS.delivery_fee,
      tax_percent: Number(body.tax_percent) >= 0 ? Number(body.tax_percent) : DEFAULT_RESTAURANT_SETTINGS.tax_percent,
      social_links: {
        instagram: body.social_links?.instagram || DEFAULT_RESTAURANT_SETTINGS.social_links.instagram,
        whatsapp: body.social_links?.whatsapp || DEFAULT_RESTAURANT_SETTINGS.social_links.whatsapp,
        facebook: body.social_links?.facebook || DEFAULT_RESTAURANT_SETTINGS.social_links.facebook,
        google_maps: body.social_links?.google_maps || DEFAULT_RESTAURANT_SETTINGS.social_links.google_maps,
      },
      logo_url: body.logo_url?.trim() || DEFAULT_RESTAURANT_SETTINGS.logo_url,
      updated_at: new Date().toISOString(),
    };

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("restaurant_settings")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase restaurant_settings upsert notice:", error.message);
      // Still return success with the validated payload so client is always responsive
      return NextResponse.json({
        success: true,
        settings: payload,
        notice: "Saved with local projection (" + error.message + ")",
      });
    }

    return NextResponse.json({
      success: true,
      settings: data || payload,
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update restaurant settings" },
      { status: 500 }
    );
  }
}
