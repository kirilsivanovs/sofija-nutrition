---
description: Run a task's tests, typecheck and build, and report pass or fail. No agent — the cheapest command here.
argument-hint: "SN-012 | SN-012.2"
---

Run the checks for the task in `$ARGUMENTS` yourself. **No sub-agent.** Do not write tests, do not fix failures, do not read source files.

1. Find it: `.claude/tasks/<ID>/task.md`, or a `sub-tasks/` file when the id has a `.N` suffix. Read only its frontmatter (`area`, `branch`) and the **Testing plan** in `## Plan`.
2. Make sure the repo is on that branch (`git branch --show-current`). Not on it → say so and stop; switching is `/work`'s job.
3. Run each command the Testing plan names, from the repo root, one call per command — the forms are in `CLAUDE.md`, "Build / test":

   ```powershell
   npx jest -c api/jest.config.js api/tests/<file>.test.ts -t "<filter>"
   npx tsc -p api/tsconfig.json --noEmit
   ```

   The hook trims Jest and Playwright output — don't add flags, don't pipe it. No Testing plan recorded → run the suite for the changed unit's area plus that area's typecheck/build, and say you did because the plan named none. A browser scenario in the plan is not run here; say `/orchestrate force tester <ID>` runs it.
4. Report in a few lines: passed/failed counts per command, and for each failure the test name, the assertion message and `file:line`, or the first type/build error with `file:line`. Never paste the output.

This command never changes `status`. Failures → say `/work <ID>` sends them back to `developer`. Do not do that yourself.
