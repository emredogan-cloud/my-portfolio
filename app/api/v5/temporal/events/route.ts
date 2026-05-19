import {
  getEvolutionEvents,
  getEvolutionEventsByCategory,
  summariseEvolutionRegistry,
} from "@/lib/v5/temporal/registry";
import {
  type EvolutionEventCategory,
  isEvolutionEventCategory,
} from "@/lib/v5/temporal/schema";

/**
 * V5 Phase 7 Sub-PR 7.1 — temporal events JSON feed.
 *
 * Read-only GET surface over the engineering memory registry.
 * Future Phase 7+ surfaces (timeline scrubber, topology playback,
 * operational twin) can consume the same JSON the public
 * /evolution page renders — one source of truth, one schema.
 *
 * Query surface (all optional):
 *   ?category=<category>  → filter to one of the 7 allow-listed
 *                            categories (architecture /
 *                            infrastructure / ai-system / topology /
 *                            release / milestone / evolution).
 *                            Unknown values quietly return [].
 *   ?system=<slug>        → filter to one system slug. Case-
 *                            sensitive kebab-case (`lumina`,
 *                            `cloud-waste-hunter`, etc.).
 *
 * The two filters compose (`?category=ai-system&system=lumina`
 * narrows to Lumina-class AI events).
 *
 * Response shape:
 *   {
 *     summary: EvolutionRegistrySummary,
 *     events:  EvolutionEvent[]
 *   }
 *
 * Edge runtime — the registry is static at build time, the
 * filter logic is pure; the endpoint is a thin facade over an
 * in-memory array. Set `Cache-Control: public, s-maxage=3600,
 * stale-while-revalidate=86400` so the CDN serves the JSON for
 * an hour and quietly revalidates in the background. The
 * underlying registry changes only when a sub-PR lands a new
 * memory event, which is a deploy event itself.
 *
 * What this endpoint does NOT do:
 *   - It does NOT accept POST. The registry is append-only via
 *     the data file; there is no runtime write surface.
 *   - It does NOT read any cookie / IP / User-Agent. The
 *     response is identical for every caller.
 *   - It does NOT fire any telemetry. Telemetry is wired at the
 *     page surface (visit ping, deep-link beacon), not at the
 *     API.
 */

export const runtime = "edge";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control":
    "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(req: Request) {
  /* No body to parse on GET. Query string is the only input. */
  const url = new URL(req.url);
  const categoryParam = url.searchParams.get("category");
  const systemParam = url.searchParams.get("system");

  /* Validate filters BEFORE materialising any work. Unknown
   * filters return an empty events list with the summary still
   * populated so consumers can distinguish "no match" from
   * "registry empty". */
  let events: ReturnType<typeof getEvolutionEvents>;

  if (categoryParam !== null) {
    if (!isEvolutionEventCategory(categoryParam)) {
      return new Response(
        JSON.stringify({
          summary: summariseEvolutionRegistry(),
          events: [],
        }),
        { status: 200, headers: JSON_HEADERS },
      );
    }
    const category: EvolutionEventCategory = categoryParam;
    events = getEvolutionEventsByCategory(category);
  } else {
    events = getEvolutionEvents();
  }

  if (systemParam !== null) {
    if (typeof systemParam !== "string" || !systemParam) {
      return new Response(
        JSON.stringify({
          summary: summariseEvolutionRegistry(),
          events: [],
        }),
        { status: 200, headers: JSON_HEADERS },
      );
    }
    events = events.filter((e) => e.system === systemParam);
  }

  return new Response(
    JSON.stringify({
      summary: summariseEvolutionRegistry(),
      events,
    }),
    { status: 200, headers: JSON_HEADERS },
  );
}

export function POST() {
  /* The registry is append-only via the data file. No runtime
   * write surface exists. */
  return new Response(null, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
