<!-- BEGIN DEV-OS -->
## Dev-OS — Google Antigravity

The canonical Dev-OS instructions are the Dev-OS block in `AGENTS.md` at the project root; the full rules are in `.agents/AGENTS.md`.

### Hard Rules Digest (Must be strictly obeyed at all times)
This is a digest. `.agents/AGENTS.md` is canonical; numbers in brackets are its Hard Rule numbers.
- [R1] Zero Destructive Actions: Never delete, drop, or truncate without an approved dry-run plan.
- [R2] Zero Secrets Stored, Logged, or Hardcoded: Use `process.env.*`; ask the human for secrets at runtime.
- [R8] Mechanical Commit Gate: Raw `git commit` is BLOCKED. Commits go only through `.agents/scripts/commit.sh`. Agents may run it only as `.agents/scripts/commit.sh --agent "<message>"`, in Claude Code, with commitPolicy `agent`; the human approves each commit in the permission prompt.
- [R6] Staged Review: Agents write code but NEVER commit on their own initiative. Present summaries for human review; the human commits, or asks the agent to commit and approves the prompt.
- [R10] Circuit Breaker: After 3 failed fix iterations (one Developer fix attempt plus the failing gate run each), halt; the Tech Lead gets exactly one arbitration attempt; then halt and escalate to the human. See "Circuit Breaker (canonical)" in AGENTS.md.
- [R11] Verify Before Implementing: Confirm actual library APIs and patterns before authoring code.
- [R12] No Heavy Dependencies: Packages >5MB or >50 dependencies require explicit human approval.
- [R7] Documentation in /docs: All plans (`docs/plans/`), specs (`docs/specs/`), PRDs, architecture notes, and reports belong in `/docs/`.
- [R14] Session-Start Freshness: Run `git fetch --all --prune` and check `git status -sb` before scoping work.
- [R13] Session-End State Obligation: Update `docs/CURRENT_STATE.md` before concluding any session modifying code.
- [R22] Implementation Plan Gate: No production code without an approved plan in `docs/plans/` (an approved spec `docs/specs/<slug>/tasks.md` counts as the plan), except on the TRIVIAL Fast Path (under ~30 changed lines, no new dependency, schema, auth, or public API change).
- [R15] Mandatory Design Gate: Creating or editing frontend UI files (`*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.css`) is blocked until an approved `DESIGN.md` exists at the project root. The UI Designer produces it with the `anti-ai-ui` skill.
- [R16] Humanizer Gate: Documentation, PR summaries, and PRDs in `/docs/` must pass `.agents/scripts/humanize-check.sh`. The Tech Writer owns this gate.
- [R23] Task Board Declaration: In guided/auto mode, declare an `[ IN_PROGRESS ]` task with an `Assignee:` in `docs/TASK_BOARD.md` before writing production code. Change modes only via `devos mode <mode>`.
<!-- END DEV-OS -->
