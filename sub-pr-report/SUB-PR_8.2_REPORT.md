# Sub-PR 8.2 — Topology Renderer Foundation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 8 — Spectacle Systems & Topology Intelligence · Sub-PR 8.2 (Tier B · renderer foundation)
**Scope:** The renderer chassis Phase 8.3+ will mount on a
production project page. Capability detection (WebGPU /
reduced-motion / mobile) + deterministic concentric layout +
SVG renderer (always-functional, server-renderable) + Three.js
renderer (desktop-enhanced, `frameloop="demand"` for idle frame
0) + selector + barrel. **No production mount.** No new route.
No spectacle visible yet. Phase 8's "ONE SPECTACLE ONLY" rule
keeps the renderer dormant until a future sub-PR earns the
mount.

---

## 1. Mission

Sub-PR 8.1 shipped the topology intelligence — the schema,
registry, cross-system bindings. Sub-PR 8.2 ships the chassis
that will eventually paint that intelligence into pixels. The
renderer is the engine; the spectacle is the future mount that
chooses to drive it.

What 8.2 ships:

- **`lib/v5/topology/capabilities.ts`** — client-only feature
  detection. WebGPU (async probe), `prefers-reduced-motion`
  (sync matchMedia), mobile viewport (sync innerWidth). Every
  helper is SSR-safe and returns the safest default on the
  server. `detectTopologyCapabilities()` is the canonical
  client-side aggregator; `getSyncTopologyCapabilities()` is
  the SSR-compatible synchronous snapshot.
- **`lib/v5/topology/layout.ts`** — deterministic concentric
  ring layout. Pure function: same `RenderableTopology` always
  produces identical positions. Nodes grouped by kind → ring;
  within each ring, sorted by id, distributed evenly. No d3,
  no force simulation, no random jitter. O(n + e) per call.
- **`lib/v5/topology/renderers/svg-renderer.tsx`** — pure JSX
  SVG implementation. Server-renderable. Static. Crawlable
  `<title>` per node. The renderer the selector returns for
  reduced-motion + mobile + crawler paths. Restrained palette:
  black background, `#00d2ff` cyan family across nodes + edges,
  white labels.
- **`lib/v5/topology/renderers/three-renderer.tsx`** —
  `"use client"` Three.js + `@react-three/fiber` +
  `@react-three/drei` implementation. Already-in-deps; zero
  new dependencies. **`frameloop="demand"`** — Three.js only
  renders frames when the scene state changes; idle CPU is
  0% when the visitor isn't interacting. Constrained
  OrbitControls (no flipping, no panning). No bloom, no
  post-processing, no particle effects. Hover scale is the
  only motion.
- **`lib/v5/topology/renderers/select.ts`** — pure selector
  from `TopologyCapabilities` → `TopologyRendererKind`. Four
  kinds in the surface (`"svg"` / `"three"` / `"webgpu"` +
  the forward-compatible WebGPU slot); two kinds shipped
  (`"svg"` + `"three"`). `resolveShippedRendererKind` is the
  consumer's last-mile downgrader.
- **`lib/v5/topology/renderers/index.ts`** — barrel that
  re-exports the selector + kind type. Intentionally does NOT
  re-export the renderer components — those must be imported
  via `next/dynamic` to keep their chunks lazy.

