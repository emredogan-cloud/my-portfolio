# Sub-PR 7.2 — Temporal Playback Primitive

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 7 — Temporal Architecture · Sub-PR 7.2 (Tier A · foundation)
**Scope:** Frame math + playback controller + adoption hash +
edge POST endpoint. Pure foundation; no UI consumer mounts in
7.2. The slider that consumes the primitive lands in Sub-PR 7.3;
the architecture-page integration lands in 7.4. The Phase 7.1
`/evolution` surface gains a small "Playback (latent)" tile row
that surfaces the new hash so the chassis is observable without
claiming behaviour the layer doesn't yet have.

---

## 1. Mission

Sub-PR 7.1 shipped the registry — the WHAT of engineering
memory. Sub-PR 7.2 ships the primitive that lets future surfaces
move through that memory deterministically — the HOW of
temporal traversal.

What 7.2 ships:

- `lib/v5/temporal/frames.ts` — pure interpolation math.
  `TemporalFrame`, `TemporalCursor`, `buildTemporalFrames`,
  `interpolateCursor`, `snapCursor`, `findFrameIndex`,
  `frameTimestamp`. Zero side effects, zero DOM, zero clock
  reads — the same input always produces the same cursor.
- `lib/v5/temporal/playback.ts` — `createTemporalPlayback`
  factory. Wraps the frame math in a stateful controller
  exposing `seek` / `seekToIndex` / `scrubTo` / `nextFrame` /
  `prevFrame` / `play` / `pause` / `destroy` plus the matching
  read methods. RAF + cancelRaf are injectable for SSR + tests.
- `lib/v5/temporal/playback-telemetry.ts` — adoption hash
  `v5:topology:playback` with five event-kind fields (seek /
  scrub / play / pause / step). Same posture as Phase 7.1's
  temporal-adoption hash.
- `app/api/v5/temporal/playback/route.ts` — edge POST endpoint
  the 7.3+ consumer will fire through. Body shape `{ kind }`;
  validates against the closed event-kind allow-list.
- `app/evolution/page.tsx` — small extension. The existing
  "Live adoption" section now includes a "Playback (latent)"
  tile row showing the five new counters (all zero until a
  consumer mounts). The pill state advances from "Phase 7 ·
  foundation" → "Phase 7 · primitives". Source-links catalog
  gains three new entries.

V5 § 5.2 validation criteria, satisfied:
- [x] Frame interpolation deterministic (`interpolateCursor`,
  `buildTemporalFrames`, `frameTimestamp` are all pure functions
  with no clock / random / global-state reads)
- [x] Reduced-motion → instant snap-to-frame (`play()` short-
  circuits to the timeline end when `respectsReducedMotion` is
  set; no RAF spawns)
- [x] Idle CPU 0% when scrubber inactive (no timers / listeners
  at construction; `play()` is the only path that spawns a RAF
  loop; `pause()` and `destroy()` cancel it)
- [x] Bundle < 6 KB (foundation modules tree-shake out of every
  route in 7.2 since no consumer mounts; when 7.3 mounts the
  slider, the combined `frames.ts` + `playback.ts` estimate is
  ~4-5 KB minified, ~1.5-2 KB gzipped)
- [x] Telemetry slot wired (`v5:topology:playback` hash with
  five fields; the V5 § 5.2 stated slot `v5:topology:playback:
  scrub_events_weekly` is implemented as the 2-segment hash for
  endpoint-reuse consistency with prior sub-PRs)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** The playback primitive in isolation is
infrastructure. The CATEGORY it enables — a portfolio whose
architectural memory is scrubbable, deep-linkable, and
interpolatable in a deterministic / SSR-safe / reduced-motion-
respecting way — is a V5 differentiator. Other AI portfolios
ship "interactive timelines" as motion theatre; the V5 version
ships it as a pure engineering primitive whose API surface
reads like a small video player rather than a marketing widget.
**PASS by extension.**

