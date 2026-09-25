---
description: Advanced board operations the everyday commands do not cover — forcing a stage, recurring-task items, adopting hand-started work, board integrity checks.
argument-hint: "force <stage> <id> | adopt <id> | capture-to <id> \"...\" | reindex"
---

# /orchestrate

The everyday commands cover normal work: `/new`, `/brief`, `/work`, `/board`, `/find`, `/test`, `/review`, `/close`. This one exists for the cases they deliberately leave out.

**Routing is defined once, in `.claude/commands/work.md`** — the state table, the autopilot rule, the hard stops. Never contradict it. The board's layout and schema are in `.claude/tasks/README.md`.

## `capture-to <task-id> "<item>"`

Append an item to an existing **recurring** task (copy fixes, translation gaps, small design nits). No sub-agent:

1. Read `.claude/tasks/<category>/<task-id>/task.md`. Missing, or not `recurring: true` → stop and say so.
2. Append one unchecked bullet to `## Pending batch` — never `## Current batch`, a round may be in flight. Update `updated:`. Don't touch `status`.
3. Report the id and the appended item.

## `force <stage> <task-id>`

Run a specific stage against a task whose `status` would have routed elsewhere — `analyzer`, `architect`, `dev-planner`, `designer`, `branch-preparer`, `developer`, `tester`, `code-reviewer`. `tester` is for a browser scenario the plan names, or when the user asks; its pass moves `testing` → `review`. Use this for re-planning, re-diagnosing a bug whose stated cause turned out wrong, or overriding the `architectural` flag.

Say in one line which stage the normal route would have chosen and why you are overriding it, then invoke that one agent and report as `/work` does.

`architect` is never selected by `/work`, so **this command is the only way it runs**. Before invoking it, say in one sentence what the analysis left unsettled and why a person cannot answer it faster. Whichever way the flag is resolved, clear it afterwards.

## `adopt <task-id>`

Bring work started by hand into the board. No sub-agent.

1. Find the branch: `git branch --list "<id-lowercased>-*"`, or the one the user names. Record it in `branch`.
2. **Do not advance `status` past what the file earns.** Empty `## Plan` → leave `status`; the pipeline still owes a planning pass. Plan written and branch exists → `status: branched`.
3. Leave every uncommitted change exactly where it is. Never stash, reset, commit or switch branches.
4. Append one dated `## Log` line: the branch adopted, and that it was created outside the pipeline.

## `reindex`

Sanity-check the board and report, changing nothing unless the user asks: ids that don't match their folder, duplicate or reused ids (including `_archive/`), a `parent:` pointing at nothing, a sub-task whose parent isn't `split: true`, an `area` not in the `CLAUDE.md` table, a frontmatter field the schema does not define, anything in `_archive/` not at `status: done`, a `branch` naming a branch that no longer exists, a task file over 12 KB, a task folder outside the README's category folders (legacy flat `SN-*` or an unknown category), and anything in `.claude/tasks/` that `git check-ignore` says is **not** ignored (the board must never reach the public repo). Cheap — the README `grep`, one `git branch --list`, one `git check-ignore -v .claude/tasks/x`.

## Hard rules

These hold for every command:

- **Autopilot**, per `work.md`: no confirmation gates; take the recommended option and say which. `force` runs the one stage named and then continues the normal route from the resulting status, as `/work` would.
- **Never make a state change the user has not seen previewed.** Anything beyond the task's own files — cutting a branch, archiving a folder — is shown first and done second.
- **Sub-agents never talk to each other.** They report to you; you report to the user.
- **Git only as `work.md` step 6 does it**: one commit per task, fast-forward into `main`, `git branch -d` after merge. No force-push, no `reset --hard`, no rewriting pushed history.
- **Never create a sub-agent**, and never invent a board field or folder that isn't in `.claude/tasks/README.md`.
- Never fix, edit or implement anything in this session, however small (`/quick` is the user's explicit exception).
- `analyzer` is the only opus stage on every route, and `architect` the only opus agent off it; `designer` is opus too, but only on a `design/` task's route. Forcing any of the three a second time on the same task means the first run was wrong — say that out loud.
