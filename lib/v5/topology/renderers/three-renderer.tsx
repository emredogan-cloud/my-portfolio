"use client";

import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

import { layoutTopology, type LayoutNode } from "../layout";
import type { RenderableTopology } from "../render-abstraction";
import type {
  TopologyNodeKind,
  TopologyRelationshipKind,
} from "../schema";

/**
 * V5 Phase 8 Sub-PR 8.2 — Three.js topology renderer.
 *
 * The desktop enhanced path. Uses @react-three/fiber + three +
 * @react-three/drei (all already in package.json — no new
 * dependencies). The renderer the selector returns when:
 *   - The visitor is not on mobile (viewport >= 768px).
 *   - The OS reduced-motion preference is NOT set.
 *   - WebGPU is unavailable (or the WebGPU renderer hasn't
 *     shipped yet).
 *
 * Phase 8 cognition note + restraint contract
 *   The user's Phase 8 brief catalogues failure modes:
 *
 *     > * flashy motion theater
 *     > * GPU vanity
 *     > * overengineered graphics
 *     > * cyberpunk aesthetics
 *     > * visual noise
 *
 *   This renderer is designed AGAINST those. Specifically:
 *     - Single hue (#00d2ff) across the entire scene. No
 *       rainbow, no glow chain, no chromatic separation.
 *     - No post-processing. No bloom. No SSAO. No DOF.
 *       Default materials only.
 *     - No particle effects. No starfields. No trail
 *       renderers. No animated edges.
 *     - `frameloop="demand"` — Three.js only renders frames
 *       when the scene changes. Idle CPU is 0% when the
 *       visitor isn't interacting. Validates the V5 § 5.3
 *       8.1 "Idle frame 0" criterion.
 *     - Constrained OrbitControls — the camera can rotate
 *       but not flip upside down or scroll past sensible
 *       bounds. Reads as "engineering observer", not "free
 *       3D toy".
 *     - Static layout from `layout.ts` — deterministic ring
 *       arrangement, no force simulation, no jitter.
 *
 * What this renderer is NOT
 *   - It is NOT mounted on any production route in 8.2. The
 *     module exists as a primitive; Phase 8.3+ will mount it
 *     on a project-specific route with the right capability
 *     gating + telemetry firing.
 *   - It does NOT fire telemetry events. Adoption events
 *     wire in when the renderer is consumed; the foundation
 *     here is the rendering surface only.
 *
 * Bundle posture
 *   This module is `"use client"` and imports `three` +
 *   `@react-three/fiber` + `@react-three/drei`. Those deps
 *   are already in the production bundle via the existing
 *   HeroTopologyScene / AWSTopologyScene / CodexTopologyScene
 *   surfaces. The new code adds ~3-5 KB minified on top —
 *   tree-shaken from every route that doesn't import this
 *   module.
 */

/* Ring radii — slightly larger than the layout's normalised
 * values to give the 3D scene visual breathing room. */
const RING_RADIUS_3D: readonly number[] = [0.0, 1.6, 3.0, 4.4];
const RING_ELEVATION_3D: readonly number[] = [0.0, -0.2, -0.4, -0.6];
const NODE_RADIUS_BY_RING: readonly number[] = [0.32, 0.22, 0.16, 0.12];

/* Subtle Y wobble per ring so the scene has a soft 3D depth
 * cue without animated motion (the wobble is STATIC per node
 * — set once at layout, not animated by useFrame). */
const RING_Y_WOBBLE_AMP: readonly number[] = [0.0, 0.15, 0.25, 0.35];

/* Node materials — every node is the same cyan hue, varied
 * by emissive intensity per kind. The default
 * MeshStandardMaterial reacts to scene lighting without
 * needing custom shaders. */
const NODE_EMISSIVE_BY_KIND: Record<TopologyNodeKind, number> = {
  system: 0.65,
  phase: 0.50,
  architecture: 0.50,
  project: 0.40,
  lab: 0.35,
  tool: 0.30,
  memory: 0.28,
  telemetry: 0.28,
  evolution: 0.25,
};

/* Edge opacity by verb. Same hue, varying alpha — the
 * "depends_on" verb reads louder than "related_to". */
const EDGE_OPACITY_BY_KIND: Record<TopologyRelationshipKind, number> = {
  depends_on: 0.55,
  evolved_into: 0.65,
  powers: 0.45,
  observes: 0.30,
  introduced: 0.50,
  influences: 0.22,
  related_to: 0.18,
};

const CYAN = "#00d2ff";

interface ThreeRendererProps {
  graph: RenderableTopology;
  /** Optional fixed height for the canvas wrapper. Defaults
   *  to 480px on desktop. The selector can resize via the
   *  className prop. */
  className?: string;
}

interface Positioned3DNode {
  layoutNode: LayoutNode;
  position: [number, number, number];
  radius: number;
}

/* Project the layout's normalised (x, z) ground plane into
 * the 3D scene's world coordinates. Applies the per-ring
 * radius scale + the static Y wobble. */
