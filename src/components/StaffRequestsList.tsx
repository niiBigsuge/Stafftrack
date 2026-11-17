"use client";

import type { RequestStatus, RequestType } from "@/types";
import { Clock, CheckCircle2, XCircle, MessageSquare, User, Calendar } from "lucide-react";

interface SubmittedRequest {
  id: string;
  requestType: RequestType;
  requestedDate: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  proposedTime: Date | null;
  reason: string;
  status: RequestStatus;
  reviewerNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  reviewer: {
    fullName: string;
    jobTitle: string | null;
  } | null;
}

export function StaffRequestsList({ requests }: { requests: SubmittedRequest[] }) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
        You have not submitted any punctuality explanations or attendance correction requests yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Submitted Requests & Approval Tracking</h2>
          <p className="text-xs text-slate-500">Track status, reviewer decisions, and HR director feedback comments</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {requests.length} Requests
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {requests.map((req) => (
          <div key={req.id} className="p-6 hover:bg-slate-50/50 transition">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-800">
                    {req.requestType === "LATE_EXCUSE"
                      ? "Lateness Explanation"
                      : req.requestType === "MISSING_CLOCK_IN"
                      ? "Missing Clock-In Adjustment"
                      : req.requestType === "MISSING_CLOCK_OUT"
                      ? "Missing Clock-Out Adjustment"
                      : req.requestType === "LEAVE_NOTICE"
                      ? "Advance Leave Notice"
                      : "Field Duty Assignment"}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {req.startDate && req.endDate ? (
                      <>
                        Range: <strong className="text-slate-900">{formatDate(req.startDate)} - {formatDate(req.endDate)}</strong>
                      </>
                    ) : (
                      <>
                        Target Date: <strong className="text-slate-900">{formatDate(req.requestedDate || req.startDate)}</strong>
                      </>
                    )}
                  </span>
                  {req.proposedTime && (
                    <>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">
                        Proposed Time: <strong className="text-slate-900">{formatTime(req.proposedTime)}</strong>
                      </span>
                    </>
                  )}
                </div>

                {/* Submitted Reason */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                  <div className="font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    Your Explanation / Request:
                  </div>
                  &ldquo;{req.reason}&rdquo;
                </div>

                {/* Reviewer Comments (if reviewed) */}
                {req.status !== "PENDING" && (
                  <div
                    className={`rounded-lg border p-3 text-xs ${
                      req.status === "APPROVED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-rose-200 bg-rose-50 text-rose-900"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {req.status === "APPROVED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
                      )}
                      <span>
                        {req.status === "APPROVED" ? "Approved by HR Director" : "Declined by HR Director"}
                        {req.reviewer?.fullName ? ` (${req.reviewer.fullName})` : ""}
                      </span>
                    </div>
                    {req.reviewerNote ? (
                      <div className="mt-1 text-slate-800">
                        <strong>Approval Comment:</strong> &ldquo;{req.reviewerNote}&rdquo;
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">No additional review note attached.</div>
                    )}
                    {req.reviewedAt && (
                      <div className="mt-1 text-[10px] text-slate-500 font-mono">
                        Reviewed on {new Date(req.reviewedAt).toLocaleString("en-US")}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                {req.status === "PENDING" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    Pending HR Decision
                  </span>
                ) : req.status === "APPROVED" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    Approved & Excused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                    Rejected
                  </span>
                )}
                <span className="mt-1 text-[10px] text-slate-400 font-mono">
                  Submitted {formatDate(req.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
