# Operating the board without burning the budget

Why this setup looks the way it does. Adapted from a multi-repo .NET workspace setup, with the issue tracker replaced by a local task folder and the .NET tooling replaced by Node/Jest.

## What actually costs money

Claude Code re-sends the **entire conversation with every request**, and every tool call is another request carrying that history. Three multipliers stack on top:

| Multiplier | Effect |
|---|---|
| Cache misses | after an idle gap longer than the cache lifetime (1h on a subscription, 5 min on usage credits), **or after a model change mid-session** (an effort change too, except on Opus 5.5 and Fable 5.1), the next request re-writes the full context at cache-write price |
| High effort | effort shapes all output — text, tool calls and thinking — and output is the expensive direction |
| Opus instead of Sonnet | 2× on input, output and cache writes; the same price on cache reads |

### Prices (per MTok, checked 2026-09-24)

| Model | Input | Cache write 5m / 1h | Cache read | Output |
|---|---|---|---|---|
| Fable 5.1 | $10 | $12.50 / $20 | $0.25 | $50 |
| Opus 5.5 | $4 | $5 / $8 | $0.20 | $20 |
| Sonnet 5 | $2 | $2.50 / $4 | $0.20 | $10 |
| Haiku 4.5 | $1 | $1.25 / $2 | $0.10 | $5 |

In a long session most tokens are cache reads, which cost the same on Opus 5.5 and Sonnet 5. So the size of the context and the stability of the cache matter more than which of the two runs it. When the price table changes, update the map in `hooks/usage-log.js` too.

### Never switch model mid-session

Each model has its own cache, so a switch re-writes the whole conversation. Commands carry no model or effort; `.claude/settings.json` sets them once (`sonnet`, `medium`). Want Opus for a deep ad-hoc session? Pick it **at the start**. Sub-agents are unaffected: each starts its own context, so their `model:` is free.

## What this setup changes

**The board is the memory, not the chat.** `.claude/tasks/<ID>/` holds the description, analysis, plan, branch, sub-tasks and log, so you can clear between tasks and lose nothing. State lives in `status:`, and the whole board is read with **one** `grep` over the frontmatter.

**The board is local.** There is no tracker to sync with: `/new` creates a task, `/close` archives it after you merged the branch. `.claude/tasks/` is gitignored because the repo is public and task files describe unfixed vulnerabilities.

**Thinking happens once, at the top.** `analyzer` (opus) establishes the requirement, the root cause and the shape, and for S/M tasks writes the steps too. `developer` (sonnet, low effort) executes them instead of re-deriving anything.

**Sub-agents pay their own context.** An agent can burn 40k tokens exploring and return 20 lines; only the 20 lines enter your session. Every agent has an explicit return budget for that reason.

**Late input does not cost another opus run.** `/brief` files what you already know, and the next `/work` runs a **top-up pass on sonnet** instead of a full re-analysis.

**Task files have a byte budget, enforced.** `task-file-guard.js` refuses an Edit/Write that leaves a task file over 12 KB *and* grows it by more than one log line, and refuses a `## Log` entry over 400 characters or spread over several lines. Prompt text is advice; a hook is not. Raise the limits for one run with `SN_TASK_MAX_KB` / `SN_LOG_MAX_CHARS`.

**Test noise never reaches the window.** `quiet-node.js` adds `--silent --verbose=false` to single, unchained `npx jest` / `npm test` calls and `--reporter=line` to Playwright. Failures and summaries still print.

**Secrets stay unread.** `settings.json` denies `Read` on `.env*`, `api/local.settings.json` and `.auth/`.

## Model and effort routing

| Stage | Model | Effort | Why |
|---|---|---|---|
| `analyzer` | **opus** | high | the one deep stage; 20 tool calls (26 with the S/M plan). Downgraded to sonnet by `/work` when the task already names the failing `file:line` and is not security or patient data |
| `analyzer` top-up | sonnet | low | folding late input into an existing analysis |
| `dev-planner` | sonnet | high | `size: L` only; its output is consumed literally by a low-effort agent, so it self-verifies paths and test filters |
| `prepare-branch.ps1` | — | — | a script the router runs at gate 2; `branch-preparer` (haiku) is the fallback |
| `developer` | sonnet | low | follows an explicit plan; the bulk of all spend |
| `code-reviewer` | sonnet | high | small input (a diff and a test result), last thing before a commit — don't starve it |
| `tester` | sonnet | medium | off the route; for browser scenarios (booking, language switch, keyboard access) |
| `architect` | opus | high | off the route; only via `/orchestrate force architect` for decisions that outlive the task (patient record model, auth boundary) |

## Gates cost round trips, so there are three

After `analyzer`, before cutting the branch, after the review verdict. `developer` → verification → `code-reviewer` run as one chain between the last two and report once.

## Two isolation features that would break this pipeline

`isolation: worktree` on a sub-agent and `claude --bg` both start from a tree without uncommitted changes. This pipeline leaves everything uncommitted until you commit, and each seam builds on the previous seams' edits — so a worktree agent builds on nothing. A throwaway worktree at `HEAD` for a read-only baseline is fine.

## Watch the meter, and clear before it matters

- `/work` offers `Очистить → <next command>` when a task reaches gate 3, when context passes ~150k, or when a new task starts in a session past ~120k. The command goes to the clipboard, because the clear happens as soon as the turn ends.
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=20` is the backstop for a session nobody cleared.
- `usage-log.js` appends one line per sub-agent run and per main turn to `.claude/metrics/usage.jsonl` (token counts only, keyed by `SN-NNN`). `.\.claude\scripts\usage-report.ps1 [-Ticket SN-012] [-Since 2026-10-01]` sums it by task and agent type.

## Working rules

1. **One task, one session.** Clear when you switch to unrelated work.
2. **Never implement in the router session.** The exception is `/quick`, chosen by you, in a fresh session, for an S task.
3. **Ask with `/find`, not with greps.**
4. **Be specific.** "Escape meal item names in `MealsTab.ts`" reads two files. "Make the admin safer" reads fifty.
5. **Stop early.** Escape the moment a run heads the wrong way.
6. **Watch the MCP surface.** Tool definitions ship with every request; this project needs no Jira, Confluence or Slack servers — disable them for this folder from an interactive `claude` terminal (`/mcp`).

## Sources

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Manage costs effectively](https://code.claude.com/docs/en/costs) · [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
