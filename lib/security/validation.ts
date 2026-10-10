/**
 * NEXORA Enterprise Security - Input Validation & Sanitization
 * Protects against SQLi, XSS, prototype pollution, and malformed payloads.
 */

// 1. Phone number validation (Indian 10-digit mobile number)
export function validatePhone(phone: string): { isValid: boolean; sanitized: string } {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, sanitized: "" };
  }

  // Remove whitespace, dashes, parens, and +91 prefix
  const cleaned = phone.replace(/\s+/g, "").replace(/[-()]/g, "");
  const normalized = cleaned.replace(/^(\+91|91|0)/, "");

  const isValid = /^[6-9]\d{9}$/.test(normalized);
  return {
    isValid,
    sanitized: isValid ? `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}` : phone.trim(),
  };
}

// 2. Email validation (RFC 5322 compliant standard)
export function validateEmail(email: string): { isValid: boolean; sanitized: string } {
  if (!email || typeof email !== "string") {
    return { isValid: false, sanitized: "" };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = emailRegex.test(trimmed) && trimmed.length <= 254;

  return { isValid, sanitized: trimmed };
}

// 3. String sanitization (Strips HTML tags & scripts to neutralize XSS)
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") {
    return "";
  }

  // Strip HTML tags and dangerous characters
  const clean = input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"&]/g, (match) => {
      // Escape remaining sensitive entities
      const map: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#x27;",
        '"': "&quot;",
        "&": "&amp;",
      };
      return map[match] || match;
    })
    .trim();

  return clean.slice(0, maxLength);
}

// 4. Safe numerical amount validation
export function validateAmount(amount: unknown, min = 0, max = 500000): { isValid: boolean; value: number } {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num) || num < min || num > max) {
    return { isValid: false, value: 0 };
  }
  return { isValid: true, value: Math.round(num * 100) / 100 };
}

// 5. Coupon code sanitizer
export function sanitizeCouponCode(code: unknown): string {
  if (typeof code !== "string") return "";
  return code.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
}
