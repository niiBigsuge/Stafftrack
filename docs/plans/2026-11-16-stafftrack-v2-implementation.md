# StaffTrack v2 — Implementation Plan

**Spec:** `docs/specs/2026-10-30-stafftrack-prd-v2.md`  
**Triage:** CRITICAL (Database schema modification, role hierarchy refactor, and security hardening)  
**Branch:** `feat/stafftrack-v2`  
**Date:** 2026-11-16  

---

## Goal

Upgrade StaffTrack from v1 to v2: implement the 5-tier role hierarchy (`STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN`), strict GMT punctuality calculation with a 5-minute grace window and floor rounding, multi-day leave and field assignment request workflows, secured absence reconciliation, department administration UI, and multi-format Excel (`exceljs`) / printable PDF exports.

---

## Out of Scope

- Self-service password reset via email (System Administrator handles resets).
- GPS, IP geolocation, or biometric clock-in verification.
- Leave balances and payroll deduction engines.
- SMS or automated SMTP email notifications.
- Per-department custom reporting hours (system uses unified company policy).

---

## Files

### Create
- `src/app/director/page.tsx` — HR Director strategic punctuality overview and department leaderboard
- `src/app/api/export/excel/route.ts` — Formatted `.xlsx` export endpoint using `exceljs`
- `src/app/admin/departments/page.tsx` — Department creation and department head assignment portal
- `src/components/LeaveNoticeModal.tsx` — Staff modal for multi-day leave ranges and field duty logs
- `src/components/PrintReportView.tsx` — Print-ready layout for browser PDF generation

### Modify
- `prisma/schema.prisma` — Evolve `Role`, `AttendanceStatus`, `RequestType`, add date ranges and policy attributes
- `prisma/seed.ts` — Update demo accounts to 5 roles and default GMT policy
- `src/types/index.ts` — Update shared TypeScript definitions
- `src/lib/punctuality.ts` — Normalize punctuality to GMT, cutoff = 08:35:00, floor lateness calculation
- `src/lib/punctuality.test.ts` — Comprehensive unit test suite covering exact boundary conditions
- `src/lib/session.ts` — Support 5-tier session roles and authorization helpers
- `src/app/actions/attendance.ts` — GMT clock-in, multi-day request submissions, department-scoped reviews
- `src/app/actions/admin.ts` — Department administration and user provisioning
- `src/app/api/cron/reconcile/route.ts` — CRON_SECRET security guard, leave/duty reconciliation priority
- `src/app/dashboard/page.tsx` — Staff portal with leave/duty submission triggers
- `src/app/manager/requests/page.tsx` — Department Head queue for own department requests
- `src/app/hr/requests/page.tsx` — HR Officer company-wide review queue
- `src/components/ClockCard.tsx` — GMT clock rendering, HR phone assistance on failures
- `src/components/RequestsInbox.tsx` — Support multi-day date intervals and approval notes
- `src/components/Navbar.tsx` — Navigation links mapped to 5 role portals

---

## Steps

### Step 1: Database Baseline & Prisma Schema Evolution (CRITICAL Gate / DBA)
- **Context:** Currently the database has no migration history (`prisma/migrations`).
- **Test first:** Verify database connectivity with `npx prisma db pull`.
- **Change:**
  1. Baseline current schema or generate initial migration: `npx prisma migrate dev --name init_v1_baseline --create-only`.
  2. Update `prisma/schema.prisma`:
     - `Role`: `STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN`
     - `AttendanceStatus`: add `FIELD_DUTY`
     - `RequestType`: add `LEAVE_NOTICE`, `FIELD_ASSIGNMENT`
     - `AttendanceRequest`: add `startDate DateTime? @db.Date` and `endDate DateTime? @db.Date`
     - `CompanyPolicy`: default `graceMinutes = 5`, add `timezone String @default("GMT")`, add `hrContactPhone String @default("+233 20 000 0000")`
  3. Update `prisma/seed.ts` with 5 demo accounts (Staff, Dept Head, HR Officer, HR Director, System Admin) and default GMT policy.
- **Verify:** Run `npx prisma migrate dev --name v2_schema_evolution` and `npx prisma db seed`. Verify tables and columns exist in MySQL.

---

### Step 2: Strict GMT Punctuality Engine (Test-First)
- **Test first:** In `src/lib/punctuality.test.ts`, write unit tests reflecting Decision D3:
  - Clock-in at 07:45:00 GMT $\implies$ `PRESENT_ON_TIME`, 0 min late
  - Clock-in at 08:30:00 GMT $\implies$ `PRESENT_ON_TIME`, 0 min late
  - Clock-in at 08:35:59 GMT $\implies$ `PRESENT_ON_TIME`, 0 min late
  - Clock-in at 08:36:00 GMT $\implies$ `PRESENT_LATE`, 1 min late
  - Clock-in at 08:50:00 GMT $\implies$ `PRESENT_LATE`, 15 min late
  - Clock-in at 09:10:30 GMT $\implies$ `PRESENT_LATE`, 35 min late
- **Change:** In `src/lib/punctuality.ts`:
  - Enforce UTC/GMT date extraction (`getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`).
  - Calculate cutoff as `startSeconds + graceMinutes * 60`.
  - Calculate minutes late as $\lfloor(\text{clockInSeconds} - \text{cutoffSeconds}) / 60\rfloor$.
- **Verify:** Run `npx vitest run src/lib/punctuality.test.ts`. All test cases must pass.

---

### Step 3: Session & Role Access Control Layer
- **Test first:** Write test cases in `src/lib/session.test.ts` verifying `requireRole` with the 5 new roles.
- **Change:**
  - Update `src/lib/session.ts` to use `Role` enum from `@prisma/client`.
  - In `src/app/actions/auth.ts`: Ensure session creation binds employee identity, department ID, and role.
  - Remove hardcoded secret fallback in `src/lib/session.ts` to strictly require `process.env.NEXTAUTH_SECRET` (addressing finding L1).
