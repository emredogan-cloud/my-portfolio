# Sub-PR 8.1 — Topology Intelligence Foundation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 8 — Spectacle Systems & Topology Intelligence · Sub-PR 8.1 (Tier B · foundation)
**Scope:** The SYSTEM BRAIN, not the visual body. Topology
schema + node/relationship primitives + typed registry + initial
graph data + cross-system bindings (temporal + perception link
helpers) + safe render abstraction + feature-flag boundary +
topology telemetry hash + two edge endpoints. **No renderer.**
No WebGL. No canvas. No client rendering. The intelligence
layer Phase 8.2+ renderers will read from.

---

## 0. Phase 8 begins (deliberately invisible)

V5 § 4.3 frames Phase 8 as "ONE spectacle, route-isolated".
The visible spectacle is Phase 8.2-8.5's territory. Sub-PR 8.1
is the foundation pass — the user's brief overrides the V5
doc's § 5.3 8.1 ("renderer foundation") with a system-brain
mandate:

> NO renderer.
> NO WebGL.
> NO canvas.
> NO particle systems.
> NO cinematic transitions.
> NO GPU work.
> NO visible spectacle yet.

The visitor sees no change after 8.1 lands. The chassis is
internal; the first observable Phase 8 surface lands in a
later sub-PR once the cognition layer is stable.

---

## 1. Mission

Build the engineering-cognition primitives that let the
ecosystem describe its own architecture declaratively, with
strict typing + cross-system bindings the future renderer
will read.

What 8.1 ships:

- **`lib/v5/topology/schema.ts`** — 9 closed node kinds, 7
  closed relationship verbs, `TopologyNode` / `TopologyRelationship`
  / `TopologyGraph` shapes, type guards + runtime validators
  + whole-graph integrity check.
- **`lib/v5/topology/registry.ts`** — pure accessors over the
  static graph. By id, by kind, neighbor traversal,
  one-pass summariser, validation-failure surface.
- **`data/topology/graph.ts`** — 22 nodes + 28 relationships
  describing the real ecosystem: portfolio / lumina / lab /
  playground / evolution-surface as systems; 3 phases; 3
  projects; 3 architectures (aws-topology-3d,
  scrollstory-engine, temporal-playback); 3 lab experiments;
  2 memory subsystems; 3 telemetry subsystems. Every verb in
  the schema's closed allow-list is exercised at least once.
- **`lib/v5/topology/temporal-link.ts`** — cross-system
  binding to the Phase 7 temporal registry. Resolves a node's
  `evolution_event_ids` into full events; reverses the
  lookup; surfaces unlinked events + stale references for
  operator audit.
- **`lib/v5/topology/perception-link.ts`** — cross-system
  binding to the Phase 6 perception layer. Resolves a node's
  `perception_categories` into the closed allow-list;
  reverses the lookup; surfaces unlinked categories.
- **`lib/v5/topology/render-abstraction.ts`** — the contract
  a future Phase 8.2+ renderer will satisfy.
  `RenderableNode` / `RenderableEdge` / `RenderableTopology`
  + `TopologyRenderer` interface + `toRenderable(graph)`
  mapper. No DOM, no Three.js, no canvas. The interface only.
- **`lib/v5/topology/flags.ts`** — `V5_TOPOLOGY_RENDER_ENABLED`
  env var + `isTopologyRenderEnabled()` check. Default off.
  Future renderers gate on this.
- **`lib/v5/topology/telemetry.ts`** — `v5:topology:graph`
  KV hash with 4 event kinds (view / node_inspect /
  relationship_traverse / path_query). Record + read helpers.
- **`app/api/v5/topology/graph/route.ts`** — edge GET JSON
  feed. Returns `{ summary, temporal_link_summary,
  perception_link_summary, validation_failure, graph }`.
  Filterable by `?node_kind=` + `?relationship_kind=`.
- **`app/api/v5/topology/event/route.ts`** — edge POST event
  endpoint. 4-kind allow-list. 204-only. Sibling to the
  Phase 7 endpoints.

