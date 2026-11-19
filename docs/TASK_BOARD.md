# Dev-OS Task Board & DAG Workflow State

> Single source of truth for active task execution, dependencies, and gating status.
> Maintained by the **Orchestrator** agent.

---

## Workflow State Columns

```
[ BACKLOG ] ➔ [ QUEUED ] ➔ [ IN_PROGRESS ] ➔ [ PARALLEL_GATE ] ➔ [ HUMAN_CHECKPOINT ] ➔ [ DONE ]
                                                     │
                                            ┌────────┼────────┐
                                            ▼        ▼        ▼
                                           QA     TESTER   SECURITY
```

---

## Active Board

### [ IN_PROGRESS ]
*(none)*

### [ QUEUED ]
- **TASK-DEP-001:** Dependency update for critical `next` and `@auth/core` advisories (Researcher, Developer, Tester, Security)

### [ DONE ]
- **TASK-UI-006:** Top Profile Dropdown Trigger, Sign Out Label, Collapsible Sidebar & "Approvals" Navigation Label (`src/components/UserProfileDropdown.tsx`, `src/components/Sidebar.tsx`, `src/app/layout.tsx`). Landed under commit `51c6df1`.
- **TASK-UI-005:** Final Sidebar Label Polish & Personnel Ordering (`src/components/Sidebar.tsx`, `src/app/actions/admin.ts`, `src/app/admin/departments/page.tsx`, `src/app/admin/staff/page.tsx`). Landed under commit `825a0a8`.

### [ DONE ]
- **TASK-V2-009:** Printable PDF Report View & Print Media Stylesheet (`src/app/admin/reports/page.tsx`, `src/components/PrintReportButton.tsx`, `src/app/globals.css`). Landed under commit `43bed6c`.
- **STAFFTRACK-V2-FULL-DELIVERY:** v1 to v2 evolution (`docs/plans/2026-11-16-stafftrack-v2-implementation.md`), plan steps 1-7 and 9, plus CSV and Excel export from step 8. Landed under commit `09f0922`.
- **TASK-V2-001:** Database Baseline & Prisma Schema Evolution (`prisma/schema.prisma`, `prisma/seed.ts`) [CRITICAL]
- **TASK-V2-002:** Strict GMT Punctuality Engine & Test-First Suite (`src/lib/punctuality.ts`, `src/lib/punctuality.test.ts`)
- **TASK-V2-003:** Session Auth & 5-Tier Role Route Guards (`src/lib/session.ts`, `src/app/actions/auth.ts`, `src/components/Navbar.tsx`)
- **TASK-V2-004:** Absence Reconciliation Security & Logic Hardening (`src/app/api/cron/reconcile/route.ts`)
- **TASK-V2-005:** Leave Notices & Field Duty Workflow (`src/components/LeaveNoticeModal.tsx`, `src/app/actions/attendance.ts`)
- **TASK-V2-006:** Department Management & Role Administration UI (`src/app/admin/departments/page.tsx`, `src/app/actions/admin.ts`)
- **TASK-V2-007:** HR Director Executive Overview Portal (`src/app/director/page.tsx`, `src/components/Navbar.tsx`)
- **TASK-V2-008:** Multi-Format Export Engine with Exceljs & CSV (`src/app/api/export/excel/route.ts`, `src/app/api/export/csv/route.ts`)

### [ BACKLOG ]
*(none)*

### [ DONE ]
- **INCEPTION-PRD:** Product Requirements Document & Project Specifications (`docs/specs/2026-10-29-stafftrack-prd.md`, `docs/PROJECT_REQUIREMENTS.md`, `DESIGN.md`)
- **TASK-001:** Next.js 15 Application Scaffold & Tooling Setup (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `globals.css`)
- **TASK-002:** Prisma Schema Configuration & ServBay MySQL Migration (`prisma/schema.prisma`, `prisma/seed.ts`)
- **TASK-003:** Punctuality Engine Logic & Unit Tests (`src/lib/punctuality.ts`, `src/lib/punctuality.test.ts`)
- **TASK-004:** Authentication & Role-Based Middleware (`src/lib/session.ts`, `src/app/actions/auth.ts`, `src/app/login/page.tsx`)
- **TASK-005:** Staff Attendance Dashboard & Server Actions (`src/app/actions/attendance.ts`, `src/app/dashboard/page.tsx`, `src/components/ClockCard.tsx`)
- **TASK-006:** Attendance Request & Approval Inbox (`src/app/manager/requests/page.tsx`, `src/components/RequestsInbox.tsx`, `src/components/RequestExcuseModal.tsx`)
- **TASK-007:** Live Attendance Board & Absence Reconciliation (`src/app/admin/live-board/page.tsx`, `src/components/LiveRoster.tsx`, `src/app/api/cron/reconcile/route.ts`)
- **TASK-008:** Department Scorecards & CSV Export Engine (`src/app/admin/reports/page.tsx`, `src/app/api/export/csv/route.ts`)
