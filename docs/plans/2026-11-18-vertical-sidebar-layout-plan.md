# Implementation Plan: Vertical Sidebar Navigation & Operational Summary Shell

## 1. Context & Objectives
The user requested transforming the top horizontal navigation into a **Vertical (Sidebar) Navigation Layout** for all user accounts (`STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN`).
Additionally, the shell/overview must include a quick executive/operational summary widget (e.g. today's clock status, current GMT time, user role/department status, and system punctuality pulse) visible across the experience.

---

## 2. Key Architecture & Deliverables

### A. Layout Evolution (`src/app/layout.tsx` & `src/components/Sidebar.tsx`)
- Transform `Navbar.tsx` into a modern, tactile, vertical `Sidebar.tsx`:
  - Fixed / sticky left sidebar on medium-to-large viewports (`w-64`, border-r border-slate-200 bg-white).
  - Responsive mobile header with drawer toggle for mobile screens.
  - Active route highlighting using `usePathname()`.
  - Brand header: StaffTrack Attendance OS.
  - Role-scoped navigation links with distinct Lucide icons:
    - Overview / Staff Portal (`/dashboard`)
    - Team Requests (`/manager/requests` / `/hr/requests`)
    - Executive Director Suite (`/director`)
    - Live Board Roster (`/admin/live-board`)
    - Scorecards & Reports (`/admin/reports`)
    - Department & Staff Management (`/admin/departments`)
    - System Settings (`/admin/settings`)
    - Audit Trail (`/hr/audit`)
  - Integrated Summary Overview Widget in Sidebar:
    - Live UTC/GMT Clock pill.
    - User badge (Role, Department, Employee Code).
    - Quick punch/attendance status snapshot.
  - User footer with Logout button.

### B. Main Canvas Restructuring
- Wrap `main` with `min-h-screen md:pl-64` to seamlessly accommodate the persistent sidebar.
- Maintain `@media print` cleanly (hide sidebar during print).

---

## 3. Plan Steps
1. Create `src/components/Sidebar.tsx` as a client/server composable component with responsive mobile drawer support and overview indicators.
2. Update `src/app/layout.tsx` to integrate the sidebar and layout offset.
3. Validate typography, colors, and affordances against `DESIGN.md` and `anti-ai-ui`.
4. Run typecheck (`npx tsc --noEmit`), tests (`npx vitest run`), and Dev-OS mechanical audit tools (`ui-taste-check.sh`, `env-check.sh`, `humanize-check.sh`).
5. Human review and commit via `.agents/scripts/commit.sh`.
