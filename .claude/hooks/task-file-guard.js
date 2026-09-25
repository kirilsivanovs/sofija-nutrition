#!/usr/bin/env node
/**
 * PreToolUse hook: keep task files small, mechanically — `## Log` entries to
 * one line, and the file itself under a size budget.
 *
 * Every agent that touches a task re-reads its whole task file, on every
 * stage. A log that grows by a paragraph per run is therefore charged back
 * once per remaining stage. Prompt text asking for one-line entries is advice;
 * this is the enforcement. Denying the write costs the agent one retry and
 * tells it exactly where the detail belongs.
 *
 * Deliberately narrow. It fires only on a dated log bullet (`- YYYY-MM-DD:`)
 * written into a task file through Edit/Write. `notes/` is exempt: long-form
 * history is exactly what that directory is for.
 *
 * A write is refused only when the file ends up over budget AND grows by more
 * than one log entry's worth — a status flip or a single log line always
 * passes, so an agent closing out its last turn is never stranded, and an
 * agent shrinking an oversized file is never blocked.
 */

const MAX_CHARS = Number(process.env.SN_LOG_MAX_CHARS) || 400;
const MAX_FILE_BYTES = (Number(process.env.SN_TASK_MAX_KB) || 12) * 1024;

const fs = require("fs");

const LOG_BULLET = /^- \d{4}-\d{2}-\d{2}:/;

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return allow();
  }

  const tool = input.tool_name;

  // Shell writes bypass the length check entirely, so they are refused outright
  // for task files rather than inspected. On this machine PowerShell's
  // Set-Content/Out-File also re-encodes the file and destroys non-ASCII text
  // (Latvian and Russian in quoted material).
  if (tool === "Bash" || tool === "PowerShell") {
    const cmd = (input.tool_input && input.tool_input.command) || "";
    // The path must be the *target* of the write, not merely mentioned — a grep
    // over a task file is none of this hook's business.
    const redirectedInto = /(?:^|[^>])>>?\s*["']?[^"'\s|;&]*\.claude[\/\\]tasks[\/\\]/.test(cmd);
    const cmdletInto = /\b(?:Set-Content|Add-Content|Out-File|tee)\b(?:\s+-\w+(?:\s+\S+)?)*\s+["']?[^"'\s|;&]*\.claude[\/\\]tasks[\/\\]/i.test(cmd);
    if (redirectedInto || cmdletInto) {
      return deny(
        `Writing to a task file through the shell is not allowed — use Edit or Write.\n\n` +
          `Two reasons: PowerShell's Set-Content/Out-File re-encodes these files and destroys non-ASCII text, ` +
          `and a shell append skips the one-line ## Log check that Edit and Write go through.\n\n` +
          `If you are rewriting a whole task file, do it with Write after reading it.`
      );
    }
    return allow();
  }

  if (tool !== "Edit" && tool !== "Write") return allow();

  const ti = input.tool_input || {};
  if (!governs(ti.file_path)) return allow();

  const text = tool === "Write" ? ti.content : ti.new_string;
  if (typeof text !== "string" || !text) return allow();

  const oversize = sizeViolation(tool, ti);
  if (oversize) {
    return deny(
      `This write would leave the task file at ${kb(oversize.after)} KB (budget ${kb(MAX_FILE_BYTES)} KB), ` +
        `growing it by ${oversize.after - oversize.before} bytes.\n\n` +
        `Every later stage re-reads this whole file. Make room before adding more:\n` +
        `  - a superseded analysis pass, evidence beyond one line per item, completed-step narratives,\n` +
        `    old ## Log entries -> move verbatim to <ID>/notes/history.md, leave a one-line pointer\n` +
        `  - implementation detail for one seam -> that sub-task's own file\n\n` +
        `Shrinking edits are always allowed. Raise the budget for one run with SN_TASK_MAX_KB.`
    );
  }

  const problem = firstViolation(text);
  if (!problem) return allow();

  deny(
    `This ## Log entry is ${problem.kind}: ${problem.detail}\n\n` +
      `A log entry is one line — date, stage, outcome, status change, and any fact still live. ` +
      `Shorten it to under ${MAX_CHARS} characters and put the rest where it belongs:\n` +
      `  - reasoning about a decision -> the section it changed\n` +
      `  - implementation detail      -> that sub-task's own file\n` +
      `  - a superseded analysis pass -> <ID>/notes/history.md\n\n` +
      `Offending entry:\n${problem.line.slice(0, 200)}...`
  );
});

/** Task files only, and not the long-form directory. */
function governs(filePath) {
  if (typeof filePath !== "string") return false;
  const p = filePath.replace(/\\/g, "/");
  if (!/\/\.claude\/tasks\//.test(p)) return false;
  if (!p.endsWith(".md")) return false;
  if (/\/notes\//.test(p)) return false;
  return !/\/(README|_TEMPLATE(_RECURRING)?)\.md$/.test(p);
}

/**
 * The file's size after this write, in UTF-8 bytes. Returns null when the write
 * is within budget or adds no more than one log entry. Any failure to
 * reconstruct the result allows the write: this guard must never be the reason
 * a legitimate edit cannot land.
 */
function sizeViolation(tool, ti) {
  let before = 0;
  try {
    before = fs.statSync(ti.file_path).size;
  } catch {
    before = 0;
  }

  let after;
  if (tool === "Write") {
    after = Buffer.byteLength(ti.content || "", "utf8");
  } else {
    if (typeof ti.old_string !== "string") return null;
    const delta = Buffer.byteLength(ti.new_string, "utf8") - Buffer.byteLength(ti.old_string, "utf8");
    after = before + delta * (ti.replace_all ? occurrences(ti.file_path, ti.old_string) : 1);
  }

  if (after <= MAX_FILE_BYTES || after - before <= MAX_CHARS) return null;
  return { before, after };
}

function occurrences(filePath, needle) {
  try {
    return Math.max(1, fs.readFileSync(filePath, "utf8").split(needle).length - 1);
  } catch {
    return 1;
  }
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function firstViolation(text) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!LOG_BULLET.test(line)) continue;

    if (line.length > MAX_CHARS) {
      return { kind: "too long", detail: `${line.length} characters, limit ${MAX_CHARS}`, line };
    }

    // A continuation line makes the entry multi-line however short its first line is.
    const next = lines[i + 1];
    if (next !== undefined && next.trim() !== "" && !/^[-*#]/.test(next.trim())) {
      return {
        kind: "spread over more than one line",
        detail: `it continues on the next line ("${next.trim().slice(0, 60)}...")`,
        line,
      };
    }
  }
  return null;
}

function allow() {
  process.stdout.write("{}");
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}