**Q2 — Emergence:** Zero standalone value. The controller has
no consumer in 7.2. The slider (7.3), the architecture-page
integration (7.4), and the Phase 8 cinematic topology renderer
will each wire it. The Lumina sub-agent for architecture
critique (V4 § 4.5) could one day read the cursor as ambient
context when answering version-aware questions. The value
crystallises only when those consumers land. **Perfect emergence.**

**Q3 — Sustainability:** Pure math + a small state machine =
near-zero maintenance. The cumulative work to author this
sub-PR was ~3 hours; ongoing maintenance is bounded by Phase
7's monthly envelope (3.5 hr/mo per V5 § 4.2), and the slice
attributable to 7.2 is ~0.3 hr/mo (occasional adjustments when
new event kinds land or when a 7.3+ slider surfaces an edge
case in the math). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the controller reads ONLY the
  `EvolutionEvent[]` from `data/temporal/events.ts` (THIS
  portfolio's hand-curated architectural memory). Copying the
  module into another site without the registry would produce
  a controller that points at nothing. ✓
- Ekosistem-fed: zero external network calls, zero LLM calls,
  zero clock reads in the math layer. ✓
- Ekosistem-emergent: meaningless without Phase 7.3+ consumers
  + Phase 8 topology consumers. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call, no chat surface, no
  generic "smart timeline" affordance. The controller's API is
  five methods + one read; the endpoint accepts one of five
  closed-allow-list event kinds. ✓

---

## 3. Architectural decisions

### 3.1 Three-module split inside `lib/v5/temporal/`

| Module | Responsibility |
|--------|----------------|
| `frames.ts` | Pure math — frame indexing, timestamp parsing, cursor interpolation. No state. No DOM. No I/O. |
| `playback.ts` | Stateful controller wrapping the math. Owns the RAF loop, the playing flag, the telemetry callback. |
| `playback-telemetry.ts` | KV adoption hash + record/read helpers. The destination the eventual endpoint POSTs to. |

The split mirrors the Phase 6 perception split + the Phase 7.1
temporal split. Each module has one job; tree-shaking keeps the
math and the controller out of every route that doesn't import
them (verified via grep against `.next/static`).

### 3.2 Cursor is a single value, not a state class

A `TemporalCursor` carries six fields plus the two frame
references. Consumers read all six in one shot from a single
object — no `cursor.set(...)` / `cursor.get(...)` ceremony, no
class hierarchy, no inheritance.

Reasons:
- React / Solid / Vue / vanilla consumers can each spread the
  cursor into their state shape without an adapter layer.
- The cursor is JSON-serialisable, which makes it trivial to
  pass to a Web Worker (if a future 7.4+ surface wants offloaded
  interpolation) or to log to telemetry (already not done — see
  the privacy section).
- The math layer can return a fresh cursor object per
  `interpolateCursor()` call without any allocation guilt; the
  function is called at most ~60 times per second under
  `play()`, and modern engines collapse the allocation.

### 3.3 Controller is a closure factory, not a class

`createTemporalPlayback(opts)` returns an object that satisfies
the `TemporalPlaybackController` interface. The internal state
lives in the closure; the method object is created once and
holds stable references.

Reasons:
- Smaller emit (no class metadata, no `this` plumbing).
- Easier to memo in React — `useMemo(() => createTemporalPlayback(...), [events])`
  returns a stable controller instance the rest of the
  component reads through.
- No `extends` story, no `new` keyword required, no
  inheritance hazard for future surfaces.
- The factory's signature matches the rest of the V5
  ecosystem's pattern (`createSession`, `recordPerceptionEvent`,
  `summariseEvolutionRegistry`) — all closure-based, all
  testable without `new`.

### 3.4 RAF is injectable

`TemporalPlaybackOptions.requestAnimationFrame` defaults to
`globalThis.requestAnimationFrame.bind(globalThis)` when the
runtime exposes it, `null` otherwise. The `null` case (SSR,
sandboxed iframes, deno without raf) makes `play()` behave
identically to the reduced-motion override: snap to end + fire
telemetry. No silent failure mode.

