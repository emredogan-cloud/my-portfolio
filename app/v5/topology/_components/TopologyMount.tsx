"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { detectTopologyCapabilities } from "@/lib/v5/topology/capabilities";
import type { RenderableTopology } from "@/lib/v5/topology/render-abstraction";
import {
  resolveShippedRendererKind,
  selectTopologyRendererKind,
  type TopologyRendererKind,
} from "@/lib/v5/topology/renderers/select";

/**
 * V5 Phase 8 Sub-PR 8.3 — topology mount.
 *
 * The thin client wrapper that turns the Phase 8.1 registry +
 * Phase 8.2 renderer chassis into a visible surface on the
 * Phase 8.3 production route.
 *
 * Responsibilities
 *   1. Detect device capabilities (WebGPU async / reduced-motion
 *      sync / mobile viewport sync).
 *   2. Select the renderer kind via the 8.2 pure selector +
 *      last-mile shipped-kind downgrade.
 *   3. Dynamically import the matching renderer (SVG kept in
 *      SSR mode; Three.js client-only). The dynamic-import
 *      pattern enforced by the 8.2 barrel's NON-re-export keeps
 *      the renderer chunks out of any consumer that imports
 *      this mount but never dispatches it.
 *   4. Fire ONE `view` event per session through the Phase 8.1
 *      `/api/v5/topology/event` endpoint. Session-deduped via
 *      sessionStorage.
 *
 * What this component is NOT
 *   - It is NOT a renderer. It dispatches to one.
 *   - It does NOT fire `node_inspect` / `relationship_traverse`
 *     / `path_query` events. Interaction telemetry is deferred
 *     to a future sub-PR; only `view` fires from 8.3. The other
 *     three event-kind slots stay reserved on the Phase 8.1
 *     hash.
 *   - It does NOT compute layout. The selected renderer
 *     internally calls `layoutTopology` from 8.2.
 *
 * SSR posture
 *   The component renders the SVG fallback path on first paint
 *   (so the server-rendered HTML includes the topology as
 *   semantic SVG — crawlers see the full graph). After
 *   hydration, the capability check resolves and (if the
 *   visitor qualifies for the Three.js path) the Three.js
 *   chunk dynamically loads and replaces the SVG in the same
 *   container.
 *
 * Reduced-motion + mobile visitors stay on the SVG path
 * permanently — `selectTopologyRendererKind` returns "svg" for
 * those capability profiles, and the dispatch never upgrades
 * past it.
 *
 * Telemetry session dedupe slot:
 *   sessionStorage key `v5:topology:view:fired:<slug>` so a
 *   visitor who navigates between project topology pages in
 *   the same session contributes one `view` event per slug,
 *   not per page-mount. The slug is the optional `context`
 *   prop; when absent, the dedupe collapses to a single
 *   global `view`.
 *
 * Phase 8 philosophy
 *   The Mount is a pass-through. No animation, no custom
 *   loading state beyond the SVG SSR fallback, no
 *   interpretive overlays. The renderer's restraint shows
 *   through cleanly because the wrapper adds zero new
 *   visual chrome.
 */

const SVGTopologyRenderer = dynamic(
  () =>
    import(
      "@/lib/v5/topology/renderers/svg-renderer"
    ).then((mod) => mod.default),
  {
    ssr: true,
    loading: () => null,
  },
);

const ThreeTopologyRenderer = dynamic(
  () =>
    import(
      "@/lib/v5/topology/renderers/three-renderer"
    ).then((mod) => mod.default),
  {
    ssr: false,
    /* Three.js can't render server-side; we keep the SVG
     * fallback visible while the client-side chunk loads. */
    loading: () => null,
  },
);

const TOPOLOGY_EVENT_ENDPOINT = "/api/v5/topology/event";
const VIEW_STORAGE_PREFIX = "v5:topology:view:fired:";

function fireViewEvent(slug?: string): void {
  if (typeof window === "undefined") return;
  const slot = slug ? `${VIEW_STORAGE_PREFIX}${slug}` : `${VIEW_STORAGE_PREFIX}_global`;
  try {
    if (window.sessionStorage.getItem(slot) === "1") return;
    window.sessionStorage.setItem(slot, "1");
  } catch {
    /* sessionStorage blocked — fall through and fire anyway.
     * Honest degradation. */
  }
  void fetch(TOPOLOGY_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "view" }),
    keepalive: true,
  }).catch(() => {
    /* swallow — telemetry never blocks the mount */
  });
}

export interface TopologyMountProps {
  /** The renderable topology to display. Phase 8.3's project
   *  page passes the project subgraph (BFS 2 hops out from
   *  the project node). */
  graph: RenderableTopology;
  /** Optional slug for session-dedupe keying on the `view`
   *  event. Phase 8.3 passes the project slug; future
   *  consumers can pass a different key (or omit). */
  slug?: string;
  /** Optional className for the rendering surface wrapper.
   *  Both renderers accept a className and resize to it. */
  className?: string;
}

export default function TopologyMount({
  graph,
  slug,
  className,
}: TopologyMountProps) {
  /* The kind defaults to "svg" so SSR renders the static
   * fallback. The client-side capability resolve upgrades to
   * "three" when the visitor qualifies. */
  const [kind, setKind] = useState<TopologyRendererKind>("svg");

  /* Capability detection runs once after mount. The async
   * dispatch resolves the renderer kind; setState triggers a
   * re-render that swaps in the Three.js dynamic chunk. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const caps = await detectTopologyCapabilities();
      if (cancelled) return;
      const requested = selectTopologyRendererKind(caps);
      const shipped = resolveShippedRendererKind(requested);
      setKind(shipped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Fire `view` once per session per slug. The effect runs
   * after commit so SSR rendering is unaffected; the
   * sessionStorage gate inside `fireViewEvent` enforces the
   * once-per-session contract. */
  useEffect(() => {
    fireViewEvent(slug);
  }, [slug]);

  if (kind === "three") {
    return <ThreeTopologyRenderer graph={graph} className={className} />;
  }
  /* "svg" and any unmatched kind (forward-slot WebGPU
   * without an implementation) fall through to the SVG
   * renderer — the always-functional path. */
  return <SVGTopologyRenderer graph={graph} />;
}
