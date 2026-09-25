---
description: Fast lane for a small (S) task — plan, implement and test it in this session, then one independent review. Opt-in, fresh session only.
argument-hint: "SN-012"
---

Work the task in `$ARGUMENTS` end to end in this session. This is the one exception to "delegate; do not implement in the main session", and it exists only because the user chose it by typing `/quick`. Never enter this lane from `/work` or from plain language; offer it, and let the user type it.

## Before starting

1. **Fresh session only.** Check context with `mcp__ccd_session_mgmt__get_usage` (load it and `mcp__ccd_session_mgmt__clear_session` with one `ToolSearch select:` call). Over ~100k, or this session already worked another task → stop and offer `Очистить → /quick <ID>` the way `/work`'s Session hygiene does.
2. **Size S only.** Read `.claude/tasks/<ID>/task.md`. Refuse and point to `/work <ID>` when it has `size: M` or `L`, `architectural: true`, `split: true`, `kind: security`, or a Split with more than one row. With no analysis yet, judge it by `analyzer`'s definition (`.claude/agents/analyzer.md`, "Size"): one area, the failing function known, about five files or fewer. If you cannot name the function after one `Grep`, it is not S.
3. **Patient data.** If the change touches how personal or health data is stored, shown, logged or sent, it is not a `/quick` task — point to `/work <ID>`.
4. **Reality check** exactly as `/work` does it.

## One gate: plan and branch together

5. If `## Plan` exists, use it. Otherwise write a short one under `## Plan` in `dev-planner`'s format cut to size: Affected files (checked with one `Glob`), numbered steps, Testing plan with the exact command and `-t` filter from `CLAUDE.md` plus the area's typecheck/build, Risks. Put a two-line `## Analysis` above it if there is none. Set `size: S`, `kind`, `area`, `status: planned`, one `## Log` line.
6. Preview the branch with `.claude/scripts/prepare-branch.ps1 -Preview` (see `/work`, "Gate 2"). Show the steps, the test command and the branch in one message and close with `AskUserQuestion`. Nothing is edited in the repo until the user approves.

## Implement and verify

7. On approval, run the script without `-Preview`, record `branch`, `status: branched` and the log line, then `status: in-progress`.
8. Implement the steps following `CLAUDE.md` conventions.
9. If the change outgrows S — another area, a stored data shape, noticeably more files — stop, log what is done in one line, leave the edits uncommitted, and hand over to `/work <ID>`.
10. Run the Testing plan the way `/test` does, one result line. Red → fix and re-run, twice at most; still red → stop at `status: testing` and report. Green → `status: testing`.

## Review, once

11. Invoke `code-reviewer` once, with the task file's path and the result line from step 10. You wrote the code, so its independence is the point; do not argue with its findings or fix them in this run.
12. Set the status it earned as `/work` does, with one `## Log` line recording that the task went through `/quick`.

## Report

The steps as done, `git diff --stat`, the test result line, the reviewer's verdict and findings with every `file:line`, the new `status` and `branch`. Then the gate-3 options from `/work`, closing with `AskUserQuestion` and offering `Очистить` first.

Never commit, push or open a PR. Never run this on more than one task per session.
