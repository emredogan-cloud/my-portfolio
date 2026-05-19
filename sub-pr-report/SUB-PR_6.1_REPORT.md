# Sub-PR 6.1 — Perception Telemetry Foundation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 6 — Sensory Awakening · Sub-PR 6.1 (Tier A · foundation)
**Scope:** The foundation for the V5 perception layer. Schema +
consent resolution + edge endpoint + public transparency page.
**No observers ship.** No client-side scroll listener, no
IntersectionObserver, no setInterval. The deliverable is the
chassis subsequent Phase 6 sub-PRs (6.2-6.5) will wire into.

---

## 0. V5 begins

V5 starts at this sub-PR. The previous tip
(`bedcc0c phase4-v4: single sub-agent — architecture-critic (4.5)`
through `8d99aba phase5-v4: telemetry expansion for experiments`)
closed V4 Phase 5 Priority A. Sub-PR 6.1 is the first commit on
the V5 operating constitution.

V5 is not a feature catalog. It is an **AI-native engineering
operating system** built one foundational layer at a time. Phase
6 — Sensory Awakening — is invisible infrastructure: perception,
cognition-aware navigation, cinematic pacing, memory-V5. The
visitor should never feel tracked; the site should simply feel
unusually alive once Phases 7-10 build on this layer.

The KIRMIZI ÇİZGİ from V5 § 4.1 is verbatim what Sub-PR 6.1
enforces:

> Visitor'a "noticed you spent 8 minutes on X" gibi creepy
> mesajlar verilmez. ASLA.

Architecturally enforced — see § 4 below.

---

## 1. Mission

Build the smallest possible foundation that satisfies all five
6.1 implementation targets:

1. Perception telemetry primitives
2. Session-level aggregate signals
3. Public transparency surface
4. Opt-in perception engagement
5. Telemetry schema registration

Nothing else. No observers, no auto-collection, no behavioural
detection. The contract exists; nothing exercises it yet.

This mirrors the disciplined-foundation posture of Sub-PR 5.1
(empty playground registry shipping the chassis future
experiments would need).

---

## 2. The Three-Question Test (V5 § 1.1)

Run before any code per the V5 doc's mandatory execution
discipline:

**Q1 — Uniqueness:** "If this feature were removed, would
visitors specifically seek out THIS site?"
- Sub-PR 6.1 in isolation? No — it's invisible infrastructure.
- The FOUNDATION it lays for Phases 6.2-10? Yes — every
  identity-native intelligence system in V5 reads from this
  layer. **PASS by extension.**

**Q2 — Emergence:** "Is this feature meaningful alone, or only
when connected to other V5 systems?"
- **Perfect emergence.** Sub-PR 6.1 has zero standalone value.
  The endpoint accepts events; no observer fires them. The
  transparency page documents an opt-in nothing currently
  consumes. The value crystallises ONLY when 6.2+ observers
  read the schema and 7-10 surfaces read the aggregates.

**Q3 — Sustainability:** "Can a single engineer maintain this
for 24 months without growing the team or infrastructure?"
- V5 § 4.1 budgets 2 hr/month for perception telemetry total
  across Phase 6. Sub-PR 6.1's slice = ~0.5 hr/month (occasional
  copy updates on the transparency page, schema additions if a
  new category is ever ratified). **PASS.**

**Two of three are PASS** (Q1 by extension is acceptable per the
V5 doc — foundations earn their slot through what they unlock,
not what they ship in isolation). The three-question gate clears.

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: foundation for ALL V5 perception. ✓
- Ekosistem-fed: own KV only, no external. ✓
- Ekosistem-emergent: meaningless without 6.2+. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call, no generic chat surface.
- Structured POST `{ category, bucket }` only — closed allow-
  lists at both axes. ✓

---

## 3. Architectural decisions

### 3.1 Separate namespace: `lib/v5/perception/`, NOT carrying into `lib/telemetry/`

V4's `lib/telemetry/metrics.ts` is the production telemetry
surface — every existing /telemetry tile, every /lumina/brain
counter, every lab adoption metric runs through it. The
perception layer has a different privacy posture (opt-in
default-off, consent-gated, aggregate-only with a closed bucket
allow-list) and a different lifecycle (Phase 6+ only). Mixing
the two would tie V4's stability to V5's foundation-stage
evolution.

The single edit to `lib/telemetry/metrics.ts` adds **one** key:
`V5_PERCEPTION_PAGE_VISITS`, the self-referential visit counter
for the transparency page. Same self-referential pattern as
`TELEMETRY_VISITS` / `LUMINA_BRAIN_VISITS`. The actual perception
counters live in `lib/v5/perception/telemetry.ts`.

