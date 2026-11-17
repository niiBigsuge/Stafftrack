import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { BarChart3, Download, Award, TrendingUp, AlertTriangle, Building2, CheckCircle2 } from "lucide-react";

export default async function ReportsPage() {
  await requireRole([Role.SYSTEM_ADMIN, Role.HR_OFFICER, Role.HR_DIRECTOR, Role.DEPARTMENT_HEAD]);

  // Fetch all departments
  const departments = await prisma.department.findMany({
    include: {
      users: {
        where: { isActive: true },
        include: {
          attendanceRecords: {
            take: 100,
          },
        },
      },
    },
  });

  // Calculate scorecards per department
  const scorecards = departments.map((dept) => {
    let totalRecords = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;

    for (const user of dept.users) {
      for (const record of user.attendanceRecords) {
        totalRecords++;
        if (record.status === "PRESENT_ON_TIME") {
          onTimeCount++;
        } else if (record.status === "PRESENT_LATE") {
          lateCount++;
          totalLateMinutes += record.minutesLate;
        }
      }
    }

    const punctualityScore =
      totalRecords > 0 ? Math.round((onTimeCount / totalRecords) * 100) : 100;

    return {
      id: dept.id,
      name: dept.name,
      headcount: dept.users.length,
      totalRecords,
      onTimeCount,
      lateCount,
      totalLateMinutes,
      punctualityScore,
    };
  });

  // Sort by punctuality score descending
  scorecards.sort((a, b) => b.punctualityScore - a.punctualityScore);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-800" aria-hidden="true" />
            Department Punctuality Scorecards & Reporting
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Comparative departmental metrics, punctuality benchmarks, and compliance analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/export/csv"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 btn-tactile transition"
          >
            <Download className="h-4 w-4 text-slate-600" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/export/excel"
            download
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile transition"
          >
            <Download className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Export Multi-Sheet Excel</span>
          </a>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Department Punctuality Leaderboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scorecards.map((dept, index) => (
            <div
              key={dept.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Rank #{index + 1}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-700">
                  {dept.headcount} Staff
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-950 text-base">{dept.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                    {dept.punctualityScore}%
                  </span>
                  <span className="text-xs font-medium text-slate-500">Punctuality Rate</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dept.punctualityScore >= 90
                      ? "bg-emerald-500"
                      : dept.punctualityScore >= 75
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${dept.punctualityScore}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                <div>
                  On-Time: <strong className="text-slate-900 font-mono">{dept.onTimeCount}</strong>
                </div>
                <div>
                  Late: <strong className="text-amber-700 font-mono">{dept.lateCount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Benchmark Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Departmental Compliance Summary</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Headcount</th>
                <th className="px-6 py-3">Logged Workdays</th>
                <th className="px-6 py-3">On-Time Arrivals</th>
                <th className="px-6 py-3">Late Arrivals</th>
                <th className="px-6 py-3">Total Minutes Lost</th>
                <th className="px-6 py-3 text-right">Punctuality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scorecards.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-slate-900 text-xs">
                    {dept.name}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-700 font-mono">
                    {dept.headcount}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-700 font-mono">
                    {dept.totalRecords}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-emerald-700 font-mono font-medium">
                    {dept.onTimeCount}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-amber-700 font-mono font-medium">
                    {dept.lateCount}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 font-mono">
                    {dept.totalLateMinutes} mins
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                        dept.punctualityScore >= 90
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          : dept.punctualityScore >= 75
                          ? "bg-amber-50 border border-amber-200 text-amber-800"
                          : "bg-rose-50 border border-rose-200 text-rose-800"
                      }`}
                    >
                      {dept.punctualityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
