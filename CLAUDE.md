# sofija-nutrition-astro

Website and practice platform for a nutritionist in Latvia (LV/EN/RU): public landing page, booking, patient cabinet with a food diary, admin dashboard. One git repo, npm workspaces (`api`, `shared`). Remote: `github.com/kirilsivanovs/sofija-nutrition` — **public**.

This checkout is in the global `safe.directory` list, so plain `git` works (and matches the permission rules in `.claude/settings.json`). If git still refuses with "dubious ownership", scope the exception to the one call (`git -c safe.directory=<repo-path-with-forward-slashes> ...`).

| Area alias in task files | Paths | Stack |
|---|---|---|
| `frontend` | `src/`, `public/`, `astro.config.mjs`, `public/staticwebapp.config.json` | Astro 6, Tailwind v4 via Vite, legacy JS in `public/assets/*.js` |
| `api` | `api/` | Azure Functions v4, TypeScript, Azure Table Storage, Resend, pdf-lib |
| `shared` | `shared/` | types, validators, `translations.js` (synced to `public/assets/` at build) |
| `ci` | `.github/workflows/` | GitHub Actions: CI, CodeQL, SWA deploy + preview, Function App deploy |
| `infra` | `infra/` (not created yet) | Bicep for SWA, Function App, Storage, Key Vault, App Insights |

## Build / test

Node 22. Tests: **Jest** (unit), **Playwright** (E2E against a running site). Run from the repo root; always one suite or a `-t` filter, never everything unless the plan asks. A PreToolUse hook adds `--silent --verbose=false` (Jest) and `--reporter=line` (Playwright) — don't re-add them.

```powershell
npx jest tests/<file>.test.ts -t "<name>"                        # frontend (root jest.config.cjs projects)
npx jest -c api/jest.config.js api/tests/<file>.test.ts -t "<name>"  # api
npx jest -c shared/jest.config.js shared/tests/<file>.test.ts      # shared
npx tsc -p api/tsconfig.json --noEmit                            # api typecheck — part of verifying any api change
npm run build                                                    # astro build; verifies any frontend change
npx playwright test e2e/<file>.spec.ts                           # needs `npm run dev` on :4321 (launch config `astro-dev`)
```

Three frontend suites are excluded in `jest.config.cjs` as broken (`booking-state`, `booking-formatters`, `apiClient`). A plan that relies on one must fix and re-enable it, not add to the list.

## Conventions

- TypeScript for new code. Legacy `public/assets/*.js` is served raw: when a task touches it, prefer moving the logic into `src/` (built by Vite) over growing the legacy file — and say so in the plan.
- Tests sit next to their siblings: `tests/` (frontend), `api/tests/`, `shared/tests/`. One `describe` per unit, `it('<does what> when <condition>')`. Every bug fix gets a regression test; every new branch in business logic gets one.
- Clean Code: intention-revealing names, small functions. A comment only for what a name can't carry, one line. WHY, not WHAT. No task ids (`SN-012`) in code or comments — they belong in the commit message.
- The fewest files that do the job. No interface without a second implementation, no wrapper for two values, no option nobody sets. Check what Astro, the Functions SDK or an existing dependency already does before hand-writing plumbing.
- Never render untrusted data with `innerHTML`; use `textContent` or an escaping helper. Never build an OData filter by string concatenation; use `odata\`\`` or `sanitizeODataValue`.
- Auth: the caller's identity comes only from the SWA client principal, never from a query parameter or body field. No bypass for "local" or "test" callers in production code paths.
- UI work follows the `site-design` skill; anything touching patient data follows the `patient-data` skill.
- Commits and pushes happen only in `/work` step 6 (or `/quick`), after verification and review pass. Outside that, never commit or push unless asked.

## Patient data and secrets

Diary entries, measurements, complaints and consultation notes are health data (GDPR Art. 9). Personas kods, email and phone are personal data.

