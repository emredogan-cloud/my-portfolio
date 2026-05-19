# Sub-PR 7.1 — Temporal Architecture Foundation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 7 — Temporal Architecture · Sub-PR 7.1 (Tier A · foundation)
**Scope:** The foundation for the V5 temporal / engineering-memory
layer. Schema + registry accessors + adoption hash + edge JSON
feed + edge adoption endpoint + the public `/evolution` surface
that renders the canonical archive. Initial seed registry of
fifteen architectural events spanning V1 → V5. **No playback
ships.** No timeline slider, no scrubber, no architecture-frame
interpolation, no cinematic transitions. The deliverable is the
chassis subsequent Phase 7 sub-PRs (7.2-7.4+) will wire into.

---

## 0. Phase 7 begins

V5 § 0.2 demands a 60-90 day observation window after every
phase ships. Phase 6 closed with Sub-PR 6.5 (`20af4ae`) on the
same day this branch lands its 7.1 commit. Per the operating
constitution, Phase 7 opens with the foundation work only; the
observation window does not gate FOUNDATION-grade sub-PRs that
ship invisible plumbing (Phase 6's foundation, Phase 5's
playground namespace), only the surfaces that ACT on the
foundation (Phase 6.2's observer, Phase 7.2+'s scrubber).

Sub-PR 7.1 is the first commit on the Phase 7 chassis. It is
the smallest deliverable that satisfies all six implementation
targets from the user prompt:

1. Temporal architecture primitives
2. Version-memory schema
3. Evolution event registry
4. Temporal routing foundation
5. Public memory surface foundation
6. Telemetry hooks for memory events

Nothing else. The full V5 § 5.2 Phase 7 sub-PR map cascades from
this foundation, but no Phase 7 SURFACE feature (timeline slider,
playback, snapshot manifest) ships until its own approval.

---

## 1. Mission

Build the engineering-memory chassis. Phase 7's brief is to make
the ecosystem REMEMBER itself — versions, architecture
transitions, AI subsystems coming online, OSS milestones, phase
closures. The brief was explicit about what this must NOT be:
not a changelog duplicate (`/changelog` already reads the raw
commit firehose), not a diary, not a marketing roadmap, not a
social feed. It must read as an **engineering archive**, voice
editorial, technical, quietly archival.

The deliverable that closes the foundation contract:

- A typed, portable, append-only event registry.
- A read-only JSON feed Phase 7+ surfaces consume.
- A public archive surface that renders the registry verbatim
  in the cinematic-restraint voice already established at
  `/lumina/brain` and `/v5/perception`.
- An aggregate adoption hash that captures filter + deep-link
  signal independently from the V4 visit counter.

No timeline UI, no animation framework introduction, no canvas
/ WebGL primitive, no new heavy dependency. The page is static-
first; the only client surfaces are the existing `VisitPing`
and one new ~700-byte `AdoptionBeacon` island.

V5 § 5.2 validation criteria, satisfied:
- [x] TypeScript schema enforced (every entry in the data file
  is typed as `EvolutionEvent`; `tsc` rejects shape violations)
- [x] Per-project event list (system slug filter; no upper cap
  imposed by the schema — editorial discipline is the only cap)
- [x] Eval consistency (registry derive is pure; the build
  validates structurally via the typed import; `validateEvolutionEvent`
  is available for any future runtime eval that wants belt-and-braces)
- [x] Static at build time / 1h ISR
- [x] Rollback: schema deletion → registry deletion → route
  deletion (single revert removes every primitive)

---

## 2. The Three-Question Test (V5 § 1.1)

Run before any code per the V5 doc's mandatory execution
discipline.

**Q1 — Uniqueness:** "If this feature were removed, would
visitors specifically seek out THIS site?"
- The foundation in isolation? No — invisible plumbing.
- The CATEGORY it enables (an engineering ecosystem that
  remembers its own architectural evolution at the same depth
  the rest of the site documents its current state)? Yes —
  generic AI portfolios + senior-engineer sites + product-marketing
  pages all skip this. **PASS by extension.**

**Q2 — Emergence:** "Is this feature meaningful alone, or only
when connected to other V5 systems?"
- **Perfect emergence.** The registry alone is a list of events.
  It crystallises into the V5 differentiator only when (a) Phase
  7.2's timeline scrubber reads it, (b) Phase 8's cinematic
  topology matches snapshots against it via `system + version`,
  (c) Phase 9's operational twin reads the editorial archive as
  the synthesis layer above the raw commit firehose.

