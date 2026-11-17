"use client";

import { useState } from "react";
import { reviewAttendanceRequest } from "@/app/actions/attendance";
import { Check, X, Clock, User, Calendar, MessageSquare } from "lucide-react";
import type { RequestStatus, RequestType } from "@/types";

interface RequestItem {
  id: string;
  requestType: RequestType;
  requestedDate: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  proposedTime: Date | null;
  reason: string;
  status: RequestStatus;
  createdAt: Date;
  user: {
    fullName: string;
    employeeCode: string;
    department: { name: string } | null;
  };
  reviewerNote?: string | null;
  reviewedAt?: Date | null;
}

export function RequestsInbox({
  pendingRequests,
  recentResolvedRequests,
}: {
  pendingRequests: RequestItem[];
  recentResolvedRequests: RequestItem[];
}) {
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    const note = activeNotes[id] || "";
    await reviewAttendanceRequest(id, decision, note);
    setProcessingId(null);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Pending Queue */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Pending Requests Awaiting Review</h2>
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
              {pendingRequests.length}
            </span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Inbox zero. All staff attendance correction and excuse requests have been reviewed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-6 hover:bg-slate-50/50 transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{req.user.fullName}</span>
                      <span className="text-xs font-mono text-slate-500">({req.user.employeeCode})</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {req.user.department?.name || "General"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                        Type: <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{req.requestType}</span>
                      </span>
                      <span>•</span>
                      {req.startDate && req.endDate ? (
                        <span>Range: <strong className="text-slate-900">{formatDate(req.startDate)} - {formatDate(req.endDate)}</strong></span>
                      ) : (
                        <span>Target Date: <strong className="text-slate-900">{formatDate(req.requestedDate || req.startDate)}</strong></span>
                      )}
                      {req.proposedTime && (
                        <>
                          <span>•</span>
                          <span>
                            Proposed Time:{" "}
                            <strong className="text-slate-900">
                              {new Date(req.proposedTime).toLocaleTimeString("en-US", { hour12: true })}
                            </strong>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                      <div className="font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        Staff Justification:
                      </div>
                      &ldquo;{req.reason}&rdquo;
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Optional reviewer remark..."
                      value={activeNotes[req.id] || ""}
                      onChange={(e) =>
                        setActiveNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleReview(req.id, "APPROVED")}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 btn-tactile disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleReview(req.id, "REJECTED")}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 py-1.5 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 btn-tactile disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Resolved History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Recently Resolved Requests</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentResolvedRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No resolved requests yet.</div>
          ) : (
            recentResolvedRequests.map((r) => (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{r.user.fullName}</span>{" "}
                  <span className="text-slate-500 font-mono">({r.user.employeeCode})</span> —{" "}
                  <span className="font-medium text-slate-700">{r.requestType}</span> on {formatDate(r.requestedDate)}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "APPROVED"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
