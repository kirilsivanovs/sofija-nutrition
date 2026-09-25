---
description: Fast lane for a small (S) task — plan, implement and test it in this session, one independent review, then commit, merge and push like /work. Fresh session only.
argument-hint: "SN-012"
---

Work the task in `$ARGUMENTS` end to end in this session. This is the one exception to "delegate; do not implement in the main session", and it exists only because the user typed `/quick`. Never enter this lane from `/work` or from plain language.

Autopilot applies as in `/work`: no confirmation gates, take the recommended option, stop only at `/work`'s hard stops.

## Before starting

1. **Fresh session only.** Check context with `mcp__ccd_session_mgmt__get_usage`. Over ~100k, or this session already worked another task → stop and say to run `/quick <ID>` in a new session.
2. **Size S only.** Read `.claude/tasks/<ID>/task.md`. Hand over to `/work <ID>` (run it, don't ask) when it has `size: M` or `L`, `architectural: true`, `split: true`, `kind: security`, a Split with more than one row, or touches how personal or health data is stored, shown, logged or sent. With no analysis yet, judge by `analyzer`'s definition (`.claude/agents/analyzer.md`, "Size"): one area, the failing function known, about five files or fewer.
3. **Reality check** exactly as `/work` does it.

## Plan, branch, implement, verify

4. If `## Plan` exists, use it. Otherwise write a short one in `dev-planner`'s format cut to size (Affected files checked with one `Glob`, numbered steps, Testing plan with the exact command from `CLAUDE.md`, Risks) and a two-line `## Analysis`. Set `size: S`, `kind`, `area`, `status: planned`, one `## Log` line.
5. Cut the branch as `/work` step 3.
6. Implement the steps following `CLAUDE.md` conventions. If the change outgrows S, stop implementing, log it, and continue as `/work <ID>` from `status: in-progress`.
7. Run the Testing plan the way `/test` does. Red → fix and re-run, twice at most; still red → hard stop at `status: testing`.

## Review, then ship

8. Invoke `code-reviewer` once with the task file's path and the result line. You wrote the code, so its independence is the point. Fail → one fix round by a `developer` sub-agent (not you), then review again; still Fail → hard stop.
9. Pass → `/work` step 6: commit, merge to `main`, push (unless pre-deploy steps), clean up, archive. Log that the task went through `/quick`.

Report as `/work` does. Never run this on more than one task per session.
