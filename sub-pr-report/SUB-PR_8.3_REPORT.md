# Sub-PR 8.3 — Production Project Mount (the spectacle moment)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 8 — Spectacle Systems & Topology Intelligence · Sub-PR 8.3 (Tier B · the one spectacle)
**Scope:** Mount the Phase 8.2 renderer chassis on a single
production project route — `/v5/topology/cloud-waste-hunter`.
ENABLED_SLUGS = `["cloud-waste-hunter"]`; every other slug
returns 404. Operator flag (`V5_TOPOLOGY_RENDER_ENABLED`)
gates the whole surface; default OFF means the route 404s
until the operator flips it. New TopologyMount client wrapper
dispatches the Phase 8.2 selector → SVG SSR (default) or
Three.js dynamic chunk (desktop + no reduced-motion). The
`view` event fires once per session per slug through the
Phase 8.1 endpoint. Phase 8's "ONE SPECTACLE ONLY" rule
satisfied — exactly one project, exactly one mounted surface.

---

## 1. Mission

Phase 8.1 built the topology intelligence (the brain). Phase
8.2 built the renderer foundation (the engine). Phase 8.3
ships the visible spectacle — the route a future recruiter,
peer engineer, or curious visitor finds when they click into
the engineering cognition surface for the first time.

The brief was firm:

> ONE SPECTACLE ONLY.
> This is non-negotiable.

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

Sub-PR 8.3 honors both lines by:
- Mounting on exactly ONE project page (Cloud Waste Hunter,
  the strongest registry coverage).
- Refusing every other slug at the routing layer (`notFound()`).
- Refusing every slug when the operator flag is off (default).
- Framing the topology with editorial copy that names the
  schema (9 kinds, 7 verbs) instead of the visual treatment.
- Inheriting Phase 8.2's restraint — single hue, no
  post-processing, no auto-rotate, `frameloop="demand"` for
  zero idle CPU.

---

## 2. What 8.3 ships

- **`app/v5/topology/[slug]/page.tsx`** — Server Component.
  Triple-gated:
    1. `isTopologyRenderEnabled()` must return true (operator
       env var `V5_TOPOLOGY_RENDER_ENABLED === "1"`).
    2. Slug must be in `ENABLED_SLUGS` (`["cloud-waste-hunter"]`
       in 8.3).
    3. Slug must resolve to a `project`-kind node in the
       registry.
  Any closed gate → `notFound()` → 404.
- **`app/v5/topology/_components/TopologyMount.tsx`** —
  `"use client"` wrapper. Detects capabilities, dispatches
  via the Phase 8.2 selector + downgrader, dynamically imports
  the matching renderer (SVG SSR `ssr: true`, Three.js client-
  only `ssr: false`). Fires `view` once per session per slug.
- **`lib/v5/topology/registry.ts`** — `getProjectSubgraph(id,
  maxHops = 2)` accessor added. BFS from a center node up to
  `maxHops`; returns the connected nodes + relationships
  whose both endpoints are inside the walk. The CWH 2-hop
  subgraph contains 5 nodes (cloud-waste-hunter + aws-topology-3d
  + scrollstory-engine + vibing-coder-ai + sixpack-ai) and 5
  edges.
- **`lib/telemetry/metrics.ts`** — `TOPOLOGY_PAGE_VISITS`
  metric key. The V4-style scalar that the /telemetry
  dashboard can read, symmetric with `EVOLUTION_PAGE_VISITS`
  + `V5_PERCEPTION_PAGE_VISITS`.
- **`app/api/telemetry/visit/route.ts`** — `topology` →
  `TOPOLOGY_PAGE_VISITS` mapping added to the dispatch table.
- **`components/telemetry/VisitPing.tsx`** — `topology` added
  to the surface union so the page can fire its visit
  counter via the existing primitive.

---

