---
description: Give a task the inputs you already have — links, a pasted conversation with Sofija, screenshots, docs — before any agent looks at it.
argument-hint: "SN-012 <paste links / text, or attach them in the same message>"
---

Record what the user already knows about a task, so the pipeline starts from it instead of rediscovering it. No sub-agent, no code exploration, no analysis — you are filing input, not interpreting it.

The first token of `$ARGUMENTS` is the task id; everything after it (and anything else in the same message) is the material.

## Where it goes

1. Find `.claude/tasks/<ID>/task.md`. Not on the board → say so and offer `/new`; don't create an id here.
2. Append to its `## Inputs` section. Never overwrite what is there; it is append-only and dated.

## How to file it

**Links.** One bullet each: the URL, and one clause on what it is and why it matters, in the user's framing. Do not open them: reading them is the analyzer's job, in its own context.

**Pasted text** (a chat with Sofija, an email, notes from a call):
- Under about 30 lines → inline under a `### <date> — <one-line label>` heading, verbatim.
- Longer → write it to `.claude/tasks/<ID>/notes/<n>-<slug>.md` and leave a one-line pointer.
- Latvian or Russian text stays in its language (it is source material, and site copy must be exact); add a one-line English gist above it.

**Attached files.** Copy them into `.claude/tasks/<ID>/notes/` rather than pointing at `Downloads`. Keep the original filename (slugged), list each with type, size and one clause.

- **PDF, PNG, JPG** — readable with `Read`. **Text-like** (md, txt, json, csv) — readable and greppable.
- **.docx / .xlsx** — not readable by `Read`. Say so and ask for a PDF or the relevant part pasted.
- **Archives** — don't unpack; file it and ask what inside matters.
- Up to about 10 MB; larger stays where it is with a path reference.

**Strip personal data as you file it.** Conversations about patients carry names, emails, phone numbers, personas kods, diagnoses, diary contents. Drop them, keep what the task needs in neutral terms ("a patient on the online format"), and note in one line that you did. A screenshot of a real patient's cabinet, an admin list with real bookings, or a data export → **stop and ask** before filing; describe what you saw. The same for anything that looks like a secret (API key, connection string, token): never file it, tell the user to rotate it if it was pasted in chat.

**Keep the user's framing.** "Sofija wants the first visit to be 90 minutes" is a fact about the task even when no document says it. Attribute it (`per Sofija, via the user, 2026-09-25`).

## Then

Update `updated:`, append one `## Log` line naming what arrived.

Report in a few lines: what you filed, where long text went, what you dropped as personal data. Then:

- `status: new` → **"`/work <ID>` — анализ начнёт с этих вводных."**
- `status: analyzed` or later → **"`/work <ID>` — досыпет это в анализ, прежде чем планировать."** The next `/work` runs a cheap top-up pass on sonnet. Do not run it yourself.

Never analyse, never plan, never decide whether the material is correct. If it contradicts the task file, file it and say so in one line.
