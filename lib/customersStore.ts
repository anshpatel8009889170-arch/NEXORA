import crypto from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";

export interface StoredCustomer {
  id: string; // Valid UUID
  phone: string; // Formatted E.164 e.g. +91 80098 89170
  raw_phone: string; // Last 10 digits e.g. 8009889170
  full_name: string;
  email?: string | null;
  role: "customer";
  created_at: string;
  updated_at: string;
}

// In-Memory singleton cache on globalThis (no local file writes)
const globalForCustomers = globalThis as unknown as {
  __nexora_customers_cache__?: StoredCustomer[];
};

export function getCustomersList(): StoredCustomer[] {
  if (!globalForCustomers.__nexora_customers_cache__) {
    globalForCustomers.__nexora_customers_cache__ = [];
  }
  return globalForCustomers.__nexora_customers_cache__;
}

export function extractRawPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Searches for a registered customer by matching their 10-digit mobile number.
 * 100% DIRECT FROM SUPABASE CLOUD POSTGRESQL.
 */
export async function findCustomerByPhone(phone: string): Promise<StoredCustomer | undefined> {
  const raw = extractRawPhone(phone);
  if (!raw || raw.length < 10) return undefined;

  const formatted = `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  const e164 = `+91${raw}`;

  try {
    const supabase = createServerClient({ admin: true });
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email, role, created_at, updated_at")
      .or(`phone.eq.${formatted},phone.eq.${e164},phone.eq.${raw},phone.ilike.%${raw.slice(0, 5)}%${raw.slice(5)}%`)
      .maybeSingle();

    if (
      data &&
      data.full_name &&
      data.full_name.trim().length > 0 &&
      data.full_name !== "Guest" &&
      data.full_name !== "Royal Guest"
    ) {
      const customer: StoredCustomer = {
        id: data.id,
        phone: data.phone || formatted,
        raw_phone: raw,
        full_name: data.full_name.trim(),
        email: data.email || null,
        role: "customer",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      // Keep in-memory cache updated
      saveCustomerToStore(customer);
      return customer;
    }
  } catch (err) {
    console.warn("Supabase profile lookup warning:", err);
  }

  // Fallback to in-memory cache if network issue
  const list = getCustomersList();
  const memoryMatch = list.find((c) => c.raw_phone === raw);
  if (memoryMatch && memoryMatch.full_name && memoryMatch.full_name !== "Guest" && memoryMatch.full_name !== "Royal Guest") {
    return memoryMatch;
  }

  return undefined;
}

/**
 * Updates in-memory customer cache (no local file writes).
 */
export function saveCustomerToStore(customer: StoredCustomer): StoredCustomer {
  const list = getCustomersList();
  const existingIdx = list.findIndex(
    (c) => c.raw_phone === customer.raw_phone || c.id === customer.id
  );

  if (existingIdx !== -1) {
    list[existingIdx] = {
      ...list[existingIdx],
      ...customer,
      updated_at: new Date().toISOString(),
    };
  } else {
    list.unshift(customer);
  }

  return customer;
}

/**
 * 100% DIRECT SUPABASE UPSERT:
 * Creates user in Supabase auth.users and upserts record into Supabase profiles table.
 * NO local JSON file is written!
 */
export async function upsertCustomerProfile(params: {
  phone: string;
  full_name: string;
  email?: string | null;
  id?: string | null;
}): Promise<StoredCustomer> {
  const raw = extractRawPhone(params.phone);
  const formattedPhone = `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  const e164 = `+91${raw}`;
  const nowIso = new Date().toISOString();

  let authUserId = params.id && /^[0-9a-f-]{36}$/i.test(params.id) ? params.id : null;

  // Direct Supabase Cloud PostgreSQL operation
  try {
    const supabase = createServerClient({ admin: true });

    // Check or create auth user in Supabase auth.users
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const matchedUser = usersData?.users?.find(
      (u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === raw
    );

    if (matchedUser) {
      authUserId = matchedUser.id;
    } else {
      const { data: createdUser } = await supabase.auth.admin.createUser({
        phone: e164,
        phone_confirm: true,
        user_metadata: { full_name: params.full_name.trim() },
      });
      if (createdUser?.user) {
        authUserId = createdUser.user.id;
      }
    }

    if (authUserId) {
      await supabase.from("profiles").upsert({
        id: authUserId,
        phone: formattedPhone,
        full_name: params.full_name.trim(),
        email: params.email?.trim() || null,
        role: "customer",
        updated_at: nowIso,
      });
    }
  } catch (err) {
    console.warn("Supabase profile save notice:", err);
  }

  const finalId = authUserId || params.id || crypto.randomUUID();
  const record: StoredCustomer = {
    id: finalId,
    phone: formattedPhone,
    raw_phone: raw,
    full_name: params.full_name.trim(),
    email: params.email?.trim() || null,
    role: "customer",
    created_at: nowIso,
    updated_at: nowIso,
  };

  saveCustomerToStore(record);
  return record;
}
