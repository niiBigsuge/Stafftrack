"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/app/actions/attendance";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Calendar,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { AttendanceStatus } from "@/types";

interface ClockCardProps {
  todayRecord: {
    id: string;
    clockInTime: Date | null;
    clockOutTime: Date | null;
    status: AttendanceStatus;
    minutesLate: number;
    totalWorkMinutes: number | null;
    isExcused: boolean;
    staffRemarks: string | null;
  } | null;
  policy: {
    workStartTime: string;
    workEndTime: string;
    graceMinutes: number;
  };
}

export function ClockCard({ todayRecord, policy }: ClockCardProps) {
  const router = useRouter();
  const [currentRecord, setCurrentRecord] = useState(todayRecord);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lateRemark, setLateRemark] = useState("");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);

  // Sync prop changes into state
  useEffect(() => {
    setCurrentRecord(todayRecord);
  }, [todayRecord]);

  // Update clock every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute whether current time is on or after the official closing time
  const [closeH = 17, closeM = 0, closeS = 0] = policy.workEndTime.split(":").map(Number);
  const closingSeconds = closeH * 3600 + closeM * 60 + closeS;
  const currentSeconds = currentTime
    ? currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds()
    : 0;
  const isAfterClosing = currentSeconds >= closingSeconds;

  const handleClockIn = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await clockIn(lateRemark);
      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        const inTime = res.clockInTime ? new Date(res.clockInTime) : new Date();
        setCurrentRecord({
          id: res.recordId || "new-record",
          clockInTime: inTime,
          clockOutTime: null,
          status: res.status as AttendanceStatus,
          minutesLate: res.minutesLate || 0,
          totalWorkMinutes: null,
          isExcused: false,
          staffRemarks: lateRemark || null,
        });

        setFeedback({
          success:
            res.status === "PRESENT_ON_TIME"
              ? "Clocked in on time! Button changed to Clock Out for departure."
              : `Clocked in late by ${res.minutesLate} minutes. Button changed to Clock Out for departure.`,
        });

        router.refresh();
      }
    } catch (e: any) {
      setFeedback({ error: "Failed to record clock-in. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await clockOut();
      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        const outTime = res.clockOutTime ? new Date(res.clockOutTime) : new Date();
        setCurrentRecord((prev) =>
          prev
            ? {
                ...prev,
                clockOutTime: outTime,
                totalWorkMinutes: res.durationMinutes || 0,
              }
            : null
        );

        setFeedback({
          success: `Clocked out successfully at ${formatTime(outTime)}. Total shift duration: ${res.durationMinutes} minutes.`,
        });

        router.refresh();
      }
    } catch (e: any) {
      setFeedback({ error: "Failed to record clock-out." });
    } finally {
      setIsSubmitting(false);
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Today&apos;s Schedule Policy
          </span>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-700">
            <span>
              Official Shift: <strong className="text-slate-900">{policy.workStartTime}</strong> –{" "}
              <strong className="text-slate-900">{policy.workEndTime}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Grace Threshold: <strong className="text-slate-900">{policy.graceMinutes} mins</strong>
            </span>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <Clock className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <span className="font-mono text-xl font-bold tracking-tight text-slate-950 tabular-nums">
            {currentTime ? currentTime.toLocaleTimeString("en-US", { hour12: true }) : "Loading..."}
          </span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback?.error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {feedback.error}
        </div>
      )}
      {feedback?.success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {feedback.success}
        </div>
      )}

      {/* Main Status & Action Area */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attendance Status For Today
          </div>

          {!currentRecord || !currentRecord.clockInTime ? (
            <div className="mt-2 flex items-center gap-2 text-slate-600">
              <span className="inline-block h-3 w-3 rounded-full bg-slate-300" />
              <span className="text-base font-medium">Not Clocked In Yet</span>
            </div>
          ) : currentRecord.status === "PRESENT_ON_TIME" ? (
            <div className="mt-2 flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span className="text-base font-bold">Present — On Time</span>
              <span className="text-xs font-mono text-slate-500">
                (Clocked in at {formatTime(currentRecord.clockInTime)})
              </span>
            </div>
          ) : currentRecord.status === "PRESENT_LATE" ? (
            <div className="mt-2 flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              <span className="text-base font-bold">Present — Late ({currentRecord.minutesLate} mins)</span>
              {currentRecord.isExcused && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                  Excused
                </span>
              )}
              <span className="text-xs font-mono text-slate-500">
                (Clocked in at {formatTime(currentRecord.clockInTime)})
              </span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              <span className="text-base font-bold">{currentRecord.status}</span>
            </div>
          )}

          {/* Clock Out completion note */}
          {currentRecord?.clockOutTime && (
            <div className="mt-1 text-xs text-slate-600 font-mono">
              Clocked out at {formatTime(currentRecord.clockOutTime)} • Total Shift:{" "}
              {currentRecord.totalWorkMinutes} mins
            </div>
          )}

          {/* Active Shift & Closing time indicator */}
          {currentRecord?.clockInTime && !currentRecord?.clockOutTime && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {isAfterClosing ? (
                <span className="text-emerald-700 font-medium">
                  Official shift concluded at {policy.workEndTime}. You may clock out now.
                </span>
              ) : (
                <span>
                  Official closing time is <strong className="text-slate-700">{policy.workEndTime}</strong>.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Seamless state transition from Clock In -> Clock Out */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 1. If not clocked in: show Clock In button */}
          {!currentRecord?.clockInTime && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleClockIn}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{isSubmitting ? "Recording..." : "Clock In"}</span>
              </button>
            </div>
          )}

          {/* 2. After clocking in, button switches to Clock Out so staff can clock out on or after closing time */}
          {currentRecord?.clockInTime && !currentRecord?.clockOutTime && (
            <button
              type="button"
              onClick={handleClockOut}
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm btn-tactile disabled:opacity-50 transition ${
                isAfterClosing
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white ring-2 ring-emerald-500 ring-offset-2"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? "Recording..."
                  : isAfterClosing
                  ? "Clock Out (Shift Complete)"
                  : "Clock Out"}
              </span>
            </button>
          )}

          {/* 3. If clocked out: show Shift Complete badge */}
          {currentRecord?.clockOutTime && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-800 text-center flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Shift Complete For Today</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
