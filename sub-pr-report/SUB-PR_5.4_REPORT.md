# Sub-PR 5.4 — Telemetry expansion for experiments

**Branch:** `feat/v4-phase5-experimental-foundation` (continued)
**Phase:** V4 Phase 5 — Experimental Expansion (CONDITIONAL) · Priority A.4
**Scope:** Per-experiment funnel telemetry (visit → mount /
capability-miss). Single discriminated endpoint, three KV
hashes, surfaced on the playground index. No new dependencies.

---

## 1. Mission

The final Priority A item closes the foundation. 5.1 built the
chassis, 5.2 built the runtime guards, 5.3 wired the first shell.
5.4 makes the playground **measurable** so the conditional
"should this experiment graduate or fold?" question has data.

The funnel is intentionally minimal:

```
visit → (capability check)
          ├── pass → mount
          └── fail → capability-miss
```

Three counts per experiment. Operators read the relationship:
how many people reached the page, how many cleared the gate, how
many got blocked by requirements. Sufficient signal for go/no-go
on each experiment without inventing a heavier analytics stack.

---

## 2. Architectural decisions

### 2.1 Single discriminated endpoint
`/api/playground/event` accepts `{ type: "visit" | "mount" | "capability-miss", slug }`. One route, one validation pass,
one switch dispatch to the right `recordPlayground*` helper. The
alternative (three endpoints) would have multiplied the surface
area without adding architecture.

The endpoint is **playground-isolated** under `/api/playground/*`
rather than living under the general `/api/telemetry/*` surface.
Reason: the playground is conditional Phase 5 territory; its
telemetry concerns shouldn't bleed into the production telemetry
surface that ships in every phase. Removing the playground namespace
later means deleting `/api/playground/*` cleanly without touching
the rest.

### 2.2 Slug allow-list at the endpoint
The endpoint calls `getExperiment(slug)` and silently drops any
slug that isn't in the registry. Same anti-poison posture as
`/api/telemetry/visit` — no anonymous caller can run up arbitrary
KV fields by inventing slugs.

### 2.3 Three hashes, one field per slug
Same pattern Phase 4.3 established for Lumina tool telemetry:

```
v5:playground:experiment-visits     → { slug: count, ... }
v5:playground:experiment-mounts     → { slug: count, ... }
v5:playground:capability-misses     → { slug: count, ... }
```

Adding a new experiment requires zero schema changes — the field
appears on first event. Removing one leaves an orphan field
that's harmless.

### 2.4 Session-storage guarded firing
Every event fires AT MOST ONCE per tab session per slug per type.
Three session-storage keys:

```
v5:playground:visit:<slug>             ← fired by ExperimentVisitPing
v5:playground:mount:<slug>             ← fired by ExperimentMount on mount
v5:playground:capability-miss:<slug>   ← fired by ExperimentMount on miss
```

The guard runs in try/catch — blocked sessionStorage falls through
to "fire anyway" (one extra count per page load in that edge case).

### 2.5 ExperimentMount fires telemetry from a useEffect, NOT during render
A new effect inside `ExperimentMount` watches `caps.ready` +
`misses.length` + `experiment.slug` and fires the right event
when the probe resolves. Two reasons it's in an effect:

- Fetch calls don't belong in a render path
- The effect runs after commit, so the "checking environment"
  placeholder phase doesn't fire stale events

The session-storage guard ensures the event fires exactly once
per (slug, type) per tab session, even if the visitor toggles
reduced-motion mid-session and the effect re-runs.

### 2.6 Funnel cells render only when non-zero
The `/playground` index cards show the visit/mount/cap-miss cells
ONLY when at least one of the three is > 0. Zero-data noise
suppressed. Default-OFF playground state means no cells render
at all — the cards look identical to the 5.3 baseline.

Once an operator flips a flag and a visitor lands on the
experiment, the cells appear within the hourly ISR window.

---

## 3. What changed

