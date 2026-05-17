"use client";

/**
 * CodexTopologyScene — narrative constellation, three-ring variant.
 *
 * Lineage
 * ───────
 * This is the same three.js / r3f / drei engine as
 * `components/home/HeroTopologyScene.tsx` and
 * `app/projects/[slug]/_components/AWSTopologyScene.tsx` — transplanted
 * verbatim, with one substantive shift: the node payload is sourced
 * from `data/codex.ts` per book, so each book carries its own
 * narrative graph (houses, civilisations, cathedral cities, creatures,
 * relics) but reads with the same camera language as every other
 * topology on the site.
 *
 * What's preserved (cinematic identity):
 *   - alpha:true Canvas — page background bleeds through, no card
 *   - OrbitControls polar range that lets the camera look from above-back
 *     down to slightly-below-front (the "cinematic observer" range)
 *   - single ambient + two coloured point lights, no shadows
 *   - per-node hover lerp via useFrame
 *   - Y-axis wobble per ring so the orbits live at different vertical
 *     pulses, never as flat coplanar circles
 *   - drei <Html> labels with per-ring distanceFactor
 *   - cyan #00d2ff stays the only accent across every book
 *
 * What's homepage-distinct vs CWH:
 *   - 4 rings (center / primary / secondary / tertiary) instead of
 *     CWH's 2 (center + one ring), to fit narrative density
 *   - per-ring radii and sphere sizes tier the orbits visually
 */

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { CodexNode, CodexEdge, CodexRing } from "@/data/codex";

const TWO_PI = Math.PI * 2;

/* ── Per-ring geometry. Same tuning posture as HeroTopologyScene
 *  — slightly larger because Codex topologies often have 23-24 nodes. */
const RING_RADIUS: Record<CodexRing, number> = {
  center: 0,
  primary: 3.4,
  secondary: 5.6,
  tertiary: 7.8,
};

const NODE_R: Record<CodexRing, number> = {
  center: 0.62,
  primary: 0.30,
  secondary: 0.22,
  tertiary: 0.14,
};

const Y_WOBBLE_FREQ: Record<CodexRing, number> = {
  center: 0,
  primary: 3,
  secondary: 2,
  tertiary: 4,
};
const Y_WOBBLE_AMP: Record<CodexRing, number> = {
  center: 0,
  primary: 0.40,
  secondary: 0.60,
  tertiary: 0.75,
};

/* ── Cyan-leaning fills per ring. The single non-cyan accent on
 *  the whole site is the page background tint each book layers
 *  BEHIND this canvas — never inside it. */
const RING_FILL: Record<CodexRing, string> = {
  center: "#ffffff",
  primary: "#00d2ff",
  secondary: "#5db4f5",
  tertiary: "#aee5ff",
};

/* ── Node placement (polar → cartesian, with Y wobble) ────────── */

interface PositionedNode extends CodexNode {
  position: [number, number, number];
}

function placeNodes(nodes: readonly CodexNode[]): PositionedNode[] {
  return nodes.map((node) => {
    if (node.ring === "center") {
      return { ...node, position: [0, 0.3, 0] };
    }
    const angle = (node.angleDeg / 360) * TWO_PI;
    const r = RING_RADIUS[node.ring];
    const freq = Y_WOBBLE_FREQ[node.ring];
    const amp = Y_WOBBLE_AMP[node.ring];
    const y = Math.sin((node.angleDeg * freq) / 360 * TWO_PI) * amp;
    return {
      ...node,
      position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
    };
  });
}

/* ── Node ─────────────────────────────────────────────────────── */

interface NodeProps {
  node: PositionedNode;
  hovered: boolean;
  onHover: (id: string | null) => void;
}

function Node({ node, hovered, onHover }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isCenter = node.ring === "center";
  const color = RING_FILL[node.ring];
  const sphereR = NODE_R[node.ring];

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.25 : 1.0;
    const current = meshRef.current.scale.x;
    const next = current + (target - current) * 0.18;
    meshRef.current.scale.setScalar(next);
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          if (typeof document !== "undefined") {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          if (typeof document !== "undefined") {
            document.body.style.cursor = "auto";
          }
        }}
      >
        <sphereGeometry args={[sphereR, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCenter ? 1.0 : hovered ? 0.85 : 0.5}
          metalness={0.15}
          roughness={0.32}
        />
      </mesh>

      <Html
        center
        distanceFactor={
          isCenter
            ? 8
            : node.ring === "primary"
              ? 11
              : node.ring === "secondary"
                ? 14
                : 18
        }
        position={[0, -(sphereR + 0.45), 0]}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span
          className={`whitespace-nowrap font-mono uppercase tracking-[0.16em] ${
            isCenter
              ? "text-[13px] text-white"
              : node.ring === "primary"
                ? "text-[11px] text-white/90"
                : node.ring === "secondary"
                  ? "text-[10px] text-white/65"
                  : "text-[9px] text-white/45"
          }`}
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}
        >
          {node.label.toUpperCase()}
        </span>
      </Html>
    </group>
  );
}

