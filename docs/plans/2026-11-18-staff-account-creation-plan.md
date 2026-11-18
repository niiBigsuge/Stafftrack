# StaffTrack Implementation Plan: Staff & Employee Account Creation Workflow

## 1. Context & Objectives
StaffTrack v2 enables department creation and assigning existing personnel to departments, but currently lacks an interactive UI for administrators or HR officers to create new staff accounts with immediate department, role, employee code, and temporary password assignments.

This plan delivers:
1. Server action `createStaffAccount` in `src/app/actions/admin.ts` with validation (Zod), duplicate email/employeeCode checks, password hashing via `bcryptjs`, and immutable audit logging.
2. A tabbed or unified administrative UI in `src/components/DepartmentsClientView.tsx` (or a dedicated staff management view accessible under `/admin/departments` and `/admin/users`) enabling HR Officers and System Admins to register new staff with department assignment.
3. Auto-generation helper for unique employee codes (e.g. `EMP-xxx`).
4. Typecheck, tests, and Dev-OS mechanical audit passes.

---

## 2. Implementation Steps

### Step 1: Server Action & Business Logic (`TASK-STAFF-001`)
- Add `createStaffAccount(formData: FormData)` in `src/app/actions/admin.ts`.
- Gate access to `Role.HR_OFFICER` and `Role.SYSTEM_ADMIN`.
- Form fields:
  - `fullName`: string, min 2 chars.
  - `email`: valid email string, unique check against database.
  - `employeeCode`: string (or auto-assigned if blank), unique check.
  - `jobTitle`: optional string.
  - `departmentId`: optional string (foreign key to `Department`).
  - `role`: enum `Role` (`STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN` - with non-System Admins restricted from provisioning `SYSTEM_ADMIN`).
  - `initialPassword`: string, min 6 chars (hashed with `bcrypt.hash(password, 10)`).
- Create immutable audit log entry `CREATE_STAFF_ACCOUNT`.
- Revalidate paths `/admin/departments`, `/admin/settings`, `/admin/live-board`, `/admin/reports`.

### Step 2: Interactive UI Form (`TASK-STAFF-002`)
- Update `src/components/DepartmentsClientView.tsx` with a "Register New Staff Member" section/modal.
- Provide input fields with tactile feedback, department dropdown populated from active departments, role selector, and clear confirmation message displaying the generated credentials for staff onboarding.
- Adhere strictly to `DESIGN.md` and `anti-ai-ui` principles.

### Step 3: Verification & Quality Gate (`TASK-STAFF-003`)
- `npx tsc --noEmit` (0 errors).
- `npx vitest run` (all tests pass).
- Layer 2 mechanical scanners: `ui-taste-check.sh`, `env-check.sh`, `humanize-check.sh`.
- Staged review and human commit gate via `.agents/scripts/commit.sh`.
