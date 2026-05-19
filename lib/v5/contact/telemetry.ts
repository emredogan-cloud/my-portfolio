import { kv } from "@vercel/kv";

import {
  type ContactPattern,
  CONTACT_PATTERNS,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive contact adoption counters.
 *
 * Single hash with one field per pattern. The would-be
 * AdaptivePatternProvider fires the classifier's verdict
 * once per session per pathname; the aggregate distribution
 * lets the operator see "what percentage of sessions
 * classify as recruiter vs senior-engineer vs casual vs
 * default".
 *
 *   v5:contact:adoption  → hash {
 *     pattern_default          : count of sessions that
 *                                fell through to the default
 *                                fallback (the universal
 *                                layout)
 *     pattern_senior_engineer  : count of sessions matching
 *                                the senior-engineer pattern
 *     pattern_casual           : count of sessions matching
 *                                the casual-browser pattern
 *     pattern_recruiter        : count of sessions matching
 *                                the recruiter pattern
 *   }
 *
 * Privacy posture
 *   - Aggregate-only. Counter by pattern kind, never per-
 *     visitor.
 *   - The PATTERN is not a visitor identity — it's an
 *     ephemeral classification of session shape. Two
 *     different visitors with the same browsing pattern
 *     receive the same label.
 *   - No identifier is stored on the persisted path. The
 *     pattern label is a 1-of-4 enum; reverse engineering
 *     it back to a visitor is information-theoretically
 *     impossible.
 *
 * KIRMIZI ÇİZGİ enforcement
 *   The telemetry layer carries NO surface that displays
 *   pattern data to the visitor. The aggregate is readable
 *   from KV by the operator (or a future /telemetry tile);
 *   the visitor only sees the page layout that the pattern
 *   selected, never the pattern label itself.
 *
 * Same posture as every other V5 adoption hash:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 */

export const CONTACT_ADOPTION_HASH_KEY = "v5:contact:adoption";

/** Field naming pattern: `pattern_<kind>`. Mirrors the
 *  Phase 6.1 perception adoption hash's
 *  `opt_in_*` / `opt_in_revoked` field-naming convention. */
const PATTERN_FIELD_PREFIX = "pattern_";

/** True when `value` is one of the four allow-listed
 *  pattern labels — used by the endpoint to validate the
 *  inbound `pattern` field before HINCRBY. */
export function isValidPatternForTelemetry(
  value: unknown,
): value is ContactPattern {
  return (
    typeof value === "string" &&
    (CONTACT_PATTERNS as readonly string[]).includes(value)
  );
}

/** Map a pattern label to its field name on the adoption
 *  hash. Public + pure so the endpoint validator + the
 *  Provider's recorder agree on the shape. */
export function fieldNameForPattern(pattern: ContactPattern): string {
  /* Replace the hyphen in `senior-engineer` with an
   * underscore so the KV field name is a single
   * `_`-separated token. */
  const sanitised = pattern.replace(/-/g, "_");
  return `${PATTERN_FIELD_PREFIX}${sanitised}`;
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment the counter for one classified pattern. Fire-
 *  and-forget; the helper is async only because @vercel/kv
 *  is. Swallows every error path. */
export async function recordContactPattern(
  pattern: ContactPattern,
): Promise<void> {
  if (!hasKv) return;
  if (!isValidPatternForTelemetry(pattern)) return;
  const field = fieldNameForPattern(pattern);
  try {
    await kv.hincrby(CONTACT_ADOPTION_HASH_KEY, field, 1);
  } catch {
    /* swallow — contact telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. */
export async function readContactAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      CONTACT_ADOPTION_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(stored)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}
