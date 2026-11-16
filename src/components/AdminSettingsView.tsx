"use client";

import { useState } from "react";
import { updateCompanyPolicy } from "@/app/actions/admin";
import {
  Settings,
  History,
  Activity,
  Save,
  CheckCircle2,
  Database,
  Server,
} from "lucide-react";

interface AdminSettingsViewProps {
  policy: {
    workStartTime: string;
    workEndTime: string;
    graceMinutes: number;
    workingDays: string;
  };
  auditLogs: Array<{
    id: string;
    action: string;
    targetEntity: string;
    targetId: string;
    details: string | null;
    createdAt: Date;
    actor: {
      fullName: string;
      email: string;
    };
  }>;
  systemHealth: {
    databaseStatus: string;
    databaseEngine: string;
    databaseHost: string;
    totalUsersCount: number;
    totalRecordsCount: number;
    totalRequestsCount: number;
    activePolicyId: string;
    nodeVersion: string;
    uptimeSeconds: number;
  };
}

export function AdminSettingsView({
  policy,
  auditLogs,
  systemHealth,
}: AdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"POLICY" | "AUDIT" | "HEALTH">("POLICY");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  const handlePolicySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    setPolicyMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append("workingDays", "MON");
    formData.append("workingDays", "TUE");
    formData.append("workingDays", "WED");
    formData.append("workingDays", "THU");
    formData.append("workingDays", "FRI");

    const res = await updateCompanyPolicy(formData);
    if (res?.error) {
      setPolicyMessage(`Error: ${res.error}`);
    } else {
      setPolicyMessage("Company attendance policy successfully updated!");
    }
    setIsSavingPolicy(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("POLICY")}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
            activeTab === "POLICY"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span>Attendance Rules & Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
            activeTab === "AUDIT"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" aria-hidden="true" />
          <span>Technical Audit Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HEALTH")}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition whitespace-nowrap ${
            activeTab === "HEALTH"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          <span>System Health & Info</span>
        </button>
      </div>

      {/* Tab 1: Attendance Rules & Policy */}
      {activeTab === "POLICY" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-950">Official Schedule & Punctuality Policy</h2>
            <p className="text-xs text-slate-500">
              Configure global reporting times, grace thresholds, and shift conclusion times.
            </p>
          </div>

          {policyMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>{policyMessage}</span>
            </div>
          )}

          <form onSubmit={handlePolicySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Work Start Time (HH:MM:SS)
                </label>
                <input
                  type="text"
                  name="workStartTime"
                  defaultValue={policy.workStartTime}
                  required
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                  placeholder="08:30:00"
                  className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Grace Window (Minutes)
                </label>
                <input
                  type="number"
                  name="graceMinutes"
                  defaultValue={policy.graceMinutes}
                  required
                  min={0}
                  max={60}
                  className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Work End Time (HH:MM:SS)
              </label>
              <input
                type="text"
                name="workEndTime"
                defaultValue={policy.workEndTime}
                required
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                placeholder="17:00:00"
                className="mt-1 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPolicy}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isSavingPolicy ? "Saving Policy..." : "Save Policy Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Technical Audit Logs */}
      {activeTab === "AUDIT" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-bold text-slate-950">Technical & Administrative Audit Logs</h2>
            <p className="text-xs text-slate-500">Immutable trace of system-level actions and mutations.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No audit log entries recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">
                        Actor: <strong>{log.actor.fullName}</strong> ({log.actor.email})
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
      )}

      {/* Tab 3: System Health & Info */}
      {activeTab === "HEALTH" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="h-5 w-5 text-slate-800" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">Database Engine & Connectivity</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database Engine:</span>
                <strong className="text-slate-900">{systemHealth.databaseEngine}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Connection Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {systemHealth.databaseStatus}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Host & Schema:</span>
                <span className="font-mono text-slate-800">{systemHealth.databaseHost}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total User Records:</span>
                <span className="font-mono font-bold text-slate-900">{systemHealth.totalUsersCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Attendance Log Entries:</span>
                <span className="font-mono font-bold text-slate-900">{systemHealth.totalRecordsCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Correction Requests Stored:</span>
                <span className="font-mono font-bold text-slate-900">{systemHealth.totalRequestsCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="h-5 w-5 text-slate-800" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">Runtime & Application Environment</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Node.js Runtime:</span>
                <span className="font-mono text-slate-800">{systemHealth.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Next.js Architecture:</span>
                <span className="text-slate-900 font-medium">15 (App Router, React 19)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Policy ID:</span>
                <span className="font-mono text-slate-700">{systemHealth.activePolicyId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Process Uptime:</span>
                <span className="font-mono text-slate-800">{systemHealth.uptimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">System Role:</span>
                <span className="text-slate-900 font-semibold">Technical Super Admin (Rules, Audit, Health)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
