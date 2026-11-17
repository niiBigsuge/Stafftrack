import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClockCard } from "@/components/ClockCard";
import { AttendanceTable } from "@/components/AttendanceTable";
import { StaffRequestsList } from "@/components/StaffRequestsList";
import { LeaveNoticeTrigger } from "@/components/LeaveNoticeTrigger";
import { CheckCircle2, AlertTriangle, XCircle, Award, ListChecks, Users, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch policy
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

  // Fetch today's record
  const todayRecord = await prisma.attendanceRecord.findUnique({
    where: {
      userId_recordDate: {
        userId: session.userId,
        recordDate: today,
      },
    },
  });

  // Fetch user's historical records (last 30 days)
  const history = await prisma.attendanceRecord.findMany({
    where: { userId: session.userId },
    orderBy: { recordDate: "desc" },
    take: 30,
    include: { requests: true },
  });

  // Fetch user's submitted requests for tracking
  const submittedRequests = await prisma.attendanceRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: {
        select: { fullName: true, jobTitle: true },
      },
    },
  });

  // Compute personal punctuality metrics
  const totalRecordedDays = history.length;
  const onTimeDays = history.filter((r) => r.status === "PRESENT_ON_TIME").length;
  const lateDays = history.filter((r) => r.status === "PRESENT_LATE").length;
  const absentDays = history.filter((r) => r.status === "ABSENT").length;
  const totalLateMinutes = history.reduce((acc, r) => acc + r.minutesLate, 0);

  const punctualityScore =
    totalRecordedDays > 0 ? Math.round((onTimeDays / totalRecordedDays) * 100) : 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title & Profile Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {session.role === "DEPARTMENT_HEAD" ? "Department Head Attendance & Team Workspace" : "Staff Attendance Portal"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <strong className="text-slate-900">{session.fullName}</strong> • Employee Code: <span className="font-mono text-xs">{session.employeeCode}</span>
          </p>
        </div>
        <div>
          <LeaveNoticeTrigger />
        </div>
      </div>

      {/* Department Head Direct Team Roster Quick Access */}
      {session.role === "DEPARTMENT_HEAD" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/75 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Department Team Attendance Roster</h2>
              <p className="text-xs text-slate-600">
                Track live arrivals, clock-outs, and lateness records for all team members in real-time.
              </p>
            </div>
          </div>
          <Link
            href="/admin/live-board"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile transition whitespace-nowrap"
          >
            <span>View Team Roster</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Clock In / Out Action Card */}
      <ClockCard
        todayRecord={todayRecord}
        policy={{
          workStartTime: policy.workStartTime,
          workEndTime: policy.workEndTime,
          graceMinutes: policy.graceMinutes,
        }}
      />

      {/* Personal Punctuality Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Award className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Punctuality Score
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {punctualityScore}%
            </span>
            <span className="text-xs text-slate-500">trailing 30 days</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            On-Time Arrivals
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {onTimeDays} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Late Arrivals
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {lateDays}
            </span>
            <span className="text-xs text-amber-700 font-medium">({totalLateMinutes} mins lost)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
            Recorded Absences
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {absentDays} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>
      </div>

      {/* Historical Attendance Table */}
      <AttendanceTable records={history} />

      {/* Submitted Requests & HR Comments Tracking */}
      <StaffRequestsList requests={submittedRequests} />
    </div>
  );
}
