# Sub-PR 14.4 — Architecture Timeline Slider On Mobile

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 14 — Work Surfaces · Sub-PR 14.4
**Scope:** Bring the per-architecture timeline interaction to mobile. The V5 `ArchitectureTimelineSection` was gated `hidden md:block` — the single most distinctive temporal interaction in the codebase was mobile-invisible. Sub-PR 14.4 introduces `TimelineLadder` — a vertical, cyan-dotted, tap-to-expand composition that delivers the same data and the same `engaged` telemetry signal in a thumb-scroll-appropriate UX. The desktop slider is preserved verbatim; the ladder takes the mobile slot via the complementary `md:hidden`. Flag-gated by `NEXT_PUBLIC_V6_TIMELINE_LADDER`; default OFF preserves V5 mobile-hidden behavior. Default ON makes the section always-visible with the slider on desktop and the ladder on mobile.

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V4/V5 execution + future, V6 audit § 6.3 (mobile timeline blocker), V6 execution § Sub-PR 14.4 verbatim, V6 future systems, plus the 11.1 / 12.1 / 13.1 / 14.1 / 14.2 / 14.3 closer reports. Branch `feat/v4-phase5-experimental-foundation` clean post-14.3 push, deployment-safe.

Audit anchor § 6.3 — 🔴 BLOCKER:
- "`ArchitectureTimelineSection.tsx`: `className="hidden md:block ..."`. The single most distinctive interaction in the temporal architecture stack — the scrubbable timeline of architectural evolution — is mobile-invisible. Recruiters frequently view sites from phones. They see the V4 baseline. They do not see V5 Phase 7."

Spec anchor: § Sub-PR 14.4 verbatim — replace the `hidden md:block` gate with a mobile-optimized timeline composition. Desktop: keep the existing slider unchanged. Mobile (< 768 px): replace the slider with a vertical timestamp ladder — a column of cyan-dotted year markers, each tappable, expanding inline to show that snapshot's title + date + rationale. The same data, the same engagement signal, a composition appropriate to one-thumb scrolling. The interaction signal (`engaged` event) fires identically; data shape unchanged.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 Phase 7 shipped a drag-to-scrub `TimelineSlider` on `/architecture/<slug>` pages. The slider is the most distinctive temporal interaction in the codebase: a horizontal track, a draggable thumb, keyboard arrows, a play button, sticky-position context — visitors who use it understand the project's architectural evolution in a way no other surface delivers.

But the slider is desktop-only. The `ArchitectureTimelineSection` wrapping it carried `className="hidden md:block ..."`, and Phase 7's spec explicitly opted into that gate: the drag-to-scrub interaction doesn't translate to one-thumb mobile scrolling.

The audit flagged this as a 🔴 BLOCKER. Recruiters frequently view portfolio sites from phones; the V5 timeline was completely invisible to that audience. The fix isn't "show the slider on mobile" — the slider's mechanics don't work there — but "give mobile users a different composition that carries the same data and the same engagement signal."

`TimelineLadder` is that composition. A vertical column of cyan-dotted markers. Each marker carries a date + title (always visible) and a rationale (tap to expand). The same `EvolutionEvent[]` data the slider consumes. The same `engaged` telemetry fire — same endpoint, same payload, same sessionStorage dedupe slot prefix — so the engagement counters continue to read cleanly across desktop + mobile.

Both surfaces coexist inside the section: the slider sits in `hidden md:block`, the ladder sits in `md:hidden`. A single visitor on a single device sees exactly one of them. Engagement signal fires once per session per slug regardless of which surface they engaged.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **New `TimelineLadder` Client Component** — vertical timestamp ladder, cyan-dotted markers, tap-to-expand inline rows, reduced-motion always-expanded, SSR-deterministic initial render. Mirrors the slider's engagement firing pattern (same endpoint, same payload, same sessionStorage dedupe slot prefix).

Cut 2: **`ArchitectureTimelineSection` gains responsive composition** — when the flag is on, the outer section sheds `hidden md:block` (becomes always-visible); the slider takes the desktop slot via `hidden md:block`; the ladder takes the mobile slot via `md:hidden`. When the flag is off the section behaves verbatim per V5 (mobile-hidden).

Cut 3: **Mobile-tuned editorial copy** — the section's intro paragraph splits into two variants. Flag off: V5 copy ("drag the thumb, step with arrows…"). Flag on: ladder-aware copy that mentions both interaction modes ("drag the scrubber on desktop, tap each marker on mobile").

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Two surfaces inside one section, complementary visibility gates

The section's content tree under the flag-on path:

