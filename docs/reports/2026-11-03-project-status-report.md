# StaffTrack Status Report

| Field | Value |
|---|---|
| Date | 2026-11-03 |
| Prepared by | Dev-OS Orchestrator (read-only review, no code changed) |
| Branch | `master`, no commits, no remote |
| Dev-OS | 5.1.2, mode `interactive`, no `session.json` (none needed in this mode) |

## 1. Where the project stands

| Stage | State |
|---|---|
| v1 PRD (`docs/specs/2026-10-29-stafftrack-prd.md`) | Built. Tasks 001 to 008 marked done on the task board. |
| v1 code | Runs, but never committed. Has the security and correctness problems listed in section 4. |
| v2 PRD (`docs/specs/2026-10-30-stafftrack-prd-v2.md`) | Drafted from `idea2.md`. Owner's three questions answered (D11 to D13). Passed the Humanizer gate. Waiting for owner approval. |
| v2 implementation plan | Not started. Blocked on PRD approval (Rule 22). |

Nothing in the project changed between 2026-10-30 and today. The one new item is a `.freebuff/` folder created on 2026-11-02 by Freebuff Desktop, another AI coding tool. It holds a project ID only and ignores itself in git.

## 2. Gate results (run today)

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass, 0 errors |
| `vitest run` | Pass, 7 of 7. All 7 test the punctuality function only. No tests for actions, auth, reconciliation or export. |
| `next lint` | Not configured. The command stops at an ESLint setup prompt. |
| `env-check.sh` | Pass. 2 variables, both in `.env.example`. |
| `db-check.sh` | Pass, but only because there are no migration files to check. |
| `ui-taste-check.sh` | Pass, 23 files |
| `humanize-check.sh` on the v2 PRD | Pass |
| `prisma migrate status` | Database `staff_track` on `localhost:3306` is reachable. It is not managed by Prisma Migrate: the schema was pushed without migrations. |
| Production build | Not re-run today |

The scanners run with the bash bundled in ServBay (`C:\ServBay\packages\git\bin\bash.exe`). Git for Windows did not need installing.

## 3. What the app has today

- Sign-in by email and password, with a custom JWT cookie signed by `jose`. Auth.js (`next-auth` 5.0.0-beta.25) is installed but not used anywhere in `src/`.
- Five roles in the database: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `STAFF`, `EXECUTIVE`. Seed data has 7 users, one per role plus 3 staff.
- Staff clock in and out, see their history, and file late excuse or missing punch requests.
- An HR request inbox, a live roster that polls every 10 seconds, a reports page, CSV export, an executive page at `/ceo`, an HR audit log page, and a policy settings page for the super admin.
- Route protection is a role check at the top of each page and Server Action. There is no `middleware.ts`.
- The database holds 4 clock-in records, all test punches from the evening of 2026-10-29.

## 4. Findings

Severity follows the Security agent scale. Every finding cites the file it comes from.

### High

**H1. Anyone can trigger absence marking.** `POST /api/cron/reconcile` (`src/app/api/cron/reconcile/route.ts`) has no session or secret check. Any visitor can call it at any hour. It marks every active user without a record as `ABSENT`, including the super admin and executive, on weekends too, and writes the audit entry under whichever user the database returns first. The live roster page also calls it from the browser (`src/components/LiveRoster.tsx:74`).

**H2. Lateness depends on the server's clock zone.** `evaluatePunchPunctuality` (`src/lib/punctuality.ts`) and the record date in `clockIn` (`src/app/actions/attendance.ts:14`) use the server's local time. The stored data shows this already went wrong. A punch at 23:48 UTC on 2026-10-29 was scored 499 minutes late, which is 16:48 in UTC-7. This machine was on UTC-7 that day and is on UTC+1 (W. Central Africa) today. With the owner's GMT policy, a staff member clocking in at 08:30 GMT today would be scored as 09:30. The record date can also land on the wrong day, because local midnight is stored as a UTC date.

**H3. Managers cannot open their request inbox.** `/manager/requests` redirects to `/hr/requests`, which allows only `HR_ADMIN` and `SUPER_ADMIN` (`src/app/hr/requests/page.tsx:8`). A manager ends up back on the dashboard with an "unauthorized" error.

### Medium

**M1. A request can point at someone else's record.** `submitAttendanceRequest` takes `recordId` from the form without checking that the record belongs to the signed-in user. If a reviewer approves the request, the other person's record is marked excused.

**M2. Managers are not limited to their department on the server.** `reviewAttendanceRequest` accepts any request ID from a `MANAGER`, and `/api/export/csv` gives managers every department's records. The page UI may filter by department, but the server does not.

