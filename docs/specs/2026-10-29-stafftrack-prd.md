# Product Requirements Document: StaffTrack

**Document ID:** SPEC-2026-10-29-STAFFTRACK  
**Project:** StaffTrack (Corporate Staff Attendance and Punctuality Management System)  
**Author:** Dev-OS Orchestrator  
**Status:** DRAFT (Awaiting Human Review)  
**Date:** 2026-10-29  

---

## 1. Product Overview

StaffTrack is a web-based corporate attendance management system engineered to provide organizations with precise visibility into daily staff attendance, reporting times, tardiness metrics, and departmental performance over time. 

Unlike basic sign-in utilities, StaffTrack tracks punctuality metrics directly against organizational work policies, automates end-of-day absence detection, and provides managers and HR administrators with live operational rosters and actionable scorecards.

---

## 2. User Roles & Permission Matrix

The application enforces four distinct user roles through application-level middleware and Server Action authorization:

| Capability / View | Staff | Department Manager | HR Admin | Executive |
|---|:---:|:---:|:---:|:---:|
| Personal Daily Clock-In / Clock-Out | Yes | Yes | Yes | Optional |
| View Personal Attendance History & Scores | Yes | Yes | Yes | Yes |
| Submit Late Excuse / Missing Punch Request | Yes | Yes | Yes | No |
| View Department Live Attendance Roster | No | Yes (Own Dept) | Yes (All Depts) | Yes (All Depts) |
| Approve / Reject Attendance Correction Requests | No | Yes (Own Dept) | Yes (All Depts) | No |
| Manual Attendance Overrides & Audit Changes | No | No | Yes | No |
| Manage Users, Departments & Company Policy | No | No | Yes | No |
| View Department Punctuality Scorecards & Trends | No | Yes (Own Dept) | Yes (All Depts) | Yes (All Depts) |
| Export Attendance & Payroll Data (CSV / Excel) | No | No | Yes | Yes |

---

## 3. Detailed Functional Specifications

### 3.1 Attendance Clocking & Punctuality Engine
* **Schedule Policy Defaults:**
  * Official Work Start Time: `08:30:00`
  * Grace Period: `15 minutes` (Cutoff: `08:45:00`)
  * Official Work End Time: `17:00:00`
  * Standard Workday Expected Duration: `8 hours` (excluding 30-minute lunch threshold)
* **Clock-In Logic:**
  * When a user triggers "Clock In", the system records the server timestamp $T$.
  * If $T \le \text{Start Time} + \text{Grace Period}$, the record is flagged `PRESENT_ON_TIME` with `minutesLate = 0`.
  * If $T > \text{Start Time} + \text{Grace Period}$, the record is flagged `PRESENT_LATE`. The tardiness duration is calculated in minutes:
    $$\text{minutesLate} = \text{round}\left(\frac{T - \text{Start Time}}{60}\right)$$
  * The user is immediately presented with an optional field to provide a reason for the tardiness.
* **Clock-Out Logic:**
  * When a user triggers "Clock Out", the system validates that an open punch exists for today, assigns `clockOutTime = T`, and calculates `totalWorkMinutes`.

### 3.2 Correction and Excuse Workflow
* An employee can navigate to any late or incomplete attendance record and initiate a request.
* **Supported Request Types:**
  1. `LATE_EXCUSE`: Employee provides a written justification (e.g. medical, transport breakdown, client emergency).
  2. `MISSING_CLOCK_IN`: Employee requests retroactive recording of arrival time with justification.
  3. `MISSING_CLOCK_OUT`: Employee requests retroactive recording of departure time with justification.
* Requests appear in the Department Manager's and HR Admin's pending review inbox.
* Upon review, the approver selects "Approve" (updating `isExcused = true` or adding the approved timestamp) or "Reject" (recording the decision reason). All status adjustments are written to `AuditLog`.

### 3.3 End-of-Day Absence Reconciliation
* A daily scheduled task runs on active working days at `23:59:00`.
* The engine queries all active staff and managers who do not have an existing `AttendanceRecord` for the date.
* For each unrecorded employee:
  * If an approved leave record exists for that date, the record status is set to `ON_LEAVE`.
  * If no leave record exists, the record status is set to `ABSENT` with `minutesLate = 0`.

### 3.4 Live Operational Attendance Board
* **Top Summary Bar:**
  * Total Headcount Scheduled
  * Present On-Time (Count & Percentage)
  * Present Late (Count & Percentage)
  * Absent (Count & Percentage)
  * On Leave (Count & Percentage)
* **Real-Time Staff Grid:**
  * Searchable by name, employee code, or job title.
  * Filterable by department, status (`PRESENT_ON_TIME`, `PRESENT_LATE`, `ABSENT`, `ON_LEAVE`).
  * Direct action links for supervisors to view individual history or approve pending notes.

### 3.5 Department Punctuality Scorecards & Analytics
* **Department Punctuality Index:**
  $$\text{Punctuality Score (\%)} = \left( \frac{\text{Count of On-Time Arrivals}}{\text{Total Expected Workdays}} \right) \times 100$$
* **Scorecard Metrics:**
  * Department Punctuality Rate (%)
  * Average Clock-In Time
  * Total Cumulative Tardiness Minutes
  * Week-over-Week Trend (Positive / Negative differential)
* **Leaderboard View:** Departments sorted by punctuality ranking to highlight top-performing and lagging teams.

