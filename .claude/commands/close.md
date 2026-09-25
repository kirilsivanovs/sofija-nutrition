---
description: Close a finished task — mark it done and move its folder into _archive/. Use after you have committed and merged its branch.
argument-hint: "SN-012"
---

Close the task in `$ARGUMENTS`. No sub-agent. This is the only way work leaves the board.

1. Find `.claude/tasks/<ID>/task.md`. A sub-task id (`SN-012.2`) → refuse: sub-tasks close with their parent; mark a single sub-task `status: done` with `/orchestrate force` only if the user insists.
2. Check, and report each in one line:
   - `status` is `review` or `done`. Anything earlier → say what is still owed (`/work <ID>`) and ask before closing anyway.
   - A `split: true` parent: every sub-task is `done` or `review`.
   - The branch from `branch:` — `git branch --merged origin/<default>` (after `git fetch --prune`) contains it, or it no longer exists locally. Unmerged, or uncommitted changes on it → say so and ask; never close silently over unmerged work.
3. Show what will happen — `status: done`, one `## Log` line, folder moved to `.claude/tasks/_archive/<ID>/` — and ask with `AskUserQuestion` unless every check passed and the user already said to close.
4. On yes: set `status: done` (and on each sub-task), append `- <date>: closed via /close — <merged|not merged, per user>`, update `updated:`, then move the folder with `Move-Item .claude/tasks/<ID> .claude/tasks/_archive/<ID>`.

Never delete the branch, never commit, never push. Report the new board count and the next most useful command (`/board` or `/work`).
