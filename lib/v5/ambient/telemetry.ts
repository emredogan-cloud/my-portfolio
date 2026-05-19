import { kv } from "@vercel/kv";

import { isAmbientEnabled } from "./flags";

/**
 * V5 Phase 10 Sub-PR 10.1 — ambient adoption counters.
 *
 * Single hash, four event kinds. Same posture as every
 * other V5 adoption hash since Phase 6.4.
 *
 *   v5:ambient:adoption  → hash {
 *     context_composed      : composeAmbientContext() ran
 *                              successfully (server-side).
 *     domain_view_resolved  : a domain view returned a non-
 *                              null projection.
 *     domain_view_missing   : a domain view returned null
 *                              (source unavailable / flag off /
 *                              consent missing).
 *     context_endpoint_view : /api/v5/ambient/context returned
 *                              200 (the JSON feed was read).
 *   }
 *
 * Why only these four kinds
 *   - The ambient layer ships ZERO visible surfaces in 10.1.
 *   - The only adoption signal an aggregate-only foundation
 *     can fire is "did I get composed", "did each domain
 *     project successfully", "did anyone read the JSON".
 *   - Future ambient consumers (10.2+) will add their own
 *     kinds on their own hashes; the ambient hash stays
 *     focused on FOUNDATION health.
 *
 * Flag gate
 *   `isAmbientEnabled()` (V5_AMBIENT_ENABLED) gates every
 *   write. When OFF, the helper silently returns without
 *   touching KV. This means an operator can rebuild the
 *   composer in development without polluting the
 *   production adoption hash.
 *
 * Privacy posture
 *   Aggregate-only. HINCRBY per event kind. No per-visitor
 *   field. No timestamp per write (the hash carries event
 *   counts only). No User-Agent capture.
 *
 * Graceful no-op
 *   KV unavailable → silent return. Malformed kind →
 *   silent return. Fire-and-forget at call sites.
 *
 * Edge-safety: edge-safe @vercel/kv usage.
 */

export const AMBIENT_ADOPTION_HASH_KEY = "v5:ambient:adoption";

export const AMBIENT_ADOPTION_EVENTS = [
  "context_composed",
  "domain_view_resolved",
  "domain_view_missing",
  "context_endpoint_view",
] as const;

export type AmbientAdoptionEvent =
  (typeof AMBIENT_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<AmbientAdoptionEvent> = new Set(
  AMBIENT_ADOPTION_EVENTS,
);

export function isAmbientAdoptionEvent(
  value: unknown,
): value is AmbientAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as AmbientAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/**
 * Increment one ambient-adoption counter. Fire-and-forget;
 * swallows every error path. Gated by V5_AMBIENT_ENABLED —
 * when the flag is OFF, the helper is a guaranteed no-op
 * (the foundation can be composed in dev without polluting
 * production telemetry).
 */
export async function recordAmbientEvent(
  kind: AmbientAdoptionEvent,
): Promise<void> {
  if (!isAmbientEnabled()) return;
  if (!hasKv) return;
  if (!isAmbientAdoptionEvent(kind)) return;
  try {
    await kv.hincrby(AMBIENT_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — ambient telemetry is decorative */
  }
}

/**
 * Read the entire ambient adoption hash. Returns an empty
 * object on KV unavailable / hash never written / read
 * error. Operator-facing read; used by the JSON feed +
 * future transparency surfaces.
 */
export async function readAmbientAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      AMBIENT_ADOPTION_HASH_KEY,
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
