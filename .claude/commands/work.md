---
description: Work a task — runs whichever pipeline stage it needs next, then reports. Takes a task id, or nothing to continue the most advanced one.
argument-hint: "[SN-012 | SN-012.2 — or nothing]"
---

Advance one task by one stage (or one implementation chain), then report. You are a router: analysing, planning, implementing and reviewing all happen in sub-agents, because their context dies when they return and yours is re-sent for the rest of the session. The two mechanical steps are yours, because an agent startup costs more than they do: cutting the branch with a script, and running the plan's checks before review. The rationale is in `.claude/TOKEN-BUDGET.md`; you do not need to read it.

## Find the task

Read the whole board in one call; don't open task files to browse:

```bash
grep -H -E '^(id|title|status|priority|kind|size|area|branch|parent|split|recurring|architectural):' .claude/tasks/*/task.md .claude/tasks/*/sub-tasks/*.md 2>/dev/null
```

`$ARGUMENTS` names an id (case-insensitive) → that one. A `split: true` parent → its lowest-numbered child that isn't `done`; say which.

No argument → the most advanced task: `review` → `testing` → `in-progress` → `branched` → `planned` → `analyzed` → `new`; within a status, `priority` first (P0 → P3), then oldest. Skip `recurring: true` with an empty `## Pending batch`. Nothing left → say so and suggest `/new`.

A gate you just described wins over this rule: a bare "yes" (`да`, `давай`, `продолжай`, `ок`, `go`, `+`) runs the stage you described, on the task you described it for. A yes with a rider ("да, но сначала…") is a yes plus an instruction for the agent's prompt.

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
git branch --list "<id-lowercased>-*"
git status --short
```

- A branch for this id exists but `status` < `branched`, or uncommitted changes on it → the user started by hand. Report the files and ask; on confirmation adopt it (as `/orchestrate adopt <ID>`).
- Uncommitted changes on an unrelated branch → report in one line and stop. The branch step refuses a dirty tree, and `developer` must not build on someone else's edits.
- `branch` names a branch that no longer exists → gate 2 must run again, not `developer`.

Never stash, discard, reset or force; never edit frontmatter to match disk without saying so.

## Route

| `status` | Stage | Result |
|---|---|---|
| `new`, no `## Analysis` | `analyzer` (opus) | `size: S`/`M`: `status: planned` with its own `## Plan`; `size: L`: `status: analyzed` → **gate 1** either way |
| `new`, `## Analysis` present | — | blocked, see below |
| `analyzed` + `architectural: true` | — | stop and ask: `/orchestrate force architect <ID>`, or clear the flag and plan |
| `analyzed` | `dev-planner` | `status: planned` |
| `planned` | **gate 2**, then `prepare-branch.ps1` (you run it) | `status: branched` |
| `branched` / `in-progress` | `developer` → verification → `code-reviewer` | the implementation chain → **gate 3** |
| `testing` | verification → `code-reviewer` | the chain resumed |
| `review` | `code-reviewer` | a verdict |
| `done` | — | say it's closed |

Pass a sub-agent the task file's path and nothing else, unless it needs what the file cannot carry (failures or findings when re-running `developer`, the verification result for `code-reviewer`, the new inputs for a top-up).

Never give a writing agent `isolation: worktree`, and don't run the pipeline from `claude --bg`: a worktree does not carry uncommitted changes, and each seam builds on the previous seams' uncommitted edits.

**Downgrade `analyzer` to sonnet** (Agent `model: "sonnet"`) when the task already names the failing function with its `file:line` (typically a task filed from the audit) and the fix is local to one area; say so in one line. `kind: security` or anything touching patient data stays on opus.

### New input after the analysis

If the newest dated `## Inputs` entry is newer than the newest `analyzed`/`planned` line `analyzer` wrote in `## Log`, then at `status: analyzed` — or at `planned` with `size` S or M and no `branch` yet — run `analyzer` as a **top-up** on sonnet, naming the entries it has not seen. A structural contradiction stops there; a full re-analysis is `/orchestrate force analyzer <ID>`, the user's call.

### Blocked task

`status: new` with an analysis means `analyzer` held it on missing input. Report the blocker and who has it (often Sofija: copy, prices, working hours, policy). Re-run `analyzer` only when the input arrived (`/brief`), and pass what changed.

### Gate 2: preview the branch