function place3D(layoutNode: LayoutNode): Positioned3DNode {
  const ring = Math.min(layoutNode.ring, RING_RADIUS_3D.length - 1);
  const radius = RING_RADIUS_3D[ring];
  const elevation = RING_ELEVATION_3D[ring];
  const nodeRadius = NODE_RADIUS_BY_RING[ring];

  /* Derive angle from the layout's (x, z) — `layoutTopology`
   * already placed the node on a unit circle; rescale to the
   * 3D radius. */
  const angle =
    Math.atan2(layoutNode.position.z, layoutNode.position.x) || 0;
  const wobbleAmp = RING_Y_WOBBLE_AMP[ring];
  /* Deterministic wobble: derive from angle so the same
   * node always sits at the same Y offset. */
  const wobbleY = Math.sin(angle * 3) * wobbleAmp;

  return {
    layoutNode,
    position: [
      Math.cos(angle) * radius,
      elevation + wobbleY,
      Math.sin(angle) * radius,
    ],
    radius: nodeRadius,
  };
}

interface NodeMeshProps {
  pn: Positioned3DNode;
  hovered: boolean;
  onHover: (id: string | null) => void;
}

function NodeMesh({ pn, hovered, onHover }: NodeMeshProps) {
  const emissive =
    NODE_EMISSIVE_BY_KIND[pn.layoutNode.node.kind] ?? 0.3;
  /* Hover scale: a subtle (1.0 → 1.25) pop. No useFrame /
   * lerp — the scale is set directly off the hovered prop so
   * frameloop="demand" can collapse to zero idle frames. The
   * change in scale triggers a single re-render via the
   * frame demand. */
  const scale = hovered ? 1.25 : 1.0;
  return (
    <group position={pn.position}>
      <mesh
        scale={[scale, scale, scale]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(pn.layoutNode.node.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[pn.radius, 24, 16]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN}
          emissiveIntensity={hovered ? emissive * 1.4 : emissive}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>
      <Html
        position={[0, pn.radius + 0.18, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            color: hovered
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.65)",
            fontFamily:
              "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {pn.layoutNode.node.label}
        </div>
      </Html>
    </group>
  );
}

interface EdgeLineProps {
  from: [number, number, number];
  to: [number, number, number];
  kind: TopologyRelationshipKind;
}

function EdgeLine({ from, to, kind }: EdgeLineProps) {
  /* Build a buffer geometry once via useMemo — same input
   * means same geometry across re-renders; the scene reuses
   * it without re-allocating. */
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array([...from, ...to]);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [from, to]);

  const opacity = EDGE_OPACITY_BY_KIND[kind] ?? 0.2;

  /* The lineSegments primitive is the bare-metal Three.js
   * line shape — no Line2, no MeshLine, no fattened
   * material. Restraint by construction. */
  return (
    <primitive
      object={
        new THREE.LineSegments(
          geometry,
          new THREE.LineBasicMaterial({
            color: CYAN,
            transparent: true,
            opacity,
          }),
        )
      }
    />
  );
}

function SceneContents({ graph }: { graph: RenderableTopology }) {
  const layout = useMemo(() => layoutTopology(graph), [graph]);
  const placed = useMemo<Positioned3DNode[]>(
    () => layout.nodes.map(place3D),
    [layout],
  );
  const placedById = useMemo(() => {
    const m = new Map<string, [number, number, number]>();
    for (const pn of placed) m.set(pn.layoutNode.node.id, pn.position);
    return m;
  }, [placed]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Lighting — single ambient + single key. Same as
          HeroTopologyScene; restraint preserved. */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 6, 4]} intensity={0.9} color={CYAN} />

      {/* Edges first so nodes layer above them. Each edge
          carries node ids; look up the projected 3D positions
          via the placedById map. Defensive: drop edges whose
          endpoints aren't placed (the registry validator would
          already have caught this, but the renderer stays
          tolerant). */}
      {layout.edges.map((edge) => {
        const fp = placedById.get(edge.fromId);
        const tp = placedById.get(edge.toId);
        if (!fp || !tp) return null;
        return (
          <EdgeLine
            key={edge.id}
            from={fp}
            to={tp}
            kind={edge.kind as TopologyRelationshipKind}
          />
        );
      })}

      {/* Nodes. */}
      {placed.map((pn) => (
        <NodeMesh
          key={pn.layoutNode.node.id}
          pn={pn}
          hovered={hoveredId === pn.layoutNode.node.id}
          onHover={setHoveredId}
        />
      ))}

      {/* OrbitControls — constrained so the camera reads as
          an engineering observer, not a free 3D toy. The
          minPolarAngle / maxPolarAngle prevent flipping
          upside down. */}
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={6}
        maxDistance={14}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function ThreeTopologyRenderer({
  graph,
  className,
}: ThreeRendererProps) {
  return (
    <div
      className={className ?? "w-full h-[480px]"}
      style={{ position: "relative" }}
    >
      <Canvas
        /* `frameloop="demand"` is the load-bearing line —
         * Three.js only renders frames when the scene state
         * changes (OrbitControls movement, hover toggle).
         * Idle CPU is 0% when the visitor is still. */
        frameloop="demand"
        camera={{ position: [0, 5, 9], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <SceneContents graph={graph} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/** The renderer's kind identifier. */
export const THREE_RENDERER_KIND = "three" as const;
