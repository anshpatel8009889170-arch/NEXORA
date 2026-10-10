import { NextResponse } from "next/server";
import { clearAdminCookieOnResponse } from "@/lib/security/adminAuth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Administrator session cleared successfully.",
  });

  clearAdminCookieOnResponse(response);
  return response;
}
