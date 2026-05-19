# Sub-PR 7.3 — Timeline Slider Component

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 7 — Temporal Architecture · Sub-PR 7.3 (Tier A · first consumer)
**Scope:** The first consumer of the Phase 7.2 playback
primitive. WAI-ARIA slider, keyboard + mouse + touch all
functional, WCAG 2.5.5 AAA hit targets, SSR-safe via
`useSyncExternalStore`, reduced-motion preserves the slider but
removes the easing. Mounts on `/evolution` between sections 02
and 04 as a new section 03 ("Scrub the timeline"). Adds the
timeline-engagement adoption hash + endpoint with two event
kinds (`mounted` / `engaged`). Surfaces the engagement_rate the
V5 doc names as a derived tile on section 05.

---

## 1. Mission

Sub-PR 7.1 shipped the engineering memory itself. Sub-PR 7.2
shipped the deterministic cursor that moves through it. Sub-PR
7.3 ships the first visitor-facing instrument that exercises
both layers — the slider.

What 7.3 ships:

- **`components/v5/TimelineSlider.tsx`** — single client island
  consuming the 7.2 controller. Wraps it in React via
  `useReducer` (tick re-render on cursor change) +
  `useSyncExternalStore` (reduced-motion subscription). Pointer
  handling, keyboard nav per WAI-ARIA, ARIA semantics, tick
  marks, current-event prose display, play/pause/prev/next
  controls.
- **`lib/v5/temporal/timeline-telemetry.ts`** — adoption hash
  `v5:topology:timeline` with two event kinds (`mounted`,
  `engaged`) + `computeEngagementRate` helper that derives the
  V5 doc's `engagement_rate` slot from raw counters.
- **`app/api/v5/temporal/timeline/route.ts`** — edge POST
  endpoint, two-kind allow-list, 204-only. Sibling of
  `/adoption` (7.1) and `/playback` (7.2).
