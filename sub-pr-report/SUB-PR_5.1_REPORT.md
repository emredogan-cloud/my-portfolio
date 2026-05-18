# Sub-PR 5.1 — Experimental Architecture Playground Foundation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V4 Phase 5 — Experimental Expansion (CONDITIONAL) · Priority A.1
**Scope:** Foundation only. No experiments ship. The deliverable
is the chassis: route namespace, feature-flag plumbing, lazy-load
boundaries, error boundary, telemetry hook. Empty registry by
construction.

---

## 1. Pre-flight: PHASE_5_READINESS_AUDIT.md

Before any code, the mandatory audit landed at the repo root.
Summary:

- 4 of 5 V4 § 4.5 trigger conditions are **unknown** from
  inside the repo (MRR, npm weekly, lab uniques, conference
  acceptance). The doc's default applies: assume not met.
- 1 of 5 (founder energy) reads **plausibly green** from the
  disciplined Phase 4 cadence visible in the commit history.

The audit recommends shipping ONLY Sub-PR 5.1 — the foundation
layer — because it adds zero visitor-facing surface and is
removable in one revert. All actual experiments remain gated on
explicit per-sub-PR approval AND on the trigger conditions
turning green.

The full audit is in `PHASE_5_READINESS_AUDIT.md` at the repo
root, alongside the V4 docs.

---

## 2. Mission

Build the chassis Phase 5 would need IF and WHEN trigger
conditions become favorable. Cost ~10 hours of attention now,
shipping zero visitor surface; the alternative (scrambling to
build infrastructure under traction pressure) is the failure
mode this sub-PR prevents.

---

## 3. Architectural decisions

### 3.1 Separate namespace: `/playground/*`, not `/lab/*`
The lab is the production sandbox: rate-limited, cost-capped,
SEO-indexable, cinematic-marketing voice. The playground is
research surface: flag-gated, `robots: index: false`, honest-
risk voice. Different posture, different namespace. No
cross-imports between the two.

### 3.2 Empty registry by construction
`PLAYGROUND_EXPERIMENTS: readonly PlaygroundExperiment[] = []`.

The foundation is the deliverable. Future sub-PRs (5.2+) add
real entries. The index page renders the empty-state
placeholder. The `/playground/[slug]` dynamic route returns
`notFound()` for every slug.

This is operator-grade discipline: don't ship features under the
"foundation" label. The chassis is honest about being a chassis.

### 3.3 Triple-gated experiment access
A future experiment becomes reachable only when ALL THREE
conditions are met:

```
exists in PLAYGROUND_EXPERIMENTS  ∧  status === "active"  ∧  isExperimentEnabled(slug)
```

Each gate is intentionally minimal:
- **Registry** = cheapest check, cheap to grep, easy to audit.
- **Status** = lifecycle state that doesn't require a code deploy
  to change (a future admin endpoint could flip "shell" → "active"
  via a registry edit + redeploy).
- **Feature flag** = runtime gate, env-var-driven, no code edit
  required to disable.

Removing any one of the three blocks the experiment. Belt + braces
+ a third strap.

### 3.4 Env-var feature flags, NOT KV
Env vars (`PLAYGROUND_FLAG_<UPPERCASE_SNAKE_SLUG>` = `"1"`) are
the right friction-to-power ratio for Phase 5:

- Flag rotation cadence is per sub-PR, not per request.
- Env-var resolution is synchronous, free, edge-safe.
- No new auth surface required (a KV-backed flag system would
  need an admin endpoint).
- Vercel's env-var management surface IS the admin UI.

KV-backed flags can ship in a later sub-PR if traction makes it
worthwhile.

### 3.5 Hidden from navbar
The playground is intentionally NOT added to the Systems
dropdown. Visitors who don't know the URL never see this
surface. The audit-mandated "default conservative" stance is
enforced architecturally — discovery requires intent.

