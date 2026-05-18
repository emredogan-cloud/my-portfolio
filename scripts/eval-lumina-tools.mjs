#!/usr/bin/env node
/**
 * Lumina tool consistency eval — V4 Phase 4 Sub-PR 4.3.
 *
 * Mission (V4 § 2.3 + § 5.4 Sub-PR 4.2 validation):
 *   The Lumina tool registry has the tool DEFINITIONS in
 *   `lib/lumina/tools.ts`, the spinner labels in
 *   `components/chat/LuminaWindow.tsx` (TOOL_LABEL map), the
 *   transparency manifest in `app/lumina/brain/page.tsx` (TOOLS
 *   array), and reference rules in `lib/lumina/system-prompt.ts`.
 *   Any drift between these — a tool added to the registry but
 *   not surfaced on the brain page, a label added without a
 *   corresponding tool — is a transparency regression. This
 *   script is the consistency guard.
 *
 * What it checks (per tool, deterministically):
 *   1. Tool definition exists in lib/lumina/tools.ts (matches the
 *      `<name>: tool({` opening). Either inside STATIC_TOOLS or
 *      inside createLabInvocationTools.
 *   2. TOOL_LABEL entry exists in components/chat/LuminaWindow.tsx.
 *   3. Brain page manifest entry exists in app/lumina/brain/page.tsx.
 *   4. withTelemetry wrapping is applied to the execute body
 *      (so per-tool counters fire on every invocation).
 *
 * Output:
 *   Per-tool table to stdout, then a summary line. Exit 0 on full
 *   pass, 1 on any failure — wire it to CI when ready.
 *
 * Posture:
 *   - Pure ESM, no new deps. Reads source files as text.
 *   - Does NOT run tool execute() bodies — that requires the chat
 *     route's edge environment + Anthropic + KV + GitHub. The
 *     consistency check is the actionable, deterministic surface
 *     a script can deliver without a running server.
 *   - Run via `npm run eval:lumina` or `node scripts/eval-lumina-tools.mjs`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolvePath(__dirname, "..");

const TOOLS_FILE = resolvePath(REPO_ROOT, "lib/lumina/tools.ts");
const LUMINA_WINDOW_FILE = resolvePath(
  REPO_ROOT,
  "components/chat/LuminaWindow.tsx",
);
const BRAIN_FILE = resolvePath(REPO_ROOT, "app/lumina/brain/page.tsx");

function readSourceFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    console.error(`[eval] could not read ${path}: ${err.message}`);
    process.exit(2);
  }
}

const toolsSrc = readSourceFile(TOOLS_FILE);
const windowSrc = readSourceFile(LUMINA_WINDOW_FILE);
const brainSrc = readSourceFile(BRAIN_FILE);

/* Extract tool names from `lib/lumina/tools.ts`. We match
 * `^\s+<name>: tool({` — leading-whitespace constraint avoids
 * accidentally matching unrelated identifiers, and the colon
 * immediately followed by `tool(` is the tool() factory call
 * signature. */
