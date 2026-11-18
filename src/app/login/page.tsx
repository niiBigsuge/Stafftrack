"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import { Clock, ShieldCheck, ArrowRight, Lock, Mail, Users } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("00000");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
            Sign in to StaffTrack
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Corporate Attendance and Punctuality Management System
          </p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800" role="alert">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Corporate Email Address
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 btn-tactile disabled:opacity-60"
          >
            {isPending ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Switcher (for human testing) */}
        <div className="border-t border-slate-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Quick Demo Accounts (Click to Fill)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials("superadmin@stafftrack.local")}
              className="rounded-md border border-slate-900 bg-slate-900 text-white p-2 text-left hover:bg-slate-800 transition col-span-2 sm:col-span-1"
            >
              <div className="font-semibold text-white flex items-center justify-between">
                <span>Super Admin</span>
                <span className="text-[10px] bg-slate-800 px-1 rounded">ALL</span>
              </div>
              <div className="text-slate-300 text-[11px]">Alexander Vance (EMP-000)</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("admin@stafftrack.local")}
              className="rounded-md border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <div className="font-semibold text-slate-900">HR Director</div>
              <div className="text-slate-500 text-[11px]">Marcus Sterling (Admin)</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("manager@stafftrack.local")}
              className="rounded-md border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <div className="font-semibold text-slate-900">Dept Manager</div>
              <div className="text-slate-500 text-[11px]">Elena Rostova (Engineering)</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("staff@stafftrack.local")}
              className="rounded-md border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <div className="font-semibold text-slate-900">Staff Member</div>
              <div className="text-slate-500 text-[11px]">Tariq Adeleke (EMP-003)</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("exec@stafftrack.local")}
              className="rounded-md border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <div className="font-semibold text-slate-900">Executive CEO</div>
              <div className="text-slate-500 text-[11px]">Victoria Hastings</div>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-center text-slate-400">Default Password: <code>00000</code></p>
        </div>
      </div>
    </div>
  );
}
