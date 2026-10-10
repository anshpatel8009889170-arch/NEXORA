import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache
const rateLimitStore = new Map<string, RateLimitRecord>();

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
 * Convenience helper to enforce rate limit on Next.js Route Handlers.
 * Returns a 429 response if limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(
  req: NextRequest | Request,
  actionKey: string,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(req);
  const compositeKey = `${actionKey}:${ip}`;
  const result = checkRateLimit(compositeKey, options);

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
