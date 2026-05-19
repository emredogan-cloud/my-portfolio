import { kv } from "@vercel/kv";

import {
  type PerceptionCategory,
  PERCEPTION_CATEGORIES,
} from "./buckets";

/**
 * V5 Phase 6 Sub-PR 6.1 — perception KV record + read helpers.
 *
 * Schema (V5 § 2.13):
 *   v5:perception:<category>  → hash { bucket: count }
 *
 * Six categories, six hashes. Each hash field is a bucket label
 * (closed allow-list for fixed categories; kebab-case section /
 * navigation slug for dynamic ones — validated upstream in
 * `buckets.ts`).
 *
 * Per V5 § 4.1: aggregate-only. The HASH stores a COUNT per
 * bucket — nothing else. No per-visitor identifier, no IP, no
 * timestamp, no User-Agent.
 *
 * Posture (mirrors Phase 5.4 + Phase 4.3):
 *   - Graceful no-op when KV is unavailable: every record* returns
 *     silently, every read* returns an empty object.
 *   - Errors swallow; perception telemetry is decorative — it
 *     never blocks the request that fired the event.
 *   - HINCRBY is atomic; no race conditions between concurrent
 *     visitors recording to the same bucket.
 *
 * What this module does NOT do:
 *   - It does NOT enforce consent. The endpoint
 *     (`app/api/v5/perception/event/route.ts`) is the consent
 *     gate. Helpers here assume the caller already verified
 *     opt-in.
 *   - It does NOT validate category / bucket pairs. Validation
 *     happens upstream so a bad input rejects with 204 instead
 *     of incrementing a malformed field. The hash key constant
 *     mapping below is the only writable surface.
 */

/** KV hash key per perception category. The category-to-key map
 *  is the only writable surface — callers can't address arbitrary
 *  KV keys through this module. */
export const PERCEPTION_HASH_KEYS: Record<PerceptionCategory, string> = {
  "scroll-velocity": "v5:perception:scroll-velocity",
  "dwell-time": "v5:perception:dwell-time",
  "section-engagement": "v5:perception:section-engagement",
  "tab-visibility": "v5:perception:tab-visibility",
  "navigation-flow": "v5:perception:navigation-flow",
  adoption: "v5:perception:adoption",
} as const;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one perception bucket. Fire-and-forget at the call
 *  site; the helper itself is async only because @vercel/kv is.
 *  Swallows every error path (KV unavailable, network blip,
 *  Upstash 5xx) — perception telemetry is decorative. */
export async function recordPerceptionEvent(
  category: PerceptionCategory,
  bucket: string,
): Promise<void> {
  if (!hasKv) return;
  if (typeof bucket !== "string" || !bucket) return;
  const key = PERCEPTION_HASH_KEYS[category];
  if (!key) return;
  try {
    await kv.hincrby(key, bucket, 1);
  } catch {
    /* swallow — perception telemetry never blocks the caller */
  }
}

/** Read a single category's hash. Returns an empty object when
 *  KV is unavailable, the hash hasn't been touched yet, or the
 *  read errors. */
export async function readPerceptionCategory(
  category: PerceptionCategory,
): Promise<Record<string, number>> {
  if (!hasKv) return {};
  const key = PERCEPTION_HASH_KEYS[category];
  if (!key) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(key);
    if (!stored || typeof stored !== "object") return {};
    return normaliseHashNumbers(stored);
  } catch {
    return {};
  }
}

/** Read every perception category in parallel. The transparency
 *  page uses this to surface the aggregate snapshot. KV-less
 *  environments resolve to a fully-empty result; the page renders
 *  the zero-state branch. */
export async function readPerceptionSnapshot(): Promise<
  Record<PerceptionCategory, Record<string, number>>
> {
  /* Six parallel HGETALL round-trips. Each call already swallows
   * its own errors; Promise.all here can't reject. */
  const entries = await Promise.all(
    PERCEPTION_CATEGORIES.map(
      async (cat) => [cat, await readPerceptionCategory(cat)] as const,
    ),
  );
  /* Build a typed record. */
  const out = {} as Record<PerceptionCategory, Record<string, number>>;
  for (const [cat, data] of entries) {
    out[cat] = data;
  }
  return out;
}

/* @vercel/kv returns hash field values as strings sometimes
 * (Upstash REST quirk depending on the API version) and as
 * numbers others. Normalise to number, dropping anything that
 * doesn't parse. Mirrors the helper in
 * `lib/telemetry/metrics.ts`. */
function normaliseHashNumbers(
  raw: Record<string, number | string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}