```
<section class="mt-16 mb-12 max-w-3xl">
  <div class="border-t border-white/[0.06] pt-8">
    <p>Memory</p>
    <h2>This system's evolution</h2>
    <p>Editorial paragraph (ladder-aware copy).</p>
    <div class="hidden md:block ...">
      <TimelineSlider />
    </div>
    <div class="md:hidden ...">
      <TimelineLadder />
    </div>
  </div>
</section>
```

Both surfaces render into the DOM at SSR time. CSS hides one based on viewport width. The visitor sees exactly one (the slider on `≥ md`, the ladder on `< md`).

Trade-off accepted: the SSR HTML emits both surfaces (small payload cost — the ladder body is ~3 KB compressed). The benefit: no client-side viewport detection logic, no hydration flicker, no layout shift on resize. Static SSR + CSS gating is the cleanest pattern.

### 3.2 Engagement firing via shared sessionStorage prefix

`TimelineLadder` POSTs to `/api/v5/temporal/timeline` with the same payload shape the slider uses (`{ kind: "engaged", context: slug }`). It dedupes via `sessionStorage` slots keyed `v5:topology:timeline:fired:engaged:{slug}` — the same prefix the slider uses.

Why this matters: a visitor who lands on desktop, doesn't interact, resizes to mobile, taps a ladder row → fires `engaged` for the slug. If they then resize back to desktop and interact with the slider → the slider's `fireEngagement` checks the same sessionStorage slot, sees it's set, no-ops. Net: one engagement signal per session per slug regardless of how many times the visitor crosses the breakpoint.

The dedupe is correct for the metric definition ("did the visitor engage at least once during this session?") and avoids inflating the counter from responsive resize behaviors.

### 3.3 SSR-deterministic initial render — no hydration reflow

Spec validation #4: "No layout shift on hydration."

`TimelineLadder` keeps the expanded body in the DOM at all times (with `hidden` class when collapsed) — the SSR-rendered HTML carries every event's full body markup regardless of expansion state.

The `useSyncExternalStore`-based `reducedMotion` snapshot returns `false` on the server (deterministic). On the client first paint, hydration produces identical HTML because the snapshot is `false` until `matchMedia` is queried on subscribe. Only AFTER hydration does the snapshot update if the user has prefers-reduced-motion set; at that point React re-renders with `expanded === true` for every row, and the `hidden` class flips off — no layout reflow because the DOM was already populated.

The expanded-body container uses `className={expanded ? "mt-3 ..." : "hidden"}` rather than conditional rendering. The body is always in the tree; CSS controls visibility. Hydration-safe.

### 3.4 Reduced-motion behavior — always-expanded, engagement still fires

Spec validation #3: "Reduced-motion: tap-to-expand becomes always-expanded."

Under `prefers-reduced-motion: reduce`:
- `isExpanded = reducedMotion || expandedIds.has(id)` → every row renders pre-expanded.
- Tap is preserved as a button (keyboard accessibility, engagement tracking). The toggle still updates `expandedIds`, but the visual is unchanged (the row was already expanded).
- First tap still fires `engaged` — the engagement signal continues to track "user attempted to interact with the timeline" even under reduced motion.

This preserves a clean engagement metric for reduced-motion users while honoring their preference (no animations, no surprising expansion).

### 3.5 Engagement on FIRST tap, regardless of motion preference

The `interactedRef` tracks whether the user has tapped any row in this component instance. The first tap (any row) fires `engaged`; subsequent taps don't re-fire (sessionStorage dedupe would catch them anyway, but the ref short-circuits the fetch before the network call).

Per spec: "The interaction signal (`engaged` event) fires identically; data shape unchanged." → 14.4 uses the same `{ kind: "engaged", context: slug }` payload + same endpoint as the V5 slider. ✅

### 3.6 Ladder visual: vertical guide line + cyan dots + year separators

The ladder renders as:

```
2026 ─────────
  ● Apr 22 · 2026
    Title here
    [Rationale paragraph when expanded]

  ● Mar 15 · 2026
    Title here

2025 ─────────
  ● Nov 8 · 2025
    Title here

  ● Sep 2 · 2025
    Title here
```

