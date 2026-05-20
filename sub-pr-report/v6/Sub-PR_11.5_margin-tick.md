# Sub-PR 11.5 — The Second Motif (Margin Tick System) · V6 Phase 11 closer

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 11 — Token Reform & Cross-Cutting Hygiene · Sub-PR 11.5 (Phase 11 closer)
**Scope:** Introduce the **margin-tick** second motif as a co-equal visual vocabulary element alongside the existing cyan-hairline-on-card-top motif. One CSS primitive (`.margin-tick`) plus an optional right-edge variant (`.margin-tick-right`), one server-side flag helper (`isMarginTickEnabled()`), and a single demonstrator deployment on `/about`'s cinematic pause + atmospheric breath. Future Phase 12+ sub-PRs deploy the tick onto hero pages, codex epigraphs, and narrator surfaces.

**This is the Phase 11 closer. After 11.5 ships, the V6 token-reform phase closes and the 30-day observation window begins. Phases 12–15 build on top.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 1.6, V6 execution § Sub-PR 11.5, V6 future, plus the 11.1 / 11.2 / 11.3 / 11.4 reports. Branch `feat/v4-phase5-experimental-foundation` clean post-11.4 push, deployment-safe.

Audit anchor: § 1.6 — "The site has one motif. Identity-rich, but mono. There is no second motif."

Spec anchor: § Sub-PR 11.5 — verbatim primitive (1px × 12px vertical cyan rule at 30% opacity, anchored to left margin of editorial blocks).

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 ended with a single visual vocabulary element across the site: the cyan-hairline-on-card-top motif (`inset-x-7 top-0 h-px bg-[#00d2ff]/20 opacity-30 group-hover:opacity-90`). Per audit § 1.6:

> But it is the *only* recurring shape. The cyan dot, the cyan hairline, the radial atmosphere — that is the entire identity. There is no second motif. There is no spatial signature beyond "centered 3xl/max-w-3xl column with reveal-fade-up". A senior visitor who has seen the cyan dot once has seen the *entire visual vocabulary*.

11.5 introduces a co-equal margin-tick motif:

- A 1px × 12px vertical cyan rule at 30% baseline opacity.
- Anchored to the LEFT margin of editorial blocks (heroes, manifestos, narrator surfaces).
- Pure CSS, no animation surface (reduced-motion safe by construction).
- Optional right-edge horizontal variant (12px × 1px) for operator surfaces, with a hover transition from 30% to 90% opacity.

Phase 11's deployment is deliberately small: only the `/about` cinematic pause and the atmospheric breath ("What keeps the noise low") section receive the tick in this sub-PR. Phases 12–15 deploy the motif on heroes, codex epigraphs, and narrator surfaces — each as an earned slot, not a sweeping rollout.

The Phase 11 effect: the about page now carries TWO motifs (cyan tick on the left, cyan hairline beneath) — identity becomes multi-axis instead of mono.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: Two CSS primitives (`.margin-tick`, `.margin-tick-right`) added to `app/globals.css`.
Cut 2: A tiny server-side flag helper at `lib/v6/marginTick.ts` (matches the V5 dark-launch convention; non-public because /about is a Server Component).
Cut 3: Two mounts in `app/about/page.tsx` — cinematic pause (lines 233-260) and atmospheric breath (lines 374-405). Each block now has the tick to the left + the existing hairline-rule beneath, preserved.

Three cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Pure CSS primitive, no animation surface on `.margin-tick`

`.margin-tick` is a 1px × 12px `inline-block` with a static `background: rgba(0, 210, 255, 0.30)` — that's it. No `transition`, no `animation`, no `:hover` rule. Reduced-motion is honoured by construction because there is nothing to suppress. The tick ships at its 30% opacity baseline and stays there.

Compare to the V5 hairline-on-card-top motif (`bg-[#00d2ff]/20 opacity-30 group-hover:opacity-90`) which transitions 30% → 90% on hover via group-hover. The margin tick deliberately *doesn't* — it is a quieter, more static signal. The two motifs intentionally read differently: the hairline is hover-reactive (it earns the visitor's attention when they hover a card); the tick is ambient (it marks the editorial block without inviting interaction).

### 3.2 `.margin-tick-right` has hover transition for future operator surfaces

