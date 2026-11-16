# Product Requirements Document: StaffTrack v2

| Field | Value |
|---|---|
| Document ID | SPEC-2026-10-30-STAFFTRACK-V2 |
| Supersedes | `docs/specs/2026-10-29-stafftrack-prd.md` |
| Source | `idea2.md` (quoted in full in Appendix A) |
| Author | Dev-OS Orchestrator, from a brainstorming session with the project owner |
| Status | APPROVED by the owner on 2026-11-03, after adding D14 |
| Date | 2026-10-30 |

---

## 1. Purpose

In the owner's words:

> The idea is not just to let staff sign in. It is to build a system that gives management a clear picture of who reported to work, who arrived late, who was absent, and how each department performs over time.

StaffTrack v2 changes the working app built from the first PRD. It adds the five roles from the source, leave and field duty requests with an approval step, a 5-minute grace rule, and Excel and PDF reports.

## 2. Decisions that supersede the source

The owner made these decisions during brainstorming on 2026-10-30. Where the source text in Appendix A disagrees, these win.

| # | Topic | Source says | Decision |
|---|---|---|---|
| D1 | Reporting time | "report by 8:00 AM" (section 1) and "Official reporting time is 8:30 AM" (section 5) | 8:30 AM. Ignore the 8:00 AM in section 1. |
| D2 | Grace period | "HR could allow five minutes after 8:30 AM" | 5 minutes by default. HR Officer can change it. |
| D3 | Minutes late | Table: 8:35 is 5 min late, 8:50 is 20 min late | Counted from the end of the grace window (8:35), in whole minutes rounded down. 8:35:59 is on time, 8:36 is 1 min late, 8:50 is 15 min late. |
| D4 | Roles | Five roles listed | Five roles in the database: `STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN`. |
| D5 | Leave and field duty | "allow Staff to indicate" leave, "leave notes" for field work | Staff submit a request. The Department Head approves it, and the HR Officer can also approve or override. Nothing is excused until approved. |
| D6 | Policy scope | Not stated | One company-wide policy. No per-department times. |
| D7 | Export formats | "Export reports to Excel or PDF" | CSV, formatted Excel (`.xlsx`), and PDF. |
| D8 | Excel library | Not stated | `exceljs` approved by the owner under Hard Rule R12 (20.8 MB unpacked). |
| D9 | PDF method | Not stated | A print-ready report page that the browser saves as PDF. No new PDF package. |
| D10 | Build approach | Not stated | Change the existing codebase in place. No rewrite. |
| D11 | Sign-in identifier | "unique username and password" | Staff sign in with their corporate email address, which must be unique. There is no separate username. |
| D12 | Excused lateness | Not stated | An approved late excuse counts as on time in the punctuality rate. The minutes late stay on the record. |
| D13 | Time zone | Not stated | GMT (UTC+0) by default, always applied by the app no matter which time zone the server or computer is set to. HR Officer can change it in the policy. |
| D14 | Department management | "Create and manage departments", listed under department management without naming a role | HR Officer and System Administrator can both create departments and assign staff and Department Heads. |

## 3. Roles and permissions

### 3.1 Role summary

| Role | Portal | Source responsibility (quoted) |
|---|---|---|
| Staff | `/dashboard` | "Sign in, check personal attendance history, view punctuality records, submit explanations for lateness and other excuses if available." |
| Department Head | `/manager` | "Monitor the department's attendance, review late arrivals, view departmental reports" |
| HR Officer | `/hr` | "Manage staff records, configure attendance rules, review exceptions, generate reports" |
| HR Director | `/director` | "View organization-wide reports, review attendance trends, oversee policy compliance" |
| System Administrator | `/admin` | "Manage user accounts, permissions, system settings, and technical operations" |

Department Heads, HR Officers and HR Directors also clock in and use the Staff portal for their own attendance. System Administrators do not clock in by default.

### 3.2 Permission matrix