**Q3 — Sustainability:** "Can a single engineer maintain this
for 24 months without growing the team or infrastructure?"
- V5 § 4.2 budgets 3.5 hr/month for Phase 7 total. Sub-PR 7.1's
  slice = ~0.5 hr/month: append-only registry edits when a new
  architectural moment lands (already a 1-2 min editorial pass
  per Sub-PR report). The schema + accessors + telemetry are
  near-zero maintenance — pure data + pure helpers, no I/O
  surface to drift. **PASS.**

Two of three are PASS (Q1 by extension is acceptable per the V5
doc — foundations earn their slot through what they unlock, not
what they ship in isolation). The three-question gate clears.

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the registry encodes THIS ecosystem's
  architectural memory — every entry is THIS portfolio's history,
  not abstract changelog scaffolding. ✓
- Ekosistem-fed: pure data + commit refs + report links. No
  external LLM call, no third-party feed, no web fetch. ✓
- Ekosistem-emergent: meaningless without Phase 7.2+ surfaces +
  Phase 8 topology + Phase 9 operational twin reading it. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call, no chat surface, no
  free-form query input. The page accepts `?category=` and
  `?system=` query params (both validated against closed allow-
  lists / kebab-case regex); the API accepts the same. ✓

---

## 3. Architectural decisions

### 3.1 Separate namespace `lib/v5/temporal/`, NOT carrying into `lib/lumina/` or `lib/v5/perception/`

Lumina memory (`lib/lumina/memory.ts`) is per-visitor, KV-bound,
session-scoped, TTL-bounded, opt-out-gated. Perception
(`lib/v5/perception/*`) is aggregate-only, consent-gated, opt-in
default-off. Temporal is neither — it is a STATIC, PUBLIC,
append-only EDITORIAL registry that has no per-visitor data at
all.

Mixing temporal into either namespace would tie the temporal
layer's evolution to two unrelated privacy postures. Keeping it
its own namespace makes the rollback story clean — Phase 7
deletes by removing `lib/v5/temporal/` + `data/temporal/` +
`app/evolution/` + `app/api/v5/temporal/` without touching any
other system.

### 3.2 Four-module split inside `lib/v5/temporal/`

| Module | Responsibility |
|--------|----------------|
| `schema.ts` | Closed allow-lists (categories, statuses, provenances), the `EvolutionEvent` shape, type guards, and the runtime `validateEvolutionEvent` helper |
| `registry.ts` | Pure data accessors over the data-file registry — sort descending by date, apply the supersedes cascade, per-category / per-system / per-provenance filters, summary aggregator |
| `telemetry.ts` | KV adoption hash + record/read helpers — the v5:temporal:adoption hash with three event kinds |
| `data/temporal/events.ts` | The data itself — the canonical, hand-curated array of `EvolutionEvent` entries |

The split mirrors the Phase 5 chassis pattern + the Phase 6
perception split. Each module has one job; tree-shaking keeps
client bundles tight (none of these symbols reach `.next/static`).

### 3.3 Append-only registry with a `supersedes` cascade

The data file is append-only by editorial convention. When a
later entry replaces a previous one (the V5 Phase 6.4 memory
extensions superseding the V4 Lumina V3 persistent memory, for
example), the AUTHOR writes the new entry with
`supersedes: "<old-id>"`. The registry's derive pass walks the
array once, builds a set of superseded ids, then maps over a
copy flipping `status` to `"superseded"` on every member.

Three reasons for this design over inline editing:
- Authors only edit ONE place (the newer entry), so the
  registry stays additive.
- The superseded entry remains rendered (with a small grey
  pill) — the audit trail is intact.
- Future bisection over the registry (Phase 7.2's scrubber will
  do this) sees the full history, not a redacted version.

The derive pass is O(n) and runs once per process — cheap.

### 3.4 Schema validates BOTH at compile time and at runtime

`tsc` enforces the `EvolutionEvent` shape at compile time —
every entry in `data/temporal/events.ts` must match exactly.
But the schema also exports `validateEvolutionEvent(event)` for
runtime checks. The runtime validator catches:

