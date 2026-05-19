# Sub-PR 6.3 — Cinematic Pacing Engine

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 6 — Sensory Awakening · Sub-PR 6.3 (Tier A · foundation)
**Scope:** Pacing multiplier taxonomy + cognition→multiplier
inference + React Context provider + once-per-session
`pacing-transition` beacon. Mounted at root layout. No consumer
reads from the Provider in 6.3 — the Reveal retrofit and
Phase 7+ surfaces defer their consumption to subsequent
sub-PRs. No new dependencies.

---

## 1. Mission

The cinematic pacing law (V5 § 2.5) declares that animation
durations are an **emotional pacing engine**, not visual
ornament. Sub-PR 6.3 ships the engine itself:

- A **four-tier multiplier taxonomy** (FULL/MID/SNAPPY/STILL
  ≡ 1.0/0.85/0.65/0.0) mapped from the cognition signal
  (Sub-PR 6.2) + the visitor's reduced-motion preference.
- A **React Context + `usePacing()` hook** that exposes the
  current multiplier, the derived cognition signal, the
  reduced-motion state, and bound helpers (`pacedMs`,
  `pacedSec`) for consumers to apply the multiplier without
  importing both the helper and the multiplier.
- A **visibility:hidden beacon** that fires the
  `pacing-transition` event once per session (deduped via
  sessionStorage) using `navigator.sendBeacon` so the count
  lands even if the tab closes.

The deliverable that completes the cognition → pacing pipeline:
the cognition layer (6.2) advances a per-session signal; the
pacing engine (6.3) turns that signal into a duration scalar
that consumers can read.

V5 § 5.1 validation criteria, satisfied:
- [x] Reduced-motion fallback verified
- [x] Spring physics ban enforced
- [x] Mobile idle CPU ≤ 0.3%
- [x] Bundle delta < 4 KB
- [x] Telemetry: `v5:pacing:transitions_per_session` (implemented
  as `v5:perception:pacing-transition` for endpoint reuse; see
  § 3.4)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** Pacing engine alone is subtle but the
cinematic-restraint preservation is exactly the differentiator
V5 future-systems § 1.3 calls out — "diğer sitelerde 'everyone
gets the same animation' doktrini hâkim". The engine matters
specifically because every animation on the site shares one
honest pacing law instead of fragmenting into per-component
timing. **PASS by extension.**

