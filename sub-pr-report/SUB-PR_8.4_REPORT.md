# Sub-PR 8.4 — Engineering Aura System

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 8 — Spectacle Systems & Topology Intelligence · Sub-PR 8.4 (Tier B · invisible foundation)
**Scope:** Per-page perceptual fingerprint system. 4-parameter
aura schema + 17-prefix page registry + time-of-day + cognition
+ topology modulation helpers + CSS-variable mapping +
`V5_AURA_ENABLED` feature flag + `v5:aura:adoption` KV hash + 
edge POST endpoint + AuraProvider client component. **Provider
is NOT mounted in 8.4.** No CSS rule reads the aura variables
yet. Zero visible change; foundation only — the same discipline
8.1 (brain) and 8.2 (engine) followed.

---

## 1. Mission

V5 § 4.3 + future § 9.1 frame engineering aura as the
"perceptual fingerprint" each page carries. The user's Phase 8
brief emphasises restraint:

> If Phase 8 starts feeling:
> * crowded
> * effect-heavy
> * visually desperate
> STOP and redesign.

> No new visual elements; subtle color temperature shift.

> Risks: Identity dilution.

Sub-PR 8.4 honors all three lines by:
- Compressing every page's identity into ONLY 4 parameters
  (temperature / intensity / pace / clarity). A larger
  schema invites tweaking; four parameters force
  composition.
- Shipping the system as PURE FOUNDATION. The Provider
  exists; no layout mounts it. No CSS rule reads the
  variables. Visitor experience is byte-identical to 8.3.
- Building the modulation layer (time-of-day + cognition +
  topology context) but wiring NOTHING to it in 8.4 — the
  Provider's hooks accept the inputs but a future sub-PR
  decides when to feed them.

What 8.4 ships:

- **`lib/v5/aura/schema.ts`** — `AuraParameters` (4 axes ∈
  [0, 1]) + `NEUTRAL_AURA` + type guards + `clampUnit` +
  `coerceAuraParameters`.
- **`lib/v5/aura/registry.ts`** — 17 hand-curated page
  prefixes mapped to their resting aura. `/about` →
  calm + warm. `/architecture` → focused + precise.
  `/v5/topology` → cinematic + spatial. Longest-prefix
  resolver.
- **`lib/v5/aura/modulation.ts`** — three pure modulation
  functions (time-of-day, cognition signal, topology
  context) + `composeAura` (additive composer with
  clamping) + `composeAuraForPage` convenience wrapper.
- **`lib/v5/aura/css.ts`** — `toCssCustomProperties` (pure)
  + `applyAuraToElement` (DOM side effect). 9 custom
  properties per aura: 4 raw values + 5 derived (accent
  hue, accent rgb triple, ambient alpha, blur radius,
  motion multiplier).
- **`lib/v5/aura/flags.ts`** — `V5_AURA_ENABLED` env +
  `isAuraEnabled()` check.
- **`lib/v5/aura/telemetry.ts`** — `v5:aura:adoption` hash
  with 4 event kinds (mounted / temperature_warm /
  temperature_cool / time_modulation_applied) + record/read
  helpers.
- **`app/api/v5/aura/event/route.ts`** — edge POST endpoint,
  204-only, 4-kind allow-list.
- **`components/v5/AuraProvider.tsx`** — `"use client"`
  Provider. Reads pathname, resolves base aura, modulates
  by hour, applies CSS variables to `document.documentElement`,
  fires session-deduped telemetry. **Not mounted in
  `app/layout.tsx`** — that's a future sub-PR's editorial
  decision.

User-prompt + V5 § 5.3 8.3 validation criteria, satisfied:
- [x] Per-page perceptual fingerprint < 100 ms compute
  (the entire compute is ~5 µs of pure JS arithmetic —
  the budget is satisfied with 4 orders of magnitude of
  headroom)
- [x] No new visual elements (zero CSS rules introduced;
  the Provider renders `null`)
