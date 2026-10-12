import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Global in-memory sliding window cache on globalThis
const globalForRateLimit = globalThis as unknown as {
  __nexora_rate_limit_store__?: Map<string, RateLimitRecord>;
};

if (!globalForRateLimit.__nexora_rate_limit_store__) {
  globalForRateLimit.__nexora_rate_limit_store__ = new Map<string, RateLimitRecord>();
}

const rateLimitStore = globalForRateLimit.__nexora_rate_limit_store__;

// Reset all existing rate limit blocks upon reload to immediately unblock developers/testers
rateLimitStore.clear();

// Cleanup expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number; // Max allowed requests
  windowMs: number; // Time window in milliseconds
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60 * 1000 }
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // New or reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: Math.ceil((now + options.windowMs) / 1000),
    };
  }

  if (existing.count >= options.limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.ceil(existing.resetTime / 1000),
    };
  }

  // Increment within window
  existing.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - existing.count,
    reset: Math.ceil(existing.resetTime / 1000),
  };
}

export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Resets rate limit records for a specific IP (e.g., when a user signs out).
 */
export function clearRateLimitForIp(ip: string, actionKey?: string): void {
  for (const key of rateLimitStore.keys()) {
    if (key.includes(ip) && (!actionKey || key.startsWith(actionKey))) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Wipes all active rate limit records.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Convenience helper to enforce rate limit on Next.js Route Handlers.
 * Returns a 429 response if limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(
  req: NextRequest | Request,
  actionKey: string,
  options: RateLimitOptions,
  customIdentifier?: string
): NextResponse | null {
  const ip = getClientIp(req);
  const isLoopback =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("127.") ||
    ip === "::ffff:127.0.0.1";
  const isDev = process.env.NODE_ENV !== "production";

  // In local development or loopback testing, use generous limits to prevent developer/tester lockout
  const effectiveOptions: RateLimitOptions = (isDev || isLoopback)
    ? {
        limit: Math.max(options.limit * 20, 120),
        windowMs: Math.min(options.windowMs, 60 * 1000), // 1-minute window
      }
    : options;

  const identifier = customIdentifier ? `${ip}:${customIdentifier}` : ip;
  const compositeKey = `${actionKey}:${identifier}`;
  const result = checkRateLimit(compositeKey, effectiveOptions);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please slow down and try again in a few moments.",
        retryAfter: result.reset - Math.ceil(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, result.reset - Math.ceil(Date.now() / 1000))),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null;
}
