import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  "nexora_admin_secret_super_key_2026_luxury";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";

export interface AdminSession {
  id: string;
  email: string;
  role: "admin" | "owner" | "staff";
  name: string;
  exp: number; // UNIX timestamp in seconds
}

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
 * Universal (Edge Runtime and Node.js compatible).
 */
export async function createAdminToken(
  session: Omit<AdminSession, "exp">,
  expiresInSeconds = 7 * 24 * 3600
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload: AdminSession = { ...session, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const encoder = new TextEncoder();
  const key = await getHmacKey(ADMIN_SECRET);
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );

  const signature = bufferToBase64Url(signatureBuffer);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies the token using constant-time Web Crypto API to prevent timing attacks.
 * Universal (Edge Runtime and Node.js compatible).
 */
export async function verifyAdminToken(token: string | null | undefined): Promise<AdminSession | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  try {
    const encoder = new TextEncoder();
    const key = await getHmacKey(ADMIN_SECRET);
    const signatureBytes = base64UrlToUint8Array(signature);

    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(encodedPayload)
    );

    if (!isValid) {
      return null;
    }

    const jsonStr = base64UrlDecode(encodedPayload);
    const payload: AdminSession = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired token
    }

    return payload;
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

  // 2. Fallback to header
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
 */
export async function setAdminCookieOnResponse(
  response: NextResponse,
  session: Omit<AdminSession, "exp">
): Promise<void> {
  const token = await createAdminToken(session);
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
  });
}
