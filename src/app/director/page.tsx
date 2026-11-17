import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import {
  Award,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Users,
  ShieldAlert,
  BarChart3,
  Clock,
  Briefcase,
  AlertCircle,
} from "lucide-react";

export default async function HRDirectorPortalPage() {
  await requireRole([Role.HR_DIRECTOR, Role.SYSTEM_ADMIN]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch all active employees
  const allStaff = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      department: true,
      attendanceRecords: {
        orderBy: { recordDate: "desc" },
        take: 30,
      },
    },
  });

  // 2. Fetch today's records
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { recordDate: today },
  });

  const totalHeadcount = allStaff.length;
  const todayOnTime = todayRecords.filter((r) => r.status === "PRESENT_ON_TIME").length;
  const todayLate = todayRecords.filter((r) => r.status === "PRESENT_LATE").length;
  const todayAbsent = todayRecords.filter((r) => r.status === "ABSENT").length;
  const todayField = todayRecords.filter((r) => r.status === "FIELD_DUTY").length;
  const todayLeave = todayRecords.filter((r) => r.status === "ON_LEAVE").length;
  const pendingPunch = totalHeadcount - (todayOnTime + todayLate + todayAbsent + todayField + todayLeave);

  // 3. Departmental scorecards (Approved excuses count as on-time for rate)
  const departments = await prisma.department.findMany({
    include: {
      users: {
        where: { isActive: true },
        include: { attendanceRecords: true },
      },
    },
  });

  const deptScorecards = departments.map((dept) => {
    let totalLogs = 0;
    let onTimeLogs = 0;
    let lateLogs = 0;
    let totalLateMinutes = 0;

    for (const u of dept.users) {
      for (const r of u.attendanceRecords) {
        totalLogs++;
        if (r.status === "PRESENT_ON_TIME" || (r.status === "PRESENT_LATE" && r.isExcused) || r.status === "FIELD_DUTY") {
          onTimeLogs++;
        }
        if (r.status === "PRESENT_LATE") {
          lateLogs++;
          totalLateMinutes += r.minutesLate;
        }
      }
    }

    const rate = totalLogs > 0 ? Math.round((onTimeLogs / totalLogs) * 100) : 100;

    return {
      id: dept.id,
      name: dept.name,
      staffCount: dept.users.length,
      totalLogs,
      onTimeLogs,
      lateLogs,
      totalLateMinutes,
      punctualityRate: rate,
    };
  });

  deptScorecards.sort((a, b) => b.punctualityRate - a.punctualityRate);

  // Overall organization punctuality score
  const totalOrgLogs = deptScorecards.reduce((acc, d) => acc + d.totalLogs, 0);
  const totalOrgOnTime = deptScorecards.reduce((acc, d) => acc + d.onTimeLogs, 0);
  const orgPunctualityScore =
    totalOrgLogs > 0 ? Math.round((totalOrgOnTime / totalOrgLogs) * 100) : 100;

  // 4. Identify chronic attendance issues
  const chronicAttendanceIssues = allStaff
    .map((staff) => {
      const lateCount = staff.attendanceRecords.filter((r) => r.status === "PRESENT_LATE").length;
      const unexcusedLate = staff.attendanceRecords.filter(
        (r) => r.status === "PRESENT_LATE" && !r.isExcused
      ).length;
      const absentCount = staff.attendanceRecords.filter((r) => r.status === "ABSENT").length;
      const totalLostMins = staff.attendanceRecords.reduce((acc, r) => acc + r.minutesLate, 0);

      return {
        id: staff.id,
        fullName: staff.fullName,
        employeeCode: staff.employeeCode,
        department: staff.department?.name || "General",
        jobTitle: staff.jobTitle,
        lateCount,
        unexcusedLate,
        absentCount,
        totalLostMins,
      };
    })
    .filter((s) => s.lateCount >= 1 || s.absentCount >= 1)
    .sort((a, b) => b.totalLostMins - a.totalLostMins);

  // 5. Active Pending Requests across Company
  const pendingRequests = await prisma.attendanceRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { include: { department: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-800" aria-hidden="true" />
            HR Director — Executive Punctuality Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Company-wide organizational punctuality analytics, departmental rankings, and workforce attendance health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
            <Award className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            {orgPunctualityScore}% Org Punctuality
          </span>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users className="h-4 w-4 text-slate-600" aria-hidden="true" />
            Total Headcount
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {totalHeadcount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            On-Time Today
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
            {todayOnTime}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Late Arrivals
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
            {todayLate}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Briefcase className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Field / Leave
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-blue-700 tabular-nums">
            {todayField + todayLeave}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Pending Punch
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-500 tabular-nums">
            {pendingPunch > 0 ? pendingPunch : 0}
          </div>
        </div>
      </div>

      {/* Department Leaderboard */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700" aria-hidden="true" />
              Departmental Punctuality Rankings (Trailing 30 Days)
            </h2>
            <p className="text-xs text-slate-500">
              Departmental compliance rating calculated from on-time arrival percentage (excused late arrivals credited).
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {deptScorecards.map((dept, idx) => (
            <div key={dept.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold font-mono text-slate-700">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {dept.staffCount} staff
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 ml-9">
                  <span>{dept.onTimeLogs} on-time logs</span>
                  <span>•</span>
                  <span>{dept.lateLogs} late logs ({dept.totalLateMinutes} mins lost)</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    {dept.punctualityRate}%
                  </div>
                  <div className="text-[11px] text-slate-500">Compliance Rate</div>
                </div>
                <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${
                      dept.punctualityRate >= 90
                        ? "bg-emerald-600"
                        : dept.punctualityRate >= 75
                        ? "bg-amber-500"
                        : "bg-rose-600"
                    }`}
                    style={{ width: `${dept.punctualityRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chronic Attendance Issues */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Attendance Risk & High Friction Cases
          </h2>
          <p className="text-xs text-slate-500">
            Personnel with repeated unexcused late arrivals or absences in the trailing 30-day window.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Late Occurrences</th>
                <th className="px-6 py-3">Unexcused</th>
                <th className="px-6 py-3">Time Lost</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chronicAttendanceIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Zero chronic attendance or lateness issues recorded across the organization.
                  </td>
                </tr>
              ) : (
                chronicAttendanceIssues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{item.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.employeeCode} • {item.jobTitle || "Staff"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{item.department}</td>
                    <td className="px-6 py-3.5 font-mono text-amber-700 font-semibold tabular-nums">
                      {item.lateCount} times
                    </td>
                    <td className="px-6 py-3.5 font-mono text-rose-700 font-semibold tabular-nums">
                      {item.unexcusedLate} unexcused
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-900 font-semibold tabular-nums">
                      {item.totalLostMins} mins
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.totalLostMins > 45
                            ? "bg-rose-50 border border-rose-200 text-rose-800"
                            : "bg-amber-50 border border-amber-200 text-amber-800"
                        }`}
                      >
                        {item.totalLostMins > 45 ? "High Priority" : "Monitor"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalated/Pending Requests */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Recent Pending Requests Under Review
          </h2>
          <p className="text-xs text-slate-500">
            Requests awaiting action across all departments.
          </p>
        </div>

        <div className="p-6">
          {pendingRequests.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">
              All employee attendance requests are currently reviewed and resolved.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{req.user.fullName}</span>{" "}
                    <span className="text-slate-500">({req.user.department?.name || "General"})</span>: &ldquo;{req.reason}&rdquo;
                  </div>
                  <span className="rounded bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 text-[10px]">
                    {req.requestType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
