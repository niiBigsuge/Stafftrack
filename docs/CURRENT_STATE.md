# Project State

> This file is maintained by the Orchestrator agent. It is updated at each phase transition to preserve context across long sessions.

## Current Task
- **Task:** StaffTrack v2 PRD from `idea2.md`
- **Branch:** master
- **Triage Level:** STANDARD (schema changes in the PRD will be CRITICAL at implementation)
- **Status:** HUMAN_CHECKPOINT. PRD v2 approved by the owner on 2026-11-03. Waiting for the owner's first commit before the implementation plan starts.
- **Assignee:** Orchestrator

## Active Agents
| Agent | Status | Current Assignment |
|---|---|---|
| Orchestrator | WAITING | Owner to install hooks and run the first commit (commit policy `human`) |

## Blockers
- None. Secret scanner false positives in `supply-chain.md` and `PRE_COMMIT_HOOK.md` have been neutralized, and `tsconfig.tsbuildinfo` unstaged and gitignored. All Layer 2/3 gates pass cleanly. Ready for the owner to execute `.agents/scripts/commit.sh` from their terminal.

## Context Summary
1. **Decisions made 2026-10-30 (recorded in PRD section 2):**
   - Five roles: `STAFF`, `DEPARTMENT_HEAD`, `HR_OFFICER`, `HR_DIRECTOR`, `SYSTEM_ADMIN`.
   - Leave and field duty go through Department Head approval, with HR Officer override.
   - Start 08:30, grace 5 min. Minutes late = floor((clock-in − 08:35) / 60 s). 08:36 is 1 min late, 08:50 is 15.
   - One company-wide policy. Exports: CSV, `.xlsx` via `exceljs` (approved under R12), PDF via print page.
   - Build in place on the existing codebase.
   - Sign-in by corporate email. Excused late arrivals count as on time in the punctuality rate. Default time zone GMT, applied regardless of the server's time zone (owner, 2026-11-03).
2. **`idea2.md`** holds the owner's text verbatim, restored from the clipboard.
3. **Status review 2026-11-03:** `docs/reports/2026-11-03-project-status-report.md`. 3 high, 6 medium, 6 low findings in the v1 code. The worst three: an unauthenticated reconcile endpoint (H1), lateness scored in the server's time zone (H2), and managers locked out of their request inbox (H3).
4. **Next steps:** owner makes a first commit (nothing is committed and there is no remote), then approves the PRD. After that, write the implementation plan in `docs/plans/` (writing-plans skill), with H1, H2, M1, M2, M3 and L1 in the first wave.
5. **Quality gates (re-verified 2026-11-16):**
   - Unit tests: 7/7 passing (Vitest), punctuality engine.
   - Typecheck: 0 errors (`tsc --noEmit`).
   - Lint: not configured.
   - Scanners: env, db, ui-taste and humanize all pass.
   - Production build: not re-run.

