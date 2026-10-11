import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";
export const ADMIN_SESSION_EXPIRY_SECONDS = 8 * 3600; // 8-hour shift expiry (limited expiry)

export type AdminRole = "owner" | "admin" | "staff";

export interface AdminSession {
  id: string;
  email: string;
  role: AdminRole;
  name: string;
  iat: number; // Issued at timestamp (seconds)
  exp: number; // Expiration timestamp (seconds)
}

/**
 * Strict Environment Secret Retrieval (NO HARDCODED FALLBACK).
 * Throws a fatal exception if ADMIN_SESSION_SECRET is missing or weak (<32 characters).
 */
export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    const errorMsg =
      "FATAL SECURITY CONFIGURATION: ADMIN_SESSION_SECRET environment variable is missing. Startup aborted to prevent session token forgery.";
    if (isProduction) {
      throw new Error(errorMsg);
    }
    // Even in non-production, missing session secret is prohibited
    throw new Error(errorMsg);
  }

  // Minimum 32-character (256 bits of entropy) security standard
  if (secret.length < 32) {
    const weakMsg = `FATAL SECURITY CONFIGURATION: ADMIN_SESSION_SECRET is too weak (${secret.length} chars). Minimum 32 characters (256-bit entropy) required.`;
    throw new Error(weakMsg);
  }

  return secret;
}

/**
 * Generates a cryptographically random 256-bit secret.
 * Useful for secret generation, rotation, and testing.
 */
export function generateCryptographicSecret(bytes = 32): string {
  const randomBytes = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// BASE64URL ENCODING & DECODING (Edge Runtime & Node.js Universal)
// ============================================================================
function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  return bufferToBase64Url(encoder.encode(str));
}

function base64UrlDecode(str: string): string {
  const bytes = base64UrlToUint8Array(str);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed HMAC SHA256 session token.
 * Validates required session claims and embeds iat & exp.
 */
export async function createAdminToken(
  session: Omit<AdminSession, "exp" | "iat">,
  expiresInSeconds = ADMIN_SESSION_EXPIRY_SECONDS
): Promise<string> {
  const secret = getAdminSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const payload: AdminSession = {
    ...session,
    iat: now,
    exp,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const key = await getHmacKey(secret);

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );

  const signature = bufferToBase64Url(signatureBuffer);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies token signature, expiry, role, and required claims using Web Crypto API.
 * Constant-time signature verification prevents timing attacks.
 */
export async function verifyAdminToken(token: string | null | undefined): Promise<AdminSession | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  try {
    const secret = getAdminSessionSecret();
    const encoder = new TextEncoder();
    const key = await getHmacKey(secret);
    const signatureBytes = base64UrlToUint8Array(signature);

    // 1. Cryptographic HMAC Signature Verification (constant-time)
    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(encodedPayload)
    );

    if (!isValid) {
      return null;
    }

    // 2. Decode JSON payload
    const jsonStr = base64UrlDecode(encodedPayload);
    const payload: Partial<AdminSession> = JSON.parse(jsonStr);

    // 3. Verify all required claims
    if (!payload.id || typeof payload.id !== "string") return null;
    if (!payload.email || typeof payload.email !== "string" || !payload.email.includes("@")) return null;
    if (!payload.name || typeof payload.name !== "string") return null;

    // 4. Verify Role
    const validRoles: AdminRole[] = ["owner", "admin", "staff"];
    if (!payload.role || !validRoles.includes(payload.role as AdminRole)) return null;

    // 5. Verify Expiry (Unexpired)
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || typeof payload.exp !== "number" || payload.exp < now) {
      return null; // Expired token
    }

    // 6. Verify iat (Issued at - not in future, with 60s clock skew tolerance)
    if (payload.iat && typeof payload.iat === "number" && payload.iat > now + 60) {
      return null;
    }

    return payload as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from an incoming Next.js request.
 */
export async function getAdminSessionFromRequest(req: NextRequest | Request): Promise<AdminSession | null> {
  let token: string | undefined;

  // 1. Check Cookie
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  }

  // 2. Fallback to Authorization Header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  return verifyAdminToken(token);
}

/**
 * Attaches a secure HTTP-Only cookie to a NextResponse.
 * Enforces:
 * - httpOnly: true (prevents XSS token exfiltration)
 * - secure: in production (HTTPS only)
 * - sameSite: 'lax' (prevents cross-site cookie leakage)
 * - limited expiry: 8 hours
 */
export async function setAdminCookieOnResponse(
  response: NextResponse,
  session: Omit<AdminSession, "exp" | "iat">
): Promise<void> {
  const token = await createAdminToken(session, ADMIN_SESSION_EXPIRY_SECONDS);
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_EXPIRY_SECONDS,
  });
}

/**
 * Clears the admin session cookie on logout.
 */
export function clearAdminCookieOnResponse(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * CSRF / Origin Verification for state-changing requests (POST, PUT, PATCH, DELETE).
 * Verifies that request origin matches the target host header.
 */
export function verifyCsrfOrigin(req: NextRequest | Request): boolean {
  const method = req.method.toUpperCase();
  // Safe idempotent methods do not mutate state
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    const referer = req.headers.get("referer");
    if (!referer) {
      // In programmatic non-browser or test requests without origin/referer headers
      return true;
    }
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    // Origin host must match request Host
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Enforces role-based authorization for protected operations.
 */
export async function verifyRoleAuthorization(
  req: NextRequest | Request,
  allowedRoles: AdminRole[] = ["owner", "admin", "staff"]
): Promise<{ authorized: boolean; session?: AdminSession; errorResponse?: NextResponse }> {
  // CSRF verification on mutating operations
  if (!verifyCsrfOrigin(req)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Cross-Site Request Forgery (CSRF) blocked: Origin mismatch." },
        { status: 403 }
      ),
    };
  }

  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Access Denied: Valid administrator authorization required." },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      session,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Access Denied: Role '${session.role}' is not authorized for this operation. Required: ${allowedRoles.join(" or ")}.`,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