User-prompt validation criteria, satisfied:
- [x] Topology domain schema (9 kinds, 7 verbs, validators)
- [x] Node/relationship primitives (typed, composable)
- [x] Typed topology registry (22 nodes seeded)
- [x] Topology event linkage (evolution_event_ids on nodes)
- [x] Temporal integration hooks (temporal-link helpers)
- [x] Perception integration hooks (perception-link helpers)
- [x] Safe rendering abstraction (RenderableTopology +
  TopologyRenderer interface, NO renderer impl)
- [x] Feature-flag boundaries (`V5_TOPOLOGY_RENDER_ENABLED`)
- [x] Topology telemetry foundation (`v5:topology:graph` hash
  + edge POST endpoint)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A self-described engineering-cognition
graph that cross-binds an ecosystem's temporal registry +
perception layer in a strictly-typed, schema-validated form
is rare. Portfolio sites typically ship architecture diagrams
as static SVG; this layer is the data infrastructure beneath
*living* topology surfaces Phase 8.2+ will render. **PASS by
extension** — the foundation enables uniqueness it doesn't
yet manifest.

**Q2 — Emergence:** Zero standalone value. The graph is
inert without a consumer. The value crystallises when (a)
the Phase 8.2 renderer reads `toRenderable(graph)` to paint a
3D constellation, (b) Lumina's `architecture-critic`
sub-agent reads the registry as ambient context, (c) the
Phase 9 operational-twin surface composes from the topology
+ temporal + perception graphs. **Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month for the registry itself
(append-only edits when new architectural moments warrant a
node). Within Phase 8's 6 hr/mo envelope per V5 § 4.3.
**PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: every node + relationship encodes THIS
  ecosystem's actual structure. Copying the registry to
  another portfolio would describe nothing. ✓
- Ekosistem-fed: pure imports from the temporal registry +
  the perception allow-list. Zero external calls. ✓
- Ekosistem-emergent: meaningless without Phase 8.2+
  renderers + Phase 9 operational twin + Lumina sub-agent
  consumption. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The endpoint accepts
  one of four closed-allow-list event kinds.
- The schema has no `mood` / `vibe` / `theme` axis — pure
  architectural categorization. ✓

---

## 3. Architectural decisions

### 3.1 Sub-PR 8.1 deliberately diverges from V5 § 5.3

V5 § 5.3's stated 8.1 was "WebGPU + Three.js Fallback
Renderer Foundation" — a visual chassis. The user's Phase 8
brief overrides this: 8.1 is the **intelligence foundation**;
the renderer foundation moves to 8.2.

Reason for the divergence: the V5 doc's renderer-first ordering
would force the renderer to consume an UNDEFINED schema. The
brain-first ordering inverts this — the schema is the contract
the renderer satisfies, not the renderer's incidental output.
The contract being declared FIRST means Phase 8.2's renderer
can be built against a stable + validated graph rather than
co-designed with one.

### 3.2 Seven-module split inside `lib/v5/topology/`

| Module | Responsibility |
|--------|----------------|
| `schema.ts` | Closed allow-lists (kinds, verbs), shapes, type guards, runtime validators |
| `registry.ts` | Pure accessors over the static graph; one-time validation pass at module load |
| `temporal-link.ts` | Topology ↔ temporal registry binding (`evolution_event_ids`) |
| `perception-link.ts` | Topology ↔ perception layer binding (`perception_categories`) |
| `render-abstraction.ts` | Renderer-agnostic shape + `TopologyRenderer` interface + `toRenderable` mapper |
| `flags.ts` | `V5_TOPOLOGY_RENDER_ENABLED` env var + check function |
| `telemetry.ts` | KV adoption hash + record/read helpers |

The split mirrors the Phase 6 perception split + the Phase 7
temporal split. Each module has one job; tree-shaking keeps
the schema + accessors + abstractions tiny when only one
helper is imported.

### 3.3 Schema is mechanical, not narrative

The user's Phase 8 brief is firm:

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

The schema can't tip into narrative because:
- The 9 node kinds are architectural categories (system,
  project, phase, architecture, tool, memory, telemetry, lab,
  evolution) — none of them are visual / aesthetic.
- The 7 relationship verbs are operator-grade vocabulary
  (depends_on, evolved_into, powers, observes, introduced,
  influences, related_to) — none of them are dramaturgical.
