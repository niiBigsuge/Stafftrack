import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { History, ShieldCheck, User } from "lucide-react";

export default async function HRAuditPage() {
  await requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN]);

  const auditLogs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-800" aria-hidden="true" />
            HR Attendance Decision & Audit History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Immutable log of attendance approvals, excuse verifications, and compliance actions.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Historical Decisions & Action Trail</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No audit records logged yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 transition text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Officer: <strong>{log.actor.fullName}</strong> ({log.actor.email})
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString("en-US")}
                  </span>
                </div>
                {log.details && (
                  <pre className="mt-1 rounded bg-slate-100 p-2 text-[11px] font-mono text-slate-800 overflow-x-auto">
                    {log.details}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
