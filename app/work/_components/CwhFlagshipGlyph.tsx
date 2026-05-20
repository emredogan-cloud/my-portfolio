/* ──────────────────────────────────────────────────────────────
 *  CwhFlagshipGlyph — V6 Sub-PR 14.1
 *
 *  A 64 × 64 mini-constellation that represents Cloud Waste
 *  Hunter's place in the topology: CWH center, with its two focus
 *  areas (Cloud Architecture, FinOps) and four representative
 *  techs (AWS, Terraform, DynamoDB, Lambda) orbiting outward.
 *
 *  Derived from `components/home/hero-topology-data.ts` — same
 *  visual language as the homepage hero constellation, miniaturised
 *  to the size of a sigil glyph. Server Component, zero client JS,
 *  reduced-motion safe by construction (no animation).
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1
 *            ("one 64 × 64 representation of the CWH topology
 *             pulled from the existing HeroTopologyData").
 * ────────────────────────────────────────────────────────────── */

import {
  HERO_EDGES,
  RING_STYLE,
} from "@/components/home/hero-topology-data";

const VIEWBOX = 64;
const C = VIEWBOX / 2;

/* Subgraph: CWH and everything connected to it within 2 hops.
   The hero data is the canonical map; we project a small constellation
   from CWH outward without re-deriving distances. */
const CWH_FOCUSES = HERO_EDGES.filter((e) => e.from === "cwh").map(
  (e) => e.to,
);
const CWH_TECHS = HERO_EDGES.filter((e) => CWH_FOCUSES.includes(e.from)).map(
  (e) => e.to,
);

interface PlacedNode {
  id: string;
  cx: number;
  cy: number;
  r: number;
  ring: "center" | "focus" | "tech";
}

function placeRing(ids: readonly string[], radius: number): PlacedNode[] {
  const step = (Math.PI * 2) / ids.length;
  return ids.map((id, i) => {
    const a = -Math.PI / 2 + i * step;
    return {
      id,
      cx: C + Math.cos(a) * radius,
      cy: C + Math.sin(a) * radius,
      r: 1.6,
      ring: "tech" as const,
    };
  });
}

function buildPlaced(): PlacedNode[] {
  const center: PlacedNode = {
    id: "cwh",
    cx: C,
    cy: C,
    r: 3.6,
    ring: "center",
  };

  const focusStep = (Math.PI * 2) / Math.max(CWH_FOCUSES.length, 1);
  const focuses: PlacedNode[] = CWH_FOCUSES.map((id, i) => {
    const a = -Math.PI / 2 + i * focusStep;
    return {
      id,
      cx: C + Math.cos(a) * 12,
      cy: C + Math.sin(a) * 12,
      r: 2.2,
      ring: "focus" as const,
    };
  });

  const techs = placeRing(CWH_TECHS, 24);
  return [center, ...focuses, ...techs];
}

export default function CwhFlagshipGlyph() {
  const placed = buildPlaced();
  const byId = new Map(placed.map((p) => [p.id, p]));

  const centerEdges = CWH_FOCUSES.map((id) => ({ from: "cwh", to: id }));
  const focusEdges = HERO_EDGES.filter(
    (e) => CWH_FOCUSES.includes(e.from) && byId.has(e.to),
  );
  const edges = [...centerEdges, ...focusEdges];

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      width={64}
      height={64}
      role="img"
      aria-label="Cloud Waste Hunter topology — CWH at the center surrounded by Cloud Architecture and FinOps focus areas and AWS / Terraform / DynamoDB / Lambda technologies."
      className="shrink-0"
    >
      {/* Faint ring guide at the focus orbit + tech orbit. */}
      <circle
        cx={C}
        cy={C}
        r={12}
        fill="none"
        stroke="rgba(0,210,255,0.16)"
        strokeWidth={0.4}
        strokeDasharray="1.4 2"
      />
      <circle
        cx={C}
        cy={C}
        r={24}
        fill="none"
        stroke="rgba(0,210,255,0.10)"
        strokeWidth={0.4}
        strokeDasharray="1.4 2"
      />

      {/* Edges */}
      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const opacity = a.ring === "center" ? 0.45 : 0.22;
        return (
          <line
            key={i}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
            stroke={`rgba(0,210,255,${opacity})`}
            strokeWidth={0.5}
          />
        );
      })}

      {/* Nodes — descending opacity by ring depth. */}
      {placed.map((p) => {
        const fill =
          p.ring === "center"
            ? RING_STYLE.center.fill
            : p.ring === "focus"
              ? RING_STYLE.focus.fill
              : RING_STYLE.tech.fill;
        const stroke =
          p.ring === "center" ? "rgba(0,210,255,0.55)" : "transparent";
        return (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={fill}
            stroke={stroke}
            strokeWidth={p.ring === "center" ? 0.6 : 0}
          />
        );
      })}
    </svg>
  );
}