- Optional fields are mechanical (source_path, version, href)
  or cross-system (evolution_event_ids, perception_categories)
  — never `mood`, `vibe`, `theme`, `tone`.

A future renderer can ADD visual treatment, but the data
underneath stays operator-grade. The "this system understands
itself" feel comes from honesty, not from chrome.

### 3.4 Cross-system bindings are STRING references, not joins

Each `TopologyNode` carries optional
`evolution_event_ids: readonly string[]` and
`perception_categories: readonly string[]`. The strings are
ids into OTHER registries. Three reasons:

- **No circular imports.** The topology module imports the
  temporal registry's accessors but the temporal registry
  doesn't import topology. The cross-link is one-way at the
  module-graph level; bidirectional at the data level.
- **Editorial expressiveness.** Authors write
  `evolution_event_ids: ["v5-perception-foundation"]` —
  declarative and grep-able.
- **Graceful degradation.** When the temporal registry drops
  an event (it shouldn't — it's append-only — but
  hypothetically), the topology node continues to render;
  only the cross-link goes stale. The `summariseTemporalLinks`
  helper reports stale counts so the operator can see the
  drift.

The smoke test confirms 0 stale links across both
cross-systems (22/22 temporal + 8/8 perception).

### 3.5 Render abstraction is the CONTRACT, not the implementation

The `TopologyRenderer` interface is small:

```ts
interface TopologyRenderer {
  readonly kind: string;
  mount(host: HTMLElement, graph: RenderableTopology): RendererHandle;
}
```

Two methods. No assumption about WebGL / Canvas / SVG / DOM.
A renderer that paints into a `<svg>` element with `<line>`s
satisfies this. A renderer that boots a WebGPU pipeline and
drives a Three.js scene satisfies this. A static reduced-
motion 2D fallback satisfies this.

The `toRenderable(graph)` mapper flattens the internal
`TopologyNode` into a renderer-facing `RenderableNode` with
a `metadata` string-map for optional fields. The metadata
shape is JSON-serialisable, which means a future renderer
could marshal the graph to a Web Worker for layout
computation without any schema adaptation.

### 3.6 Telemetry vocabulary is COGNITIVE, not behavioral

The hash has 4 event kinds:

- `view` — the renderer rendered (foundation-stage signal).
- `node_inspect` — a single node was focused.
- `relationship_traverse` — an edge was followed (the
  visitor moved from one node to a connected one).
- `path_query` — a higher-cognition act: "how does A
  connect to B".

The vocabulary deliberately escalates from passive (view)
through focused (inspect) through navigational (traverse)
to inferential (query). The slot names are themselves a
hypothesis about how visitors WILL engage with future
renderers; the operator can refute or confirm via the
observed counter distribution.

### 3.7 Validation enforced at registry-load time, surfaced via JSON feed

`validateTopologyGraph` runs once at module import via the
registry's `deriveRegistry()` pass. The failure (or `null`)
is stored and exposed through `getTopologyValidationFailure()`
+ surfaced in the JSON feed's `validation_failure` field.

A bad data-file edit (duplicate id, unknown verb, dangling
relationship endpoint) doesn't crash the module — the
registry still serves the partial graph + reports the
failure. The operator sees the violation in the next deploy's
JSON feed.

This is the same posture as the Phase 7.1 schema's
`validateEvolutionEvent` — defensive validation that lets
the graph stay observable even when one entry is broken.

### 3.8 No `/v5/topology` page ships in 8.1

The user's brief is explicit: "NO visible spectacle yet".
A transparency surface for the topology layer (something
analogous to `/v5/perception` or `/evolution`) is the
natural Phase 8.x continuation — but lands in a future
sub-PR once the registry has visible consumers.

For now, the JSON feed at `/api/v5/topology/graph` is the
only observable surface. Anyone can `curl` it; the format
is documented in the source.

### 3.9 Flag is declared in 8.1 but enforced nowhere yet

`V5_TOPOLOGY_RENDER_ENABLED` exists + `isTopologyRenderEnabled()`
reads it — but no consumer calls the check yet. The flag is
in place so Phase 8.2's renderer can dark-launch behind it
from day one (same pattern as `V5_PERCEPTION_ENABLED` from
Phase 6.1).

