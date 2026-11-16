import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { LiveRoster } from "@/components/LiveRoster";
import { Users, Clock, CheckCircle2, AlertTriangle, XCircle, UserCheck } from "lucide-react";

export default async function LiveBoardPage() {
  const session = await requireRole([Role.SUPER_ADMIN, Role.HR_ADMIN, Role.EXECUTIVE, Role.MANAGER]);

  let userDeptName: string | null = null;
  if (session.role === "MANAGER" && session.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: session.departmentId },
    });
    userDeptName = dept?.name || null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch all active staff & managers
  const allStaff = await prisma.user.findMany({
    where: { isActive: true },
    include: { department: true },
    orderBy: { fullName: "asc" },
  });

  // Fetch today's records
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { recordDate: today },
    include: { user: true },
  });

  // Map user with their today status
  const roster = allStaff.map((staff) => {
    const record = todayRecords.find((r) => r.userId === staff.id);
    return {
      userId: staff.id,
      fullName: staff.fullName,
      employeeCode: staff.employeeCode,
      department: staff.department?.name || "General",
      departmentId: staff.departmentId,
      jobTitle: staff.jobTitle,
      recordId: record?.id || null,
      clockInTime: record?.clockInTime || null,
      clockOutTime: record?.clockOutTime || null,
      status: record?.status || "NOT_CLOCKED_IN",
      minutesLate: record?.minutesLate || 0,
      isExcused: record?.isExcused || false,
      staffRemarks: record?.staffRemarks || null,
    };
  });

  // Counts
  const totalStaff = allStaff.length;
  const onTimeCount = roster.filter((r) => r.status === "PRESENT_ON_TIME").length;
  const lateCount = roster.filter((r) => r.status === "PRESENT_LATE").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const notClockedInCount = roster.filter((r) => r.status === "NOT_CLOCKED_IN").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-800" aria-hidden="true" />
            Live Daily Attendance Roster
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time corporate attendance presence, reporting times, and tardiness monitor.
          </p>
        </div>
      </div>

      {/* Headline Counters Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Headcount
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
            {totalStaff}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Present On-Time
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-900 tabular-nums">
              {onTimeCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ({totalStaff > 0 ? Math.round((onTimeCount / totalStaff) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Present Late
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {lateCount}
            </span>
            <span className="text-xs font-semibold text-amber-700">
              ({totalStaff > 0 ? Math.round((lateCount / totalStaff) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
            <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            Marked Absent
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-900 tabular-nums">
            {absentCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Pending Punch
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-700 tabular-nums">
            {notClockedInCount}
          </div>
        </div>
      </div>

      {/* Filterable Roster Table */}
      <LiveRoster
        roster={roster}
        initialDepartment={userDeptName || "ALL"}
        viewerRole={session.role}
      />
    </div>
  );
}