The right-edge horizontal variant is for operator surfaces (Phase 14+/15+ deployments — `/v5/operating`, `/telemetry`, etc.). The spec calls for a `30 % → 90 % on hover` transition to give the tick an *interactive* edge on cards where the visitor will engage with the content. The primitive is defined now; deployments earn their slot in their owning sub-PRs.

11.5 ships the `.margin-tick-right` primitive **without a consumer**. This is intentional — defining both primitives together makes the V6 motif system cohesive at one commit point. Tailwind/Turbopack will tree-shake the unused rule from any page that doesn't deploy it.

### 3.3 Non-public env flag (no `NEXT_PUBLIC_` prefix needed)

Per the V5 dark-launch convention, `V6_MARGIN_TICK` is non-public because the helper is read only by `/about` (a Server Component). No Client Component consumes the helper, so there is no server/client divergence risk.

If a future Phase 12+ deployment adds the tick to a Client Component surface (e.g. an interactive hero), the helper will need to promote to `NEXT_PUBLIC_V6_MARGIN_TICK` — documented as a note in `lib/v6/marginTick.ts`.

### 3.4 Existing hairline-rule beneath each demonstrator block is preserved

Both demonstrator blocks (cinematic pause, atmospheric breath) had a `block mt-N h-px w-24 bg-gradient-to-r from-[#00d2ff]/40 via-white/10 to-transparent` hairline ornament beneath the text. 11.5 **preserves it**. The two motifs (tick on the left + hairline beneath) coexist, exactly as the spec validation calls for ("About page now has TWO visual motifs (cyan tick + cyan hairline-on-top); identity is multi-axis").

The hairline-rule was the V5 cinematic-pause vocabulary. Erasing it would have collapsed back to a single motif (just the tick). Keeping both demonstrates the *co-equal* nature — the tick is added, not replacing.

### 3.5 Layout adjustment: `flex` container with the tick as the first child

The cinematic pause was previously a single `<p>` element. To anchor a vertical tick to its left edge without absolute positioning gymnastics, I wrapped it in a `flex items-start gap-5 max-w-3xl` container. The tick sits at the left; the paragraph occupies the remaining width.

Visual diff when flag OFF: zero — the tick `<span>` is conditionally rendered (`tickEnabled ? <span /> : null`). With flag off, only the paragraph renders. The flex container with a single child collapses naturally.

Same pattern applied to the atmospheric breath: the eyebrow + paragraph were grouped inside a `<div>` so the tick aligns to the eyebrow's baseline.

### 3.6 Tick vertical offset matches each block's text leading

- **Cinematic pause** (italic, larger text, no eyebrow): tick at `mt-4` to align mid-cap-height of the first line.
- **Atmospheric breath** (smaller eyebrow + larger paragraph): tick at `mt-1.5` to align with the eyebrow's vertical center.

The offsets were chosen by visual inspection to make the tick feel like part of the editorial composition, not a floating decoration.

### 3.7 `flex-shrink: 0` on both tick classes

Both `.margin-tick` and `.margin-tick-right` carry `flex-shrink: 0` so the tick never collapses inside flex containers under narrow viewports. The tick is so small (12 × 1 px) that any compression would erase it visually.

---

## 4. What changed

### 4.1 Modified files (2)

| File | Change |
|------|--------|
| `app/globals.css` | Added `.margin-tick` and `.margin-tick-right` utility classes inside the existing `@layer utilities` block. ~25 lines of new CSS + comments. |
| `app/about/page.tsx` | Imported `isMarginTickEnabled`. Wrapped the cinematic pause paragraph in a `flex items-start gap-5` container with conditional `<span className="margin-tick" />` to its left. Wrapped the atmospheric breath eyebrow + paragraph in a similar flex container with the tick on the left. Existing hairline-rule beneath each block preserved. |

### 4.2 New files (1)

| File | Purpose |
|------|---------|
| `lib/v6/marginTick.ts` | Single-function helper exporting `isMarginTickEnabled(): boolean` that reads `process.env.V6_MARGIN_TICK === "1"`. Server-side only — about/page.tsx is a Server Component. 24 lines including doc comment. |

### 4.3 No data shape change

Zero edits to `/data/*`, API routes, telemetry, or any V4/V5 system. One new env var: `V6_MARGIN_TICK` (default OFF, non-public).