### 3.10 Initial graph (22 nodes / 28 relationships) is honest

The seed was hand-curated against the actual codebase. Every
node has a `description` that matches what the corresponding
code does. Every cross-link resolves (0 stale). Every verb
is used at least once. The `tool` + `evolution` node kinds
have zero seed entries — they're reserved for future
editorial expansion (a Lumina tool node like
`readSourceFile`; a topology node that pin-points an
evolution-event as the topological endpoint of a temporal
chain).

---

## 4. KIRMIZI ÇİZGİ + Phase 8 philosophy enforcement

The user's Phase 8 standard:

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

Sub-PR 8.1 ships no visible animation at all (no UI). So the
risk is in the FUTURE — when Phase 8.2 renders, will the
visitor read it as cognition or as visual theatre?

The schema is the answer. Because the data is mechanical, the
renderer is forced into one of two modes:
- **Read the metadata + describe the system** — the cognitive
  mode the brief mandates.
- **Ignore the metadata + paint pretty shapes** — the visual-
  theatre mode the brief forbids.

A renderer that does the second IS strictly inferior because
the schema is dense with cross-references that beg for
description. The data structure encodes its own usage
guidance.

Additional safeguards already in place:

| Layer | Mechanism |
|-------|-----------|
| Schema | No `mood`, no `vibe`, no `theme`. Pure architectural axes. |
| Graph data | Every node's description is one declarative sentence — operator vocabulary, never marketing. |
| Telemetry | Event kinds escalate from `view` (passive) → `path_query` (inferential). The slot names hypothesise cognitive engagement, not visual reach. |
| Render abstraction | The `RenderableNode` shape PRESERVES `description`, `source_path`, `evolution_event_ids`, `perception_categories`. The renderer can ignore them, but they're available — and a thoughtful renderer will surface them. |
| Flag default | Off. Dark-launch is the default; the operator opts in when the renderer is honest enough to ship. |

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/topology/schema.ts` — 9 kinds, 7 verbs, shapes, type guards, validators |
| New | `lib/v5/topology/registry.ts` — accessors + summary + validation surface |
| New | `data/topology/graph.ts` — 22 nodes + 28 relationships, hand-curated |
| New | `lib/v5/topology/temporal-link.ts` — temporal cross-link helpers + summary |
| New | `lib/v5/topology/perception-link.ts` — perception cross-link helpers + summary |
| New | `lib/v5/topology/render-abstraction.ts` — `TopologyRenderer` interface + `toRenderable` mapper |
| New | `lib/v5/topology/flags.ts` — `V5_TOPOLOGY_RENDER_ENABLED` env + check |
| New | `lib/v5/topology/telemetry.ts` — KV adoption hash + helpers |
| New | `app/api/v5/topology/graph/route.ts` — edge GET JSON feed |
| New | `app/api/v5/topology/event/route.ts` — edge POST adoption endpoint |
| New | `sub-pr-report/SUB-PR_8.1_REPORT.md` (this report) |

No new dependencies. No new env vars REQUIRED — the
`V5_TOPOLOGY_RENDER_ENABLED` flag is documented but optional;
leaving it unset is the dark-launch default the user prompt
prescribes.

No existing files were modified.

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 8.1 adds ONE new hash to the V5 telemetry family:

```
v5:topology:graph  → hash {
  view                  : renderer mounted into the DOM
  node_inspect          : a node was focused
  relationship_traverse : an edge was followed
  path_query            : a connection query was issued
}
```

Endpoint dispatch (Phase 7-aligned posture):
- POST `/api/v5/topology/event` `{ kind }` → HINCRBY the
  field. Always 204.

Full V5 telemetry schema after 8.1:

```
v5:perception:<category>              → hash (Phase 6.1+)
v5:memory:adoption                    → hash (Phase 6.4)
v5:temporal:adoption                  → hash (Phase 7.1)
v5:topology:playback                  → hash (Phase 7.2)
v5:topology:timeline                  → hash (Phase 7.3)
v5:topology:architecture-page         → hash (Phase 7.4)
v5:topology:graph                     → hash (Phase 8.1, NEW)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the hash has no per-visitor field |
| No fingerprint | The endpoint reads ONLY the JSON body `{ kind }`. No IP, no UA, no cookie beyond what Vercel logs |
| No identity persistence | No identifier minted by this layer. The graph is public-archive content — every visitor sees the same JSON |
| No consent gate | Symmetric with the temporal layer — topology is public-archive content, the adoption signal carries no per-visitor data |
| Graceful no-op | KV unavailable → record helper returns silently; read helper returns `{}` |
| Schema validation surfaced | A bad data-file edit reports `validation_failure` in the JSON feed; the registry doesn't silently misbehave |