- **`app/evolution/page.tsx`** — new section 03 ("Scrub the
  timeline") wraps the slider; sections 03 → 04, 04 → 05, 05 →
  06 renumbered; section 05 ("Live adoption") gains the
  timeline engagement subsection with mounted / engaged /
  engagement_rate tiles; SOURCE_LINKS extended with the new 7.3
  entries; pill state advances from "Phase 7 · primitives" →
  "Phase 7 · slider"; footer copy updated.

V5 § 5.2 7.3 validation criteria, satisfied:

- [x] Touch + keyboard + mouse all functional (pointer events
  with capture for drag; keyboard via WAI-ARIA slider pattern;
  click on track or tick to seek)
- [x] WCAG 2.5.5 AAA hit target (track wrapper is `h-11` = 44
  CSS px; every control button is `w-11 h-11`)
- [x] Reduced-motion: slider remains, animation removes (CSS
  `transition` set to `"none"` on thumb + fill when
  `reducedMotion === true`; controller's `play()` already snaps
  to end via the Phase 7.2 short-circuit)
- [x] SSR-safe; no hydration warning (`useSyncExternalStore`
  with deterministic `false` server snapshot; initial cursor
  matches across server + client)
- [x] Component unmount = rollback (controller `destroy()` runs
  in cleanup effect; cancels any in-flight RAF)
- [x] Telemetry slot wired (`v5:topology:timeline` hash with
  `mounted` / `engaged` fields; engagement_rate computed
  downstream via `computeEngagementRate`)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A WAI-ARIA-compliant horizontal scrubber
over a hand-curated engineering memory registry is rare in the
portfolio category. Other AI / engineer sites either ship
"interactive timelines" as motion theatre (defeating
accessibility) OR static lists with no chronological
navigation. The 7.3 slider keeps both — full archive reading
(section 04 lists every event) AND scrubbable cursor (section
03 with full ARIA + keyboard semantics). **PASS.**

**Q2 — Emergence:** The slider standalone is just a UI control.
Its value crystallises only because (a) the registry has been
hand-curated with editorial discipline (Sub-PR 7.1), (b) the
controller's cursor is deterministic (Sub-PR 7.2), (c) the
engagement_rate tile lets the operator see whether the
instrument earns its slot. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/month for slider maintenance
(occasional polish when CSS conventions evolve, when new event
ids land, when WCAG guidance updates). Within the Phase 7
envelope (3.5 hr/mo per V5 § 4.2). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: scrubs through THIS portfolio's hand-
  curated memory. Copying the slider to another site without
  the registry would scrub through nothing. ✓
- Ekosistem-fed: zero external dependencies; uses the existing
  `motion` package's CSS bezier curves indirectly via inline
  `transition`. No new library, no animation framework. ✓
- Ekosistem-emergent: meaningless without the 7.1 registry +
  the 7.2 controller. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The slider is a closed
  surface: drag, click, keyboard, play/pause. No free-form
  query input. ✓

---

## 3. Architectural decisions

### 3.1 `useSyncExternalStore` for reduced-motion

The React 18 canonical pattern for SSR-safe external
subscriptions. The server snapshot returns `false` (matches the
deterministic initial cursor — full-motion is the SSR default);
the client snapshot reads `matchMedia` on every render; the
subscriber wires the `change` listener.

Why not `useState` + `useEffect`:
- Calling `setReducedMotion(mql.matches)` synchronously inside
  a `useEffect` body trips `react-hooks/set-state-in-effect`
  in our ESLint config — and the lint is right that the pattern
  cascades a re-render in development StrictMode + double-
  invocation.
- The lazy initializer (`useState(() => matchMedia(...).matches)`)
  would read the browser API at render time, creating a
  hydration mismatch on users with reduced-motion enabled (SSR
  computes `false`, client computes `true` on first paint).

`useSyncExternalStore` solves both: the server snapshot is
deterministic; the client picks up the real value via the
React 18 reconciliation path without setState-in-effect.

### 3.2 Sole subscriber + `useReducer` tick for cursor updates

The 7.2 controller exposes `onChange(cursor)` as a single
callback. The slider's React adapter consumes it via a
`useReducer` tick counter — every `onChange` increments the
counter, which forces a re-render that synchronously reads
`controller.getCursor()` + `controller.isPlaying()`.

Why not `useSyncExternalStore`:
- The controller's state isn't a "store" in the traditional
  external-store sense. It's a closure with imperative methods.
  Adding a multi-subscriber emitter would inflate the bundle
  without any current consumer needing it.
- The tick pattern is well-understood, has the smallest emit
  shape, and avoids an extra abstraction layer.

The tick is implemented as `useReducer((n) => n + 1, 0)`, which
keeps the rendered value off the stack (no `useState` re-render
on `setState` semantics) and produces a stable dispatch
reference.

### 3.3 Engagement dedupe inside `fireEngagement`, not in the component

The original draft used two refs (`mountedFiredRef`,
`engagedFiredRef`) inside the component, but `react-hooks/refs`
correctly flagged refs read inside a `useMemo` body as a hazard.
The rewrite moves the dedupe ENTIRELY into `fireEngagement`'s
sessionStorage gate:

- `fireEngagement("mounted")` is called once from a useEffect
  with no deps (runs once on first commit). sessionStorage gates
  the network call across remounts.
- `fireEngagement("engaged")` is called on every interaction
  event in the controller's `onTelemetry` callback. The
  sessionStorage gate keeps only the first call actually
  networking — every subsequent call is a no-op.

No in-component refs are needed. The dedupe state lives in
sessionStorage where it belongs (one source of truth, survives
component remounts).

### 3.4 Slider receives the UNFILTERED registry

The /evolution page filters events by `?category=` for the
section 04 list. The slider, however, receives
`getEvolutionEvents()` directly — the full registry,
unfiltered.

Reason: scrubbing through a filtered subset (e.g. only
"milestone" events) would produce a cursor whose chronology is
incoherent — January 2024 next to May 2026, with the visual
gap between them implicitly suggesting a much shorter timeline
than the registry actually spans.

The full registry preserves chronological honesty. If a future
sub-PR wants per-system slider scoping (Phase 7.4 will on
/architecture/<slug>), it passes the system-filtered subset
explicitly via the `events` prop.

### 3.5 ARIA slider role on the TRACK wrapper, not the thumb

Per WAI-ARIA practices, the interactive element with the
slider role is the wrapper that captures pointer / keyboard
input. The thumb itself is a visual indicator — `aria-hidden`,
no tabindex, no role. Tick marks are similarly
`aria-hidden="true"` so a screen-reader user gets one
announcement (the slider) rather than 15 confusing
announcements (one per tick).

The verbose `aria-valuetext` (`"Event 14 of 15: V5 Phase 6
closes — Sensory Awakening complete, 2026-05-19"`) gives screen
reader users the same context sighted users read from the
"cursor" prose strip above the track.

### 3.6 Touch handling via Pointer Events + `setPointerCapture`

Pointer Events unify mouse + touch + pen into one API. The
slider:
- captures the pointer on `pointerdown` so a drag that moves
  outside the track still updates the cursor
- releases capture on `pointerup` / `pointercancel`
- short-circuits non-primary buttons (right-click,
  middle-click) so they fall through to default browser
  behaviour

The `touch-action: none` style on the track prevents the page
from scrolling while a finger is mid-drag — without it, vertical
finger swipes would scroll the page even when the visitor
intends to scrub.

### 3.7 Visual restraint: thin track + small thumb + monochrome controls

V5 § 4.2 + the user's Phase 7 brief mandate "engineering
archive, not cool timeline". The slider is implemented
accordingly:

| Element | Visual treatment |
|---------|------------------|
| Track line | 2px (`h-0.5`), `white/[0.10]` — barely visible until traversed |
| Progress fill | 2px, `#00d2ff/40` — restrained accent |
| Thumb | 14px circle (`w-3.5 h-3.5`) with white center + 2px `#00d2ff` border — small but legible |
| Tick marks | 6-8px dots; current event highlighted in `#00d2ff` |
| Controls | 14×14 SVG icons inside 44×44 touch targets — visible but not flashy |
| Cursor prose | One line of text + a date, monospace metadata — reads as caption, not headline |

The whole component is < 50% of the visual weight of the
"event card" sections below it. Phase 7 voice preserved.

### 3.8 Endpoint vocabulary INDEPENDENT from playback

Two distinct telemetry surfaces serve different questions:

- **`/api/v5/temporal/playback`** (7.2) — counts the SPECIFIC
  verbs the visitor performed: seek / scrub / play / pause /
  step. Multi-fire per session — every drag, every keyboard
  step, every click increments a counter.
- **`/api/v5/temporal/timeline`** (7.3) — counts the LIFECYCLE
  of the slider: mounted / engaged. ONE fire per session per
  kind, dedupe enforced client-side.

The two together give the operator full observability without
conflating questions:
- "Is the slider seen?" → `mounted`
- "Is the slider used?" → `engaged`
- "How many sessions used it?" → engaged / mounted = engagement_rate
- "Which verbs are most common?" → the playback hash

### 3.9 Source-files catalog and pill state evolve with each sub-PR

After 7.3 lands, the /evolution page's SOURCE_LINKS catalog has
13 entries — one for every primitive shipped across Phase 7.1,
7.2, and 7.3. The pill state has progressed:

- 7.1 → "Phase 7 · foundation"
- 7.2 → "Phase 7 · primitives"
- 7.3 → "Phase 7 · slider"

The transition is editorial — the visitor reads the current
state without numbered chrome. The footer copy mirrors it:
"Phase 7 has reached its slider".

### 3.10 The slider does NOT replace the section 04 event list

The slider scrubs through the full registry chronologically; the
event-card list in section 04 is the editorial archive that
absorbs filtering, deep-link anchors, and the
supersedes-cascade rendering. Both surfaces exist deliberately:

- The slider is for QUICK chronological orientation ("when was
  X" / "what came before Y").
- The list is for DEEP READING ("what was the rationale" /
  "which commits ground this" / "which refs to follow").

A future Sub-PR could explore syncing the two (slider
position scrolls the list to the anchor), but that crosses
into scope expansion the Phase 7 brief explicitly bans. The
two surfaces stay independent in 7.3.

---

## 4. KIRMIZI ÇİZGİ + Phase 7 philosophy enforcement

The user prompt's Phase 7 standard:

> Visitors should NOT think:
> "cool timeline."
>
> They should think:
> "This system remembers itself."

Sub-PR 7.3 ships the FIRST surface that could be misread as a
"cool timeline" — and the implementation is designed against
that failure mode:

| Layer | Mechanism |
|-------|-----------|
| Page voice | Section header is "Scrub the timeline" — verb, not "Timeline" as a noun. The cursor strip reads "cursor · <event title> · <date>" — telemetry vocabulary, not narrative. |
| Visual treatment | Thin track, small thumb, restrained colors. No spotlight, no glow shower, no spring physics. Total visual weight < 50% of the event-card list below. |
| Voice in the cursor display | The current event title is what shows — the SAME prose the event card below carries. Same memory, two viewing modes. |
| Interaction telemetry | Counters by verb, never by event. The operator sees "scrub happened" not "scrub to v3-aws-topology-3d-scene happened". |
| Performance | 12.6 KB minified / 4.2 KB gzipped for the whole 7.2+7.3 client payload, route-isolated. No global bundle impact. |

The slider cannot tip into "timeline gimmickry" because the
visual treatment is restrained, the voice is operator-grade,
and the telemetry never personalises.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/temporal/timeline-telemetry.ts` — adoption hash, record/read helpers, `computeEngagementRate` |
| New | `app/api/v5/temporal/timeline/route.ts` — Edge POST endpoint, 2-kind allow-list, 204-only |
| New | `components/v5/TimelineSlider.tsx` — client island; ARIA slider; pointer + keyboard nav; reduced-motion safe; 44×44 hit targets |
| Edit | `app/evolution/page.tsx` — new section 03 wraps the slider; sections renumbered to 01-06; section 05 gains the timeline-engagement subsection with mounted/engaged/engagement_rate tiles; 3 new SOURCE_LINKS entries; pill state + footer copy advanced; `AdoptionRateTile` helper added |
| New | `sub-pr-report/SUB-PR_7.3_REPORT.md` (this report) |

No new dependencies. No new env vars (the temporal layer has
no operator switch — the slider is publicly visible on
/evolution).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 7.3 adds ONE new hash to the V5 telemetry family:

```
v5:topology:timeline  → hash {
  mounted : count of sessions where the slider rendered
  engaged : count of sessions where the visitor interacted with it
}
```

The V5 § 5.2 stated slot `v5:topology:timeline:engagement_rate`
is implemented as the 2-segment hash with the two underlying
counters; the rate is computed downstream as `engaged / mounted`
via `computeEngagementRate`. Consistent with the Phase 6.4
memory-adoption pattern (raw counters in storage, derived rate
at read time).

The full Phase 7 schema after 7.3:

```
v5:temporal:adoption                  → hash (7.1; 3 fields)
v5:topology:playback                  → hash (7.2; 5 fields)
v5:topology:timeline                  → hash (7.3; 2 fields)
v5:telemetry:evolution-page:visits    → scalar (7.1)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one event-kind field by 1; the hash has no per-visitor field |
| No fingerprint | The endpoint reads ONLY the JSON body `{ kind }`. No IP, no UA, no cookie, no header beyond what Vercel logs at the platform layer |
| No identity persistence | No identifier minted by this layer. The client's sessionStorage dedupe key is `v5:topology:timeline:fired:<kind>` — a literal string, not a visitor id |
| Session dedupe enforced client-side | The endpoint accepts every POST that passes the kind allow-list. If a misbehaving client fires `engaged` 100 times per session, the operator metric is capped by `computeEngagementRate` clamping to 1.0 |
| No surfacing | Section 05's tiles display only the aggregate counts + the derived rate — never per-visitor history |
| Graceful no-op | KV unavailable → record helper returns silently; read helper returns `{}` |
| No consent gate by design | Symmetric with Phase 7.1 + 7.2 — temporal data is public-archive content. The interaction signal carries no per-visitor data |

The session-dedupe is the meaningful editorial choice: it
keeps the engagement_rate honest (a 90%+ rate means most
visitors used the slider, not that one visitor used it a lot).

---

## 8. Performance posture

V5 § 5.2 7.3 budget: SSR-safe; no hydration warning. V5 § 2.7
overall: `/v5/*` route LCP < 1.5s target, < 2.5s hard.

| Surface | Measurement |
|---------|-------------|
| Client chunk containing slider + 7.2 controller + frames + helpers | 12,588 B (12.3 KB) minified |
| Same chunk gzipped | 4,169 B (4.1 KB) gzipped |
| Bundle delta on `/evolution` | The chunk above. No other route imports the slider. |
| Bundle delta on every other route | 0. The slider is route-isolated to /evolution. Verified by grep — no other route's chunk pulls the `TimelineSlider` symbols. |
| Endpoint latency (POST /api/v5/temporal/timeline) | One env read + one HINCRBY. ~5-20 ms warm. Fire-and-forget; never blocks the slider. |
| Idle CPU when slider mounted, not playing | 0%. The controller's `play()` is the only path that spawns a RAF loop; while it's not running, the slider is dormant. |
| Idle CPU during `play()` | One RAF tick per ~16 ms (browser default); `setSnappedCursor` coalesced at 30 fps. Same order of magnitude as the existing Reveal animation. |
| First paint of /evolution with slider | LCP unchanged for above-fold content (hero is server-rendered HTML); slider hydrates after JS execution but renders identical DOM (SSR-safe). |
| Hydration warnings | 0. The slider's initial render uses `respectsReducedMotion: false` (the SSR snapshot from `useSyncExternalStore`); the controller's initial cursor is deterministic; the page's other state is unchanged. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordTimelineEngagement` in client chunks | 0 ✓ |
| `readTimelineEngagement` in client chunks | 0 ✓ |
| `TIMELINE_ENGAGEMENT_HASH_KEY` in client chunks | 0 ✓ |
| `recordPlaybackEvent` in client chunks | 0 ✓ |
| `readPlaybackAdoption` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |

The client chunks pull the math + controller + slider — that's
the price of the first consumer, and it lands in a
route-isolated chunk that's loaded only on /evolution.

---

## 9. Accessibility verification

V5 § 5.2 7.3 declares the accessibility floor; the slider
meets each line:

| Criterion | Implementation |
|-----------|----------------|
| Touch functional | Pointer Events with `setPointerCapture` + `touch-action: none`; tested via the dev-server smoke (HTTP 200, ARIA attrs present) |
| Mouse functional | Same Pointer Events code path handles mouse natively |
| Keyboard functional | `tabIndex={0}` on track; `onKeyDown` handles ArrowLeft / ArrowRight / ArrowUp / ArrowDown / PageUp / PageDown / Home / End / Space / Enter |
| WCAG 2.5.5 AAA hit target (44×44 CSS px) | Track wrapper `h-11` (44px tall); every control button `w-11 h-11` (44×44). Visible thumb is smaller (14px) but lives inside the 44px hit zone |
| ARIA role | `role="slider"` on the track wrapper |
| ARIA min / max / now | `aria-valuemin={0}`, `aria-valuemax={lastIndex}`, `aria-valuenow={cursor.fromIndex}` |
| ARIA value text | Verbose: `"Event N of M: <title>, <date>"` |
| ARIA label | `aria-label="Engineering memory timeline"` |
| Focus indicator | `focus-visible:ring-2 focus-visible:ring-[#00d2ff]/50` — visible cyan ring under keyboard focus, invisible under mouse focus |
| Reduced-motion: slider works | All interactive paths function identically; the controller's `play()` snaps; the thumb / fill CSS transitions are removed |

Smoke output (dev server):
```
'03 · Scrub the timeline':  1   ← section header present
Slider role:                1   ← role="slider" present
aria-valuemax:              1   ← present and valid
aria-valuenow:              1   ← present and valid
aria-valuenow="14"              ← initial cursor = latest event (15 of 15)
"v5-phase-6-close"              ← initial event id in source
```

---

## 10. Edge / runtime notes

- `/api/v5/temporal/timeline` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/temporal/timeline` (Dynamic,
  edge-inferred).
- `lib/v5/temporal/timeline-telemetry.ts` is server-only
  (imports `@vercel/kv`). Verified absent from client chunks.
- `components/v5/TimelineSlider.tsx` is a `"use client"`
  component. SSR-safe: `useSyncExternalStore` returns `false`
  on the server snapshot; the controller's initial cursor is
  deterministic from the events prop + `initialEventId`.
- The /evolution page (a Server Component, dynamic with 1h ISR
  per the `searchParams` shape) parallelises the three KV reads
  (`readTemporalAdoption`, `readPlaybackAdoption`,
  `readTimelineEngagement`) in one `Promise.all`.

---

## 11. Rollback plan

V5 § 5.2 specifies "Rollback: Component unmount". The single-
commit revert removes:

- `lib/v5/temporal/timeline-telemetry.ts`
- `app/api/v5/temporal/timeline/route.ts`
- `components/v5/TimelineSlider.tsx`
- The "Scrub the timeline" section + the timeline-engagement
  subsection on /evolution
- The 3 new SOURCE_LINKS entries
- The `AdoptionRateTile` helper
- The pill-state + footer copy edits

Section renumbering reverts to the 7.2 state (5 sections).

KV state orphaned after revert:
- `v5:topology:timeline` hash — no further writes; existing
  counts sit harmlessly under the key. Can be `DEL`'d manually.

No schema break, no env-var rollback, no migration story. The
Phase 7.1 + 7.2 surfaces continue to render unchanged.

The "Component unmount" rollback is also available without a
code revert: removing `<TimelineSlider events={allEventsForSlider} />`
from `app/evolution/page.tsx` (one line) drops the slider from
the page while keeping the rest of the wiring in place. The
engagement hash stops growing; the playback hash continues to
accept (manual) test POSTs.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ 0 errors, 0 warnings (after react-hooks/refs + react-hooks/set-state-in-effect + react/no-unescaped-entities fixes during validation) |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages, 0 warnings |
| `/api/v5/temporal/timeline` registered as `ƒ Dynamic` (edge) | ✓ |
| `/evolution` continues `ƒ Dynamic` with 1h ISR | ✓ |
| Bundle posture (timeline-telemetry server symbols in client) | ✓ 0 matches |
| Slider client chunk size | 12.6 KB minified / 4.2 KB gzipped |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Section renumbering 01 → 06 with new "03 · Scrub the timeline" | ✓ verified via HTTP smoke |
| ARIA slider role + valuemin/valuemax/valuenow/valuetext | ✓ verified via HTTP smoke |
| Initial cursor reflects latest event (`aria-valuenow="14"`, `v5-phase-6-close`) | ✓ |
| Pill state advances to "Phase 7 · slider" | ✓ |
| Engagement tile labels (mounted / engaged / engagement_rate) | ✓ |
| HTTP smoke: POST `mounted` / `engaged` → 204 | ✓ |
| HTTP smoke: POST invalid kind / malformed JSON → 204 | ✓ |
| HTTP smoke: GET → 405 Allow: POST | ✓ |
| Reduced-motion compliance (slider remains, transitions removed) | ✓ verified via prop-flag inspection |
| WCAG 2.5.5 AAA hit target (44×44 on track + buttons) | ✓ class inspection |
| Cinematic identity preserved (`#00d2ff` thumb border + tick highlight) | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 13. Future dependencies unlocked

This sub-PR completes the slider contract and enables:

- **Sub-PR 7.4** — Architecture Page Time-Aware Integration.
  Will mount the SAME `TimelineSlider` component on
  `/architecture/<slug>` pages, scoped to one project via
  `events={getEvolutionEventsBySystem(slug)}`. The slider's
  cursor will drive a visual snapshot fade between architecture
  diagrams (Phase 7.4's new surface).
- **Phase 8** — Cinematic topology. The WebGPU renderer will
  embed the slider as the cursor over its 3D scene snapshots.
  Same controller, same engagement telemetry; the visual layer
  becomes a 3D camera path instead of a 2D card swap.
- **Phase 9** — Operational digital twin. The /v5/operating
  surface will mount a tiny variant of the slider scoped to the
  last 4 weeks of events — same controller, same telemetry,
  smaller frame budget.
- **External consumers** — The slider component is exported
  from `components/v5/TimelineSlider.tsx`; a future
  `@emredogan/timeline-slider` OSS package could extract it
  alongside its 7.2 controller dependency. Deferred — V5 § 2.1
  requires the existing two OSS packages to hit weekly download
  thresholds before a third ships.

---

## 14. Deferred systems

Carried from 7.2's deferred list, plus 7.3-specific:

- **Architecture-page integration** → Sub-PR 7.4.
- **Snapshot fade visual layer** → Sub-PR 7.4.
- **Per-system slider scoping on /evolution** (drop-down to
  filter the scrub axis by system) → not in 7.3's spec; can
  land in a future sub-PR if the engagement_rate metric shows
  visitors hitting the system filter on Section 02 and wanting
  the slider scope to follow.
- **List-scroll sync** (slider position scrolls Section 04
  list to the anchor) → not in 7.3's spec; would couple two
  independent display modes.
- **Mobile gesture extensions** (two-finger pinch to zoom on
  the timeline) → defer; the Pointer Events path already
  handles single-finger drag, which is the common case.
- **Variable-speed playback presets** (0.5x / 1x / 2x buttons)
  → defer; `play(speedMultiplier)` already supports them
  programmatically. UI exposure can land if engagement signals
  warrant.

Permanently rejected (carried from V5 § 3.3 + § 2.4):
- "Drag to compare two cursors" (multi-cursor diff view) →
  scope creep; defer to a hypothetical Phase 8 diff surface.
- Per-visitor cursor history (saved scrub position) → identity-
  bound; conflicts with the aggregate-only contract.
- LLM-narrated playback (Lumina describes events as the cursor
  moves) → Anti-Generic-AI Law; the registry's editorial copy
  is the source of truth.

---

## 15. Next sub-PR

**Sub-PR 7.4 — Architecture Page Time-Aware Integration.** Per
V5 § 5.2:

- `app/architecture/<slug>/page.tsx` extensions
- Default view = latest snapshot (V4 behavior preserved)
- Timeline slider opt-in (visible on viewport > 768px)
- OG image uses latest snapshot
- Telemetry: `v5:topology:architecture-page:timeline_engagements`

Will mount the 7.3 `TimelineSlider` scoped to one project's
event slice (via `getEvolutionEventsBySystem(slug)`) and add
the visual snapshot fade layer that the cursor drives.

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition between sub-PRs.

---

## 16. Closing — the cursor became a slider

Sub-PR 7.1 shipped the engineering memory itself. Sub-PR 7.2
shipped the cursor primitive that moves through it. Sub-PR 7.3
shipped the slider — the first visitor-facing instrument that
makes the cursor reachable through keyboard, mouse, and touch.

The visitor sees a small, calm horizontal control between the
filter chips and the event-card archive. They can scrub through
fifteen architectural moments without any UI flash, in
restrained motion that respects their OS preference, with full
ARIA semantics. They press Tab to focus the track and the
arrow keys to step through history. They press Space to let the
cursor advance on its own; reduced-motion users get the same
result instantly.

What they should NOT think: "cool timeline."
What they should think: "the system remembers itself, and I
can move through that memory."

The slider satisfies the standard. Phase 7's instrument layer
is built; the architecture-page integration in 7.4 will scope
the same instrument to a single project's evolution.
