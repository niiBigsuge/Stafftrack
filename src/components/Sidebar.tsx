"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LiveGmtClock } from "@/components/LiveGmtClock";
import {
  Clock,
  LayoutDashboard,
  Users,
  BarChart3,
  Inbox,
  ShieldCheck,
  History,
  TrendingUp,
  Building2,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import type { Role } from "@/types";

interface SidebarProps {
  session: {
    userId: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: Role;
    departmentId?: string | null;
    jobTitle?: string | null;
  } | null;
  departmentName?: string | null;
}

export function Sidebar({ session, departmentName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  const role = session.role;
  const isDepartmentHead = role === "DEPARTMENT_HEAD";
  const isHROfficer = role === "HR_OFFICER";
  const isHRDirector = role === "HR_DIRECTOR";
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  const isStaff = role === "STAFF";

  const navLinks = [
    // Staff Portal / Main Workspace
    ...(!isSystemAdmin
      ? [
          {
            name: "Workspace",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),

    // Department Head Inbox
    ...(isDepartmentHead
      ? [
          {
            name: "Team Requests",
            href: "/manager/requests",
            icon: Inbox,
          },
        ]
      : []),

    // HR Director Executive Suite
    ...(isHRDirector
      ? [
          {
            name: "Executive Suite",
            href: "/director",
            icon: TrendingUp,
          },
        ]
      : []),

    // HR Officer Inbox
    ...(isHROfficer
      ? [
          {
            name: "HR Approval Inbox",
            href: "/hr/requests",
            icon: Inbox,
          },
          {
            name: "Audit Trail",
            href: "/hr/audit",
            icon: History,
          },
        ]
      : []),

    // Live Attendance Board
    ...(!isStaff
      ? [
          {
            name: isDepartmentHead ? "Team Attendance Roster" : "Live Attendance Board",
            href: "/admin/live-board",
            icon: Users,
          },
        ]
      : []),

    // Reports & Scorecards
    ...(!isStaff
      ? [
          {
            name: "Scorecards & Reports",
            href: "/admin/reports",
            icon: BarChart3,
          },
        ]
      : []),

    // Personnel & Department Management (Staff before Departments)
    ...(isHRDirector || isHROfficer || isSystemAdmin
      ? [
          {
            name: "Staff",
            href: "/admin/staff",
            icon: UserPlus,
          },
          {
            name: "Departments",
            href: "/admin/departments",
            icon: Building2,
          },
        ]
      : []),

    // System Administration
    ...(isSystemAdmin
      ? [
          {
            name: "System Controls",
            href: "/admin/settings",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  const NavContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <Link
            href={
              isHRDirector
                ? "/director"
                : isSystemAdmin
                ? "/admin/settings"
                : isHROfficer
                ? "/hr/requests"
                : isDepartmentHead
                ? "/manager/requests"
                : "/dashboard"
            }
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950">StaffTrack</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Attendance OS
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pages
          </div>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sticky Header Bar */}
      <div className="no-print sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="font-bold text-sm text-slate-900">StaffTrack</span>
        </div>

        <div className="flex items-center gap-2">
          <LiveGmtClock />
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 max-w-[80%] flex-1 flex-col bg-white shadow-xl">
            {NavContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Vertical Sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white md:block">
        {NavContent}
      </aside>
    </>
  );
}