The topology registry never mints visitor identity. The
cross-system bindings (`evolution_event_ids`,
`perception_categories`) reference PUBLIC ids — they're
metadata about the system, not about visitors.

---

## 8. Performance posture

V5 § 4.3 + § 2.7 budgets: bundle ceiling 180 KB initial gz,
250 KB hard; topology-page LCP < 2.0s target.

| Surface | Measurement |
|---------|-------------|
| Client bundle delta on every existing route | 0. The topology modules are server-only — verified absent from `.next/static/**`. Tree-shaking drops them from every route that doesn't import them, which is currently every route. |
| `/api/v5/topology/graph` latency | One in-memory filter + JSON serialize. ~1-3 ms warm. CDN cache amortises real cost across the hour. |
| `/api/v5/topology/event` latency | One JSON parse + one validate + one HINCRBY. ~5-20 ms warm. Fire-and-forget; never blocks. |
| Module load cost | `deriveRegistry()` runs once at process start. Validates 22 nodes + 28 relationships + builds 3 indices. ~1-2 ms total. |
| Existing routes unaffected | `/evolution`, `/architecture/*`, `/v5/perception`, `/lumina/brain`, every other route render unchanged (verified via HTTP smoke). |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordTopologyEvent` in client chunks | 0 ✓ |
| `readTopologyAdoption` in client chunks | 0 ✓ |
| `TOPOLOGY_ADOPTION_HASH_KEY` in client chunks | 0 ✓ |
| `TOPOLOGY_GRAPH` / `getTopologyGraph` / `summariseTopologyRegistry` in client chunks | 0 ✓ |
| `validateTopologyGraph` in client chunks | 0 ✓ |
| `TOPOLOGY_NODE_KINDS` in client chunks | 0 ✓ |
| `toRenderable` / `TopologyRenderer` / `RenderableNode` in client chunks | 0 ✓ |
| `V5_TOPOLOGY_RENDER_ENABLED` / `isTopologyRenderEnabled` in client chunks | 0 ✓ |
| `getEvolutionEventsForNode` / `getPerceptionCategoriesForNode` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |

The foundation is completely server-side. Phase 8.2's
renderer will be the first consumer that introduces client
bytes.

---

## 9. Edge / runtime notes

- `/api/v5/topology/graph` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/topology/graph` (Dynamic,
  edge-inferred). Returns JSON with the CDN cache headers.