| Action | File |
|--------|------|
| Edit | `lib/telemetry/metrics.ts` — 3 hash key constants, `recordPlaygroundVisit/Mount/CapabilityMiss`, `readPlaygroundCounters` (parallel HGETALL × 3) |
| New | `app/api/playground/event/route.ts` — discriminated POST, edge runtime, slug allow-list, fire-and-forget HINCRBY, always 204 |
| New | `app/playground/_components/ExperimentVisitPing.tsx` — per-experiment visit ping (sibling to the standard VisitPing), session-storage-guarded |
| Edit | `app/playground/_components/ExperimentMount.tsx` — new effect fires `mount` or `capability-miss` once per session per slug; session-storage helper inlined |
| Edit | `app/playground/[slug]/page.tsx` — swapped `<VisitPing surface="playground">` for `<ExperimentVisitPing slug={...}>` so per-experiment visits count separately from index visits |
| Edit | `app/playground/page.tsx` — async page, reads `readPlaygroundCounters()` at ISR time, renders per-experiment funnel cells when data exists |
| New | `sub-pr-report/SUB-PR_5.4_REPORT.md` |

No new dependencies. No new env vars. The
`PLAYGROUND_VISITS` metric from 5.1 (cumulative index + experiment
visits) **is preserved** — it now reflects only the index, since
experiment pages route to the new endpoint. Both counters are
useful: the cumulative gives a "playground in aggregate" signal,
the per-experiment hash gives detail.

---

## 4. Event flow end-to-end

```
Visitor → /playground/hello-playground (flag ON)
            │
            ▼
[slug]/page.tsx (triple gate passes)
            │
            ▼
ExperimentVisitPing mounts client-side
   → fire-and-forget POST { type: "visit", slug }
   → /api/playground/event → recordPlaygroundVisit(slug)
   → HINCRBY v5:playground:experiment-visits / hello-playground / 1
            │
            ▼
PlaygroundShell renders + BodyMount mounts
            │
            ▼
ExperimentMount: useCapabilities runs
   caps.ready becomes true
            │
            ▼
useEffect fires (caps.ready, misses.length, slug)
   misses.length === 0 → fireOnce(MOUNT, slug)
                      → POST { type: "mount", slug }
                      → HINCRBY v5:playground:experiment-mounts / 1
   misses.length > 0 → fireOnce(MISS, slug)
                      → POST { type: "capability-miss", slug }
                      → HINCRBY v5:playground:capability-misses / 1
            │
            ▼
Body renders OR Fallback renders
```

The three events fire in their natural order: visit (page load),
then mount-or-miss (after the capability probe resolves).
Session-storage ensures each fires at most once per tab session.

---

## 5. Bundle analysis

| Symbol family | Client chunks |
|---------------|---------------|
| Heavy server deps (`@aws-sdk`, `@sentry/nextjs`, `@octokit/rest`) | 0 ✓ |
| Playground server-only symbols (`recordPlaygroundVisit/Mount/CapabilityMiss`, `readPlaygroundCounters`, `PLAYGROUND_EXPERIMENT_VISITS_HASH_KEY`, plus 5.1-5.3 helpers) | 0 ✓ |
| All previous-phase server symbols | 0 ✓ |
| `@xyflow/react` | 1 (unchanged) ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |

The new endpoint registered as `ƒ /api/playground/event`
(dynamic, edge runtime). The new client modules
(`ExperimentVisitPing`, telemetry effect in `ExperimentMount`)
add minimal client JS — both already-needed-when-experiment-loads,
not landing on any other route.

---

## 6. Eval pipeline status

```
$ npm run eval:lumina      → total 13   pass 13   fail 0
$ npm run eval:playground  → total 1    pass 1    fail 0
```

Both consistency surfaces stay green.

---

## 7. Performance posture

- **Index page render**: + 3 KV HGETALL calls via
  `readPlaygroundCounters` (parallel). ~10-30 ms warm. Amortized
  by 1h ISR — once per hour per visitor region.
- **Experiment page client-side**: 1 fire-and-forget fetch on
  visit + 1 fire-and-forget fetch on mount-or-miss. Both
  `keepalive: true`. Negligible TTI impact.
- **Endpoint**: 1 KV HINCRBY per event, ~5-20 ms. Always 204
  regardless. No blocking.
- **Idle CPU after mount**: 0% (no animation, no polling, no
  listeners beyond the existing useCapabilities subscriptions).

Lighthouse impact: zero on existing routes. The playground
namespace continues to add 0 KB to the global initial JS bundle.

---

## 8. Privacy posture

**Strictly aggregate.** Every counter increments by 1 per
(visitor session, experiment, event type). No fingerprinting,
no visitor identifier, no IP read, no User-Agent parse, no
referrer capture. The endpoint sees only `{ type, slug }`.