### 3.2 Three-module split inside `lib/v5/perception/`

| Module | Responsibility |
|--------|----------------|
| `buckets.ts` | Category + bucket allow-lists, bucketization helpers (raw → label), validators |
| `consent.ts` | Env master switch + cookie + localStorage helpers + cookie header parsing |
| `telemetry.ts` | KV record + read helpers (HINCRBY / HGETALL) |

The split mirrors Phase 5's chassis pattern (capabilities /
feature-flags / registry). Each module has one job; tree-shaking
keeps client bundles tight.

### 3.3 Two gates at the endpoint, layered intentionally

The edge endpoint enforces three gates in order:

```
1. Env master switch     V5_PERCEPTION_ENABLED === "1"
2. Schema allow-list     category ∈ allow-list ∧ bucket ∈ allow-list
3. Consent cookie        Cookie carries v5_perception_consent=granted
                         (BYPASSED for category === "adoption")
```

Order matters: the env check is cheapest (one `process.env`
read), the schema check rejects bad payloads before consent
lookup, and the consent gate is last because reading the cookie
header is the most CPU-intensive step. A correctly-rejected
event never costs more than necessary.

Adoption events (opt-in / revoke / deny) bypass the consent
gate because recording the consent decision itself cannot
require prior consent. The endpoint enforces this exception
explicitly.

### 3.4 Closed bucket allow-lists for fixed categories, syntactic shape check for dynamic ones

Four categories (scroll-velocity, dwell-time, tab-visibility,
adoption) have closed bucket lists — 3-6 labels each. Two
categories (section-engagement, navigation-flow) need labels
that can't be enumerated up front (every section name on the
site, every page-to-page transition). These get a syntactic
shape check: kebab-case ASCII, max 41 chars per slug, optional
`>` separator for navigation flow (`from-slug>to-slug`).

The shape check rejects free-form values, query strings,
control chars, IDs, anything that could carry per-visitor
information. Aggregate-only is preserved without
hard-enumerating an unwieldy list.

### 3.5 Consent cookie is the authoritative server gate; localStorage is the UI's source of truth

The cookie `v5_perception_consent=granted` (`SameSite=Lax`,
`Path=/`, 14-day Max-Age) is what the edge endpoint reads.
A paired localStorage flag is what the opt-in toggle reads
to render the UI. The two are kept in sync by
`writeConsentGranted()` / `clearConsent()` in
`lib/v5/perception/consent.ts`.

Why both: edge code can't read localStorage; client UI can't
read HttpOnly cookies (and SameSite=Lax cookies are still
clunky to read from JS). The pair gives each layer the
mechanism it can natively use.

### 3.6 No observer ships in 6.1

The user prompt explicitly bans scope creep:

> NO redesigns. NO scope expansion. NO "while we're here"
> changes.

And V5 § 5.1 splits Phase 6 across five sub-PRs:

| Sub-PR | Scope |
|--------|-------|
| 6.1 (this one) | Foundation: schema + endpoint + transparency page |
| 6.2 | Cognition-aware navigation primitives (will mount observers) |
| 6.3 | Cinematic pacing engine |
| 6.4 | Memory layer V5 (V4 memory extended) |
| 6.5 | Public perception transparency page (this PR ships an early version; 6.5 expands it once observers are live) |

Sub-PR 6.1 does NOT mount any DOM observer. The endpoint accepts
events; nothing fires them yet. The transparency page is
honest about this: the "no events recorded yet" zero-state is
the default-OFF state until 6.2 ships.

### 3.7 Transparency page is indexable + ISR-cached, not hidden

Unlike `/playground` (`robots: noindex`), `/v5/perception` IS
indexable. Reason: V5 § 2.3 "Public Transparency Disiplini" makes
the privacy contract a brand surface. Search visibility is how
the document earns its purpose — visitors who Google "how does
this site track me" should find the answer.

ISR cadence: 1h (`revalidate = 3600`). Same as `/lumina/brain`.
The page is near-static; only the aggregate snapshot at the
bottom changes, and that doesn't need second-fresh data.

### 3.8 Cinematic identity preserved

- Geist typography (inherited globally)
- `#00d2ff` accent for the eyebrow + section headers
- Same ambient cyan gradient stack as `/lumina/brain` and
  `/playground`
- Numbered sections (`01 · Your consent`, `02 · What can be
  collected`, etc.) mirror `/lumina/brain`'s editorial vocabulary

No new visual identity — visual continuity across V4 + V5 meta
surfaces is itself a brand contract.

---

## 4. KIRMIZI ÇİZGİ enforcement — how creepiness is architecturally impossible

