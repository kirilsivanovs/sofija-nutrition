---
description: Work a task end to end on autopilot — analysis, plan, branch, implementation, verification, review, commit, merge to main, push, close. Stops only where no agent can act. Takes a task id, a category (design, security, ...) for its most urgent task, or nothing for the most urgent one overall.
argument-hint: "[SN-012 | SN-012.2 | design|functional|security|devops|maintenance — or nothing]"
---

Take one task from its current `status` all the way to `done`, running each stage in turn without asking. You are a router: analysing, planning, implementing and reviewing happen in sub-agents, because their context dies when they return and yours is re-sent for the rest of the session. The mechanical steps are yours: cutting the branch, running the plan's checks, committing, merging, pushing, archiving.

**Autopilot.** The user has chosen: no pull requests, and no confirmation gates. Wherever a choice comes up, take the option you would have marked `(Recommended)` and say in one line which you took. Do not call `AskUserQuestion` except at a hard stop (below), and even then only when there is a real choice between actions you can take.

## Find the task

Read the whole board in one call; don't open task files to browse:

```bash
grep -H -E '^(id|title|status|priority|kind|size|area|branch|parent|split|recurring|architectural):' .claude/tasks/[!_]*/*/task.md .claude/tasks/[!_]*/*/sub-tasks/*.md .claude/tasks/SN-*/task.md .claude/tasks/SN-*/sub-tasks/*.md 2>/dev/null
```

`$ARGUMENTS` names an id (case-insensitive) → that one. A `split: true` parent → its children in order, then the parent.

