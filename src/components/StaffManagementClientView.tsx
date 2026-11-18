"use client";

import { useState } from "react";
import { createStaffAccount } from "@/app/actions/admin";
import { UserPlus, Key, CheckCircle2, AlertCircle, Users, Briefcase } from "lucide-react";

interface DepartmentOption {
  id: string;
  name: string;
}

interface StaffManagementClientViewProps {
  departments: DepartmentOption[];
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    employeeCode: string;
    role: string;
    department: { name: string } | null;
    jobTitle: string | null;
    isActive: boolean;
  }>;
}

export function StaffManagementClientView({
  departments,
  users,
}: StaffManagementClientViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("none");
  const [role, setRole] = useState("STAFF");
  const [initialPassword, setInitialPassword] = useState("00000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("email", email.trim());
    if (employeeCode.trim()) formData.append("employeeCode", employeeCode.trim());
    if (jobTitle.trim()) formData.append("jobTitle", jobTitle.trim());
    formData.append("departmentId", departmentId);
    formData.append("role", role);
    formData.append("initialPassword", initialPassword);

    const res = await createStaffAccount(formData);
    if (res.error) {
      setFeedback({ error: res.error });
    } else {
      setFeedback({
        success: `Account created successfully for ${fullName.trim()} (${email.trim()}). Temporary Password: "${initialPassword}".`,
      });
      setFullName("");
      setEmail("");
      setEmployeeCode("");
      setJobTitle("");
      setDepartmentId("none");
      setRole("STAFF");
      setInitialPassword("00000");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-xs font-medium ${
            feedback.error
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback.error ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          )}
          <span>{feedback.error || feedback.success}</span>
        </div>
      )}

      {/* Staff Account Registration Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-slate-700" aria-hidden="true" />
          Create New Staff & Employee Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Provision official credentials, assign institutional roles, and designate employee department membership.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kwame Mensah"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. kmensah@stafftrack.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Code
              </label>
              <input
                type="text"
                placeholder="Auto-assigned if blank (e.g. EMP-008)"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title / Position
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Assignment
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="none">-- Unassigned --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Role & Authorization Tier
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="STAFF">Staff Member</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="HR_OFFICER">HR Officer</option>
                <option value="HR_DIRECTOR">HR Director</option>
                <option value="SYSTEM_ADMIN">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Temporary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs font-mono text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
                <Key className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile disabled:opacity-50 transition"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? "Creating Account..." : "Create Staff Account"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Directory of Staff Members */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" aria-hidden="true" />
              Employee Directory & Staff Records
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Active company personnel, roles, and departmental placements.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {users.length} Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Work Email</th>
                <th className="px-6 py-3">Employee Code</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">System Role</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    <div>{u.fullName}</div>
                    {u.jobTitle && (
                      <div className="text-[11px] text-slate-500 font-normal">{u.jobTitle}</div>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{u.employeeCode}</td>
                  <td className="px-6 py-3.5 text-slate-700 font-medium">
                    {u.department?.name || (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