| Capability | Staff | Dept Head | HR Officer | HR Director | Sys Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Clock in and out, view own history | Yes | Yes | Yes | Yes | No |
| Submit late excuse, missing punch, leave, field duty | Yes | Yes | Yes | Yes | No |
| Live roster | No | Own dept | All | All | No |
| Approve or reject requests | No | Own dept | All | No | No |
| Create departments, assign staff and heads | No | No | Yes | No | Yes |
| Edit attendance policy (start time, grace, working days) | No | No | Yes | No | No |
| Reports and exports | No | Own dept | All | All | No |
| Create login accounts, set roles, reset passwords | No | No | No | No | Yes |
| View audit log | No | No | Yes | Yes | Yes |
| System settings and health | No | No | No | No | Yes |

A Department Head cannot approve their own requests. These go to the HR Officer queue.

## 4. Functional requirements

Requirements use the form "WHEN trigger, THE SYSTEM SHALL response."

### R1: Sign-in

Source: "Unique usernames and secure passwords." "Automatic identification of the logged-in employee." "No ability for staff to submit attendance on behalf of another employee."

- R1.1 WHEN a user submits their corporate email and password (D11), THE SYSTEM SHALL check them against a bcrypt hash and start a session tied to that user.
- R1.2 THE SYSTEM SHALL take the employee identity for every clock-in, clock-out and request from the session only. No request body field can name a different employee.
- R1.3 WHEN a user opens a portal their role does not allow, THE SYSTEM SHALL redirect them to their own portal.
- R1.4 WHEN a System Administrator resets a password, THE SYSTEM SHALL set a temporary password, require a change at next sign-in, and write an audit entry.

### R2: Clock-in and punctuality

Source: "The system automatically records the date and exact server-side timestamp when the employee signs in." "First check-in timestamp."

- R2.1 WHEN a user clocks in on a working day, THE SYSTEM SHALL record the server time, never a time sent by the browser.
- R2.2 THE SYSTEM SHALL compute the cutoff as start time plus grace minutes. With defaults, the cutoff is 08:35:00.
- R2.3 THE SYSTEM SHALL compute minutes late as ⌊(clock-in time − cutoff) ÷ 60 seconds⌋, with a floor of 0.
- R2.4 WHEN minutes late is 0, THE SYSTEM SHALL set the status to `PRESENT_ON_TIME`. WHEN it is 1 or more, THE SYSTEM SHALL set it to `PRESENT_LATE`.
- R2.5 WHEN a user who already clocked in today clocks in again, THE SYSTEM SHALL reject it and show the first clock-in time.
- R2.6 WHEN a user clocks in on a non-working day, THE SYSTEM SHALL save the record without scoring it.
- R2.7 THE SYSTEM SHALL evaluate all times in the company time zone stored in the policy (R8), which defaults to GMT (D13). The server's own time zone setting SHALL NOT affect scoring, the record date, reconciliation or reports.

Worked examples with the default policy (start 08:30, grace 5):

| Clock-in | Status | Minutes late |
|---|---|---|
| 07:45:00 | On time | 0 |
| 08:30:00 | On time | 0 |
| 08:35:59 | On time | 0 |
| 08:36:00 | Late | 1 |
| 08:50:00 | Late | 15 |
| 09:10:30 | Late | 35 |

### R3: Clock-out

- R3.1 WHEN a user clocks out, THE SYSTEM SHALL require an open clock-in for today, save the server time, and compute total work minutes.
- R3.2 WHEN there is no clock-in for today, THE SYSTEM SHALL reject the clock-out and offer a missing clock-in request.

### R4: Requests

Source: "submit explanations for lateness and other excuses if available." "Approved leave : The system should allow Staff to indicate that that particular staff is onleave by indicating when leave starts and ends." "Staff should leave notes in account on the portal to state (field assignments and official travel)"