## 3. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A schema-validated, cross-system-linked,
hand-curated topology of an entire engineering ecosystem,
rendered at three fidelities (SSR SVG / desktop Three.js /
forward-slot WebGPU), framed editorially as "the system's
self-description" rather than "a cool graphic" — that
combination is rare in the portfolio category. The closest
analog is a Notion-style company OS diagram, but those are
manually drawn marketing surfaces; this is mechanically
derived from a typed registry. **PASS.**

**Q2 — Emergence:** The topology page alone is a static
diagram. Its value crystallises because it sits next to
`/architecture/<slug>` (the linear scroll-through),
`/evolution?system=<slug>` (the temporal archive), and the
Phase 8.1 JSON feed at `/api/v5/topology/graph` (the machine
surface). The same registry powers all four; visitors reading
the topology page can deep-link laterally without leaving the
ecosystem. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/month for the project mount
(occasional editorial polish, no per-project renderer code).
The Three.js + SVG chunks are the same code regardless of
which slugs are enabled. Future slug additions are one-line
additions to `ENABLED_SLUGS` + a registry editorial pass.
Within Phase 8's 6 hr/mo envelope per V5 § 4.3. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: The page renders THIS portfolio's
  registry. The CWH project node + its connected components
  are specific to this ecosystem. Copying the route to
  another portfolio without the registry would 404 — the
  slug doesn't exist there. ✓
- Ekosistem-fed: zero external calls. The page reads the
  in-memory registry + fires a fire-and-forget telemetry
  event. No LLM, no Bedrock, no external data source. ✓
- Ekosistem-emergent: meaningless without 8.1 (the brain) +
  8.2 (the engine). 8.3 is the consumer; the chassis was
  done earlier. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The page renders
  pure data through pure renderers. ✓

---

## 4. Architectural decisions

### 4.1 Triple-gate, fail-closed

The route's gate hierarchy is intentionally redundant. Any
single open gate would let the page render; ALL three must be
closed for it to 404. The redundancy is the security/safety
principle from V5 § 2.4 — when in doubt, render nothing.

Gate 1 (flag) is the operator's switch. Gate 2 (slug
whitelist) is the explicit "which projects are ready" list.
Gate 3 (registry membership) is a defensive check against
data-file drift. Each gate can close independently without
affecting the others.

### 4.2 SSG with build-time flag evaluation

The page uses `generateStaticParams` to prebuild
`/v5/topology/cloud-waste-hunter`. The flag is evaluated at
build time:
- Flag off during build → the prebuilt HTML is the 404 page
  (verified: 20 KB content).
- Flag on during build → the prebuilt HTML is the topology
  page (verified: 71 KB content).

Flipping the flag requires a redeploy. This matches the V5 §
2.3 dark-launch posture: the operator opts in by adding the
env var to Vercel + redeploying. Same pattern as Phase 6.1's
`V5_PERCEPTION_ENABLED`.

The alternative (dynamic SSR with runtime flag evaluation)
would let the flag flip without a redeploy, but at the cost
of LCP regression (server compute per request). The
deployment-time evaluation is the correct tradeoff for a
spectacle surface where redeploy latency is acceptable.

### 4.3 SVG SSR via `dynamic({ ssr: true })`

The SVG renderer is server-rendered. Visitors (and crawlers)
see the topology as semantic SVG in the initial HTML; the
client hydrates that same SVG without redrawing.

Implementation:
```ts
const SVGTopologyRenderer = dynamic(
  () => import("@/lib/v5/topology/renderers/svg-renderer"),
  { ssr: true, loading: () => null },
);
```

The dynamic-import pattern enforced by the Phase 8.2 barrel's
non-re-export keeps the renderer chunk OUT of any route that
doesn't dispatch to it. Verified via grep: server-only
symbols absent from `.next/static`; the SVG chunk (~3.3 KB
minified / ~1.6 KB gzipped) loads only on the topology route.

### 4.4 Three.js via `dynamic({ ssr: false })`

