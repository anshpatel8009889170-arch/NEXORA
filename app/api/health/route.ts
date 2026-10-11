import { NextResponse } from "next/server";
import { validateSupabaseConfig } from "@/lib/supabase/server";
import { getPhonePeConfig } from "@/lib/phonepe";


/**
 * GET /api/health
 * Comprehensive health check endpoint for system monitoring, container readiness,
 * and test runner pre-flight verification.
 */
export async function GET() {
  const startTime = Date.now();

  // 1. Supabase configuration check
  const supabaseConfig = validateSupabaseConfig();

  // 2. PhonePe Payment Gateway configuration check
  const phonepeConfig = getPhonePeConfig();

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
        phonepe: {
          configured: Boolean(phonepeConfig.merchantId && phonepeConfig.saltKey),
          environment: phonepeConfig.environment,
          merchantId: phonepeConfig.merchantId,
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
