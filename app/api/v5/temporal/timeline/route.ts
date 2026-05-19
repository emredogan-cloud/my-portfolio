import {
  isTimelineEngagementKind,
  recordTimelineEngagement,
} from "@/lib/v5/temporal/timeline-telemetry";

/**
 * V5 Phase 7 Sub-PR 7.3 — timeline engagement event endpoint.
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
 *
 * Gate hierarchy
 *   1. JSON body parses to `{ kind }`.
 *   2. `kind` is one of the two allow-listed values in
 *      `TIMELINE_ENGAGEMENT_KINDS`.
 *
 * Same posture as the rest of the temporal endpoints:
 *   - No consent gate (public-archive content; no per-visitor
 *     data on the persisted path).
 *   - No IP / UA / cookie reads.
 *   - Edge runtime.
 *   - Always returns 204.
 *
 * Client-side dedupe contract: the TimelineSlider component
 * fires each kind AT MOST ONCE per session using sessionStorage
 * flags. The endpoint does NOT enforce dedupe — a misbehaving
 * client could fire many times, but the rate calculation cap
 * (engaged ≤ mounted, with computeEngagementRate clamping to
 * 1.0) keeps the downstream metric sensible.
 */

export const runtime = "edge";

interface TimelinePayload {
  kind?: unknown;
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
  void recordTimelineEngagement(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