The Three.js renderer is client-only. The page hydrates with
the SVG visible; after the capability check resolves, if the
visitor qualifies, the Three.js chunk loads and replaces the
SVG in the same wrapper. No flash on most paths because the
SVG and Three.js share the same `RenderableTopology` slice +
the same wrapper container.

The Three.js chunk shares code with the existing
`HeroTopologyScene` + `AWSTopologyScene` + `CodexTopologyScene`
chunks (`three` + `@react-three/fiber` + `@react-three/drei`
were already in the bundle). The new code is the renderer
wrapper itself (~5 KB minified estimated); the heavy
libraries are amortised across surfaces.

### 4.5 Subgraph via 2-hop BFS

`getProjectSubgraph(slug, maxHops = 2)` walks the registry's
adjacency map from the project node outward in BFS order.
For CWH:
- Center (0-hop): cloud-waste-hunter (1 node)
- 1-hop (direct neighbors): aws-topology-3d, scrollstory-engine
- 2-hop (indirect, via shared neighbors): vibing-coder-ai,
  sixpack-ai (both share scrollstory-engine as a powering
  architecture)

5 nodes total. The 2-hop choice was a deliberate editorial
balance:
- 1-hop alone (3 nodes) reads as sparse.
- 3-hop pulls in portfolio + every project → 15+ nodes →
  reads as "the whole ecosystem", not "this project".
- 2-hop sits at the sweet spot where the project + its
  immediate context + its sibling projects via shared
  architecture appear together.

The BFS walks BOTH outgoing and incoming edges so an
architecture node's incoming `powers` edges from project
nodes count toward the 1-hop set.

### 4.6 `view` event session-deduped per slug

The TopologyMount fires `view` once per session per slug.
sessionStorage key: `v5:topology:view:fired:<slug>`. A
visitor who lands on the CWH topology page fires once; if
8.4+ enables additional slugs (VCAI, SixPack), each slug
gets its own dedupe slot so the visitor contributes one
`view` per slug.

The Phase 8.1 endpoint's hash (`v5:topology:graph.view`)
aggregates across slugs — the dedupe means each slug
contributes at most one count per session. Future hash
extensions could break out per-slug counts; 8.3 doesn't
extend the schema (per the "no while-we're-here expansion"
rule).

### 4.7 Other event kinds reserved, NOT fired in 8.3

The Phase 8.1 hash has four event kinds: `view`,
`node_inspect`, `relationship_traverse`, `path_query`. Only
`view` fires from 8.3:

- `node_inspect` requires the renderer to expose hover
  events to the consumer. The Three.js renderer has internal
  hover state; surfacing it as a callback would extend the
  Phase 8.2 contract. Deferred.
- `relationship_traverse` requires interaction beyond hover
  (click-through, camera follow). The renderer doesn't have
  click handlers yet. Deferred.
- `path_query` is a higher-cognition slot — "how does A
  connect to B" — reserved for a future Lumina-driven
  surface.

The hash's other three slots stay at zero until a future
sub-PR wires the interaction events. That's the foundation
discipline carried from 8.1 + 8.2.

### 4.8 ENABLED_SLUGS hardcoded, not registry-driven

The whitelist is a literal `["cloud-waste-hunter"]` in the
page file. Future sub-PRs add other projects explicitly.

Why not derive from the registry (every project kind →
enabled)?
- The user's "ONE SPECTACLE ONLY" rule means each project
  page is an editorial decision, not an automatic emission.
  Adding VCAI or SixPack should be a deliberate review step.
- Each new slug needs its own copy review (the page's
  description, the cross-links, the source links).
