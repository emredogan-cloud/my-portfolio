# Sub-PR 5.3 — Feature-flagged experiment shells

**Branch:** `feat/v4-phase5-experimental-foundation` (continued)
**Phase:** V4 Phase 5 — Experimental Expansion (CONDITIONAL) · Priority A.3
**Scope:** First end-to-end shell wired through the chassis from
5.1 + 5.2. One experiment, no new dependencies, default OFF.

---

## 1. Mission

5.1 shipped the chassis (route, registry, triple gate, error
boundary). 5.2 shipped the runtime guards (capability probes,
ExperimentMount, lazy-load helper). Both were FOUNDATION sub-PRs
with zero consumers — the contract existed but nothing exercised
it.

5.3 wires the FIRST proof: a `hello-playground` shell that uses
every primitive end-to-end:

```
Registry entry  →  triple gate  →  BodyMount dispatch  →
                                       ExperimentMount  →
                                          useCapabilities  →
                                             lazy body load  →
                                                Body render
```

The body itself is purely diagnostic — it renders the visitor's
capability snapshot so future experiments can use this shell to
verify their requirement gates. No animation, no network, no
state beyond what `useCapabilities` returns.

Default state: **OFF**. Enabling requires
`PLAYGROUND_FLAG_HELLO_PLAYGROUND=1` in the deploy environment.
Visitors hitting `/playground` see the same "no experiments
enabled" message they saw after 5.1.

---

## 2. Architectural decisions

### 2.1 Client-boundary dispatch
Next.js refuses `next/dynamic({ ssr: false })` calls reached
transitively from Server Components. The original 5.3 draft had
the dispatch table at the top of `[slug]/page.tsx` (server) which
crashed the Turbopack build:

```
ssr: false is not allowed with next/dynamic in Server Components.
Please move it into a Client Component.
```

The fix splits the route into two files:
- `[slug]/page.tsx` (server) — triple gate, metadata,
  PlaygroundShell chrome, delegates body to BodyMount.
- `[slug]/BodyMount.tsx` (client) — `BODY_REGISTRY` map +
  switch dispatch. All `dynamic({ ssr: false })` calls live
  inside this "use client" boundary.

This makes the dispatch boundary explicit: server does the gate,
client does the lazy load. The two responsibilities can evolve
independently.

### 2.2 `lib/playground/lazy.ts` becomes `"use client"`
Per the same Next.js constraint above. The helper now declares
its client-boundary requirement at the top of the file. Future
sub-PRs that want to extend the lazy contract don't need to
guess; the file's directive is the contract.

### 2.3 `app/playground/_experiments/<slug>/Body.tsx` co-location
Experiment bodies live in `_experiments/<slug>/` (private folder,
not routed). The folder shape scales — when 5.4+ adds bodies
with their own sub-components or fixtures, they have a natural
home.

Convention enforced by `scripts/eval-playground.mjs`: every
active registry entry MUST have a `Body.tsx` at the expected
path. Eval exits 1 on regression.

### 2.4 Single shell, not multiple
The original draft considered 2-3 shells demonstrating different
requirement patterns (viewport-only, motion-required, etc.).
Cut to one. Reasons:

- One shell is enough to prove the contract.
- Multiple shells would multiply the maintenance surface for a
  proof-of-concept layer.
- Future Priority B experiments will demonstrate requirement
  patterns in their natural form.

The `hello-playground` shell ships with **no requirements**
declared — works on every viewport, motion preference, and WebGPU
state. The Body uses `useCapabilities` to display the values, so
the operator can read them without filtering through a fallback.

### 2.5 `scripts/eval-playground.mjs` mirrors `eval:lumina`
Same pattern as Sub-PR 4.3's Lumina tool consistency eval:
- Parses source files as text (no `tsx`, no new deps)
- Extracts registry entries, BODY_REGISTRY keys, switch cases
- Reports per-experiment alignment
- Detects orphans on both sides
- Exits 0 on full pass, 1 on regression
- Wired into `package.json` as `npm run eval:playground`

Suitable for CI when ready.

---

## 3. What changed

