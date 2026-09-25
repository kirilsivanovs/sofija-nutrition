# Usage log

`usage.jsonl` is appended by `.claude/hooks/usage-log.js` on two hook events:

- `SubagentStop` — one line per finished sub-agent run, read from that agent's own transcript.
- `Stop` — one line per finished main-session turn, holding only what was added since the previous line for that session.

It exists to judge the route on real numbers: what each task and each agent type actually cost. Summarise it with `.claude/scripts/usage-report.ps1`.

It holds **only token counts and identifiers** — no prompt text, no code, no data. The task id is the only thing taken from a message.

## Line format

```json
{"ts":"2026-09-24T08:41:20.788Z","session_id":"...","scope":"subagent","agent_type":"code-reviewer","agent_id":"...","model":"claude-sonnet-5","ticket":"SN-012","turns":5,"tool_calls":10,"tokens":{"input":10,"cache_write_5m":0,"cache_write_1h":13950,"cache_read":87522,"output":1690},"est_usd":0.0902,"prices_checked":"2026-09-24","route":"local-v1"}
```

| Field | Meaning |
|---|---|
| `ts` | when the hook wrote the line (UTC) |
| `session_id` | the Claude Code session the event belongs to |
| `scope` | `main` (router session turn) or `subagent` |
| `agent_type` | the sub-agent's name (`analyzer`, `developer`, ...); `main` for the session |
| `agent_id` | sub-agent lines only; a resumed agent writes a second line with the same id |
| `model` | model id(s) that answered, comma-separated if more than one |
| `ticket` | first `SN-n` / `SN-n.m` in the sub-agent's first prompt; for `main`, the newest key typed in that turn, else the last one seen in the session; `null` if none |
| `turns` | API requests (assistant messages) counted in this line |
| `tool_calls` | `tool_use` blocks in those messages |
| `tokens.input` | uncached input tokens |
| `tokens.cache_write_5m` / `cache_write_1h` | cache-creation tokens by TTL; a transcript without the split is counted as 5m |
| `tokens.cache_read` | cache-read tokens |
| `tokens.output` | output tokens, thinking included |
| `est_usd` | estimate from the price map in the hook (the `TOKEN-BUDGET.md` table, dated in `prices_checked`); an unknown model is listed in `unpriced_models` and adds 0 |
| `route` | the route the board ran under when the line was written |

## How lines are kept exact

A transcript is read from a byte offset stored in `.state/<scope>-<id>.json`, so each API message is counted once, including when a sub-agent is resumed. One message is spread over several transcript records with the same `message.id`; it is counted once, with its final output count. The files in `.state/` are bookkeeping only and can be deleted — the next event then recounts that transcript from the start.

Hook failures never reach the session; they go to `errors.log` here.