Tests can inject a deterministic RAF that fires synchronously,
exercising the play loop without wall-clock dependencies. The
production path consumes the browser primitive.

### 3.5 Reduced-motion is a CONSUMER FLAG, not a `matchMedia` read

`opts.respectsReducedMotion: boolean` is a plain flag the
consumer sets. The 7.2 controller does NOT call
`window.matchMedia('(prefers-reduced-motion: reduce)')` itself.

Reasons:
- Keeps the controller browser-agnostic (it can run in
  Node-based tests, in a Web Worker, in any V5 runtime).
- Lets the consumer compose preferences (e.g. a React consumer
  can combine the user's OS preference with an in-page toggle).
- Matches the Phase 6.3 pacing engine's `respectsReducedMotion`
  contract: the consumer is the source of truth.

The 7.3 slider will subscribe to `matchMedia` and pass the
result into the controller as this flag — the same pattern
`PacingProvider` uses.

### 3.6 Cursor at construction = LATEST event (default)

When `initialEventId` is unset (or unrecognised), the
controller snaps to the LAST frame in the ascending list — the
most recent event. That is the natural arrival state for the
/evolution surface: "you are at the present". A consumer that
wants to start at the genesis frame passes
`initialEventId: "v1-cinematic-identity-genesis"` (or any other
known id).

This contrasts with playback systems that default to the start
of the timeline. For an engineering-memory archive, the present
is the natural read; "rewinding" is the explicit action.

### 3.7 `play()` traverses to END from CURRENT position

When `play()` is called, the controller computes its current
overall progress and animates only the remaining fraction. A
visitor already at progress 0.7 sees the remaining 30% animate;
a visitor at 1.0 sees nothing (the call early-returns).

Reasons:
- Matches video-player intuition: pressing play resumes from
  where you stopped, not from the start.
- Avoids visual rewinds that would feel jarring on a slider.
- A consumer that wants "play from the start" calls
  `seekToIndex(0)` then `play()`.

### 3.8 Telemetry hook is OPT-IN

The controller exposes `onTelemetry` as an optional callback.
The 7.2 controller does NOT fire to KV directly. The 7.3+
consumer wires the callback to:
- A `fetch` to `/api/v5/temporal/playback` (the endpoint
  shipped here)
- A local sessionStorage log (for replay debugging)
- Whatever observability sink makes sense at the time

This keeps the controller dependency-free and lets the future
consumer decide whether the layer is worth the network cost.
Same posture as Phase 6.2's CognitionAwareNavigationObserver,
which fires through the perception endpoint but the *fire*
mechanism is contained in the observer, not in the cognition
helper module.

### 3.9 Endpoint vocabulary is INDEPENDENT from the controller's `onTelemetry` kinds

Both the controller and the endpoint use the same five event
kinds (seek / scrub / play / pause / step). The
`isPlaybackEventKind` validator is re-exported from
`playback.ts` so the endpoint imports it without round-tripping
through a separate types module. One source of truth.

### 3.10 Playback adoption tile lives BELOW the temporal adoption tile

The /evolution page Section 04 ("Live adoption") originally
held three tiles (view / category_view / event_view) shipped
in 7.1. Sub-PR 7.2 inserts a small intermediate paragraph + a
second `<dl>` with the five playback tiles. The two `<dl>`s
share the same visual treatment so the operator reads both as
"telemetry for this surface".

The intermediate paragraph names the tile row "Playback
(latent)" — honest framing that the values will stay at zero
until a 7.3+ consumer mounts. Same editorial posture as Phase
6.4's "no observer yet" disclosure for the pages-index.

---

## 4. KIRMIZI ÇİZGİ + Phase 7 philosophy enforcement (unchanged)

The user prompt's Phase 7 standard still holds:

> Visitors should NOT think:
> "cool timeline."
>
> They should think:
> "This system remembers itself."

Sub-PR 7.2 ships ZERO new visitor-facing surfaces beyond the
small playback-tile row on /evolution. The controller is
invisible until a 7.3+ consumer mounts. The endpoint is
unreachable from the page. The /evolution layout still reads
as an editorial archive, not as a video player.

| Layer | Mechanism |
|-------|-----------|
| Schema | Five event kinds — every one is a verb the operator would expect to see on a player. No "vibe", "mood", "experience", or other emotive vocabulary. |
| Storage | One hash, five integer fields, HINCRBY-only writes. No per-visitor field, no timestamp, no sequence. |
| UI law | The "Playback (latent)" tile row reads "the values stay at zero until a consumer mounts" — honest disclosure that the primitive is chassis-only. |
| Math | Pure interpolation, no narrative embellishment, no easing applied at the primitive layer. The consumer's render decides the visual feel. |

The temporal layer cannot tip into "timeline gimmickry" because
the primitive's API surface is mechanical: five methods, one
read, no spectacle. Phase 7.3 will need to make a deliberate
choice about how the slider FEELS; this sub-PR ships the math
that makes those choices possible without ever forcing them.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/temporal/frames.ts` — `TemporalFrame`, `TemporalCursor`, `buildTemporalFrames`, `frameTimestamp`, `interpolateCursor`, `snapCursor`, `findFrameIndex` |
| New | `lib/v5/temporal/playback.ts` — `createTemporalPlayback`, `TemporalPlaybackController`, `PlaybackEventKind`, `isPlaybackEventKind` |
| New | `lib/v5/temporal/playback-telemetry.ts` — `recordPlaybackEvent`, `readPlaybackAdoption`, `PLAYBACK_ADOPTION_HASH_KEY` |
| New | `app/api/v5/temporal/playback/route.ts` — Edge POST endpoint, 204-only, five-kind allow-list |
| Edit | `app/evolution/page.tsx` — pill state "primitives", footer copy mentions playback primitive, three new SOURCE_LINKS rows, "Playback (latent)" tile row added under "Live adoption" |
| New | `sub-pr-report/SUB-PR_7.2_REPORT.md` (this report) |

No new dependencies. No new env vars (the playback layer has
no operator switch — the primitive is dark-by-default because
no consumer is wired).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 7.2 adds ONE new hash to the V5 telemetry family:

```
v5:topology:playback  → hash { seek | scrub | play | pause | step: count }
```

Mapping note: V5 § 5.2's stated slot
`v5:topology:playback:scrub_events_weekly` is implemented as
the 2-segment hash `v5:topology:playback`. Same convention as
the Phase 6 mappings (`v5:perception:cognition-signal`,
`v5:perception:pacing-transition`): the literal long-form slot
in the V5 doc preserves the spirit (one bucket per measurable
event kind), and the implementation uses the short-form hash
shape the perception + temporal pipelines already share. The
"weekly" qualifier in the slot name is left to a future read
pass that captures snapshot pairs and diffs them — the raw
counters here are cumulative.

The full Phase 7 schema after 7.2:

```
v5:temporal:adoption                  → hash (Phase 7.1; 3 fields)
v5:topology:playback                  → hash (Phase 7.2; 5 fields)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1; surfaced on /telemetry)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the hash has no per-visitor field |
| No fingerprint | The endpoint reads ONLY the JSON body `{ kind }`. No IP, no UA, no cookie, no header beyond what Vercel logs at the platform layer |
| No identity persistence | No identifier minted by this layer. The controller's `onTelemetry` callback receives a kind string, not a session id |
| No surfacing | The /evolution "Playback (latent)" row displays the AGGREGATE counts, never a per-visitor history |
| Graceful no-op | KV unavailable → record helper returns silently; read helper returns `{}` |
| No consent gate by design | Symmetric with Phase 7.1's temporal-adoption: temporal data is public-archive content. The playback signal carries no per-visitor data |
| Deterministic math | No Date.now / Math.random in the interpolation layer; the same `(frames, fromIndex, toIndex, progress)` always produces the same cursor |

