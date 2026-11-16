"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, LogOut } from "lucide-react";

interface RosterItem {
  userId: string;
  fullName: string;
  employeeCode: string;
  department: string;
  departmentId: string | null;
  jobTitle: string | null;
  recordId: string | null;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  status: string;
  minutesLate: number;
  isExcused: boolean;
  staffRemarks: string | null;
}

interface LiveRosterProps {
  roster: RosterItem[];
  initialDepartment?: string;
  viewerRole?: string;
}

export function LiveRoster({
  roster,
  initialDepartment = "ALL",
  viewerRole,
}: LiveRosterProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(initialDepartment);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isReconciling, setIsReconciling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  // Auto-refresh roster every 10 seconds for real-time punch synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const departments = Array.from(new Set(roster.map((r) => r.department)));

  const filtered = roster.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      (r.jobTitle && r.jobTitle.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === "ALL" || r.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleReconcile = async () => {
    setIsReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch("/api/cron/reconcile", { method: "POST" });
      const data = await res.json();
      setReconcileResult(`Reconciled: ${data.absentMarkedCount} staff flagged absent.`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setReconcileResult("Reconciliation failed.");
    } finally {
      setIsReconciling(false);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4 p-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by staff name, code, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 px-2.5 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 px-2.5 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT_ON_TIME">Present On-Time</option>
            <option value="PRESENT_LATE">Present Late</option>
            <option value="ABSENT">Marked Absent</option>
            <option value="NOT_CLOCKED_IN">Pending Punch</option>
          </select>

          {/* Live Sync Status indicator */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync Active</span>
          </div>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh Live Attendance Punches"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 btn-tactile transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Refresh Roster</span>
          </button>

          {/* Absence Reconciliation Trigger */}
          <button
            type="button"
            onClick={handleReconcile}
            disabled={isReconciling}
            title="Trigger End-of-Day Absence Reconciliation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 btn-tactile transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isReconciling ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Reconcile Absences</span>
          </button>
        </div>
      </div>

      {reconcileResult && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800">
          {reconcileResult}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Arrival Time</th>
              <th className="px-4 py-3">Departure Time</th>
              <th className="px-4 py-3">Today Status</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                  No staff members match the selected criteria.
                </td>
              </tr>
            ) : (
              filtered.map((staff) => (
                <tr key={staff.userId} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-xs">{staff.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{staff.employeeCode} • {staff.jobTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                    {staff.department}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-800 whitespace-nowrap">
                    {formatTime(staff.clockInTime)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-800 whitespace-nowrap">
                    {formatTime(staff.clockOutTime)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {staff.status === "PRESENT_ON_TIME" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {staff.clockOutTime ? "On Time • Shift Complete" : "On Time • In Office"}
                      </span>
                    ) : staff.status === "PRESENT_LATE" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Late ({staff.minutesLate}m) {staff.clockOutTime ? "• Shift Complete" : "• In Office"}
                        {staff.isExcused && (
                          <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] text-sky-800">Excused</span>
                        )}
                      </span>
                    ) : staff.status === "ABSENT" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-800">
                        <XCircle className="h-3 w-3" aria-hidden="true" />
                        Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Pending Punch
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                    {staff.staffRemarks || (staff.isExcused ? "Excused by manager" : "--")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
