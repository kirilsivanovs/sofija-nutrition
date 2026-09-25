---
description: Answer a question about the codebase without filling this session with greps. Changes nothing.
argument-hint: "<where is X / how does Y work>"
---

Answer `$ARGUMENTS` by handing it to the built-in `Explore` agent — do not search yourself. A dozen greps and file reads happen in a context that gets thrown away, and only the answer lands here.

Give `Explore` the question, which areas to look in (from the `CLAUDE.md` area table — the whole repo only if you genuinely can't narrow it; never `node_modules`, `dist`, `api/dist`), and a breadth: `medium` normally, `very thorough` when the answer could live in both the Astro components and the legacy `public/assets/*.js`.

Relay its answer with the `file:line` references intact. Add nothing of your own beyond a one-line summary if the answer is long.

This command creates and changes nothing. If the answer turns out to be "that's a bug", say so and suggest `/new`.
