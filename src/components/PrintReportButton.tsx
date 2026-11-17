"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="no-print inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 btn-tactile transition"
      title="Open print preview or save report as PDF"
    >
      <Printer className="h-4 w-4 text-slate-600" aria-hidden="true" />
      <span>Print / Save as PDF</span>
    </button>
  );
}
