# Sub-PR 5.2 — Experimental Isolation Infrastructure

**Branch:** `feat/v4-phase5-experimental-foundation` (continued)
**Phase:** V4 Phase 5 — Experimental Expansion (CONDITIONAL) · Priority A.2
**Scope:** Make the isolation guarantees Sub-PR 5.1 *declared*
runtime-enforceable: a lazy-load helper, hydration-safe capability
probes, an `ExperimentMount` client component that gates body
loading on declared requirements. Zero new dependencies. Zero
visitor-facing surface (no experiment exists yet).

---

## 1. Mission

5.1 shipped the structural chassis (route namespace, registry,
empty list, triple gate, error boundary). The isolation guarantees
existed as DOCUMENTATION — the next/dynamic pattern was in a
comment, not a function; the capability checks were unwritten;
"degrade gracefully on unsupported environments" was a stated
intent without a runtime expression.

5.2 turns each guarantee into a load-bearing helper:

| 5.1 declared | 5.2 enforces |
|--------------|--------------|
| "bundle isolation via next/dynamic({ ssr: false })" | `createExperimentBody(loader)` — the contract becomes a function call |
| "experiments may require WebGPU / a desktop viewport" | `useCapabilities()` + `checkRequirements()` |
| "degrade gracefully" | `ExperimentMount` renders inline fallback instead of mounting an unsupported body |

Future sub-PRs (5.3+) consume these primitives. Today the registry
is still empty, so 5.2 ships invisible infrastructure — the
chassis Phase 5 needed.

---

## 2. Architectural decisions

### 2.1 Lazy-load as a function, not documentation
5.1 had a doc comment in `[slug]/page.tsx` describing the
`next/dynamic({ ssr: false })` pattern. Documentation rots.
5.2's `lib/playground/lazy.ts:createExperimentBody()` makes the
contract executable. If a future experiment bypasses the helper,
code review sees a manual `next/dynamic` call and flags it.

The helper is a 30-line `.ts` file (not `.tsx`) — pure type-glue
around `next/dynamic`. The Skeleton option is typed as
`() => ReactNode` (matching `DynamicOptions.loading` verbatim)
rather than the looser `ComponentType` so class components are
rejected at compile time. Same restriction Next.js itself
enforces.

### 2.2 Hydration-safe capability defaults
The `useCapabilities()` hook returns SAFE defaults during SSR
(`viewportWidth: 1024`, `prefersReducedMotion: false`,
`hasWebGPU: false`, `ready: false`). The Mount component branches
on `caps.ready` and shows a quiet "checking environment…"
placeholder until the first `useEffect` refresh fires.

The flicker between "neutral placeholder" → real capability state
is brief but explicitly OK — without it, the visitor would
briefly see the experiment body render with default-assumed
capabilities before being yanked to a fallback when the real
state lands. The placeholder makes the gate visible.

### 2.3 Three requirement axes, no more
`ExperimentRequirements` declares at most three things:

- `minViewportWidth` (number, CSS pixels) — desktop-only experiments
- `requiresMotion` (boolean) — animated experiments that fail
  reduced-motion users with no static fallback
- `requiresWebGPU` (boolean) — gates `navigator.gpu` presence

That's the V4 § 2.7-2.12 constitutional set: viewport, motion,
GPU. Anything beyond requires a stronger justification than 5.2
provides; defer to a later sub-PR if the need surfaces.

### 2.4 Subscribe to capability changes during the experiment's
   lifetime
The hook subscribes to `window.resize` (passive) and the
`prefers-reduced-motion` `MediaQueryList`. If the visitor resizes
across the `minViewportWidth` threshold mid-experiment, the
Mount component re-evaluates and switches between fallback and
body. Same for toggling reduced-motion via OS settings.

All listeners are cleaned up on unmount.

### 2.5 The Mount component owns the entire mount decision
Three branches, in order:

1. `caps.ready === false` → `<Checking />` placeholder
2. `checkRequirements(...).length > 0` → `<Fallback />` listing
   the unmet requirements
