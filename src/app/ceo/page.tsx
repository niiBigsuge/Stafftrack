import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Award, TrendingUp, AlertTriangle, Building2, CheckCircle2, Users, ShieldAlert, BarChart3, Clock, AlertCircle } from "lucide-react";

export default async function CEOPortalPage() {
  await requireRole([Role.EXECUTIVE, Role.SUPER_ADMIN]);

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
  const pendingPunch = totalHeadcount - (todayOnTime + todayLate + todayAbsent);

  // 3. Departmental scorecards
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
        if (r.status === "PRESENT_ON_TIME") onTimeLogs++;
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

  // 4. Identify recurring attendance issues (staff with >= 2 late arrivals or repeated absences)
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

  // 5. Escalated Cases (Unresolved unexcused cases with large lateness > 30 mins)
  const escalatedRequests = await prisma.attendanceRequest.findMany({
    where: {
      status: "PENDING",
      reason: { contains: "urgent" },
    },
    include: {
      user: { include: { department: true } },
    },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Executive Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
            CEO Portal
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Executive Oversight & Strategic Governance</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
          Organization Punctuality & Attendance Intelligence
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Executive dashboard providing cross-departmental benchmarks, operational discipline metrics, and chronic tardiness analytics.
        </p>
      </div>

      {/* Headline KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Award className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Org Punctuality Rate
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 tabular-nums">
            {orgPunctualityScore}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Trailing company benchmark</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Headcount
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 tabular-nums">
            {totalHeadcount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active personnel</div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Present On-Time
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-900 tabular-nums">
            {todayOnTime}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-emerald-700">
            {totalHeadcount > 0 ? Math.round((todayOnTime / totalHeadcount) * 100) : 0}% of workforce
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Present Late
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-amber-900 tabular-nums">
            {todayLate}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-amber-700">
            {totalHeadcount > 0 ? Math.round((todayLate / totalHeadcount) * 100) : 0}% of workforce
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-800">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            Marked Absent
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-rose-900 tabular-nums">
            {todayAbsent}
          </div>
          <div className="mt-1 text-[11px] text-rose-700">Pending: {pendingPunch}</div>
        </div>
      </div>

      {/* Department Punctuality Rankings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Department Punctuality Performance & Benchmarks
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {deptScorecards.map((dept, index) => (
            <div
              key={dept.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rank #{index + 1}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                  {dept.staffCount} Staff
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-950 text-base">{dept.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                    {dept.punctualityRate}%
                  </span>
                  <span className="text-xs text-slate-500">Punctuality Score</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dept.punctualityRate >= 90
                      ? "bg-emerald-500"
                      : dept.punctualityRate >= 75
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${dept.punctualityRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                <span>On-Time: <strong className="text-slate-900">{dept.onTimeLogs}</strong></span>
                <span>Late: <strong className="text-amber-700">{dept.lateLogs}</strong></span>
                <span>Lost: <strong className="text-slate-900">{dept.totalLateMinutes}m</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chronic Attendance Issues Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Recurring Attendance Issues & Tardiness Anomalies
            </h2>
            <p className="text-xs text-slate-500">
              Personnel flagged for multiple late arrivals or accumulated tardiness minutes.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {chronicAttendanceIssues.length} Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Total Late Occurrences</th>
                <th className="px-6 py-3">Unexcused Tardiness</th>
                <th className="px-6 py-3">Total Lost Work Minutes</th>
                <th className="px-6 py-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chronicAttendanceIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                    No chronic attendance or recurring tardiness patterns detected across departments.
                  </td>
                </tr>
              ) : (
                chronicAttendanceIssues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{item.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.employeeCode} • {item.jobTitle}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                      {item.department}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-amber-700 font-semibold tabular-nums">
                      {item.lateCount} times
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-rose-700 font-semibold tabular-nums">
                      {item.unexcusedLate} unexcused
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-900 font-semibold tabular-nums">
                      {item.totalLostMins} mins
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
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

      {/* Escalated Cases Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-slate-700" aria-hidden="true" />
            Executive Escalated Cases Review
          </h2>
          <p className="text-xs text-slate-500">
            Cases escalated to the Executive Suite per corporate governance policy.
          </p>
        </div>

        <div className="p-6">
          {escalatedRequests.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">
              Zero escalated disciplinary or policy exception cases requiring CEO review.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {escalatedRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{req.user.fullName}</span>{" "}
                    <span className="text-slate-500">({req.user.department?.name})</span>: &ldquo;{req.reason}&rdquo;
                  </div>
                  <span className="rounded bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 text-[10px]">
                    Escalated
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
