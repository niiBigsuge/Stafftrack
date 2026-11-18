"use client";

import { useState } from "react";
import {
  createDepartment,
  updateDepartmentManager,
  assignUserDepartment,
  createStaffAccount,
} from "@/app/actions/admin";
import {
  Building2,
  Users,
  UserCheck,
  UserPlus,
  Plus,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Key,
} from "lucide-react";

interface DepartmentData {
  id: string;
  name: string;
  managerId: string | null;
  users: Array<{
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    jobTitle: string | null;
  }>;
}

interface UserSummary {
  id: string;
  fullName: string;
  employeeCode: string;
  role: string;
  departmentId: string | null;
  jobTitle: string | null;
}

interface DepartmentsClientViewProps {
  departments: DepartmentData[];
  users: UserSummary[];
}

export function DepartmentsClientView({
  departments,
  users,
}: DepartmentsClientViewProps) {
  const [newDeptName, setNewDeptName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(
    null
  );

  // New Staff Registration State
  const [isRegisteringStaff, setIsRegisteringStaff] = useState(false);
  const [newStaffFullName, setNewStaffFullName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffCode, setNewStaffCode] = useState("");
  const [newStaffJobTitle, setNewStaffJobTitle] = useState("");
  const [newStaffDeptId, setNewStaffDeptId] = useState("none");
  const [newStaffRole, setNewStaffRole] = useState("STAFF");
  const [newStaffPassword, setNewStaffPassword] = useState("devos123");

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringStaff(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("fullName", newStaffFullName.trim());
    formData.append("email", newStaffEmail.trim());
    if (newStaffCode.trim()) formData.append("employeeCode", newStaffCode.trim());
    if (newStaffJobTitle.trim()) formData.append("jobTitle", newStaffJobTitle.trim());
    formData.append("departmentId", newStaffDeptId);
    formData.append("role", newStaffRole);
    formData.append("initialPassword", newStaffPassword);

    const res = await createStaffAccount(formData);
    if (res.error) {
      setFeedback({ error: res.error });
    } else {
      setFeedback({
        success: `Account created for ${newStaffFullName.trim()} (${newStaffEmail.trim()}). Credentials: Password="${newStaffPassword}".`,
      });
      setNewStaffFullName("");
      setNewStaffEmail("");
      setNewStaffCode("");
      setNewStaffJobTitle("");
      setNewStaffDeptId("none");
      setNewStaffRole("STAFF");
      setNewStaffPassword("devos123");
    }
    setIsRegisteringStaff(false);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await createDepartment(newDeptName.trim());
    if (res.error) {
      setFeedback({ error: res.error });
    } else {
      setFeedback({ success: `Department "${newDeptName.trim()}" created successfully.` });
      setNewDeptName("");
    }
    setIsSubmitting(false);
  };

  const handleUpdateManager = async (deptId: string, managerId: string) => {
    setFeedback(null);
    const targetManagerId = managerId === "none" ? null : managerId;
    const res = await updateDepartmentManager(deptId, targetManagerId);
    if (res.error) {
      setFeedback({ error: res.error });
    } else {
      setFeedback({ success: "Department head assignment updated." });
    }
  };

  const handleAssignUser = async (userId: string, deptId: string) => {
    setFeedback(null);
    const targetDeptId = deptId === "none" ? null : deptId;
    const res = await assignUserDepartment(userId, targetDeptId);
    if (res.error) {
      setFeedback({ error: res.error });
    } else {
      setFeedback({ success: "Staff department assignment updated." });
    }
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

      {/* 1. Create New Department Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Creation Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Create New Department
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Establish an operational unit to group staff and route attendance workflows.
          </p>

          <form onSubmit={handleCreateDept} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="e.g. Finance & Accounting, Logistics"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile disabled:opacity-50 transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? "Creating..." : "Add Department"}</span>
            </button>
          </form>
        </div>

        {/* Staff Account Registration Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Create Staff & Employee Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Register new personnel with email, role, and immediate department placement.
          </p>

          <form onSubmit={handleCreateStaff} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kmensah@stafftrack.local"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Employee Code</label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={newStaffCode}
                  onChange={(e) => setNewStaffCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={newStaffJobTitle}
                  onChange={(e) => setNewStaffJobTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newStaffDeptId}
                  onChange={(e) => setNewStaffDeptId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <option value="STAFF">Staff Member</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="HR_OFFICER">HR Officer</option>
                  <option value="HR_DIRECTOR">HR Director</option>
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs font-mono text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  />
                  <Key className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isRegisteringStaff}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 btn-tactile disabled:opacity-50 transition whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>{isRegisteringStaff ? "Registering Staff..." : "Register Staff Member"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Existing Departments & Department Head Assignment */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Active Departments & Department Heads
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Assign Department Heads to authorize reviews and team roster visibility.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {departments.map((dept) => {
            const currentHead = users.find((u) => u.id === dept.managerId);
            return (
              <div key={dept.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                      {dept.users.length} members
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    Current Head:{" "}
                    <strong className="text-slate-800">
                      {currentHead ? `${currentHead.fullName} (${currentHead.employeeCode})` : "None Assigned"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor={`manager-${dept.id}`} className="text-xs text-slate-600 font-medium whitespace-nowrap">
                    Assign Head:
                  </label>
                  <select
                    id={`manager-${dept.id}`}
                    defaultValue={dept.managerId || "none"}
                    onChange={(e) => handleUpdateManager(dept.id, e.target.value)}
                    className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <option value="none">-- No Department Head --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeCode} - {u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Assign Staff Members to Departments */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-700" aria-hidden="true" />
            Staff Member Department Membership
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Map employees to their respective departments for live board filtering and CSV grouping.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">System Role</th>
                <th className="px-6 py-3">Assigned Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-semibold text-slate-900">{u.fullName}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{u.employeeCode}</td>
                  <td className="px-6 py-3.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      defaultValue={u.departmentId || "none"}
                      onChange={(e) => handleAssignUser(u.id, e.target.value)}
                      className="rounded-lg border border-slate-300 py-1 px-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <option value="none">-- Unassigned --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
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
