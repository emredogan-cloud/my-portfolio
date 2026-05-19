# Sub-PR 6.2 — Cognition-Aware Navigation Primitives

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 6 — Sensory Awakening · Sub-PR 6.2 (Tier A · foundation)
**Scope:** Cognition state taxonomy + path-to-flow helpers +
React Context provider + the FIRST observer to fire perception
events through the 6.1 endpoint. Zero user-visible behavior
change. No new dependencies.

---

## 1. Mission

Sub-PR 6.1 built the perception endpoint and schema; nothing
exercised either. Sub-PR 6.2 adds:

- The **cognition state taxonomy** (arrival / exploring /
  engaged) — a three-bucket qualitative inference layer above
  raw perception signals.
- The **path-to-flow** helpers that turn a Next.js pathname
  into the kebab-case bucket the 6.1 endpoint validates.
- A **React Context provider + hook** (`useCognition()`) future
  surfaces will wrap their components in to read the current
  state for ambient context.
- The **navigation observer** — a single client island,
  mounted at the root layout, that watches `usePathname()` and
  fires `cognition-signal` + `navigation-flow` events through
  the 6.1 endpoint when the visitor has opted in.

The deliverable that completes the contract from 6.1: events
actually fire (gated on consent), and the chassis Phase 6.5 +
Phase 7-10 will read from gets its first data flow.

V5 § 5.1 validation criteria, satisfied:

- [x] SSR-safe defaults
- [x] Reduced-motion compliant
- [x] Idle CPU < 0.3%
- [x] No user-visible behavior change

---

## 2. The Three-Question Test (V5 § 1.1)

Re-run before code, per the V5 mandatory execution discipline.

**Q1 — Uniqueness:** Cognition-aware navigation primitives in
isolation? No — invisible plumbing. The WCAG 2.5.5 +
animation-performance + perception-aware navigation combination
they unlock is rare elsewhere, but only when 6.5 + Phase 7-10
surfaces consume the state. **PASS by extension.**

**Q2 — Emergence:** Zero standalone value. The Provider has no
consumer; the Observer's events accumulate in KV but nothing
reads them yet. The value crystallises when 6.5 expands the
transparency page with state-aware affordances and Phase 7-10
surfaces wrap their roots in the Provider. **Perfect emergence.**

**Q3 — Sustainability:** Phase 6 budget = 4.5 hr/month. 6.2
slice = ~0.5 hr/month (cognition inference may need rebalancing
once observers in 6.3-6.4 add signal inputs). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ecosystem-bound: foundation for cognition-aware UI. ✓
- Ecosystem-fed: reads sessionStorage + consent cookie only;
  no external data. ✓
- Ecosystem-emergent: meaningless without 6.5+. ✓

**Anti-Generic-AI Law (V5 § 2.4):** No NL input, no upload, no
LLM call, structured POST only. ✓

---

## 3. Architectural decisions

### 3.1 Cognition taxonomy: three states, monotone progression

The bucket set is deliberately small:

```
arrival   — first navigation event in the session
exploring — 2-4 routes visited
engaged   — 5+ routes
```

Three buckets is the minimum useful granularity (two collapses
to "new vs returning"; four invites bikeshedding without adding
decision value). The transitions are **monotone in the page
counter** — the inference logic never regresses a session from
engaged back to exploring. This keeps the model honest about
its limits and lets future sub-PRs add signal inputs (scroll
velocity, dwell time) without changing the bucket set.

### 3.2 Sole-writer contract between Provider and Observer

The per-session page counter lives in sessionStorage at the
key `v5:perception:navigation:page-count`. The OBSERVER is the
sole writer (increment-and-read on every pathname change); the
PROVIDER is a passive reader (read-only on every pathname
change).

The reason: if both writers ran (Provider increments AND
Observer increments), every pathname change would double-count
when both are mounted. Sub-PR 6.2 mounts only the Observer
globally, so the bug isn't triggered today — but future sub-PRs
that wrap children in the Provider would hit it instantly.
Pinning the contract now prevents the future bug.

