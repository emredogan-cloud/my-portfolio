import {
  recordPlaygroundVisit,
  recordPlaygroundMount,
  recordPlaygroundCapabilityMiss,
} from "@/lib/telemetry/metrics";
import { getExperiment } from "@/lib/playground/registry";

/**
 * Playground experiment event endpoint — V4 Phase 5 Sub-PR 5.4.
 *
 * Discriminated POST surface for the three per-experiment
 * counters:
 *   visit           → fired by ExperimentVisitPing after the
 *                     triple gate passes
 *   mount           → fired by ExperimentMount when the body
 *                     successfully renders
 *   capability-miss → fired by ExperimentMount when declared
 *                     requirements aren't met
 *
 * Posture:
 *   - Edge runtime. One KV HINCRBY per event. Fire-and-forget
 *     from the client.
 *   - Always returns 204 No Content — playground telemetry is
 *     decorative; a misbehaving client never blows up the page.
 *   - Slug allow-list via `getExperiment(slug)`. An unknown slug
 *     is silently dropped, same posture as the visit endpoint's
 *     surface allow-list.
 *   - No new auth surface. Same anti-poison posture as the
 *     existing /api/telemetry/visit: only known slugs map to KV
 *     writes; everything else is a no-op 204.
 *   - GET returns 405 to prevent accidental prefetch
 *     incrementing.
 */

export const runtime = "edge";

type EventType = "visit" | "mount" | "capability-miss";

const KNOWN_TYPES: ReadonlySet<EventType> = new Set([
  "visit",
  "mount",
  "capability-miss",
]);

interface EventPayload {
  type?: unknown;
  slug?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: EventPayload;
  try {
    body = (await req.json()) as EventPayload;
  } catch {
    return noContent();
  }

  if (typeof body.type !== "string" || !KNOWN_TYPES.has(body.type as EventType)) {
    return noContent();
  }
  if (typeof body.slug !== "string" || !body.slug) {
    return noContent();
  }

  /* Slug must correspond to a real registry entry. Drops any
   * inbound slug we don't recognize. */
  const experiment = getExperiment(body.slug);
  if (!experiment) {
    return noContent();
  }

  const type = body.type as EventType;
  const slug = body.slug;

  /* Fire-and-forget — the request completes immediately, the
   * KV write happens in background. Errors swallow inside the
   * helpers. */
  switch (type) {
    case "visit":
      void recordPlaygroundVisit(slug);
      break;
    case "mount":
      void recordPlaygroundMount(slug);
      break;
    case "capability-miss":
      void recordPlaygroundCapabilityMiss(slug);
      break;
  }

  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
