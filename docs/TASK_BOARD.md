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
*(none)*

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