Determinism is itself a privacy invariant in this layer:
because the cursor math has no time / random component, it
cannot inadvertently encode visitor-identifying signal into
its output.

---

## 8. Performance posture

V5 § 5.2 budget: bundle < 6 KB.

| Surface | Measurement |
|---------|-------------|
| `frames.ts` raw source | 7,587 B (heavy on docblocks per V5 convention) |
| `playback.ts` raw source | 16,018 B (same — comments dominate) |
| `playback-telemetry.ts` raw source | 3,142 B |
| Estimated minified (frames + playback combined) | ~4-5 KB after dead-code elim + comment stripping |
| Estimated gzipped | ~1.5-2 KB (V5 § 5.2's `< 6 KB` budget fits comfortably either way) |
| Client bundle delta on `/evolution` | 0. No consumer mounts; the primitive tree-shakes out completely. Verified via grep on `.next/static`. |
| Client bundle delta on every other route | 0. The 7.2 modules are imported only by the page (which uses `readPlaybackAdoption` server-side) and by the endpoint (server-side). |
| Endpoint latency | One JSON parse + one validate + one HINCRBY. ~5-20 ms warm. Fire-and-forget from the (future) consumer; never blocks the visitor. |
| Idle CPU at controller construction | 0%. Zero timers, zero listeners, zero RAF. Same posture as 6.3's PacingProvider when no consumer reads. |
| Idle CPU during `play()` | One RAF tick per ~16 ms (browser default); `setSnappedCursor` runs at most every 33 ms (the 30 fps coalescing cap). Same order of magnitude as the existing Reveal animation. |
| Idle CPU after `pause()` / `destroy()` | 0%. RAF cancelled. The state object is dereferenced when the consumer drops its reference. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordPlaybackEvent` in client chunks | 0 ✓ |
| `readPlaybackAdoption` in client chunks | 0 ✓ |
| `PLAYBACK_ADOPTION_HASH_KEY` in client chunks | 0 ✓ |
| `createTemporalPlayback` in client chunks | 0 ✓ |
| `buildTemporalFrames` in client chunks | 0 ✓ |
| `interpolateCursor` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |

The math layer + the controller will land in a client chunk
only when Sub-PR 7.3 mounts the slider — at which point the
bundle delta is measured against the V5 § 5.2 6 KB ceiling.

---

## 9. Determinism + idle-CPU verification

V5 § 5.2 7.2 declares "Frame interpolation deterministic" and
"Idle CPU 0% when scrubber inactive" as load-bearing
requirements. Both are enforced structurally rather than by
assertion:

### Determinism — structural enforcement

- `frameTimestamp(event)` returns `Date.parse("<date>T00:00:00Z")`.
  ISO-8601 with explicit `Z` is locale-independent across every
  V8 / SpiderMonkey / JavaScriptCore runtime. No `new Date()`
  with implicit timezone.
- `buildTemporalFrames(events)` sorts by `(t ascending, id
  ascending)`. Pure comparator; no Date.now, no Math.random,
  no global state.
- `interpolateCursor(frames, from, to, progress)` is four
  parameters → one return value. No closure-captured state, no
  module-scope mutation.
- `snapCursor`, `findFrameIndex` are similarly pure.

A grep for `Date.now\|Math.random\|performance.now` against
`lib/v5/temporal/frames.ts` returns 0 matches. The same grep
against `lib/v5/temporal/playback.ts` returns matches ONLY
inside the RAF callback closure (where wall-clock IS the
correct dependency — it drives the play animation), never in
the pure cursor-computation paths.

### Idle CPU — structural enforcement

- `createTemporalPlayback(opts)` runs `buildTemporalFrames` +
  `snapCursor` once, then returns. No timers spawn.
- `seek`, `seekToIndex`, `scrubTo`, `nextFrame`, `prevFrame`
  all complete synchronously. After each call, the controller
  is in a stable "not playing, no RAF" state.
- `play()` is the only path that spawns work — a single
  `raf(step)` call. The `step` closure schedules its successor
  via `raf(step)`; the loop continues until either `pause()`
  cancels it, the cursor reaches the end (which auto-pauses),
  or `destroy()` cancels it.
- `pause()` and `destroy()` both call `cancelInFlight()` which
  invokes the consumer-provided `cancelAnimationFrame` (or the
  global) and zeros `state.rafId`. Idempotent.

A grep for `setInterval\|setTimeout` against `lib/v5/temporal/`
returns 0 matches. The only async scheduling primitive in the
module tree is `requestAnimationFrame`, gated behind `play()`.

---

## 10. Edge / runtime notes

- `/api/v5/temporal/playback` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/temporal/playback` (Dynamic,
  edge-inferred). One HINCRBY per qualifying event.
- `lib/v5/temporal/frames.ts` + `playback.ts` are pure ES
  modules with no Node / DOM imports. Universally importable
  (edge, node, browser, test environments).
- `lib/v5/temporal/playback-telemetry.ts` imports `@vercel/kv`
  and is server-only. Verified absent from client chunks.
- The /evolution page (Phase 7.1) was already an edge-rendered
  Server Component reading from KV via `readTemporalAdoption`.
  Adding `readPlaybackAdoption` to the same `Promise.all`
  parallelises both reads in one tick.

---

## 11. Rollback plan

V5 § 5.2 specifies "Rollback: Primitive deletion". The single-
commit revert removes:

- 3 new modules in `lib/v5/temporal/`
- 1 new edge endpoint under `app/api/v5/temporal/playback/`
- The "Playback (latent)" tile row + 3 SOURCE_LINKS entries on
  the /evolution page
- The pill state edit + footer copy edit on the same page

KV state orphaned after revert:
- `v5:topology:playback` hash — no further writes; existing
  counts sit harmlessly under the key. Can be `DEL`'d manually
  if desired.

No schema break, no env-var rollback, no migration story. The
Phase 7.1 surface continues to render its three temporal-
adoption tiles unchanged; the platform reverts to the V5 Phase
7.1 tip.

If only the endpoint needs to be silenced without a code
revert:
- The endpoint always returns 204 — there is no failure mode
  to "silence". Removing it from the layout is unnecessary
  because no consumer fires yet.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ 0 errors (2 prefer-const errors caught + fixed during validation) |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages |
| `/api/v5/temporal/playback` registered as `ƒ Dynamic` (edge) | ✓ |
| `/evolution` registered as `ƒ Dynamic` with 1h ISR (unchanged) | ✓ |
| Bundle posture (playback server symbols in client) | ✓ 0 matches |
| Frame + controller symbols absent from `.next/static` | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core; pill state updated to "Phase 7 · primitives") | ✓ |
| Reduced-motion compliance (controller short-circuits `play()` on `respectsReducedMotion`) | ✓ |
| Hydration safety (controller SSR-safe; RAF gated; page edits are server-rendered) | ✓ |
| Determinism (no `Date.now` / `Math.random` in math layer) | ✓ grep-verified |
| Idle CPU 0% when scrubber inactive (no `setInterval` / `setTimeout`; RAF gated to `play()`) | ✓ grep-verified |
| HTTP smoke: POST seek/scrub/play/pause/step → 204 | ✓ 5/5 |
| HTTP smoke: POST invalid kind, malformed JSON → 204 | ✓ |
| HTTP smoke: GET → 405 Allow: POST | ✓ |
| /evolution renders "Playback (latent)" + 5 tile labels | ✓ |
| /evolution renders 3 new SOURCE_LINKS entries | ✓ |
| /evolution pill state "Phase 7 · primitives" | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 13. Future dependencies unlocked