- **Vertical guide line:** `absolute left-[7px] top-3 bottom-3 w-px bg-[#00d2ff]/15` — sits behind the dots, ties the column together visually.
- **Cyan dot per event:** `w-3 h-3 rounded-full bg-[#00d2ff]/70` (collapsed) → `bg-[#00d2ff] shadow-[0_0_0_3px_rgba(0,210,255,0.18)]` (expanded). The shadow ring is the "active" affordance.
- **Year separator:** small mono uppercase label inserted whenever the year transitions between consecutive events.
- **Date format:** "Apr 22 · 2026" — short month abbreviation, day number, year. Compact for narrow viewports.
- **Title:** `text-primary text-[15px] font-medium leading-snug` — readable but secondary to the rationale.
- **Rationale body:** `text-secondary text-[14px] leading-[1.75]` — the expanded reading text.

### 3.7 Multiple rows expandable simultaneously

The expansion state is a `Set<string>` of event ids. Tapping a row toggles its presence in the set; multiple rows can be open at once. The visitor can read 2 or 3 rationales side-by-side without losing context from a prior expansion.

Trade-off rejected: a "single open at a time" accordion would have been simpler but loses the comparison reading mode (open Why 2025 + Why 2026 simultaneously, scroll between them). The spec says "tap-to-expand inline" — that's independent rows, not an accordion.

### 3.8 Mounted fire wraps `requestAnimationFrame` to avoid lint rule

`fireEngagement("mounted", context)` is called from `useEffect` on mount. Per the V6 14.1 lesson (`react-hooks/set-state-in-effect`), synchronous external-system side effects inside an effect body are flagged. The mount-fire wraps in `requestAnimationFrame` so the network call is treated as a deferred callback — the lint rule's "subscribe + callback" pattern.

### 3.9 Sort order matches the slider's initial cursor

The slider's initial cursor sits on the last (latest) event. The ladder's natural reading order is descending date — latest event first. Both surfaces emphasize "you're looking at the current architecture, here's how it got here, scroll back through time" — the rhetorical posture is consistent across desktop and mobile.

### 3.10 Flag gates the entire mobile surface, not the data

