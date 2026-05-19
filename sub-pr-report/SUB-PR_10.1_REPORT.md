# Sub-PR 10.1 — Ambient Context Foundation (Phase 10 entry)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 10 — Ambient Intelligence Layer ·
Sub-PR 10.1 (Foundation tier)
**Scope:** Typed `AmbientContext` schema + 7 context domain
primitives + 4 integration views (perception, temporal,
topology, operating) + aggregate registry composer +
public JSON feed (`/api/v5/ambient/context`) + adoption
event endpoint (`/api/v5/ambient/event`) + telemetry
foundation (`v5:ambient:adoption` hash) + new feature
flag (`V5_AMBIENT_ENABLED`, default OFF).

**Foundation ONLY. Zero visible behavior. Zero adaptation.
Zero recommendation. Zero Lumina coupling.**

---

## 0. Pre-execution audit

Per the Phase 10 brief, the operator required a written
entry audit BEFORE any 10.1 code. That audit shipped as
`PHASE10_ENTRY_AUDIT.md` (root of repo, same commit as this
sub-PR).

Verdict: **GREEN — proceed to Sub-PR 10.1.** All Phase 6-9
foundations validated: build clean, tsc clean, lint clean,
51-page build, server-only symbols absent from
`.next/static`, all 6 V5 flags default OFF, privacy
invariants intact, no TODO/FIXME markers in `lib/v5/`,
tarballs unchanged.