- The whitelist forces the operator to explicitly opt in,
  matching the Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED`
  default-off philosophy.

### 4.9 Page voice — operator vocabulary, not marketing

The page header reads:

> Cloud Waste Hunter.
> The system describes itself.

Section 01 ("The graph") explains the schema in plain
language:

> Each circle is a system, project, phase, architecture,
> tool, memory, telemetry, lab, or evolution event. Each line
> is a relationship — depends_on, evolved_into, powers,
> observes, introduced, influences, or related_to.

That's a literal recitation of the Phase 8.1 schema's closed
allow-lists. The visitor reading this page learns the
EDITORIAL MODEL the registry uses, not just the visual
output. By the time they reach the renderer, they understand
what each circle and line MEANS — which is the difference
between "I saw cool graphics" and "I understand the system".

The "the system describes itself" framing avoids both
extremes: it doesn't pose as marketing ("we built a
beautiful diagram") and it doesn't pose as documentation
("here's the system architecture"). The system is the
subject; the page is its self-portrait.

### 4.10 Cross-links surface the related surfaces

Section 04 ("Related surfaces") links to:
- `/architecture/<slug>` — the linear scroll-through.
- `/evolution?system=<slug>` — the temporal archive filtered
  to this project.
- The project's `href` from the registry (e.g.,
  `/projects/aws-waste-hunter`) — the deep case study.

Three different views of the same project: structural
(topology), narrative (architecture), historical (evolution),
descriptive (project page). The visitor can navigate
laterally to whichever vantage matches their question.

This is the Identity-Native Intelligence emergent fabric:
the topology page is meaningful BECAUSE the rest of the
ecosystem describes the same project from other angles.

### 4.11 Sitemap intentionally NOT updated

`app/sitemap.ts` is unchanged. Reasons:
- The route is flag-gated; until the operator flips the
  flag publicly, the sitemap entry would point at a 404.
- Phase 8's "ONE SPECTACLE" stance argues for the surface
  to be DISCOVERABLE on intent (e.g., from the architecture
  hub page) rather than via search engines that find a
  generic sitemap entry.
- A future sub-PR can add `/v5/topology/cloud-waste-hunter`
  to the sitemap when the flag is permanently on.

### 4.12 No new dependencies, no new env vars REQUIRED

The flag (`V5_TOPOLOGY_RENDER_ENABLED`) was declared in
Phase 8.1; 8.3 only consumes it. The renderer dependencies
(three, @react-three/fiber, @react-three/drei) were already
in `package.json` for the existing hero / project / codex
topologies. The visit-counter primitive (`VisitPing`) was
shipped in V4 Phase 1; 8.3 adds one union member.

The diff in `package.json`: zero lines.

---

## 5. KIRMIZI ÇİZGİ + Phase 8 philosophy enforcement

The user's Phase 8 standard:

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

Sub-PR 8.3 is the FIRST visible surface where this standard
gets tested in production. The choices designed against the
failure modes the user catalogued:

| User-prompt failure mode | Mitigation in 8.3 |
|---------------------------|--------------------|
| flashy motion theater | `frameloop="demand"` from 8.2; only motion is hover-scale on Three.js path; SVG path has zero motion. |
| GPU vanity | No custom shaders, no bloom, no post-processing. The Three.js renderer's restraint (8.2) carries through. |
| overengineered graphics | Single sphere primitive per node; LineSegments for edges. No Line2, no MeshLine, no instanced rendering. |
| cyberpunk aesthetics | Single hue (`#00d2ff`) across the entire scene. No chromatic separation, no neon. |
| visual noise | Black background, transparent canvas. No starfield, no fog, no particles. |
| portfolio gimmicks | The visitor sees REAL nodes from the hand-curated registry. No fake graphs, no decorative content, no synthesised connections. |

Plus a unique Phase 8.3 safeguard: the page's text frames the
visual EXPLICITLY as the system's self-description, not as
"interactive content". The visitor is primed to read the
graph as engineering knowledge before they look at the
renderer.

---

## 6. What changed

