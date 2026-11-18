"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  employeeCode: z.string().min(3, "Employee code must be at least 3 characters"),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  role: z.nativeEnum(Role),
  initialPassword: z.string().min(4, "Password must be at least 4 characters"),
});

export async function createStaffAccount(formData: FormData) {
  try {
    const session = await requireRole([Role.HR_OFFICER, Role.HR_DIRECTOR, Role.SYSTEM_ADMIN]);

    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    let employeeCode = (formData.get("employeeCode") as string)?.trim();
    const jobTitle = (formData.get("jobTitle") as string)?.trim() || null;
    const departmentIdRaw = formData.get("departmentId") as string;
    const departmentId = departmentIdRaw && departmentIdRaw !== "none" ? departmentIdRaw : null;
    const roleInput = (formData.get("role") as string) || "STAFF";
    const initialPassword = (formData.get("initialPassword") as string) || "00000";

    // Auto-generate employee code if missing
    if (!employeeCode) {
      const count = await prisma.user.count();
      employeeCode = `EMP-${String(count + 1).padStart(3, "0")}`;
    }

    const validated = createStaffSchema.safeParse({
      fullName,
      email,
      employeeCode,
      jobTitle: jobTitle || undefined,
      departmentId: departmentId || undefined,
      role: roleInput as Role,
      initialPassword,
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    // Role Escalation Protection: Only SYSTEM_ADMIN can provision another SYSTEM_ADMIN
    if (validated.data.role === Role.SYSTEM_ADMIN && session.role !== Role.SYSTEM_ADMIN) {
      return { error: "Only System Administrators are permitted to create admin accounts." };
    }

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { error: "An employee account with this email already exists." };
    }

    // Check unique employee code
    const existingCode = await prisma.user.findUnique({ where: { employeeCode } });
    if (existingCode) {
      return { error: "An employee account with this employee code already exists." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        employeeCode,
        passwordHash,
        role: validated.data.role,
        departmentId,
        jobTitle,
        isActive: true,
      },
      include: { department: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "CREATE_STAFF_ACCOUNT",
        targetEntity: "User",
        targetId: newUser.id,
        details: JSON.stringify({
          fullName: newUser.fullName,
          email: newUser.email,
          employeeCode: newUser.employeeCode,
          role: newUser.role,
          department: newUser.department?.name || "Unassigned",
        }),
      },
    });

    revalidatePath("/admin/departments");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/live-board");
    revalidatePath("/admin/reports");
    revalidatePath("/director");

    return {
      success: true,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        employeeCode: newUser.employeeCode,
        role: newUser.role,
        department: newUser.department?.name || "Unassigned",
      },
    };
  } catch (err: any) {
    return { error: err.message || "Failed to create staff account." };
  }
}

export async function updateCompanyPolicy(formData: FormData) {
  const session = await requireRole([Role.HR_OFFICER, Role.SYSTEM_ADMIN]);

  const workStartTime = formData.get("workStartTime") as string;
  const workEndTime = formData.get("workEndTime") as string;
  const graceMinutes = parseInt(formData.get("graceMinutes") as string, 10);
  const workingDays = formData.getAll("workingDays") as string[];

  if (!workStartTime || !workEndTime || isNaN(graceMinutes)) {
    return { error: "Invalid policy parameters provided." };
  }

  const policy = await prisma.companyPolicy.upsert({
    where: { id: "default-policy" },
    update: {
      workStartTime,
      workEndTime,
      graceMinutes,
      workingDays: JSON.stringify(workingDays),
    },
    create: {
      id: "default-policy",
      workStartTime,
      workEndTime,
      graceMinutes,
      workingDays: JSON.stringify(workingDays),
      timezone: "GMT",
      hrContactPhone: "+233 20 000 0000",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "UPDATE_COMPANY_POLICY",
      targetEntity: "CompanyPolicy",
      targetId: policy.id,
      details: JSON.stringify({ workStartTime, workEndTime, graceMinutes, workingDays }),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await requireRole([Role.SYSTEM_ADMIN]);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found." };

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "UPDATE_USER_ROLE",
      targetEntity: "User",
      targetId: userId,
      details: JSON.stringify({
        targetEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole,
      }),
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function toggleUserStatus(userId: string) {
  const session = await requireRole([Role.SYSTEM_ADMIN]);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found." };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !targetUser.isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: updated.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      targetEntity: "User",
      targetId: userId,
      details: JSON.stringify({ targetEmail: targetUser.email, isActive: updated.isActive }),
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function createDepartment(name: string) {
  const session = await requireRole([Role.HR_OFFICER, Role.HR_DIRECTOR, Role.SYSTEM_ADMIN]);

  if (!name || name.trim().length < 2) {
    return { error: "Department name must be at least 2 characters." };
  }

  const existing = await prisma.department.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return { error: "A department with this name already exists." };
  }

  const dept = await prisma.department.create({
    data: { name: name.trim() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "CREATE_DEPARTMENT",
      targetEntity: "Department",
      targetId: dept.id,
      details: JSON.stringify({ name: dept.name }),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/departments");
  return { success: true };
}

export async function updateDepartmentManager(departmentId: string, managerId: string | null) {
  try {
    const session = await requireRole([Role.HR_OFFICER, Role.HR_DIRECTOR, Role.SYSTEM_ADMIN]);

    const dept = await prisma.department.update({
      where: { id: departmentId },
      data: { managerId: managerId || null },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "UPDATE_DEPARTMENT_MANAGER",
        targetEntity: "Department",
        targetId: departmentId,
        details: JSON.stringify({ department: dept.name, managerId }),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update department manager." };
  }
}

export async function assignUserDepartment(userId: string, departmentId: string | null) {
  try {
    const session = await requireRole([Role.HR_OFFICER, Role.HR_DIRECTOR, Role.SYSTEM_ADMIN]);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { departmentId: departmentId || null },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "ASSIGN_USER_DEPARTMENT",
        targetEntity: "User",
        targetId: userId,
        details: JSON.stringify({ user: user.fullName, departmentId }),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to assign user department." };
  }
}