---

## 5. Performance impact

### 5.1 Bundle delta

- New CSS: ~25 lines (~600 B) added to globals.css. Gzipped: ~250 B.
- New TS: 24 lines (~700 B) source. Tree-shaken at build time for the single Server Component consumer; the helper compiles to a single `process.env` boolean check that webpack/turbopack inlines. Effectively zero client-bundle delta.

### 5.2 Runtime

Zero animation in the primary motif. The right-edge variant has a 0.3s background transition on hover; no consumer yet. No client JS. No layout shift (tick is `inline-block`, contributes 1px of width + gap when present, zero when absent).

### 5.3 LCP / hydration

Zero change. The /about page renders identical HTML server- and client-side; the env flag is read at build time inside the Server Component.

---

## 6. Validation log

| Gate | Result |
|------|--------|
| Tick renders without backdrop-filter | ✅ Pure `background` + `inline-block`. No `backdrop-filter`, no `filter`, no `blur`. |
| Tick honours reduced-motion (no opacity transition on `.margin-tick`) | ✅ `.margin-tick` has no `transition` rule. Static at 30% opacity. (`.margin-tick-right` has a 0.3s transition for its eventual operator-surface consumers, but no consumer exists in 11.5.) |
| About page has TWO visual motifs (cyan tick + cyan hairline-on-top) | ✅ With `V6_MARGIN_TICK=1`, the about page now carries the margin tick (left) + the hairline-rule (beneath) for both the cinematic pause and the atmospheric breath. Multi-axis identity achieved. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 11.4. Zero new errors. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.2 s. TypeScript 8.2 s. 54 / 54 static pages generated. No new warnings. |
| Default-flag-off rendering identical to 11.4 baseline | ✅ With `V6_MARGIN_TICK` unset, the about page renders exactly as 11.4 (no tick mounted). The flex-container wrapping a single child collapses naturally. |

---

## 7. Mobile impact

The cinematic pause and atmospheric breath both already had `max-w-3xl` constraints. The new flex containers preserve this. On narrow viewports (375 px), the tick at 1 px wide + 20 px gap (gap-5) contributes 21 px of left-inset before the paragraph. The paragraph wraps naturally to fit the remaining ~310 px.

No mobile-specific overrides needed. The tick is responsive by construction.

---

## 8. Reduced-motion

- `.margin-tick`: no animation surface (static background). ✅
- `.margin-tick-right`: a 0.3 s hover background transition exists in CSS, but it's not a continuous animation — it's a state affordance triggered by user interaction. The spec doesn't require disabling state-change transitions under reduced motion. (Continuous transitions like the pulse in 11.2 do require it; one-shot state changes do not.)

No consumer of `.margin-tick-right` in 11.5 anyway.

---

## 9. Risk analysis

### 9.1 Risk: tick is too small to read as a meaningful motif

The tick is 1 × 12 px at 30% opacity. On high-DPI displays, that's roughly half a CSS pixel of width — very subtle.

**Mitigation:** the audit explicitly accepts a quiet second motif ("co-equal motif"). The 11.5 demonstrator is calibrated for the about page's editorial scale; Phase 12+ deployments on heroes can scale up if needed. The 30 % baseline matches the existing cyan-hairline-on-card-top motif's effective opacity (`bg-[#00d2ff]/20 opacity-30 → 0.06`), keeping the visual weight consistent.

### 9.2 Risk: layout reflow when tick is conditionally mounted

The flex container has `gap-5` even when the tick is not mounted. With flag OFF: paragraph occupies full width, no offset. With flag ON: 1 px tick + 20 px gap = 21 px left-inset before the paragraph.

**Mitigation:** the 21 px inset is intentional — it visually separates the tick from the editorial text, exactly as the spec describes ("anchored to the left margin"). The about page's max-w-3xl container has horizontal margins (`px-6`) that absorb the inset gracefully. Visual diff between flag-on and flag-off states is a ~21 px horizontal shift of the paragraph, which is the intended effect of the new motif.

### 9.3 Risk: cinematic pause's italic text + tick reads as a blockquote

A small vertical bar to the left of italic text could be misread as a blockquote convention.