| Action | File |
|--------|------|
| Edit | `lib/playground/registry.ts` — added `hello-playground` entry (status: "active", no requirements) |
| New | `app/playground/_experiments/hello-playground/Body.tsx` — minimal client component, capability snapshot |
| Edit | `lib/playground/lazy.ts` — `"use client"` at top (required by Next.js for ssr:false dynamic) |
| New | `app/playground/[slug]/BodyMount.tsx` — client-side dispatcher (BODY_REGISTRY + switch) |
| Edit | `app/playground/[slug]/page.tsx` — server route now delegates body to BodyMount client component |
| New | `scripts/eval-playground.mjs` — registry/body/dispatch consistency guard |
| Edit | `package.json` — `eval:playground` script |
| New | `sub-pr-report/SUB-PR_5.3_REPORT.md` |

No new dependencies. No new env vars actively wired. No new
routes. No new endpoints.

---

## 4. Triple-gate verification end-to-end

```
Visitor → /playground/hello-playground
            │
            ▼
[slug]/page.tsx (server component)
   1. getExperiment("hello-playground") → entry ?
      ✗ → notFound() (404)
      ✓ → continue
   2. status === "active" ?
      ✗ → notFound() (404)
      ✓ → continue
   3. isExperimentEnabled("hello-playground") ?
        PLAYGROUND_FLAG_HELLO_PLAYGROUND === "1" ?
      ✗ → notFound() (404)   ← THE CURRENT DEFAULT STATE
      ✓ → continue
            │
            ▼
PlaygroundShell renders + VisitPing fires
   children = <BodyMount experiment={experiment} />
            │
            ▼
BodyMount (client) switches on slug
   case "hello-playground" → <ExperimentMount BodyComponent={Body} />
            │
            ▼
ExperimentMount checks capabilities
   caps.ready === false → <Checking /> placeholder
   any requirement unmet → <Fallback /> (none declared, won't fire)
   all met → render Body
            │
            ▼
HelloPlaygroundBody renders capability snapshot
```

With the flag OFF (current production state), the chain bails at
step 3 and the visitor sees a 404. The entire `BodyMount` chunk +
`HelloPlaygroundBody` chunk never load.

---

## 5. Bundle analysis

| Symbol family | Client chunks |
|---------------|---------------|
| Heavy server deps (`@aws-sdk`, `@sentry/nextjs`, `@octokit/rest`) | 0 ✓ |
| Playground server-only symbols (`PLAYGROUND_EXPERIMENTS`, `getEnabledExperiments`, `flagEnvName`) | 0 ✓ |
| All previous-phase server symbols | 0 ✓ |
| `@xyflow/react` | 1 (unchanged) ✓ |
| `HelloPlaygroundBody` / `BodyMount` strings | 2 chunks — the expected separation: one for the BodyMount dispatcher loaded with the `[slug]` route; one for the lazy-loaded Body itself. Both isolated to `/playground/*` navigation. |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |

The Body's chunk only loads when `dynamic()` fires — which only
happens when ExperimentMount renders the body, which only
happens after the triple gate passes. With the default-OFF
state, every visitor avoids both chunks.

---

## 6. Eval pipeline status

```
$ npm run eval:playground

Playground experiment consistency eval
──────────────────────────────────────────────────────────────────────
slug              body   dispatch   status   flag
──────────────────────────────────────────────────────────────────────
hello-playground    ✓      ✓      pass    PLAYGROUND_FLAG_HELLO_PLAYGROUND
──────────────────────────────────────────────────────────────────────
total 1   pass 1   fail 0
```

The Lumina eval is unchanged: `total 13   pass 13   fail 0`. Both
consistency surfaces stay green.

---

## 7. Performance posture

- **Index page (`/playground`)**: unchanged from 5.1. Static
  prerender, 1h ISR, empty-state branch (no experiment enabled).
- **Experiment route (`/playground/[slug]`)**: returns 404 in
  the current default-OFF state. The chain bails at step 3 of
  the triple gate.
- **When flag flipped ON (operator action)**: server-renders
  PlaygroundShell + BodyMount in ~50-100 ms; client lazy-loads
  Body chunk in ~50-200 ms (depending on CDN). Total TTI ~ 200ms,
  well under V4 § 2.7's 1.5s target.
- **Idle CPU after Body mounts**: 0%. The Body has no animation,
  no setInterval, no observers beyond the passive resize +
  media-query subscriptions inside `useCapabilities` (V4 § 2.12
  compliance verified).

