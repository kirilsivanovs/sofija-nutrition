---
description: Create a task on the local board — the replacement for a Jira ticket. Files what you said; analyses nothing.
argument-hint: "\"<title>\" [P0|P1|P2|P3] [description, links, pasted text]"
---

Create one task in `.claude/tasks/`. There is no external tracker: what you write here is the original record of the work. No sub-agent, no code exploration, no analysis.

## Id

List `.claude/tasks/SN-*` and `.claude/tasks/_archive/SN-*` in one `Glob` each. The new id is `SN-` plus the highest number found + 1, three digits (`SN-001` on an empty board). Never reuse an archived id.

## What to write

Create `.claude/tasks/<ID>/task.md` from `_TEMPLATE.md`:

- `id`, `title` — a short imperative in English, from the user's words (translate if they wrote Russian; keep their meaning, not your interpretation).
- `priority` — from `$ARGUMENTS` if given. Otherwise `P0` when the task is a security hole or could harm a patient (wrong booking, exposed data), `P2` for everything else; say which you chose so the user can change it.
- `status: new`, `area: unspecified`, `source: "/new"` (or what the user named, e.g. `Sofija`, `audit 2026-09-25`), `created`/`updated` today.
- `## Description` — what the user asked for, in two to five bullets, in English. Keep their framing; attribute reported facts (`per Sofija`).
- `## Acceptance criteria` — only criteria the user actually stated. None stated → leave the empty checkbox; `analyzer` proposes them.
- `## Inputs` — links, pasted text and attached files exactly as `/brief` files them (`.claude/commands/brief.md`, "How to file it"), including its personal-data rule.
- `## Log` — one line: `- <date>: created via /new`.

Leave `kind` and `size` empty, even when it looks obvious; `analyzer` sets them.

If the request is clearly several independent pieces of work, say so and offer to create one task per piece rather than one umbrella; create them only on a yes.

## Report

Two lines: the id, title and priority, and what went into Inputs. Then close with `AskUserQuestion` (header `Next step`): `/work <ID>` (Recommended — the analysis starts from what was filed), `/brief <ID>` to add more first, or leave it on the board.