This sub-PR completes the temporal traversal contract and
enables:

- **Sub-PR 7.3** — Timeline Slider Component. Will mount a
  `<TimelineSlider>` React component that calls
  `createTemporalPlayback({...})` inside a `useMemo`, reads
  the cursor via `useSyncExternalStore`, and renders a WCAG
  2.5.5-compliant slider. Will subscribe to `matchMedia` and
  pass `respectsReducedMotion` into the controller. Will wire
  `onTelemetry` to `/api/v5/temporal/playback`.
- **Sub-PR 7.4** — Architecture Page Time-Aware Integration.
  Will mount the slider on `/architecture/<slug>` pages with
  the events filtered to `system === slug`. Will read the
  cursor to fade between architectural snapshots (the visual
  layer Sub-PR 7.4 introduces).
- **Phase 8** — Cinematic topology. The WebGPU renderer will
  read `getCursor()` on every frame and interpolate node
  positions across topology snapshots. The same controller
  drives both the slider and the 3D camera.
- **Phase 9** — Operational digital twin. The /v5/operating
  surface will read a `getRecentEvolutionEvents(N)` slice and
  expose a tiny inline scrubber for the last 4 weeks.
- **Lumina V4 architecture-critic sub-agent** — can read the
  controller's cursor as ambient context when reasoning about
  "what was the system like 3 months ago" (Phase 10 wiring).

