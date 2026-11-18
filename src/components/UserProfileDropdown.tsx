"use client";

import { useState, useRef, useEffect } from "react";
import { logout } from "@/app/actions/auth";
import { LiveGmtClock } from "@/components/LiveGmtClock";
import {
  User,
  LogOut,
  ChevronDown,
  Building2,
  BadgeCheck,
  Shield,
  Briefcase,
  Mail,
  Clock,
} from "lucide-react";
import type { Role } from "@/types";

interface UserProfileDropdownProps {
  session: {
    userId: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: Role;
    departmentId?: string | null;
    jobTitle?: string | null;
  };
  departmentName?: string | null;
}

export function UserProfileDropdown({
  session,
  departmentName,
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button on Top Right (Icon-only with chevron arrow) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition btn-tactile"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={session.fullName}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xs">
          {session.fullName.charAt(0).toUpperCase()}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Window containing Live Overview */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* 1. Header with User Identity */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-sm shadow-sm">
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-900 truncate">
                {session.fullName}
              </span>
              <span className="text-xs text-slate-500 truncate flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{session.email}</span>
              </span>
            </div>
          </div>

          {/* 2. Embedded Live Overview Summary Box */}
          <div className="my-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Live Overview
              </span>
              <LiveGmtClock />
            </div>

            <div className="border-t border-slate-200/80 pt-2 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Role Tier:
                </span>
                <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-800">
                  {session.role}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Department:
                </span>
                <span className="font-semibold text-slate-900 truncate max-w-[130px] text-right">
                  {departmentName || (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Position:
                </span>
                <span className="text-slate-800 truncate max-w-[130px] text-right">
                  {session.jobTitle || "Staff Member"}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <BadgeCheck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Employee ID:
                </span>
                <span className="font-mono text-slate-800 text-right">
                  {session.employeeCode}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Action / Logout Button */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition btn-tactile"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
