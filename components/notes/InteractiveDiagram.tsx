"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { NoteDiagram, DiagramNodeKind } from "@/data/notes";

/**
 * InteractiveDiagram — xyflow render for the Diagram tab on
 * `/notes/[slug]`.
 *
 * V4 Phase 2 — Sub-PR 2.5.
 *
 * Bundle discipline (V4 § 5.2.5 budgets ~50 KB for the dep):
 *   - This component is loaded via `next/dynamic({ ssr: false })`
 *     from `app/notes/[slug]/page.tsx`. xyflow's chunk lands only
 *     on the notes-slug route + only when the Diagram tab is
 *     mounted.
 *   - The `@xyflow/react` import is the entire surface — no
 *     `node` types, no `mini-map`, no `panel`. Tree-shake friendly.
 *
 * Style decisions:
 *   - Custom node renderer. The default xyflow node is a generic
 *     bordered box; the cinematic identity demands the same
 *     matte/hairline-cyan vocabulary as /telemetry, /lab,
 *     /changelog tiles.
 *   - No mini-map, no zoom toolbar, no fit-view button by default.
 *     The visitor scrolls + drags; that's plenty for a 5-8-node
 *     reference diagram. xyflow's `<Controls />` is opt-in.
 *   - Background: subtle dot grid at #00d2ff/10, GPU-friendly
 *     via xyflow's built-in Background component (no canvas).
 *
 * Telemetry: fires once per session via /api/telemetry/visit on
 * the first node click (not on pane-pan, not on render — we want
 * actual interaction signal). sessionStorage guards against
 * accidental re-firing.
 */

interface InteractiveDiagramProps {
  diagram: NoteDiagram;
  /** Slug threaded through for the session-flag namespace —
   *  same vocab as AudioPlayer's per-note flag. */
  slug: string;
}

const STORAGE_PREFIX = "v4:telemetry:notes-diagram-interaction:";

/* Per-kind cyan ramp. We stay inside the brand palette — same
 * `#00d2ff` accent in different opacities, no second colour.
 * Each kind picks a slightly different opacity on its left rule
 * + label tint so the diagram reads as five subtly distinct
 * categories without an actual rainbow. */
const KIND_ACCENT: Record<
  DiagramNodeKind,
  { ruleOpacity: number; labelTint: string }
> = {
  cloud: { ruleOpacity: 0.7, labelTint: "text-[#00d2ff]/90" },
  compute: { ruleOpacity: 0.55, labelTint: "text-[#00d2ff]/80" },
  data: { ruleOpacity: 0.4, labelTint: "text-[#00d2ff]/70" },
  model: { ruleOpacity: 0.85, labelTint: "text-[#00d2ff]/95" },
  client: { ruleOpacity: 0.3, labelTint: "text-tertiary" },
  signal: { ruleOpacity: 0.25, labelTint: "text-secondary" },
};

/* Custom node — matte card with a left-edge cyan rule whose
 * opacity reflects the `kind`. Two handles (top + bottom) for
 * edge attachment; xyflow needs them rendered even when an edge
 * doesn't use them. */
function DiagramNodeRenderer({ data }: NodeProps<Node<{
  label: string;
  kind: DiagramNodeKind;
  caption?: string;
}>>) {
  const accent = KIND_ACCENT[data.kind];
  return (
    <div className="relative min-w-[150px] max-w-[220px] rounded-xl border border-white/[0.06] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-sm">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "rgba(255,255,255,0.2)",
          width: 6,
          height: 6,
          border: "none",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute left-0 top-3 bottom-3 w-px"
        style={{
          background: `rgba(0,210,255,${accent.ruleOpacity})`,
        }}
      />
      <span
        className={`block font-mono uppercase tracking-[0.18em] text-[9px] ${accent.labelTint} mb-1`}
      >
        {data.kind}
      </span>
      <h3 className="text-primary font-medium text-[13px] leading-snug tracking-[-0.01em]">
        {data.label}
      </h3>
      {data.caption && (
        <p className="text-tertiary text-[11.5px] leading-snug mt-1.5">
          {data.caption}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "rgba(255,255,255,0.2)",
          width: 6,
          height: 6,
          border: "none",
        }}
      />
    </div>
  );
}

const NODE_TYPES = { cinematic: DiagramNodeRenderer };

export default function InteractiveDiagram({
  diagram,
  slug,
}: InteractiveDiagramProps) {
  const hasFiredRef = useRef<boolean>(false);

  /* Memoize the node + edge transforms so xyflow doesn't see
   * a fresh reference on every render and re-layout the canvas. */
  const nodes = useMemo<Node[]>(
    () =>
      diagram.nodes.map((n) => ({
        id: n.id,
        type: "cinematic",
        position: n.position,
        data: n.data,
      })),
    [diagram.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      diagram.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: false,
        style: { stroke: "rgba(0,210,255,0.35)", strokeWidth: 1 },
        labelStyle: {
          fontFamily: "var(--font-geist-sans), monospace",
          fontSize: "10px",
          fill: "rgba(255,255,255,0.55)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        },
        labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.85 },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
      })),
    [diagram.edges],
  );

  const handleNodeClick = useCallback(() => {
    if (hasFiredRef.current) return;
    const key = `${STORAGE_PREFIX}${slug}`;
    try {
      if (sessionStorage.getItem(key) === "fired") {
        hasFiredRef.current = true;
        return;
      }
      sessionStorage.setItem(key, "fired");
    } catch {
      /* sessionStorage blocked — accept one extra count per
       * page load. */
    }
    hasFiredRef.current = true;
    void fetch("/api/telemetry/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surface: "notes-diagram-interaction" }),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  }, [slug]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
          Diagram
        </span>
        <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet">
          {diagram.nodes.length} nodes · {diagram.edges.length} edges
        </span>
      </div>
      <div
        className="rounded-xl border border-white/[0.05] bg-black/40 overflow-hidden"
        style={{ height: 420 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          onNodeClick={handleNodeClick}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={true}
          panOnDrag={true}
        >
          <Background gap={24} size={1} color="rgba(0,210,255,0.08)" />
          <Controls
            showInteractive={false}
            position="bottom-right"
            style={{
              background: "rgba(10,10,10,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
            }}
          />
        </ReactFlow>
      </div>
      <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Drag to pan</span>
        <span className="text-faint">·</span>
        <span>Pinch / scroll-zoom disabled</span>
        <span className="text-faint">·</span>
        <span>Click a node for first-interaction telemetry</span>
      </p>
    </div>
  );
}