`robots: { index: false, follow: false }` on both index and
experiment routes remains. The funnel cells appear ONLY to
visitors who reach the index page (already self-selected as
"knows the URL").

---

## 9. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/api/playground/event` registered as `ƒ Dynamic` (edge) | ✓ |
| `/playground` static prerender, 1h ISR | ✓ |
| `/playground/[slug]` registered as `ƒ Dynamic` | ✓ |
| Bundle posture: all 5.4 + previous server symbols 0 client-chunk hits | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved | ✓ |
| Reduced-motion compliance (inherited) | ✓ |
| Hydration verification: page renders identically server + client | ✓ |
| Route isolation: `/playground/*` + `/api/playground/*` share zero imports with `/lab/*` or `/lumina/*` | ✓ |

---

## 10. Rollback plan

Single-commit revert removes:
- 3 hash key constants + 4 telemetry helpers
- `/api/playground/event` route
- `ExperimentVisitPing` client component
- The telemetry effect + helper inside `ExperimentMount`
- The funnel cells in `app/playground/page.tsx`
- The `<ExperimentVisitPing>` replacement in `[slug]/page.tsx`
  (reverts to the generic `<VisitPing surface="playground">`)

KV hashes left orphaned after revert lose new writes; the existing
data sits harmlessly under the keys. Acceptable; can be `DEL`'d
manually if desired.

No schema break. No env var to undo.

---

## 11. Failure modes considered

- **Endpoint receives a malformed body**: discriminated check
  fails → returns 204 silently. No KV write, no 4xx noise.
- **Endpoint receives an unknown slug**: `getExperiment()` returns
  undefined → 204 silently. No KV write. Anti-poison posture
  preserved.
- **Visitor disables JS**: VisitPing + ExperimentMount don't fire.
  Counters stay flat. Page still renders (the body fall-back when
  JS is off would block at the BodyMount client boundary anyway).
- **KV unavailable**: telemetry helpers swallow errors; the
  `/playground` index renders the empty-state branch (no counters
  data, no funnel cells). Visitor sees the 5.3 baseline.
- **Visitor's sessionStorage blocked**: the session-guard
  `try/catch` falls through; events fire on every page load.
  Worst case: each visitor counts as 1 visit per page reload
  rather than 1 per tab session. Acceptable degradation.
- **Visitor resizes / toggles reduced-motion mid-experiment**:
  `useCapabilities` re-runs, `misses.length` changes, the effect
  re-runs. The session-storage guard ensures we don't double-count
  the new state — the FIRST outcome (mount or miss) sticks.
- **/playground index regenerates while a flag is being toggled**:
  worst case the index shows stale counts until the next 1h
  revalidate. Acceptable.

---

## 12. Phase 5 status — Priority A COMPLETE

| Sub-PR | Title | Status |
|--------|-------|--------|
| 5.1 | Experimental Playground Foundation | ✅ |
| 5.2 | Experimental Isolation Infrastructure | ✅ |
| 5.3 | Feature-flagged experiment shells | ✅ |
| 5.4 | Telemetry expansion for experiments | ✅ this PR |

**Phase 5 Priority A is closed.**

The playground now has:
- A route namespace with triple-gate access (5.1)
- Runtime guards: capability probes, lazy-load helper, mount component (5.2)
- A wired shell with co-location convention + consistency eval (5.3)
- Per-experiment funnel telemetry surfaced on the index (5.4)

The chassis is complete and measurable. No actual visual /
interactive experiment ships in Priority A — Priority B unlocks
exactly those, but only conditionally:

| Priority | Sub-PR | Trigger |
|----------|--------|---------|
| B | 5.5 | Lightweight topology experiments | conditional |
| B | 5.6 | Optional GPU-enhanced rendering | strictly conditional |
| B | 5.7 | Local-first exploration prototypes | strictly conditional |
| C | 5.8+ | Multimodal / sub-agents / live systems | strictly conditional |

Per the constitutional directive, the trigger conditions for
Priority B+ are NOT YET MET (the original PHASE_5_READINESS_AUDIT.md
documented 4 of 5 conditions as "unknown" / "assume not met").
Priority A delivers the foundation; whether Priority B ever
ships depends on the V4 § 4.5 conditions becoming green.

Phase 5 Priority A is the right place to STOP and observe.
Awaiting explicit approval before any Priority B work, with the
expectation that Priority B may never ship — and that's exactly
what the V4 doc § 4.5 anticipated as "disciplined product
evolution".
