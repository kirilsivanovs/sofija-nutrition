---
description: Review a task's diff now, whatever state it is in. Read-only — reports findings, fixes nothing.
argument-hint: "SN-012 | SN-012.2"
---

Run `code-reviewer` against the task in `$ARGUMENTS`, whatever its `status`. `/work` reviews automatically when a task reaches `status: review`; this is for a verdict out of turn.

1. Find it: `.claude/tasks/<category>/<ID>/task.md`, or a `sub-tasks/` file for a `.N` id. Not found → say so and stop.
2. No `branch` (on it or its parent) and nothing uncommitted → say there is no diff to review and stop.
3. Invoke `code-reviewer` with the task file's path. Pass on any specific concerns the user named in `$ARGUMENTS`.
4. Relay the verdict and findings as returned — every `file:line` intact.

The task's `status` does not change, whatever the verdict. If it passed and the task was already at `review`, say that `/work <ID>` commits, merges and pushes it.

Never fix anything here, and never re-run `developer` off the findings without the user asking.
