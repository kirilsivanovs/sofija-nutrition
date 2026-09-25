#!/usr/bin/env node
/**
 * PreToolUse hook: keep Jest and Playwright noise out of the context window.
 *
 * `api/jest.config.js` sets `verbose: true`, and Jest turns verbose on by itself
 * for a single-file run, so one suite prints a line per test plus every
 * console.log the code under test makes. All of it lands in the agent's context
 * and is re-sent with every following request. `--silent --verbose=false` still
 * prints each failure with its assertion and the summary, which is the only part
 * anyone reads.
 *
 * Flag-based on purpose: piping through a filter would hide the real exit code.
 * Only a single, unchained invocation is rewritten.
 */

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return done({});
  }

  const tool = input.tool_name;
  if (tool !== "Bash" && tool !== "PowerShell") return done({});

  const cmd = (input.tool_input && input.tool_input.command) || "";
  if (!cmd) return done({});

  // Anything chained, piped or redirected is left alone — appending to it is unsafe.
  if (/[|;&><`\n]/.test(cmd)) return done({});

  const suffix = suffixFor(cmd);
  if (!suffix) return done({});

  const updated = Object.assign({}, input.tool_input, { command: cmd + suffix });
  done({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "test invocation, trimmed to failures and summary",
      updatedInput: updated,
    },
  });
});

function suffixFor(cmd) {
  // npx jest ... / npx playwright test ...: the flags go straight to the tool.
  if (/^\s*npx\s+jest\b/i.test(cmd)) {
    return /(^|\s)--(silent|verbose)\b/.test(cmd) ? null : " --silent --verbose=false";
  }
  if (/^\s*npx\s+playwright\s+test\b/i.test(cmd)) {
    return /(^|\s)--reporter\b/.test(cmd) ? null : " --reporter=line";
  }
  // npm test / npm run test[:x]: npm forwards what follows `--` to the script.
  // Scripts that chain several npm calls (test:all) only pass them to the last one,
  // which is harmless; the per-suite commands above are what the plans use.
  if (/^\s*npm\s+(test|run\s+test(:[\w-]+)?)\b/i.test(cmd)) {
    if (/(^|\s)--(silent|verbose|reporter)\b/.test(cmd)) return null;
    if (/\btest:e2e\b/.test(cmd)) return /\s--\s/.test(cmd) ? " --reporter=line" : " -- --reporter=line";
    return /\s--\s/.test(cmd) ? " --silent --verbose=false" : " -- --silent --verbose=false";
  }
  return null;
}

function done(payload) {
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}