`$ARGUMENTS` names a category (a folder from the README's "Categories" table, case-insensitive; `дизайн`, `безопасность` etc. map to it) → the same pick as with no argument, but only among tasks in `.claude/tasks/<category>/`. Say which task it picked and why in one line. Nothing left in that category → say so, and name the category's archive count.

No argument → the most advanced task: `review` → `testing` → `in-progress` → `branched` → `planned` → `analyzed` → `new`; within a status, `priority` first (P0 → P3), then oldest. Skip `recurring: true` with an empty `## Pending batch`. Nothing left → say so and suggest `/new`.

Skip (and say why) any task with a live `.lock` (not stale per the README's rule), any task whose `depends:` names an id whose `task.md`/parent isn't `status: done`, and — once both tasks have a `## Plan` — any task whose plan's Affected files overlap a currently-locked in-flight task's. This applies to auto-pick, a category argument, and an explicit id alike.

One task per `/work`. When it is done, name the next one in one line; don't start it.

## Claim the task

Once a task is chosen, atomically create its `.lock` at `.claude/tasks/<cat>/<ID>/.lock` (`branch: <best-guess or blank if not yet cut>`, `worktree: (pending)`, `claimed: <now, ISO 8601>`) using `[System.IO.File]::Open($path,[System.IO.FileMode]::CreateNew)`, then close it. `CreateNew` throwing means another session claimed it in the meantime — report that and pick the next task instead of retrying. The lock is deleted at step 6's cleanup.

## Check the status against the file

| `status` | Must contain | Otherwise treat as |
|---|---|---|
| `analyzed` and later | non-empty `## Analysis` | `new` |
| `planned` and later | non-empty `## Plan` (on a split parent: in its sub-tasks) | `analyzed` |
| `branched` and later | `branch` set (a sub-task: on its parent) | `planned` |

Correct downwards only, and say so in one line.

## Reality check

From the repo root (add `-c safe.directory=<repo-path-with-forward-slashes>` to git if it refuses with "dubious ownership"):

```powershell
git branch --show-current
git status --short
```

- Untracked `_design-backup/` and `.vscode/mcp.json` are known local clutter; ignore them everywhere below and never stage them.
- A branch for this id exists but `status` < `branched` → adopt it (as `/orchestrate adopt <ID>`) and continue.
- Uncommitted changes to tracked files on a branch that is not this task's → **hard stop**. Never stash, discard, reset or carry them across.
- `branch` names a branch that no longer exists → cut it again.

## The route

Run these in order from wherever `status` puts the task. After each stage, write one progress line to the user (stage · outcome · new status) and go straight on.

| # | `status` | Stage | Moves to |
|---|---|---|---|
| 1 | `new` | `analyzer` (opus) | `planned` (S/M, with its plan) or `analyzed` (L) |
| 2 | `analyzed` | `dev-planner` (`architect` first if `architectural: true`) | `planned` |
| 3 | `planned` | cut the branch (you) | `branched` |
| 4 | `branched` / `in-progress` | `developer` | `testing` |
| 5 | `testing` | verification (you) → `code-reviewer` | `review` |
| 6 | `review` | fix rounds if needed, then commit → merge → push → close (you) | `done` |

Pass a sub-agent the task file's path and nothing else, unless it needs what the file cannot carry (failures or findings for `developer`, the verification result for `code-reviewer`, new inputs for a top-up). Never give a writing agent `isolation: worktree`.

**Downgrade `analyzer` to sonnet** (Agent `model: "sonnet"`) when the task already names the failing function with its `file:line` and is local to one area; `kind: security` or anything touching patient data stays on opus.

**`architectural: true`** → run `architect` (opus) once, then `dev-planner`. Say that the task pays for a second opus pass and why.

**New input after the analysis** (newest `## Inputs` entry newer than the analyzer's last `analyzed`/`planned` log line, before a branch exists) → run `analyzer` as a top-up on sonnet first.

### 3. Cut the branch

First check whether this session is in a worktree slot: `git rev-parse --git-dir` vs `git rev-parse --git-common-dir` — equal → **main checkout**, different → **in a slot**.

**Main checkout** → do not cut the branch. List slots (`Get-ChildItem ../sofija-nutrition-astro-wt -Directory`), and for each run `git -C <slot> branch --show-current` (empty output = free). Report the first free slot, or, if none is free, say to run `.claude/scripts/manage-worktree-slot.ps1 -Action Create -Slot <n+1>`. This session hands the task off, so delete its `.lock` and add one `## Log` line (`handed off, waiting for a slot session`); otherwise the slot session would skip it as locked. Stop here — this is a hard stop (below).

**In a slot** → proceed as before. Name: `<id-lowercased>-<short-slug-of-title>`. A sub-task uses its parent's branch. Base: `main`, unless the plan says the task stacks on another task's unmerged branch.

```powershell
& .\.claude\scripts\prepare-branch.ps1 -Id <ID> -Name <name> [-Base <branch>]
```

Exit 2 → report the reason exactly; a dirty tree is a hard stop. Then record `branch`, `status: branched`, one `## Log` line, and update this task's `.lock`: set `worktree:` to the slot path (`git rev-parse --show-toplevel`) in place of `(pending)`.

A task under `.claude/tasks/design/` → before `developer` starts, invoke `tester` with the task path and **baseline**, so `before-*` screenshots of the unchanged pages exist. A failed baseline (dev server won't start) is logged in one line and does not stop the task.

### 5. Verification and review

- **Verification is yours.** Run the plan's Testing plan as `/test` does (`.claude/commands/test.md`). Reduce it to one result line; never paste output.
- Invoke `code-reviewer` with the task file's path and that result line.
- Verification pass and verdict **Pass** or **Pass with notes** → `status: review` and go to step 6. Notes are logged in one line and not fixed.
- Verification fail, or verdict **Fail** → a **fix round**: invoke `developer` with the failures and findings verbatim, then verify and review again. At most **two** fix rounds per task; still failing after the second → hard stop.
- `tester` runs automatically, after `code-reviewer` passes, when the plan names a browser scenario, and **always** for a task under `.claude/tasks/design/` (its design check, `.claude/agents/tester.md`). Its fail, including any failed design-checklist item, counts as a verification fail. "Could not verify" on a design task is not a pass: fix what blocked it or hard-stop.
- Design task passed → in the final report give the screenshot folder (`.claude/tasks/design/<ID>/notes/screenshots/<task-id>/`) so the user can compare `before-*` and `after-*`.

### 6. Commit, merge, push, close

1. **Commit on the task branch.** Stage exactly the files `developer` reported and `git status` shows as changed — never `git add -A`, never the known clutter, never anything under `.claude/tasks/`. One commit, Conventional Commits style matching the history (`fix(api): …`, `feat: …`, `chore: …`), subject in English, the task id in the body (`Task: SN-012`), then the `Co-Authored-By` trailer for the model running this session.
2. **Pre-deploy steps.** If the plan's **Production / manual steps** include anything needed *before* the code reaches production, run the ones the Azure/GitHub rule in `CLAUDE.md` allows yourself (one line per command). If any step needs a secret value or falls outside that rule, stop here: the commit is on the task branch, not pushed. Report those steps; the user says "пушь" when done. Steps that come *after* deploy don't stop the push; list them in the final report.
3. **Rebase onto main.** `git fetch origin --prune`, then `git rebase origin/main` on the task branch. A rebase conflict → `git rebase --abort` and hard stop.
4. **Re-run verification.** A rebase can shift line numbers or break a test; treat a failure here as a fix round, the same budget (two rounds) as step 5's own.
5. **Push.** `git push origin HEAD:main`. Not fast-forward (rejected, main moved again) → repeat 6.3–6.5 once; still rejected → hard stop. Say that this deploys: the frontend after CI passes, the API immediately when `api/**` or `shared/**` changed.
6. **Clean up.** `& .\.claude\scripts\manage-worktree-slot.ps1 -Action Reset -Slot <n> -Branch <branch>` (resets the slot to detached `origin/main`, deletes the local branch), delete this task's `.lock`, set `status: done` (and on sub-tasks), one `## Log` line with the commit hash, move the folder from `.claude/tasks/<category>/<ID>/` to `.claude/tasks/_archive/<category>/<ID>/` (create the category folder if missing).

Never force-push, never `reset --hard`, never rewrite pushed history, never push anything other than `HEAD:main` unless the user asks.

## Hard stops

The only places `/work` stops before `done`:

- The session is in the main checkout, not a worktree slot, and the task is ready to branch (step 3) — name a free slot; the user opens a session there.
- `analyzer` or `architect` blocked on a question only the user or Sofija can answer (copy, prices, policy, a production fact) — report the question and who has it.
- Uncommitted changes that don't belong to this task.
- Still failing after two fix rounds.
- A rebase conflict.
- Pre-deploy manual steps (step 6.2).
- Push rejected twice (step 6.5).
- A stage truncated twice (the task needs a smaller split — run `/orchestrate force dev-planner <ID>`).
- Anything the plan says needs a secret value, a data repair, or an Azure/GitHub change outside the `CLAUDE.md` rule — the user does those.

At a hard stop: say what stopped, what is already done (commit hashes, branch, status), and the one thing that unblocks it. Leave the board in an honest state.

## Work an agent left out of scope

When a report says work was found and not done, don't stretch this task. Create a new task for it with the `/new` procedure (`.claude/commands/new.md`), `source: "found in <ID>"`, and mention its id in the final report.

## Report

Progress lines as you go (one per stage). At the end:

1. What changed: commit hash on `main`, `git show --stat` summary in one or two lines.
2. Verification result line and the reviewer's verdict, with any notes as `file:line`.
3. What the user must still do in production, if anything, with the change-management note.
4. The next task by priority, as the command to run.

## Session hygiene

Model and effort are set once per session in `.claude/settings.json`. Never switch the model mid-session.

A full `/work` run leaves a lot in this session's context. After the final report, if context is over ~150k tokens (`mcp__ccd_session_mgmt__get_usage`), say in one line that a fresh session is cheaper for the next task; don't clear it yourself.