Phase 10 conditional gates (V5 § 4.5) NOT verified
(observation windows haven't elapsed); operator invoked
explicit override under V5 § 0.4 ("İptal / Geri Alma /
Durma Hakkı"). The agent didn't contest this decision.
Mitigation: Sub-PR 10.1 ships foundation ONLY — no
visible behavior means landing it doesn't change any
visitor's experience.

---

## 1. Mission

V5 § 4.5 + the Phase 10 brief define the ambient
intelligence layer as the FINAL and MOST DELICATE V5 phase.
Done wrong: creepy AI, surveillance UX, fake personalisation.
Done right: "quiet environmental awareness that improves
understanding WITHOUT making the visitor feel observed."

Sub-PR 10.1 ships ZERO visible behavior. It ships the
typed FOUNDATION future ambient consumers may
optionally read.

What 10.1 introduces:

| Module | Purpose |
|--------|---------|
| `lib/v5/ambient/schema.ts` | `AmbientContext` shape + `ContextDomain` + `SignalIntensity` closed allow-lists + 7 typed per-domain view shapes + `EnvironmentalSignal` + `validateAmbientContext` |
| `lib/v5/ambient/domains.ts` | `CONTEXT_DOMAIN_REGISTRY` — per-domain structural metadata (description, upstream sources, privacy posture, consumer guidance) |
| `lib/v5/ambient/flags.ts` | `V5_AMBIENT_ENABLED` (default OFF) |
| `lib/v5/ambient/telemetry.ts` | `v5:ambient:adoption` hash + 4 event kinds + `recordAmbientEvent` + `readAmbientAdoption` |
| `lib/v5/ambient/integrations/perception.ts` | `viewPerception()` → projects perception snapshot → navigation + attention views |
| `lib/v5/ambient/integrations/temporal.ts` | `viewTemporal()` → wall-clock + evolution registry summary |
| `lib/v5/ambient/integrations/topology.ts` | `viewTopology()` → topology graph summary |
| `lib/v5/ambient/integrations/operating.ts` | `viewOperating()` → Phase 9.1 snapshot + Phase 9.3 latest journal narrative |
| `lib/v5/ambient/registry.ts` | `composeAmbientContext()` — parallel fan-out, in-line system + environment views |
| `app/api/v5/ambient/context/route.ts` | edge GET, flag-gated 404, JSON feed of composed context |
| `app/api/v5/ambient/event/route.ts` | edge POST 204, adoption foundation |

What 10.1 explicitly does NOT introduce:

- ANY visible UI surface
- ANY adaptive behavior
- ANY recommendation engine
- ANY personalisation engine
- ANY Lumina coupling
- ANY client-side ambient runtime
- ANY global store / polling loop
- ANY new motion surface
- ANY new dependency

V5 § 5.5 originally scoped 10.1 as "Cognition-Aware Lumina
Conversation Seed". The operator's revised 10.1 brief
makes this a 10.2+ concern instead. The foundation
supports it; nothing in 10.1 does it.

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A typed ambient-context registry that
projects 4 already-aggregate-only V5 subsystems through
ordinal-only intensities, exposes a single JSON feed at
edge runtime, defaults disabled, and ships ZERO visible
consumers as a deliberate foundation discipline is rare.
Most "context" abstractions either (a) consume immediately,
or (b) carry numerical fields downstream. The 10.1
foundation does neither. **PASS by extension.**

**Q2 — Emergence:** Zero standalone value. The composer
projects sources from Phases 6, 7, 8, 9; the registry has
nothing to expose if any of those foundations were absent.
The whole 10.1 surface is meaningful ONLY in the context of
the Phases 6-9 ecosystem. **Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month projected (registry
audit per release; integration view updates when source
shapes drift). Within Phase 10's eventual envelope. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: every integration view reads THIS
  portfolio's V5 subsystems. ✓
- Ekosistem-fed: zero external inputs. All source data is
  operator-owned + aggregate visitor signal from Phase 6-9
  registries. ✓
- Ekosistem-emergent: meaningless without Phase 6 (perception)
  + Phase 7 (temporal) + Phase 8 (topology) + Phase 9
  (operating + journal). ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call.
- The composer projects ALREADY-STRUCTURED data through
  closed allow-lists.
- The `latest_narrative` field projected from journal entries
  is the Phase 9.3 TEMPLATED narrative (Anti-Generic-AI Law
  compliant in its own right). The ambient layer doesn't
  invoke any LLM. ✓

**Phase 10 KIRMIZI ÇİZGİ:**
- Not personalization marketing — ✓ no per-visitor field
  anywhere
- Not AI recommendation spam — ✓ no recommendation surface
- Not behavioral manipulation — ✓ no adaptive surface
- Not surveillance — ✓ aggregate-only, no fingerprint
- Not emotional engineering — ✓ ordinal intensities only,
  no quantitative emotional signals
- Not attention hacking — ✓ no client-side runtime
- IS quiet environmental awareness — ✓ typed JSON feed,
  passive read, no visible behavior

---

## 3. Architectural decisions

### 3.1 Foundation-only discipline

The Phase 10 brief makes the foundation discipline explicit:

> Foundation ONLY. NO visible behavior, NO adaptation, NO
> personalization, NO emotional adaptation, NO visible
> personalization, NO agent behavior shifts, NO ambient
> animations, NO hidden intelligence behavior.

Sub-PR 10.1 takes this literally. The registry composer
exists; no caller consumes it visibly. The JSON endpoint
exists; no client component fetches it. The telemetry
hash exists; no client island writes to it. The flag
exists; flipping it ON adds zero visible behavior.

This is intentional. Phase 10's risk profile is the highest
in V5. The foundation must land FIRST + sit dormant. If
any later sub-PR is judged too risky, the foundation
remains dormant + harmless. If a later sub-PR is approved,
it adds the visible surface on top of an already-validated
foundation.

### 3.2 Closed allow-lists for context domains + intensities

`CONTEXT_DOMAINS` (7 domains) and `SIGNAL_INTENSITIES` (3
values) are closed enumerations. Adding a new domain
requires a new sub-PR. This prevents domain sprawl — the
foundation must not grow past its discipline.

The 7 domains map to specific Phase 6-9 subsystems:

| Domain | Source |
|--------|--------|
| `navigation` | Phase 6.1 perception navigation-flow + section-engagement counters |
| `attention` | Phase 6.1 perception dwell + scroll-velocity counters |
| `system` | Phase 6-10 flag helpers + Phase 8.1 topology validator |
| `temporal` | Phase 7.1 evolution registry summary + wall-clock + ISO-week helper (Phase 9.3) |
| `topology` | Phase 8.1 topology registry summary |
| `operational` | Phase 9.1 snapshot composer + Phase 9.3 journal head |
| `environment` | `process.env` (NODE_ENV, VERCEL_REGION, VERCEL_GIT_COMMIT_SHA, NEXT_RUNTIME) |

The 3 intensities (`low | medium | high`) are ordinal-only
— no numerical fields leak through the ambient layer.

### 3.3 Ordinal projection via `projectIntensity`

The schema exposes a single shared helper:

```ts
projectIntensity(count, { low_max, medium_max })
  → "low" | "medium" | "high" | null
```

Each integration view defines its own thresholds:

| Integration | Source primitive | low_max | medium_max |
|-------------|-----------------|---------|------------|
| Perception navigation | event count (aggregate) | 25 | 250 |
| Perception attention (dwell + scroll) | event count (aggregate) | 25 | 250 |
| Topology graph | node count | 10 | 30 |
| Operating weekly commits | commit count (aggregate) | 5 | 25 |

Thresholds live in each integration module (grep-anchored
per `<sym>_THRESHOLDS`). They're tuned for "is there
signal at all" detection — not for high-precision
quantitative inference, which would breach Phase 10's
emotional-engineering prohibition.

### 3.4 Honest null vs synthesised default

When an integration's source flag is OFF (e.g.,
`V5_PERCEPTION_ENABLED` or `V5_OPERATING_TWIN_ENABLED`),
the corresponding domain view returns NULL — not a fake
zero-state synthetic projection.

This is load-bearing privacy + intellectual honesty:

- A `null` operational view means "the operational twin
  flag is OFF". Consumers branch on null = "no signal".
- A zero-valued view would mean "the operational twin is
  ON, and there are zero commits + zero infra etc.".
  Conflating the two would deceive consumers.

Every domain view's null semantics are documented in the
domain registry's `consumer_guidance` field.

### 3.5 Parallel I/O fan-out

`composeAmbientContext()` runs the 4 async integration
views via `Promise.all`. Total cold cost:
`max(perception read, operating compose) ≈ 150-300ms`.

Two integrations are pure reads (~1-5ms each):
- `viewTemporal` — wall-clock + build-time evolution
  summariser
- `viewTopology` — build-time topology summariser

Two integrations are I/O-bound:
- `viewPerception` — 1 HGETALL fan-out (6 categories)
- `viewOperating` — 1 GitHub API call + 8 parallel KV reads
  + 2 KV reads for journal head

The endpoint caches with `s-maxage=300, SWR=3600` — at most
12 compositions/hour worst case.

### 3.6 Edge runtime everywhere

Both endpoints declare `runtime = "edge"`. All integration
sources are already edge-safe per their respective phase
audits. The `detectRuntime()` helper uses ONLY
`process.env.NEXT_RUNTIME` + `typeof EdgeRuntime !== "undefined"`
— no Node-only APIs (this caught one warning in initial
implementation; fixed before final commit).

### 3.7 Per-domain metadata registry

`CONTEXT_DOMAIN_REGISTRY` in `domains.ts` carries the
structural metadata for each domain:

```ts
{
  domain: "operational",
  description: "...",
  upstream_sources: ["lib/v5/operating/snapshot.ts:composeOperationalSnapshot", ...],
  privacy_posture: "Operator-side data only...",
  consumer_guidance: "Use to detect operator's recent engineering velocity..."
}
```

This serves three purposes:
1. The `consumer_guidance` field is the foundation's
   editorial voice — it tells future sub-PR authors HOW
   they may consume each domain WITHOUT crossing into
   personalization.
2. The `upstream_sources` field is the grep-auditable
   provenance trail — any reviewer can verify the privacy
   claim by reading the listed files.
3. The `privacy_posture` field is the load-bearing claim
   reviewers verify against actual behavior.

### 3.8 Telemetry foundation, no consumer

The `v5:ambient:adoption` hash declares 4 event kinds
(`context_composed`, `domain_view_resolved`,
`domain_view_missing`, `context_endpoint_view`). Only
two are fired in 10.1:

- The composer fires `context_composed` + per-domain
  resolved/missing events.
- The endpoint fires `context_endpoint_view` on 200.

No client island fires any of these. The endpoint accepts
all 4 kinds for future consumers; it returns 204 silently
on invalid kinds + malformed JSON.

Flag gate: the `recordAmbientEvent` helper guards on
`isAmbientEnabled()` internally. When the flag is OFF,
NO writes happen. The dev environment can compose the
context without polluting production telemetry.

### 3.9 Public JSON feed honest about state

The `/api/v5/ambient/context` JSON output includes:

- `flag_enabled: true|false` — honest about whether the
  master switch is on
- `domains.<name>: null` — honest about disabled sources
- `signals[*].source` — grep-anchor for provenance
- `signals[*].intensity` — ordinal only

A future ambient consumer reads the JSON and can branch
correctly on:
- `flag_enabled === false` → "the operator hasn't activated
  ambient yet; render nothing"
- `domains.operational === null` → "operating twin flag is
  off; don't surface operational vocabulary"
- `signals.find(s => s.kind === "graph-validation-failed")`
  → "topology validation failed; degrade gracefully"

Without writing visible behavior in 10.1, the contract is
clear for 10.2+ authors.

### 3.10 What this foundation deliberately makes IMPOSSIBLE

- **Per-visitor flow path reconstruction** — `navigation`
  view's `active_categories` is a SET, not an ordered
  sequence. Consumers can detect "perception is active in
  these 3 categories" but cannot derive flow paths.
- **Quantitative attention inference** — all attention
  signals are projected to ordinal `low | medium | high`.
  The numerical event count is exposed only as
  `total_events` for operator audit; a future ambient
  consumer that branches on numerical values fails the
  Phase 10 KIRMIZI ÇİZGİ review.
- **Cross-session linking** — no identifier minted, none
  consumed.
- **Behavioral targeting** — closed allow-lists prevent
  domain sprawl. New domains require a new sub-PR + review.

---

## 4. KIRMIZI ÇİZGİ enforcement

Phase 10 brief's structural prohibitions, mapped to
implementation safeguards:

| Risk | Mitigation in 10.1 |
|------|--------------------|
| Personalization marketing | No per-visitor field; closed domain allow-list; ordinal-only intensities |
| AI recommendation spam | No recommendation surface; no consumer in 10.1; future consumers gated by their own sub-PR review |
| Behavioral manipulation | Foundation-only; nothing in 10.1 manipulates visitor behavior |
| Surveillance | Aggregate-only; perception flag must be ON for any data to flow; visitor consent cookie required at perception layer |
| Emotional engineering tricks | No emotional vocabulary in any view shape; intensity ordinals are detection-purpose only |
| Attention hacking | No client-side runtime; no polling; no global store; pure server-side foundation |
| Creepy "I noticed you..." messaging | No consumer in 10.1; future consumers' KIRMIZI ÇİZGİ review must explicitly prove no such surface emerges |
| Generic AI summary | The latest_narrative is the Phase 9.3 templated journal narrative — no LLM in any composer path |
| Hidden intelligence | The JSON feed is public + the schema + the domain registry are publicly importable. Nothing is hidden |
| Loss of trust | Default OFF; reversible (single-commit revert); explainable (per-domain provenance + consumer guidance fields); typed (no runtime surprise) |

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/ambient/schema.ts` |
| New | `lib/v5/ambient/domains.ts` |
| New | `lib/v5/ambient/flags.ts` |
| New | `lib/v5/ambient/telemetry.ts` |
| New | `lib/v5/ambient/integrations/perception.ts` |
| New | `lib/v5/ambient/integrations/temporal.ts` |
| New | `lib/v5/ambient/integrations/topology.ts` |
| New | `lib/v5/ambient/integrations/operating.ts` |
| New | `lib/v5/ambient/registry.ts` |
| New | `app/api/v5/ambient/context/route.ts` |
| New | `app/api/v5/ambient/event/route.ts` |
| New | `PHASE10_ENTRY_AUDIT.md` (Phase 10 entry document) |
| New | `sub-pr-report/SUB-PR_10.1_REPORT.md` (this report) |

**No edits to any existing file.** The ambient layer
inherits from upstream sources purely through imports;
no source module was modified.

**No new dependencies.** `@vercel/kv` already in tree.

---

## 6. Telemetry schema

Added by 10.1:

```
v5:ambient:adoption  → hash {
  context_composed       : composer ran successfully
  domain_view_resolved   : a domain view returned non-null
  domain_view_missing    : a domain view returned null
  context_endpoint_view  : /api/v5/ambient/context returned 200
}
```

Full V5 adoption hash inventory after 10.1:

```
v5:perception:adoption        (Phase 6.1)
v5:memory:adoption            (Phase 6.4)
v5:temporal:adoption          (Phase 7.1)
v5:topology:graph             (Phase 8.1)
v5:topology:playback          (Phase 7.2)
v5:topology:timeline          (Phase 7.3)
v5:topology:architecture-page (Phase 7.4)
v5:aura:adoption              (Phase 8.4)
v5:contact:adoption           (Phase 8.5)
v5:operating:adoption         (Phase 9.1+9.4)
v5:journal:adoption           (Phase 9.3)
v5:ambient:adoption           (Phase 10.1, NEW)
```

No new V4 scalar counters. No new KV storage keys.

---

## 7. Privacy guarantees

| Invariant | Mechanism in 10.1 |
|-----------|-------------------|
| No per-visitor field anywhere | All integration views project AGGREGATE counts from upstream registries that are themselves aggregate-only |
| No identifier | Composer + endpoints + telemetry helpers accept zero identifiers. The endpoint reads no Cookie, no Authorization, no X-Forwarded-For |
| No fingerprinting | No User-Agent, IP, Accept-Language capture; no client-side runtime |
| Ordinal-only public surface | All intensity fields are `low | medium | high`; numerical fields exposed only as operator-audit primitives (`total_events`, `weekly_commit_count`) |
| Flow paths impossible | `active_categories` is a SET, not an ordered sequence |
| Cross-session linking impossible | No identifier minted, none consumed |
| Honest absences | Disabled-flag sources return `null`; never synthesised zeros |
| Aggregate-only telemetry | HINCRBY one event-kind field by 1; no per-call field |
| Flag-gated telemetry | `recordAmbientEvent` returns early when `V5_AMBIENT_ENABLED` is OFF |
| One-flag dark launch | Single env (`V5_AMBIENT_ENABLED`) controls JSON endpoint + telemetry writes |
| Reversible | Single-commit revert removes every primitive |
| Explainable | Each domain has a `consumer_guidance` + `privacy_posture` field; sources grep-anchored |

---

## 8. Performance posture

| Surface | Measurement |
|---------|-------------|
| `composeAmbientContext()` cold | ~150-300ms when operating flag is ON (composer dominates); ~5-20ms when operating + perception are OFF |
| Endpoint cache | `public, s-maxage=300, stale-while-revalidate=3600` |
| Endpoint payload (current state) | ~1.4 KB JSON (6 signals, 7 domains) |
| Client JS shipped | **0 bytes** — foundation has no client island |
| Tree-shake friendliness | Each integration is its own module; consumers can `import { viewPerception }` without bundling other integrations |
| Page render impact | None — no page imports or mounts the registry |
| Bundle delta on existing routes | **0 bytes** |

Bundle posture verified against `.next/static/**`:

| Symbol | Count in client static |
|--------|------------------------|
| `composeAmbientContext` | 0 |
| `recordAmbientEvent` | 0 |
| `readAmbientAdoption` | 0 |
| `AMBIENT_ADOPTION_HASH_KEY` | 0 |
| `isAmbientEnabled` | 0 |
| `V5_AMBIENT_ENABLED` | 0 |
| `viewPerception` | 0 |
| `viewTopology` | 0 |
| `viewOperating` | 0 |
| `viewTemporal` | 0 |
| `CONTEXT_DOMAIN_REGISTRY` | 0 |
| `@vercel/kv` | 0 |

Tarballs unchanged:
- `lumina-chat`: 23.7 kB
- `emredogan-cli`: 13.5 kB

---

## 9. Edge / runtime notes

- `/api/v5/ambient/context` declares `runtime = "edge"`.
  Build registers as `ƒ Dynamic` (flag check forces dynamic).
- `/api/v5/ambient/event` declares `runtime = "edge"`.
  Build registers as `ƒ Dynamic`.
- The composer is itself edge-safe (every imported function
  verified edge-safe in its source phase audit).
- `detectRuntime()` uses only `process.env.NEXT_RUNTIME` +
  `typeof EdgeRuntime !== "undefined"` — no Node-only API.
  Initial implementation used `process.versions?.node`
  which triggered an edge-runtime warning; fixed before
  final commit.

---

## 10. Rollback plan

Single-commit revert removes:

- 9 new files in `lib/v5/ambient/` (including `integrations/`
  subdirectory)
- 2 new routes under `app/api/v5/ambient/`
- `PHASE10_ENTRY_AUDIT.md`
- This report

KV state orphaned after revert:
- `v5:ambient:adoption` hash — may have counts if the
  endpoint was exercised before revert. Can be `DEL`'d
  manually if desired.

No schema break, no env-var rollback (the new
`V5_AMBIENT_ENABLED` env stays unset by default). The repo
reverts to the 9.4 tip exactly.

Mid-flight rollback without code revert:
- Unsetting `V5_AMBIENT_ENABLED` → JSON endpoint 404s;
  composer remains callable for dev/test; telemetry no-ops.
- Replacing the route files with permanent 404s → endpoints
  always 404; composer remains importable.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on `lib/v5/ambient/` + `app/api/v5/ambient/` | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 53 static pages, 0 warnings (initial run had 1 edge-runtime warning re `process.versions`; fixed by restricting detection to `NEXT_RUNTIME` + `EdgeRuntime`) |
| `/api/v5/ambient/context` registered as `ƒ Dynamic` (edge) | ✓ |
| `/api/v5/ambient/event` registered as `ƒ Dynamic` (edge) | ✓ |
| Flag OFF: `/api/v5/ambient/context` → 404 | ✓ |
| Flag OFF: `/api/v5/ambient/event` POST → 204 silent | ✓ |
| Flag OFF: `/api/v5/ambient/event` GET → 405 | ✓ |
| Flag ON: `/api/v5/ambient/context` → 200 application/json, ~1.4 KB | ✓ |
| Flag ON: JSON validates against schema (7 domains, 6 signals, honest nulls for disabled sources) | ✓ |
| Flag ON: cache header `public, s-maxage=300, stale-while-revalidate=3600` | ✓ |
| Flag ON: `/api/v5/ambient/event` POST valid kind → 204 | ✓ |
| Flag ON: invalid kind → 204 silent | ✓ |
| Flag ON: malformed JSON → 204 silent | ✓ |
| Flag ON: GET → 405 | ✓ |
| Existing routes unaffected (`/api/v5/operating/snapshot`, `/api/v5/topology/graph`, `/v5/perception`, `/evolution`, `/telemetry`) | ✓ 200 all |
| Server-only ambient symbols absent from `.next/static` | ✓ 0 matches across 12 distinct symbols |
| `@vercel/kv` absent from client static bundle | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| No new dependencies | ✓ `package.json` unchanged |
| No edits to existing files (foundation discipline) | ✓ pure additive |
| Phase 10 KIRMIZI ÇİZGİ (no visible behavior, no adaptation, no recommendation, no Lumina coupling) | ✓ structurally enforced |
| Anti-Generic-AI Law (no LLM call in any path) | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Future ambient systems unlocked

Sub-PR 10.1 ships the typed foundation. Future ambient
consumers (Sub-PR 10.2+) may optionally read from it. The
foundation explicitly supports:

- **Lumina conversation context seeding** (V5 § 5.5 original
  10.1 scope, deferred to 10.2+) — a future Lumina handler
  could `import { composeAmbientContext } from "@/lib/v5/ambient/registry"`
  and consume the operational + temporal + topology domain
  views as deterministic conversation context. The ambient
  view contracts are sufficient: Lumina would read
  `domains.operational.weekly_commits` as "high/medium/low"
  and adjust its recall depth accordingly, without ever
  surfacing the underlying number to the visitor.
- **Subtle aura modulation** (V5 § 9 ambient aura) — the
  Phase 8.4 aura system could read `domains.temporal.day_of_week`
  + `domains.operational.weekly_commits` as context for its
  color temperature without writing new code in the aura
  package itself.
- **Operator-side context console** — an admin-only surface
  could render the JSON feed as a real-time view of the
  ecosystem's ambient state for monitoring. The JSON
  contract is stable + grep-auditable.
- **External script consumption** — any operator tool
  (CLI, Slack bot, RSS) can fetch `/api/v5/ambient/context`
  + branch on the typed JSON without bundling the
  registry.
- **Future ambient domain additions** — new domains can be
  added to `CONTEXT_DOMAINS` allow-list via a new sub-PR.
  The schema's `validateAmbientContext` function ensures
  shape stability.

---

## 13. Deferred systems

Sub-PR 10.1 deliberately defers (and reserves for explicit
operator approval):

- **Sub-PR 10.2** — first visible ambient consumer (TBD
  per operator's discretion — Lumina conversation seeding
  is the strongest candidate per V5 § 5.5; subtle aura
  modulation is the second).
- **Sub-PR 10.3** — identity-native intelligence law's
  final manifestation (per V5 § 5.5; conditional on 10.2
  observation + privacy backlash signal).
- **`/v5/ambient` public transparency page** — the JSON
  feed is honest; a paired transparency page can ship in
  10.2+ if the operator wants visitor-facing transparency
  for the ambient layer itself.
- **Sitemap entries for ambient endpoints** — JSON feeds
  aren't typically in sitemaps; defer.
- **External narrative integration** — the ambient context
  could feed into external systems (auto-tweet, OG cards,
  notifications). Defer until clear use case.

Permanently rejected (Phase 10 brief + V5 § 2.4):

- Generic "ambient summarisation" LLM call — Anti-Generic-AI
  Law.
- Per-visitor ambient personalisation — Phase 10 KIRMIZI
  ÇİZGİ.
- Real-time ambient feed (SSE / WebSocket) — V5 § 2.5
  (no realtime spectacle).
- Cross-visitor pattern detection — V5 § 4.1 (asla mention
  edilmez); structurally impossible by aggregate-only design.
- Client-side ambient runtime — Phase 10 Performance Law
  (no client inference engine).
- Recommendation surface (any kind) — Phase 10 KIRMIZI
  ÇİZGİ.

---

## 14. Affected system analysis

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/ambient/` namespace + 2 new edge routes. Pure additive — zero edits to existing source modules |
| Perception (Phase 6) | Read-only — `viewPerception` reads `readPerceptionSnapshot` + `isPerceptionEnabled`. Unchanged |
| Temporal (Phase 7) | Read-only — `viewTemporal` reads `summariseEvolutionRegistry` + `currentIsoWeek`. Unchanged |
| Topology (Phase 8) | Read-only — `viewTopology` reads `summariseTopologyRegistry` + `getTopologyValidationFailure`. Unchanged |
| Operating (Phase 9.1) | Read-only — `viewOperating` reads `composeOperationalSnapshot`. Unchanged |
| Journal (Phase 9.3) | Read-only — `viewOperating` reads `listRecentJournalEntries(1)` for narrative head. Unchanged |
| Lumina (V4) | **No coupling** in 10.1. Phase 10.2+ may opt to wire it |
| Telemetry | One new V5 hash + 4 event kinds. No V4 scalar changes |
| Feature flag | One new env (`V5_AMBIENT_ENABLED`); default OFF; gates JSON endpoint + telemetry writes |
| Bundle | 0 bytes client. Server route only |
| Privacy | Aggregate-only inherited from sources + reinforced (ordinal-only public surface) |
| Maintenance | ~1 hr/mo projected. Lowest-overhead sub-PR in V5 |
| Rollback | Single-commit revert clean. KV state orphans harmlessly |
| Identity | No visual identity change (no UI surface). Foundation only |

---

## 15. Phase 10 disposition + next step

**Sub-PR 10.1 is the FOUNDATION.** Per the user's brief:

> Continue using:
> * ONE Sub-PR at a time
> * ONE atomic commit
> * PUSH after EACH Sub-PR
> * STOP after EACH Sub-PR
> * WAIT for approval

The default disposition after 10.1 is STOP and observe.
The operator may:

1. **Approve Sub-PR 10.2** — first visible ambient
   consumer. The brief originally scopes this as Lumina
   conversation seeding (V5 § 5.5). Lumina coupling is
   the strongest justifiable consumer for the Identity-
   Native Intelligence Law's final manifestation.
2. **Defer Phase 10.2 indefinitely** — V5 § 4.5 makes
   Phase 10 conditional. Sub-PR 10.1 alone is a valid
   stopping point; the foundation sits dormant + harmless.
3. **Pause and observe** — flip `V5_AMBIENT_ENABLED=1` in
   production, monitor the `v5:ambient:adoption` hash for
   composition health, decide on 10.2 after a window.

**The agent's recommendation:** option 3. The foundation is
solid; observation before consumer coupling reduces risk.

Awaiting explicit approval per the V5 operating
constitution + Phase 10 brief.

---

## 16. Closing — the nervous system, not the visible intelligence

Phase 10's risk is the highest in V5. The foundation Sub-PR
10.1 ships is the environmental nervous system — typed,
aggregate-only, ordinal-projected, default-OFF, reversible,
explainable, and consumer-free.

What 10.1 makes possible:
- Future ambient consumers reading a stable typed contract
- Operator-side debugging of ecosystem context via the
  JSON feed
- Phase 10.2+ scope without re-deriving any context
  primitive

What 10.1 makes IMPOSSIBLE:
- Per-visitor flow path reconstruction
- Quantitative emotional inference
- Cross-session linking
- Behavioral targeting
- Recommendation surfacing
- "We noticed you..." messaging
- Any visible Phase 10 behavior at all

The visitor experience is **unchanged** after 10.1 lands.
The foundation sits dormant. The operator decides what
(if anything) consumes it next.

Phase 10's mandate — "this ecosystem feels unusually
aware, yet strangely respectful" — survives only if the
foundation is delicate enough to support the visible
surface without forcing it. Sub-PR 10.1 is delicate.

STOP. Awaiting approval before any 10.2 consideration.