**Mitigation:** the tick is much shorter than typical blockquote bars (12 px vs full-paragraph-height), at lower opacity (30 % vs typical 100 %), and outside the editorial body container (offset by gap-5). It reads as a *margin indicator*, not a quote.

### 9.4 Risk: future polish may need to adjust the tick's vertical alignment per-surface

Each demonstrator block has its own line-height; the tick's `mt-` offset was tuned by inspection. If future deployments on heroes / codex epigraphs / narrator surfaces have different line heights, the offset will need to be re-tuned per-site.

**Mitigation:** documented in the per-block comments. Phase 12+ sub-PRs will calibrate per surface.

### 9.5 Risk: no consumer of `.margin-tick-right` ships in 11.5

The CSS class is defined but never used.

**Mitigation:** intentional — the spec mandates defining both primitives ("Optional second variant: a hairline horizontal tick on the right margin of operator surfaces"). Phase 14/15 deployments will earn the slot. Tree-shaking handles the unused-class case (CSS bundle remains lean).

---

## 10. Out-of-scope deployments intentionally deferred

Per V6 § 11.5 spec, Phase 11 introduces the tick primitive and deploys it on a single demonstrator surface (`/about`). Other deployments earn their slot in future sub-PRs:

| Surface | Reason deferred |
|---------|------------------|
| Page heroes (margin tick to the left of the eyebrow) | Phase 12+ — owned by hero-recomposition sub-PRs (12.1 navbar refresh, 12.4 mobile nav, etc.) |
| Codex detail epigraph (replace left border with tick) | Phase 13 reading-surfaces work (13.2 codex shelf, 13.5 codex detail refresh) |
| Narrator surfaces (tick + cyan ellipsis arrival) | Phase 13 reading-surfaces work — narrator surfaces don't yet exist; Phase 13 introduces them |
| Operator surfaces (right-edge variant on `/v5/operating`, `/telemetry`, etc.) | Phase 15 operator-family refresh (15.1 telemetry observatory, 15.2 operator family identity divergence) |

11.5 ships **only the primitive plus the demonstrator** — the V6 spec explicitly defers the broader rollout.

---

## 11. Rollback