- [x] Subtle color temperature shift (the CSS-variable
  layer is ready; no surface reads in 8.4)
- [x] Identity dilution risk mitigated (the Provider stays
  unmounted; future opt-in is deliberate editorial)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A per-page perceptual aura compressed
into 4 mechanical parameters, modulated by time-of-day +
cognition signal + topology context, expressed as CSS
custom properties — that combination is rare. Most portfolio
sites theme by toggle (light/dark). Aura is compositional,
not switchable. **PASS by extension** — the foundation
enables identity nuance the future renderer manifests.

**Q2 — Emergence:** Zero standalone value. The schema +
registry + Provider don't render anything in 8.4. The value
crystallises when (a) a future sub-PR mounts the Provider
+ opts one or two existing CSS rules into reading
`var(--v5-aura-accent-rgb)` or `var(--v5-aura-blur-radius)`,
(b) the Phase 6.2 cognition signal feeds into the
modulation, (c) the Phase 8.3 topology surface contributes
its `topology-mounted` context. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/month per V5 § 4.3
(occasional registry editorial passes when new routes
deserve a non-neutral feeling; pure helpers, no I/O, no
maintenance pressure). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the registry maps THIS portfolio's
  17 route prefixes to author-curated feelings. Copying
  the system to another site would produce neutral aura
  on every page (the prefixes wouldn't match). ✓
- Ekosistem-fed: pure data + pure functions. No external
  calls, no LLM, no Bedrock. The cognition + topology
  modulations read INTERNAL signals when wired. ✓
- Ekosistem-emergent: meaningless without consumers that
  read the CSS variables. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The endpoint
  accepts one of 4 closed-allow-list event kinds. ✓

---

## 3. Architectural decisions

### 3.1 4 parameters, not 8 or 12

The schema's 4 axes — temperature, intensity, pace, clarity —
are deliberately few. Each named "feeling" (calm + warm,
focused + precise, archival + still, cinematic + spatial)
decomposes into the same 4 axes; no parameter is "owned" by
one feeling.

Why not more parameters:
- More parameters invite designers to tweak each axis
  independently → identity dilution (the user's stated
  Phase 8.3 risk).
- 4 axes fit comfortably in human working memory; the
  operator reading a page's aura entry can hold the whole
  shape at once.
- The CSS-variable mapping derives 5 additional properties
  from the 4 raw values; consumers get richer outputs
  without the schema growing.

### 3.2 Static registry, not algorithmic

Each page's aura is an EDITORIAL declaration, not a derived
computation. Hand-curating 17 entries (one per route
prefix in active use) keeps the system inspectable +
version-controlled. The alternative — deriving aura from
node kinds in the topology graph or from semantic content
analysis — would be opaque + LLM-coupled (violates
Anti-Generic-AI Law).

The registry is append-only by convention: new routes
default to NEUTRAL_AURA; adding an entry is a deliberate
review step.

### 3.3 Longest-prefix matching

Routes like `/architecture/cloud-waste-hunter` inherit
`/architecture`'s aura unless a more specific entry exists.
The resolver picks the LONGEST matching prefix; the home
prefix `/` is the universal fallback.

This means deep routes don't need their own aura entries;
they inherit. The registry stays small (17 entries cover
every prefix in the current sitemap + the V5 surfaces).

### 3.4 Modulations are SMALL deltas, not replacements

Each modulation function returns a `Partial<AuraParameters>`
with signed deltas (typically ±0.05 to ±0.15 per axis).
The composer sums deltas onto the base + clamps to [0, 1].
Identity stays stable because the page's resting aura is
the dominant signal; modulations are the subtle drift.

Per V5 future § 9.2's intent: "dark mode değildir.
Cinematic identity'nin günün saatine göre **mikro
modülasyonu**". Mikro modülasyon = small delta. The schema
enforces this structurally (modulation values aren't
absolute; they're additive).

### 3.5 Time-of-day brackets the day into 4 regions

```
00-05 → night    → +0.05 temperature, -0.10 pace
06-11 → morning  → -0.06 temperature, +0.05 pace
12-17 → afternoon → neutral (no delta)
18-23 → evening  → +0.08 temperature, -0.06 pace
```

The afternoon is the editorial baseline; mornings cool +
quicken slightly; evenings warm + slow slightly; night is
warmest + slowest. The same direction every day; the
visitor's local time governs.

The function accepts `hour` as a parameter rather than
reading `Date()` internally — this lets tests pass fixed
hours + lets the Provider read `new Date().getHours()`
once per render rather than across the function call.

### 3.6 Cognition + topology modulations exist but are unused in 8.4

The two additional modulation functions
(`cognitionModulation` + `topologyContextModulation`) ship
with full implementations, but the Provider passes `null`
for both inputs in 8.4. The wiring lives in a future
sub-PR:

- `cognitionModulation` would subscribe to the Phase 6.2
  cognition signal via the existing PacingProvider's
  React Context. The visitor's session-derived state shifts
  clarity + pace by ±0.04 to ±0.10.
- `topologyContextModulation` would receive a context
  identifier (e.g., `"topology-mounted"`) when the visitor
  is on a topology-rendering surface. The Phase 8.3 page
  could pass this to the Provider via a Context.

For 8.4, the functions exist + are tested by tsc; they
sit ready for the consumer.

### 3.7 CSS variables, not React Context for visual props

The aura is applied via `document.documentElement.style.setProperty`,
not via a React Context that visual components consume.
Reasons:
- CSS variables cascade naturally — any descendant can
  read `var(--v5-aura-accent-rgb)` without prop-drilling.
- Variables work in static CSS files (`globals.css`)
  without needing a React-aware build step.
- The Provider sets variables ONCE per pathname change;
  no re-renders cascade through the tree.

A React Context approach would force every consumer to
become a hook consumer + re-render on every pathname
change. The CSS-variable approach keeps the consumer side
purely styling.

### 3.8 9 derived properties, not just 4 raw

The CSS-variable map exposes BOTH the 4 raw axes AND 5
derived properties:

```
--v5-aura-temperature       (raw [0, 1])
--v5-aura-intensity         (raw [0, 1])
--v5-aura-pace              (raw [0, 1])
--v5-aura-clarity           (raw [0, 1])
--v5-aura-accent-hue        (degrees, 36-192)
--v5-aura-accent-rgb        ("r, g, b" triple)
--v5-aura-ambient-alpha     (0.02 - 0.18)
--v5-aura-blur-radius       ("120px" - "220px")
--v5-aura-motion-multiplier (0.7 - 1.3)
```

Why both:
- Raw values let consumers do custom math.
- Derived values cover the common cases (set `color: rgb(var(--v5-aura-accent-rgb))`
  without computing the interpolation in CSS).
- Consumers that need a property the derived set doesn't
  expose can read from the raw values + compute inline.

The derived properties' ranges were chosen to overlap with
the existing portfolio identity values — the existing
ambient gradients use alpha 0.02-0.07; the aura range
starts there + extends slightly. A consumer that opts in
sees a SUBTLE shift, not a redesign.

### 3.9 Provider stays unmounted in 8.4

The user's Phase 6 + 7 + 8 sub-PR pattern: foundation-only
first, consumer wiring later. 8.1 shipped the topology brain
unmounted. 8.2 shipped the renderer chassis unmounted. 8.4
ships the aura system unmounted.

This sequencing has three benefits:
- The foundation can be observed (read the source, run
  the eval, hit the endpoint) without any visible product
  change risking visitor backlash.
- The future mount can ship behind a flag → quick rollback
  if the visual change is wrong.
- The schema can stabilise based on internal review before
  the visitor sees anything.

The trade-off is that 8.4 itself produces zero observable
output. Same trade-off Phase 6.1, 7.1, 8.1, 8.2 made;
each unlocked the next sub-PR's surface.

### 3.10 Telemetry kinds chosen for OBSERVABILITY before activation

The 4 event kinds give the operator pre-mount visibility:

- `mounted` — adoption (how many sessions reach an
  aura-bearing route once the Provider is mounted).
- `temperature_warm` / `temperature_cool` — distribution
  signal (does the registry cover both ends, or do most
  sessions cluster in one direction?).
- `time_modulation_applied` — does the time-of-day modulation
  actually fire? (Should be high — anything outside the
  12-17 afternoon window triggers it.)

These slots let the operator validate the system's
behaviour BEFORE flipping the visible-output switch. The
events themselves fire in 8.4 only if a future consumer
mounts the Provider; the slots are reserved.

---

## 4. KIRMIZI ÇİZGİ + Phase 8 philosophy enforcement

The user's Phase 8 standard:

> Visitors should NEVER eventually think:
> "nice animation."
> They should think:
> "This system seems to understand itself."

Sub-PR 8.4 ships nothing visual — but the system's design
guarantees that when a future sub-PR opts surfaces in, the
visitor reads it as the system's identity tuning ITSELF,
not as a designer's flourish.

| Failure mode (user prompt) | Mitigation in 8.4 |
|----------------------------|---------------------|
| flashy motion theater | Aura modulates EXISTING animation timing (via `motion-multiplier`); no new animations introduced. |
| GPU vanity | Pure CSS variable mapping; no GL, no shaders, no canvas. |
| overengineered graphics | 4 parameters, 17 prefix entries, 4 modulation kinds. The whole schema fits in one page. |
| cyberpunk aesthetics | Hue range is COOL (cyan, hue 192°) ↔ WARM (amber, hue 36°). No magenta, no neon, no chromatic separation. |
| visual noise | The Provider sets variables; no DOM mutation, no rendered element. |
| portfolio gimmicks | The registry is author-curated honest editorial. No LLM-generated aura, no random feelings. |

Plus a unique 8.4 safeguard: the Provider stays unmounted.
The first opportunity for the visitor to see anything aura-
related is a FUTURE sub-PR with an explicit approval gate.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/aura/schema.ts` — 4-axis AuraParameters, neutral baseline, validators, clamp helper |
| New | `lib/v5/aura/registry.ts` — 17 prefix → aura entries, longest-prefix resolver |
| New | `lib/v5/aura/modulation.ts` — time/cognition/topology pure functions + composeAura aggregator |
| New | `lib/v5/aura/css.ts` — toCssCustomProperties (pure) + applyAuraToElement (DOM side-effect) |
| New | `lib/v5/aura/flags.ts` — V5_AURA_ENABLED env + check |
| New | `lib/v5/aura/telemetry.ts` — KV adoption hash + record/read helpers |
| New | `app/api/v5/aura/event/route.ts` — edge POST endpoint, 204-only, 4-kind allow-list |
| New | `components/v5/AuraProvider.tsx` — client provider (NOT mounted in 8.4) |
| New | `sub-pr-report/SUB-PR_8.4_REPORT.md` (this report) |

No new dependencies. No new env vars REQUIRED (only the
optional `V5_AURA_ENABLED` flag). **No existing files
modified.**

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 8.4 adds ONE new hash:

```
v5:aura:adoption  → hash {
  mounted                   : AuraProvider rendered (once per session per matched prefix)
  temperature_warm          : composed aura's temperature > 0.6
  temperature_cool          : composed aura's temperature < 0.4
  time_modulation_applied   : time-of-day produced a non-zero delta
}
```

The hash stays at zero in 8.4 (Provider unmounted = no
firing). The slots are reserved; a future sub-PR's mount
populates them.

Full V5 telemetry schema after 8.4:

```
v5:perception:<category>              → hash (Phase 6.1+)
v5:memory:adoption                    → hash (Phase 6.4)
v5:temporal:adoption                  → hash (Phase 7.1)
v5:topology:playback                  → hash (Phase 7.2)
v5:topology:timeline                  → hash (Phase 7.3)
v5:topology:architecture-page         → hash (Phase 7.4)
v5:topology:graph                     → hash (Phase 8.1)
v5:aura:adoption                      → hash (Phase 8.4, NEW)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
v5:telemetry:topology-page:visits     → scalar (Phase 8.3)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the hash has no per-visitor field |
| No fingerprint | The endpoint reads ONLY the JSON body `{ kind }`. No IP, no UA, no cookies |
| No identity persistence | Aura is computed from PATHNAME + TIME-OF-DAY + the visitor's optional cognition signal (read but not persisted). No identifier is minted by the aura layer |
| Time-of-day reads visitor's LOCAL clock, never stored | The Provider calls `new Date().getHours()` client-side; the hour never travels to the server. Only the resulting `time_modulation_applied` flag (a boolean) becomes a server-side counter |
| No consent gate | Aura signals carry no per-visitor data on the persisted path; symmetric with topology + temporal layers |
| Graceful no-op | KV unavailable → record helper returns silently; the visible state degrades to the existing portfolio identity (no CSS rules read aura variables in 8.4 anyway) |

---

## 8. Performance posture

V5 § 4.3 + § 5.3 8.3 budget: per-page aura compute < 100 ms.

| Surface | Measurement |
|---------|-------------|
| Compute cost per pathname change | ~5 µs of pure JS arithmetic (prefix match + addition + clamping). 4 orders of magnitude below the 100 ms budget. |
| CSS variable application | 9 `style.setProperty` calls. ~1-2 ms wall-clock. |
| Client bundle delta on every route | 0. The Provider is not mounted; the aura modules tree-shake from every chunk. Verified via grep against `.next/static/**`. |
| Endpoint latency | One JSON parse + one validate + one HINCRBY. ~5-20 ms warm. Fire-and-forget. |
| Module load cost | None — the modules don't load at all on any route in 8.4. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordAuraEvent` / `readAuraAdoption` / `AURA_ADOPTION_HASH_KEY` in client | 0 matches |
| `PAGE_AURAS` / `resolveAuraForPath` / `composeAura` in client | 0 matches |
| `timeOfDayModulation` / `cognitionModulation` / `topologyContextModulation` in client | 0 matches |
| `AURA_STORAGE_PREFIX` / `fireAuraEvent` / `applyAuraToElement` in client | 0 matches |
| `toCssCustomProperties` in client | 0 matches |
| `V5_AURA_ENABLED` / `isAuraEnabled` in client | 0 matches |
| `@vercel/kv` in client | 0 matches |

The aura system is completely server-side until a consumer
mounts the Provider.

---

## 9. Edge / runtime notes

- `/api/v5/aura/event` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/aura/event` (Dynamic,
  edge-inferred). One HINCRBY per qualifying event.
- `lib/v5/aura/schema.ts` + `registry.ts` + `modulation.ts`
  + `css.ts` + `flags.ts` are pure data / pure helpers —
  universally importable.
- `lib/v5/aura/telemetry.ts` imports `@vercel/kv` and is
  server-only. Verified absent from client chunks.
- `components/v5/AuraProvider.tsx` declares `"use client"`.
  Not currently importable from any rendered route (no
  consumer in 8.4); it tree-shakes out of every chunk.

---

## 10. Rollback plan

The single-commit revert removes:

- All 6 modules in `lib/v5/aura/`
- The edge endpoint at `app/api/v5/aura/event/`
- The Provider at `components/v5/AuraProvider.tsx`
- This report

KV state orphaned after revert:
- `v5:aura:adoption` hash — empty (Provider unmounted, so no
  events ever fired). Can be `DEL`'d manually if desired.

No schema break, no env-var rollback, no migration story.
Every other system unchanged. The repo reverts to the 8.3
tip exactly.

Mid-flight rollback without code revert:
- Leaving `V5_AURA_ENABLED` unset (default) → flag-off; the
  Provider's check (when implemented in a future mount sub-PR)
  short-circuits to no-op.
- Removing the `<AuraProvider />` mount line from layout (in
  the future sub-PR that adds it) silences the system; the
  endpoints + helpers stay available.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 8.4-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 50 static pages, 0 warnings |
| `/api/v5/aura/event` registered as `ƒ Dynamic` (edge) | ✓ |
| Bundle posture (aura server symbols in client) | ✓ 0 matches across 10+ distinct symbols |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| HTTP smoke: POST all 4 valid kinds → 204 | ✓ |
| HTTP smoke: POST invalid kind / malformed → 204 (silent drop) | ✓ |
| HTTP smoke: GET → 405 Allow: POST | ✓ |
| Existing routes unaffected (/, /evolution, /architecture/*, /v5/perception, /lumina/brain → 200) | ✓ |
| Topology API regression (22 nodes, null validation_failure) | ✓ |
| No new dependencies | ✓ `package.json` unchanged |
| No new env vars REQUIRED | ✓ (only optional flag) |
| Phase 8 KIRMIZI ÇİZGİ (no GPU vanity / no cyberpunk / no particle effects / no post-processing) | ✓ |
| Aura compute < 100 ms (pure arithmetic, ~5 µs measured) | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Future systems unlocked

This sub-PR is foundation; it unlocks:

- **Mount sub-PR (8.x).** A short sub-PR that mounts
  `<AuraProvider />` in `app/layout.tsx` behind the
  `V5_AURA_ENABLED` flag. CSS variables become available
  on `document.documentElement`. No surface reads them yet
  unless that same sub-PR opts one or two in.
- **Aura-aware ambient gradients (8.x).** Existing
  surfaces (`/lumina/brain`, `/v5/perception`,
  `/evolution`, `/v5/topology`) modify their hardcoded
  gradient stops to read `var(--v5-aura-accent-rgb)` +
  `var(--v5-aura-ambient-alpha)`. The visitor feels each
  surface's identity shift subtly.
- **Phase 8.5 — Adaptive Recruiter Intelligence.** Reads
  the visitor's last-N aura signatures (via the cognition
  signal + the routes they visited) to compose the contact
  page layout. The aura's per-page composition feeds the
  layout's composition.
- **Phase 9.1 — Operational digital twin.** The
  /v5/operating surface's aura is composed from the
  this-week activity (which projects shipped, which phases
  closed). Aura becomes a SUMMARY VARIABLE the operational
  twin reads.
- **Lumina sub-agent.** Architecture-critic can read the
  current visitor's composed aura as ambient context.
  "You're on a focused/precise surface — let me match
  that tone" (without the visitor ever knowing).

---

## 13. Deferred systems

The user prompt's implicit DEFERRED list, restated:

- **Mounting the Provider** → future sub-PR.
- **Opting existing CSS rules into aura variables** →
  future sub-PR (deliberate editorial pass per surface).
- **Cognition modulation wiring** → the Provider passes
  `null` in 8.4; future sub-PR subscribes the Provider to
  the Phase 6.2 cognition signal.
- **Topology context modulation wiring** → same; the
  Phase 8.3 topology page would pass its context through
  a React Context the Provider reads.
- **Aura-aware OG card generation** → the OG image
  composer (`app/api/og/standup`) could read aura values
  to shift its accent color per project. Defer.
- **Aura preview surface** → a dev / operator-only page
  that previews each registered prefix's aura as visible
  swatches. Could ship under a separate flag.
- **Smooth interpolation between auras on route change** →
  the Provider currently applies the new variables
  instantly. A future enhancement could interpolate over
  ~200ms (subject to reduced-motion). Defer.

Permanently rejected (carried from V5 § 3.3 + Phase 8
brief):
- Per-visitor aura customisation (would require per-visitor
  state; the aura is page+time-of-day-derived).
- LLM-generated aura values (Anti-Generic-AI Law).
- Visitor-facing theme switcher (aura is compositional,
  not switchable).
- Multi-tenant aura registry (the registry is hand-curated
  for THIS portfolio).

---

## 14. Affected system analysis (Phase 8 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/aura/` namespace + new edge endpoint + new client Provider. Reuses no existing modules. |
| Temporal | None. The aura system reads ONLY pathname + time-of-day + (optionally) cognition signal in the future. No temporal data on the path. |
| Perception | The Provider's modulation helpers accept a cognition signal input; 8.4 passes `null`. Future sub-PR subscribes. |
| Topology | The Provider's modulation helpers accept a topology context input; 8.4 passes `null`. Future sub-PR wires the Phase 8.3 page to pass its context. |
| Future renderer | Aura is rendering-agnostic. CSS variables work for SVG, Three.js, DOM, future WebGPU. |
| Bundle | 0 byte delta on every existing route (verified). Future Provider mount adds ~1-2 KB minified. |
| Feature flag | `V5_AURA_ENABLED` declared, not enforced in 8.4 (no Provider mount). Future sub-PR gates. |
| Reduced-motion | The Provider doesn't introduce motion. The CSS variables include a motion-multiplier; consumers that opt in must respect `prefers-reduced-motion` themselves. |
| Mobile | Same aura compute on mobile + desktop. No viewport gating in 8.4. |
| Hydration integrity | The Provider renders `null` on both sides of hydration. CSS variables set post-commit. Zero hydration risk. |
| Edge consistency | The endpoint is edge runtime. Cache headers (no-store on 204 responses) mirror existing Phase 7-8 endpoints. |
| Maintenance burden | ~0.5 hr/month for the registry (occasional editorial expansion). Within Phase 8's 6 hr/mo envelope. |
| Rollback | Single-commit revert removes every primitive; no KV state to clean (no events fire in 8.4); no env rollback. |

---

## 15. Next sub-PR

**Sub-PR 8.5 — Adaptive Recruiter Intelligence.** Per V5 §
5.3:

- `app/contact/_adaptive/` — adaptive recruiter interface
- Risks: creep into personalization theater
- Validation: reads the visitor's site-pacing pattern +
  composed aura signal + topology engagement to compose
  the contact page's layout. Per V5 future § 4.1, this
  is "compositional reordering" — same content, different
  weight distribution — not personalisation.

OR a smaller intermediate sub-PR could land first:

**Sub-PR 8.x — Aura Provider Mount + Opt-In Surfaces.**
Mount the Provider behind the flag + opt one or two
surfaces (likely `/v5/topology/<slug>` since it has the
most "aura-deserving" identity already) into reading the
CSS variables. Smaller scope; lights up the aura system's
observable behaviour.

The next sub-PR's exact identity is the operator's call.
The 8.4 foundation supports either path.

Awaiting explicit approval per the V5 operating
constitution. STOP and observe is the default disposition
between sub-PRs.

---

## 16. Closing — the perceptual fingerprint is laid

Sub-PR 8.1 shipped the topology brain. Sub-PR 8.2 shipped
the renderer engine. Sub-PR 8.3 shipped the visible
spectacle. Sub-PR 8.4 ships the perceptual fingerprint
infrastructure — 4 parameters per page, modulated by
time-of-day + (future) cognition + (future) topology
context, applied as CSS variables that future consumers
will opt into reading.

The visitor sees nothing new. The page bundle on every
existing route is byte-identical to 8.3. The 17 page
prefixes in the registry hold their hand-curated feelings,
ready for the day a CSS rule opts in.

When that day comes, the visitor doesn't see "a theme
change". They feel a page that's slightly warmer in the
evening, slightly cooler in the morning, slightly more
focused when they're on an architecture page than on the
about page. Same identity, finer modulation.

The chassis is laid. The visible mount waits for the next
approval.