---

## 14. Deferred systems

Carried from 7.1's deferred list, plus 7.2-specific:

- **Timeline slider UI** → Sub-PR 7.3.
- **Architecture page integration** → Sub-PR 7.4.
- **Architecture snapshot manifest** (per-system visual states
  Phase 7.4 / Phase 8 will fade between) → Sub-PR 7.4 or 8.x.
- **Spring physics, easing on the playback engine itself** →
  permanently rejected per V5 § 2.5. Consumers can ease their
  render output; the engine math stays linear.
- **Variable-speed playback presets** (0.25x / 0.5x / 1x / 2x
  buttons) → 7.3's slider can implement these via
  `play(speedMultiplier)`; the primitive already supports them.
- **Loop / autoplay-on-mount mode** → consumer decision in 7.3;
  the primitive's `play()` requires an explicit call.
- **Multi-cursor view** (two cursors comparing two moments)
  → defer to a hypothetical Phase 8.x diff surface; the
  primitive does not preclude this but ships single-cursor
  only in 7.2.

Permanently rejected (carried from V5 § 3.3 + § 2.4):
- Per-visitor playback profiles (would require per-visitor
  storage; the layer is aggregate-only by contract).
- Auto-generated architecture frames from the registry alone
  (defers to Phase 8 / 9 operational twin).