### 3.6 Data Export Engine
* Date range selector (Daily, Weekly, Monthly, Custom Range).
* Export format: CSV and Excel (.xlsx).
* Fields exported: `Employee Code`, `Full Name`, `Department`, `Date`, `Clock-In`, `Clock-Out`, `Status`, `Minutes Late`, `Is Excused`, `Hours Worked`, `Approver Remarks`.

---

## 4. Database Schema (Prisma / MySQL)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STAFF
  MANAGER
  HR_ADMIN
  EXECUTIVE
}

enum AttendanceStatus {
  PRESENT_ON_TIME
  PRESENT_LATE
  ABSENT
  ON_LEAVE
  HALF_DAY
}

enum RequestType {
  LATE_EXCUSE
  MISSING_CLOCK_IN
  MISSING_CLOCK_OUT
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

model Department {
  id        String   @id @default(uuid())
  name      String   @unique
  managerId String?
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id                 String              @id @default(uuid())
  email              String              @unique
  passwordHash       String
  fullName           String
  employeeCode       String              @unique
  role               Role                @default(STAFF)
  departmentId       String?
  department         Department?         @relation(fields: [departmentId], references: [id])
  jobTitle           String?
  isActive           Boolean             @default(true)
  attendanceRecords  AttendanceRecord[]
  attendanceRequests AttendanceRequest[] @relation("UserRequests")
  reviewedRequests   AttendanceRequest[] @relation("ReviewedRequests")
  auditActions       AuditLog[]          @relation("UserAudits")
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@index([departmentId])
  @@index([role])
}

model CompanyPolicy {
  id                 String   @id @default(uuid())
  workStartTime      String   @default("08:30:00") // Stored as HH:mm:ss
  workEndTime        String   @default("17:00:00") // Stored as HH:mm:ss
  graceMinutes       Int      @default(15)
  workingDays        String   @default("[\"MON\",\"TUE\",\"WED\",\"THU\",\"FRI\"]") // JSON array string
  updatedAt          DateTime @updatedAt
}

model AttendanceRecord {
  id                 String              @id @default(uuid())
  userId             String
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  recordDate         DateTime            @db.Date
  clockInTime        DateTime?
  clockOutTime       DateTime?
  status             AttendanceStatus
  minutesLate        Int                 @default(0)
  totalWorkMinutes   Int?
  isExcused          Boolean             @default(false)
  staffRemarks       String?             @db.Text
  requests           AttendanceRequest[]
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@unique([userId, recordDate])
  @@index([recordDate])
  @@index([status])
}

model AttendanceRequest {
  id           String            @id @default(uuid())
  userId       String
  user         User              @relation("UserRequests", fields: [userId], references: [id], onDelete: Cascade)
  recordId     String?
  record       AttendanceRecord? @relation(fields: [recordId], references: [id], onDelete: SetNull)
  requestType  RequestType
  requestedDate DateTime         @db.Date
  proposedTime DateTime?
  reason       String            @db.Text
  status       RequestStatus     @default(PENDING)
  reviewerId   String?
  reviewer     User?             @relation("ReviewedRequests", fields: [reviewerId], references: [id])
  reviewerNote String?           @db.Text
  reviewedAt   DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([userId])
  @@index([status])
}

model AuditLog {
  id           String   @id @default(uuid())
  actorId      String
  actor        User     @relation("UserAudits", fields: [actorId], references: [id])
  action       String
  targetEntity String
  targetId     String
  details      String?  @db.Text // JSON representation of changes
  createdAt    DateTime @default(now())

  @@index([actorId])
  @@index([targetEntity, targetId])
}
```

---

## 5. Non-Functional Requirements & Security

1. **Authentication:** Auth.js (NextAuth v5) using JWT session strategy with credential provider.
2. **Access Control:** Server Actions verify session and user role before executing queries or mutations.
3. **Data Validation:** Zod schemas applied to all input parameters (dates, remarks, times).
4. **Secrets Handling:** All database connection strings and session keys read exclusively from `process.env.*`.
5. **Auditing:** All administrative edits, status overrides, and policy modifications record the initiating user ID, target entity, timestamp, and before/after state.

---

## 6. Implementation Milestones

1. **Phase 1: Environment & Data Foundation**
   - Initialize Next.js 15 project with TypeScript, Tailwind CSS, and shadcn/ui.
   - Configure Prisma schema and run initial migrations against ServBay MySQL (`staff_track`).
   - Implement database seed script with default company policy, demo departments, and role-based test accounts.
2. **Phase 2: Authentication & Core Staff Dashboard**
   - Implement Auth.js credentials flow and route protection middleware.
   - Build Staff Dashboard with live clock widget, today's schedule indicators, and Clock-In / Clock-Out Server Actions.
   - Integrate automatic tardiness calculation and late remark submission.
3. **Phase 3: Requests & Approval Workflow**
   - Build employee request submission interface for missing punches and late excuses.
   - Build Manager / HR review queue with one-click approve/reject actions and reviewer remarks.
4. **Phase 4: Real-Time Operational Board & Daily Reconciliation**
   - Build HR live attendance board with real-time status counters and searchable table.
   - Implement automated end-of-day absence reconciliation task.
5. **Phase 5: Analytics, Scorecards & Data Export**
   - Build Department Punctuality Leaderboard and comparative trend visualizations.
   - Implement CSV and Excel data export engine.
