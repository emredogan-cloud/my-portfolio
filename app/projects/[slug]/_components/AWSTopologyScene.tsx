"use client";

/**
 * 3D rendering of the Cloud Waste Hunter production topology.
 *
 * Lives behind a dynamic import (no SSR) — none of three / r3f / drei
 * lands in any other route's bundle. Mounted only on
 * /projects/aws-waste-hunter via AWSTopologyClient.
 *
 * Performance posture:
 *   - 12 spheres + ~10 thin tube edges + 12 HTML labels via drei <Html>.
 *   - Single ambient + single point light. No shadows.
 *   - Autorotate driven by useFrame at ~0.001 rad/frame. Stops cold
 *     under prefers-reduced-motion.
 *   - dpr capped at 2 so retina screens don't oversample needlessly.
 *
 * Interactivity:
 *   - OrbitControls (drei) for desktop rotate + zoom.
 *   - Hovering a node lifts its emissive and surfaces a small tooltip
 *     with the node's blurb (sourced from topology-data.ts).
 */

import { Suspense, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import {
  NODE_COLOR,
  RING_RADIUS,
  TOPOLOGY_EDGES,
  TOPOLOGY_NODES,
  type TopologyNode,
} from "./topology-data";

const TWO_PI = Math.PI * 2;

interface PositionedNode extends TopologyNode {
  position: [number, number, number];
}

function placeNodes(): PositionedNode[] {
  return TOPOLOGY_NODES.map((node) => {
    if (node.id === "cwh") {
      return { ...node, position: [0, 0.4, 0] as [number, number, number] };
    }
    const angle = (node.angleDeg / 360) * TWO_PI;
    return {
      ...node,
      position: [
        Math.cos(angle) * RING_RADIUS,
        Math.sin((node.angleDeg * 3) / 360 * TWO_PI) * 0.35,
        Math.sin(angle) * RING_RADIUS,
      ] as [number, number, number],
    };
  });
}

/* ── Node ───────────────────────────────────────────────────────── */

interface NodeProps {
  node: PositionedNode;
  hovered: boolean;
  onHover: (id: string | null) => void;
}

function Node({ node, hovered, onHover }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isCenter = node.id === "cwh";
  const baseScale = isCenter ? 1.0 : 0.55;
  const color = NODE_COLOR[node.category];

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? baseScale * 1.18 : baseScale;
    const s = meshRef.current.scale.x;
    const next = s + (target - s) * 0.18;
    meshRef.current.scale.setScalar(next);
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        scale={baseScale}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.85 : 0.45}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>

      <Html
        center
        distanceFactor={10}
        position={[0, isCenter ? -0.9 : -0.7, 0]}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span
          className={`whitespace-nowrap font-mono uppercase tracking-[0.16em] text-[10px] ${
            isCenter ? "text-primary" : "text-secondary"
          }`}
        >
          {node.label}
        </span>
      </Html>
    </group>
  );
}

/* ── Edges ──────────────────────────────────────────────────────── */

interface EdgesProps {
  nodes: PositionedNode[];
}

function Edges({ nodes }: EdgesProps) {
  const lookup = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.position])),
    [nodes],
  );

  const segments = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (const { from, to } of TOPOLOGY_EDGES) {
      const a = lookup.get(from);
      const b = lookup.get(to);
      if (!a || !b) continue;
      positions.push(...a, ...b);
    }
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geo;
  }, [lookup]);

  return (
    <lineSegments geometry={segments}>
      <lineBasicMaterial
        color="#00d2ff"
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ── Rotating group ─────────────────────────────────────────────── */

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
    groupRef.current.rotation.y += 0.001;
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

/* ── Public ─────────────────────────────────────────────────────── */

interface Props {
  reducedMotion: boolean;
}

export default function AWSTopologyScene({ reducedMotion }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredNode = useMemo(
    () => TOPOLOGY_NODES.find((n) => n.id === hoveredId),
    [hoveredId],
  );

  return (
    <div className="relative h-[480px] sm:h-[560px] w-full">
      <Canvas
        camera={{ position: [0, 4, 9], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[6, 8, 6]} intensity={1.2} color="#00d2ff" />
          <Scene
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            hoveredId={hoveredId}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={!reducedMotion}
            enableRotate={!reducedMotion}
            minDistance={6}
            maxDistance={14}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>

      {/* Hover tooltip — plain HTML, positioned bottom-left so it never
          fights with OrbitControls drag. */}
      {hoveredNode && (
        <div
          className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-[#00d2ff]/20 bg-black/80 px-3 py-2 text-xs leading-relaxed text-primary shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
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