| Action | File |
|--------|------|
| New | `app/v5/topology/[slug]/page.tsx` — Server Component, triple-gated, SSG with build-time flag evaluation, editorial framing |
| New | `app/v5/topology/_components/TopologyMount.tsx` — `"use client"` wrapper; capability dispatch; SVG SSR + Three.js dynamic; session-deduped `view` event |
| Edit | `lib/v5/topology/registry.ts` — added `getProjectSubgraph(id, maxHops)` accessor + `TopologySubgraph` interface |
| Edit | `lib/telemetry/metrics.ts` — added `TOPOLOGY_PAGE_VISITS` metric key |
| Edit | `app/api/telemetry/visit/route.ts` — added `topology` → `TOPOLOGY_PAGE_VISITS` mapping |
| Edit | `components/telemetry/VisitPing.tsx` — added `topology` to surface union |
| New | `sub-pr-report/SUB-PR_8.3_REPORT.md` (this report) |

No new dependencies, no new env vars, no new edge endpoints
(the Phase 8.1 `/api/v5/topology/event` endpoint is the
contract; 8.3 fires through it). No sitemap change.

---

## 7. Telemetry schema (unchanged + one V4 scalar)

Sub-PR 8.3 does NOT add a new V5 hash. Phase 8.1's
`v5:topology:graph` hash carries the four event kinds; the
mount fires `view`.

One new V4-style scalar key:

```
v5:telemetry:topology-page:visits   → scalar (cumulative visits across all topology slugs)
```

The V4 dashboard (`/telemetry`) can read this through
`readMetric(METRIC_KEYS.TOPOLOGY_PAGE_VISITS)`. The page's
session-deduped per-slug counter remains on the V5 hash —
two different signals for two different operator questions.

Full V5 telemetry schema after 8.3:

```
v5:perception:<category>              → hash (Phase 6.1+)
v5:memory:adoption                    → hash (Phase 6.4)
v5:temporal:adoption                  → hash (Phase 7.1)
v5:topology:playback                  → hash (Phase 7.2)
v5:topology:timeline                  → hash (Phase 7.3)
v5:topology:architecture-page         → hash (Phase 7.4)
v5:topology:graph                     → hash (Phase 8.1)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
v5:telemetry:topology-page:visits     → scalar (Phase 8.3, NEW)
```

---

## 8. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the hash has no per-visitor field |
| No fingerprint | The page reads only the slug from the URL path. No IP, no UA, no cookies. Capability detection reads `navigator.gpu` + `matchMedia` + `window.innerWidth` client-side only |
| Per-slug session dedupe | `view` events fire at most once per session per slug; multiple visits within one session don't inflate the count |
| Flag-off → 404 → no leak | When the flag is off, the route returns 404 with no operator-state disclosure |
| No consent gate | Symmetric with the rest of the topology layer — public-archive content, no per-visitor data persisted |
| Graceful no-op | KV unavailable → record helper returns silently. The visitor's experience is unaffected (the page renders; only the counter doesn't increment) |

---

## 9. Performance posture

V5 § 4.3 budget: cinematic topology page LCP < 2.0s target,
< 3.0s hard.

