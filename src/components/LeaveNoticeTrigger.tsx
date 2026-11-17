"use client";

import { useState } from "react";
import { LeaveNoticeModal } from "@/components/LeaveNoticeModal";
import { CalendarRange } from "lucide-react";

export function LeaveNoticeTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 btn-tactile transition"
      >
        <CalendarRange className="h-4 w-4 text-slate-600" aria-hidden="true" />
        <span>Submit Leave / Field Duty Notice</span>
      </button>

      <LeaveNoticeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
