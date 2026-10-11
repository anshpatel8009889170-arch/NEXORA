import { NextResponse } from "next/server";
import { validateSupabaseConfig } from "@/lib/supabase/server";


/**
 * GET /api/health
 * Comprehensive health check endpoint for system monitoring, container readiness,
 * and test runner pre-flight verification.
 */
export async function GET() {
  const startTime = Date.now();

  // 1. Supabase configuration check
  const supabaseConfig = validateSupabaseConfig();

  // 2. Razorpay configuration check
  const hasRazorpayKey = Boolean(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const hasRazorpaySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);

  // 3. Admin Authentication check
  const hasAdminEmail = Boolean(process.env.ADMIN_EMAIL);
  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
  const hasAdminSecret = Boolean(process.env.ADMIN_SESSION_SECRET);

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs,
      environment: process.env.NODE_ENV || "development",
      services: {
        supabase: {
          configured: supabaseConfig.hasUrl && supabaseConfig.hasAnonKey,
          hasServiceRoleKey: supabaseConfig.hasServiceRoleKey,
          status: supabaseConfig.hasUrl ? "operational" : "unconfigured",
        },
        razorpay: {
          configured: hasRazorpayKey,
          hasSecret: hasRazorpaySecret,
          mode: (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live") ? "live" : "test",
        },
        adminAuth: {
          configured: hasAdminEmail && hasAdminPassword,
          hasSessionSecret: hasAdminSecret,
        },
      },
      endpoints: {
        home: "/",
        menu: "/menu",
        checkout: "/checkout",
        adminLogin: "/admin/login",
        publicMenu: "/api/public/menu",
        publicOffers: "/api/public/offers",
        publicSettings: "/api/public/settings",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
