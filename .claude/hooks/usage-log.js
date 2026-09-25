#!/usr/bin/env node
/**
 * Stop / SubagentStop hook: append one line of token usage per event to
 * .claude/metrics/usage.jsonl, so the cost of a route can be judged from data
 * rather than from /usage percentages that cannot be grouped by ticket.
 *
 * SubagentStop reads the sub-agent's own transcript (agent_transcript_path);
 * Stop reads the main session transcript (transcript_path). Both are read from
 * a stored byte offset, so every API message is counted exactly once — even when
 * an agent is resumed with SendMessage and stops a second time.
 *
 * One API message is written as several JSONL records (one per content block),
 * all carrying the same message.id and the same input/cache counts, while
 * output_tokens grows to its final value on the last record. Usage is therefore
 * taken once per message.id, with output as the maximum seen. A message cut off
 * at the offset boundary is remembered (id + output counted so far) and only its
 * remaining output is added on the next pass.
 *
 * This hook must never cost the session anything: it always exits 0, prints
 * nothing to stdout, and writes any failure to .claude/metrics/errors.log.
 */

const fs = require("fs");
const path = require("path");

const METRICS = path.join(__dirname, "..", "metrics");
const LOG = path.join(METRICS, "usage.jsonl");
const ERRORS = path.join(METRICS, "errors.log");
const STATE = path.join(METRICS, ".state");

const ROUTE = "local-v1";
const TICKET = /\bSN-\d+(\.\d+)?\b/;

// USD per million tokens, from TOKEN-BUDGET.md "Prices" (checked 2026-09-24).
// Matched against the transcript's model id by family name.
const PRICES_CHECKED = "2026-09-24";
const PRICES = {
  fable: { input: 10, cache_write_5m: 12.5, cache_write_1h: 20, cache_read: 0.25, output: 50 },
  opus: { input: 4, cache_write_5m: 5, cache_write_1h: 8, cache_read: 0.2, output: 20 },
  sonnet: { input: 2, cache_write_5m: 2.5, cache_write_1h: 4, cache_read: 0.2, output: 10 },
  haiku: { input: 1, cache_write_5m: 1.25, cache_write_1h: 2, cache_read: 0.1, output: 5 },
};

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    run(JSON.parse(raw));
  } catch (e) {
    logError(e);
  }
  process.exit(0);
});

function run(input) {
  const event = input.hook_event_name;
  let scope, transcript, stateKey;
  if (event === "SubagentStop") {
    scope = "subagent";
    transcript = input.agent_transcript_path;
    stateKey = `subagent-${input.agent_id || "unknown"}`;
  } else if (event === "Stop") {
    scope = "main";
    transcript = input.transcript_path;
    stateKey = `main-${input.session_id || "unknown"}`;
  } else {
    return;
  }
  if (!transcript || !fs.existsSync(transcript)) {
    throw new Error(`${event}: transcript not found: ${transcript}`);
  }

  fs.mkdirSync(STATE, { recursive: true });
  const stateFile = path.join(STATE, safeName(stateKey) + ".json");
  const state = readState(stateFile);

  const { lines, nextOffset } = readNewLines(transcript, state.offset);
  const pass = sum(lines, state);

  // The ticket is fixed by the first human message of the transcript; the main
  // session falls back to the newest key typed in this turn.
  if (!state.ticket) state.ticket = scope === "subagent" ? firstUserTicket(transcript) : null;
  const ticket = scope === "subagent" ? state.ticket : pass.ticket || state.ticket || null;
  if (scope === "main" && pass.ticket) state.ticket = pass.ticket;

  state.offset = nextOffset;
  state.lastMsgId = pass.lastMsgId;
  state.lastOutput = pass.lastOutput;

  if (pass.turns > 0 || pass.tokens.output > 0) {
    const line = {
      ts: new Date().toISOString(),
      session_id: input.session_id || null,
      scope,
      agent_type: scope === "subagent" ? input.agent_type || null : input.agent_type || "main",
      agent_id: scope === "subagent" ? input.agent_id || null : undefined,
      model: [...pass.models].join(",") || null,
      ticket,
      turns: pass.turns,
      tool_calls: pass.toolCalls,
      tokens: pass.tokens,
      est_usd: round(pass.usd),
      prices_checked: PRICES_CHECKED,
      route: ROUTE,
    };
    if (pass.unpriced.size) line.unpriced_models = [...pass.unpriced];
    fs.appendFileSync(LOG, JSON.stringify(line) + "\n", "utf8");
  }

  fs.writeFileSync(stateFile, JSON.stringify(state), "utf8");
}