function extractToolNames(src) {
  const names = [];
  const pattern = /^\s+([a-zA-Z][a-zA-Z0-9_]*): tool\(\{/gm;
  let m;
  while ((m = pattern.exec(src)) !== null) {
    names.push(m[1]);
  }
  return names;
}

/* Extract the keys of the TOOL_LABEL map in LuminaWindow.tsx. The
 * file declares it as `const TOOL_LABEL: Record<string, string> = {
 *   <name>: "...", ... };`. We pull keys until the closing brace. */
function extractToolLabels(src) {
  const start = src.indexOf(
    "const TOOL_LABEL: Record<string, string> = {",
  );
  if (start < 0) return [];
  const after = src.slice(start);
  const end = after.indexOf("\n};");
  if (end < 0) return [];
  const block = after.slice(0, end);
  const names = [];
  const pattern = /^\s+([a-zA-Z][a-zA-Z0-9_]*):\s*"/gm;
  let m;
  while ((m = pattern.exec(block)) !== null) {
    names.push(m[1]);
  }
  return names;
}

/* Extract tool names from the brain page TOOLS manifest. The array
 * declares each entry as `{ name: "<name>", group: "...", purpose: "..." }`.
 * We pull `name: "..."` literals. */
function extractBrainManifest(src) {
  const start = src.indexOf("const TOOLS: readonly ToolRow[] = [");
  if (start < 0) return [];
  const after = src.slice(start);
  const end = after.indexOf("\n] as const;");
  if (end < 0) return [];
  const block = after.slice(0, end);
  const names = [];
  const pattern = /\bname:\s*"([a-zA-Z][a-zA-Z0-9_]*)"/g;
  let m;
  while ((m = pattern.exec(block)) !== null) {
    names.push(m[1]);
  }
  return names;
}

/* Check whether each tool's execute body is wrapped in
 * `withTelemetry("<name>", ...)`. A regression here means
 * invocation counts will silently miss tool calls. */
function findUnwrappedTools(src, toolNames) {
  const unwrapped = [];
  for (const name of toolNames) {
    const pattern = new RegExp(
      `execute:\\s+withTelemetry\\(\\s*"${name}"`,
    );
    if (!pattern.test(src)) {
      unwrapped.push(name);
    }
  }
  return unwrapped;
}

/* Sub-PR 4.5 introduced synthetic tools that live OUTSIDE the
 * top-level tools.ts registry — they're added per-request when the
 * router picks a sub-agent. They have TOOL_LABEL entries (the pill
 * IS the orchestration trace) but no `<name>: tool({` definition
 * in tools.ts. Listing them here keeps the orphan-label check
 * honest without flagging them as regressions. */
const KNOWN_SYNTHETIC_LABELS = new Set([
  "selectArchitectureCritic",
]);

const definedTools = extractToolNames(toolsSrc);
const labelTools = extractToolLabels(windowSrc);
const brainTools = extractBrainManifest(brainSrc);
const unwrapped = findUnwrappedTools(toolsSrc, definedTools);

/* Per-tool check. Each tool must:
 *   - have a label entry
 *   - have a brain manifest entry
 *   - be wrapped in withTelemetry */
const results = definedTools.map((name) => {
  const reasons = [];
  if (!labelTools.includes(name)) reasons.push("missing TOOL_LABEL entry");
  if (!brainTools.includes(name))
    reasons.push("missing brain page manifest entry");
  if (unwrapped.includes(name))
    reasons.push("execute() not wrapped in withTelemetry");
  return {
    name,
    status: reasons.length === 0 ? "pass" : "fail",
    reasons,
  };
});

/* Detect orphan entries — labels or manifest rows that don't
 * correspond to any tool definition. Synthetic sub-agent tools
 * (selectArchitectureCritic, etc.) are intentionally excluded
 * because they're added per-request, not in the static registry. */
const orphanLabels = labelTools.filter(
  (n) => !definedTools.includes(n) && !KNOWN_SYNTHETIC_LABELS.has(n),
);
const orphanManifest = brainTools.filter((n) => !definedTools.includes(n));

const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;

/* ── Report ── */

const colW = Math.max(...definedTools.map((n) => n.length), 8) + 2;

console.log("");
console.log("Lumina tool consistency eval");
console.log("─".repeat(60));
console.log(
  "name".padEnd(colW) + "label  manifest  wrapped  status",
);
console.log("─".repeat(60));
for (const r of results) {
  const labelOk = labelTools.includes(r.name) ? "  ✓  " : "  ✗  ";
  const manifestOk = brainTools.includes(r.name) ? "   ✓    " : "   ✗    ";
  const wrappedOk = !unwrapped.includes(r.name) ? "   ✓   " : "   ✗   ";
  const status = r.status === "pass" ? "pass" : "FAIL";
  console.log(
    r.name.padEnd(colW) + labelOk + manifestOk + wrappedOk + " " + status,
  );
}
console.log("─".repeat(60));
console.log(
  `total ${definedTools.length}   pass ${passed}   fail ${failed}`,
);
console.log("");

if (orphanLabels.length > 0) {
  console.warn("orphan TOOL_LABEL entries (no matching tool):");
  for (const n of orphanLabels) console.warn(`  - ${n}`);
  console.warn("");
}
if (orphanManifest.length > 0) {
  console.warn("orphan brain page manifest entries (no matching tool):");
  for (const n of orphanManifest) console.warn(`  - ${n}`);
  console.warn("");
}

const ok = failed === 0 && orphanLabels.length === 0 && orphanManifest.length === 0;
process.exit(ok ? 0 : 1);