### 3.6 Cinematic-with-amber identity
Cyan accent for the index/shell. Amber pill for the
"experimental" status badge. Amber error styling for the error
boundary. The amber band signals "research, not production"
without breaking the platform's `#00d2ff` core identity.

### 3.7 Route-level error boundary
`app/playground/error.tsx` catches anything thrown inside any
`/playground/*` page. The fallback UI:
- Renders in the same cinematic vocabulary
- Surfaces the error name + message + Next.js digest
- Provides "Retry experiment" (calls `reset()`) and
  "← Playground index" buttons
- Logs the error to the browser console with the digest for
  server-log cross-reference

Failure in a future experiment NEVER bubbles up to the global
root layout's error boundary.

### 3.8 Bundle-isolation guarantee built into the shell pattern
The `[slug]/page.tsx` doc-block locks in the future pattern:

```ts
case "future-slug":
  return <ShellWithDynamicBody experiment={experiment} />;
```

Where `ShellWithDynamicBody` uses `next/dynamic({ ssr: false })`
for the heavy component. No experiment body code ever lands in
the page's initial JS bundle — it loads only when the visitor
specifically navigates to the experiment.

---

## 4. What changed

| Action | File |
|--------|------|
| New | `PHASE_5_READINESS_AUDIT.md` — pre-flight gate review |
| New | `lib/playground/feature-flags.ts` — `flagEnvName(slug)`, `isExperimentEnabled(slug)` |
| New | `lib/playground/registry.ts` — `PlaygroundExperiment` shape, empty `PLAYGROUND_EXPERIMENTS` array, `getExperiment` / `getEnabledExperiments` |
| Edit | `lib/telemetry/metrics.ts` — `PLAYGROUND_VISITS` metric key |
| Edit | `app/api/telemetry/visit/route.ts` — `playground` surface allow-list entry |
| Edit | `components/telemetry/VisitPing.tsx` — surface union extended |
| New | `app/playground/page.tsx` — index page (empty-state branch) |
| New | `app/playground/[slug]/page.tsx` — dynamic route with triple gate |
| New | `app/playground/error.tsx` — route-segment error boundary |
| New | `app/playground/_components/PlaygroundShell.tsx` — shared chrome (server component) |
| New | `sub-pr-report/SUB-PR_5.1_REPORT.md` |

No new dependencies. No new env vars (the `PLAYGROUND_FLAG_*`
pattern is established but no flag exists in any environment yet
— there are no experiments to flag).

---

## 5. Telemetry hook

```
v4:telemetry:playground:visits  ← cumulative count
```

Wired through the existing `/api/telemetry/visit` allow-list with
the `playground` surface key. `VisitPing` fires once per tab
session via the existing session-storage guard.

Both the empty-state and the (currently unreachable)
`/playground/[slug]` page emit the same surface — they're the
same audience signal: "someone found the playground".

---

## 6. Bundle analysis

Bundle invariants verified post-build:

| Check | Status |
|-------|--------|
| Playground server symbols (`isExperimentEnabled`, `PLAYGROUND_EXPERIMENTS`, `getEnabledExperiments`, `flagEnvName`, `PLAYGROUND_FLAG_*` constants) in client chunks | 0 ✓ |
| Heavy server deps (`@aws-sdk`, `@sentry/nextjs`, `@octokit/rest`) in client chunks | 0 ✓ |
| All Phase 3 + Phase 4 server-only symbols in client chunks | 0 ✓ |
| `@xyflow/react` still single dynamic chunk | 1 ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |

The playground namespace adds zero KB to the global initial JS
bundle. The new client-only code is `error.tsx` (client component
for the error boundary) which loads only when navigating into
`/playground/*` AND only when an error occurs.

---

## 7. GPU / runtime considerations

5.1 ships **no GPU code**. WebGPU experiments (5.5+ Priority B)
will use the `next/dynamic({ ssr: false })` pattern with route-
level isolation — never loaded globally, never affecting the
landing page, /about, or Lumina baseline UX. The constitutional
performance law is enforceable at the shell pattern in
`[slug]/page.tsx`.