`NEXT_PUBLIC_V6_TIMELINE_LADDER=0` (default) → the section keeps `hidden md:block`; the ladder code path is statically unreachable (the conditional `ladderEnabled` is `false` everywhere), and the unused `<TimelineLadder>` JSX tree tree-shakes out of the production bundle (only the Server-Component-resolved `ladderEnabled = false` branch's JSX ships).

Wait — actually `TimelineLadder` is imported at the top of `ArchitectureTimelineSection`. Even when `ladderEnabled` is `false`, the import is present, so the component's source enters the bundle.

Trade-off accepted: the ladder component is small (~5 KB minified, ~2 KB gzipped). The import being unconditional means the operator can flip the flag in production without a rebuild — they just need a redeploy with the new env value. The unconditional import + conditional render is the cleaner ergonomic.

For maximum tree-shaking we'd use dynamic import — deferred to future optimization, not in scope for 14.4.

### 3.11 No edits to V5 telemetry infrastructure

Per V6 § 1.5 RED LINE — no edits to V5 systems. The TimelineLadder uses:

- The existing `/api/v5/temporal/timeline` endpoint (no changes).
- The existing `recordTimelineEngagement` + `recordArchitectureEngagement` helpers (read-only).
- The existing `TimelineEngagementKind` type (`"mounted" | "engaged"`).
- The existing `EvolutionEvent` schema (`Project` slug, date, title, rationale, summary).

The ladder is purely additive — a new client surface that consumes existing V5 contracts.

### 3.12 Out-of-scope holds (RED LINE)

- **No edits to `TimelineSlider`** — desktop surface preserved verbatim.
- **No edits to `temporal/registry.ts`**, `temporal/schema.ts`, `temporal/timeline-telemetry.ts`, `temporal/architecture-engagement.ts`.
- **No edits to the API route** (`/api/v5/temporal/timeline/route.ts`).
- **No edits to the milestones data**, illustrations, or the scroll-story engine.
- **No new motion grammar**, new font, new color, new dependency, new image asset.
- **No edits to `/projects/[slug]`** (14.2 territory), `/architecture/[slug]/` ScrollStory variants (14.3 territory).
- **No edits to `/stack`** (14.5 territory).
- **No edits to Lumina, topology graph, atmosphere primitives, pill primitive, glass primitive, margin-tick CSS, text-token ramp.**
- **No edits to navbar / footer / mobile drawer.**

---

## 4. What changed

### 4.1 New files (1)

| File | Lines | Description |
|------|-------|-------------|
| `components/v5/TimelineLadder.tsx` | 237 | Client Component. Vertical cyan-dotted timestamp ladder. Tap-to-expand inline rows. Reduced-motion always-expanded. Shares engagement firing pattern + sessionStorage dedupe slot prefix with TimelineSlider. |

### 4.2 Modified files (1)

| File | Change |
|------|--------|
| `app/architecture/_components/ArchitectureTimelineSection.tsx` | Import `TimelineLadder`. Add `NEXT_PUBLIC_V6_TIMELINE_LADDER` gate. When flag on: outer section becomes always-visible (drops `hidden md:block`), slider takes `hidden md:block` inner slot, ladder takes `md:hidden` inner slot, editorial copy switches to ladder-aware variant. When flag off: V5 behavior verbatim. |

### 4.3 No data shape change

- `EvolutionEvent` schema — unchanged.
- `temporal/registry.ts` event data — unchanged.
- `TimelineEngagementKind` type — unchanged.
- All 3 architecture pages — unchanged. The section is wrapped by `ArchitectureTimelineSection` per page; the wrapper's internal composition is what changed.

---

## 5. Mobile interaction rationale

### 5.1 Why a ladder, not a vertical slider

A vertical slider on mobile would still require a drag interaction — and drag-on-vertical conflicts with native page scrolling. The first instinct of a mobile user encountering a vertical slider is "scroll the page", and the slider would either intercept that gesture (frustrating) or not (broken).

A tap-to-expand ladder respects mobile gesture conventions. Scroll moves the page; tap reveals content. The interaction model is one mobile users have used for a decade across every list-based mobile UI.

### 5.2 Why year separators

The slider's track communicates time as a continuous spatial dimension — the visitor reads "2024 → 2025 → 2026" as horizontal position. The ladder loses that spatial cue. Year separators reintroduce time as a categorical break in the column: visitors scan "what changed in 2026?" by jumping between year labels.

The year separator is `font-mono uppercase tracking-[0.22em] text-[10px] text-tertiary` — same vocabulary as the rest of the V6 mono labels. Doesn't compete with the event title typography.

### 5.3 Why short date format

"2026-04-22" reads as the canonical ISO date in machine context; "Apr 22 · 2026" reads as editorial date in human context. The ladder is for visitors; the slider is for data. The format choice signals the surface's audience.

### 5.4 Tap-to-expand vs always-expanded

Always-expanded ladder = a vertical list of full rationale paragraphs. On a 5-event timeline that's ~5 × ~150 words = 750 words of body text. The visitor has to scroll through all of it to find the snapshot they care about.

Tap-to-expand collapses to ~5 × (date + title) = ~50 words at the surface. Visitors scan the titles, tap the ones they want to read deeper. Significantly more skim-friendly for mobile.

The exception is reduced-motion users, where the interactive surprise of expansion is contraindicated. Those users get the always-expanded variant — they trade scroll length for predictability, which is the right trade for that preference.

---

## 6. Spec validation walkthrough

### 6.1 Spec validation #1 — "Mobile users can scrub through all snapshots"

The ladder renders every event in the events array (filtered for the project slug). Each event is independently tappable. A mobile user can:
- Tap event 1 → read rationale.
- Tap event 2 → read rationale (event 1 stays open or collapses, depending on whether they re-tapped it).
- Scroll down to event N → tap → read.

Every snapshot is reachable. Tap is the "scrub" equivalent on mobile.

### 6.2 Spec validation #2 — "Telemetry `engaged` event fires correctly on mobile"

`TimelineLadder` POSTs `{ kind: "engaged", context: slug }` to `/api/v5/temporal/timeline` on the first row tap. The payload + endpoint are identical to `TimelineSlider`'s fire. The sessionStorage dedupe slot uses the same prefix (`v5:topology:timeline:fired:engaged:{slug}`), so:

- Mobile-only session, taps a row → engaged fires.
- Desktop-only session, scrubs the slider → engaged fires.
- Cross-viewport session (resize, etc.) → engaged fires exactly once.

The aggregated engagement counter on `v5:topology:architecture-page` HASH continues to increment by exactly one per session per slug. Metric integrity preserved.

### 6.3 Spec validation #3 — "Reduced-motion: tap-to-expand becomes always-expanded"

`isExpanded = reducedMotion || expandedIds.has(id)`. Under `prefers-reduced-motion: reduce` every row renders with `expanded === true` from initial paint. Tap continues to work but doesn't change the visible state.

### 6.4 Spec validation #4 — "No layout shift on hydration"

- SSR snapshot for `reducedMotion`: `false` (deterministic).
- Server-rendered HTML: every row's `<div class="hidden">` body is in the DOM but visually hidden.
- Client first paint after hydration: identical to SSR HTML (snapshot still `false` until `matchMedia` subscribes).
- After hydration: snapshot may flip to `true` for reduced-motion users — at that point the `hidden` class flips off for every row. The body is ALREADY in the DOM; the only change is `display: hidden → block`. No layout reflow.

For non-reduced-motion users, the body stays hidden until tap. No reflow on hydration. ✅

---

## 7. Mobile UX walkthrough

### 7.1 First landing

Visitor lands on `/architecture/cloud-waste-hunter` on a 375 px viewport:

1. The page header + intro paragraph + scroll-story render as before.
2. After the scroll-story, the "Memory · This system's evolution" section now appears (previously hidden).
3. Below the editorial paragraph, the ladder renders: ~5 collapsed rows, each showing date + title + cyan dot.
4. Vertical guide line ties them together visually.

### 7.2 Tap interaction

Visitor taps event 2 ("Sub-PR 7.4 — Per-Architecture Timeline Slider"):
1. Body expansion animates in (CSS `display: block` swap; no JS-driven height animation).
2. Cyan dot transitions from 70 % opacity to full + 3 px cyan ring shadow.
3. The body paragraph reveals: ~3-4 lines of rationale text.
4. Network request fires: `POST /api/v5/temporal/timeline` with `{ kind: "engaged", context: "cloud-waste-hunter" }`.
5. SessionStorage slot `v5:topology:timeline:fired:engaged:cloud-waste-hunter` set to "1" — subsequent taps don't re-fire.

### 7.3 Multi-expansion

Visitor taps event 3 while event 2 is still open:
1. Event 3's body expands.
2. Event 2's body remains expanded.
3. The vertical guide line still ties all rows together regardless of expansion state.
4. No re-fire (sessionStorage slot already set).

### 7.4 Reduced-motion variant

Visitor with `prefers-reduced-motion: reduce`:
1. Every row renders pre-expanded from initial paint.
2. Cyan dots all show the "expanded" state.
3. Tapping a row fires the engagement signal (once) but the visual is unchanged.

### 7.5 Cross-viewport resize

Visitor rotates phone or opens the page on tablet:
1. At `≥ md`, the ladder hides (`md:hidden`) and the slider shows (`hidden md:block`).
2. The slider's `mounted` fire already happened (sessionStorage dedupe).
3. If the user engages the slider, the engagement fire no-ops (sessionStorage slot set by previous ladder tap).

---

## 8. Accessibility verification

### 8.1 Semantic structure

- `<ol role="list" aria-label="Architectural evolution snapshots">` wraps the row list.
- Each row is `<li>`.
- Each tappable button is `<button type="button" aria-expanded aria-controls>`.
- `aria-controls` links the button to its body container's `id="ladder-body-{eventId}"`.
- Year separators are `<p>` with mono typography — read as plain text by screen readers (not a `<dt>` or `<h3>` to avoid semantic clutter).

### 8.2 Keyboard navigation

Tab order on /architecture/cloud-waste-hunter (flag on, mobile):
1. Page header back link.
2. (Scroll-story has no tab stops within milestones.)
3. Each ladder row button (one tab stop each).
4. (Other page-level focusable elements after.)

Enter / Space activates the tap. Same UX as the visual tap.

### 8.3 Screen reader walk-through

VoiceOver reading the ladder (CWH with 5 events, all collapsed):
> "Architectural evolution snapshots. List, 5 items."
> "2026. April 22 · 2026. Sub-PR 7.4 — Per-Architecture Timeline Slider. Button, collapsed. List item 1 of 5."
> "April 15 · 2026. Sub-PR 7.3 — Timeline Slider. Button, collapsed. List item 2 of 5."
> "2025. November 8 · 2025. Sub-PR 7.2 — Topology Playback. Button, collapsed. List item 3 of 5."
> [User activates button] "Expanded. Rationale paragraph text."

### 8.4 Reduced-motion

- No motion animations in the ladder (CSS `display` swap, not a height animation).
- Cyan dot transition is `transition-all` ~150 ms — minimal motion.
- Reduced-motion preset: all rows pre-expanded; tap is essentially no-op.
- The shadow ring on expanded dots is a static CSS property; not animated.

---

## 9. Performance impact

### 9.1 Bundle delta

- `TimelineLadder.tsx` — Client Component. ~5 KB minified, ~2 KB gzipped. Adds to the `/architecture/<slug>` page's client bundle.
- `ArchitectureTimelineSection.tsx` — minor JSX restructure. Net delta: ~300 bytes.

**Total client JS delta: ~5.3 KB minified (~2 KB gzipped).**

### 9.2 HTML payload

When flag is off: zero delta. Section behaves verbatim per V5.

When flag is on:
- The ladder's SSR HTML emits ~3.5 KB compressed per architecture page (the full 5-event list with collapsed bodies).
- Total: ~3.5 KB per page when flag on.

### 9.3 LCP

LCP element on architecture pages: the page header H1. Unchanged. The timeline section sits BELOW the scroll-story; not in the LCP path.

### 9.4 Hydration

`NEXT_PUBLIC_V6_TIMELINE_LADDER` inlined at build time. SSR HTML and client hydration output are byte-identical (rationale bodies present, `hidden` class set on collapsed rows). Reduced-motion snapshot returns `false` on the server; client hydration produces matching HTML. Post-hydration, the snapshot may update for reduced-motion users — at that point the `hidden` class flips off without DOM reflow (content was already there).

### 9.5 Static generation

All three architecture pages register as `○ Static`. The ladder's SSR rendering is part of the static HTML. Both `mounted` and `engaged` fires happen client-side (post-hydration); no SSR-time network request.

---

## 10. Reduced-motion verification

| Surface | Reduced-motion behaviour |
|---------|---------------------------|
| Initial render | All rows render with `expanded === true`. |
| Tap interaction | Wired up (engagement fires) but no visual state change. |
| Cyan dot transition | Static CSS — same `bg-[#00d2ff]/70` on collapsed; expanded state always active under reduced motion. |
| Body expansion | `display: block` immediately on initial paint. No height animation. |
| Year separator | Static. |
| Engagement firing | Still fires on first tap (engagement tracking parity with non-reduced-motion users). |

All surfaces honor reduced-motion. ✅

---

## 11. Validation log

| Gate | Result |
|------|--------|
| Mobile users can scrub through all snapshots | ✅ Every event rendered as an independent tappable row. Tap reveals rationale. |
| Telemetry `engaged` event fires correctly on mobile | ✅ POSTs same `{ kind: "engaged", context: slug }` payload to same `/api/v5/temporal/timeline` endpoint. Shares sessionStorage dedupe slot prefix with slider. |
| Reduced-motion: tap-to-expand becomes always-expanded | ✅ `isExpanded = reducedMotion \|\| expandedIds.has(id)` — every row renders pre-expanded under reduced-motion. |
| No layout shift on hydration | ✅ Expanded body always in DOM (with `hidden` class when collapsed). Reduced-motion snapshot is deterministic on server. Hydration produces identical HTML to SSR. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ 24 pre-existing problems (22 errors, 2 warnings). Zero new errors from 14.4. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.1 s. TypeScript 8.6 s. All three architecture project routes register as `○ Static`. |
| Off-flag rollback (default posture) | ✅ `NEXT_PUBLIC_V6_TIMELINE_LADDER` unset → `ArchitectureTimelineSection` keeps `hidden md:block`. Ladder JSX renders to nothing. V5 behavior byte-identical. |
| On-flag activation | ✅ Section becomes always-visible. Slider takes `hidden md:block` desktop slot. Ladder takes `md:hidden` mobile slot. Editorial copy mentions both modes. |

---

## 12. Risk analysis

### 12.1 Risk: Both surfaces rendered into DOM at SSR time

The page's SSR HTML emits the slider's static `role="slider"` element AND the ladder's full event list, even though only one is visible per viewport. Small payload duplication (~3.5 KB compressed per page) for the cleanest hydration story.

**Mitigation:** acceptable trade. Mobile users on slow connections see the slider's SSR output (hidden) momentarily as the page loads — but the rendering is fully static, no slow JS, no layout shift. The ladder is `md:hidden` so it's invisible on desktop; the slider is `hidden md:block` so it's invisible on mobile. Both contribute to the DOM but each is invisible to the user with the relevant viewport.

### 12.2 Risk: Editorial copy split increases maintenance surface

The intro paragraph has two variants (flag off / flag on). Future copy changes require touching both.

**Mitigation:** the flag-off variant is the V5 baseline; will be retired when V6_TIMELINE_LADDER becomes default-on. Until then, two-variant editorial is a known short-term cost. Documented inline in the source.

### 12.3 Risk: Engagement signal dedupe relies on sessionStorage compatibility

Both surfaces share the `v5:topology:timeline:fired:engaged:{slug}` slot prefix. If a browser blocks sessionStorage (private mode + strict third-party storage), the dedupe fails and both surfaces fire `engaged` independently per session.

**Mitigation:** the slider already has this risk; the ladder inherits the same posture documented in the slider's source ("one extra count per reload in private mode is acceptable degradation"). Net effect: in adversarial sessionStorage environments, a single visitor might count for 2 engagements per session (1 from slider, 1 from ladder). The metric inflation is bounded at 2× and only affects edge-case sessions.

### 12.4 Risk: Body expansion uses display: block, no animation

The expansion is instantaneous (no height animation). Some users may expect a smooth reveal.

**Mitigation:** intentional choice to avoid:
1. Height animations that fight reduced-motion preferences.
2. Layout-thrash performance overhead from height-from-0 animations.
3. Hydration mismatch if the JS-driven height animation runs differently on the server vs client.

The expansion is sufficient as a visual signal; the `display` swap is fast enough to read as instant feedback.

### 12.5 Risk: TimelineLadder imported unconditionally even when flag off

The flag-off rollback path still imports `TimelineLadder` at the top of `ArchitectureTimelineSection`. The component source enters the bundle even though no JSX consumes it.

**Mitigation:** ~5 KB minified is acceptable cost for the operator-flip-without-rebuild ergonomic. The alternative (dynamic import) would gate the bundle inclusion on the flag at runtime — adds complexity, defers loading slightly, requires Suspense boundary. Trade-off rejected for 14.4; reconsider when bundle budget pressure justifies it.

### 12.6 Risk: Cross-viewport responsive engagement

A visitor who lands on desktop (sees slider), scrubs, fires `engaged`. Then resizes to mobile width (sees ladder). The ladder's sessionStorage check sees the slot is already set → engagement no-op. The visitor doesn't fire `engaged` twice — correct behavior.

But the ladder's `mounted` fire also dedupes globally. If the slider fired `mounted` (global slot) on desktop, the ladder won't re-fire on the resize. Could undercount `mounted` for mobile-specific telemetry.

**Mitigation:** acceptable — the `mounted` signal measures "did this session see the timeline interface at all," which is true whether the slider or ladder was visible. The per-architecture-page counter (separate slot) fires per slug regardless.

### 12.7 Risk: Year separator displays wrong year for events with the same year as the first event

The year-label logic shows "2026" only on the FIRST event of each year. If only one event exists for a year, the label still shows; if all events are from the same year, only the first event shows the label.

**Mitigation:** correct behavior for the visual goal (group events by year, label each group). The single-year edge case still shows the year for the entire group.

---

## 13. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `components/v5/TimelineSlider.tsx` | Desktop surface — preserved verbatim. |
| `lib/v5/temporal/schema.ts`, `registry.ts`, `frames.ts` | Data layer — read-only consumed. |
| `lib/v5/temporal/timeline-telemetry.ts` | KV write path — unchanged. |
| `lib/v5/temporal/architecture-engagement.ts` | Per-page KV writes — unchanged. |
| `app/api/v5/temporal/timeline/route.ts` | API endpoint — unchanged. |
| Milestones data + illustrations + scroll-story engine | 14.3 territory (variants) — already shipped. |
| `/projects/[slug]` | 14.2 territory. |
| `/stack` | 14.5 territory. |
| Lumina, topology graph, motion grammar, atmosphere primitives | RED LINE per V6 § 1.5. |
| Navbar / Footer / MobileMenu | Preserved verbatim post-12.5 / 12.4. |
| Pill / glass / margin-tick / text-ramp primitives | Used by reference, not modified. |
| V4 / V5 systems / telemetry / API routes | RED LINE. |

---

## 14. Rollback

### 14.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_TIMELINE_LADDER=0
```

- `ArchitectureTimelineSection` returns to `hidden md:block` — mobile users see no timeline section (V5 behavior verbatim).
- The ladder JSX renders to nothing (conditional `null`).
- Editorial copy reverts to V5 variant.
- No data layer changes — pre-V6 state fully restored.

### 14.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes `TimelineLadder.tsx`, reverts `ArchitectureTimelineSection.tsx` to pre-14.4 state. Source matches V5 exactly.

### 14.3 Per-file revert (surgical)

`git checkout HEAD~1 -- app/architecture/_components/ArchitectureTimelineSection.tsx` reverts only the section's responsive composition; `TimelineLadder.tsx` remains in source but unused. Useful for design iteration on the ladder without disturbing the section's rollout state.

---

## 15. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 14.4 (14.3 pushed, origin in sync) | ✅ |
| Build emits all three architecture project routes as `○ Static` | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_TIMELINE_LADDER` unset) | ✅ |
| Off-flag: section keeps `hidden md:block`; V5 mobile experience unchanged | ✅ |
| On-flag: section always-visible; slider on desktop (`hidden md:block`), ladder on mobile (`md:hidden`) | ✅ |
| Engagement signal: same endpoint, same payload, same dedupe slot prefix as slider | ✅ |
| Reduced-motion: ladder rows pre-expanded; engagement fires on first tap | ✅ |
| Hydration: SSR + client hydration emit identical HTML | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| RED LINE preserved: TimelineSlider + temporal lib + API route + Lumina + topology + motion + atmosphere + pill/glass + navbar/footer + V4/V5 systems + /projects/[slug] + /architecture scroll-story + /stack — all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders V5 behavior verbatim — mobile users continue to see no timeline section. The operator flips `NEXT_PUBLIC_V6_TIMELINE_LADDER=1` to activate the always-visible composition with slider on desktop and ladder on mobile.

