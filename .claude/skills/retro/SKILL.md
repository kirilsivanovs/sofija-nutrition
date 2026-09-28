---
name: retro
description: Self-improving loop for this pipeline. Reads quality outcomes and usage cost, scouts current Claude Code docs for verified ideas, and writes up to 3 dated proposals. Never edits the pipeline itself.
user-invocable: false
---

# Retro

Run by `/work` at most once every 7 days, after it has already reported. Never runs on its own, never blocks the report, never edits `commands/`, `agents/` or `CLAUDE.md` — it only writes `.claude/metrics/proposals/<date>.md`. Applying a proposal is always the user's decision, made later, in `/work`.

## Quality floor

A proposal must not trade quality for tokens. Reject anything that would: skip `code-reviewer` or `tester`, remove a hard stop, shrink `maxTurns`, lower a model or effort tier, or drop a verification step. `TOKEN-BUDGET.md`'s working rules cover the same ground — read it once, don't restate it in the proposal.

## 1. Read the signals

- `.claude/metrics/outcomes.jsonl` — one line per `code-reviewer`/`tester` verdict and per close/reopen (schema in `metrics/README.md`). Compute, over the last ~30 days: fix-round rate by `size`, blocking-finding rate by `stage`, and any `reopened` events (a task that needed rework after being archived is the strongest quality signal there is — weigh it heavily). Design-route tasks (`designer` refinement rounds) are a separate signal from fix rounds — don't conflate them.
- `.\.claude\scripts\usage-report.ps1` (no args) for cost by agent type and by task.
- `.claude/metrics/changelog.md` — every applied proposal, dated. An entry **5 or more tasks old** (count closes in `outcomes.jsonl` since its date) gets re-evaluated: did the fix-round rate or reopened rate it touched get worse afterward? If yes, propose reverting it, evidence first.

## 2. Scout, in the same step

Spawn one sub-agent, `model: sonnet`, at most **8** `WebSearch`/`WebFetch` calls total, read-only (no `Edit`/`Write`/`PowerShell`). Give it the current pain points from step 1, `.claude/metrics/scouting-seen.md` (below) so it doesn't re-propose what was already rejected or applied, and the pages to check first: the [Claude Code changelog](https://code.claude.com/docs/en/release-notes/overview), [code.claude.com/docs](https://code.claude.com/docs), the [Anthropic engineering blog](https://www.anthropic.com/engineering), and current community write-ups (`WebSearch`).

Rules for what it returns:

- **Every construct must be re-verified against the current official docs before being proposed** — a frontmatter field renamed, a feature that shipped or was removed since this pipeline was built. Cite the doc URL and the date fetched.
- A community idea needs its source URL and is tagged **"unverified by Anthropic"** in the proposal; it still needs the quality floor and an exact diff.
- Never propose applying anything itself. It returns candidates; step 3 filters them.
- Append each URL it actually opened, with one clause on what was checked, to `.claude/metrics/scouting-seen.md` (create it if missing).

## 3. Write the proposals

Up to **3**, ranked by expected saving, in `.claude/metrics/proposals/<YYYY-MM-DD>.md`:

```markdown
## <n>. <one-line title>

- **Evidence**: <the number from outcomes.jsonl or usage-report that motivates this>
- **Expected saving**: <tokens/cost, or fix-round reduction — a number, not "should help">
- **Quality risk**: <what could get worse, or "none identified" — never omit this line>
- **Diff**: <the exact change — file, old text, new text, small enough to apply as one Edit>
- **Rollback**: <the exact inverse edit>
- **Source**: <doc URL + fetch date, or "unverified by Anthropic" + blog/forum URL>
```

A re-evaluation from step 1 uses the same shape; its "Diff" is the revert.

Fewer than 3 good ones is fine — never pad to 3. Zero for this run is a valid outcome; still touch the file with a one-line "nothing this week" note so the 7-day check has a date to read.

## 4. Handoff

Return to `/work` only the proposal titles and one-line summaries (it appends them after its own report and offers "apply proposal N" in the closing picker) — not the full file. Applying one: the user picks it, `/work` makes that exact edit, then appends one line to `changelog.md` — date, task the change was applied under, one clause.