- `/api/v5/topology/event` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/topology/event` (Dynamic,
  edge-inferred). One HINCRBY per qualifying event.
- `lib/v5/topology/schema.ts` + `registry.ts` +
  `temporal-link.ts` + `perception-link.ts` +
  `render-abstraction.ts` + `flags.ts` are pure data / pure
  helpers — universally importable.
- `lib/v5/topology/telemetry.ts` imports `@vercel/kv` and is
  server-only. Verified absent from client chunks.
- `data/topology/graph.ts` is a typed module-scope constant.
  Tree-shakes per consumer; importing only the type
  signature drops the data entirely.

---

## 10. Rollback plan

The user prompt frames rollback as part of the validation
discipline. The single-commit revert removes:

- All 7 modules in `lib/v5/topology/`
- The data file at `data/topology/`
- Both edge endpoints under `app/api/v5/topology/`
- This report

KV state orphaned after revert:
- `v5:topology:graph` hash — no further writes; existing
  counts (if any) sit harmlessly. Can be `DEL`'d manually.

No schema break — no existing module touched, no env var
required, no migration path. Every other route + system
continues unchanged. The repository reverts to the V5 Phase
7.4 tip exactly.

Mid-flight rollback without code revert:
- Removing the `V5_TOPOLOGY_RENDER_ENABLED` env var (when
  it's eventually set) silences future renderers. The data
  + endpoint surface continues to serve.
- Removing `/api/v5/topology/*` from sitemap / robots (not
  currently listed) is unnecessary — they're API routes, not
  indexable surfaces.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 8.1-touched files | ✓ 0 errors, 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages, 0 warnings |
| `/api/v5/topology/graph` registered as `ƒ Dynamic` (edge) | ✓ |
| `/api/v5/topology/event` registered as `ƒ Dynamic` (edge) | ✓ |
| Bundle posture (server symbols in client) | ✓ 0 matches across 10+ symbols |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Graph integrity: validation_failure | ✓ `null` |
| Total nodes / relationships | 22 nodes / 28 relationships |
| Temporal cross-links | 22 total, 22 resolved, 0 stale |
| Perception cross-links | 8 total, 8 resolved, 0 stale |
| All 7 relationship verbs exercised at least once | ✓ |
| HTTP smoke: filter `?node_kind=phase` returns 3 nodes | ✓ |
| HTTP smoke: filter `?node_kind=bogus` returns empty arrays | ✓ |
| HTTP smoke: filter `?relationship_kind=evolved_into` returns 1 edge | ✓ |
| HTTP smoke: POST all 4 valid kinds → 204 | ✓ |
| HTTP smoke: POST invalid/malformed → 204 (silent drop) | ✓ |
| HTTP smoke: GET on `/event` → 405 Allow: POST | ✓ |
| HTTP smoke: POST on `/graph` → 405 Allow: GET | ✓ |
| `/evolution` continues to render | ✓ HTTP 200 |
| `/architecture/cloud-waste-hunter` continues to render | ✓ HTTP 200 |
| No new dependencies | ✓ `package.json` unchanged |
| No new env vars REQUIRED | ✓ (only optional flag documented) |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ (no per-visitor data anywhere on the topology path) | ✓ |

---

## 12. Future systems unlocked

This sub-PR ships ZERO visible surface but unlocks:

- **Phase 8.2** — WebGPU + Three.js Fallback Renderer.
  Implements `TopologyRenderer`. Reads `toRenderable(graph)`,
  paints the 22-node constellation. Gates on
  `isTopologyRenderEnabled()`. Fires `view` / `node_inspect` /
  `relationship_traverse` through `/api/v5/topology/event`.
- **Phase 8.3** — Engineering Aura. Reads the topology
  registry to compute per-page "aura" parameters (which
  systems power THIS page → that subset's color temperature
  contributes to the page's ambient palette).
- **Phase 8.4** — Adaptive Recruiter Intelligence. Reads
  topology + perception cross-bindings to compose the
  contact page's per-visitor layout (the topology + the
  recently-touched systems shape the case-study ordering).
- **Phase 9.1** — Operational digital twin. The /v5/operating
  surface composes a "this-week-active" subset of the
  topology registry alongside the temporal recent-events
  window.
- **Phase 9.2** — Repository intelligence overlay. Each
  topology node's `source_path` lets the existing
  repo-aware Lumina tools (`readSourceFile`,
  `explainCommitRationale`) be cross-referenced against
  topology entities. Lumina becomes graph-aware.
- **Lumina sub-agent** — architecture-critic can read the
  topology graph as ambient context when answering
  "what depends on the perception layer?" or "what evolved
  from the V4 memory layer?".
- **Static OG cards** — a future sub-PR could render the
  topology graph to PNG (server-side, build-time) for
  shareable architecture artifacts. The render-abstraction
  contract supports it.

---

## 13. Deferred systems

The user prompt's explicit DEFERRED list, restated:

- **Any renderer** → Phase 8.2 (WebGPU + Three.js).
- **WebGL / canvas / particle systems** → Phase 8.2.
- **Cinematic transitions** → Phase 8.2+.
- **Engineering aura system** → Phase 8.3.
- **Adaptive recruiter intelligence** → Phase 8.4.
- **Spatial audio** → Phase 8.5 (optional).
- **`/v5/topology` transparency surface** → future Phase 8.x
  once the registry has a visible consumer to document.
- **`tool` + `evolution` node-kind seeding** → editorial
  expansion (the kinds exist in the schema; the seed graph
  uses 7 of 9 kinds).
- **`path_query` event firing** → reserved for the eventual
  Lumina-driven topology query surface.
- **Per-node engagement counter** (one field per node id) →
  the current hash is event-kind-only, not node-id-keyed.
  Adding per-node engagement is one schema-extension
  decision the operator can defer until Phase 8.2 surfaces
  the data.

Permanently rejected (carried from V5 § 3.3 + the user's
Phase 8 brief):
- d3 / graph engines / force simulations as dependencies.
- WebGL libraries (specifically not in 8.1; Three.js arrives
  via Phase 8.2 as a renderer choice).
- Heavyweight graph databases (KV-only; the graph fits in
  memory).
- Per-visitor graph state (the topology is public-archive).
- Multi-tenant graph editing (the registry is hand-curated;
  no runtime mutation surface).

---

## 14. Affected system analysis (Phase 8 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/topology/*` namespace + `data/topology/*` data file. Zero overlap with existing namespaces. Seven new modules tree-shake cleanly. |
| Temporal | Pure consumption — the topology cross-links READ from `lib/v5/temporal/registry` but the temporal module knows nothing of topology. One-way dependency at the module-graph level. |
| Telemetry | One new KV hash + one new edge endpoint + one new check function. Existing telemetry surfaces unchanged. |
| Future renderer | The `TopologyRenderer` interface is the contract Phase 8.2 will satisfy. The `RenderableTopology` shape is JSON-serialisable; Web-Worker offloading is supported by construction. |
| Bundle | 0 byte delta on every existing route. Verified via grep across `.next/static`. |
| Feature flag | One new env var `V5_TOPOLOGY_RENDER_ENABLED` (optional; default off). No enforcement yet — Phase 8.2's renderer will gate on it. |
| Reduced-motion | No motion in 8.1 (no UI). Phase 8.2+ renderers will need to honor `prefers-reduced-motion`; the abstraction does not preclude it. |
| Mobile | No mobile-specific concerns in 8.1. Phase 8.2+ will need to address mobile WebGL availability + degrade gracefully. |
| Hydration integrity | Zero new client components. No hydration concerns. |
| Edge consistency | Both new endpoints are edge runtime. Cache headers + 204-on-error patterns mirror existing Phase 7 endpoints. |
| Maintenance burden | ~1 hr/month for the registry (append-only editorial passes). Within Phase 8's 6 hr/mo envelope per V5 § 4.3. |
| Rollback | Single-commit revert removes every primitive; KV state orphans harmlessly. Documented in § 10. |

---

## 15. Next sub-PR

**Sub-PR 8.2 — WebGPU + Three.js Fallback Renderer
Foundation.** Per V5 § 5.3:

- `lib/v5/topology/renderer-*.ts` implementations of
  `TopologyRenderer`
- `app/v5/topology/<slug>/` route-isolated mount
- WebGPU detection + Three.js fallback
- Mobile reduced static 2D fallback
- Idle frame 0
- Route-quarantined chunk

The renderer will consume `toRenderable(getTopologyGraph())`,
gate on `isTopologyRenderEnabled()`, fire adoption events
through the `/api/v5/topology/event` contract this sub-PR
laid.

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 16. Closing — the brain is built, the body waits

Sub-PR 6.1 shipped the perception primitives. Sub-PR 7.1
shipped the temporal registry. Sub-PR 8.1 ships the topology
intelligence — the graph that lets the ecosystem describe its
OWN structure, cross-bound to both prior systems.

The visitor sees nothing new. The architecture pages, the
evolution archive, the perception transparency — all render
exactly as they did before 8.1. The chassis is internal:
twenty-two nodes describing the real ecosystem, twenty-eight
relationships using all seven of the schema's verbs, zero
stale cross-links across both temporal and perception
bindings.

What 8.1 enables: the day Phase 8.2 mounts a renderer, the
visitor will not see "a cool 3D graph". They will see THIS
SYSTEM'S graph — every node carrying a real
description, real source_path, real introduction event,
real perception observation. The renderer can ignore that
metadata or surface it; the data underneath is honest either
way.

Phase 8 opens with the system brain built. The body waits.