Runtime:
- `/playground` (index): static prerender, 1h ISR.
- `/playground/[slug]` (dynamic): server-rendered on demand
  (Next.js default `ƒ Dynamic`), edge-compatible, no Node-only
  deps in the foundation.
- `app/playground/error.tsx`: client component, only loaded on
  error.

---

## 8. Mobile fallback strategy

5.1's foundation has no mobile-specific concerns — it ships only
chrome and pages, all responsive via the existing Tailwind
classes (`max-w-3xl mx-auto px-6`, `text-4xl md:text-6xl`).

For future experiments:
- The shell's `risk` field is the standard surface for "may
  stutter on mobile" honest disclosure.
- Heavy graphics experiments will branch on `matchMedia`
  capabilities or feature detection at mount time.
- Reduced-motion compliance is enforced via the existing global
  CSS guard inherited by `Reveal`.

---

## 9. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` (Lumina consistency carry-over) | ✓ exit 0 (13/13) |
| Production build | ✓ exit 0 |
| `/playground` registered as `○ Static`, 1h ISR | ✓ |
| `/playground/[slug]` registered as `ƒ Dynamic` | ✓ |
| Bundle posture (playground + Phase 3 + Phase 4 server symbols) | ✓ 0 client-chunk matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity (#00d2ff core + amber for experimental) | ✓ |
| Reduced-motion compliance (inherits global Reveal guard) | ✓ |
| Hydration verification: no client-only state read at SSR | ✓ (every page is a server component except error.tsx) |
| Route-isolation: `/playground/*` imports nothing from `/lab/*` or `/lumina/*` | ✓ |

---

## 10. Rollback strategy

Single-commit revert removes:
- 4 new lib files (`PHASE_5_READINESS_AUDIT.md`, both
  `lib/playground/*`, report)
- 1 new `MetricKey` entry + 1 visit-allow-list entry + 1
  surface-union member
- 4 new pages under `app/playground/`
- `PLAYGROUND_VISITS` KV counter orphans harmlessly (one int
  per session)

Nothing else in the platform depends on the playground namespace.
Reverting the commit restores the platform exactly to the Phase
4 tip.

---

## 11. Deferred systems list

Per the constitutional priority order, none of these are touched
in 5.1:

| Priority | Sub-PR | Title |
|----------|--------|-------|
| A | 5.2 | Experimental isolation infrastructure (CPU budgets, render-time guards) |
| A | 5.3 | Feature-flagged experiment shells (per-experiment dynamic loading patterns) |
| A | 5.4 | Telemetry expansion for experiments (per-experiment KV adoption surface) |
| B | 5.5 | Lightweight topology experiments (FIRST actual experiment, conditional) |
| B | 5.6 | Optional GPU-enhanced rendering (WebGPU, route-isolated) |
| B | 5.7 | Local-first exploration prototypes (WebLLM-flavoured) |
| C | 5.8 | Multimodal experimental surfaces |
| C | 5.9 | Additional sub-agents (one at a time, max) |
| C | 5.10 | Conditional live systems |

Hard-forbidden across Phase 5 entirely (constitutional + V4 doc):

- Distributed agent bus
- Autonomous remediation
- Always-on voice / wake-word
- Aggressive memory inference
- Invasive tracking
- Uncontrolled WebGPU usage
- Giant client bundles
- Anything requiring permanent heavy infrastructure
- Subdomain federation
- Real-time SSE dashboards
- Sub-agent registry beyond Phase 4's single architecture-critic

---

## 12. Next sub-PR

**Sub-PR 5.2 — Experimental Isolation Infrastructure (Priority
A.2).** Adds per-experiment CPU budget guards, render-time
instrumentation, and the lazy-load shell pattern in concrete
form. Still no actual experiment ships — 5.2 hardens the
isolation guarantees the foundation declared.

Awaiting approval per the constitutional directive.
