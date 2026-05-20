"use client";

/**
 * HeroTopologyScene — the homepage constellation rendered as a true
 * 3D scene.
 *
 * Architectural lineage
 * ─────────────────────
 * This file mirrors the Cloud Waste Hunter project-page topology
 * (`app/projects/[slug]/_components/AWSTopologyScene.tsx`) on purpose.
 * The CWH topology already solved the spatial / camera / atmosphere
 * problem we need on the hero — it uses three.js + @react-three/fiber
 * + @react-three/drei with an alpha:true canvas and an OrbitControls
 * rig that lets the camera look down at the system from above-back.
 * Same engine, same camera philosophy, same scene composition primitives.
 *
 * What's transplanted from CWH:
 *   - Canvas + camera position [0, _, _] with the same fov 45
 *   - alpha:true so the page background bleeds through (no card)
 *   - Single ambient + single coloured point light
 *   - OrbitControls with constrained polar range so the camera reads
 *     as "cinematic observer" not "free 3D toy"
 *   - Group ref + useFrame autorotate
 *   - Hover-driven scale interpolation per node (lerp via useFrame)
 *   - drei <Html> labels with distanceFactor so labels stay legible
 *     at any zoom
 *
 * What's homepage-specific (preserved identity):
 *   - 24 nodes (1 centre + 5 projects + 6 focus + 12 tech) instead of
 *     CWH's 12 single-ring nodes — the homepage constellation hierarchy
 *   - Per-ring radii + per-ring sphere sizes so the orbits read as
 *     tiered (projects → focus → tech)
 *   - Per-ring Y-axis wobble frequencies + amplitudes so the three
 *     orbits live at different vertical pulses — real spatial life,
 *     not flat coplanar rings
 *   - Edge tier colouring: centre→project bright cyan, project→focus
 *     medium cyan, focus→tech soft blue — same depth hierarchy the
 *     SVG previous version had, ported to lineBasicMaterial
 *   - Label typography matches the existing homepage palette (Geist
 *     + ui-monospace, white opacity descending per ring)
 *
 * Loaded behind a dynamic import (`HeroTopology.tsx`) so the three.js
 * bundle never lands in initial JS — same lazy-load pattern CWH uses
 * on its own route.
 */

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import {
  HERO_EDGES,
  HERO_NODES,
  RING_STYLE,
  type HeroNode as HeroNodeData,
  type RingId,
} from "./hero-topology-data";

const TWO_PI = Math.PI * 2;

/* ── Scene constants ─────────────────────────────────────────────
 *
 * Ring radii in world units. Camera at [0, 4.5, 14] with fov 45 sees
 * the full 3-ring system comfortably, with the outer tech ring (r=7.8)
 * ending well inside the visible frustum at idle zoom. */
const RING_RADIUS_3D: Record<RingId, number> = {
  center: 0,
  projects: 3.6,
  focus: 5.7,
  tech: 7.8,
};

/* Sphere geometry radius per ring. Centre is largest so it reads as
 * the gravitational anchor; each outer ring drops in step. */
const NODE_R_3D: Record<RingId, number> = {
  center: 0.6,
  projects: 0.30,
  focus: 0.22,
  tech: 0.14,
};

/* Y-axis depth wobble. Different wave frequency per ring so the three
 * orbits live at different vertical pulses. This is the single most
 * important spatial cue — without Y variation the rings would read
 * as flat coplanar circles. Amplitudes deliberately small (<0.7) so
 * the topology still reads as concentric, just with real 3D life. */
const Y_WOBBLE_FREQ: Record<RingId, number> = {
  center: 0,
  projects: 3,
  focus: 2,
  tech: 4,
};
const Y_WOBBLE_AMP: Record<RingId, number> = {
  center: 0,
  projects: 0.40,
  focus: 0.60,
  tech: 0.75,
};

/* ── Node placement ──────────────────────────────────────────────
 *
 * Mirrors CWH's placeNodes pattern: polar (angleDeg) → cartesian
 * (x, y, z), with the addition of per-ring Y wobble for depth. */

interface PositionedNode extends HeroNodeData {
  position: [number, number, number];
}

function placeNodes(): PositionedNode[] {
  return HERO_NODES.map((node) => {
    if (node.ring === "center") {
      return { ...node, position: [0, 0.3, 0] };
    }
    const angle = (node.angleDeg / 360) * TWO_PI;
    const r = RING_RADIUS_3D[node.ring];
    const freq = Y_WOBBLE_FREQ[node.ring];
    const amp = Y_WOBBLE_AMP[node.ring];
    const y = Math.sin((node.angleDeg * freq) / 360 * TWO_PI) * amp;
    return {
      ...node,
      position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
    };
  });
}

/* ── Node ─────────────────────────────────────────────────────────
 *
 * One sphere + one drei <Html> label per data node. Hover scale
 * interpolation lifts the node and brightens its emissive — same
 * affordance language as the CWH topology. */

interface NodeProps {
  node: PositionedNode;
  hovered: boolean;
  onHover: (id: string | null) => void;
}