/** Complete lines from `offset` on; a trailing partial line is left for the next pass. */
function readNewLines(file, offset) {
  const size = fs.statSync(file).size;
  // A transcript that shrank was rewritten; start over rather than read garbage.
  if (offset > size) offset = 0;
  if (offset === size) return { lines: [], nextOffset: offset };

  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(size - offset);
    fs.readSync(fd, buf, 0, buf.length, offset);
    const lastNl = buf.lastIndexOf(0x0a);
    if (lastNl < 0) return { lines: [], nextOffset: offset };
    const text = buf.subarray(0, lastNl).toString("utf8");
    return { lines: text.split("\n"), nextOffset: offset + lastNl + 1 };
  } finally {
    fs.closeSync(fd);
  }
}

function sum(lines, state) {
  const tokens = { input: 0, cache_write_5m: 0, cache_write_1h: 0, cache_read: 0, output: 0 };
  const models = new Set();
  const unpriced = new Set();
  const toolIds = new Set();
  const seen = new Map(); // message.id -> output counted so far
  let usd = 0;
  let turns = 0;
  let ticket = null;
  let lastMsgId = state.lastMsgId || null;
  let lastOutput = state.lastOutput || 0;

  for (const l of lines) {
    if (!l) continue;
    let r;
    try {
      r = JSON.parse(l);
    } catch {
      continue;
    }

    if (r.type === "user" && r.message) {
      const k = humanText(r.message.content).match(TICKET);
      if (k) ticket = k[0];
      continue;
    }
    if (r.type !== "assistant" || !r.message || !r.message.usage) continue;

    const m = r.message;
    const model = m.model || "";
    if (model === "<synthetic>") continue;

    for (const c of m.content || []) {
      if (c && c.type === "tool_use" && c.id) toolIds.add(c.id);
    }

    const u = m.usage;
    const out = u.output_tokens || 0;
    const price = priceFor(model);
    const id = m.id || r.uuid;

    let counted;
    if (seen.has(id)) {
      counted = seen.get(id);
    } else if (id === state.lastMsgId) {
      // Started in the previous pass: its input and cache were counted there.
      counted = state.lastOutput || 0;
      seen.set(id, counted);
    } else {
      counted = 0;
      seen.set(id, 0);
      turns++;
      models.add(model);
      const cc = u.cache_creation;
      const write = u.cache_creation_input_tokens || 0;
      // Without the split the TTL is unknown; the API default is 5 minutes.
      const w1h = cc ? cc.ephemeral_1h_input_tokens || 0 : 0;
      const w5m = cc ? cc.ephemeral_5m_input_tokens || 0 : write;
      const part = {
        input: u.input_tokens || 0,
        cache_write_5m: w5m,
        cache_write_1h: w1h,
        cache_read: u.cache_read_input_tokens || 0,
      };
      for (const f of Object.keys(part)) tokens[f] += part[f];
      if (price) {
        for (const f of Object.keys(part)) usd += (part[f] * price[f]) / 1e6;
      } else {
        unpriced.add(model);
      }
    }

    if (out > counted) {
      tokens.output += out - counted;
      if (price) usd += ((out - counted) * price.output) / 1e6;
      seen.set(id, out);
    }
    lastMsgId = id;
    lastOutput = seen.get(id);
  }

  return { tokens, models, unpriced, usd, turns, toolCalls: toolIds.size, ticket, lastMsgId, lastOutput };
}

/** Text a person typed: string content or text blocks, never tool results. */
function humanText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((c) => c && c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("\n");
}

function firstUserTicket(file) {
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(Math.min(256 * 1024, fs.fstatSync(fd).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    for (const l of buf.toString("utf8").split("\n")) {
      let r;
      try {
        r = JSON.parse(l);
      } catch {
        continue;
      }
      if (r.type !== "user" || !r.message) continue;
      const text = humanText(r.message.content);
      if (!text) continue;
      const k = text.match(TICKET);
      return k ? k[0] : null;
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

function priceFor(model) {
  const m = /fable|opus|sonnet|haiku/i.exec(model || "");
  return m ? PRICES[m[0].toLowerCase()] : null;
}

function readState(file) {
  try {
    const s = JSON.parse(fs.readFileSync(file, "utf8"));
    return { offset: s.offset || 0, lastMsgId: s.lastMsgId || null, lastOutput: s.lastOutput || 0, ticket: s.ticket || null };
  } catch {
    return { offset: 0, lastMsgId: null, lastOutput: 0, ticket: null };
  }
}

function safeName(s) {
  return String(s).replace(/[^A-Za-z0-9._-]/g, "_");
}

function round(x) {
  return Math.round(x * 10000) / 10000;
}

function logError(e) {
  try {
    fs.mkdirSync(METRICS, { recursive: true });
    fs.appendFileSync(ERRORS, `${new Date().toISOString()} ${e && e.stack ? e.stack : e}\n`, "utf8");
  } catch {
    // Nowhere left to report to; staying silent is the requirement.
  }
}
