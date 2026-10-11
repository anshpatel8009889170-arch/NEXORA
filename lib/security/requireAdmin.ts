import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  AdminRole,
  AdminSession,
  verifyCsrfOrigin,
} from "@/lib/security/adminAuth";

export interface RequireAdminSuccess {
  authorized: true;
  user: AdminSession;
  response: null;
}

export interface RequireAdminFailure {
  authorized: false;
  user: AdminSession | null;
  response: NextResponse;
}

export type RequireAdminResult = RequireAdminSuccess | RequireAdminFailure;

/**
 * Shared Server-Side Admin Authorization Guard.
 * 
 * Verifies that the incoming HTTP request contains a cryptographically signed,
 * unexpired session token with an authorized administrator/staff role.
 * 
 * @param req NextRequest or standard Request object
 * @param allowedRoles Allowed roles: 'owner' | 'admin' | 'staff' (defaults to ['owner', 'admin', 'staff'])
 * @returns {Promise<RequireAdminResult>}
 * - If unauthorized (no token / invalid signature): Returns { authorized: false, response: 401 }
 * - If forbidden (role not allowed / CSRF mismatch): Returns { authorized: false, response: 403 }
 * - If authorized: Returns { authorized: true, user: session, response: null }
 */
export async function requireAdmin(
  req: NextRequest | Request,
  allowedRoles: AdminRole[] = ["owner", "admin", "staff"]
): Promise<RequireAdminResult> {
  // 1. CSRF Origin Verification on state-changing operations (POST, PUT, PATCH, DELETE)
  if (!verifyCsrfOrigin(req)) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Cross-Site Request Forgery (CSRF) blocked: Request origin does not match target host.",
        },
        { status: 403 }
      ),
    };
  }

  const session = await getAdminSessionFromRequest(req);

  // 1. Missing or invalid cryptographic session token
  if (!session) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Access Denied: Valid administrator authorization required.",
        },
        { status: 401 }
      ),
    };
  }

  // 2. Insufficient role permissions
  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      user: session,
      response: NextResponse.json(
        {
          success: false,
          error: `Access Denied: Role '${session.role}' is not authorized for this operation. Required: ${allowedRoles.join(" or ")}.`,
        },
        { status: 403 }
      ),
    };
  }

  // 3. Successfully authorized
  return {
    authorized: true,
    user: session,
    response: null,
  };
}

/**
 * Convenience helper specifically for Owner or General Administrator operations.
 */
export async function requireOwnerOrAdmin(req: NextRequest | Request): Promise<RequireAdminResult> {
  return requireAdmin(req, ["owner", "admin"]);
}
