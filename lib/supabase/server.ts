import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Hard guard: Ensure server client code is NEVER bundled into client components
if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY VIOLATION: lib/supabase/server must never be imported or executed in client components."
  );
}

/**
 * Safely masks sensitive keys so raw secrets are never exposed in server logs or error traces.
 */
export function maskKey(key?: string | null): string {
  if (!key) return "[NOT_SET]";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "***";
  if (trimmed.length <= 16) return `${trimmed.slice(0, 3)}...${trimmed.slice(-3)}`;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/**
 * Validates Supabase server environment variables at startup/invocation.
 * Verifies key presence, prevents credential confusion, and enforces least-privilege scoping.
 */
export interface SupabaseConfigStatus {
  valid: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  isServiceRoleSameAsAnon: boolean;
  url: string;
  maskedAnonKey: string;
  maskedServiceRoleKey: string;
  warnings: string[];
}

export function validateSupabaseConfig(): SupabaseConfigStatus {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const legacyKey = process.env.SUPABASE_KEY || "";

  const warnings: string[] = [];

  if (!url) {
    warnings.push("Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing.");
  } else if (!url.startsWith("https://") && !url.startsWith("http://")) {
    warnings.push("Supabase URL is malformed (must start with https:// or http://).");
  }

  if (!anonKey) {
    warnings.push("Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing.");
  }

  const isServiceRoleSameAsAnon = Boolean(
    serviceRoleKey && anonKey && serviceRoleKey === anonKey
  );

  if (isServiceRoleSameAsAnon) {
    warnings.push(
      "SUPABASE_SERVICE_ROLE_KEY is identical to NEXT_PUBLIC_SUPABASE_ANON_KEY. This will not bypass RLS."
    );
  }

  if (!serviceRoleKey && process.env.NODE_ENV === "production") {
    warnings.push(
      "SUPABASE_SERVICE_ROLE_KEY is missing in production environment. Admin bypass operations will operate in scoped fallback mode."
    );
  }

  // Warn if legacy/insecure aliases are still present in environment
  if (legacyKey) {
    warnings.push(
      "Deprecated SUPABASE_KEY alias detected. Please use SUPABASE_SERVICE_ROLE_KEY instead."
    );
  }

  return {
    valid: warnings.length === 0,
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    isServiceRoleSameAsAnon,
    url: url ? url.replace(/(https?:\/\/)[^/]+/, "$1***") : "[NOT_SET]",
    maskedAnonKey: maskKey(anonKey),
    maskedServiceRoleKey: maskKey(serviceRoleKey),
    warnings,
  };
}

function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  );
}

/**
 * Creates a scoped client for public and customer operations.
 * Enforces Row-Level Security (RLS) via NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Can accept a customer accessToken for user-authenticated RLS context.
 */
export function createScopedServerClient(options?: {
  accessToken?: string;
}): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const headers: Record<string, string> = {};
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers,
    },
  });
}

/**
 * Creates a trusted service-role client for administrative operations only.
 * Bypasses RLS strictly when authorized staff/server jobs need database-wide mutation.
 * Exclusively accepts SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServiceRoleClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY is required for trusted server operations in production."
      );
    }
    // In local non-production development where service-role key is not configured,
    // fallback to scoped client so development remains functional without crashing.
    return createScopedServerClient();
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface ServerClientOptions {
  admin?: boolean;
  accessToken?: string;
}

/**
 * Universal server client factory:
 * - By default (or admin: false): returns scoped client enforcing RLS with anon key.
 * - When admin: true: returns trusted service-role client using SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServerClient(options?: ServerClientOptions): SupabaseClient {
  if (options?.admin) {
    return createServiceRoleClient();
  }
  return createScopedServerClient({ accessToken: options?.accessToken });
}
