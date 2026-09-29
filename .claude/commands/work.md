---
description: Work a task end to end on autopilot — files it on the board if it isn't there yet, then analysis, plan, branch, implementation, verification, review, commit, merge to main, push, close. Stops only where no agent can act. Takes a task id, a new title to file, a category (design, security, ...) for its most urgent task, or nothing for the most urgent one overall.
argument-hint: "[SN-012 | SN-012.2 | \"<new title>\" | design|functional|security|devops|maintenance | SN-012 re-analyze — or nothing]"
---

Take one task from its current `status` all the way to `done`, running each stage in turn without asking. You are a router: analysing, planning, implementing and reviewing happen in sub-agents, because their context dies when they return and yours is re-sent for the rest of the session. The mechanical steps are yours: filing a new task, cutting the branch, running the plan's checks, committing, merging, pushing, archiving.

**Autopilot.** The user has chosen: no pull requests, and no confirmation gates. Wherever a choice comes up, take the option you would have marked `(Recommended)` and say in one line which you took. Do not call `AskUserQuestion` except at a hard stop (below), and even then only when there is a real choice between actions you can take.

## Find or create the task

Read the whole board in one call; don't open task files to browse:

```bash
grep -H -E '^(id|title|status|priority|kind|size|area|branch|parent|split|recurring|architectural):' .claude/tasks/[!_]*/*/task.md .claude/tasks/[!_]*/*/sub-tasks/*.md .claude/tasks/SN-*/task.md .claude/tasks/SN-*/sub-tasks/*.md 2>/dev/null
```

`$ARGUMENTS` names an id (case-insensitive) → that one, plus anything after it (see "Plain-language stage overrides" below). A `split: true` parent → its children in order, then the parent.