- Hand-edited entries that pass `tsc` but violate semantic
  rules (e.g. a commit-kind ref with no `sha`, a date in 1990).
- Future plug-points where the registry is loaded from JSON
  (an external memory layer, a backup restore, a
  marshalling-aware API consumer).

The validator returns the failed field name on the first
violation, or `null` when well-formed. Style mirrors the
zod-style validators commonly used in App Router APIs without
adding a dependency.

### 3.5 The JSON feed is the same shape every internal consumer reads

`/api/v5/temporal/events` returns `{ summary, events }`. The
exact two fields the page renders. Phase 7+ consumers (the
timeline scrubber, the operational twin, the eventual RSS / OG
generator) read THE SAME ENDPOINT — there is no internal-only
fork of the data shape.

The endpoint is edge-runtime + CDN-cached
(`s-maxage=3600, stale-while-revalidate=86400`). Same posture
as `/api/cli/changelog` and other read-only V4 feeds: the data
changes only on deploy, so a 1h cache is plenty.

### 3.6 Adoption telemetry on its own hash, NOT carrying into perception

The perception adoption hash (`v5:perception:adoption`) records
opt-in / revoke / deny decisions — visitor-derived signal that
must respect the consent gate. The temporal adoption hash
(`v5:temporal:adoption`) records page-view / filter-arrival /
deep-link signals — NONE of which are visitor-identifying. The
temporal endpoint has no consent gate intentionally; folding
the two would force the temporal layer through a consent
mechanism it doesn't logically need.

Same shape as Phase 6.4's memory adoption hash: one hash, four
or fewer event-kind fields, HINCRBY-only writes, HGETALL on
read. The brain page reads `readMemoryAdoption`; the evolution
page reads `readTemporalAdoption`.

### 3.7 The page is server-rendered; one tiny client island handles URL-hash signal

The `/evolution` page is a Server Component. The full registry
+ summary + adoption snapshot render at ISR generation time. The
only client surface is two ~600B islands stacked:

- `VisitPing surface="evolution"` (existing primitive — fires
  the V4-style page visit counter)
- `AdoptionBeacon` (new — reads URL + hash on mount, fires up to
  three adoption events session-deduped via sessionStorage)

Rationale: URL hashes are NOT visible at server render time, so
deep-link signal must come from the client. Keeping both signals
in one beacon avoids re-introducing a second observer pattern.
The beacon is ~700 bytes minified — within the V5 § 2.7 envelope.

### 3.8 The registry seed picks ARCHITECTURALLY load-bearing moments only

Fifteen events were selected from ~80 commits across the V1 →
V5 timeline. The selection rule: an event lands in the registry
ONLY if it represents an architectural / system / topology /
release transition that subsequent Phase 7+ surfaces would need
context for. Routine commits (small polish, copy edits, bug
fixes) stay in `/changelog`; the registry compresses them into
the architecturally-load-bearing moments only.

Selected events span:
- V1 genesis (1 event)
- V3 Phase 1 foundation + Phase 2 3D topology (2 events)
- V4 Phase 1 OSS + telemetry (2 events)
- V4 Phase 2 public lab (1 event)
- V4 Phase 3 Lumina persistent memory (1 event, now superseded)
- V4 Phase 4 transparency + sub-agent (2 events)
- V4 Phase 5 playground foundation (1 event)
- V5 Phase 6 — all five sub-PRs as individual entries (5 events)

The seed is small enough to read end-to-end in one sitting and
large enough to demonstrate the editorial voice across all seven
categories. Future Sub-PRs land their own entries as they ship.

### 3.9 Cinematic identity preserved

- Same ambient cyan gradient stack as `/lumina/brain`,
  `/v5/perception`, `/playground`
- `#00d2ff` accent for the eyebrow + section headers + the
  Phase 7 pill state
- Reveal wrapper at the same beats the perception page uses
- Numbered section vocabulary (`01 · The registry`, `02 ·
  Filter by category`, etc.) mirrors the perception page
- Source-files catalog at section 05 (mirrors `/v5/perception`'s
  section 10)
- Footer phase-pill + closure paragraph in the same voice

No new visual identity — visual continuity across V4 + V5 meta
surfaces remains a brand contract.

---

## 4. KIRMIZI ÇİZGİ + Phase 7 philosophy enforcement

