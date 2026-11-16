# StaffTrack Attendance & Punctuality System — Implementation Plan

Spec: docs/specs/2026-10-29-stafftrack-prd.md  
Triage: STANDARD  
Branch: feat/stafftrack-core  

## Goal
Deliver a fully operational corporate staff attendance and punctuality management web application powered by Next.js 15 App Router and ServBay MySQL. The platform enables staff to clock in/out with automated punctuality calculation, submit lateness excuses and punch corrections, and provides management and HR with live operational rosters, departmental punctuality scorecards, and data exports.

## Out of Scope
- Hardware biometric device and physical RFID badge scanner drivers (trust-based web portal chosen for MVP).
- GPS/geofencing enforcement on client devices.
- Multi-tenant billing and subscription management.

## Files
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` — Core Next.js 15 application scaffold.
- Create: `prisma/schema.prisma` — Relational schema mapping Users, Departments, Policies, AttendanceRecords, Requests, and AuditLogs.
- Create: `prisma/seed.ts` — Initial seed data (default policy 08:30+15m, core departments, demo test users).
- Create: `src/lib/prisma.ts` — Singleton Prisma client instance.
- Create: `src/lib/punctuality.ts` — Pure calculation engine determining `ON_TIME` vs `LATE` and computing tardiness minutes.
- Create: `src/lib/punctuality.test.ts` — Unit test suite verifying punctuality calculation and grace cutoff boundary conditions.
- Create: `src/auth.ts`, `src/middleware.ts` — NextAuth credentials configuration and role-based route protection.
- Create: `src/app/actions/attendance.ts` — Server Actions for `clockIn`, `clockOut`, `submitExcuse`, `reviewRequest`.
- Create: `src/app/dashboard/page.tsx` — Staff personal dashboard with clocking widget, status card, and history log.
- Create: `src/app/manager/requests/page.tsx` — Manager and HR approval queue for lateness excuses and corrections.
- Create: `src/app/admin/live-board/page.tsx` — Live operational daily attendance roster and headline counter cards.
- Create: `src/app/admin/reports/page.tsx` — Department punctuality scorecards, rankings, and CSV export triggers.
- Create: `src/app/api/cron/reconcile/route.ts` — Automated end-of-day absence reconciliation endpoint.

## Steps

### Step 1: Next.js 15 Application Scaffold & Tooling Setup
- Test first: Verify project initialization scripts execute cleanly without dependency conflicts.
- Change: Initialize Next.js 15 App Router with TypeScript, Tailwind CSS, Lucide React, and essential utility packages.
- Verify: `npm run build` or `npx next build` runs successfully with zero type errors.

### Step 2: Prisma Schema Configuration & ServBay MySQL Migration
- Test first: Test database connectivity to ServBay MySQL (`staff_track`) using credentials from `.env`.
- Change: Author `prisma/schema.prisma` matching the specification in `docs/specs/2026-10-29-stafftrack-prd.md`. Run `npx prisma db push` to generate tables and write `prisma/seed.ts`.
- Verify: `npx prisma db push` applies schema cleanly; `npx prisma db seed` populates demo records without foreign key errors.

### Step 3: Punctuality Engine Logic & Unit Tests
- Test first: Create `src/lib/punctuality.test.ts` with test cases:
  - Punch at 08:29:59 with 08:30 start -> `PRESENT_ON_TIME`, 0 minutes late.
  - Punch at 08:45:00 with 15m grace -> `PRESENT_ON_TIME`, 0 minutes late.
  - Punch at 08:45:01 -> `PRESENT_LATE`, 15 minutes late.
  - Punch at 09:15:00 -> `PRESENT_LATE`, 45 minutes late.
- Change: Implement `evaluatePunchPunctuality(clockInTime, policy)` in `src/lib/punctuality.ts`.
- Verify: Run test runner (`npm test` / `npx vitest run`) and confirm all test cases pass.

### Step 4: Authentication & Role-Based Middleware
- Test first: Verify route guard redirects unauthenticated users to `/login`.
- Change: Implement Auth.js session handler in `src/auth.ts` with bcrypt password comparison. Add `src/middleware.ts` restricting `/admin` to `HR_ADMIN`/`EXECUTIVE` and `/manager` to `MANAGER`/`HR_ADMIN`.
- Verify: Test login with seeded credentials; verify proper role claims in session.

### Step 5: Staff Attendance Dashboard & Server Actions
- Test first: Write integration test for `clockIn()` ensuring duplicate punches on the same calendar day return a descriptive error.
- Change: Create Server Actions in `src/app/actions/attendance.ts`. Build `src/app/dashboard/page.tsx` featuring real-time clock widget, today's schedule indicator, clock-in/out buttons, and monthly attendance history table.
- Verify: Clock in as staff, confirm `AttendanceRecord` inserted in MySQL with accurate status and minutes late.

### Step 6: Attendance Request & Approval Inbox
- Test first: Verify `createAttendanceRequest` records a pending request linked to the attendance record.
- Change: Build excuse submission modal on late records. Implement `src/app/manager/requests/page.tsx` with one-click Approve/Reject actions that update `isExcused` and write to `AuditLog`.
- Verify: Submit an excuse as staff; approve it as manager; verify `isExcused` toggles to `true` and audit log records the reviewer ID.

### Step 7: Live Attendance Board & Absence Reconciliation
- Test first: Verify absence reconciliation script flags active users who lack attendance entries on workdays.
- Change: Build `src/app/admin/live-board/page.tsx` displaying live status counters and filterable roster. Implement `src/app/api/cron/reconcile/route.ts` to automate marking unrecorded staff as `ABSENT`.
- Verify: Trigger reconciliation route; inspect database to confirm unpunched staff receive `ABSENT` records.

### Step 8: Department Scorecards & CSV Export Engine
- Test first: Verify punctuality percentage calculation formula: `(On-Time Arrivals / Expected Workdays) * 100`.
- Change: Implement departmental scorecard calculations in `src/app/admin/reports/page.tsx`. Add CSV export handler outputting formatted attendance logs for payroll.
- Verify: Access reports page, verify department rankings render accurately, and test CSV download.

## Verification
- Full checks:
  - `npx tsc --noEmit` (TypeScript strict check: zero errors)
  - `npm run test` (All unit tests for punctuality and business logic pass)
  - `& "C:\ServBay\packages\git\bin\bash.exe" .agents/scripts/ui-taste-check.sh` (Zero UI anti-patterns)
  - `& "C:\ServBay\packages\git\bin\bash.exe" .agents/scripts/humanize-check.sh docs/` (Clean prose)
- Manual:
  1. Sign in as Staff (`staff@stafftrack.local`), clock in, verify on-time or late status badge and late explanation prompt.
  2. Sign in as Manager (`manager@stafftrack.local`), view pending requests, approve staff explanation.
  3. Sign in as HR Admin (`admin@stafftrack.local`), review live attendance board, verify department punctuality rankings, and download attendance CSV.

## Risks and Rollback
- **Database Connection Failure:** If ServBay MySQL service is stopped, Prisma queries fail. Mitigation: Verify ServBay MySQL is running before starting the Next.js dev server.
- **Timezone Drift:** Server clock vs local employee clock discrepancies. Mitigation: All punctuality evaluations use server-side UTC timestamps converted to the organization's configured timezone.
- **Rollback:** `git checkout main` and reset the feature branch.
