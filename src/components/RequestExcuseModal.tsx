"use client";

import { useState } from "react";
import { submitAttendanceRequest } from "@/app/actions/attendance";
import { FileText, Send, X } from "lucide-react";
import type { RequestType } from "@/types";

interface RequestExcuseModalProps {
  recordId?: string;
  defaultDate?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestExcuseModal({ recordId, defaultDate, isOpen, onClose }: RequestExcuseModalProps) {
  const [requestType, setRequestType] = useState<RequestType>("LATE_EXCUSE");
  const [reason, setReason] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (recordId) formData.append("recordId", recordId);
    formData.append("requestType", requestType);
    formData.append("requestedDate", defaultDate || new Date().toISOString().split("T")[0]);
    if (proposedTime) formData.append("proposedTime", proposedTime);
    formData.append("reason", reason);

    const res = await submitAttendanceRequest(formData);
    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-700" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Attendance Explanation / Correction Request</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Request Category
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as RequestType)}
              className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="LATE_EXCUSE">Lateness Explanation / Excuse Request</option>
              <option value="MISSING_CLOCK_IN">Missing Clock-In Adjustment</option>
              <option value="MISSING_CLOCK_OUT">Missing Clock-Out Adjustment</option>
            </select>
          </div>

          {(requestType === "MISSING_CLOCK_IN" || requestType === "MISSING_CLOCK_OUT") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Proposed Actual Time
              </label>
              <input
                type="datetime-local"
                required
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Detailed Justification / Reason
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a factual justification for review by your Department Manager and HR..."
              className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition btn-tactile disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSubmitting ? "Submitting..." : "Submit to Manager"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
