import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/security/adminAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================================================
  // 1. ADMIN ROUTE & API PROTECTION
  // ==========================================================================
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLoginApi = pathname === "/api/admin/login";

  const session = await getAdminSessionFromRequest(request);

  // A. Protect Admin Pages
  if (isAdminPage && !isAdminLoginPage) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // B. If user already has valid admin session and visits /admin/login, redirect to /admin
  if (isAdminLoginPage && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // C. Protect Admin API Routes
  if (isAdminApi && !isAdminLoginApi) {
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Valid administrator authorization required." },
        { status: 401 }
      );
    }
  }

  // ==========================================================================
  // 2. HTTP SECURITY HEADERS
  // ==========================================================================
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
