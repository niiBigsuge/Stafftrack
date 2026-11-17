import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { DepartmentsClientView } from "@/components/DepartmentsClientView";
import { Building2, ShieldCheck } from "lucide-react";

export default async function AdminDepartmentsPage() {
  await requireRole([Role.HR_OFFICER, Role.SYSTEM_ADMIN]);

  const departments = await prisma.department.findMany({
    include: {
      users: {
        select: {
          id: true,
          fullName: true,
          employeeCode: true,
          role: true,
          jobTitle: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      role: true,
      departmentId: true,
      jobTitle: true,
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-800" aria-hidden="true" />
            Department Management & Team Allocations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create departments, assign Department Heads, and map personnel for scoped live boards and attendance approvals.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-slate-600" aria-hidden="true" />
            HR & Admin Access Only
          </span>
        </div>
      </div>

      <DepartmentsClientView
        departments={departments}
        users={users}
      />
    </div>
  );
}