function Node({ node, hovered, onHover }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isCenter = node.ring === "center";
  const color = RING_STYLE[node.ring].fill;
  const sphereR = NODE_R_3D[node.ring];

  /* Smooth lerp toward target scale — same easing CWH uses (0.18
   * factor per frame ≈ 11-frame approach time at 60fps, feels
   * physical, never snaps). */
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

      {/* Label sits below the sphere. drei <Html> projects the HTML
       *  node to the sphere's screen position every frame and scales
       *  it with `distanceFactor`, so labels stay legible at any zoom
       *  without competing with the 3D depth illusion. zIndexRange
       *  keeps labels behind the React UI overlay (tooltip) but in
       *  front of the Canvas. */}
      <Html
        center
        distanceFactor={
          isCenter ? 8 : node.ring === "projects" ? 11 : node.ring === "focus" ? 14 : 18
        }
        position={[0, -(sphereR + 0.45), 0]}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span
          className={`whitespace-nowrap font-mono uppercase tracking-[0.16em] ${
            isCenter
              ? "text-[13px] text-primary"
              : node.ring === "projects"
                ? "text-[11px] text-primary"
                : node.ring === "focus"
                  ? "text-[10px] text-secondary"
                  : "text-[9px] text-tertiary"
          }`}
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}
        >
          {node.label.toUpperCase()}
        </span>
      </Html>
    </group>
  );
}

/* ── Edges ────────────────────────────────────────────────────────
 *
 * Three lineSegments meshes — one per depth tier — so each tier can
 * carry its own colour + opacity without per-vertex colour state.
 * Edge count is tiny (25 total), so three draw calls is negligible. */

interface EdgesProps {
  nodes: PositionedNode[];
}

function makeGeometry(positions: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geo;
}

function Edges({ nodes }: EdgesProps) {
  const lookup = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.position])),
    [nodes],
  );

  const { primary, secondary, tertiary } = useMemo(() => {
    const primary: number[] = [];
    const secondary: number[] = [];
    const tertiary: number[] = [];
    for (const edge of HERO_EDGES) {
      const a = lookup.get(edge.from);
      const b = lookup.get(edge.to);
      if (!a || !b) continue;
      const sourceRing = HERO_NODES.find((n) => n.id === edge.from)?.ring;
      const target =
        edge.from === "emre"
          ? primary
          : sourceRing === "projects"
            ? secondary
            : tertiary;
      target.push(...a, ...b);
    }
    return { primary, secondary, tertiary };
  }, [lookup]);

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

/* ── Rotating scene group ────────────────────────────────────────
 *
 * Wraps every visible 3D element in one group so the autorotate +
 * any future scene-wide transform stay on a single ref. Same
 * pattern CWH uses. */

interface SceneProps {
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  hoveredId: string | null;
}

function Scene({ reducedMotion, onHover, hoveredId }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useMemo(placeNodes, []);

  useFrame(() => {
    if (reducedMotion || !groupRef.current) return;
    /* Slightly slower than CWH (0.001) because we have 24 nodes vs
     * 12 — too fast and the labels become unreadable. 0.0007 rad/frame
     * ≈ one full rotation every 150 seconds at 60fps. */
    groupRef.current.rotation.y += 0.0007;
  });

  return (
    <group ref={groupRef}>
      <Edges nodes={nodes} />
      {nodes.map((node) => (
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
  reducedMotion: boolean;
}

export default function HeroTopologyScene({ reducedMotion }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredNode = useMemo(
    () => HERO_NODES.find((n) => n.id === hoveredId),
    [hoveredId],
  );

  return (
    /* Outer wrapper sets the explicit height the WebGL canvas needs.
     * The Canvas itself is alpha:true so the page background bleeds
     * through — no card, no border, no fixed background. This is the
     * single most important difference vs the previous react-flow
     * implementation: the canvas IS open space, not a panel. */
    <div className="relative w-full h-[560px] sm:h-[640px] lg:h-[720px]">
      <Canvas
        camera={{ position: [0, 4.5, 14], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting: one ambient floor + two coloured point lights
           *  at opposing angles. The cyan key light from the upper
           *  right mirrors CWH; the softer blue rim from the lower
           *  left adds depth separation between the front + back of
           *  the constellation. */}
          <ambientLight intensity={0.45} />
          <pointLight position={[6, 8, 6]} intensity={1.4} color="#00d2ff" />
          <pointLight
            position={[-8, -4, -6]}
            intensity={0.55}
            color="#5db4f5"
          />

          <Scene
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            hoveredId={hoveredId}
          />

          {/* OrbitControls: rotate + zoom only, no pan. Polar range
           *  lets the camera move from ~52° (slight from above, CWH
           *  default posture) to ~116° (slight from below) — exactly
           *  the "top/down AND bottom/up perspective freedom" the
           *  hero topology needs. enableRotate is gated on
           *  reduced-motion so visitors who opt out get a static
           *  composed shot, not an interactive 3D widget. */}
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

      {/* Hover tooltip — plain HTML overlay so it stays sharp at any
       *  zoom and doesn't fight OrbitControls drag. Positioned
       *  bottom-left so it never collides with the centre node. */}
      {hoveredNode && hoveredNode.blurb && (
        <div
          className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-[#00d2ff]/20 bg-black/80 px-3 py-2 text-xs leading-relaxed text-primary shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm pointer-events-none"
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
