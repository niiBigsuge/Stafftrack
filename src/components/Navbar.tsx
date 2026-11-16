import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import {
  Clock,
  Users,
  BarChart3,
  Inbox,
  LogOut,
  ShieldCheck,
  History,
  TrendingUp,
} from "lucide-react";

export async function Navbar() {
  const session = await getSession();

  if (!session) return null;

  const role = session.role;
  const isManager = role === "MANAGER";
  const isStaffOrManager = role === "STAFF" || role === "MANAGER";
  const isHRAdmin = role === "HR_ADMIN";
  const isExecutive = role === "EXECUTIVE";
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={isExecutive ? "/ceo" : isSuperAdmin ? "/admin/settings" : "/dashboard"}
            className="flex items-center gap-2.5 font-semibold text-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950">StaffTrack</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Attendance OS</span>
            </div>
          </Link>

          {/* Navigation Links tailored per Portal & Role */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Staff Portal (Staff, Managers, HR Director) */}
            {!isExecutive && (
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Staff Portal
              </Link>
            )}

            {/* CEO Executive Suite */}
            {isExecutive && (
              <Link
                href="/ceo"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <TrendingUp className="h-4 w-4 text-slate-600" aria-hidden="true" />
                <span>CEO Executive Suite</span>
              </Link>
            )}

            {/* HR Director Portals (Routine Attendance Approval Inbox & Audit) */}
            {isHRAdmin && (
              <>
                <Link
                  href="/hr/requests"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Inbox className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>HR Approval Inbox</span>
                </Link>

                <Link
                  href="/hr/audit"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <History className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>Audit History</span>
                </Link>
              </>
            )}

            {/* Live Attendance Roster (Manager, HR Director, Super Admin, CEO) */}
            {(isHRAdmin || isExecutive || isSuperAdmin || isManager) && (
              <Link
                href="/admin/live-board"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>{isManager ? "Team Attendance Roster" : "Live Roster"}</span>
              </Link>
            )}

            {/* Shared Scorecards & Reports (HR, CEO, Super Admin) */}
            {(isHRAdmin || isExecutive || isSuperAdmin) && (
              <Link
                href="/admin/reports"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <BarChart3 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Scorecards & Reports</span>
              </Link>
            )}

            {/* Super Admin Technical Administration (Excluded from routine approvals) */}
            {isSuperAdmin && (
              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-slate-700" aria-hidden="true" />
                <span>System Controls</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Workspace Profile Menu */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">{session.fullName}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs text-slate-500 font-mono">{session.employeeCode}</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {session.role}
                </span>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition btn-tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