| Type | Dates | What approval does |
|---|---|---|
| `LATE_EXCUSE` | One date with a late record | Marks the record excused |
| `MISSING_CLOCK_IN` | One date plus proposed time | Sets the clock-in and rescores it with R2 |
| `MISSING_CLOCK_OUT` | One date plus proposed time | Sets the clock-out and work minutes |
| `LEAVE_NOTICE` | Start date and end date | Those working days become `ON_LEAVE` |
| `FIELD_ASSIGNMENT` | Start date and end date | Those working days become `FIELD_DUTY` |

- R4.1 WHEN a user submits a request, THE SYSTEM SHALL require a written reason and save it as `PENDING`.
- R4.2 WHEN a leave or field request's end date is before its start date, THE SYSTEM SHALL reject it.
- R4.3 WHEN a leave or field request overlaps an approved leave or field request for the same user, THE SYSTEM SHALL reject it.
- R4.4 THE SYSTEM SHALL route a request to the requester's Department Head and to every HR Officer. A Department Head's own request goes to HR Officers only.
- R4.5 WHEN a reviewer approves or rejects a request, THE SYSTEM SHALL save the reviewer, a note, and the time, apply the effect in the table above, and write an audit entry.
- R4.6 WHEN a request is approved for a date that reconciliation already marked `ABSENT`, THE SYSTEM SHALL update that record and audit the change.
- R4.7 WHEN a user has an approved leave or field request covering today and clocks in anyway, THE SYSTEM SHALL keep the clock-in record for that day.

### R5: Daily reconciliation

Source: "Automatic daily attendance summaries."

- R5.1 THE SYSTEM SHALL run reconciliation at 23:59 company time on each working day.
- R5.2 FOR each active user expected to clock in (every role except System Administrator) who has no record for the day, THE SYSTEM SHALL create one record, checking in this order: approved leave gives `ON_LEAVE`, approved field assignment gives `FIELD_DUTY`, and anything else gives `ABSENT`.
- R5.3 Pending requests do not count. The user is marked `ABSENT` and R4.6 fixes it later if the request is approved.
- R5.4 Running reconciliation twice for the same day SHALL NOT create duplicate records.

### R6: Live roster

- R6.1 THE SYSTEM SHALL show counts and percentages for on time, late, absent, on leave, field duty, and not yet in.
- R6.2 THE SYSTEM SHALL list staff with search by name, email or job title, and filters for department and status.
- R6.3 A Department Head SHALL see only their own department.
- R6.4 THE SYSTEM SHALL refresh the roster every 10 seconds and on demand.

### R7: Departments and staff records

Source: "Create and manage departments." "Assign employees to departments." "Assign department heads." "Manage staff records"

- R7.1 An HR Officer or a System Administrator SHALL be able to create and rename departments, assign staff to them, and set one Department Head per department (D14). Each change is audited.
- R7.2 An HR Officer SHALL be able to edit staff records (name, employee code, job title, department) and mark staff inactive. Inactive staff are skipped by reconciliation.
- R7.3 A System Administrator SHALL create login accounts and set roles. Role changes are audited.
- R7.4 THE SYSTEM SHALL NOT hard-delete users. Deactivation keeps their history.

### R8: Attendance policy

Source: "Reporting deadline configured by HR." "Configurable Grace period."

- R8.1 An HR Officer SHALL be able to set start time (default 08:30), end time (default 17:00), grace minutes (default 5, allowed 0 to 60), working days (default Monday to Friday), and time zone (default GMT).
- R8.2 WHEN the policy changes, THE SYSTEM SHALL apply it to clock-ins from that moment on and SHALL NOT rescore past records.
- R8.3 THE SYSTEM SHALL audit every policy change with before and after values.

### R9: Reports and exports

Source: "Daily, weekly, monthly, and annual reports." "Individual employee attendance history." "Departmental punctuality rankings." "Absence and lateness trends." "Export reports to Excel or PDF."

