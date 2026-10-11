import crypto from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";

export interface StoredTeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  roleType: "admin" | "sub_admin";
  passwordHash: string;
  salt: string;
  created_at: string;
  is_active: boolean;
}

export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hashToVerify, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

// Initial default seed members
const managerSeed = hashPassword("Manager@123", "nexora_manager_fixed_salt_2026");
const deliverySeed = hashPassword("Delivery@123", "nexora_delivery_fixed_salt_2026");

let teamMembersStore: StoredTeamMember[] = [
  {
    id: "tm_admin_manager_1",
    name: "Vikram Singh (Manager)",
    email: "manager@nexora.com",
    role: "admin",
    roleType: "admin",
    passwordHash: managerSeed.hash,
    salt: managerSeed.salt,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    is_active: true,
  },
  {
    id: "tm_delivery_staff_1",
    name: "Ramesh Kumar (Delivery)",
    email: "delivery@nexora.com",
    role: "staff",
    roleType: "sub_admin",
    passwordHash: deliverySeed.hash,
    salt: deliverySeed.salt,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_active: true,
  },
];

export async function getAllTeamMembers(): Promise<Omit<StoredTeamMember, "passwordHash" | "salt">[]> {
  try {
    const supabase = createServerClient({ admin: true });
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .in("role", ["admin", "staff"])
      .order("created_at", { ascending: false });

    if (Array.isArray(data) && data.length > 0) {
      // Merge with memory store
      const dbIds = new Set(data.map((d) => d.id));
      const memoryOnly = teamMembersStore.filter((m) => !dbIds.has(m.id));

      const merged = [
        ...data.map((p) => ({
          id: p.id,
          name: p.full_name || "Staff Member",
          email: p.email || "",
          role: p.role as "admin" | "staff",
          roleType: (p.role === "staff" ? "sub_admin" : "admin") as "admin" | "sub_admin",
          created_at: p.created_at || new Date().toISOString(),
          is_active: true,
        })),
        ...memoryOnly.map(({ passwordHash, salt, ...rest }) => rest),
      ];
      return merged;
    }
  } catch {}

  return teamMembersStore.map(({ passwordHash, salt, ...rest }) => rest);
}

export function findTeamMemberByEmail(email: string): StoredTeamMember | undefined {
  const normalized = email.trim().toLowerCase();
  return teamMembersStore.find((m) => m.email.toLowerCase() === normalized);
}

export async function addTeamMember(params: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "sub_admin";
}): Promise<StoredTeamMember> {
  const assignedDbRole: "admin" | "staff" = params.role === "sub_admin" ? "staff" : "admin";
  const { hash, salt } = hashPassword(params.password);
  const newId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newMember: StoredTeamMember = {
    id: newId,
    name: params.name,
    email: params.email.toLowerCase(),
    role: assignedDbRole,
    roleType: params.role,
    passwordHash: hash,
    salt,
    created_at: new Date().toISOString(),
    is_active: true,
  };

  // Upsert in memory
  teamMembersStore = [newMember, ...teamMembersStore.filter((m) => m.email.toLowerCase() !== newMember.email)];

  // Try sync with Supabase profiles
  try {
    const supabase = createServerClient({ admin: true });
    await supabase.from("profiles").upsert({
      id: newId,
      full_name: params.name,
      email: params.email.toLowerCase(),
      role: assignedDbRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {}

  return newMember;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  teamMembersStore = teamMembersStore.filter((m) => m.id !== id);

  try {
    const supabase = createServerClient({ admin: true });
    await supabase.from("profiles").delete().eq("id", id);
  } catch {}

  return true;
}
