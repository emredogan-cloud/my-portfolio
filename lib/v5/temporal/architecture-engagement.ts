import { kv } from "@vercel/kv";

/**
 * V5 Phase 7 Sub-PR 7.4 — per-project architecture-page
 * engagement counters.
 *
 * V5 § 5.2 telemetry slot:
 *   `v5:topology:architecture-page:timeline_engagements`
 *
 * Following the convention from prior sub-PRs, the literal
 * long-form slot maps to a 2-segment hash with one field per
 * project slug:
 *
 *   v5:topology:architecture-page  → hash {
 *     cloud-waste-hunter : count of sessions where the
 *                          /architecture/cloud-waste-hunter
 *                          slider was engaged (interaction
 *                          fired) — session-deduped client-
 *                          side, per (session, slug).
 *     vibing-coder-ai    : same, scoped to that page.
 *     sixpack-ai         : same.
 *     <future-slug>      : same for any future architecture
 *                          page that mounts the slider.
 *   }
 *
 * Hash relationship to other 7.x slots
 *   - `v5:topology:timeline.mounted` (7.3) — count of unique
 *     sessions where ANY slider rendered. Always fired by the
 *     slider, regardless of context.
 *   - `v5:topology:timeline.engaged` (7.3) — count of unique
 *     sessions where ANY slider was engaged. Fired once per
 *     session globally.
 *   - `v5:topology:architecture-page.<slug>` (7.4, this
 *     module) — count of unique sessions where the slider on
 *     THAT specific architecture page was engaged. Fired once
 *     per session per slug.
 *
 * A visitor who engages with the slider on
 * /architecture/cloud-waste-hunter and later engages with the
 * slider on /architecture/vibing-coder-ai contributes:
 *   - 1 to `v5:topology:timeline.engaged` (first interaction
 *     in the session — global counter caps at one per session)
 *   - 1 to `v5:topology:architecture-page.cloud-waste-hunter`
 *   - 1 to `v5:topology:architecture-page.vibing-coder-ai`
 *
 * The two per-project fires are SEPARATE network calls from
 * the global fire — the TimelineSlider's `fireEngagement` helper
 * orchestrates both with independent sessionStorage dedupe slots.
 *
 * Privacy posture: aggregate-only. The slug is a public
 * architectural identifier (already used in URLs / project ids
 * / sitemap), not a per-visitor signal. No identifier is
 * persisted on the storage path.
 *
 * Same posture as Phase 7.1-7.3 hashes:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 */

export const ARCHITECTURE_ENGAGEMENT_HASH_KEY =
  "v5:topology:architecture-page";

/** Syntactic shape check for an architecture project slug.
 *  Same kebab-case pattern as event ids (max 40 chars). The
 *  endpoint validates against this before HINCRBY. */
const ARCHITECTURE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,40}$/;

export function isValidArchitectureSlug(value: unknown): value is string {
  return (
    typeof value === "string" && ARCHITECTURE_SLUG_PATTERN.test(value)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one architecture-engagement counter. Fire-and-
 *  forget; the helper is async only because @vercel/kv is.
 *  Swallows every error path. */
export async function recordArchitectureEngagement(
  slug: string,
): Promise<void> {
  if (!hasKv) return;
  if (!isValidArchitectureSlug(slug)) return;
  try {
    await kv.hincrby(ARCHITECTURE_ENGAGEMENT_HASH_KEY, slug, 1);
  } catch {
    /* swallow — architecture telemetry is decorative */
  }
}

/** Read the entire architecture-engagement hash. Returns an
 *  empty object on KV unavailable / hash never written / read
 *  error. */
export async function readArchitectureEngagement(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      ARCHITECTURE_ENGAGEMENT_HASH_KEY,
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
