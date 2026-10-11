import crypto from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";

export const ROOT_OWNER_ID = "usr_admin_owner_master";
export const ROOT_OWNER_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.ADMIN_USER_EMAIL ||
  "nexora67@gmail.com"
)
  .trim()
  .toLowerCase();

export interface StoredTeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
  roleType: "super_admin" | "admin" | "sub_admin";
  passwordHash: string;
  salt: string;
  created_at: string;
  is_active: boolean;
  is_root_owner?: boolean;
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

export function isRootOwnerAccount(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  return clean === ROOT_OWNER_ID.toLowerCase() || clean === ROOT_OWNER_EMAIL;
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
    is_root_owner: false,
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
    is_root_owner: false,
  },
];

export async function getAllTeamMembers(): Promise<Omit<StoredTeamMember, "passwordHash" | "salt">[]> {
  try {
    const supabase = createServerClient({ admin: true });
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .in("role", ["owner", "admin", "staff"])
      .order("created_at", { ascending: false });

    if (Array.isArray(data) && data.length > 0) {
      // Merge with memory store, excluding root owner duplicates
      const dbIds = new Set(data.map((d) => d.id));
      const memoryOnly = teamMembersStore.filter(
        (m) => !dbIds.has(m.id) && !isRootOwnerAccount(m.id) && !isRootOwnerAccount(m.email)
      );

      const merged = [
        ...data
          .filter((p) => !isRootOwnerAccount(p.id) && !isRootOwnerAccount(p.email))
          .map((p) => {
            const rType: "super_admin" | "admin" | "sub_admin" =
              p.role === "owner" ? "super_admin" : p.role === "staff" ? "sub_admin" : "admin";
            return {
              id: p.id,
              name: p.full_name || "Staff Member",
              email: p.email || "",
              role: p.role as "owner" | "admin" | "staff",
              roleType: rType,
              created_at: p.created_at || new Date().toISOString(),
              is_active: true,
              is_root_owner: false,
            };
          }),
        ...memoryOnly.map(({ passwordHash, salt, ...rest }) => rest),
      ];
      return merged;
    }
  } catch {}

  return teamMembersStore
    .filter((m) => !isRootOwnerAccount(m.id) && !isRootOwnerAccount(m.email))
    .map(({ passwordHash, salt, ...rest }) => rest);
}

export function findTeamMemberByEmail(email: string): StoredTeamMember | undefined {
  const normalized = email.trim().toLowerCase();
  return teamMembersStore.find((m) => m.email.toLowerCase() === normalized);
}

export function findTeamMemberById(id: string): StoredTeamMember | undefined {
  return teamMembersStore.find((m) => m.id === id);
}

export async function addTeamMember(params: {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "sub_admin";
}): Promise<StoredTeamMember> {
  const cleanEmail = params.email.trim().toLowerCase();

  // Root Owner cannot be overwritten
  if (isRootOwnerAccount(cleanEmail)) {
    throw new Error("Cannot add or overwrite the permanent Root Super Admin account.");
  }

  const assignedDbRole: "owner" | "admin" | "staff" =
    params.role === "super_admin" ? "owner" : params.role === "sub_admin" ? "staff" : "admin";
  const { hash, salt } = hashPassword(params.password);
  const newId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newMember: StoredTeamMember = {
    id: newId,
    name: params.name,
    email: cleanEmail,
    role: assignedDbRole,
    roleType: params.role,
    passwordHash: hash,
    salt,
    created_at: new Date().toISOString(),
    is_active: true,
    is_root_owner: false,
  };

  // Upsert in memory
  teamMembersStore = [
    newMember,
    ...teamMembersStore.filter((m) => m.email.toLowerCase() !== newMember.email),
  ];

  // Try sync with Supabase profiles
  try {
    const supabase = createServerClient({ admin: true });
    await supabase.from("profiles").upsert({
      id: newId,
      full_name: params.name,
      email: cleanEmail,
      role: assignedDbRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {}

  return newMember;
}

export async function updateTeamMemberPassword(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; member?: StoredTeamMember }> {
  if (isRootOwnerAccount(id)) {
    return {
      success: false,
      error: "Action Forbidden: The Root Super Admin password cannot be modified from the team management portal.",
    };
  }

  const member = teamMembersStore.find((m) => m.id === id);
  if (!member) {
    return { success: false, error: "Team member not found." };
  }

  if (member.is_root_owner || isRootOwnerAccount(member.email)) {
    return {
      success: false,
      error: "Action Forbidden: The Root Super Admin password cannot be modified.",
    };
  }

  const { hash, salt } = hashPassword(newPassword);
  member.passwordHash = hash;
  member.salt = salt;

  return { success: true, member };
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  if (isRootOwnerAccount(id)) {
    throw new Error("Action Forbidden: The Root Super Admin is permanent and cannot be deleted.");
  }

  const existing = teamMembersStore.find((m) => m.id === id);
  if (existing && (existing.is_root_owner || isRootOwnerAccount(existing.email))) {
    throw new Error("Action Forbidden: The Root Super Admin is permanent and cannot be deleted.");
  }

  teamMembersStore = teamMembersStore.filter((m) => m.id !== id);

  try {
    const supabase = createServerClient({ admin: true });
    await supabase.from("profiles").delete().eq("id", id);
  } catch {}

  return true;
}