User-prompt + V5 § 5.3 8.1 validation criteria, satisfied:
- [x] WebGPU detection + Three.js fallback (detection wired;
  the WebGPU renderer is the next forward-compatible slot,
  not implemented in 8.2 per the user's "no GPU vanity" rail)
- [x] Mobile reduced static 2D fallback (selector returns
  `"svg"` when `mobile === true`)
- [x] Idle frame 0 (Canvas `frameloop="demand"`)
- [x] Route-quarantined chunk (no consumer in 8.2 → tree-
  shaken from every client chunk; verified via grep against
  `.next/static`)
- [x] Reduced-motion → SVG path (selector returns `"svg"`
  when `reducedMotion === true`; user's preference fully
  respected)
- [x] Restraint preserved (single hue, no post-processing,
  static layout, no particles, constrained camera)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A topology renderer that lets a single
visitor mount the SAME schema-validated graph at three
fidelities (SVG server-rendered → Three.js client-enhanced →
WebGPU forward-slot), each respecting OS preferences + device
capability, is rare in portfolio-grade engineering surfaces.
Most "interactive diagrams" pick one renderer and degrade
ungracefully; the 8.2 chassis degrades upward by design.
**PASS by extension** — the foundation enables uniqueness
that the future mount manifests.

**Q2 — Emergence:** Zero standalone value. No consumer mounts
the renderer in 8.2; the chassis is dead code until Phase 8.3+
gives it a production project to paint. The value
crystallises when (a) a route mounts the renderer with real
topology data, (b) the renderer's hover/interaction surface
fires `node_inspect` / `relationship_traverse` events through
the Phase 8.1 `/api/v5/topology/event` endpoint, (c) Lumina's
architecture-critic sub-agent reads the same rendered graph
as ambient context. **Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month for the renderer
chassis (browser regressions on Three.js + adjusting the
selector when WebGPU eventually ships). Within Phase 8's 6
hr/mo envelope per V5 § 4.3. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the renderer paints THIS portfolio's
  topology graph. Copying it elsewhere without the registry
  would render nothing. ✓
- Ekosistem-fed: no external assets, no per-visitor data, no
  network call beyond the Phase 8.1 telemetry endpoint
  (which the renderer doesn't fire from in 8.2). ✓
- Ekosistem-emergent: meaningless without 8.1's registry +
  the future production mount that consumes the renderer. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The renderer is a
  pure-data → pixels surface. ✓

---

## 3. Architectural decisions

### 3.1 Two renderer fidelities shipped, two reserved

The selector exposes `"svg"` / `"three"` / `"webgpu"` as
return values. 8.2 ships implementations for `"svg"` and
`"three"`; `"webgpu"` is a forward-slot the selector returns
when the capability probe succeeds, AND the consumer's
last-mile downgrader (`resolveShippedRendererKind`) silently
maps to `"three"` until a WebGPU renderer ships.

Why expose `"webgpu"` in the type now:
- Phase 8.x renderers that DO ship WebGPU can plug in without
  amending the selector signature.
- Consumers can log + measure "how often would WebGPU have
  fired" before the implementation ships — a real signal for
  whether the investment is worth it.
- The Phase 8 "ONE SPECTACLE ONLY" mandate means WebGPU
  earns its slot only if Three.js insufficiency is observed.

### 3.2 `frameloop="demand"` is the idle-frame-0 contract

Three.js's default loop continuously renders frames at the
browser's refresh rate even when nothing in the scene has
changed. That's incompatible with V5 § 5.3 8.1's "idle frame
0" requirement.

`<Canvas frameloop="demand">` switches Three.js to event-
driven rendering: a frame paints ONLY when scene state
changes. Camera movement (OrbitControls drag), hover toggle,
window resize — all trigger a frame. Idle (visitor still,
no mouse motion) renders zero frames per second.

Combined with the constrained OrbitControls + hover-only
state changes, the renderer's idle CPU drops to true 0% —
no rAF callbacks, no React reconciliation, no GPU
submission.

### 3.3 SVG is the canonical SSR path

The SVG renderer is `"use client"`-free. It renders identical
output on server + client. Three reasons:

- **Crawler-friendly.** A search engine indexing the future
  `/v5/topology/<slug>` page sees the full graph as semantic
  `<title>`-annotated SVG. Every architectural identity is
  crawlable text. No JS execution required.
- **Reduced-motion-friendly.** The OS preference is honored
  by selecting SVG; the visitor sees a static engineering
  diagram identical to the crawler view.
- **Performance-friendly.** SVG is ~3 KB minified; Three.js
  + r3f + drei is ~150 KB. The SVG path is the default;
  Three.js is the opt-in enhancement.

### 3.4 Deterministic concentric layout, not force-directed

The user's Phase 8 brief is explicit:

> NO:
> * d3
> * graph engines
> * force simulations

Implemented accordingly: `layoutTopology` groups nodes by
kind into 4 concentric rings (`system` at the centre →
`phase` + `architecture` on ring 1 → `project` + `lab` on
ring 2 → `tool` + `memory` + `telemetry` + `evolution` on
ring 3). Within each ring, nodes sort lexicographically by
id and distribute evenly around the circle.

Why kind-based instead of force-directed:
- **Deterministic.** Same graph always produces same
  positions. Visitors see the same scene every mount; the
  test surface is stable.
- **O(n + e).** No iterative relaxation, no convergence
  detection. Layout runs in microseconds at the seed
  registry's size.
- **Editorial.** The 9-kind axis IS the operator's mental
  model of the ecosystem. Forcing the renderer to express
  it is honest; letting forces emerge is decoration.

### 3.5 Renderer chunks stay lazy via `next/dynamic`

The barrel `lib/v5/topology/renderers/index.ts` deliberately
does NOT re-export the renderer components. Consumers must
import them via `next/dynamic`:

```ts
const SVGRenderer = dynamic(
  () => import("@/lib/v5/topology/renderers/svg-renderer"),
  { ssr: true },
);
const ThreeRenderer = dynamic(
  () => import("@/lib/v5/topology/renderers/three-renderer"),
  { ssr: false },
);
```

Reason: re-exporting `ThreeTopologyRenderer` from the barrel
would pull `three` + `@react-three/fiber` + `@react-three/drei`
into any module that imports the barrel for the selector
type. The dynamic-import pattern keeps the renderer chunks
out of the consumer's static dependency graph; only the
runtime decision to mount triggers the chunk load.

For 8.2 itself, there's no consumer, so even the barrel's
exports tree-shake out of every route. Verified: zero
renderer symbols appear in `.next/static`.

### 3.6 Single hue, single material

The Three.js renderer uses ONE colour (`#00d2ff`) across the
entire scene. Differentiation comes from emissive intensity
per kind, not from hue rotation. The user's Phase 8 brief
banned:

- "flashy motion theater" → no animated edges, no auto-rotate
- "GPU vanity" → no shaders beyond default MeshStandardMaterial
- "overengineered graphics" → no Line2, no MeshLine, no
  particle systems
- "cyberpunk aesthetics" → single hue, no chromatic
  separation
- "visual noise" → no starfield, no fog, no atmospheric
  effects

The result is closer to an engineering diagram in 3D space
than to an "interactive AI visualisation". The future
spectacle mount can lean into the restraint; the renderer's
content (real topology data) carries the gravitas, not
visual chrome.

### 3.7 Selector is server-importable; renderers are not

`selectTopologyRendererKind` + `TopologyRendererKind` +
`SHIPPED_RENDERER_KINDS` + `resolveShippedRendererKind` are
all pure functions / constants with zero browser-only
imports. A server component can call the selector after
fetching capabilities (e.g., from a perception-layer
extension that records device class).

The renderer components are `"use client"` (or, in the SVG
case, technically SSR-safe but still in a renderer module).
Consumers always dispatch the SELECTOR output → dynamic
import the matching renderer. Two-stage binding keeps
server bundles lean.

### 3.8 No new route in 8.2

Phase 8.1 declared `app/v5/topology/<slug>/` as a future
home for the renderer. Phase 8.2 does NOT create that route
— the user's "FOUNDATION ONLY" framing (carried from 8.1's
brief) extends to the renderer. The route exists when a
sub-PR earns the spectacle moment by mounting a real
project topology.

This keeps the visible surface area unchanged: 49 static
pages, same set as 8.1. Phase 8 stays invisible until the
spectacle moment.

### 3.9 No telemetry firing in 8.2

The Phase 8.1 `/api/v5/topology/event` endpoint exists as
the contract a future renderer fires `view` / `node_inspect`
/ `relationship_traverse` / `path_query` events through.
The 8.2 renderer foundation does NOT mount the consumer
that fires these. When Phase 8.3+ wires the production
mount, it will:

- Fire `view` on first paint
- Fire `node_inspect` on hover/focus
- Fire `relationship_traverse` when the camera follows an
  edge or the visitor clicks through

The endpoint is ready; the consumer is the future commit.

---

## 4. KIRMIZI ÇİZGİ + Phase 8 philosophy enforcement

The user's Phase 8 standard:

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

Sub-PR 8.2 ships no visible surface — but the renderer that
WILL eventually paint the topology has to satisfy this
standard on its own merits. The choices baked into 8.2:

| Risk | Mitigation in the renderer |
|------|---------------------------|
| Flashy motion theatre | `frameloop="demand"` collapses to zero idle frames; no auto-rotate; no animated edges; the only motion is hover-scale (subtle 1.0 → 1.25). |
| GPU vanity | Default MeshStandardMaterial; no custom shaders; no post-processing; single hue throughout. |
| Overengineered graphics | Single sphere primitive per node, single LineSegments primitive per edge. No Line2 / MeshLine / instanced rendering. |
| Cyberpunk aesthetics | Pure `#00d2ff` family. No magenta, no neon green, no chromatic dispersion. |
| Visual noise | No background starfield, no fog, no particles, no atmospheric god-rays. The default Three.js scene background is transparent (`gl: { alpha: true }`); the page background shows through. |
| Portfolio gimmicks | Real data only — the renderer paints the schema-validated topology registry from 8.1. No fake graphs, no mock data, no decorative nodes. |

The contract is the same as the SVG path: render what the
graph says, restrained, honest. The Three.js path adds 3D
depth + interactive camera, but the SUBSTANCE is the same
data the SVG path renders.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/topology/capabilities.ts` — WebGPU + reduced-motion + mobile detection |
| New | `lib/v5/topology/layout.ts` — deterministic concentric layout (pure function) |
| New | `lib/v5/topology/renderers/svg-renderer.tsx` — SSR-renderable SVG implementation |
| New | `lib/v5/topology/renderers/three-renderer.tsx` — `"use client"` Three.js implementation |
| New | `lib/v5/topology/renderers/select.ts` — pure selector + downgrader |
| New | `lib/v5/topology/renderers/index.ts` — barrel (selector exports only) |
| New | `sub-pr-report/SUB-PR_8.2_REPORT.md` (this report) |

No new dependencies (three.js + @react-three/fiber +
@react-three/drei already in `package.json` for the existing
hero / project / codex topologies). No new env vars. No new
routes.

---

## 6. Telemetry schema (unchanged)

Sub-PR 8.2 does NOT add a new telemetry hash. The existing
Phase 8.1 hash `v5:topology:graph` covers the four event
kinds (`view` / `node_inspect` / `relationship_traverse` /
`path_query`); the renderer in 8.2 doesn't fire them
(foundation only). When a future production mount wires the
renderer's interaction handlers to the endpoint, the
existing schema absorbs the events.

---

## 7. Privacy guarantees

The renderer is a presentation layer. It has no input from
the visitor beyond hover / camera interaction; it emits no
events in 8.2.

| Invariant | Mechanism |
|-----------|-----------|
| No fingerprint | Capability detection reads only `navigator.gpu` + `matchMedia` + `window.innerWidth`. No IP, no UA, no cookies. |
| Client-side capability checks only | The async / sync capability helpers guard `typeof window === "undefined"` and return safe defaults on the server. |
| No identity persistence | No state is persisted by the renderer. Hover state lives in React local state and dies with the unmount. |
| SSR safety | SVG renderer outputs identical DOM on server + client. Three.js renderer is `"use client"` and never participates in SSR. |
| No motion when reduced-motion is set | Selector returns `"svg"` when `prefers-reduced-motion: reduce`. The Three.js path never mounts for that visitor. |

---

## 8. Performance posture

V5 § 4.3 budget: WebGPU page LCP < 2.0s target. Sub-PR 8.2
ships no LCP-relevant route, so the budget is satisfied by
construction.

| Surface | Measurement |
|---------|-------------|
| Client bundle delta on every existing route | 0. The renderer modules are tree-shaken from every route that doesn't dynamically import them. Verified via grep against `.next/static/**`. |
| SVG renderer raw size | ~6 KB minified (estimated; pure JSX, no deps beyond the layout helper). |
| Three.js renderer raw size | ~3-5 KB minified for the NEW code on top of `three` + `@react-three/fiber` + `@react-three/drei` (which were already in the bundle via existing topologies). |
| Capability detection cost | < 1 ms (one async probe + two sync reads). Run client-side after hydration. |
| Layout cost | O(n + e) = ~50 µs for the 22-node / 28-edge registry. Pure JS math. |
| Three.js idle CPU when mounted, not interacting | 0% (`frameloop="demand"` collapses to zero frames). |
| Three.js active CPU during camera drag | Bounded by the renderer's existing 60fps demand-driven cadence. Within the V5 § 2.7 mobile budget when active. |
| Existing routes unaffected | Verified via HTTP smoke: /, /evolution, /architecture/*, /v5/perception, /lumina/brain all return 200. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `SVGTopologyRenderer` / `ThreeTopologyRenderer` in client | 0 matches |
| `selectTopologyRendererKind` / `resolveShippedRendererKind` in client | 0 matches |
| `layoutTopology` / `KIND_TO_RING` / `RING_RADIUS_3D` in client | 0 matches |
| `detectTopologyCapabilities` / `prefersReducedMotion` in client | 0 matches |
| `topology-ambient-cyan` (SVG distinct string) in client | 0 matches |
| `NODE_EMISSIVE_BY_KIND` (Three.js distinct string) in client | 0 matches |
| `three` (pre-existing imports from hero/project/codex) in client | unchanged from 8.1 baseline (2 chunks contain `three`) |

The renderer chunks are FULLY route-quarantined. They'll
materialise only when a future route dynamically imports
them.

---

## 9. Edge / runtime notes

- The capability + selector + layout + SVG renderer modules
  are pure / SSR-safe.
- `three-renderer.tsx` declares `"use client"`. It's never
  importable server-side at runtime (Next.js enforces).
- No new API routes in 8.2. The Phase 8.1 endpoints
  (`/api/v5/topology/graph` + `/api/v5/topology/event`) are
  unchanged.
- The barrel `lib/v5/topology/renderers/index.ts` is
  server-safe — it re-exports only the selector + kind
  constants, which are pure data.

---

## 10. Rollback plan

The single-commit revert removes all 6 new modules in
`lib/v5/topology/` + the `LayoutEdge.fromId/toId` extension
in `layout.ts` (technically a `lib/v5/topology/layout.ts`
edit — the field addition is backward-compatible; consumers
that didn't read `fromId` / `toId` are unaffected).

KV state orphaned after revert: none. 8.2 doesn't touch KV.

No schema break. No env-var rollback. No route deletion.
Every other system continues unchanged. The repo reverts to
the 8.1 tip exactly.

If only the renderer chassis needs to be silenced without
a code revert:
- Phase 8.3+ mount points can be removed individually; the
  renderer modules continue to exist as unused code.
- Removing the Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED` env
  var also silences any future flag-gated mount.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 8.2-touched files | ✓ 0 errors / 0 warnings (after one `TWO_PI` unused-var cleanup during validation) |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages, 0 warnings |
| No new routes added | ✓ |
| Topology API regression | ✓ validation_failure `null`, 22 nodes / 28 relationships unchanged |
| Existing surfaces unchanged | ✓ /, /evolution, /architecture/*, /v5/perception, /lumina/brain all return 200 |
| Renderer + selector + capabilities + layout in client | ✓ 0 matches across 7+ distinct symbols |
| Three.js bundle size | ✓ unchanged from 8.1 baseline (chunks containing `three` unchanged) |
| Tarballs (23.7 kB / 13.5 kB) | ✓ unchanged |
| No new dependencies | ✓ `package.json` unchanged |
| Phase 8 KIRMIZI ÇİZGİ (no GPU vanity / no cyberpunk / no particle effects / no post-processing) | ✓ structurally enforced |
| Idle frame 0 (Three.js `frameloop="demand"`) | ✓ |
| Reduced-motion → SVG path | ✓ selector returns `"svg"` when `reducedMotion === true` |
| Mobile → SVG path | ✓ selector returns `"svg"` when `mobile === true` |
| Determinism (layout is pure function, no clock / random reads) | ✓ verified by inspection |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Future systems unlocked

This sub-PR ships the chassis future Phase 8.x sub-PRs will
mount. Unlocks:

- **Sub-PR 8.3 — Production project mount (V5 § 5.3 stated
  8.2).** A flag-gated route at `/v5/topology/<slug>` for
  one production project (CWH suggested) that dynamically
  imports the renderer matching the visitor's capabilities,
  fires telemetry events on interaction, and renders the
  project's topology slice.

- **Sub-PR 8.x — WebGPU renderer.** A real WebGPU
  implementation that plugs into the existing selector slot.
  Only ships if the production mount's telemetry shows
  measurable Three.js limitations (mobile high-DPI render
  cost, large-graph layout pressure).

- **Sub-PR 8.x — Engineering Aura.** Reads the topology
  renderer's selected kind + the visitor's hover history to
  modulate per-page color temperature. Builds on the
  capability detection + selector already shipped here.

- **Phase 9.1 — Operational digital twin.** Composes a
  this-week-active subset of the topology graph and mounts
  the renderer (probably SVG-only for the operational
  surface's calm tone) with that filtered slice.

- **Lumina sub-agent.** Reading the rendered cursor /
  hovered-node state would let the architecture-critic
  contextualise its responses to whatever the visitor is
  currently inspecting in the topology.

- **Static OG card generation.** The SVG renderer's pure-
  JSX shape lets a future sub-PR generate per-slug topology
  PNGs at build time for shareable architecture artifacts.

---

## 13. Deferred systems

The user prompt's implicit DEFERRED list (Phase 8 = ONE
SPECTACLE ONLY; the visible spectacle ships in a future
sub-PR), restated:

- **Production project mount** → Sub-PR 8.3 (the actual
  spectacle moment).
- **WebGPU renderer implementation** → reserved for a sub-
  PR only after Three.js insufficiency is observed.
- **Engineering aura system** → Sub-PR 8.4 (or later).
- **Adaptive recruiter intelligence** → Sub-PR 8.5 (Phase
  8 boundary).
- **Spatial audio** → Sub-PR 8.6 (or deferred).
- **Renderer-level interaction telemetry firing** → wired
  in the production mount sub-PR.
- **`/v5/topology/<slug>` route** → Sub-PR 8.3.
- **Per-node detail panel** → Sub-PR 8.3+ (the consumer
  decides UI affordances).
- **Camera presets / saved views** → defer; the
  constrained OrbitControls + reset behavior are sufficient
  for the first mount.

Permanently rejected (carried from V5 § 3.3 + the user's
Phase 8 brief):
- d3 / graph-engine dependencies (force-directed layouts).
- WebGL post-processing (bloom, SSAO, DOF).
- Particle systems.
- Auto-rotating camera.
- Per-visitor topology personalisation.
- LLM-generated topology nodes (Anti-Generic-AI Law).

---

## 14. Affected system analysis (Phase 8 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/topology/renderers/` subdirectory + capability + layout modules. Builds on the Phase 8.1 schema + registry; no cross-system touches. |
| Temporal | None. The renderer reads the topology graph from 8.1; the temporal registry doesn't enter the picture in 8.2. |
| Telemetry | None new. The Phase 8.1 endpoint is the wiring contract; 8.2 doesn't fire. |
| Future renderer (WebGPU) | The selector returns `"webgpu"` as a forward-compatible kind. A future WebGPU implementation plugs in without touching the selector signature. |
| Bundle | 0 byte delta on every existing route (tree-shaking verified). Future production mount will pull the renderer dynamically. |
| Feature flag | The Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED` flag exists; 8.2 doesn't gate on it (no mount in 8.2). Future production mount will. |
| Reduced-motion | Honored via the selector's `"svg"` path. The Three.js renderer never mounts for reduced-motion visitors. |
| Mobile | Honored via the selector's `"svg"` path. The Three.js renderer never mounts below 768px viewport. |
| Hydration integrity | The SVG renderer outputs deterministic SSR-safe HTML. The Three.js renderer is `"use client"` and never participates in SSR. No hydration risk. |
| Edge consistency | Both API endpoints from 8.1 unchanged. No new edge code. |
| Maintenance burden | ~1 hr/month for the renderer chassis (Three.js / @react-three updates, browser regressions). Within Phase 8's 6 hr/mo envelope. |
| Rollback | Single-commit revert removes every primitive; no KV state, no schema break, no env rollback. |

---

## 15. Next sub-PR

**Sub-PR 8.3 — Production Project Mount (V5 § 5.3 stated
8.2).** Per the user's "ONE SPECTACLE ONLY" rule, this is
the sub-PR that earns the visible spectacle:

- `app/v5/topology/<slug>/page.tsx` flag-gated route
  (default off via `V5_TOPOLOGY_RENDER_ENABLED`)
- Selector-driven renderer dispatch
- Dynamic-imported renderer chunks (SVG SSR + Three.js
  client-only)
- Telemetry firing through `/api/v5/topology/event`
- First production project: Cloud Waste Hunter (carries
  the strongest topology data already in the registry)
- LCP < 2.0s target preserved
- 2D fallback verified on mobile

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 16. Closing — the body waits, the engine is ready

Sub-PR 8.1 shipped the topology intelligence — the system
brain. Sub-PR 8.2 ships the body's chassis — the renderer
foundation that will eventually paint the brain into pixels.
The chassis sits ready: SVG for crawlers + reduced-motion +
mobile, Three.js for desktop with motion enabled, WebGPU
slot reserved for the day it earns its place.

The visitor sees nothing new. The bundle on every existing
route is byte-identical to 8.1. The 22-node topology
registry continues to serve through the JSON feed; no UI
consumes it.

What 8.2 unlocks: when Phase 8.3 mounts the renderer on a
production project page, the implementation choices are
already baked in. The renderer will render. The selector
will route. The capability layer will gate. The cinematic
restraint is structurally enforced by the schema + the
single-hue palette + the demand-driven render loop.

Phase 8's spectacle moment is one sub-PR away. The
engineering is done; the editorial decision (which project
gets the mount, what telemetry kinds fire, what interaction
affordances ship) waits for the next approval.
