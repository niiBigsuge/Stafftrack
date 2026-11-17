"use client";

import { useState } from "react";
import { submitAttendanceRequest } from "@/app/actions/attendance";
import { CalendarRange, Send, X, AlertCircle } from "lucide-react";
import type { RequestType } from "@/types";

interface LeaveNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveNoticeModal({ isOpen, onClose }: LeaveNoticeModalProps) {
  const [requestType, setRequestType] = useState<RequestType>("LEAVE_NOTICE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      setIsSubmitting(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("requestType", requestType);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("reason", reason);

    const res = await submitAttendanceRequest(formData);
    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      setReason("");
      setStartDate("");
      setEndDate("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-slate-700" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              {requestType === "LEAVE_NOTICE" ? "Submit Advance Leave Notice" : "Record Field Duty Assignment"}
            </h2>
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
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Request Category
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestType("LEAVE_NOTICE")}
                className={`rounded-lg border p-2.5 text-xs font-semibold transition ${
                  requestType === "LEAVE_NOTICE"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Advance Leave Notice
              </button>
              <button
                type="button"
                onClick={() => setRequestType("FIELD_ASSIGNMENT")}
                className={`rounded-lg border p-2.5 text-xs font-semibold transition ${
                  requestType === "FIELD_ASSIGNMENT"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Field Assignment
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {requestType === "LEAVE_NOTICE"
                ? "Once approved, automatic night reconciliation marks attendance as ON LEAVE."
                : "Approved field work will mark attendance as FIELD DUTY, preserving your score."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold text-slate-700">
                Start Date (Inclusive)
              </label>
              <input
                type="date"
                id="startDate"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold text-slate-700">
                End Date (Inclusive)
              </label>
              <input
                type="date"
                id="endDate"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="leaveReason" className="block text-xs font-semibold text-slate-700">
              Reason / Destination & Assignment Details
            </label>
            <textarea
              id="leaveReason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                requestType === "LEAVE_NOTICE"
                  ? "Detail annual leave, medical appointment, or compassionate leave request..."
                  : "Detail client name, site location, and field objective..."
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSubmitting ? "Submitting..." : "Submit Notice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
