#!/usr/bin/env node
/**
 * Playground experiment consistency eval — V4 Phase 5 Sub-PR 5.3.
 *
 * Sibling to scripts/eval-lumina-tools.mjs. The playground surface
 * has its own cross-file alignment: every active registry entry
 * must have a Body file AND a dispatch case AND a feature-flag
 * env-var name that matches the slug-to-uppercase convention.
 *
 * What it checks (per experiment, deterministically):
 *   1. The slug appears in `lib/playground/registry.ts` with
 *      status: "active".
 *   2. A `Body.tsx` exists at
 *      `app/playground/_experiments/<slug>/Body.tsx`.
 *   3. The `[slug]/BodyMount.tsx` dispatch table contains both a
 *      BODY_REGISTRY entry and a switch case for the slug.
 *   4. The flag env var name follows the
 *      PLAYGROUND_FLAG_<UPPER_SNAKE> convention (derived
 *      mechanically; this check is informational, not gating).
 *
 * Output:
 *   Per-experiment table + summary. Exit 0 on full pass, 1 on
 *   any regression. Suitable for CI when ready.
 *
 * Posture (matches eval-lumina-tools.mjs):
 *   - Pure Node ESM, no new deps. Reads source files as text;
 *     regex-extracts the relevant facts.
 *   - Doesn't run the bodies — that needs the dev server. The
 *     consistency check is what a script CAN do without runtime.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolvePath(__dirname, "..");

const REGISTRY_FILE = resolvePath(REPO_ROOT, "lib/playground/registry.ts");
/* The DISPATCH lives in a client module per Sub-PR 5.3 —
 * `next/dynamic({ ssr: false })` calls must live in a "use
 * client" boundary, and the dispatch needs that flag. The
 * server-side [slug]/BodyMount.tsx just delegates to this file. */
const BODY_MOUNT_FILE = resolvePath(
  REPO_ROOT,
  "app/playground/[slug]/BodyMount.tsx",
);

function readSourceFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    console.error(`[eval] could not read ${path}: ${err.message}`);
    process.exit(2);
  }
}

const registrySrc = readSourceFile(REGISTRY_FILE);
const bodyMountSrc = readSourceFile(BODY_MOUNT_FILE);

/* Parse the registry array.
 *
 * Each PLAYGROUND_EXPERIMENTS entry is an object literal with at
 * least `slug: "..."` and `status: "..."`. We pull every
 * (slug, status) pair via regex. Pattern is intentionally
 * permissive — formatter changes won't break the check as long
 * as the keys remain on their own lines.
 */
function extractRegistry(src) {
  const entries = [];
  const arrayStart = src.indexOf("PLAYGROUND_EXPERIMENTS: readonly PlaygroundExperiment[] = [");
  if (arrayStart < 0) return entries;
  const after = src.slice(arrayStart);
  const arrayEnd = after.indexOf("\n];");
  if (arrayEnd < 0) return entries;
  const block = after.slice(0, arrayEnd);

  /* Walk objects — naive but sufficient because the file is
   * indentation-disciplined and a single ESLint pass. Each entry
   * is bounded by `{` and `}` at the same indent level. */
  const objectPattern = /\{([\s\S]*?)\}/g;
  let m;
  while ((m = objectPattern.exec(block)) !== null) {
    const body = m[1];
    const slugMatch = body.match(/\bslug:\s*"([a-zA-Z][a-zA-Z0-9_-]*)"/);
    const statusMatch = body.match(
      /\bstatus:\s*"(active|shell|archived)"/,
    );
    if (slugMatch && statusMatch) {
      entries.push({ slug: slugMatch[1], status: statusMatch[1] });
    }
  }
  return entries;
}

