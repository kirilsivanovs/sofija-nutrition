---
description: Where every task on the board stands, and what to run next.
---

Print the board. No sub-agent. Read it with **one** call and never open a task file:

```bash
grep -H -E '^(id|title|status|priority|kind|size|area|branch|parent|split|recurring|architectural):' .claude/tasks/[!_]*/*/task.md .claude/tasks/[!_]*/*/sub-tasks/*.md .claude/tasks/SN-*/task.md .claude/tasks/SN-*/sub-tasks/*.md 2>/dev/null
```

Group by how far along the task is, most advanced first — finishing beats starting:

**В работе** — `review`, `testing`, `in-progress`, `branched`
**Разобрано** — `planned`, `analyzed`
**Не начато** — `new`, ordered by `priority` (P0 first)

The last glob pair catches legacy flat folders (`.claude/tasks/SN-*/`) until none are left; show them as category `—` and suggest moving them.

One line per task; the category is the folder above the id:

`SN-012 · P0 · security · закрыть API дневника · api · sn-012-meals-api-auth · на ревью`

- With `/board <category>` (`design`, `functional`, `security`, `devops`, `maintenance`), only that category.

- Sub-tasks indented under their parent. An umbrella (`split: true`) shows `3 подзадачи (1 готова)` rather than a status of its own.
- `architectural: true` gets a marker — that task costs a second opus pass.
- A `recurring: true` task shows `N в очереди` instead of a branch.
- Any `P0` not yet in work gets called out on its own line at the top.
- `_archive/` is a count per category at the end, not a list, unless asked.
- Empty board → say so and point at `/new`.

End with one line naming the single most useful next command: `/work` when something is in flight, `/work <ID>` for the top P0, or `/work <ID>` when a task is held at a hard stop (say which).