/* ── Edges ────────────────────────────────────────────────────── */

interface EdgesProps {
  nodes: PositionedNode[];
  edges: readonly CodexEdge[];
  centerId: string;
  nodeRingById: Map<string, CodexRing>;
}

function makeGeometry(positions: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geo;
}

function Edges({ nodes, edges, centerId, nodeRingById }: EdgesProps) {
  const lookup = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.position])),
    [nodes],
  );

  const { primary, secondary, tertiary } = useMemo(() => {
    const primary: number[] = [];
    const secondary: number[] = [];
    const tertiary: number[] = [];
    for (const edge of edges) {
      const a = lookup.get(edge.from);
      const b = lookup.get(edge.to);
      if (!a || !b) continue;
      const sourceRing = nodeRingById.get(edge.from);
      const target =
        edge.from === centerId
          ? primary
          : sourceRing === "primary"
            ? secondary
            : tertiary;
      target.push(...a, ...b);
    }
    return { primary, secondary, tertiary };
  }, [edges, lookup, centerId, nodeRingById]);

  const primaryGeo = useMemo(() => makeGeometry(primary), [primary]);
  const secondaryGeo = useMemo(() => makeGeometry(secondary), [secondary]);
  const tertiaryGeo = useMemo(() => makeGeometry(tertiary), [tertiary]);

  return (
    <>
      <lineSegments geometry={primaryGeo}>
        <lineBasicMaterial
          color="#00d2ff"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={secondaryGeo}>
        <lineBasicMaterial
          color="#00d2ff"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={tertiaryGeo}>
        <lineBasicMaterial
          color="#5db4f5"
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
}

/* ── Rotating scene group ─────────────────────────────────────── */

interface SceneProps {
  nodes: readonly CodexNode[];
  edges: readonly CodexEdge[];
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  hoveredId: string | null;
}

function Scene({ nodes, edges, reducedMotion, onHover, hoveredId }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const positioned = useMemo(() => placeNodes(nodes), [nodes]);
  const nodeRingById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.ring])),
    [nodes],
  );
  const centerId = useMemo(
    () => nodes.find((n) => n.ring === "center")?.id ?? "",
    [nodes],
  );

  useFrame(() => {
    if (reducedMotion || !groupRef.current) return;
    /* Slightly slower than CWH (0.001) because narrative topologies
     * carry more labels — too fast and the eye can't catch them.
     * 0.0007 rad/frame ≈ one full rotation every 150 seconds at 60fps. */
    groupRef.current.rotation.y += 0.0007;
  });

  return (
    <group ref={groupRef}>
      <Edges
        nodes={positioned}
        edges={edges}
        centerId={centerId}
        nodeRingById={nodeRingById}
      />
      {positioned.map((node) => (
        <Node
          key={node.id}
          node={node}
          hovered={node.id === hoveredId}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

/* ── Public ──────────────────────────────────────────────────── */

interface Props {
  nodes: readonly CodexNode[];
  edges: readonly CodexEdge[];
  reducedMotion: boolean;
}

export default function CodexTopologyScene({
  nodes,
  edges,
  reducedMotion,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredNode = useMemo(
    () => nodes.find((n) => n.id === hoveredId),
    [hoveredId, nodes],
  );

  return (
    <div className="relative w-full h-[560px] sm:h-[640px] lg:h-[720px]">
      <Canvas
        camera={{ position: [0, 4.5, 14], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.45} />
          <pointLight position={[6, 8, 6]} intensity={1.4} color="#00d2ff" />
          <pointLight
            position={[-8, -4, -6]}
            intensity={0.55}
            color="#5db4f5"
          />

          <Scene
            nodes={nodes}
            edges={edges}
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            hoveredId={hoveredId}
          />

          <OrbitControls
            enablePan={false}
            enableZoom={!reducedMotion}
            enableRotate={!reducedMotion}
            minDistance={10}
            maxDistance={22}
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 1.55}
          />
        </Suspense>
      </Canvas>

      {hoveredNode && hoveredNode.blurb && (
        <div
          className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-[#00d2ff]/20 bg-black/80 px-3 py-2 text-xs leading-relaxed text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff] mb-1">
            {hoveredNode.label}
          </div>
          {hoveredNode.blurb}
        </div>
      )}
    </div>
  );
}
