import {
  getTopologyGraph,
  getTopologyNodesByKind,
  getTopologyRelationshipsByKind,
  getTopologyValidationFailure,
  summariseTopologyRegistry,
} from "@/lib/v5/topology/registry";
import {
  isTopologyNodeKind,
  isTopologyRelationshipKind,
  type TopologyGraph,
} from "@/lib/v5/topology/schema";
import {
  summarisePerceptionLinks,
} from "@/lib/v5/topology/perception-link";
import {
  summariseTemporalLinks,
} from "@/lib/v5/topology/temporal-link";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology graph JSON feed.
 *
 * Read-only GET surface over the engineering-cognition registry.
 * Future Phase 8.2+ renderers consume the SAME JSON the foundation
 * ships — one source of truth, one schema.
 *
 * Query surface (all optional):
 *   ?node_kind=<kind>        → filter the `nodes` array to a
 *                               single kind from the 9 allow-
 *                               listed values. Unknown values
 *                               quietly return [].
 *   ?relationship_kind=<kind> → filter the `relationships`
 *                               array to a single kind from the
 *                               7 allow-listed verbs.
 *
 * The two filters compose. Without filters the response carries
 * the full graph.
 *
 * Response shape:
 *   {
 *     summary: TopologyRegistrySummary,
 *     temporal_link_summary: TemporalLinkSummary,
 *     perception_link_summary: PerceptionLinkSummary,
 *     validation_failure: string | null,
 *     graph: { nodes, relationships }
 *   }
 *
 * Edge runtime — the registry is static at build time, the
 * filter logic is pure; the endpoint is a thin facade over an
 * in-memory graph. Cache headers:
 *   `public, s-maxage=3600, stale-while-revalidate=86400`
 * Same posture as `/api/v5/temporal/events`. The graph changes
 * only when a sub-PR lands a new node / relationship, which is
 * itself a deploy event.
 *
 * What this endpoint does NOT do
 *   - It does NOT accept POST. The graph is append-only via
 *     the data file; there is no runtime write surface.
 *   - It does NOT read any cookie / IP / User-Agent.
 *   - It does NOT fire any telemetry. Adoption telemetry is
 *     wired separately at `/api/v5/topology/event`.
 */

export const runtime = "edge";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control":
    "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nodeKindParam = url.searchParams.get("node_kind");
  const relKindParam = url.searchParams.get("relationship_kind");

  /* Resolve filters before materialising the response. */
  const fullGraph = getTopologyGraph();
  let nodes: TopologyGraph["nodes"] = fullGraph.nodes;
  let relationships: TopologyGraph["relationships"] =
    fullGraph.relationships;

  if (nodeKindParam !== null) {
    if (!isTopologyNodeKind(nodeKindParam)) {
      return new Response(
        JSON.stringify({
          summary: summariseTopologyRegistry(),
          temporal_link_summary: summariseTemporalLinks(),
          perception_link_summary: summarisePerceptionLinks(),
          validation_failure: getTopologyValidationFailure(),
          graph: { nodes: [], relationships: [] },
        }),
        { status: 200, headers: JSON_HEADERS },
      );
    }
    nodes = getTopologyNodesByKind(nodeKindParam);
  }

  if (relKindParam !== null) {
    if (!isTopologyRelationshipKind(relKindParam)) {
      return new Response(
        JSON.stringify({
          summary: summariseTopologyRegistry(),
          temporal_link_summary: summariseTemporalLinks(),
          perception_link_summary: summarisePerceptionLinks(),
          validation_failure: getTopologyValidationFailure(),
          graph: { nodes, relationships: [] },
        }),
        { status: 200, headers: JSON_HEADERS },
      );
    }
    relationships = getTopologyRelationshipsByKind(relKindParam);
  }

  return new Response(
    JSON.stringify({
      summary: summariseTopologyRegistry(),
      temporal_link_summary: summariseTemporalLinks(),
      perception_link_summary: summarisePerceptionLinks(),
      validation_failure: getTopologyValidationFailure(),
      graph: { nodes, relationships },
    }),
    { status: 200, headers: JSON_HEADERS },
  );
}

export function POST() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
