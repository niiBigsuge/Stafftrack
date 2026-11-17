"use server";

import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { department: true },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or account is inactive." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { error: "Invalid password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    employeeCode: user.employeeCode,
    role: user.role,
    departmentId: user.departmentId,
    jobTitle: user.jobTitle,
  });

  if (user.role === "HR_DIRECTOR") {
    redirect("/director");
  } else if (user.role === "SYSTEM_ADMIN") {
    redirect("/admin/settings");
  } else if (user.role === "HR_OFFICER") {
    redirect("/hr/requests");
  } else if (user.role === "DEPARTMENT_HEAD") {
    redirect("/manager/requests");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
