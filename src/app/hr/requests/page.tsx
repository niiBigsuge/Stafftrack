import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role, RequestStatus } from "@prisma/client";
import { RequestsInbox } from "@/components/RequestsInbox";
import { Inbox, ShieldCheck } from "lucide-react";

export default async function HRRequestsPage() {
  const session = await requireRole([
    Role.DEPARTMENT_HEAD,
    Role.HR_OFFICER,
    Role.HR_DIRECTOR,
    Role.SYSTEM_ADMIN,
  ]);

  // If DEPARTMENT_HEAD, scope requests strictly to their department
  const isDeptHead = session.role === Role.DEPARTMENT_HEAD;
  const whereScope = isDeptHead && session.departmentId
    ? { user: { departmentId: session.departmentId } }
    : {};

  const pendingRequests = await prisma.attendanceRequest.findMany({
    where: {
      status: RequestStatus.PENDING,
      ...whereScope,
    },
    include: {
      user: {
        include: { department: true },
      },
      record: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const recentResolvedRequests = await prisma.attendanceRequest.findMany({
    where: {
      status: { in: [RequestStatus.APPROVED, RequestStatus.REJECTED] },
      ...whereScope,
    },
    include: {
      user: {
        include: { department: true },
      },
      reviewer: true,
    },
    orderBy: { reviewedAt: "desc" },
    take: 15,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <Inbox className="h-6 w-6 text-slate-800" aria-hidden="true" />
            {isDeptHead ? "Department Head — Attendance Requests Inbox" : "HR & Admin — Attendance Request Approval Inbox"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isDeptHead
              ? "Review and act on leave notices, field assignments, and punctuality explanations for your department."
              : "Review company-wide employee punctuality explanations, leave notices, and attendance correction requests."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-slate-600" aria-hidden="true" />
            {isDeptHead ? "Department Review Gate" : "HR Authority Gate"}
          </span>
        </div>
      </div>

      <RequestsInbox
        pendingRequests={pendingRequests}
        recentResolvedRequests={recentResolvedRequests}
      />
    </div>
  );
}