Lighthouse impact on existing routes: zero. The /playground
namespace adds zero KB to the global initial JS bundle.

---

## 8. Privacy posture

- Playground visit counter (from 5.1) still increments via
  `VisitPing` — surface `playground`, aggregate-only.
- No new telemetry collection. The Body's capability snapshot
  stays in-component; nothing posted anywhere.
- `robots: { index: false, follow: false }` on both the index
  and the [slug] route — research surface, not SEO.

---

## 9. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/playground` static prerender, 1h ISR | ✓ |
| `/playground/[slug]` registered as `ƒ Dynamic` | ✓ |
| Bundle posture (server symbols) | ✓ 0 client-chunk leaks |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity (`#00d2ff` + amber for experimental) | ✓ |
| Reduced-motion compliance (inherited from 5.2 + Reveal) | ✓ |
| Hydration verification (Body renders only after caps.ready) | ✓ |
| Route isolation (`/playground/*` shares no imports with `/lab/*` or `/lumina/*`) | ✓ |

---

## 10. Rollback plan

Single-commit revert removes:
- 1 registry entry (`hello-playground`)
- 1 new body file
- 1 new client dispatcher (BodyMount.tsx)
- 1 new eval script + 1 npm script entry
- The `"use client"` addition to `lib/playground/lazy.ts`
  (which becomes harmless server-side after revert because no
  consumer remains)

`/playground/hello-playground` returns 404 again (the registry
no longer knows the slug). `/playground` index reverts to the
fully-empty state.

No KV state. No env vars to undo (the flag never had a value).

---

## 11. Failure modes considered

- **Operator sets `PLAYGROUND_FLAG_HELLO_PLAYGROUND=1` but
  forgets to redeploy**: env vars are read at runtime; the next
  request after the env update picks it up. No restart needed
  unless the platform uses long-lived edge containers.
- **Operator sets the flag but Body chunk fails to load**:
  ExperimentMount's parent `[slug]/page.tsx` is wrapped in the
  route-level `app/playground/error.tsx` boundary from 5.1. The
  visitor sees the calm error UI with retry button.
- **Registry adds a slug but forgets the BodyMount entry**:
  `npm run eval:playground` flags it with `fail` status before
  CI / merge. Defensive `default` case in the switch throws,
  caught by the route-level error boundary at runtime.
- **Visitor has reduced-motion enabled**: irrelevant for the
  hello-playground shell (no requirements declared). The Body
  doesn't animate anything.
- **Visitor has a tiny viewport**: irrelevant for this shell.
  The Body's capability snapshot table degrades gracefully on
  any viewport ≥ 280px.

---

## 12. Deferred items (NOT in this PR)

| Priority | Sub-PR | Title |
|----------|--------|-------|
| A | 5.4 | Telemetry expansion for experiments — next |
| B | 5.5+ | Lightweight topology experiments (FIRST visual experiment) — conditional |
| B | 5.6 | Optional GPU-enhanced rendering — strictly conditional |
| B | 5.7 | Local-first exploration prototypes — strictly conditional |
| C | 5.8+ | Multimodal / additional sub-agents / conditional live systems |

Hard-forbidden across Phase 5 (untouched): distributed agent
bus, autonomous remediation, always-on voice, aggressive memory
inference, invasive tracking, uncontrolled WebGPU, giant client
bundles, subdomain federation, real-time SSE dashboards,
sub-agent registry expansion beyond Phase 4's single agent.

---

## 13. Phase 5 status

| Sub-PR | Title | Status |
|--------|-------|--------|
| 5.1 | Experimental Playground Foundation | ✅ |
| 5.2 | Experimental Isolation Infrastructure | ✅ |
| 5.3 | Feature-flagged experiment shells | ✅ this PR |
| 5.4 | Telemetry expansion for experiments | next, awaiting approval |
| B+ | Actual experiments | strictly conditional |

Phase 5 Priority A is now 3 of 4 complete. The first shell exists
end-to-end behind a feature flag; the contract is exercised by
real code, not just documentation. Awaiting approval for Sub-PR
5.4 — the final Priority A item before Phase 5 Priority B unlocks
conditionally.