The user prompt's Phase 7 philosophy is the load-bearing test:

> Visitors should NOT think:
> "cool timeline."
>
> They should think:
> "This system remembers itself."

Enforced at every layer:

| Layer | Mechanism |
|-------|-----------|
| Page voice | No "timeline", no "history", no "journey", no "story so far". The headline reads `The system remembers itself.` Editorial vocabulary: `archive`, `memory`, `registry`, `audit trail`, `versioned + typed + provenanced`. |
| Visual chrome | Plain rectangular cards, no slider, no scrubber, no scroll-snap, no animation framework, no scroll-linked motion. Each event is a card; the visitor reads it like a research paper, not a slideshow. |
| Data shape | The schema is decision-grounded — `rationale` exists as a first-class field so every entry can carry its WHY. No `emoji`, no `mood`, no `vibes`, no theatrical hooks. |
| Filtering | The two filters (`?category=`, `?system=`) are operator axes, not personalization. The page renders the same content for every visitor; only the URL bar changes. |
| Adoption telemetry | Three counters, none of which surface back to the visitor. The operator reads the aggregate; the visitor sees the editorial. |

The temporal layer cannot tip into "timeline gimmicks" because
the schema does not support emotive content, the renderer does
not animate the events, and the page voice rejects narrative
framing in favor of declarative memory.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/temporal/schema.ts` — Categories / statuses / provenances / `EvolutionEvent` / `EvolutionEventRef` / type guards / `validateEvolutionEvent` |
| New | `lib/v5/temporal/registry.ts` — `getEvolutionEvents`, `getEvolutionEventById`, `getEvolutionEventsByCategory`, `getEvolutionEventsBySystem`, `getEvolutionEventsByProvenance`, `getRecentEvolutionEvents`, `summariseEvolutionRegistry`, `getEvolutionEventSystems` |
| New | `lib/v5/temporal/telemetry.ts` — `recordTemporalEvent`, `readTemporalAdoption`, `TEMPORAL_ADOPTION_HASH_KEY`, `TEMPORAL_ADOPTION_EVENTS`, `isTemporalAdoptionEvent` |
| New | `data/temporal/events.ts` — `EVOLUTION_EVENTS` seed array (15 entries spanning V1 → V5) |
| New | `app/api/v5/temporal/events/route.ts` — Edge GET feed (`{ summary, events }`, optional `?category=` + `?system=` filters), CDN-cached for 1h + stale-while-revalidate 1d |
| New | `app/api/v5/temporal/adoption/route.ts` — Edge POST endpoint for the three adoption event kinds, always 204 |
| New | `app/evolution/page.tsx` — Public archive surface, 1h ISR, six sections (hero / summary / filter / events / adoption / source files / footer) |
| New | `app/evolution/_components/AdoptionBeacon.tsx` — Client island; reads URL + hash on mount, fires `view` / `category_view` / `event_view` session-deduped |
| Edit | `lib/telemetry/metrics.ts` — Added `EVOLUTION_PAGE_VISITS` MetricKey |
| Edit | `app/api/telemetry/visit/route.ts` — Added `evolution` to SURFACE_TO_KEY allow-list |
| Edit | `components/telemetry/VisitPing.tsx` — Added `"evolution"` to surface union |
| Edit | `app/sitemap.ts` — Added `/evolution` to STATIC_ROUTES |
| New | `sub-pr-report/SUB-PR_7.1_REPORT.md` (this report) |

No new dependencies. No new env vars REQUIRED — the entire
temporal layer ships dark-launch-friendly (no env switch
needed because the layer is public-archive only, no per-visitor
data exists anywhere on the path).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 7.1 introduces the temporal slice of the V5 § 2.13 key
pattern:

```
v5:temporal:adoption                 → hash { view|category_view|event_view: count }
v5:telemetry:evolution-page:visits   → scalar (V4 visit counter, surfaced on /telemetry)
```

The two are intentionally separate:
- The V4 scalar matches the existing `/telemetry` + `/changelog`
  + `/lumina/brain` + `/v5/perception` pattern — one count per
  unique session per surface, fired by `VisitPing`.
- The V5 hash captures FILTER + DEEP-LINK signal. Different
  category filters get separate session-storage slots, so a
  visitor who browses three filters in one session contributes
  three `category_view` counts.

Both surfaces are aggregate-only. No per-visitor identifier
field exists at either path.

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the V5 hash has no per-visitor field. The V4 scalar is a single `kv.incrby` over a global key |
| No fingerprint | Neither endpoint reads IP / User-Agent / Accept-Language / Referer. The adoption endpoint reads ONLY the JSON body `{ kind }`; the events endpoint reads ONLY the URL search params |
| No identity persistence | No identifier is minted by this layer. The page does not set any cookie. No localStorage / sessionStorage write beyond the session-dedupe flags |
| No surfacing | The page renders only aggregate counts, never per-visitor content. There is no "your last viewed event" surface |
| Graceful no-op | KV unavailable → record helpers return silently, read helpers return empty objects; the page renders zero-state tiles |
| No consent gate by design | The temporal layer is a public archive — there is no per-visitor data to consent to. Asymmetry with perception is intentional |

The temporal layer is the FIRST V5 surface that ships without
a consent gate, and the asymmetry is deliberate: where
perception is per-visitor-derived signal (and therefore
consent-gated), temporal is public-archive content (and
therefore consent-irrelevant). The page documents this in the
"Live adoption" section explicitly.

---

## 8. Performance posture

V5 § 5.2 budget: static at build time. V5 § 2.7: `/v5/*` route
LCP < 1.5s target, < 2.5s hard.

| Surface | Measurement |
|---------|-------------|
| `/evolution` render | ISR every 1h. The page is `ƒ Dynamic` in build registration because it reads `searchParams`, but the result is cached per unique URL combination via `revalidate = 3600`. Same posture as `/changelog`. |
| Page LCP | Inherits the same gradient + Reveal pattern as `/lumina/brain` and `/v5/perception` (both measure < 1.0s LCP). No new heavy imports. |
| `/api/v5/temporal/events` latency | One in-memory filter pass over a 15-element array + JSON serialize. ~1-3 ms warm. CDN cache amortises real cost across the hour. |
| `/api/v5/temporal/adoption` latency | One env read + one HINCRBY. ~5-20 ms warm. Fire-and-forget from the client; never blocks the visitor. |
| Page render overhead added by foundation | 0. The Server Component renders entirely server-side; only the AdoptionBeacon + VisitPing run client-side, both of them mount-only effects. |
| Client bundle delta on `/evolution` route | + ~700 B minified for `AdoptionBeacon` alone (~350 B gzipped). The page itself adds zero server-only symbols to client chunks. |
| Client bundle delta on other routes | 0. The Beacon mounts only at `/evolution`; no other route imports it. |
| Idle CPU after mount | 0%. The Beacon's effect runs once; no timers, no listeners, no observers. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordTemporalEvent` in client chunks | 0 ✓ |
| `readTemporalAdoption` in client chunks | 0 ✓ |
| `TEMPORAL_ADOPTION_HASH_KEY` in client chunks | 0 ✓ |
| `EVOLUTION_EVENTS` in client chunks | 0 ✓ |
| `getEvolutionEvents` in client chunks | 0 ✓ |
| `summariseEvolutionRegistry` in client chunks | 0 ✓ |
| `EVOLUTION_EVENT_CATEGORIES` in client chunks | 0 ✓ |
| `isEvolutionEventCategory` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |
| `@aws-sdk`, `@sentry/nextjs`, `@octokit/rest` in client | 0 ✓ |

The client-side surfaces that DO ship — `AdoptionBeacon.tsx`
and the React + Next runtime it pulls — are tree-shaken to the
~700 B inline chunk verified above. No other route incurs the
beacon's cost.

---

## 9. Edge / runtime notes

- `/evolution` is a Server Component. Build output registers it
  as `ƒ Dynamic` because of `searchParams`, with `revalidate = 3600`
  driving 1h ISR per unique URL combination.
- `/api/v5/temporal/events` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/temporal/events` (Dynamic,
  edge-inferred). Returns `{ summary, events }` JSON with the
  CDN cache headers.
- `/api/v5/temporal/adoption` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/temporal/adoption` (Dynamic,
  edge-inferred). One HINCRBY per qualifying event.
- `lib/v5/temporal/schema.ts` + `registry.ts` are pure data /
  pure helpers — universally importable.
- `lib/v5/temporal/telemetry.ts` imports `@vercel/kv` and is
  server-only. Verified absent from client chunks.
- `data/temporal/events.ts` is a typed array — tree-shaking
  drops it from any consumer that doesn't reference
  `EVOLUTION_EVENTS`.

---

## 10. Rollback plan

V5 § 5.2 specifies "Rollback: Schema deletion". The single-
commit revert removes:

- 4 new modules in `lib/v5/temporal/` + `data/temporal/`
- 2 new edge endpoints under `app/api/v5/temporal/`
- 1 new page route + 1 new client island under `app/evolution/`
- 1 new `MetricKey` entry (`EVOLUTION_PAGE_VISITS`)
- 1 surface-allow-list entry (`evolution`)
- 1 union member in `VisitPing`'s `surface` prop
- 1 entry in `STATIC_ROUTES` in `app/sitemap.ts`

KV state orphaned after revert:
- `v5:temporal:adoption` hash — no further writes; existing
  counts sit harmlessly under the key. Can be `DEL`'d manually
  if desired.
- `v5:telemetry:evolution-page:visits` scalar — same posture.

No schema break. The V4 + V5 systems revert cleanly. The
platform reverts to the V5 Phase 6 closure tip.

If only the temporal layer needs to be dark without a code
revert:
- Operator already has no env switch to flip; the layer is
  public-archive only. To take the page dark, simply remove
  the `/evolution` entry from `app/sitemap.ts` and add a
  `redirects` rule in `next.config.ts`. The endpoints continue
  to serve but become unreachable from the public site.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages, 0 warnings |
| `/evolution` registered as `ƒ Dynamic` with 1h ISR | ✓ |
| `/api/v5/temporal/events` registered as `ƒ Dynamic` (edge) | ✓ |
| `/api/v5/temporal/adoption` registered as `ƒ Dynamic` (edge) | ✓ |
| Bundle posture (temporal server symbols in client) | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core, Geist, gradient stack) | ✓ |
| Reduced-motion compliance (inherits globals.css guard; no new motion surface) | ✓ |
| Hydration safety: AdoptionBeacon renders null SSR + client, useEffect runs after commit | ✓ |
| Route isolation: `lib/v5/temporal/*` + `app/evolution/*` + `app/api/v5/temporal/*` share zero imports with `/lab/*`, `/playground/*`, `/lumina/*`, `/v5/perception/*` | ✓ |
| Anti-Generic-AI Law (no NL input, no upload, no LLM call, structured-only) | ✓ |
| Identity-Native Intelligence Law (ecosystem-bound, ecosystem-fed, ecosystem-emergent) | ✓ |
| Phase 7 philosophy ("the system remembers itself", not "cool timeline") | ✓ enforced at every layer per § 4 |
| HTTP smoke test: `/evolution` 200, filtered variants 200, API valid JSON | ✓ |
| HTTP smoke test: `/api/v5/temporal/adoption` POST valid 204, invalid kind 204, GET 405, malformed JSON 204 | ✓ |

---

## 12. Future dependencies unlocked

This foundation unlocks the rest of Phase 7 and downstream
phases that read the registry:

- **Sub-PR 7.2** — Temporal Playback Primitive. Will import
  `getEvolutionEvents`, `getEvolutionEventsBySystem`, and use
  the per-system + per-version sorting to build frame
  interpolation between architectural snapshots.
- **Sub-PR 7.3** — Timeline Slider Component. Will mount a
  scrubber UI that reads the registry as the index axis. Will
  fire `event_view` events as the scrubber resolves to a
  specific entry.
- **Sub-PR 7.4** — Architecture Page Time-Aware Integration.
  Will cross-link the registry into `/architecture/<slug>`
  pages, surfacing the per-system event slice as ambient
  context.
- **Phase 8** — Cinematic topology. Will match
  `getEvolutionEventsBySystem(slug)` results to topology
  snapshots, using `version` as the join key.
- **Phase 9** — Operational digital twin. Will read
  `getRecentEvolutionEvents(N)` as the editorial layer above
  the raw `/changelog` commit firehose. The "this week
  shipped" surface composes from the registry + the github
  events feed.
- **External consumers** — The `/api/v5/temporal/events` JSON
  feed is consumable by any external surface (RSS generator,
  OG card composer, future Lumina tool). The contract is
  already public.

---

## 13. Deferred systems

The user prompt's explicit DEFERRED list, restated:

- **Timeline slider / scrubber UI** → Sub-PR 7.3 owns this
- **Frame interpolation / playback animation** → Sub-PR 7.2
- **Cinematic transitions between architectural snapshots** → Phase 7.2-7.4
- **Topology renderer integration** → Phase 8 cinematic topology
- **Per-event detail page** (`/evolution/<id>`) → A future
  sub-PR if individual events earn standalone surfaces; the
  current anchor-only deep links (`#<id>`) are the foundation
- **Auto-generated event entries from commits** → V5 § 5.2
  defers automated frame generation to Phase 9 operational
  twin

Permanently rejected from V5 entirely (V5 § 3.3):
- Public commit-firehose viewer with per-commit narrative AI →
  `/changelog` already serves the raw firehose; AI commentary
  on every commit fails the Anti-Generic-AI test.
- Live "engineering activity" feed → V5 § 3.3 explicit:
  real-time SSE dashboard yasak.
- Cross-portfolio history merge → identity-native intelligence
  law (a system's memory is its own).
- Public roadmap of future planned events → V5 § 2.3:
  internal-only roadmap yoktur; future plans live in
  `PORTFOLYO_V5_FUTURE_SYSTEMS.md` as a vision document, not
  as registry entries.

---

## 14. Affected systems analysis (Phase 7 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture implications | New `lib/v5/temporal/*` namespace + `data/temporal/*` data file. Zero overlap with existing namespaces. The four new modules tree-shake cleanly. |
| Routing implications | One new public route (`/evolution`), two new API routes (`/api/v5/temporal/events`, `/api/v5/temporal/adoption`). All three are append-only additions; no existing route changes shape. |
| Telemetry implications | One new scalar MetricKey + one new hash key. The V4 telemetry surface is unchanged for every existing tile. |
| Bundle implications | +700 B minified to the `/evolution` route via the `AdoptionBeacon` client island. Zero impact on every other route. Verified via grep against `.next/static`. |
| Reduced-motion implications | No new motion surface. The page inherits the global `prefers-reduced-motion: reduce` CSS guard. The Reveal usage matches the existing perception page exactly. |
| Mobile implications | The page is single-column at `< 768px`; every interactive surface is a same-origin Link. No drag / scrub / pan gestures introduced. |
| Future dependency implications | Phase 7.2-7.4 + Phase 8 + Phase 9 each have an explicit reader-relationship to the registry. Documented in § 12 above. |
| Rollback strategy | Single-commit revert removes every primitive; KV state orphans harmlessly. Documented in § 10 above. |
| Maintenance burden | ~0.5 hr/month per V5 § 4.2 (registry append-only edits when an architectural moment lands). Sustainability test passes per § 2 above. |

---

## 15. Next sub-PR

**Sub-PR 7.2 — Temporal Playback Primitive.** Per V5 § 5.2:

- `lib/v5/temporal/playback.ts` (frame interpolation helpers)
- Reduced-motion → instant snap-to-frame
- Idle CPU 0% when scrubber inactive
- Bundle < 6 KB
- Telemetry: `v5:topology:playback:scrub_events_weekly`

Will read the registry shipped here as the index axis. The
playback primitive is invisible until Sub-PR 7.3 mounts the
slider UI; both ship behind the same foundation contract this
sub-PR establishes.

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 16. Closing — the system has begun remembering

The user prompt set the standard:

> Visitors should NOT think:
> "cool timeline."
>
> They should think:
> "This system remembers itself."

Sub-PR 7.1 ships nothing the visitor would describe as a
timeline. There is no slider, no scrubber, no animation between
frames, no chrome that hints at playback. What ships is an
editorial archive — fifteen architectural events rendered as
declarative cards, each grounded in a commit or a sub-PR report,
filterable by axis, deep-linkable by id.

The chassis is what subsequent sub-PRs (and Phase 8 + 9) will
build the timeline experiences ON. By itself, it is what it
claims to be: a quietly archival surface that reads as
engineering memory.

Phase 6 closed with the visitor never feeling tracked. Phase 7
opens with the system explaining, plainly, what it remembers
about itself.

The foundation is built. Phase 7 begins.