3. Otherwise → `<BodyComponent />` (the lazy-loaded body)

Future experiment pages are intended to be tiny: pass the
experiment + the lazy body component, get back the right
behaviour. No experiment author rolls their own gate.

### 2.6 Inline fallback UI, not a separate component
`<Checking />` and `<Fallback />` are unexported helpers inside
`ExperimentMount.tsx`. They could become separate files later if
they grow features (currently a few JSX lines each). Keeping
them inline reduces file count and makes the mount logic
single-glance.

---

## 3. What changed

| Action | File |
|--------|------|
| New | `lib/playground/capabilities.ts` — `Capabilities` type, `SERVER_DEFAULTS`, `useCapabilities()` hook with passive resize / reduced-motion subscriptions, `ExperimentRequirements`, `RequirementMiss`, `checkRequirements()`. |
| New | `lib/playground/lazy.ts` — `CreateExperimentBodyOptions`, `createExperimentBody(loader, options)`. Single function wrapping `next/dynamic({ ssr: false, loading })`. |
| Edit | `lib/playground/registry.ts` — `PlaygroundExperiment` now optionally carries `requirements: ExperimentRequirements`. |
| New | `app/playground/_components/ExperimentMount.tsx` — client component combining capability probe + requirement check + body mount. Inline `Checking` + `Fallback` helpers. |

No new dependencies, no new env vars, no new routes, no new
endpoints, no telemetry helpers. The registry stays empty.

---

## 4. Bundle analysis

**Bundle delta on every shipped surface today: 0 KB.**

Verified via the build output:

