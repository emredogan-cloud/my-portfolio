import Link from "next/link";
import type { NoteCluster } from "@/data/notes";

/* ──────────────────────────────────────────────────────────────
 *  NoteAtlas — V6 Sub-PR 13.1
 *
 *  Topic-cluster filter rendered as a small constellation diagram
 *  on lg+ (vertical column right of the chronicle) and a horizontal
 *  pill row above the chronicle on mobile.
 *
 *  Borrows the constellation language from HeroTopology: four
 *  cluster nodes (cloud / ai / mobile / discipline) connected by
 *  cyan hairlines at low opacity. Each node is a server-rendered
 *  <a href="/notes?cluster=…"> link — no client JS, no router
 *  state. Cluster filter flows through URL searchParams; the
 *  chronicle re-renders server-side with the filtered list.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 7.1.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.1.
 * ────────────────────────────────────────────────────────────── */

interface AtlasNode {
  readonly id: NoteCluster;
  readonly label: string;
  readonly cx: number;
  readonly cy: number;
}

const NODES: readonly AtlasNode[] = [
  { id: "cloud", label: "Cloud", cx: 32, cy: 30 },
  { id: "ai", label: "AI", cx: 110, cy: 80 },
  { id: "mobile", label: "Mobile", cx: 44, cy: 150 },
  { id: "discipline", label: "Discipline", cx: 116, cy: 210 },
] as const;

/* Hairline connections — drawn first so the cluster nodes paint
 * on top. Constellation language: not a strict graph, an
 * asymmetric chain that reads as a sky-map. */
const CONNECTIONS: ReadonlyArray<readonly [NoteCluster, NoteCluster]> = [
  ["cloud", "ai"],
  ["ai", "mobile"],
  ["mobile", "discipline"],
  ["cloud", "mobile"],
] as const;

function nodePos(id: NoteCluster): { cx: number; cy: number } {
  const n = NODES.find((node) => node.id === id);
  if (!n) {
    throw new Error(`NoteAtlas: unknown cluster id ${id}`);
  }
  return { cx: n.cx, cy: n.cy };
}

export interface NoteAtlasProps {
  /** Map of cluster → note count, computed at the page level. */
  counts: Readonly<Record<NoteCluster, number>>;
  /** The active cluster (from URL searchParams), if any. The
   *  visited node renders with a brighter cyan core; siblings stay
   *  quiescent. */
  activeCluster: NoteCluster | null;
}

export default function NoteAtlas({
  counts,
  activeCluster,
}: NoteAtlasProps) {
  return (
    <aside aria-label="Notes topic atlas">
      {/* ── Desktop: vertical constellation diagram ────────────── */}
      <div className="hidden lg:block sticky top-32">
        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet mb-4">
          Atlas
        </p>
        <svg
          viewBox="0 0 220 250"
          className="w-full max-w-[220px]"
          aria-hidden="true"
        >
          {/* Hairline connections — drawn first under the nodes. */}
          {CONNECTIONS.map(([a, b]) => {
            const from = nodePos(a);
            const to = nodePos(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke="#00d2ff"
                strokeOpacity={0.12}
                strokeWidth={1}
              />
            );
          })}

          {NODES.map((node) => {
            const count = counts[node.id] ?? 0;
            const active = activeCluster === node.id;
            const hasNotes = count > 0;
            const href = `/notes?cluster=${node.id}`;
            return (
              <a
                key={node.id}
                href={hasNotes ? href : undefined}
                aria-label={`${node.label} cluster, ${count} note${count === 1 ? "" : "s"}`}
                className={hasNotes ? "cursor-pointer" : "cursor-default"}
              >
                {/* Cluster node — slightly larger when active. */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={active ? 5 : 3.5}
                  fill="#00d2ff"
                  fillOpacity={active ? 1 : hasNotes ? 0.75 : 0.25}
                />
                {/* Active halo. */}
                {active ? (
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={9}
                    fill="none"
                    stroke="#00d2ff"
                    strokeOpacity={0.35}
                    strokeWidth={1}
                  />
                ) : null}
                <text
                  x={node.cx + 12}
                  y={node.cy - 2}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  fontWeight={500}
                  fontSize="11"
                  fill={active ? "#ffffff" : hasNotes ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.30)"}
                  className="select-none"
                >
                  {node.label}
                </text>
                <text
                  x={node.cx + 12}
                  y={node.cy + 11}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  fontWeight={400}
                  fontSize="9"
                  fill="rgba(255,255,255,0.30)"
                  letterSpacing="0.05em"
                  className="select-none uppercase"
                >
                  {count} {count === 1 ? "note" : "notes"}
                </text>
              </a>
            );
          })}
        </svg>

        {activeCluster ? (
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 mt-6 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors"
          >
            ← Clear filter
          </Link>
        ) : null}
      </div>

      {/* ── Mobile / tablet: horizontal pill row ──────────────── */}
      <div className="lg:hidden flex flex-wrap gap-2 items-center">
        <Link
          href="/notes"
          aria-current={activeCluster === null ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] border transition-colors ${
            activeCluster === null
              ? "border-[#00d2ff]/40 bg-[#00d2ff]/[0.06] text-[#00d2ff]"
              : "border-white/[0.08] bg-white/[0.02] text-tertiary hover:border-white/[0.18] hover:text-primary"
          }`}
        >
          All
        </Link>
        {NODES.map((node) => {
          const count = counts[node.id] ?? 0;
          const active = activeCluster === node.id;
          const hasNotes = count > 0;
          if (!hasNotes) {
            return (
              <span
                key={node.id}
                aria-disabled="true"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] border border-white/[0.04] bg-transparent text-faint"
              >
                {node.label}
                <span className="tabular-nums">0</span>
              </span>
            );
          }
          return (
            <Link
              key={node.id}
              href={`/notes?cluster=${node.id}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] border transition-colors ${
                active
                  ? "border-[#00d2ff]/40 bg-[#00d2ff]/[0.06] text-[#00d2ff]"
                  : "border-white/[0.08] bg-white/[0.02] text-tertiary hover:border-white/[0.18] hover:text-primary"
              }`}
            >
              {node.label}
              <span className="text-quiet tabular-nums">{count}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
