import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_RESTAURANT_SETTINGS } from "@/app/api/settings/route";

// GET /api/public/settings
// Public restaurant configuration for customers (address, hours, delivery fee, tax)
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
    console.warn("GET /api/public/settings fallback:", error?.message);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_RESTAURANT_SETTINGS,
    });
  }
}