| Symbol | Client-chunk matches |
|--------|----------------------|
| `useCapabilities` | 0 |
| `checkRequirements` | 0 |
| `ExperimentMount` | 0 |
| `createExperimentBody` | 0 |
| `PLAYGROUND_EXPERIMENTS` | 0 |
| `flagEnvName` | 0 |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` | 0 |

Because no experiment consumes `ExperimentMount` yet, Next.js
tree-shakes the entire client module out of every route. The
infrastructure exists in source for future sub-PRs to consume; it
ships zero bytes today.

(The broad `prefers-reduced-motion` string matched 8 chunks — all
from the platform's existing animation surface, `motion/react`,
`Reveal`, etc. Not 5.2 code.)

---

## 5. Performance posture

- **Capability probe cost:** one `matchMedia` query + one
  `navigator.gpu` presence check + one `window.innerWidth` read,
  all wrapped in try/catch. ~< 1 ms on mount.
- **Subscription cost:** passive resize listener + media-query
  listener. Both cleaned up on unmount. Idle CPU 0%.
- **Hydration:** no mismatch — server renders the
  `Checking` placeholder (which is server-safe markup);
  client-side, the `useEffect` flips `ready` to true and the
  component re-renders with the real capability state.
- **Reduced motion:** the entire infrastructure respects the
  visitor's preference. Experiments declaring `requiresMotion`
  receive `Fallback` instead of mounting.

Lighthouse: unaffected. No global JS added, no global CSS
changes, no font / image / network changes.

---

## 6. Privacy posture

Zero new telemetry collection. The capability probe values stay
in-component — never leave the browser. No fingerprint built, no
KV write, no analytics event.

When Priority A.4 (Sub-PR 5.4 — Telemetry expansion) lands, it
may add aggregate "capability-miss" counters (e.g., how often the
fallback fires per experiment). That sub-PR will add its own
explicit privacy posture; 5.2 is silent.

---

## 7. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` (carry-over) | ✓ exit 0 (13/13) |
| Production build | ✓ exit 0 |
| `/playground` still `○ Static` 1h ISR | ✓ |
| `/playground/[slug]` still `ƒ Dynamic` | ✓ |
| Bundle posture: 5.2 symbols in client chunks | ✓ 0 (tree-shaken — no consumer) |
| Phase 3 + 4 server symbols still 0 client chunks | ✓ |
| `@xyflow/react` still single dynamic chunk | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` + amber for experimental) | ✓ |
| Reduced-motion compliance built into the hook | ✓ |
| Route isolation: `/playground/*` imports nothing from `/lab/*` or `/lumina/*` | ✓ |
| Hydration verification: SERVER_DEFAULTS render identically server + client | ✓ |

One inline `eslint-disable-next-line react-hooks/set-state-in-effect`
was added inside `useCapabilities`'s mount effect — same pattern
as the Sub-PR 4.4 toggle and the Sub-PR 3.5 client island. The
effect refreshes state once after hydration; the disable is
deliberate and rationale is captured at the call site.

---

## 8. Rollback plan

Single-commit revert removes:
- 4 module files (capabilities, lazy, mount, plus the registry
  field addition)
- Zero KV state
- Zero env vars

Nothing else in the platform depends on 5.2 — no consumer
imports any of the new exports yet. Reverting restores the
platform exactly to the Sub-PR 5.1 tip.

---

## 9. Failure modes considered

- **Browser blocks `matchMedia`** (sandboxed iframe, locked-
  down profile) → try/catch swallows; capabilities default to
  "motion OK" + `webgpu: false`. Mount proceeds with the safer
  read.
- **`navigator.gpu` is a sealed Proxy** → try/catch swallows;
  `hasWebGPU` defaults to false. WebGPU-requiring experiments
  fall back rather than crash.
- **`window.innerWidth` returns 0 / undefined** → falls back to
  `SERVER_DEFAULTS.viewportWidth = 1024` (desktop-shaped). Worst
  case: a desktop-only experiment loads on a phantom small
  viewport. Acceptable — the experiment's own responsive code
  is the last line of defence.
- **Visitor resizes across the `minViewportWidth` threshold
  mid-experiment** → resize listener fires; capability state
  updates; Mount re-evaluates. Body unmounts and fallback
  renders (or vice versa).
- **`useEffect` never fires** (extreme React bug) → `caps.ready`
  stays false and the `Checking` placeholder renders forever.
  Visitor sees a calm "checking environment…" line rather than
  a broken page.
- **Skeleton component throws on render** → the route-level
  `error.tsx` boundary from 5.1 catches it.

---

## 10. Deferred items (NOT in this PR)

Per the constitutional priority order:

| Item | Status |
|------|--------|
| A.3 Feature-flagged experiment shells | Next sub-PR — uses 5.2's primitives |
| A.4 Telemetry expansion for experiments | After A.3 |
| B.5 Lightweight topology experiments (FIRST real experiment) | Conditional |
| B.6 GPU-enhanced rendering | Strictly conditional |
| C.* Advanced experiments | Strictly conditional |
| Per-render CPU budget enforcement | Defer — requires usage signal to design correctly |
| RAF lifecycle helper | Defer — experiment-specific |
| Memory pressure isolation | Defer — JS can't sandbox in-process anyway |

Hard-forbidden Phase 5 surfaces (untouched):
- Distributed agent bus
- Autonomous remediation
- Always-on voice / wake-word
- Aggressive memory inference
- Invasive tracking
- Uncontrolled WebGPU usage
- Giant client bundles
- Subdomain federation
- Real-time SSE dashboards
- Sub-agent registry expansion beyond Phase 4's single agent

---

## 11. Phase 5 status

| Sub-PR | Title | Status |
|--------|-------|--------|
| 5.1 | Experimental Playground Foundation | ✅ shipped |
| 5.2 | Experimental Isolation Infrastructure | ✅ this PR |
| 5.3 | Feature-flagged experiment shells | next, awaiting approval |
| 5.4 | Telemetry expansion for experiments | after 5.3 |
| B+ | Actual experiments | strictly conditional |

Phase 5 Priority A is now 2 of 4 complete. The chassis is sturdier
than after 5.1, but no visitor surface has changed. Awaiting
approval for Sub-PR 5.3.