function extractBodyRegistryKeys(src) {
  /* Look for keys inside `const BODY_REGISTRY = { ... } as const`. */
  const start = src.indexOf("const BODY_REGISTRY = {");
  if (start < 0) return [];
  const after = src.slice(start);
  const end = after.indexOf("} as const;");
  if (end < 0) return [];
  const block = after.slice(0, end);
  const keys = [];
  const pattern = /"([a-zA-Z][a-zA-Z0-9_-]*)":\s*createExperimentBody/g;
  let m;
  while ((m = pattern.exec(block)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

function extractSwitchCases(src) {
  /* Match `case "slug":` lines within the dispatchBody switch. */
  const cases = [];
  const pattern = /\bcase\s+"([a-zA-Z][a-zA-Z0-9_-]*)":/g;
  let m;
  while ((m = pattern.exec(src)) !== null) {
    cases.push(m[1]);
  }
  return cases;
}

function bodyFilePath(slug) {
  return resolvePath(
    REPO_ROOT,
    `app/playground/_experiments/${slug}/Body.tsx`,
  );
}

function flagEnvName(slug) {
  return `PLAYGROUND_FLAG_${slug.toUpperCase().replace(/-/g, "_")}`;
}

const registry = extractRegistry(registrySrc);
const bodyKeys = extractBodyRegistryKeys(bodyMountSrc);
const switchCases = extractSwitchCases(bodyMountSrc);

const activeRegistry = registry.filter((r) => r.status === "active");

const results = activeRegistry.map(({ slug }) => {
  const reasons = [];
  if (!existsSync(bodyFilePath(slug))) {
    reasons.push(`missing Body.tsx at _experiments/${slug}/Body.tsx`);
  }
  if (!bodyKeys.includes(slug)) {
    reasons.push("missing BODY_REGISTRY entry in [slug]/BodyMount.tsx");
  }
  if (!switchCases.includes(slug)) {
    reasons.push("missing switch case in [slug]/BodyMount.tsx dispatchBody");
  }
  return {
    slug,
    status: reasons.length === 0 ? "pass" : "fail",
    reasons,
    flag: flagEnvName(slug),
  };
});

/* Orphans: dispatch entries that don't correspond to an active
 * registry entry. Drift in the other direction. */
const activeSet = new Set(activeRegistry.map((r) => r.slug));
const orphanBodyKeys = bodyKeys.filter((k) => !activeSet.has(k));
const orphanSwitchCases = switchCases.filter((c) => !activeSet.has(c));

const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;

/* ── Report ── */

const colW =
  results.length > 0
    ? Math.max(...results.map((r) => r.slug.length), 8) + 2
    : 20;

console.log("");
console.log("Playground experiment consistency eval");
console.log("─".repeat(70));
if (results.length === 0) {
  console.log("(no active experiments in registry — nothing to check)");
} else {
  console.log(
    "slug".padEnd(colW) + "body   dispatch   status   flag",
  );
  console.log("─".repeat(70));
  for (const r of results) {
    const bodyOk = existsSync(bodyFilePath(r.slug)) ? "  ✓  " : "  ✗  ";
    const dispatchOk =
      bodyKeys.includes(r.slug) && switchCases.includes(r.slug)
        ? "    ✓     "
        : "    ✗     ";
    const status = r.status === "pass" ? "pass" : "FAIL";
    console.log(
      r.slug.padEnd(colW) + bodyOk + dispatchOk + " " + status + "    " + r.flag,
    );
  }
}
console.log("─".repeat(70));
console.log(`total ${results.length}   pass ${passed}   fail ${failed}`);
console.log("");

if (orphanBodyKeys.length > 0) {
  console.warn("orphan BODY_REGISTRY entries (no matching active registry):");
  for (const k of orphanBodyKeys) console.warn(`  - ${k}`);
  console.warn("");
}
if (orphanSwitchCases.length > 0) {
  console.warn("orphan switch cases (no matching active registry):");
  for (const c of orphanSwitchCases) console.warn(`  - ${c}`);
  console.warn("");
}

if (failed === 0 && results.length > 0) {
  console.log("Per-experiment reasons:");
  for (const r of results) {
    if (r.reasons.length > 0) {
      console.log(`  ${r.slug}:`);
      for (const reason of r.reasons) console.log(`    - ${reason}`);
    }
  }
}

const ok =
  failed === 0 &&
  orphanBodyKeys.length === 0 &&
  orphanSwitchCases.length === 0;
process.exit(ok ? 0 : 1);