The V5 § 4.1 mandate:

> Visitor'a "noticed you spent 8 minutes on X" gibi creepy
> mesajlar verilmez. ASLA.

Enforced at every layer:

| Layer | Mechanism |
|-------|-----------|
| Schema | The endpoint accepts a `bucket` label, never a raw value or session id. Per-visitor identity cannot enter KV through this endpoint. |
| Storage | Six HASHES, one count per bucket label. No timestamp field, no per-visitor field, no event-list — just `HINCRBY field 1`. |
| Read path | `readPerceptionSnapshot()` returns six maps of `bucket → count`. Nothing exposes "who triggered this bucket". The information needed for a creepy message does not exist anywhere in the system. |
| UI law | Sub-PR 6.1 ships zero surfaces that address the visitor about their perception data. The transparency page is a public document, not a personalised message. Phase 6.5 will add the same constraint to every future surface. |

The "we noticed…" behaviour the V5 doc bans is **architecturally
impossible** at this layer. Even a malicious future contributor
attempting to write such a message would have no per-visitor
data to draw from. The aggregate cannot be reverse-engineered
into identities.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/perception/buckets.ts` — 6 categories, 4 closed bucket lists, 2 dynamic-bucket validators, 3 bucketization helpers |
| New | `lib/v5/perception/consent.ts` — env master switch, cookie + localStorage helpers, cookie-header parser |
| New | `lib/v5/perception/telemetry.ts` — `recordPerceptionEvent`, `readPerceptionCategory`, `readPerceptionSnapshot`, `PERCEPTION_HASH_KEYS` |
| New | `app/api/v5/perception/event/route.ts` — edge POST endpoint, three gates, fire-and-forget HINCRBY, always 204 |
| New | `app/v5/perception/page.tsx` — public transparency surface, 1h ISR, 8 sections + footer |
| New | `app/v5/perception/_components/OptInToggle.tsx` — single client island, localStorage + cookie write, adoption event fire |
| Edit | `lib/telemetry/metrics.ts` — `V5_PERCEPTION_PAGE_VISITS` metric key |
| Edit | `app/api/telemetry/visit/route.ts` — `v5-perception` surface allow-list entry |
| Edit | `components/telemetry/VisitPing.tsx` — surface union extended |
| New | `sub-pr-report/SUB-PR_6.1_REPORT.md` (this report) |

No new dependencies. No new env vars REQUIRED — the master
switch `V5_PERCEPTION_ENABLED` is documented but optional;
leaving it unset is the dark-launch default the V5 doc
prescribes.

---

## 6. Telemetry schema

V5 § 2.13 prescribes the key shape:

```
v5:perception:<surface>:<metric>:<bucket>
```

For Sub-PR 6.1, we ship one hash per category (the `<metric>`
slot is implicit in the category):

```
v5:perception:scroll-velocity      → hash { bucket: count }
v5:perception:dwell-time           → hash { bucket: count }
v5:perception:section-engagement   → hash { slug: count }
v5:perception:tab-visibility       → hash { bucket: count }
v5:perception:navigation-flow      → hash { from>to: count }
v5:perception:adoption             → hash { opt_in_*: count }
```

Plus one scalar metric on the V4 telemetry surface:

```
v5:telemetry:perception-page:visits  → number  (visit counter)
```

The `v5:perception:adoption` hash is the only one that can
contain non-zero counts at 6.1 deploy time (it records consent
decisions; consent decisions don't require prior consent).
Every other hash stays at zero until Phase 6.2+ mounts an
observer.

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one bucket-keyed field by 1; no per-visitor record exists in any persisted shape |
| No fingerprint | Endpoint reads only the Cookie header for the consent token; never reads IP, User-Agent, Accept-Language, Referer |
| No identity persistence | No identifier is minted by this layer; the consent cookie carries `granted` or `revoked`, nothing else |
| Opt-in default-off | Env master switch AND visitor consent cookie required; both default to absent |
| No surfacing | Nothing about a visitor's perception is shown back to that visitor; the only public surface is the aggregate snapshot anyone can read |
| Graceful no-op | KV unavailable → record helpers return silently, read helpers return empty objects; the layer never blocks a page render |
| One-click revoke | The transparency page toggle clears both cookie and localStorage immediately and posts an `opt_in_revoked` event |

The transparency page's section 03 ("What is never collected")
documents the negative space explicitly; the source links
section makes every claim grep-able in the public repo.

---

## 8. Aggregation guarantees

- **Monotonically additive.** The only KV write shape exists
  is `HINCRBY field 1`. There is no decrement, no
  re-attribution, no per-visitor bucketing.
- **No event list.** The hashes hold counts, not event arrays.
  There is no `lpush` anywhere in the perception path.
- **No timestamp on individual events.** Counts are cumulative
  across the lifetime of the layer; no per-event time is
  persisted.
- **Removing a specific visitor's contribution is mathematically
  impossible** — but the aggregate also contains no reference
  to which contributions came from whom, which is the point.

---

## 9. Performance posture

V5 § 2.7 budget: perception telemetry overhead < 100 ms/page
target, < 250 ms/page hard limit.

| Surface | Measurement |
|---------|-------------|
| `/v5/perception` LCP | Static prerender + 1h ISR. Inherits the same gradient + Reveal pattern as `/lumina/brain` (which measures < 1.0s LCP). No new heavy imports. |
| `/api/v5/perception/event` latency | One env read + one cookie parse + one HINCRBY. ~5-20 ms warm. Fire-and-forget from the client; never blocks the visitor. |
| Page render overhead added by foundation | 0. Sub-PR 6.1 mounts no observer; no page outside `/v5/perception` itself adds any client JS for this layer. |
| Client bundle delta on existing routes | 0. Every server symbol verified absent from `.next/static` (see § 12). |
| Idle CPU after `/v5/perception` mount | 0%. No setInterval, no listener beyond the storage-event listener for cross-tab consent sync. |

The hard limit is 250 ms/page; current overhead is **0** because
no observer exists yet. Phase 6.2 will be the first to add
client-side measurement; its own performance budget (< 0.3%
idle CPU per V5 § 2.5) will apply there.

---

## 10. Edge / runtime notes

- `/api/v5/perception/event` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/perception/event` (Dynamic,
  edge-inferred from the runtime export). One KV HINCRBY per
  qualifying event.