1. Name it `<id-lowercased>-<short-slug-of-title>` (three or four words of slug). A sub-task uses its parent's branch; if the parent has one, skip this gate.
2. Base: the default branch, unless the plan says this task stacks on another task's unmerged branch — then `-Base <that task's branch:>`, and say why.
3. Preview read-only and show the result:

   ```powershell
   & .\.claude\scripts\prepare-branch.ps1 -Id <ID> -Name <name> [-Base <branch>] -Preview
   ```

4. On confirmation, run the same line without `-Preview`. Exit 0 means ready; 2 means refused — report the reason exactly (a dirty tree is the usual one: the user's own WIP must be committed or moved first, never stashed by you).
5. Record the result yourself with Edit: `branch: <name>`, `status: branched`, one `## Log` line with base and created/existed, and `updated:`.

If the script cannot run at all, say so and offer `/orchestrate force branch-preparer <ID>`.

### The implementation chain

`developer` → verification → `code-reviewer`, without stopping in between while each link passes, then one report.

- `developer` unfinished or truncated → stop and gate.
- **Verification is yours.** Run the plan's Testing plan exactly as `/test` does (`.claude/commands/test.md`). Don't read source files, never paste the output. Reduce it to one result line: pass/fail counts, then test · assertion · `file:line` per failure, or the first build/type error with `file:line`.
- Invoke `code-reviewer` with the task file's path and that result line, saying which commands produced it. If you could not verify (no Testing plan, a check that needs a backend you don't have), pass no result and say so.
- A red run does not stop the chain: the reviewer still reviews.
- After the reviewer, **you** set the status it earned, with Edit plus one `## Log` line: verification pass → `status: review`; fail or unverifiable → leave `status: testing`.
- The chain never re-runs `developer` against findings; that is the user's call at gate 3.
- `tester` is off the route. Use it when the plan names a browser scenario, or when the user asks (`/orchestrate force tester <ID>`); offer it at gate 3 for any `frontend` task whose plan has one.

### A stage came back unfinished

Read the state off disk, re-invoke the same agent saying what exists and what is left, and say you are finishing a truncated stage. The same stage truncating twice → the task needs a smaller split.

### Work an agent left out of scope

When a report or log line says work was found and not done, surface it at the gate: what is missing, where, the files named, and `/new "<title>"` (an unrelated problem) or `/orchestrate force dev-planner <ID>` (part of this task). Don't create tasks or sub-tasks yourself.

### Split parents

On `split: true`, count `## Analysis` → Split rows against `sub-tasks/*.md` before routing and before reporting the parent finished. Rows > files → route via `/orchestrate force dev-planner <ID>`. A parent never reaches `done` while a row has no sub-task.

## Gates

Three: **1** after `analyzer` (relay its analysis in full — requirement, root cause, Split table, production/manual steps; for S/M the plan's step headings and test command too), **2** before cutting the branch, **3** after the review verdict. For `size: S`, `/quick <ID>` in a fresh session is a real alternative at gate 1; offer it, never as the default. Never perform a state change the user has not seen previewed.

At gate 3: **Pass** → report, list the production/manual steps from the plan the user must do after merging (with the change-management note), and say what closing does (`/close <ID>` after the branch is merged). **Fail / Pass with notes** → report the findings, stop.

Never chain two stages in one Agent call, never commit, push or open a PR.

## Report

1. Which stage ran and why — one line.
2. The agent's report, keeping every path, `file:line`, error, finding and branch name. After a stage that writes code, check it first: `git diff --stat`, plus one `grep` for a claim worth checking. Where report and repo disagree, relay the repo.
3. New `status`, and `branch` if it changed.
4. The gate: **next stage** (agent, model, what it will change), **command**, **yours** (anything only the user can do, with its command). Say so when nothing can move until X.

Then close with `AskUserQuestion`, header `Next step`: 2–4 options, the recommended one first with `(Recommended)`, each `description` saying what will change. Skip it only when there is a single unambiguous action the user already said to take.

## Session hygiene

Model and effort are set once per session in `.claude/settings.json` (sonnet, medium). Never switch the model mid-session. Commands carry no model or effort; agents do, because each starts its own context.

The board carries all state, so the chat is disposable — and every request re-sends it. Before the picker, check this session's context with `mcp__ccd_session_mgmt__get_usage` (load it and `mcp__ccd_session_mgmt__clear_session` with one `ToolSearch select:` call, once per session). Offer a clear as an option — recommended — when:

- the task just reached gate 3 or was closed; or
- context is over ~150k tokens; or
- `$ARGUMENTS` names a different task from the one this session has been working, and context is over ~120k.

Label it `Очистить → <next command>`. When picked, put the command on the clipboard with `Set-Clipboard '<next command>'`, give it in one line, then call `clear_session` with `session_id: "self"`. Never clear without that pick.
