# StaffTrack Application Testing & QA Guide

**Application:** StaffTrack (Corporate Staff Attendance & Punctuality Management System)  
**Environment:** Local Development (`http://localhost:3000`)  
**Universal Password:** `devos123`  

---

## 1. Quick Start & Prerequisites

1. Ensure the ServBay local MySQL service is running on `localhost:3306`.
2. Start the development server from the repository root:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 2. Seed Data Fixtures & Portal Personas

The system features dedicated portal experiences based on organizational governance:

| Role & Portal | Account Email | Password | Personnel Details | Core Responsibilities |
|---|---|---|---|---|
| **Super Admin** | `superadmin@stafftrack.local` | `devos123` | Alexander Vance (`EMP-000`) | Technical administration, rules, audit logs, health (avoids routine approvals) |
| **HR Director** | `admin@stafftrack.local` | `devos123` | Marcus Sterling (`EMP-001`) | Attendance Request Approval Inbox, live roster, reports, audit history |
| **CEO / Executive** | `exec@stafftrack.local` | `devos123` | Victoria Hastings (`EMP-006`) | Executive oversight, org summaries, department rates, chronic issues |
| **Dept Manager** | `manager@stafftrack.local` | `devos123` | Elena Rostova (`EMP-002`) | Staff member & Engineering department live roster monitoring |
| **Staff Member** | `staff@stafftrack.local` | `devos123` | Tariq Adeleke (`EMP-003`) | Clock in/out, view records, submit excuses, track request status & comments |

> Note: The sign-in page includes 1-click buttons for each of these personas.

---

## 3. Test Scenarios by Portal

### Scenario A: Staff Portal (Clock In/Out Transition & Request Tracking)
- [ ] 1. Sign in as `staff@stafftrack.local` (`devos123`).
- [ ] 2. On the **Staff Attendance Portal**, notice the primary action button says **"Clock In"**.
- [ ] 3. Click **"Clock In"**.
- [ ] 4. Confirm the button immediately updates to **"Clock Out"**, showing your arrival time.
- [ ] 5. On or after the official closing time (or when ready to end shift), click **"Clock Out"**.
- [ ] 6. Confirm the button updates to a verified badge: **"Shift Complete For Today"** with total shift duration recorded.
- [ ] 7. In the **"Personal Attendance History"** table, click "Explain Lateness" or "Report Missing Punch".
- [ ] 8. In the **"Submitted Requests & Approval Tracking"** section, verify your request status and track HR comments once reviewed.

### Scenario B: Dept Manager Portal (Team Attendance Roster)
- [ ] 1. Sign in as `manager@stafftrack.local` (`devos123`).
- [ ] 2. On the dashboard, notice the **Department Manager Workspace** quick access banner.
- [ ] 3. Click **"Team Attendance Roster"** in the top navigation bar (`/admin/live-board`).
- [ ] 4. Confirm the table defaults to filtering your department (**Core Engineering**).
- [ ] 5. Verify you can see team members' live arrival times, departure times, and office presence.
- [ ] 6. Observe the green **"Live Sync Active (10s)"** badge confirming automatic background synchronization.

### Scenario C: HR Director Portal (Routine Approval Inbox & Operations)
- [ ] 1. Sign in as `admin@stafftrack.local` (`devos123`).
- [ ] 2. Click **"HR Approval Inbox"** in the top navigation bar (`/hr/requests`).
- [ ] 3. Review pending staff requests, justification reasons, and target dates.
- [ ] 4. Type an approval remark (e.g., "Transit delay verified; excused") and click **"Approve"**.
- [ ] 5. Confirm the request moves to "Recently Resolved Requests".
- [ ] 6. Click **"Live Roster"** (`/admin/live-board`) to view live punches across all departments.
- [ ] 7. Click **"Audit History"** (`/hr/audit`) to review the immutable compliance log.
- [ ] 8. Click **"Scorecards & Reports"** (`/admin/reports`) to download the payroll CSV export.

### Scenario D: CEO Portal (Executive Oversight & Chronic Tardiness Detection)
- [ ] 1. Sign in as `exec@stafftrack.local` (`devos123`).
- [ ] 2. You are automatically brought to the **CEO Executive Suite** (`/ceo`).
- [ ] 3. Inspect organization-wide attendance summaries:
  - Overall Org Punctuality Benchmark percentage.
  - Workforce presence percentages (Present On-Time vs Late vs Absent).
- [ ] 4. Inspect Department Punctuality Performance cards and rankings.
- [ ] 5. Review the **"Recurring Attendance Issues & Tardiness Anomalies"** table to identify chronic lateness trends.
- [ ] 6. Review the **"Executive Escalated Cases"** panel.

### Scenario E: Super Admin Portal (Technical Administration & System Health)
- [ ] 1. Sign in as `superadmin@stafftrack.local` (`devos123`).
- [ ] 2. You are automatically brought to **"System Controls"** (`/admin/settings`).
- [ ] 3. **Attendance Rules & Policy Tab:** Configure work start time, grace window, and shift closing time.
- [ ] 4. **Technical Audit Logs Tab:** View system-level mutation audit logs with actor and timestamp.
- [ ] 5. **System Health & Info Tab:** Inspect ServBay MySQL connectivity, database metrics, node version, and application uptime.
- [ ] 6. Confirm that Department Management and Personnel Role tabs have been omitted from this portal.
- [ ] 7. Click **"Live Roster"** (`/admin/live-board`) in the navigation bar to monitor company-wide live clock-in and clock-out punches.

---

## 4. Operational Notes
- ServBay MySQL must be active on port 3306.
- Database credentials stored in `.env` (untracked).
