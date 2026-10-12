import { NextRequest, NextResponse } from "next/server";

export const CUSTOMER_COOKIE_NAME = "nexora_customer_session";
export const CUSTOMER_SESSION_EXPIRY_SECONDS = 30 * 24 * 3600; // 30-day session

export interface CustomerSession {
  id: string;
  phone: string;
  name?: string;
  role: "customer";
  iat: number;
  exp: number;
}

export function getCustomerSessionSecret(): string {
  const secret = (process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET)?.trim();
  if (!secret || secret.length < 32) {
    // In dev / test fallback to a deterministic 32-char secret if not set
    return "nexora_customer_session_secret_key_32_chars_2026_luxury";
  }
  return secret;
}

function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bufferToBase64Url(sig);
}

function timingSafeEqualUint8(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function createCustomerSessionToken(
  user: { id: string; phone: string; name?: string },
  expirySeconds: number = CUSTOMER_SESSION_EXPIRY_SECONDS
): Promise<string> {
  const secret = getCustomerSessionSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload: CustomerSession = {
    id: user.id,
    phone: user.phone,
    name: user.name || "",
    role: "customer",
    iat: now,
    exp: now + expirySeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bufferToBase64Url(new TextEncoder().encode(payloadJson));
  const signature = await hmacSha256(payloadB64, secret);

  return `${payloadB64}.${signature}`;
}

export async function verifyCustomerSessionToken(token: string): Promise<CustomerSession | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const secret = getCustomerSessionSecret();
    const expectedSig = await hmacSha256(payloadB64, secret);

    const sigBuf = base64UrlToBuffer(signature);
    const expBuf = base64UrlToBuffer(expectedSig);

    if (!timingSafeEqualUint8(sigBuf, expBuf)) {
      return null;
    }

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const session: CustomerSession = JSON.parse(payloadStr);

    if (session.role !== "customer") return null;
    if (!session.id || !session.phone) return null;

    const now = Math.floor(Date.now() / 1000);
    if (session.exp && session.exp < now) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getCustomerSessionFromRequest(
  req: NextRequest | Request
): Promise<CustomerSession | null> {
  let token: string | undefined;

  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    token = (req as any).cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  }

  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${CUSTOMER_COOKIE_NAME}=`));
      if (match) {
        token = match.substring(CUSTOMER_COOKIE_NAME.length + 1);
      }
    }
  }

  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;
  return verifyCustomerSessionToken(token);
}

export function setCustomerSessionCookie(
  response: NextResponse,
  token: string,
  maxAgeSeconds: number = CUSTOMER_SESSION_EXPIRY_SECONDS
): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearCustomerSessionCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