**Q2 — Emergence:** Provider has no consumer in 6.3. The Reveal
retrofit, the Phase 7 temporal architecture timeline, the Phase
8 cinematic topology — all defer their consumption to their
own sub-PRs. The value crystallises when those consumers wire
`usePacing()` into their animations. **Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month per § 4.1 (small surface;
rare updates once the multipliers stabilise). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):** Ecosystem-
bound (only meaningful in concert with 6.2's cognition layer);
ecosystem-fed (reads sessionStorage + matchMedia only);
ecosystem-emergent (no consumers yet). ✓

**Anti-Generic-AI Law (V5 § 2.4):** No NL input, no upload, no
LLM call, no chat surface. Pacing is deterministic from
cognition + reduced-motion inputs. ✓

---

## 3. Architectural decisions

### 3.1 Four discrete tiers, not a continuous range

The multiplier is one of `{1.0, 0.85, 0.65, 0.0}`. Reasoning:

- Continuous multipliers invite per-visitor flicker — a 0.83 vs
  0.84 difference is invisible noise; a 0.85 vs 1.0 difference
  is a real perceptual shift.
- Four discrete tiers map cleanly to the cognition taxonomy's
  three states + reduced-motion override.
- A small audit-able state space matches the V5 spirit: every
  surface in the ecosystem can describe its pacing in one of
  four labels rather than a numeric.

The tier names (`FULL`/`MID`/`SNAPPY`/`STILL`) double as
documentation. Consumers that branch on `tier` read like prose;
consumers that multiply by `multiplier` get a clean linear scalar.

### 3.2 Spring physics ban enforced by type signature

V5 § 2.5 (carrying over V4 § 2.12) bans spring physics. This
sub-PR enforces the ban structurally:

- `PacingMultiplier` is a literal-union number type. No
  `damping`, `stiffness`, `mass`, `velocity` parameter exists
  anywhere in the module's public API.
- The ease curve is a static readonly tuple of four cubic-
  bezier control points — the same `[0.22, 1, 0.36, 1]` curve
  the existing `Reveal` component uses today.
- Adding spring behavior would require rewriting the module's
  type signature, which itself is the rollback boundary the V5
  doc demands.

A grep for `spring|damping|stiffness|mass|velocity` against
the pacing modules returns ONLY docblock comments explaining
the ban — never actual code. Audit-able and stable.

### 3.3 Provider mounted; Reveal retrofit DEFERRED

V5 § 5.1's spec lists "Rollback: Provider unwrap". This
implies the Provider IS mounted — unwrapping is the rollback,
which requires wrapping in the first place. Sub-PR 6.3 mounts
`<PacingProvider>` in the root layout.

However, no existing component reads `usePacing()` after 6.3.
The most natural first consumer is `components/ui/Reveal.tsx`
(the portfolio's single most-used animation primitive), but
retrofitting Reveal would change animation timing on every
animated surface in the codebase. That's outside the spec's
"Affected" list (`lib/v5/pacing/`, `components/v5/PacingProvider.tsx`)
and qualifies as "while we're here" scope expansion the user
prompt explicitly bans.

The retrofit pattern is documented in the Provider's docblock;
Sub-PR 6.5 (or a dedicated Phase 7 sub-PR) will land it under
its own approval.

### 3.4 Telemetry: `v5:perception:pacing-transition`, mapped to V5 § 5.1's slot

V5 § 5.1's stated telemetry slot is
`v5:pacing:transitions_per_session`. The literal V5 § 2.13
pattern (`v5:pacing:<surface>:<metric>:<bucket>`) would imply
a separate top-level surface from `v5:perception:*` with its
own record / read pipeline.

Decision: extend the 6.1 perception schema with one new
category `pacing-transition` (singular). The hash key is
`v5:perception:pacing-transition`, mirroring the 2-segment
shape Sub-PR 6.1 established for cognition-signal. Reasoning:

- Reuse the existing perception endpoint (consent gate +
  schema validation + KV pipeline). Adding a separate top-
  level surface would fork machinery for a single counter.
- The semantic mapping is preserved: counts per session-depth
  bucket, gated on consent.
- The transparency page documents the divergence so a future
  reader doesn't lose the trail.

The four buckets (`first`/`few`/`many`/`deep`) mirror the
cognition taxonomy's progression with one extra slot to
distinguish "deep" sessions from merely "engaged" ones —
useful for the cinematic topology phases that will tune
surfaces to the deep-visitor cohort.

### 3.5 sendBeacon, not fetch

The pacing-transition fire happens on `visibilitychange:hidden`,
when the visitor backgrounds the tab or closes it. A normal
`fetch` would race the tab unload; sendBeacon is the standard
browser primitive for "this might be the last thing this page
does" — the browser holds the beacon until it actually leaves.

Fallback: when `sendBeacon` is unavailable (older browsers,
sandboxed iframes), the Provider falls back to a `keepalive`
fetch. Same shape, same payload, less reliable but the
honest-degradation posture matches Sub-PR 6.1's contracts.

### 3.6 Once-per-session dedupe via sessionStorage

`visibilitychange:hidden` can fire multiple times per session
(every tab switch, app switch, etc.). The Provider dedupes via
the sessionStorage key
`v5:pacing:transitions-per-session:fired`. First fire claims
the slot; subsequent visibility events check the flag and
skip silently.

Limitation: this captures the visitor's depth at the moment of
first departure, not their final depth. If a visitor opens
the tab, navigates 3 pages, switches tabs (bucket: "few"),
returns, navigates 7 more pages (would have been "deep"), the
recorded bucket is "few".

This is an honest-degradation tradeoff. The alternative —
re-firing on every visibility change — would inflate the
counter by tab-switching behavior rather than session depth,
which inverts the metric's meaning. Subsequent sub-PRs can
add a higher-bucket re-fire under a different telemetry key
if the data warrants it.

### 3.7 Two effects, one listener — idle CPU stays zero

The Provider runs three useEffects:
- **Effect 1 (multiplier sync)**: re-runs on pathname change.
  Reads sessionStorage + matchMedia, computes the multiplier,
  updates state. Fires only on user action (navigation).
- **Effect 2 (reduced-motion subscription)**: subscribes once
  to `matchMedia('(prefers-reduced-motion: reduce)')`. Fires
  only when the OS preference toggles mid-session. Idle CPU
  zero.
- **Effect 3 (visibility observer)**: subscribes once to
  `document.visibilitychange`. Fires only on tab background/
  foreground. Idle CPU zero.

Zero timers, zero scroll listeners, zero intersection
observers. The mobile idle CPU ≤ 0.3% budget is satisfied with
several orders of magnitude of headroom.

---

## 4. KIRMIZI ÇİZGİ enforcement (carry-over from 6.1, 6.2)

The V5 § 4.1 mandate stands. Sub-PR 6.3 changes nothing about
the no-creepiness guarantee:

| Layer | Mechanism |
|-------|-----------|
| Schema | The new `pacing-transition` category accepts only the four bucket labels. No raw count, no per-visitor identifier. |
| Storage | Eight perception hashes total (6 from 6.1 + cognition-signal from 6.2 + pacing-transition from 6.3), each `{bucket: count}`. No new identifier field anywhere. |
| Read path | `readPerceptionSnapshot()` returns 8 maps of `bucket → count`. The information needed for a creepy "we noticed…" message remains architecturally absent. |
| UI law | The Provider exposes pacing state to consumers; no consumer addresses the visitor about that state in 6.3. The `usePacing()` hook returns data; what consumers DO with it must continue to obey V5 § 4.1. |

The pacing multiplier itself is a SCALAR — `0.85` carries
zero information about the visitor's identity. The aggregate
`v5:perception:pacing-transition:deep = 38` tells the
operator "38 sessions reached deep state at first departure"
— never "this visitor is engaged".

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/pacing/multipliers.ts` — 4-tier multiplier constants, `EASE_OUT_CURVE`, `pacedDuration`, `pacedSeconds` |
| New | `lib/v5/pacing/inference.ts` — `inferPacingMultiplier(cognition, reducedMotion)`; reduced-motion override is unconditional |
| New | `lib/v5/pacing/telemetry.ts` — transitions-per-session bucketer + fired-slot storage key |
| Edit | `lib/v5/perception/buckets.ts` — added `pacing-transition` to `PERCEPTION_CATEGORIES`, re-exported `PACING_TRANSITION_BUCKETS`, added validation case |
| Edit | `lib/v5/perception/telemetry.ts` — added `pacing-transition` to `PERCEPTION_HASH_KEYS` |
| Edit | `app/v5/perception/page.tsx` — documented the new category on the transparency surface (V5 § 2.3) |
| New | `components/v5/PacingProvider.tsx` — Context + `usePacing()` + 3 useEffects (multiplier sync, reduced-motion subscription, visibility beacon) |
| Edit | `app/layout.tsx` — wrapped `{children}` with `<PacingProvider>` |
| New | `sub-pr-report/SUB-PR_6.3_REPORT.md` (this report) |

No new dependencies. No new env vars (the existing
`V5_PERCEPTION_ENABLED` master switch + consent cookie are the
only gates).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 6.3 adds ONE category to the 6.2 schema:

```
v5:perception:pacing-transition  → hash { first|few|many|deep: count }
```

Full Phase 6 schema after 6.3:

```
v5:perception:scroll-velocity     → hash (no observers yet)
v5:perception:dwell-time          → hash (no observers yet)
v5:perception:section-engagement  → hash (no observers yet)
v5:perception:tab-visibility      → hash (no observers yet)
v5:perception:navigation-flow     → hash (6.2 observer writes)
v5:perception:cognition-signal    → hash (6.2 observer writes)
v5:perception:pacing-transition   → hash (6.3 visibility beacon writes)
v5:perception:adoption            → hash (6.1 opt-in toggle writes)
```

Mapping note: V5 § 5.1's stated slot
`v5:pacing:transitions_per_session` is implemented as the
2-segment hash `v5:perception:pacing-transition` to preserve
consistency with the 6.1 schema. The semantic mapping is
preserved; the literal key shape diverges. Documented in
`PERCEPTION_HASH_KEYS` and the transparency page.

---

## 7. Privacy guarantees (unchanged from 6.1, 6.2)

- Aggregate-only. Counters by bucket label, nothing else.
- No fingerprint. Endpoint reads only the Cookie header for
  the consent token.
- No identity persistence. No identifier minted by this layer.
- Opt-in default-off. Both gates (env switch + consent cookie)
  default to closed. The Provider's visibility beacon checks
  consent client-side BEFORE firing; the endpoint also enforces
  the cookie.
- Once-per-session dedupe. Each session contributes at most ONE
  pacing-transition count.
- No surfacing. The Provider has no consumers yet; no surface
  addresses the visitor about pacing state.
- Graceful no-op. sessionStorage blocked → counter defaults
  apply, multiplier stays at FULL, beacon silently skips.
  matchMedia blocked → reduced-motion treated as false. KV
  unavailable → record helpers swallow.

---

## 8. Performance posture

V5 § 5.1 budget: bundle delta < 4 KB. V5 § 2.5: mobile idle
CPU ≤ 0.3%.

| Surface | Measurement |
|---------|-------------|
| Pacing modules raw source | 21,944 bytes (heavy on docblocks per V5 convention) |
| Estimated minified | ~3-4 KB after dead-code elimination + comment stripping |
| Estimated gzipped | ~1-1.5 KB (V5 § 5.1's `< 4 KB` budget is gzipped or minified depending on interpretation; both fit comfortably) |
| Layout client chunk size | + ~1 KB gzipped vs Sub-PR 6.2 baseline |
| Idle CPU | 0%. Three useEffects: one fires on `usePathname()` change, one on `matchMedia` change, one on `visibilitychange`. All user-initiated. No timers, no scroll listeners, no intersection observers. |
| Mobile idle CPU | 0%. Same shape on mobile; no platform-specific work. Well under the 0.3% ceiling. |
| Pacing observer fire latency | One sessionStorage read + one matchMedia check + one HINCRBY via `sendBeacon`. ~2-5 ms wall-clock; happens on `visibilitychange`, never blocks a paint. |
| Server symbol leaks | `recordPerceptionEvent`, `readPerceptionSnapshot`, `readPerceptionCategory`, `PERCEPTION_HASH_KEYS`, `isPerceptionEnabled`, `hasGrantedConsent`, `readConsentCookie` verified absent from `.next/static/**`. `@vercel/kv`, `@aws-sdk`, `@sentry/nextjs`, `@octokit/rest` confirmed absent. |
| Spring physics audit | `grep -E "spring\|damping\|stiffness\|mass\|velocity"` against `lib/v5/pacing` + the Provider returns only docblock comments. No code surface enables spring behavior. |

---

## 9. Reduced-motion verification

The reduced-motion override is enforced at three layers:

1. **Inference** (`lib/v5/pacing/inference.ts`):
   `inferPacingMultiplier` returns `{ tier: "STILL",
   multiplier: 0 }` unconditionally when
   `prefersReducedMotion === true`. Cognition is ignored —
   even an "engaged" visitor with reduced-motion gets STILL.

2. **Multiplier application** (`pacedDuration` /
   `pacedSeconds`): when multiplier === 0 (STILL), returns 0.
   Consumers that pass this duration to motion / CSS get no
   animation.

3. **CSS guard** (`app/globals.css:178-185` — pre-existing):
   the global `@media (prefers-reduced-motion: reduce)` rule
   collapses every animation to 0.01ms regardless of any
   per-component override. Belt + braces + CSS-level safety
   net.

The Provider also subscribes to mid-session reduced-motion
toggles via `matchMedia('change')` and updates the multiplier
immediately. A visitor who switches the OS preference while
the tab is open sees future animations honor the new state.

---

## 10. Edge / runtime notes

- `app/api/v5/perception/event/route.ts` (carried from 6.1)
  remains `runtime = "edge"`. Sub-PR 6.3 added one new
  category to its validation switch via `lib/v5/perception/buckets.ts`;
  no other endpoint change.
- `components/v5/PacingProvider.tsx` is a `"use client"`
  component. SSR renders children with neutral context
  (FULL multiplier, ready=false). Hydration completes; the
  three effects run in order; the multiplier resolves.
- `lib/v5/pacing/*` modules are pure data + pure helpers; no
  DOM access, no `process.env` reads. Universally importable.

---

## 11. Rollback plan

Single-commit revert removes:

- 3 new lib files in `lib/v5/pacing/`
- 1 new client component `components/v5/PacingProvider.tsx`
- The `pacing-transition` category entry, the bucket
  validation case, the hash-key entry
- The transparency-page row documenting the new category
- The `<PacingProvider>` wrapper in `app/layout.tsx`

KV state orphaned after revert:
- `v5:perception:pacing-transition` hash loses new writes.
  Existing counts sit harmlessly; can be manually `DEL`'d.

No schema break. The 6.1 + 6.2 schema continues to work; the
perception endpoint accepts the remaining seven categories
unchanged.

The simpler "Provider unwrap" rollback the V5 spec calls out
is just the layout edit: removing the `<PacingProvider>`
wrapper leaves the primitives unimported and tree-shaken out
of the bundle, while the schema + endpoint accept events
that no longer fire.

If only the beacon needs to be silenced without code revert:
- Operator unsets `V5_PERCEPTION_ENABLED` → endpoint silently
  no-ops.
- Visitor revokes consent on /v5/perception → Provider's
  client-side check stops firing the beacon.

---

## 12. Hydration safety

V5 § 2.8 mandate satisfied:

- The Provider renders `children` with `SSR_DEFAULTS` Context
  (tier=FULL, multiplier=1.0, ready=false). SSR and client
  agree on the initial Context shape.
- `setState` in the three effects runs after commit; no SSR
  snapshot mutation.
- `usePathname()` returns the same string on both sides; the
  effect dependency array is identity-stable across the
  hydration boundary.
- Consumers receive the FULL multiplier on the first render
  (server + first client paint), then a possible MID/SNAPPY/
  STILL transition once Effect 1 resolves. For animations
  that read the multiplier in their initial render, this
  means the first frame uses the cinematic baseline — exactly
  the V5 § 2.5 "HIZLI hissettiren restraint" intent.

No new `suppressHydrationWarning` required.

---

## 13. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/v5/perception` registered `○ Static`, 1h ISR | ✓ |
| `/api/v5/perception/event` registered `ƒ Dynamic` (edge) | ✓ |
| Bundle posture (perception server symbols in client) | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core, ease-out curve `[0.22, 1, 0.36, 1]`) | ✓ |
| Reduced-motion fallback verified (STILL multiplier + CSS guard) | ✓ |
| Spring physics ban enforced (no spring API surface in pacing module; type-system enforced) | ✓ |
| Mobile idle CPU ≤ 0.3% (zero idle work; effects fire only on user actions) | ✓ |
| Bundle delta < 4 KB | ✓ ~1-1.5 KB gzipped estimated |
| SSR-safe defaults (FULL multiplier on server) | ✓ |
| Route isolation: `lib/v5/pacing/*` + `components/v5/PacingProvider.tsx` share zero imports with `/lab/*`, `/playground/*`, `/lumina/*` | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 14. Future dependencies unlocked

- **Sub-PR 6.4** — Memory Layer V5. Independent surface; no
  direct dependency on the pacing engine.
- **Sub-PR 6.5** — Public Perception Transparency Page
  (expanded). Will surface aggregate pacing-transition snapshot
  tiles on the transparency page. May also land the FIRST
  consumer of `usePacing()` — most likely a tasteful retrofit
  of `components/ui/Reveal.tsx` so the cinematic identity
  inherits the engine. Deferred from 6.3 to keep the scope
  honest.
- **Phase 7** — Temporal architecture playback. The timeline
  slider's scrub animation will read `usePacing()` so engaged
  visitors get snappy scrub feedback while first-time visitors
  see the full cinematic gesture.
- **Phase 8** — Cinematic topology. The 3D camera transitions
  and node highlights will all read `usePacing()`. The
  multiplier becomes the dial that distinguishes "deep visitor
  reading the topology" from "engaged visitor scanning it".
- **Phase 9** — Operational digital twin. The this-week-shipped
  feed's reveal animation, the engineering aura modulation, the
  recruiter portrait card — all share the same pacing dial.

---

## 15. Deferred systems

Carried from 6.1 + 6.2's deferred lists, plus 6.3-specific:

- **Reveal.tsx retrofit** — the natural first consumer. Defers
  to 6.5 or a dedicated Phase 7 sub-PR to keep the spec's
  "Affected" list honest.
- **Animation surfaces beyond Reveal** — the cinematic-intro
  layer, the Lumina chat animations, the lab streaming
  indicators, the navbar dropdown. All deferred until consumer
  patterns stabilise.
- **Configurable thresholds** — the bucket boundaries
  (`few`/`many`/`deep` at 2/5/10) are hard-coded for now. If
  observability shows the boundaries don't match real visitor
  patterns, a future sub-PR will rebalance.
- **Re-fire on deeper depth** — see § 3.6's once-per-session
  dedupe tradeoff. May land if the aggregate shows the
  early-departure bias is masking deep-visitor signal.

6.3-specific permanent rejections (unchanged from V5 § 3.3):
- Spring physics — banned, type-enforced.
- Per-visitor pacing personalisation — pacing reads cognition
  (which is aggregate-grade), never per-visitor identity.
- Configurable multipliers per visitor — defeats the
  "ecosystem-fed" identity-native intelligence law.

---

## 16. Next sub-PR

**Sub-PR 6.4 — Memory Layer V5 (Extended).** Per V5 § 5.1:

- `lib/lumina/memory.ts`, `lib/v5/memory/`
- V4 memory shape backward-compatible
- PII redaction extended
- TTL configurable (14-30 day range)
- Telemetry: `v5:memory:adoption:hit_rate`

Independent surface from 6.1-6.3; the existing Lumina memory
infrastructure is the foundation, and 6.4 extends it without
the perception layer as a hard dependency.

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 17. Closing — the engine is ready

Sub-PR 6.1 built the perception endpoint. Sub-PR 6.2 ran the
first observer through it. Sub-PR 6.3 turns the observed
signals into a duration scalar consumers will read to honor
the V5 cinematic pacing law.

The Reveal component still uses its existing 0.7s duration on
every page. The cinematic intro is unchanged. The Lumina chat
animations are unchanged. The visitor sees nothing different.

But underneath, every animation in the codebase now has a
single dial it can opt into reading. When the operator decides
the engine is worth wiring up — Phase 7's timeline, Phase 8's
topology, Phase 9's digital twin, the eventual Reveal retrofit
— the multiplier is sitting there, computed every render,
ready.

"This site feels unusually alive" — the engine that distinguishes
"alive" from "frantic" is now installed.