- R9.1 THE SYSTEM SHALL offer daily, weekly, monthly, annual and custom date ranges.
- R9.2 THE SYSTEM SHALL provide individual history, a department ranking by punctuality rate, and absence and lateness trends over the chosen range.
- R9.3 Punctuality rate = on-time arrivals ÷ (on-time arrivals + late arrivals) × 100. Excused late arrivals count as on time for this rate, but their minutes late stay on the record (D12).
- R9.4 Attendance rate = days present ÷ expected working days × 100, where expected days leave out approved leave and field duty days.
- R9.5 THE SYSTEM SHALL export CSV and `.xlsx`. The workbook has a Summary sheet (totals, rates, department ranking) and a Detail sheet (employee code, name, department, date, clock-in, clock-out, status, minutes late, excused, hours worked, reviewer note).
- R9.6 THE SYSTEM SHALL provide a print layout for every report so the browser can save it as PDF, with page headers, the date range, and who generated it.
- R9.7 Department Heads SHALL only export their own department.

### R10: Audit trail and record protection

Source: "Record changes to attendance status." "Track who made a correction and when." "Retain approved explanations and supporting decisions." "Restrict deletion or alteration of historical records."

- R10.1 THE SYSTEM SHALL write an audit entry for every attendance change, request decision, policy change, role change, account change and password reset, with actor, time, target, and before and after values.
- R10.2 THE SYSTEM SHALL NOT offer any way to delete attendance records, requests or audit entries.
- R10.3 Attendance records SHALL change only through an approved request (R4) or an audited HR Officer correction.
- R10.4 Rejected requests and their reviewer notes SHALL be kept.

### R11: Technical problems

Source: "Staff should call HR if there's some technical problems that will affect attendance."

- R11.1 WHEN a clock-in fails, THE SYSTEM SHALL show the HR contact number and extension, which an HR Officer sets in the policy.
- R11.2 An HR Officer SHALL be able to record a correction for a staff member who phoned in, with a required reason. It is audited like any other correction.

## 5. Data model changes

These change `prisma/schema.prisma`. Schema work is CRITICAL triage and needs DBA review before migration.

| Item | Current | Target |
|---|---|---|
| `Role` enum | `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `STAFF`, `EXECUTIVE` | `STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN` |
| `AttendanceStatus` enum | `PRESENT_ON_TIME`, `PRESENT_LATE`, `ABSENT`, `ON_LEAVE`, `HALF_DAY` | add `FIELD_DUTY` |
| `RequestType` enum | 3 types | add `LEAVE_NOTICE`, `FIELD_ASSIGNMENT` |
| `AttendanceRequest` | single `requestedDate` | add `startDate`, `endDate` |
| `User` | unique `email` used for sign-in | keep `email` as the sign-in field, add `mustChangePassword` |
| `CompanyPolicy` | grace 15 | grace 5, add `timezone` (default `GMT`), `hrContactPhone` |

Proposed role mapping for existing rows: `SUPER_ADMIN` to `SYSTEM_ADMIN`, `HR_ADMIN` to `HR_OFFICER`, `MANAGER` to `DEPARTMENT_HEAD`, `EXECUTIVE` to `HR_DIRECTOR`, `STAFF` unchanged. The existing `/ceo` portal becomes `/director`.

## 6. Non-functional requirements

- Authentication: Auth.js with credentials and JWT sessions, already in place.
- Access control: every Server Action and route handler checks the session role before reading or writing.
- Validation: Zod schemas on every input.
- Secrets: read from `process.env` only, never logged or committed.
- Time: all stored timestamps in UTC. Scoring, record dates and reconciliation use the policy time zone (GMT by default), never the server's local time zone.

## 7. Testing

- Unit tests for R2.3 and R2.4 at 08:35:59, 08:36:00 and 08:50:00, with grace 0 and grace 5.
- Unit tests for reconciliation order (R5.2) and for running it twice (R5.4).
- Unit tests for request date checks (R4.2, R4.3) and approval effects (R4.5, R4.6).
- Access tests: every role against every portal and every Server Action.
- Export tests: column order and totals in CSV and `.xlsx`.

## 8. Out of scope

- Self-service password reset by email. Resets go through the System Administrator (R1.4).
- Per-department reporting times.
- GPS, biometric or IP checks on clock-in.
- Leave balances and payroll calculations.
- Email or SMS notifications.

## 9. Resolved questions

The owner answered these in review on 2026-10-30. The answers are recorded as D11 to D13 in section 2.

1. Sign-in identifier: corporate email, not username (D11).
2. Excused late arrivals count as on time in the punctuality rate (D12, R9.3).
3. Default time zone: GMT (D13).

---

## Appendix A: Source text (`idea2.md`, verbatim)

```text
Project Idea: Corporate Staff Attendance and Punctuality Management System
I recommend building a Corporate Staff Attendance and Punctuality Management System (CSAPMS). It would be a web-based application that helps a company monitor daily staff attendance, enforce reporting times, measure punctuality, and maintain reliable historical records for management and Human Resources (HR).
The idea is not just to let staff sign in. It is to build a system that gives management a clear picture of who reported to work, who arrived late, who was absent, and how each department performs over time.
1. How the system would work
Imagine a company with five departments: IT, Finance, Human Resources, Operations, and Administration.
The company requires all staff to report by 8:00 AM. Each employee has a unique username and password.
Step 1: Staff sign in
Each employee logs in using their registered username and password.
Step 2: The system records the time
The system automatically records the date and exact server-side timestamp when the employee signs in.
Step 3: Punctuality is calculated
If the reporting deadline is 8:00 AM, the system compares the employee's first valid attendance check-in with that deadline.
Step 4: Management reviews reports
HR and authorized managers view attendance records, late arrivals, absences, punctuality rates, and departmental statistics.