- Never put personal data or secrets in task files, notes, logs, test fixtures, commit messages or chat replies. Use storage keys and synthetic data.
- Never read `.env`, `api/local.settings.json` or `.auth/` (denied in settings). If a task needs a secret's value, the user sets it in Key Vault / app settings.
- New processors of patient data (email, video, payments, AI) must be EU-hosted or covered by a DPA with SCCs — flag it in the analysis before building on one.
- Code reaches production only through the pipeline: verified, reviewed, pushed to `main` (which deploys).
- **Azure/GitHub changes (development stage, no real patient data yet — confirmed by the user 2026-09-25):** the main session may run `az`/`gh` commands that change resources in the site's resource group (`PersonalProjects`, subscription `KirilsSubscription`; `az` uses the isolated `AZURE_CONFIG_DIR` from `.claude/settings.local.json`, never the corporate login), after stating each command in one line. Never: read secret values (list setting names only), touch the data plane (table contents), delete the Storage account, grant a role broader than one resource, or act outside that resource group. A secret's value is still set by the user. Revoke this rule before the first real patient data arrives.
- Least privilege for every identity and role you propose (e.g. *Storage Table Data Contributor* on one account, not *Contributor* on the subscription). Flag anything broader.

## Language

**Answer the user in Russian, always**, including when relaying a sub-agent's report: translate the prose, keep identifiers, paths, `file:line`, branch names and commands exactly as they are.

**What is written to disk stays English**: task files, analysis, plans, logs, agent definitions, code, comments, commit messages. **Site copy** is Latvian first, then Russian and English, and comes from Sofija — never invent medical claims or credentials in copy.

## Context discipline

- Read with `Grep`/`Glob` first; open whole files only when you must edit them. `cabinet.astro` (2k lines), `src/scripts/booking/booking-calendar.js` (1.5k), `booking.css` and `admin.css` (2.3k each) are expensive — read ranges.
- Never paste build/test output into the reply — report the failing assertion and `file:line`.
- Work is tracked in `.claude/tasks/` (see its README). It is the memory between sessions and it is local only (gitignored).
- A task file stays **within 12 KB** (a hook enforces it). `## Log` is one line per event.
- Delegate to a sub-agent; do not implement in the main session (except `/quick`).

## Commands

| | |
|---|---|
| `/new "<title>"` | create a task on the board (`SN-NNN`), optionally with a pasted description |
| `/brief <ID> ...` | give a task what you already know — links, a pasted conversation, screenshots |
| `/work [ID\|category]` | take that task (or the most urgent one in `design`, `functional`, `security`, `devops`, `maintenance`) to done. `/next` is the same thing |
| `/board` | where every task stands |
| `/find "..."` | where is X / how does Y work — changes nothing |
| `/test <ID>` | run that task's tests — no agent, the cheapest command |
| `/review <ID>` | review its diff now, out of turn |
| `/quick <ID>` | opt-in fast lane for a size-S task, in a fresh session |
| `/close <ID>` | archive a task finished outside `/work` (`/work` closes its own tasks) |

`/orchestrate` covers the rare cases: forcing a stage, recurring-task items, adopting hand-started work, board checks.

## The pipeline

`/work` takes a task from its `status` to `done` on autopilot: analysis, plan, branch, implementation, verification, review, commit, fast-forward merge into `main`, push, archive. `.claude/commands/work.md` holds the route, the fix rounds and the hard stops. **There are no pull requests: pushing `main` deploys production** (frontend after CI passes; API immediately until SN-006 gates it).

- Plain language maps to the matching command: a bare id or "давай возьмём SN-012" is `/work SN-012`, "давай дизайн" is `/work design`, "продолжай" is `/work`, "что там по задачам" is `/board`, "заведи задачу …" is `/new`, "где в коде..." is `/find`. Say which command you took it as. A bare "yes" after a gate authorises the stage just described.
- No pull requests. Never force-push, `reset --hard` or rewrite pushed history.
- Never isolate a writing agent in a worktree (`isolation: worktree`, or `claude --bg`): worktrees don't carry the uncommitted edits each seam builds on.
- **Autopilot:** no confirmation gates. Wherever a choice comes up, take the recommended option and say in one line which. Ask the user only at `/work`'s hard stops (a question only they or Sofija can answer, foreign uncommitted changes, still failing after two fix rounds, a rebase conflict, pre-deploy manual steps).
