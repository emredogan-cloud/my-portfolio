import {
  isValidArchitectureSlug,
  recordArchitectureEngagement,
} from "@/lib/v5/temporal/architecture-engagement";
import {
  isTimelineEngagementKind,
  recordTimelineEngagement,
} from "@/lib/v5/temporal/timeline-telemetry";

/**
 * V5 Phase 7 Sub-PR 7.3 — timeline engagement event endpoint.
 * V5 Phase 7 Sub-PR 7.4 — extended to dispatch per-project
 * engagement when the inbound body carries a valid `context`
 * slug.
 *
 * Sibling of `/api/v5/temporal/adoption` (Phase 7.1) and
 * `/api/v5/temporal/playback` (Phase 7.2). Different signal
 * class, different hash, different vocabulary:
 *
 *   - 7.1 `/adoption` → page-level reach (view / category_view /
 *     event_view)
 *   - 7.2 `/playback` → controller verbs (seek / scrub / play /
 *     pause / step)
 *   - 7.3 `/timeline` → SLIDER lifecycle (mounted / engaged).
 *     "Mounted" measures awareness — the slider rendered.
 *     "Engaged" measures use — the visitor interacted with it.
 *     The ratio is the engagement_rate V5 § 5.2 names.
 *   - 7.4 → SAME endpoint, optional `context` field. When
 *     present and valid, the engagement signal ALSO increments
 *     `v5:topology:architecture-page.<slug>` so the operator
 *     can see per-project engagement.
 *
 * Endpoint dispatch contract (post-7.4):
 *
 *   POST { kind: "mounted" }
 *     → HINCRBY v5:topology:timeline mounted 1
 *
 *   POST { kind: "engaged" }
 *     → HINCRBY v5:topology:timeline engaged 1
 *
 *   POST { kind: "engaged", context: "<slug>" }
 *     → HINCRBY v5:topology:architecture-page <slug> 1
 *     (NOT the global engaged — the client is expected to fire
 *     the global event in a SEPARATE POST when its own
 *     sessionStorage gate hasn't yet been set)
 *
 *   POST { kind: "mounted", context: "<slug>" }
 *     → HINCRBY v5:topology:timeline mounted 1  (context ignored)
 *     (no per-project mounted counter; mounted is global-only.
 *     Per-project mounted would be redundant on architecture
 *     pages where each visit is a mount.)
 *
 * The client (TimelineSlider) is responsible for deciding which
 * fires it needs based on its own sessionStorage state. The
 * server is a thin dispatcher.
 *
 * Gate hierarchy
 *   1. JSON body parses to `{ kind, context? }`.
 *   2. `kind` is one of the two allow-listed values
 *      (TIMELINE_ENGAGEMENT_KINDS).
 *   3. If `context` is present, it must pass
 *      `isValidArchitectureSlug` (kebab-case, max 41 chars).
 *      Invalid context drops the request silently.
 *
 * Same posture as the rest of the temporal endpoints:
 *   - No consent gate (public-archive content; no per-visitor
 *     data on the persisted path).
 *   - No IP / UA / cookie reads.
 *   - Edge runtime.
 *   - Always returns 204.
 *
 * Client-side dedupe contract: the TimelineSlider component
 * fires each (kind, context) tuple AT MOST ONCE per session
 * using sessionStorage flags. The endpoint does NOT enforce
 * dedupe — a misbehaving client could fire many times, but the
 * rate calculation cap (engaged ≤ mounted, with
 * computeEngagementRate clamping to 1.0) keeps the downstream
 * metric sensible.
 */

export const runtime = "edge";

interface TimelinePayload {
  kind?: unknown;
  context?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: TimelinePayload;
  try {
    body = (await req.json()) as TimelinePayload;
  } catch {
    return noContent();
  }
  if (!isTimelineEngagementKind(body.kind)) {
    return noContent();
  }
  const kind = body.kind;

  /* When context is present and valid, dispatch the per-project
   * engagement INSTEAD of the global engaged counter. The client
   * is expected to have fired the global event in a separate
   * POST already (or skipped it because its sessionStorage gate
   * was already set). The split lets `engaged` aggregate across
   * sliders globally while ALSO breaking out per-project. */
  if (typeof body.context !== "undefined") {
    if (!isValidArchitectureSlug(body.context)) {
      return noContent();
    }
    /* Only engaged is per-project; mounted stays global only
     * (every architecture page visit is effectively a mount —
     * the per-project mounted counter would be redundant with
     * page-visit counts the operator can already see). */
    if (kind === "engaged") {
      void recordArchitectureEngagement(body.context);
    }
    return noContent();
  }

  /* No context: global timeline hash (mounted or engaged). */
  void recordTimelineEngagement(kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