2.	Proposed system name: StaffTrack



3.	Main users and their responsibilities. The system should have role-based access, meaning every user can access only the functions they are authorized to use.
Staff
Sign in, check personal attendance history, view punctuality records, submit explanations for lateness and other excuses if available.
Department Head
Monitor the department's attendance, review late arrivals, view departmental reports
HR Officer
Manage staff records, configure attendance rules, review exceptions, generate reports
HR Director
View organization-wide reports, review attendance trends, oversee policy compliance
System Administrator
Manage user accounts, permissions, system settings, and technical operations

4.	Core features
A.	Staff authentication
1.	Unique usernames and secure passwords.
2.	Password reset and account management.
3.	Automatic identification of the logged-in employee.
4.	No ability for staff to submit attendance on behalf of another employee.

B.	Daily attendance tracking
•	First check-in timestamp.
•	Present, late, absent, and excused statuses.
•	Reporting deadline configured by HR.
•	Automatic daily attendance summaries.


C.	Department management
•	Create and manage departments.
•	Assign employees to departments.
•	Assign department heads.
•	Compare punctuality across departments.



D.	Reports and analytics
•	Daily, weekly, monthly, and annual reports.
•	Individual employee attendance history.
•	Departmental punctuality rankings.
•	Absence and lateness trends.
•	Export reports to Excel or PDF.

E. Historical records and audit trail
•	Store attendance records in a database.
•	Record changes to attendance status.
•	Track who made a correction and when.
•	Retain approved explanations and supporting decisions.
•	Restrict deletion or alteration of historical records.

5. How punctuality should be calculated
The company reporting policy:
Official reporting time is 8:30 AM.
First valid check-in	Attendance result	Minutes late
7:45 AM	Present — on time	0
8:00 AM	Present — on time	0
8:35 AM	Late	5
8:50 AM	Late	20

Configurable Grace period. HR could allow five minutes after 8:30 AM before marking an employee late.
Approved leave : The system should allow Staff to indicate that that particular staff is onleave by indicating when leave starts and ends.
Staff should leave notes in account on the portal to state (field assignments and official travel)
Staff should call HR if there’s some technical problems that will affect attendance.
```
