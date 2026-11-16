"use client";

import { useState } from "react";
import { RequestExcuseModal } from "./RequestExcuseModal";
import type { AttendanceStatus } from "@/types";
import { CheckCircle2, AlertTriangle, XCircle, FileQuestion, MessageSquare } from "lucide-react";

interface RecordItem {
  id: string;
  recordDate: Date;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  status: AttendanceStatus;
  minutesLate: number;
  totalWorkMinutes: number | null;
  isExcused: boolean;
  staffRemarks: string | null;
}

export function AttendanceTable({ records }: { records: RecordItem[] }) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openExcuseModal = (recordId: string, date: Date) => {
    setSelectedRecordId(recordId);
    setSelectedDate(new Date(date).toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Personal Attendance History</h2>
          <p className="text-xs text-slate-500">Trailing records and punctuality determinations</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedRecordId(undefined);
            setSelectedDate(new Date().toISOString().split("T")[0]);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 btn-tactile transition"
        >
          <FileQuestion className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Report Missing Punch</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Arrival (In)</th>
              <th className="px-6 py-3">Departure (Out)</th>
              <th className="px-6 py-3">Hours</th>
              <th className="px-6 py-3">Punctuality Status</th>
              <th className="px-6 py-3">Remarks / Excuse</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                  No attendance records recorded yet. Clock in to establish your attendance history.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const hours = r.totalWorkMinutes ? (r.totalWorkMinutes / 60).toFixed(1) : "--";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(r.recordDate)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-slate-700">
                      {formatTime(r.clockInTime)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-slate-700">
                      {formatTime(r.clockOutTime)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-slate-700">
                      {hours !== "--" ? `${hours} hrs` : "--"}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {r.status === "PRESENT_ON_TIME" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          On Time
                        </span>
                      ) : r.status === "PRESENT_LATE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          Late ({r.minutesLate}m)
                          {r.isExcused && (
                            <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] text-sky-800">Excused</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {r.staffRemarks || (r.isExcused ? "Excused by manager" : "--")}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      {r.status === "PRESENT_LATE" && !r.isExcused && (
                        <button
                          type="button"
                          onClick={() => openExcuseModal(r.id, r.recordDate)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-600 underline"
                        >
                          <MessageSquare className="h-3 w-3" aria-hidden="true" />
                          Explain Lateness
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <RequestExcuseModal
        recordId={selectedRecordId}
        defaultDate={selectedDate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
