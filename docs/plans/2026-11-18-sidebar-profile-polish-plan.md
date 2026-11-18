# Implementation Plan: UI Polish - User Profile Dropdown, Collapsible Sidebar & Navigation Labels

## 1. Context & Objectives
User requested four specific UI enhancements across the persistent layout shell:
1. **User Profile Dropdown Trigger:** Display **only an icon with a little arrow** (omit the user's name from the top header bar). The expanded dropdown itself continues to show the full name, email, live overview, and details.
2. **Sign Out Button Text:** The sign out action inside the dropdown should display **"Sign Out"** (instead of "Sign Out Account").
3. **Approvals Navigation Label:** For HR Officer & Admin users, change **"HR Approval Inbox"** in the sidebar to **"Approvals"**.
4. **Collapsible Left Sidebar:** Add a collapse/expand toggle button in the left sidebar allowing users to collapse the vertical navigation into an icon-only rail (or expand to full `w-64`), with main content dynamically adjusting padding.

---

## 2. Implementation Steps

### Step 1: User Profile Dropdown Trigger & Sign Out Polish (`TASK-UI-006A`)
- In `src/components/UserProfileDropdown.tsx`:
  - Modify the trigger button to show only the avatar icon circle (or User icon) and the small chevron arrow. Remove the `<div className="hidden sm:flex flex-col text-left">...</div>` name display from the trigger.
  - Update the sign out button label from `"Sign Out Account"` to `"Sign Out"`.

### Step 2: Sidebar Navigation Label & Collapsible Drawer (`TASK-UI-006B`)
- In `src/components/Sidebar.tsx`:
  - Rename `"HR Approval Inbox"` to `"Approvals"`.
  - Add collapsible state (`isCollapsed`) with a collapse/expand toggle button (e.g. ChevronLeft/ChevronRight or PanelLeftClose/PanelLeft).
  - In collapsed mode:
    - Sidebar narrows (e.g. `w-16` / `w-20`).
    - Tooltips or icon-centered links.
    - Header brand collapses to icon.
  - Inform parent layout or export a shared wrapper/context so `main` content padding adjusts between `md:pl-64` and `md:pl-20`.

### Step 3: Layout Integration (`TASK-UI-006C`)
- Refactor client/server boundary in `src/app/layout.tsx` or wrap the sidebar and top header in an interactive shell component (`src/components/DashboardShell.tsx`) so state transition (collapsed/expanded) smoothly shifts both the sidebar width and the content padding.

### Step 4: Verification & Gate Checks (`TASK-UI-006D`)
- `npx tsc --noEmit` (0 errors).
- `npx vitest run` (9/9 pass).
- Layer 2 mechanical scanners: `ui-taste-check.sh`, `env-check.sh`, `humanize-check.sh`.
- Staged review and human commit gate via `.agents/scripts/commit.sh`.