- **Verify:** Run `npx tsc --noEmit` and run auth tests.

---

### Step 4: Absence Reconciliation Security & Logic Hardening
- **Test first:** Add test in `tests/reconcile.test.ts` verifying that unauthorized requests to `/api/cron/reconcile` return HTTP 401.
- **Change:**
  - In `src/app/api/cron/reconcile/route.ts`:
    - Require `Authorization: Bearer <CRON_SECRET>` or active `SYSTEM_ADMIN` session (addressing finding H1).
    - Check if today is a working day (Mon-Fri) in GMT; skip weekends.
    - Exclude `SYSTEM_ADMIN` from daily attendance requirements.
    - Query approved `AttendanceRequest` records for today:
      - If user has approved `LEAVE_NOTICE` $\implies$ mark `ON_LEAVE`.
      - If user has approved `FIELD_ASSIGNMENT` $\implies$ mark `FIELD_DUTY`.
      - Otherwise $\implies$ mark `ABSENT`.
- **Verify:** Call endpoint without token (returns 401); call with valid bearer token (returns 200 with reconciliation summary).

---

### Step 5: Leave Notices & Field Duty Request Workflow
- **Test first:** Add test verifying date validation: end date cannot be earlier than start date (R4.2), and overlapping leaves are rejected (R4.3).
- **Change:**
  - Create `src/components/LeaveNoticeModal.tsx` for submitting multi-day leave ranges and field duty logs.
  - In `src/app/actions/attendance.ts`:
    - Validate `recordId` belongs to authenticated user (addressing finding M1).
    - Add server action for multi-day leave notice submission.
    - In `reviewAttendanceRequest`:
      - Verify `DEPARTMENT_HEAD` can only review requests from their own department (addressing finding M2).
      - Ensure approving a `MISSING_CLOCK_IN` sets and rescores the clock-in time (addressing finding M5).
- **Verify:** Submit leave notice; confirm pending state; approve as department head; verify status updates in database.

---

### Step 6: Department Management & Role Administration UI
- **Test first:** Verify Server Action `createDepartment` and `assignUserDepartment` reject unauthorized roles.
- **Change:**
  - Author `src/app/admin/departments/page.tsx` allowing `HR_OFFICER` and `SYSTEM_ADMIN` to create departments, assign staff, and assign department heads (D14, addressing finding M4).
  - Update `src/app/admin/settings/page.tsx` to handle user provisioning and password resets by `SYSTEM_ADMIN`.
- **Verify:** Run `ui-taste-check.sh` on created pages; verify departments can be created and assigned in browser.

---

### Step 7: HR Director Executive Overview (`/director`)
- **Test first:** Verify `/director` redirects unauthorized roles (`STAFF`, `DEPARTMENT_HEAD`) to `/dashboard?error=unauthorized`.
- **Change:**
  - Create `src/app/director/page.tsx` (replacing `/ceo`) with organization-wide attendance trends, punctuality leaderboard by department, and audit statistics.
  - Update `src/components/Navbar.tsx` navigation bar to route `HR_DIRECTOR` to `/director`.
- **Verify:** Log in as HR Director; verify executive scorecards render cleanly.

---

### Step 8: Multi-Format Export Engine (`exceljs` & Printable PDF)
- **Test first:** Verify export route checks session role and limits `DEPARTMENT_HEAD` to own department (M2).
- **Change:**
  - Install approved dependency `exceljs` (R12 approved).
  - Create `src/app/api/export/excel/route.ts`:
    - Generate workbook with two tabs: `Summary` (rates, rankings) and `Detail` (individual punches).
    - Neutralize formula injection characters (`=`, `+`, `-`, `@`) in CSV and Excel exports (addressing finding L2).
  - Add print stylesheet / printable report view for 1-click browser PDF generation (R9.6).
- **Verify:** Trigger Excel export; open generated `.xlsx` in Excel; verify layout and data formatting.

---

## Verification

- **Typecheck:** `npx tsc --noEmit` exits with 0 errors.
- **Unit Tests:** `npx vitest run` passes 100% of test cases.
- **Dev-OS Scanners:**
  - `bash .agents/scripts/env-check.sh .`
  - `bash .agents/scripts/db-check.sh .`
  - `bash .agents/scripts/ui-taste-check.sh .`
  - `bash .agents/scripts/humanize-check.sh docs/plans/2026-11-16-stafftrack-v2-implementation.md`
- **Manual Verification Walkthrough:**
  1. Log in as `staff1@stafftrack.local`: verify GMT clock display, clock in at 08:36 GMT (verifying 1 min late), submit leave notice.
  2. Log in as `manager.it@stafftrack.local`: review team leave request and approve.
  3. Log in as `hrofficer@stafftrack.local`: create new department, export `.xlsx` workbook, view print-ready PDF.
  4. Log in as `director@stafftrack.local`: inspect department punctuality ranking.
  5. Log in as `admin@stafftrack.local`: review technical audit log and system health.

---

## Risks and Rollback

| Risk | Mitigation | Rollback Plan |
|---|---|---|
| Schema migration failure on existing MySQL database | Pre-migration database dump via `mysqldump` | Restore database dump and rollback Prisma migration via `npx prisma migrate resolve` |
| Role token expiration delay (7 days JWT) | Invalidate sessions by updating user `updatedAt` / session version check | Force users to re-login on critical role transitions |
| Excel export memory pressure | Stream rows using `exceljs.stream.xlsx.WorkbookWriter` for large date ranges | Fallback to streaming CSV export |
