import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { validateEmail, sanitizeString } from "@/lib/security/validation";
import {
  getAllTeamMembers,
  addTeamMember,
  deleteTeamMember,
  StoredTeamMember,
} from "@/lib/security/teamStore";

/**
 * GET /api/admin/team
 * Super Admin only: List all restaurant Admin and Sub-Admin (Delivery) members.
 */
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req, ["owner"]);
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    const team = await getAllTeamMembers();
    return NextResponse.json({ success: true, team });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load team members." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/team
 * Super Admin only: Add a new Admin (Manager) or Sub-Admin (Delivery) member.
 */
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req, ["owner"]);
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  try {
    const body = await req.json();
    const rawName = sanitizeString(body?.name, 80);
    const rawEmail = sanitizeString(body?.email, 254);
    const rawPassword = String(body?.password || "").trim();
    const rawRole = String(body?.role || "admin").toLowerCase();

    if (!rawName || rawName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid staff name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (rawPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const roleType: "admin" | "sub_admin" =
      rawRole === "sub_admin" || rawRole === "staff" || rawRole === "delivery" ? "sub_admin" : "admin";

    const newMember = await addTeamMember({
      name: rawName,
      email: emailCheck.sanitized,
      password: rawPassword,
      role: roleType,
    });

    const { passwordHash, salt, ...safeMember } = newMember;

    return NextResponse.json({
      success: true,
      message: `${roleType === "admin" ? "Admin (Manager)" : "Sub-Admin (Delivery)"} added successfully!`,
      member: safeMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to add team member." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/team?id=...
 * Super Admin only: Remove a team member.
 */
export async function DELETE(req: NextRequest) {
  const adminCheck = await requireAdmin(req, ["owner"]);
  if (!adminCheck.authorized) {
    return adminCheck.response;
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("id");

  if (!memberId) {
    return NextResponse.json({ success: false, error: "Member ID is required." }, { status: 400 });
  }

  try {
    await deleteTeamMember(memberId);

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to remove team member." },
      { status: 500 }
    );
  }
}