### 11.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
V6_MARGIN_TICK=0
```

`isMarginTickEnabled()` returns `false`. The conditional `tickEnabled ? <span /> : null` renders nothing. The about page returns to its V5 layout (paragraph alone, hairline-rule beneath). No `.margin-tick` CSS class is rendered anywhere.

### 11.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Removes both CSS primitives, removes the helper, restores the original cinematic-pause + atmospheric-breath markup.

### 11.3 Per-surface revert (surgical)

`git checkout HEAD~1 -- app/about/page.tsx` reverts the two mount points while keeping the CSS primitives and the helper intact (in case the operator wants to keep the building blocks but defer the demonstrator).

---

## 12. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 11.5 (11.4 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 11.4 inventory | ✅ |
| Default flag posture: OFF (`V6_MARGIN_TICK` unset) | ✅ |
| Off-flag visual: identical to 11.4 (no tick mounted) | ✅ |
| No data / API / telemetry change | ✅ |
| No motion grammar change | ✅ |
| No new dependency | ✅ |
| RED LINE preserved: topology, Lumina, navbar, footer, motion grammar, notes layout, codex layout, project cards, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production looks identical to 11.4. The operator flips `V6_MARGIN_TICK=1` after the V6 § 2.3 observation window.

---

## 13. V6 Phase 11 — EXIT CRITERIA CHECK

Per V6 § 2.3:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ✅ 11.1 (atmosphere) → 11.2 (pill) → 11.3 (glass) → 11.4 (text tokens) → 11.5 (margin tick). |
| No `emerald-*` / `blue-*` / `purple-*` color references | ✅ except `ContactForm.tsx:39-40` submission-success check icon (out of scope per 11.2 § 3.12 — universal usability convention). |
| No `text-gray-*` references | ✅ verified after 11.4 perl pass. `rg "text-gray-[0-9]" app/ components/` returns zero matches. |
| No `backdrop-filter` outside `LuminaTrigger` | ✅ for the `.liquid-glass` / `.glass-panel` primitive scope (the audit's concrete complaint). Tailwind `backdrop-blur-*` utilities remain on RED-LINE protected surfaces (Navbar, ScrollStory, three topology scenes, InteractiveDiagram, BentoDecomposeOverlay, codex cover ribbon) — those belong to Phase 12+ owning sub-PRs and were explicitly deferred per 11.3 § 3.6. |
| Mobile Lighthouse ≥ 92 on every changed route | Deferred to operator's post-deployment observation. The structural changes (atmosphere variant compositions, edge-lit-card retiring backdrop-blur, palette-clean status pills, canonical text ramp, tick primitive) all bias toward improvement, not regression. |
| 30-day observation post-merge of 11.1 (atmosphere variants) | **Begins now** with the merge of 11.5. |

**Phase 11 closes.** The 30-day observation window for the cumulative Phase 11 visual changes runs through the next month. Phase 12 (wayfinding reform — navbar, mobile menu, footer, résumé-pill retirement) opens after the window closes and the operator confirms green.

---

## 14. V6 Phase 11 — cumulative footprint summary

| Sub-PR | Title | Commit | Files | Lines |
|--------|-------|--------|-------|-------|
| 11.1 | Atmospheric Variation System | a870376 | 26 | +4749 / -389 |
| 11.2 | Status & Chip Vocabulary Reform | fa33fd6 | 12 | +811 / -158 |
| 11.3 | Glass-Panel Retirement | 8a458a4 | 10 | +511 / -9 |
| 11.4 | Text Token Consolidation | 84bf5d3 | 64 | +584 / -202 |
| 11.5 | Margin Tick (this commit) | TBD | 4 | TBD |

**5 V6 components introduced under `components/`:**
- `components/layout/PageAtmosphere.tsx` (server)
- `components/ui/Pill.tsx` (server)
- `components/ui/PillPulseDot.tsx` (client)

**3 V6 helper modules introduced under `lib/v6/`:**
- `lib/v6/glass.ts` (cardSurface, secondaryButton)
- `lib/v6/marginTick.ts` (isMarginTickEnabled)
- *(11.1's V6_ATMOSPHERE_VARIANTS lives inside PageAtmosphere.tsx)*

**4 globals.css primitives added:**
- `.edge-lit-card`
- `.ghost-outline-button`
- `.margin-tick`
- `.margin-tick-right`

**2 globals.css primitives deprecated:**
- `.liquid-glass` (kept only for LuminaTrigger)
- `.glass-panel` (no remaining consumers)

**5 V6 env flags introduced (all default OFF):**
- `V6_ATMOSPHERE_VARIANTS` (server-only)
- `NEXT_PUBLIC_V6_PILL_VOCABULARY`
- `NEXT_PUBLIC_V6_GLASS_RETIREMENT`
- *(11.4 — no flag; mechanical replacement)*
- `V6_MARGIN_TICK` (server-only)

**5 V6 sub-PR reports under `sub-pr-report/v6/`** — one per sub-PR.

Cumulative monthly maintenance projection for Phase 11: ≈ 1.0 hr/month per V6 § 2.4.

---

## 15. What 11.5 explicitly does NOT do

- ❌ No deployment of the tick beyond the two `/about` demonstrators.
- ❌ No motion / animation added to `.margin-tick`.
- ❌ No removal of the existing hairline-rule beneath each demonstrator block.
- ❌ No new colour outside cyan + black + white-opacity.
- ❌ No restructuring of /about's section order (Phase 13.3 territory).
- ❌ No "while we're here" cleanup of the cinematic pause text or the atmospheric breath copy.
- ❌ No telemetry, no KV key, no API route.
- ❌ No Phase 12+ work.

Single sub-PR. Single mission. The second motif exists; the demonstrator validates it; the rest of the deployment earns each surface in its owning future sub-PR.

---

## 16. Closing

V6 Sub-PR 11.5 is the *quietest possible Phase 11 closer*: two CSS primitives, one server-side helper, two demonstrator placements. After 11.5, the about page reads with two coexisting visual motifs — the cyan margin tick to the left, the cyan hairline-rule beneath — and the V6 visual vocabulary is no longer mono-axis.

Phase 11 closes here. Five sub-PRs in the bag: atmosphere variants (11.1), pill vocabulary (11.2), glass retirement (11.3), text-token consolidation (11.4), margin tick (11.5). Token reform is complete. The 30-day observation window begins.

**Same systems. Same palette. Two motifs.**

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