| Surface | Measurement |
|---------|-------------|
| Page LCP | The SVG renderer is SSR'd into the initial HTML. LCP is the page's `h1` or the first paint of the SVG, whichever is earlier — both server-rendered. Sub-second LCP expected for the prebuilt static page. |
| Page HTML size | 71 KB with flag ON (verified). 20 KB with flag OFF (404 page). |
| Static prerender | `● SSG` via `generateStaticParams`. The page is prebuilt at deploy time; no per-request server compute. |
| SVG renderer chunk | 3.3 KB minified / 1.6 KB gzipped, dynamically imported. Loads on the topology route only. |
| Three.js renderer chunk | Shares with existing Hero/Project/Codex three chunks. No new chunk added; dynamic import dispatches to the existing module. |
| Three.js idle CPU when mounted, no interaction | 0% (`frameloop="demand"` from 8.2). |
| Visit counter latency | One env read + one KV INCRBY. ~5-20 ms warm. Fire-and-forget. |
| `view` event latency | One JSON parse + one allow-list check + one KV HINCRBY. ~5-20 ms warm. Fire-and-forget. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordTopologyEvent` / `readTopologyAdoption` / `TOPOLOGY_ADOPTION_HASH_KEY` in client | 0 matches |
| `getProjectSubgraph` / `validateTopologyGraph` / `TOPOLOGY_GRAPH` in client | 0 matches |
| `@vercel/kv` in client | 0 matches |
| SVG renderer's distinct string (`topology-ambient-cyan`) | 1 chunk (the SVG dynamic chunk) |
| Three.js renderer's distinct string (`NODE_EMISSIVE_BY_KIND`) | only in pre-existing three.js chunks; no new bundle bloat |

Existing routes unaffected:

| Route | Response |
|-------|----------|
| `/` | 200 |
| `/evolution` | 200 |
| `/architecture/cloud-waste-hunter` | 200 |
| `/v5/perception` | 200 |
| `/lumina/brain` | 200 |

---

## 10. Edge / runtime notes

- The page is a Server Component with `generateStaticParams`
  prebuilding only `cloud-waste-hunter`. Build registers it
  as `● SSG`.
- `app/v5/topology/_components/TopologyMount.tsx` is
  `"use client"`. SSR returns null (the loading state); the
  parent page's SSR HTML carries the SVG renderer's output
  via the SVG dynamic import with `ssr: true`.
- `/api/telemetry/visit` continues `ƒ Dynamic` (edge). One
  new surface mapping; no shape change.
- `/api/v5/topology/event` (Phase 8.1) continues unchanged.
  8.3 fires through it from the client.

---

## 11. Rollback plan

The single-commit revert removes:

- `app/v5/topology/[slug]/page.tsx`
- `app/v5/topology/_components/TopologyMount.tsx`
- The `getProjectSubgraph` accessor + `TopologySubgraph`
  interface from `lib/v5/topology/registry.ts`
- The `TOPOLOGY_PAGE_VISITS` metric key
- The `topology` mapping in the visit dispatch table
- The `topology` union member in `VisitPing`
- This report

KV state orphaned after revert:
- `v5:telemetry:topology-page:visits` scalar — sits
  harmlessly. Can be `DEL`'d manually.
- `v5:topology:graph.view` count — unchanged (the hash itself
  predates 8.3 and continues to exist via Phase 8.1).

No schema break, no env-var rollback (the flag was 8.1's; it
just stops being read by 8.3 code after the revert). Every
other route + system unchanged.

Mid-flight rollback without code revert:
- Unsetting `V5_TOPOLOGY_RENDER_ENABLED` and redeploying →
  the page rebuilds as a 404 page; no other route or system
  affected.
- The two-stage rollback (flag-off → revert) gives the
  operator a fast circuit-breaker before the full code
  removal.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 8.3-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ 13/13 |
| `npm run eval:playground` | ✓ 1/1 |
| Production build (flag off) | ✓ 50 pages, /v5/topology/cloud-waste-hunter as `● SSG` with 404 content |
| Production build (flag on) | ✓ same registration, 71 KB topology content |
| Flag off: `/v5/topology/cloud-waste-hunter` → 404 | ✓ |
| Flag off: unknown slug → 404 | ✓ |
| Flag on: `/v5/topology/cloud-waste-hunter` → 200, SSR'd SVG (6 `<title>` elements, 5 nodes + 1 head, 6 `<circle>` elements, 7 `<line>` elements) | ✓ |
| Flag on: `/v5/topology/vibing-coder-ai` → 404 (slug not in ENABLED_SLUGS) | ✓ |
| Flag on: `/v5/topology/random-bogus` → 404 | ✓ |
| `/api/telemetry/visit` accepts `topology` surface → 204 | ✓ |
| Server-only topology symbols absent from `.next/static` | ✓ 0 matches |
| SVG renderer chunk size | 3.3 KB minified / 1.6 KB gzipped |
| Three.js chunk shared with existing topology chunks (no new bloat) | ✓ |
| Tarballs (23.7 kB / 13.5 kB) | ✓ unchanged |
| Existing routes unaffected | ✓ /, /evolution, /architecture/*, /v5/perception, /lumina/brain → all 200 |
| No new dependencies | ✓ `package.json` unchanged |
| No sitemap change | ✓ (intentional; will land when flag is permanently on) |
| Phase 8 KIRMIZI ÇİZGİ (no GPU vanity / no cyberpunk / no particle effects / no post-processing) | ✓ |
| Idle frame 0 (Three.js `frameloop="demand"` from 8.2) | ✓ |
| Reduced-motion → SVG path | ✓ (selector returns "svg" when `reducedMotion === true`) |
| Mobile → SVG path | ✓ (selector returns "svg" when `mobile === true`) |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 13. Future systems unlocked

This sub-PR is the SPECTACLE — but it's also the foundation
for the rest of Phase 8 + Phase 9:

- **Sub-PR 8.4 — Engineering Aura.** The topology mount's
  observed `view` events + the subgraph composition feed
  into the per-page aura computation. A visitor on
  `/v5/topology/cloud-waste-hunter` has a different "aura
  fingerprint" than one on `/v5/perception`; the aura system
  reads the renderer's mount state to modulate.
- **Sub-PR 8.5 — Adaptive Recruiter Intelligence.** Reads
  the topology engagement signal alongside perception
  cognition to compose the contact-page layout.
- **Sub-PR 8.6 — Interaction telemetry firing.** Extends the
  Three.js renderer with `onNodeFocus` / `onRelationshipClick`
  callbacks so the mount can fire `node_inspect` /
  `relationship_traverse` events. Lights up the Phase 8.1
  hash's reserved slots.
- **Sub-PR 8.x — Additional project slugs.** A future
  editorial pass adds VCAI / SixPack / other project nodes
  to ENABLED_SLUGS. Each addition is one line + a registry
  enrichment.
- **Phase 9.1 — Operational digital twin.** Reads the
  topology graph alongside the temporal recent-events
  window to render the "this-week active subset" surface.
- **Lumina sub-agent.** Architecture-critic can read the
  topology graph + the current visitor's renderer kind +
  the project subgraph as ambient context. "I see you're
  reading the CWH topology — here's how it evolved..."

---

## 14. Deferred systems

The user prompt's implicit DEFERRED list, restated:

- **Additional project slugs** → future sub-PR after registry
  editorial expansion.
- **Interaction telemetry** (`node_inspect`,
  `relationship_traverse`, `path_query` events) → Sub-PR
  8.6 or later.
- **WebGPU renderer implementation** → reserved slot; ships
  only when Three.js insufficiency is observed.
- **Engineering aura system** → Sub-PR 8.4.
- **Adaptive recruiter intelligence** → Sub-PR 8.5.
- **Spatial audio** → Sub-PR 8.x (or deferred).
- **OG image generation per topology slug** → defer; the
  current OG metadata is generic for now.
- **Sitemap entry for /v5/topology/<slug>** → defer until
  flag is permanently on.
- **Per-slug breakdown on `v5:topology:graph.view`** → the
  current hash aggregates; per-slug would be a new field
  (`view:cloud-waste-hunter`, `view:vibing-coder-ai`).
  Defer until multiple slugs are enabled.

Permanently rejected (carried from V5 § 3.3 + the user's
Phase 8 brief):
- Auto-rotating camera / spring physics / particle effects.
- Generic visualization tool (Anti-Generic-AI Law).
- Multi-tenant topology rendering (the registry is
  hand-curated, not user-uploaded).
- LLM-narrated topology tour (Anti-Generic-AI Law).

---

## 15. Affected system analysis (Phase 8 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New route + new client mount wrapper + one new registry accessor. Reuses Phase 8.1 schema + Phase 8.2 renderer chassis. Zero cross-system touches. |
| Temporal | The page surfaces evolution events linked to the project node (read-only). No temporal data mutation. |
| Telemetry | One new V4 scalar (`TOPOLOGY_PAGE_VISITS`) + one new surface mapping. The V5 `view` event fires through the existing Phase 8.1 endpoint; no schema change. |
| Future renderer | Phase 8.2's selector still owns the dispatch. The mount is a thin wrapper that consumes the selector's output. |
| Bundle | New SVG renderer chunk: 3.3 KB / 1.6 KB gzipped. Three.js chunk shared with existing topology surfaces. Page HTML: 71 KB (flag on) / 20 KB (flag off). |
| Feature flag | `V5_TOPOLOGY_RENDER_ENABLED` was declared in 8.1; 8.3 reads it. Default OFF. |
| Reduced-motion | Honored via Phase 8.2 selector → SVG path. Three.js never mounts for reduced-motion visitors. |
| Mobile | Honored via Phase 8.2 selector → SVG path. The full SVG renders on mobile; no truncation, just no Three.js upgrade. |
| Hydration integrity | The SVG SSR'd by `dynamic({ ssr: true })` renders identically on server + client. Three.js mount happens after capability check resolves; no hydration conflict. |
| Edge consistency | `/api/telemetry/visit` continues `ƒ Dynamic` (edge). No new edge code. |
| Maintenance burden | ~0.5 hr/month for the project mount (registry editorial passes + per-slug review). Within Phase 8's 6 hr/mo envelope. |
| Rollback | Single-commit revert removes the route + the mount + the visit-counter primitive additions. Documented in § 11. |

---

## 16. Next sub-PR

**Sub-PR 8.4 — Engineering Aura.** Per V5 § 5.3:

- `lib/v5/aura/` — per-page perceptual fingerprint
- < 100 ms compute target
- No new visual elements; subtle color temperature shift
- Identity dilution risk → audit copy

The aura system reads:
- Phase 6 perception layer (the visitor's session cognition
  signal + pacing transition)
- Phase 8.3 topology engagement (which surface they're on,
  which subgraph rendered)
- Phase 7 temporal data (which events landed recently)

The output is a per-page "aura" — 4 perceptual parameters
(color temperature, opacity multiplier, motion subtlety,
ambient intensity) modulated by the inputs. The renderer
applies them invisibly; the visitor feels a shift without
naming it.

Awaiting explicit approval per the V5 operating
constitution. STOP and observe is the default disposition
between sub-PRs.

---

## 17. Closing — the visible moment, restrained

Sub-PR 8.1 shipped the system brain. Sub-PR 8.2 shipped the
renderer engine. Sub-PR 8.3 mounts the engine on the brain's
canonical surface for the first project. The visitor who
flips the flag and opens `/v5/topology/cloud-waste-hunter`
sees:

- A page that calls itself "Cloud Waste Hunter — The system
  describes itself."
- A 5-node subgraph rendered as either static SVG (mobile,
  reduced-motion, crawlers) or hover-aware Three.js
  (desktop with motion).
- One sentence per relationship verb the schema permits.
- Cross-links to the architecture scroll-through, the
  evolution archive, the project case study.
- Source links to the very files that produced the page.

What they should think: "I understand the system."

What they should NOT think: "I saw cool graphics."

The visual treatment is deliberately restrained — single
hue, no animation theatre, no GPU vanity. The substance is
the registry's hand-curated honesty. The page is the
spectacle Phase 8 reserves; it is also the proof that the
spectacle can be honest.

Phase 8's middle is complete. The aura system (8.4), the
adaptive recruiter (8.5), and the interaction telemetry
(8.6) wait for the next approval cycle.
