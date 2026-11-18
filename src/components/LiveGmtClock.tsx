"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveGmtClock() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}:${seconds} GMT`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-700">
      <Clock className="h-3 w-3 text-emerald-600 animate-pulse" aria-hidden="true" />
      <span className="tabular-nums font-semibold">{timeStr || "--:--:-- GMT"}</span>
    </div>
  );
}
