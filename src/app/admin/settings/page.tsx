import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AdminSettingsView } from "@/components/AdminSettingsView";

export default async function AdminSettingsPage() {
  await requireRole([Role.SYSTEM_ADMIN]);

  // 1. Policy
  let policy = await prisma.companyPolicy.findFirst();
  if (!policy) {
    policy = {
      id: "default-policy",
      workStartTime: "08:30:00",
      workEndTime: "17:00:00",
      graceMinutes: 5,
      workingDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
      timezone: "GMT",
      hrContactPhone: "+233 20 000 0000",
      updatedAt: new Date(),
    };
  }

  // 2. Technical Audit Logs
  const auditLogs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // 3. System Health & Infrastructure metrics
  const totalUsers = await prisma.user.count();
  const totalRecords = await prisma.attendanceRecord.count();
  const totalRequests = await prisma.attendanceRequest.count();

  const systemHealth = {
    databaseStatus: "Operational (Connected)",
    databaseEngine: "ServBay MySQL 8.x",
    databaseHost: "localhost:3306 (staff_track)",
    totalUsersCount: totalUsers,
    totalRecordsCount: totalRecords,
    totalRequestsCount: totalRequests,
    activePolicyId: policy.id,
    nodeVersion: process.version,
    uptimeSeconds: Math.round(process.uptime()),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
            Super Admin Portal
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Technical Infrastructure & Rules</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
          Technical Administration & Policy Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure global attendance rules and shift cutoffs, inspect technical audit logs, and monitor system health.
        </p>
      </div>

      <AdminSettingsView
        policy={policy}
        auditLogs={auditLogs}
        systemHealth={systemHealth}
      />
    </div>
  );
}