**M3. Role and account changes take up to 7 days to apply.** The session JWT carries the role and lasts 7 days (`src/lib/session.ts`). A deactivated user, or one whose role was lowered, keeps their old access until the cookie expires.

**M4. Departments, roles and user status cannot be managed in the app.** `createDepartment`, `updateDepartmentManager`, `assignUserDepartment`, `updateUserRole` and `toggleUserStatus` exist in `src/app/actions/admin.ts`, but no page calls them. Only the policy form is wired up.

**M5. Approving a missing clock-in or clock-out does nothing.** `reviewAttendanceRequest` only acts on `LATE_EXCUSE`. Approved missing-punch requests leave the attendance record unchanged.

**M6. No migration history.** The schema was created with `db push`. The v2 PRD changes enums and adds columns, so the database has to be baselined before any v2 migration. This is CRITICAL triage and needs DBA review.

### Low

- **L1.** `src/lib/session.ts:7` falls back to a hardcoded signing key when `NEXTAUTH_SECRET` is missing. `.env` sets a real 43-character value today, so this is not exploitable now. If the variable were ever missing, anyone could forge a session with any role. Hard Rule R2 forbids the fallback.
- **L2.** CSV export only escapes quotes in staff remarks. Names and remarks starting with `=`, `+`, `-` or `@` are not neutralised, so a crafted remark can run as a formula when HR opens the file in Excel.
- **L3.** Login returns different messages for an unknown email and a wrong password, which tells an attacker which emails exist. There is no rate limit on login.
- **L4.** Policy input is not validated with Zod. Grace minutes can be negative and times can be any string (`updateCompanyPolicy`).
- **L5.** `next-auth` beta is an unused dependency. The v1 PRD and docs say Auth.js, which no longer matches the code.
- **L6.** `tsconfig.tsbuildinfo` is not in `.gitignore`.

## 5. Gaps between the code and the v2 PRD

| v2 requirement | Today |
|---|---|
| Five roles: Staff, Department Head, HR Officer, HR Director, System Admin | Old five roles. HR Director has no portal. |
| 5-minute grace, minutes counted from 08:35 and rounded down | 15-minute grace, counted from 08:30 and rounded to nearest |
| Times judged in GMT | Server local time (H2) |
| Leave and field duty requests with date ranges | Not built |
| Reconciliation: leave, then field duty, then absent, working days only | Absent only, every day, no auth (H1) |
| HR Officer manages departments, staff and policy | Super admin owns policy. Department actions have no UI (M4). |
| Excel and print-to-PDF exports | CSV only |
| Audited corrections only, no deletes | Partly done. Policy, request and role changes are audited. Clock-ins are not, and reconciliation writes one summary entry with a count, not one per record. |

## 6. Risks outside the code

- **Nothing is committed and there is no remote.** One disk failure or bad command loses all the work. A first commit through `.agents/scripts/commit.sh` should come before any v2 change.
- **Two AI tools on one folder.** Freebuff Desktop is now registered on this project. If it edits files outside the Dev-OS gates, those changes skip the commit and design gates.

## Update 2026-11-06

- Pre-commit secret scan false positives in `supply-chain.md` and `PRE_COMMIT_HOOK.md` were neutralized.
- `tsconfig.tsbuildinfo` was unstaged and gitignored.
- Git hooks were verified; all 591 files were staged cleanly with all Layer 2/3 gates passing.

## Update 2026-11-16

- Status verification re-run on 2026-11-16.
- Git status: `master` branch remains clean with all 591 files staged (`A`), awaiting execution of `.agents/scripts/commit.sh` from the owner's terminal.
- Zero unstaged or untracked file modifications.
- Quality verification re-run: TypeScript typecheck passes (0 errors), Vitest suite passes (7/7 unit tests).
- Pre-commit gate checks verified clean.
- Next action: Owner executes `.agents/scripts/commit.sh` interactively in terminal, then Orchestrator immediately drafts the v2 implementation plan in `docs/plans/` using `writing-plans`.

## 7. Recommended next steps

1. Owner commits the current state through `.agents/scripts/commit.sh`, so v2 work starts from a known baseline.
2. Owner approves the v2 PRD.
3. Orchestrator writes the v2 implementation plan in `docs/plans/`. H1, H2, M1, M2, M3 and L1 should be fixed in the first wave, because v2 rebuilds the same files.
4. DBA baselines the existing database (M6) before the v2 schema migration.
5. Developer configures ESLint so QA has a lint gate.
