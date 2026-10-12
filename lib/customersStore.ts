import fs from "node:fs";
import path from "node:path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");

// Initial pre-registered patrons for testing
const INITIAL_CUSTOMERS: StoredCustomer[] = [
  {
    id: "e1a2b3c4-0000-4000-a000-000000000001",
    phone: "+91 83038 90056",
    raw_phone: "8303890056",
    full_name: "Vaibhav Patel",
    email: "vaibhavpatel8543@gmail.com",
    role: "customer",
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "e1a2b3c4-0000-4000-a000-000000000002",
    phone: "+91 91204 89210",
    raw_phone: "9120489210",
    full_name: "Ansh Patel",
    email: "anshpatel8009889170@gmail.com",
    role: "customer",
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
  },
];

// In-Memory singleton cache on globalThis
const globalForCustomers = globalThis as unknown as {
  __nexora_customers_cache__?: StoredCustomer[];
};

function readPersistedCustomers(): StoredCustomer[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const content = fs.readFileSync(CUSTOMERS_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Write defaults if file does not exist
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(INITIAL_CUSTOMERS, null, 2), "utf8");
    return [...INITIAL_CUSTOMERS];
  } catch (err) {
    console.warn("Notice: could not read customers.json, using in-memory defaults:", err);
    return [...INITIAL_CUSTOMERS];
  }
}

function writePersistedCustomers(customers: StoredCustomer[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8");
  } catch (err) {
    console.warn("Notice: could not write customers.json:", err);
  }
}

export function getCustomersList(): StoredCustomer[] {
  if (!globalForCustomers.__nexora_customers_cache__) {
    globalForCustomers.__nexora_customers_cache__ = readPersistedCustomers();
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
 */
export async function findCustomerByPhone(phone: string): Promise<StoredCustomer | undefined> {
  const raw = extractRawPhone(phone);
  if (!raw || raw.length < 10) return undefined;

  // 1. Check local persistent store
  const list = getCustomersList();
  const localMatch = list.find((c) => c.raw_phone === raw);
  if (localMatch && localMatch.full_name && localMatch.full_name !== "Guest" && localMatch.full_name !== "Royal Guest") {
    return localMatch;
  }

  // 2. Fallback check remote Supabase profiles if available
  try {
    const supabase = createServerClient({ admin: true });
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email, role, created_at, updated_at")
      .or(`phone.ilike.%${raw}%`)
      .maybeSingle();

    if (
      data &&
      data.full_name &&
      data.full_name.trim().length > 0 &&
      data.full_name !== "Guest" &&
      data.full_name !== "Royal Guest"
    ) {
      const syncedCustomer: StoredCustomer = {
        id: data.id || crypto.randomUUID(),
        phone: data.phone || `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`,
        raw_phone: raw,
        full_name: data.full_name.trim(),
        email: data.email || null,
        role: "customer",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };
      saveCustomerToStore(syncedCustomer);
      return syncedCustomer;
    }
  } catch {}

  return localMatch;
}

/**
 * Persists customer record into local store and attempts Supabase sync.
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

  writePersistedCustomers(list);
  return customer;
}

/**
 * High-level helper to upsert customer registration details.
 */
export async function upsertCustomerProfile(params: {
  phone: string;
  full_name: string;
  email?: string | null;
  id?: string | null;
}): Promise<StoredCustomer> {
  const raw = extractRawPhone(params.phone);
  const formattedPhone = `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  const nowIso = new Date().toISOString();

  // Find existing or generate valid UUID
  const existing = await findCustomerByPhone(params.phone);
  const validUuid = existing?.id && /^[0-9a-f-]{36}$/i.test(existing.id)
    ? existing.id
    : params.id && /^[0-9a-f-]{36}$/i.test(params.id)
    ? params.id
    : crypto.randomUUID();

  const record: StoredCustomer = {
    id: validUuid,
    phone: formattedPhone,
    raw_phone: raw,
    full_name: params.full_name.trim(),
    email: params.email?.trim() || existing?.email || null,
    role: "customer",
    created_at: existing?.created_at || nowIso,
    updated_at: nowIso,
  };

  saveCustomerToStore(record);

  // Sync with Supabase profiles ensuring auth.users relationship
  try {
    const supabase = createServerClient({ admin: true });
    let authUserId = validUuid;

    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const matchedUser = usersData?.users?.find(
        (u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === raw
      );
      if (matchedUser) {
        authUserId = matchedUser.id;
      } else {
        const { data: createdUser } = await supabase.auth.admin.createUser({
          phone: `+91${raw}`,
          phone_confirm: true,
          user_metadata: { full_name: params.full_name.trim() },
        });
        if (createdUser?.user) {
          authUserId = createdUser.user.id;
        }
      }
    } catch {}

    record.id = authUserId;
    saveCustomerToStore(record);

    await supabase.from("profiles").upsert({
      id: authUserId,
      phone: formattedPhone,
      full_name: params.full_name.trim(),
      email: record.email,
      role: "customer",
      updated_at: nowIso,
    });
  } catch (err) {
    console.warn("Supabase profile sync notice:", err);
  }

  return record;
}