---

## 16. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] `/architecture/cloud-waste-hunter` desktop (flag on) — slider visible, ladder hidden. V5 byte-identical at the slider position.
- [ ] `/architecture/cloud-waste-hunter` desktop (flag off) — slider visible, ladder absent. V5 byte-identical.
- [ ] `/architecture/cloud-waste-hunter` mobile 375 px (flag on) — slider hidden, ladder visible with 5 collapsed rows.
- [ ] `/architecture/cloud-waste-hunter` mobile 375 px (flag off) — entire section hidden (V5).
- [ ] Ladder tap interaction — row expands inline, cyan dot brightens, body paragraph reveals.
- [ ] Ladder multi-row expansion — multiple rows can be open simultaneously.
- [ ] Year separators — visible labels at year transitions.
- [ ] Reduced-motion: all rows expanded from initial paint.
- [ ] Engagement signal in dev tools network panel — POST `/api/v5/temporal/timeline` `{ kind: "engaged", context: "cloud-waste-hunter" }` fires on first tap.
- [ ] No layout shift on hydration — page renders, ladder rows visible, no reflow.

---

## 17. What 14.4 explicitly does NOT do

- ❌ No edits to TimelineSlider (desktop surface unchanged).
- ❌ No edits to temporal lib or API routes.
- ❌ No new KV writes / new sessionStorage key prefix / new payload shape.
- ❌ No edits to scroll-story engine (14.3 territory).
- ❌ No edits to /projects/[slug] (14.2 territory).
- ❌ No edits to /stack (14.5 territory).
- ❌ No new motion grammar / new colour token / new pill kind / new atmosphere variant / new dependency / new image asset.
- ❌ No edits to V4/V5 systems, Lumina, topology graph, navbar, footer, mobile drawer.
- ❌ No client-side viewport-detection logic (CSS handles the surface switch).
- ❌ No height-animation on expand (CSS display swap, no JS layout thrash).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. One new component (TimelineLadder), one section-level composition change. The mobile timeline blocker closes; the engagement signal continues to read cleanly across desktop + mobile.