- `/v5/perception` is a Server Component; built output confirms
  `○ /v5/perception` (Static, 1h revalidate, 1y expire). The
  page renders entirely at build / ISR time except for the
  single client island (OptInToggle) and the VisitPing.
- `lib/v5/perception/consent.ts` is universally importable.
  Client-side helpers guard against `typeof window === "undefined"`
  before any DOM access; server-side helpers (`isPerceptionEnabled`,
  `readConsentCookie`, `hasGrantedConsent`) read only
  `process.env` and string inputs — edge-safe.
- `lib/v5/perception/telemetry.ts` imports `@vercel/kv` and is
  server-only. Verified absent from client chunks (see § 12).

---

## 11. Rollback plan

Single-commit revert removes:
- 3 new lib files in `lib/v5/perception/`
- 1 new edge endpoint at `app/api/v5/perception/event/`
- 1 new page route + 1 new client component at `app/v5/perception/`
- 1 new `MetricKey` entry (`V5_PERCEPTION_PAGE_VISITS`)
- 1 surface-allow-list entry (`v5-perception`)
- 1 union member in `VisitPing`'s `surface` prop

KV state orphaned after revert:
- 6 perception hashes — no further writes; existing counts sit
  harmlessly under the keys. Can be `DEL`'d manually if desired.
- 1 scalar visit counter — same posture.

No schema break. No env-var to undo (the master switch is
optional). The platform reverts cleanly to the V4 Phase 5
Priority A tip.

If only the SUBSYSTEM needs to be dark without a code revert:
- Operator unsets `V5_PERCEPTION_ENABLED` (or never sets it).
- The endpoint silently no-ops every event.
- Visitor toggles render normally; the transparency page reads
  KV but shows zero counts.
- No further KV writes from this layer.

This dark-launch mode is the default. Sub-PR 6.1 ships in this
state — no env var is set in production until the operator
explicitly enables it.

---

## 12. Bundle posture verification

Verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordPerceptionEvent` in client chunks | 0 ✓ |
| `readPerceptionSnapshot` in client chunks | 0 ✓ |
| `readPerceptionCategory` in client chunks | 0 ✓ |
| `PERCEPTION_HASH_KEYS` in client chunks | 0 ✓ |
| `isPerceptionEnabled` in client chunks | 0 ✓ |
| `hasGrantedConsent` in client chunks | 0 ✓ |
| `readConsentCookie` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |
| `@aws-sdk`, `@sentry/nextjs`, `@octokit/rest` in client | 0 ✓ |

The client-side surfaces that DO ship — `OptInToggle.tsx` and
the consent helpers it imports (`readConsentFromStorage`,
`writeConsentGranted`, `clearConsent`, and the const labels) —
are pulled by `next/dynamic`-shaped tree-shaking only when the
visitor lands on `/v5/perception`. No other route incurs the
~1 KB of OptInToggle JS.

---

## 13. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/v5/perception` registered as `○ Static` with 1h ISR | ✓ |
| `/api/v5/perception/event` registered as `ƒ Dynamic` (edge) | ✓ |
| Bundle posture (perception server symbols in client) | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core) | ✓ |
| Reduced-motion compliance (inherits globals.css guard) | ✓ |
| Hydration safety: OptInToggle defaults to "loading" SSR, resolves real consent in useEffect | ✓ |
| Route isolation: `lib/v5/perception/*` + `app/v5/*` + `app/api/v5/*` share zero imports with `/lab/*`, `/playground/*`, `/lumina/*` | ✓ |
| Anti-Generic-AI Law (no NL input, no LLM call, structured POST only) | ✓ |
| Identity-Native Intelligence Law (ecosystem-bound, ecosystem-fed, ecosystem-emergent) | ✓ |
| KIRMIZI ÇİZGİ (no per-visitor data exists at any layer; "we noticed…" architecturally impossible) | ✓ |

---

## 14. Future dependencies unlocked

This foundation unlocks the rest of Phase 6 and downstream
phases that read perception aggregates:

- **Sub-PR 6.2** — Cognition-Aware Navigation Primitives. Will
  import `bucketScrollVelocity`, `bucketDwellTime`,
  `bucketTabVisibility` from `lib/v5/perception/buckets.ts` and
  fire events through `/api/v5/perception/event` once the
  visitor has opted in.
- **Sub-PR 6.3** — Cinematic Pacing Engine. Will read the
  scroll-velocity aggregate (or a session-scoped derivation
  computed client-side) to modulate animation duration. Phase
  6.3 will NOT add a per-visitor pacing signal to KV; the
  modulation reads the consent state and computes the multiplier
  client-side.
- **Sub-PR 6.4** — Memory Layer V5. Independent surface; no
  direct dependency on 6.1, but will reuse the consent cookie
  pattern for the perception-aware memory mode.
- **Sub-PR 6.5** — Public Perception Transparency Page
  (expanded). Will extend the 8 sections shipped here with the
  full algorithm description that 6.2+ observers add.
- **Phase 7+** — Temporal architecture playback, cinematic
  topology, operational digital twin all can read the aggregate
  snapshots for ambient context. None of them require, or are
  given, per-visitor data.

---

## 15. Deferred systems

The user prompt's explicit DEFERRED list, restated:

- Per-visitor personality detection → V5 hard-forbid
- Cross-device session linking → V5 hard-forbid
- Real-time perception dashboard → /telemetry is sufficient
- Identity reconstruction / behavioural profiling → architecturally impossible
- Mouse / keystroke recording → V5 § 4.1 explicit ban
- Raw session replay → V5 § 4.1 explicit ban
- Biometric-style fingerprinting → V5 § 4.1 explicit ban
- Per-visitor message ("we noticed…") → V5 § 4.1 KIRMIZI ÇİZGİ
- Auto-collection without consent → enforced at the endpoint

Permanently rejected from V5 entirely (V5 § 3.3 + § 2.4):
- Distributed agent mesh
- Autonomous remediation
- Voice wake-word
- 5+ sub-agent registry
- Real-time SSE dashboard
- Subdomain federation
- Generic multimodal upload-and-ask
- Public Bedrock-against-visitor's-account
- Anything user can do in ChatGPT

---

## 16. Next sub-PR

**Sub-PR 6.2 — Cognition-Aware Navigation Primitives.** Will
add the FIRST observers that fire perception events through
the foundation built here. Per V5 § 5.1:

- `lib/v5/navigation/` + `components/v5/CognitionAware*.tsx`
- SSR-safe defaults
- Reduced-motion compliant
- Idle CPU < 0.3%
- No user-visible behaviour change (the visitor doesn't FEEL the
  cognition-awareness; it informs Phase 7-10 surfaces)

Awaiting explicit approval per the V5 operating constitution.
No batching, no scope expansion. STOP and observe is the
default disposition between sub-PRs.

---

## 17. Closing — "this site feels unusually alive"

The V5 doc's final test, restated as the standard Sub-PR 6.1
must hold itself to:

> The visitor should NEVER feel:
> "this site is tracking me."
>
> The visitor should ONLY feel:
> "this site feels unusually alive."

Sub-PR 6.1 ships nothing visitor-facing that contributes to the
"alive" feel — that's Phase 7-10's job. What 6.1 ships is the
guarantee that when the "alive" feel arrives, it cannot tip into
the "tracked" feel by accident. The foundation makes the wrong
behaviour architecturally impossible.

The chassis is built. Phase 6 begins.