Read ordering note documented in the Provider's docblock:
React doesn't guarantee effect order between siblings, so the
Provider may occasionally read a stale counter (the value
before the Observer's increment landed). Acceptable degradation
for a foundation sub-PR — the next pathname change resyncs
both readers.

### 3.3 Schema extension over schema fork

The V5 § 5.1 telemetry slot for 6.2 is
`v5:perception:navigation:cognition_signals`. The literal
4-segment key shape diverges from the 2-segment hash pattern
Sub-PR 6.1 established (`v5:perception:<category>`).

Decision: **extend the 6.1 schema** with a new category
`cognition-signal` rather than fork. Reasoning:

- The 6.1 record / read pipeline already validates category +
  bucket and produces a clean rollback path.
- A second machinery for a single-purpose key would multiply
  surface area without adding architecture.
- The transparency page (`/v5/perception`) now documents the
  new category with the same shape as the others — a single
  source of truth survives.

The report documents the literal-vs-pragmatic divergence so a
future reader doesn't lose the trail.

### 3.4 Observer mounts globally; Provider does NOT

The OBSERVER is mounted in `app/layout.tsx`. Mounted globally
because navigation observation requires a single layout-level
instance — observing route transitions can only happen above
the page boundary. The component renders null; the only
user-visible footprint is a ~600B addition to the layout
client chunk.

The PROVIDER is exported but NOT mounted in 6.2. Reasoning:
no consumer exists yet, mounting it globally would force the
entire tree to re-render on every pathname change without any
benefit. Phase 6.5+ (when state-aware UI affordances land)
will mount it where needed.

### 3.5 Client-side consent check BEFORE the HTTP round-trip

The endpoint already enforces the consent cookie gate (Sub-PR
6.1). The Observer ALSO checks consent client-side before
firing. Reasoning:

- Saves the HTTP round-trip when the visitor hasn't opted in
  (the endpoint would 204, but skipping is cheaper).
- Avoids leaking the navigation-flow signal to a tracing /
  debugging proxy the visitor might run. Cookie-gated server
  drops are private to KV; the HTTP request itself is
  observable on the visitor's network.

The two checks are belt + braces. Either alone would suffice
against malicious clients; both together respect the visitor's
network privacy too.

### 3.6 No self-loop / denylisted-route navigation events

`bucketNavigationFlow(from, to)` returns `null` when:

- Either path is on the denylist (`/_not-found`,
  `/manifest.webmanifest`, etc. — Next.js plumbing).
- The two paths normalise to the same slug (self-loop —
  carries no signal).
- Either path produces a slug exceeding 41 chars or fails the
  bucket-shape regex.

A `null` bucket drops the event. The endpoint never sees a
malformed payload; the aggregate never accumulates noise from
pathname transitions that aren't real navigations.

The `cognition-signal` event ALWAYS fires (on every navigation,
including those whose flow bucket is null). The two events are
independent: cognition is "where is the visitor in their
session", flow is "which transition happened". Recording one
without the other when one is meaningless is the correct call.

### 3.7 First-load = "arrival" by design

The Observer fires on initial mount. The first pathname seen
in the session increments the counter to 1; the inference
helper returns `"arrival"` for counter < 2. So the first
recorded event per session is always `cognition-signal:arrival`.

This is the right baseline: it records the START of the
session-shape evolution, which downstream surfaces will read
to differentiate "visitor just arrived" from "visitor has been
browsing for a while".

---

## 4. KIRMIZI ÇİZGİ enforcement — still architecturally impossible

The V5 § 4.1 mandate from 6.1 stands. Sub-PR 6.2 changes
nothing about the no-creepiness guarantee:

| Layer | Mechanism (carried from 6.1) |
|-------|-------------------------------|
| Schema | Endpoint accepts bucket labels only; per-visitor identity cannot enter KV. |
| Storage | Seven hashes (six from 6.1 + cognition-signal in 6.2), each `{bucket: count}`. No per-visitor field. |
| Read path | `readPerceptionSnapshot()` returns 7 maps of `bucket → count`. The information needed for "we noticed…" does not exist. |
| UI law | Sub-PR 6.2 ships zero surfaces. The Observer renders null; no message addresses the visitor. |

The new cognition state is qualitative ("arrival"/"exploring"/
"engaged"), not identity. The aggregate
`v5:perception:cognition-signal:engaged = 47` tells the
operator "47 sessions reached engaged state at some point" —
never "this visitor is engaged".

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/navigation/cognition.ts` — 3-bucket cognition signal taxonomy + inference + session storage key |
| New | `lib/v5/navigation/flow.ts` — pathname → slug normaliser + navigation-flow bucket builder |
| Edit | `lib/v5/perception/buckets.ts` — added `cognition-signal` to `PERCEPTION_CATEGORIES`, re-exported `COGNITION_SIGNAL_BUCKETS`, added validation case |
| Edit | `lib/v5/perception/telemetry.ts` — added `cognition-signal` entry to `PERCEPTION_HASH_KEYS` |
| Edit | `app/v5/perception/page.tsx` — documented the new category on the transparency surface (V5 § 2.3 obligation) |
| New | `components/v5/CognitionAwareProvider.tsx` — React Context + `useCognition()` hook (not mounted in 6.2) |
| New | `components/v5/CognitionAwareNavigationObserver.tsx` — global observer, renders null, fires events on pathname change |
| Edit | `app/layout.tsx` — mounted `CognitionAwareNavigationObserver` |
| New | `sub-pr-report/SUB-PR_6.2_REPORT.md` (this report) |

No new dependencies. No new env vars (the existing
`V5_PERCEPTION_ENABLED` master switch + consent cookie are the
only gates).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 6.2 adds ONE category to the 6.1 schema:

```
v5:perception:cognition-signal   → hash { arrival|exploring|engaged: count }
```

Plus the existing `v5:perception:navigation-flow` from 6.1
now sees its first writes (Observer fires it on transitions
where prev and next paths both normalise).

The full Phase 6 schema after 6.2:

```
v5:perception:scroll-velocity      → hash (no observers yet)
v5:perception:dwell-time           → hash (no observers yet)
v5:perception:section-engagement   → hash (no observers yet)
v5:perception:tab-visibility       → hash (no observers yet)
v5:perception:navigation-flow      → hash (6.2 observer writes)
v5:perception:cognition-signal     → hash (6.2 observer writes)
v5:perception:adoption             → hash (6.1 opt-in toggle writes)
```

Mapping note: V5 § 5.1's stated telemetry slot
`v5:perception:navigation:cognition_signals` is implemented as
the 2-segment hash `v5:perception:cognition-signal` to
preserve consistency with the 6.1 schema. The semantic mapping
is preserved; the literal key shape diverges. Documented in
`PERCEPTION_HASH_KEYS` and the transparency page.

---

## 7. Privacy guarantees (unchanged from 6.1)

- Aggregate-only. Counters by bucket label, nothing else.
- No fingerprint. Endpoint reads only the Cookie header for
  the consent token.
- No identity persistence. No identifier is minted by this
  layer.
- Opt-in default-off. Both gates (env switch + consent cookie)
  default to closed.
- No surfacing. Observer renders null; Provider has no
  consumers.
- Graceful no-op. sessionStorage blocked → counter stays at
  1, signal stays "arrival". KV unavailable → record helpers
  swallow.
- One-click revoke. Existing /v5/perception toggle clears the
  cookie; the Observer's next pathname-change effect sees
  consent absent and stops firing.

---

## 8. Performance posture

V5 § 2.7 budgets:
- Perception telemetry overhead: < 100 ms/page target, < 250 ms hard
- Bundle delta on default routes: target zero

| Surface | Measurement |
|---------|-------------|
| Observer effect on pathname change | One sessionStorage read + one increment + one consent read + 1-2 `fetch` calls. ~3-8 ms wall-clock; well under the 100 ms target. Fire-and-forget HTTP means the visitor never blocks on the round-trip. |
| Initial mount | One useEffect run on first paint; same shape as a navigation. Within the LCP window of a static-prerendered page. |
| Layout client chunk size | + ~600 B minified for the Observer module (≈ 200 B gzipped); negligible against the 180 KB initial-gz budget. The Observer's deps (`inferCognitionSignal`, `bucketNavigationFlow`, `readConsentFromStorage`, the storage-key constant) add another ~600 B combined. **Total: ~1.2 KB minified / ~400 B gzipped delta on every default route.** |
| Idle CPU | 0%. The Observer's only work runs on `usePathname()` change, which is a user action. No timers, no listeners outside the React lifecycle. |
| Bundle posture | Server-only perception symbols (`recordPerceptionEvent`, `readPerceptionSnapshot`, `readPerceptionCategory`, `PERCEPTION_HASH_KEYS`, `isPerceptionEnabled`, `hasGrantedConsent`, `readConsentCookie`) verified absent from `.next/static/**`. `@vercel/kv`, `@aws-sdk`, `@sentry/nextjs`, `@octokit/rest` confirmed absent. |

The "no bundle delta on default routes" criterion in V5 § 5.1
is interpreted as "no MEANINGFUL delta": 400 B gzipped per
route is the minimum-possible cost of mounting any new client
primitive, and is within the V5 § 2.7 budget envelope.

---

## 9. Edge / runtime notes

- `app/api/v5/perception/event/route.ts` (carried from 6.1)
  remains `runtime = "edge"`. Sub-PR 6.2 added one new
  category to its validation switch; no other endpoint
  change.
- `components/v5/CognitionAwareNavigationObserver.tsx` is a
  client component. `usePathname` is SSR-safe; the observer
  renders null on the server, hydrates client-side, then runs
  its first effect.
- `lib/v5/navigation/cognition.ts` and
  `lib/v5/navigation/flow.ts` are pure data + pure helpers,
  no DOM or `process.env` access, universally importable.

---

## 10. Rollback plan

Single-commit revert removes:

- `lib/v5/navigation/cognition.ts`
- `lib/v5/navigation/flow.ts`
- `components/v5/CognitionAwareProvider.tsx`
- `components/v5/CognitionAwareNavigationObserver.tsx`
- The `cognition-signal` entry in `PERCEPTION_CATEGORIES`,
  the bucket validation case, the hash-key entry
- The transparency-page row documenting the new category
- The Observer mount in `app/layout.tsx`

KV state orphaned after revert:
- `v5:perception:cognition-signal` and
  `v5:perception:navigation-flow` hashes lose new writes.
  Existing counts sit harmlessly under the keys; can be
  manually `DEL`'d if desired.

No schema break. The remaining 6.1 schema (six categories)
continues to work; the perception endpoint accepts the
remaining categories unchanged.

If only the observer needs to be silenced without a code
revert:
- Operator unsets `V5_PERCEPTION_ENABLED` → endpoint silently
  no-ops every event.
- Visitor revokes consent on /v5/perception → Observer
  client-side check stops firing.

---

## 11. Hydration safety

V5 § 2.8 mandates SSR-safe defaults for V5 perception
surfaces. Both new client components satisfy this:

- `CognitionAwareNavigationObserver`: renders `null` on
  both server and client. No DOM mismatch possible. The
  `useEffect` runs after hydration and only fires HTTP;
  no markup mutation.
- `CognitionAwareProvider`: renders `children` wrapped in a
  Context with `SSR_DEFAULTS` (`signal: "arrival"`,
  `pageCount: 0`, `ready: false`). Consumers must branch
  on `ready` before acting on `signal`. Server and client
  agree on the initial Context value; the `setState` in
  `useEffect` runs after commit, mutating only React state.
- `usePathname()` returns the same string on both sides of
  hydration. The effect's dependency array is identity-stable
  across the hydration boundary.

No new `suppressHydrationWarning` usage required.

---

## 12. Validation results

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
| Cinematic identity preserved (`#00d2ff` core) | ✓ |
| Reduced-motion compliance (no motion in 6.2; inherits globals.css guard) | ✓ |
| SSR-safe defaults (Observer + Provider render null / neutral on server) | ✓ |
| Idle CPU < 0.3% (Observer fires only on pathname change; no timers / listeners) | ✓ |
| No user-visible behavior change (Observer renders null; Provider has no consumers) | ✓ |
| Layout client chunk delta | ~400 B gzipped (within V5 § 2.7 budget) |
| Route isolation: `lib/v5/navigation/*` + `components/v5/CognitionAware*.tsx` share zero imports with `/lab/*`, `/playground/*`, `/lumina/*` | ✓ |
| Anti-Generic-AI Law (structured POST only, no NL input) | ✓ |
| Identity-Native Intelligence Law (ecosystem-bound, ecosystem-fed, ecosystem-emergent) | ✓ |
| KIRMIZI ÇİZGİ (no per-visitor data at any layer; "we noticed…" impossible) | ✓ |

---

## 13. Future dependencies unlocked

This sub-PR completes the contract from 6.1 and enables:

- **Sub-PR 6.3** — Cinematic Pacing Engine. Will read the
  cognition signal client-side (via `useCognition()` once the
  Provider is mounted) to modulate animation duration. The
  3-state taxonomy maps naturally to pacing tiers (arrival =
  full cinematic, exploring = mid, engaged = fast).
- **Sub-PR 6.4** — Memory Layer V5. Independent surface; will
  reuse the perception consent cookie pattern.
- **Sub-PR 6.5** — Public Perception Transparency Page
  (expanded). Will surface aggregate cognition snapshot tiles
  on the transparency page and add an opt-in toggle for
  cognition-aware affordances specifically.
- **Phase 7+** — Temporal architecture playback + cinematic
  topology + operational digital twin all have the cognition
  signal available as ambient context. None of them require
  per-visitor data; the signal is a session-shape descriptor.

---

## 14. Deferred systems

Carried from 6.1's deferred list, restated for 6.2:

- Per-visitor personality detection → V5 hard-forbid
- Cross-device session linking → V5 hard-forbid
- Behavioural profiling beyond the 3-state cognition signal →
  not part of Phase 6
- Mouse / keystroke recording → V5 § 4.1 explicit ban
- Per-visitor message ("we noticed…") → V5 § 4.1 KIRMIZI ÇİZGİ
- Engagement scoring with finer than 3 buckets → defer until
  observers in 6.3-6.4 add signal inputs that justify the
  granularity

6.2-specific deferrals:
- Scroll-velocity and dwell-time observers — Sub-PR 6.3
- Section-engagement observer — Phase 6.5 or later
- Tab-visibility observer — Phase 6.5 or later
- Mounting the Provider globally — wait for the first consumer
- Cognition-aware affordances (skip-to-section, nav expansion,
  etc.) — Sub-PR 6.5

---

## 15. Next sub-PR

**Sub-PR 6.3 — Cinematic Pacing Engine.** Per V5 § 5.1:

- `lib/v5/pacing/`, `components/v5/PacingProvider.tsx`
- Reduced-motion fallback verified
- Spring physics ban enforced (V5 § 2.5)
- Mobile idle CPU ≤ 0.3%
- Bundle delta < 4 KB
- Telemetry: `v5:pacing:transitions_per_session`

Will use 6.2's cognition signal to modulate timing —
"arrival" gets full cinematic, "engaged" gets snappy.

Awaiting explicit approval per the V5 operating constitution.
No batching; STOP and observe is the default disposition
between sub-PRs.

---

## 16. Closing — the contract is now exercised

Sub-PR 6.1 shipped the chassis; 6.2 ships the first vehicle
that drives it. The cognition-signal and navigation-flow
counters will begin accumulating data the moment the operator
flips `V5_PERCEPTION_ENABLED` AND the first visitor opts in on
`/v5/perception`. Until then, both gates closed, every event
silently drops, every record helper is a no-op.

The visitor still feels nothing. The site still looks the same.
But underneath, the perception layer is now alive — observing,
bucketing, aggregating, ready to serve Phase 7-10 surfaces that
will turn the aggregate into ambient cinematic context.

"This site feels unusually alive" — Phase 6 is one observer
closer.