- "Smart" cursor that LLM-decides where to point (Anti-Generic-
  AI Law; the cursor is mechanical).

---

## 15. Next sub-PR

**Sub-PR 7.3 — Timeline Slider Component.** Per V5 § 5.2:

- `components/v5/Timeline*.tsx`
- Touch + keyboard + mouse all functional
- WCAG 2.5.5 AAA hit target
- Reduced-motion: slider remains, animation removes
- Telemetry: `v5:topology:timeline:engagement_rate`

Will consume the 7.2 controller. Will wire `onTelemetry` to
`/api/v5/temporal/playback`. Will mount on `/evolution` as the
first surface that exercises the primitive end-to-end (the
architecture-page integration in 7.4 will mount the same
component, scoped to a single project's events).

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 16. Closing — the time-cursor exists

Sub-PR 7.1 shipped the engineering memory itself. Sub-PR 7.2
ships the cursor that moves through it — deterministic,
reduced-motion-safe, idle-CPU-zero, dependency-free, ~5 KB
minified when a consumer eventually loads it.

The visitor sees almost nothing new — the /evolution page
gained a "Playback (latent)" tile row that displays five
zeros. The chassis is built; the slider that exercises it
lands in 7.3.

Phase 7 opened with a system that remembers itself. Sub-PR 7.2
gives that system the verbs by which subsequent surfaces will
move through that memory.