`$ARGUMENTS` names a category (a folder from the README's "Categories" table, case-insensitive; `дизайн`, `безопасность` etc. map to it) → the same pick as with no argument, but only among tasks in `.claude/tasks/<category>/`. Say which task it picked and why in one line. Nothing left in that category → say so, and name the category's archive count.

No argument → the most advanced task: `review` → `testing` → `in-progress` → `branched` → `planned` → `analyzed` → `new`; within a status, `priority` first (P0 → P3), then oldest. Skip `recurring: true` with an empty `## Pending batch`. Nothing left → say the board is empty.

`$ARGUMENTS` names an id found only under `.claude/tasks/_archive/**/<ID>/` → **reopened**: `& .\.claude\scripts\log-outcome.ps1 -Ticket <ID> -Verdict reopened`, move the folder back to its category, say it was reopened, then route it by its own `status`.

Otherwise → **file it as a new task**, no sub-agent: `Glob .claude/tasks/**/SN-*/task.md` (every category, archive and legacy folders), take the highest number + 1, three digits (`SN-001` on an empty board, never reuse an archived id). Pick the category from the README's table by the main risk (a data leak in a UI bug is `security`); say which you chose. Create `.claude/tasks/<category>/<ID>/task.md` from `_TEMPLATE.md`: `title` — a short imperative in English (translate if given in Russian, keep the meaning); `priority` — `P0` for a security hole or patient-harm risk, `P2` otherwise, or whatever `$ARGUMENTS` names explicitly; `status: new`, `area: unspecified`, `source: "/work"`, today's dates; `## Description` in two to five bullets from what was said; `## Acceptance criteria` only if criteria were actually stated; `## Inputs` for any links/pasted text/files exactly as `/brief` files them (personal-data rule included); one `## Log` line. Report the id, title and priority, then go straight on into routing it as `new` below. If the request is clearly several independent pieces of work, say so and create one task per piece only on a yes — otherwise file the one task as given.

One task per `/work`. When it is done, name the next one in one line; don't start it.

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
- A branch for this id exists but `status` < `branched` → **adopt** it, no sub-agent: `git branch --list "<id-lowercased>-*"` (or the branch the user names), record it in `branch`, but do not advance `status` past what the file earns (empty `## Plan` → leave `status`; plan written and branch exists → `status: branched`). Leave every uncommitted change exactly where it is — never stash, reset, commit or switch branches. Append one dated `## Log` line naming the branch and that it was created outside the pipeline. Then continue.
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

**A task under `.claude/tasks/design/`** takes a longer route at steps 1–2: `analyzer` (never writes `## Plan` for a `design/` task, sets `status: analyzed`) → `designer` in `direction` mode (writes `## Design direction`) → `dev-planner` → cut the branch. This costs a second opus pass (`designer` runs at `model: opus`, `effort: high`); say so in one line when you take it.

**Downgrade `analyzer` to sonnet** (Agent `model: "sonnet"`) when the task already names the failing function with its `file:line` and is local to one area; `kind: security` or anything touching patient data stays on opus.

**`architectural: true`** → run `architect` (opus) once, then `dev-planner`. Say that the task pays for a second opus pass and why.

**New input after the analysis** (newest `## Inputs` entry newer than the analyzer's last `analyzed`/`planned` log line, before a branch exists) → run `analyzer` as a top-up on sonnet first.

### 3. Cut the branch

Name: `<id-lowercased>-<short-slug-of-title>`. A sub-task uses its parent's branch. Base: `main`, unless the plan says the task stacks on another task's unmerged branch.

```powershell
& .\.claude\scripts\prepare-branch.ps1 -Id <ID> -Name <name> [-Base <branch>]
```

Exit 2 → report the reason exactly; a dirty tree is a hard stop. Then record `branch`, `status: branched`, one `## Log` line.

A task under `.claude/tasks/design/` → before `developer` starts, invoke `tester` with the task path and **baseline**, so `before-*` screenshots of the unchanged pages exist. A failed baseline (dev server won't start) is logged in one line and does not stop the task.

### 5. Verification and review

- **Verification is yours.** From the repo root, on the task's branch, run each command the plan's Testing plan names (the forms are in `CLAUDE.md`, "Build / test"): `npx jest`/`npx jest -c api/jest.config.js`/`npx jest -c shared/jest.config.js` with the exact file and `-t` filter, `npx tsc -p api/tsconfig.json --noEmit` for an api change, `npm run build` for a frontend change. No Testing plan recorded → run the suite for the changed area plus that area's typecheck/build, and say you did that because the plan named none. The hook trims Jest/Playwright output — don't add flags, don't pipe it. Reduce it to one result line; never paste output.
- The diff touches `shared/**` → also run the full `npx jest -c api/jest.config.js` and `npx jest -c shared/jest.config.js` suites (no `-t` filter), in addition to whatever the plan's Testing plan or the changed-area default already covers, and say this ran because `shared/**` changed. `shared/translations.js` is consumed by both `api` and the frontend build; a plan scoped to one area can miss a break in the other.
- Invoke `code-reviewer` with the task file's path and that result line.
- Invoke `code-reviewer` with Agent `model: "opus"` instead when the task is `kind: security` or the diff touches patient data; otherwise its frontmatter model (sonnet) stays.
- Verification pass and verdict **Pass** or **Pass with notes** → `status: review` and go to step 6. Notes are logged in one line and not fixed. Log it: `& .\.claude\scripts\log-outcome.ps1 -Ticket <ID> -Size <size> -Stage code-reviewer -Round <N> -Verdict pass -Tests pass`.
- Verification fail, or verdict **Fail** → a **fix round**: log one `## Log` line, `review round N: <verdict> (K blocking)`, and `& .\.claude\scripts\log-outcome.ps1 -Ticket <ID> -Size <size> -Stage code-reviewer -Round <N> -Verdict fail -Blocking <K> -Tests fail`, then invoke `developer` with the failures and findings verbatim, and verify and review again. `code-reviewer` and `tester` rejections count together toward the same cap, per task or sub-task. At most **two** rounds; still failing with blocking findings open after the second → the one hard stop that asks (see Hard stops): list the open blocking findings and offer fix once more (explicit override) / accept with a follow-up task (file it the way "Find or create the task" does) / re-plan via `dev-planner` / abandon.
- `tester` runs automatically, after `code-reviewer` passes, when the plan names a browser scenario, and **always** for a task under `.claude/tasks/design/` (its design check, `.claude/agents/tester.md`). Its fail, including any failed design-checklist item, counts as a verification fail and as a round toward the same cap as `code-reviewer`. "Could not verify" on a design task is not a pass: fix what blocked it or hard-stop.
- Design task passed → in the final report give the screenshot folder (`.claude/tasks/design/<ID>/notes/screenshots/<task-id>/`) so the user can compare `before-*` and `after-*`.
- Design task passed `tester` → invoke `designer` in `visual review` mode. `done` → continue to step 6. A refinement list → pass it verbatim to `developer`, then run verification (this section) and `code-reviewer` again, then `tester` again. At most **2 refinement rounds**, separate from and after the fix rounds above; still not `done` after 2 → log the remaining refinements as a new task (per "Find or create the task") and continue to step 6 — this is not a hard stop. List the refinement rounds taken in the final report.

### 6. Commit, merge, push, close

1. **Commit on the task branch.** Stage exactly the files `developer` reported and `git status` shows as changed — never `git add -A`, never the known clutter, never anything under `.claude/tasks/`. One commit, Conventional Commits style matching the history (`fix(api): …`, `feat: …`, `chore: …`), subject in English, the task id in the body (`Task: SN-012`), then the `Co-Authored-By` trailer for the model running this session.
2. **Update main.** `git fetch origin --prune`, `git checkout main`, `git merge --ff-only origin/main`.
3. **Merge.** `git merge --ff-only <branch>`. Not fast-forward (main moved) → `git checkout <branch>`, `git rebase main`, re-run verification, then merge again. A rebase conflict → `git rebase --abort` and hard stop.
4. **Pre-deploy steps.** If the plan's **Production / manual steps** include anything needed *before* the code reaches production, run the ones the Azure/GitHub rule in `CLAUDE.md` allows yourself (one line per command). If any step needs a secret value or falls outside that rule, stop here: the commit is on local `main`, not pushed. Report those steps; the user says "пушь" when done. Steps that come *after* deploy don't stop the push; list them in the final report.
5. **Push.** `git push origin main`.
6. **Wait for CI, then Deploy.** `$sha = git rev-parse HEAD`. Poll `gh run list --commit $sha --json databaseId,status,conclusion,event --limit 10` (or `gh run watch <databaseId> --exit-status` once the `CI` row's `databaseId` is known) until the `CI` row is `status: completed`. `conclusion` != `success` → report it, do not say the change is deployed, leave the task open (or file a follow-up per "Find or create the task") and stop here — skip the rest of this step. `conclusion: success` → `Deploy` fires via `workflow_run`; poll `gh run list --workflow=deploy.yml --json databaseId,status,conclusion,headSha,event --limit 5` for the row whose `headSha` matches `$sha`, wait for `status: completed` the same way. Report both conclusions in the progress line; only say the change is deployed when `Deploy`'s `conclusion` is `success`.
7. **Clean up.** `git branch -d <branch>` (it is merged, so `-d` succeeds; if it refuses, leave it and say so). Set `status: done` (and on sub-tasks), one `## Log` line with the commit hash and the CI/Deploy conclusions, move the folder from `.claude/tasks/<category>/<ID>/` to `.claude/tasks/_archive/<category>/<ID>/` (create the category folder if missing), and `& .\.claude\scripts\log-outcome.ps1 -Ticket <ID> -Size <size> -Verdict pass`.

Never force-push, never `reset --hard`, never rewrite pushed history, never push a branch other than `main` unless the user asks.

## Plain-language stage overrides

Phrases after the id run one specific stage instead of the routed one, then continue the normal route from the resulting status, reporting as this file always does — say in one line which stage the route would have picked and why you're overriding it. "Re-analyze" → `analyzer` (a full re-run, not a top-up — say the previous run was wrong, since a second one on the same task means the first was). "Re-plan" → `dev-planner`. "Design direction again" / "redo the design" → `designer`. "Re-branch" / "cut the branch again" → `prepare-branch.ps1`. "Send back to developer" / "re-implement" → `developer` with the open findings. "Re-review" → `code-reviewer` out of turn. "Needs architect" → `architect` (opus; say what the analysis left unsettled and why a person can't answer it faster — clear `architectural: true` afterwards whichever way it's resolved). "Tester" / "check it in the browser" → `tester`.

"Add `<item>` to `<recurring task>`" appends one unchecked bullet to that task's `## Pending batch` (never `## Current batch`), updates `updated:`, no sub-agent — refuse if the task isn't `recurring: true`.

"Close `<ID>`" for a task finished by hand, outside this route: check `status` is `review` or `done`, a `split: true` parent has every sub-task `done` or `review`, and the branch (`git branch --merged origin/main` after `git fetch --prune`) is merged or gone — any check failing, say which and ask before closing anyway. Then run step 6's "Clean up" alone (no commit/merge/push, they already happened by hand).

## Hard stops

The only places `/work` stops before `done`:

- `analyzer` or `architect` blocked on a question only the user or Sofija can answer (copy, prices, policy, a production fact) — report the question and who has it.
- Uncommitted changes that don't belong to this task.
- Still failing (code-reviewer or tester) after two fix rounds, blocking findings still open — the one hard stop that closes with `AskUserQuestion` instead of just reporting: fix once more / accept with follow-up / re-plan / abandon.
- A rebase conflict.
- Pre-deploy manual steps (step 6.4).
- A stage truncated twice (the task needs a smaller split — force `dev-planner`, see "Plain-language stage overrides").
- Anything the plan says needs a secret value, a data repair, or an Azure/GitHub change outside the `CLAUDE.md` rule — the user does those.

At a hard stop: say what stopped, what is already done (commit hashes, branch, status), and the one thing that unblocks it. Leave the board in an honest state.

## Work an agent left out of scope

When a report says work was found and not done, don't stretch this task. File a new task for it the way "Find or create the task" does, `source: "found in <ID>"`, and mention its id in the final report.

## Self-improving loop

At most once every 7 days (check the newest date under `.claude/metrics/proposals/`), after reporting, run the `retro` skill. It reads `.claude/metrics/outcomes.jsonl` and `changelog.md`, does a small web-scouting pass in a sonnet sub-agent, and writes up to 3 proposals to `.claude/metrics/proposals/<date>.md`. Append them after the report; applying one is the user's approval, then edit the file and log it in `changelog.md`.

## Report

Progress lines as you go (one per stage). At the end:

1. What changed: commit hash on `main`, `git show --stat` summary in one or two lines, and the CI/Deploy conclusion for the pushed sha (or "still running" / "stopped: CI red" if it didn't reach a deploy).
2. Verification result line and the reviewer's verdict, with any notes as `file:line`.
3. What the user must still do in production, if anything, with the change-management note.
4. The next task by priority, as the command to run.
5. Retro proposals, if this run produced any (see above).

## Session hygiene

Model and effort are set once per session in `.claude/settings.json`. Never switch the model mid-session.

A full `/work` run leaves a lot in this session's context. After the final report of a run that closed a task, or when context is over ~150k tokens (`mcp__ccd_session_mgmt__get_usage`), say in one line that `/clear` before the next task is cheaper; don't clear it yourself.