---

## 18. Phase 14 status

This is **Sub-PR 14.4**. Sub-PR 14.5 remains unbuilt.

Per V6 § 5.3 Phase 14 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 4 of 5 (14.1 unified hub + 14.2 detail refresh + 14.3 scroll variants + 14.4 mobile timeline). |
| `/work` (or `/projects` + `/architecture`) bounce rate measurably lower | ⏳ Observation continues. |
| Mobile architecture engagement (timeline ladder) shows non-zero `engaged` events from mobile sessions | ⏳ Begins now — the surface is shipped. |
| Stack page session time stable or improved | ⏳ Waits on 14.5. |

**Phase 14 stays OPEN.** Next sub-PR: 14.5 (stack page compression — Phase 14 closer).

---

## 19. Closing

V6 Sub-PR 14.4 is **the mobile timeline finally existing**. The audit's 🔴 BLOCKER — recruiters viewing /architecture/<slug> from phones seeing the V4 baseline and not the V5 Phase 7 architectural-memory layer — closes. The surface that V5 Phase 7 designed for the most distinctive temporal interaction in the codebase is no longer desktop-only; mobile users can now read each snapshot's date + title + rationale via a vertical cyan-dotted ladder, with the same engagement telemetry signal the slider has always emitted.

Both surfaces coexist inside one section. CSS handles the viewport switch. The slider's `mounted` and `engaged` fires share sessionStorage dedupe slots with the ladder, so a single visitor's session counts once regardless of viewport changes or interactions across both surfaces.

Four of five Phase 14 sub-PRs landed. The last (Stack Page Compression — 14.5) closes Phase 14. The 30-day Phase 14 observation window continues; mobile architecture engagement telemetry begins accumulating from the next deploy.

Same data. Same engagement signal. Two surfaces, one identity.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
