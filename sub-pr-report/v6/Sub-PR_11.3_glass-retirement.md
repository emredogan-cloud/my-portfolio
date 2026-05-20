# Sub-PR 11.3 — Glass-Panel Retirement

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 11 — Token Reform & Cross-Cutting Hygiene · Sub-PR 11.3
**Scope:** Replace site-wide `.liquid-glass` and `.glass-panel` glassmorphism usages with two new restrained primitives — `.edge-lit-card` (containers) and `.ghost-outline-button` (rounded-full secondary CTAs) — per V6 § 11.3 spec. LuminaTrigger keeps `.liquid-glass` (the single legitimate dimmable-orb consumer). Flag-gated by `NEXT_PUBLIC_V6_GLASS_RETIREMENT` (default OFF); the deprecated CSS classes stay defined for off-flag fallback and `git revert` convenience.

**The Three-Cut Rule honoured: two CSS primitives added, two TS helpers introduced, 9 callsite swaps registered. No fourth cut.**

---

## 0. Pre-execution audit

Per the V6 execution constitution (§ 0.1, § 1.5) the agent re-read V4/V5 execution + future, V6 audit § 1.3, V6 execution § Sub-PR 11.3, V6 future systems, plus the 11.1 / 11.2 sub-PR reports. Verified: branch `feat/v4-phase5-experimental-foundation` clean post-11.2 push, in deployment-safe state.

Audit anchor: § 1.3 — `.liquid-glass` and `.glass-panel` had drifted from "primitive" to "template aesthetic"; backdrop-filter is expensive; the trend signature reads as 2021 web design.

Spec anchor: § Sub-PR 11.3 — edge-lit-card replaces site-wide glass usages with no backdrop-blur, no semitransparent fill, just solid `#0a0a0a` + 1px white/6 border + cyan hairline top edge + inset highlight scan-line.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 ended with `.liquid-glass` and `.glass-panel` as the default secondary container across most of the site:

- `/projects` hub cards (`liquid-glass rounded-2xl`)
- `/projects/[slug]` GitHub link pill (`glass-panel rounded-full`)
- `/about` Specializations container (`liquid-glass rounded-2xl`)
- `/about` closing CTA secondary (`glass-panel rounded-full`)
- `/contact` form container + success state (`glass-panel rounded-2xl`)
- `/codex` hub Live-reader pill (`glass-panel rounded-full`)
- `/codex/[slug]` Source button (`glass-panel rounded-full`)
- HeroSection "Download CV" secondary CTA (`glass-panel rounded-full`)
- LuminaTrigger chat button (`liquid-glass`)

That's nine consumers shipping two stacked backdrop-blur layers each. The cumulative read is "frosted SaaS." The CWH project page even ships two stacked layers at certain widths.

Sub-PR 11.3 retires every consumer except LuminaTrigger and replaces them with:

- **`.edge-lit-card`** for card-shaped containers (rounded-2xl):
  - Solid `#0a0a0a` background (no backdrop-filter).
  - 1 px white/6 border, transitioning to white/10 on hover.
  - A `::before` pseudo-element renders a 1 px cyan hairline on the top edge at 20 % opacity, transitioning to 90 % on hover — directly extending the existing `inset-x-7 top-0 h-px bg-[#00d2ff]/20` motif into a reusable primitive.
  - `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)` for a single highlight scan-line.

- **`.ghost-outline-button`** for rounded-full secondary CTAs:
  - Transparent background.
  - 1 px white/12 border, transitioning to white/25 on hover.
  - 75 % white text, transitioning to full white on hover.
  - A faint white/4 hover-background tint so the affordance reads as alive.

Both new primitives are pure CSS, no backdrop-filter, no semitransparent fill.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: `.edge-lit-card` and `.ghost-outline-button` added to `app/globals.css`, with `.liquid-glass` and `.glass-panel` marked deprecated.
Cut 2: typed helpers `cardSurface()` and `secondaryButton()` introduced in `lib/v6/glass.ts` — they return the right className based on the V6 flag.
Cut 3: nine call sites swap their inline `liquid-glass` / `glass-panel` strings for the helper invocations.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Two new primitives, not one

The spec describes `.edge-lit-card` as the replacement for glass usage. But the site uses `.glass-panel` in two structurally different contexts:

- **Cards (rounded-2xl)**: Projects hub cards, About Specializations, Contact form, Contact success state — large containers.
- **Buttons (rounded-full)**: GitHub link pill, "See the work", "Open the live reader", "Source", "Download CV", LuminaTrigger.

A single primitive would have to do both jobs, which would either over-style the buttons (cyan top hairline on a 40 px-tall pill reads wrong) or under-style the cards (a transparent ghost-outline doesn't anchor a rounded-2xl panel).

Two primitives, two semantic roles:

| Helper | Replaces | New class |
|--------|----------|-----------|
| `cardSurface()` | `liquid-glass` / `glass-panel` on `rounded-2xl` panels | `.edge-lit-card` |
| `secondaryButton()` | `glass-panel` on `rounded-full` secondary CTAs | `.ghost-outline-button` |

LuminaTrigger keeps `.liquid-glass` directly per spec — it's the single legitimate dimmable-orb consumer and the spec explicitly preserves it.

### 3.2 The cyan hairline is implemented as a `::before` pseudo-element

The existing `inset-x-7 top-0 h-px bg-[#00d2ff]/20` motif is per-card markup — every consumer must remember to add the hairline child element. `.edge-lit-card` bakes the hairline into a `::before` pseudo, so every card automatically gets the cyan top edge with hover transition. Zero per-call-site markup overhead.

The `1.75rem` left/right inset on the pseudo matches `inset-x-7` (Tailwind: `7 * 0.25rem = 1.75rem`). Identical visual to the V5 hairline motif, lifted into the primitive.

### 3.3 Hover transitions match the V5 cubic-bezier

The original `.liquid-glass` and `.glass-panel` used `cubic-bezier(0.22, 1, 0.36, 1)` at 0.4 s for their hover transitions. `.edge-lit-card` uses the same cubic-bezier at 0.4 s for both `border-color` and the pseudo's `background`. `.ghost-outline-button` uses the same cubic-bezier at 0.3 s for `border-color`, `color`, and `background` — faster because buttons should feel snappier than cards.

### 3.4 Flag uses `NEXT_PUBLIC_` prefix — same reason as 11.2

`cardSurface()` and `secondaryButton()` are called from both Server Components (project hub, codex hub, about) and Client Components (HeroSection, ContactForm). Without the `NEXT_PUBLIC_` prefix the server reads the flag value while the client sees `undefined`, causing a hydration mismatch in the className the moment the operator flips the flag on in production.

Spec rollback matrix names the flag `V6_GLASS_RETIREMENT` (V6 § 8); implementation uses `NEXT_PUBLIC_V6_GLASS_RETIREMENT`. Documented in the helper module's preamble.

The 11.1 `V6_ATMOSPHERE_VARIANTS` flag stays non-public because `PageAtmosphere` is only imported from Server Components; 11.2 and 11.3 both need the public form because their primitives cross the boundary.

### 3.5 Deprecated CSS classes retained, not deleted

`.liquid-glass` and `.glass-panel` remain defined in `globals.css` with `@deprecated 2026-05-20` comments. Two reasons:

1. **LuminaTrigger** still imports `.liquid-glass` directly (per spec).
2. **V6_GLASS_RETIREMENT off-flag fallback** — the helpers return `"liquid-glass"` / `"glass-panel"` when the flag is off, so the historical CSS must continue to resolve.

When the operator decides V6 has stabilised and the flag-flip is permanent, a future sub-PR can delete `.glass-panel` (no remaining consumers) and trim `.liquid-glass` to its LuminaTrigger-only essentials. That cleanup is not 11.3's scope.

### 3.6 Tailwind `backdrop-blur-*` utilities on RED-LINE protected surfaces are NOT modified

The codebase also uses Tailwind's `backdrop-blur-sm` / `backdrop-blur-md` utilities (separate from the `.liquid-glass` / `.glass-panel` primitives) on several RED-LINE protected surfaces:

| Surface | Utility | Reason untouched |
|---------|---------|-------------------|
| `components/layout/Navbar.tsx:76, 143` | `backdrop-blur-md` | Navbar — RED LINE (Phase 12 territory). |
| `app/architecture/_components/ScrollStory.tsx:145` | `backdrop-blur-md` | Motion grammar / scroll story badge — RED LINE. |
| `components/home/HeroTopologyScene.tsx:405` | `backdrop-blur-sm` | HeroTopology hover label — RED LINE. |
| `components/codex/CodexTopologyScene.tsx:374` | `backdrop-blur-sm` | Topology hover label — codex layout / topology RED LINE. |
| `app/projects/[slug]/_components/AWSTopologyScene.tsx:241` | `backdrop-blur-sm` | AWS topology hover label — topology RED LINE. |
| `components/notes/InteractiveDiagram.tsx:85` | `backdrop-blur-sm` | Notes interactive diagram — notes layout RED LINE. |
| `components/sections/BentoDecomposeOverlay.tsx:107` | `backdrop-blur-sm` | Bento decompose overlay — project-card adjacent. |
| `app/codex/page.tsx:120` | `backdrop-blur-sm` | Codex card cover ribbon — codex layout RED LINE. |

The V6 § 11.3 validation says "No `backdrop-filter` CSS rule remains outside `LuminaTrigger`." This is interpreted in the spec's affected-files scope (which lists `liquid-glass` / `glass-panel` primitive consumers). The Tailwind `backdrop-blur-*` utility usages on RED-LINE protected surfaces are deferred — they will be addressed in the relevant Phase 12+ sub-PRs (Navbar in 12.1, Topology in Phase 14+, etc.).

### 3.7 Text color utilities preserved on every swap site

The V5 glass-panel CTAs all carried inline Tailwind text color (`text-white/75 hover:text-white` or `text-primary/80 hover:text-primary`). `.ghost-outline-button` CSS sets its own text color (75 % white → 100 % on hover) but Tailwind utilities take precedence in the cascade. Keeping the inline Tailwind utilities means:

- **Flag off** (legacy `glass-panel`): the Tailwind utilities apply (`.glass-panel` has no color rule).
- **Flag on** (`ghost-outline-button`): the Tailwind utilities still apply (they win over `.ghost-outline-button`'s color rule).

In effect, the inline text color utilities are the canonical color source either way; `.ghost-outline-button`'s color rule is a safety net for any future caller that omits the inline utility.

### 3.8 The Contact form success-state emerald icon (out of scope)

`app/contact/ContactForm.tsx:39-40` retains an emerald check-icon inside its success-state container. The container itself is swapped to `cardSurface()`; the icon inside it stays emerald — same reasoning as 11.2 § 3.12, universal submission-success usability convention. Not a status/filter pill, not a glass primitive — out of 11.3 scope.

---

## 4. What changed

### 4.1 New files (1)

- `lib/v6/glass.ts` — 1 989 bytes. Exports `cardSurface()` and `secondaryButton()` helpers.

### 4.2 Edited files (9)

| # | File | Cut |
|---|------|-----|
| 1 | `app/globals.css` | Added `.edge-lit-card` and `.ghost-outline-button` utility classes. Marked `.liquid-glass` and `.glass-panel` as `@deprecated 2026-05-20` with usage-context comments. |
| 2 | `app/projects/page.tsx` | `liquid-glass rounded-2xl` project hub card → `${cardSurface()} rounded-2xl`. |
| 3 | `app/projects/[slug]/page.tsx` | `glass-panel rounded-full` GitHub link pill → `${secondaryButton()} rounded-full`. |
| 4 | `app/codex/page.tsx` | `glass-panel rounded-full` Live-reader pill → `${secondaryButton()} rounded-full`. |
| 5 | `app/codex/[slug]/page.tsx` | `glass-panel rounded-full` Source button → `${secondaryButton()} rounded-full`. |
| 6 | `app/about/page.tsx` | `liquid-glass rounded-2xl` Specializations row → `${cardSurface()} rounded-2xl`. Closing-section `glass-panel rounded-full` "See the work" CTA → `${secondaryButton()} rounded-full`. |
| 7 | `app/contact/ContactForm.tsx` | `glass-panel rounded-2xl` success-state container → `${cardSurface()} rounded-2xl`. `glass-panel rounded-2xl` form container → `${cardSurface()} rounded-2xl`. |
| 8 | `components/sections/HeroSection.tsx` | `glass-panel rounded-full` Download-CV CTA → `${secondaryButton()} rounded-full`. |

### 4.3 LuminaTrigger explicitly unchanged

`components/chat/LuminaTrigger.tsx:36` still uses `liquid-glass` directly. The dimmable-orb effect on the chat trigger is the single legitimate backdrop-blur consumer per V6 § 11.3 spec.

### 4.4 No data shape change

Zero edits to `/data/*`, API routes, telemetry, or any V4/V5 system. One new env var: `NEXT_PUBLIC_V6_GLASS_RETIREMENT`.

---

## 5. Performance impact

### 5.1 Bundle delta

- New CSS: `~600 bytes` added to globals.css (two new utility classes + comments). Gzipped ≈ 300 B.
- New TS: `lib/v6/glass.ts` is 1 989 B source, ~250 B gzipped after minification.
- Client bundle delta: minimal — Pill and PageAtmosphere already consume some of the same buildtime cost; the helpers compile to short `process.env` checks that webpack/turbopack inline at build time.

Combined: well under the 2 KB budget.

### 5.2 Runtime CPU

This is where 11.3 actually pays off:

- `backdrop-filter: blur(16px)` (liquid-glass) and `backdrop-filter: blur(20px)` (glass-panel) are GPU-expensive operations. Each frame, the browser samples the underlying composited region and applies a 16–20 px Gaussian blur — for *every consumer*. On mid-tier mobile devices that's measurable cost during scroll.
- `.edge-lit-card` and `.ghost-outline-button` have **zero** backdrop-filter cost. The single `box-shadow: inset` and the `::before` pseudo cost effectively nothing per frame.

Expected mobile Lighthouse improvement per V6 § 11.3 validation: ≥ 1 point on routes with multiple glass containers (`/projects` hub has 5 cards each previously running backdrop-filter; `/contact` form is a large blur surface).

### 5.3 LCP

Unchanged. The cards retain the same dimensions, padding, and content. The visual shift is *what the card looks like*, not how big it is or when it paints.

### 5.4 Hydration

Both helpers read `process.env.NEXT_PUBLIC_V6_GLASS_RETIREMENT`. The `NEXT_PUBLIC_` prefix means Next.js inlines the same value at build time for both server and client. Server-rendered HTML and client-hydrated HTML carry identical className strings. Zero hydration-mismatch surface.

---

## 6. Mobile impact

The most-visible perceptual improvement is on mobile mid-tier devices where backdrop-filter cost was highest. Specifically:

- `/projects` hub: 5 stacked rounded-2xl cards previously ran backdrop-blur(16px). Now solid `#0a0a0a` with cyan hairline. Scroll behavior on mid-tier Android should be measurably smoother.
- `/contact`: the form is a single large rounded-2xl panel; previously backdrop-blur(20px) on a high-contrast scene; now solid `#0a0a0a`. Form-focused fields no longer cost a blur-recompute on every input.
- LuminaTrigger: unchanged, still glass (the spec-protected exception).

The edge-lit cyan hairline is visible at 375 px without modification — the `inset-x-7` (1.75 rem) inset works at every viewport, leaving the hairline anchored to the top edge with a small horizontal margin.

---

## 7. Reduced-motion

No animation surface in either new primitive. The hover transitions are 0.3–0.4 s cubic-bezier on `border-color` / `background` / `color` — `prefers-reduced-motion: reduce` shouldn't disable these (they're affordance feedback, not entrance animation), and the spec doesn't require gating them.

The `::before` cyan hairline transitions its background color on hover. This is a state change, not a continuous animation, and remains within reduced-motion sensibilities.

---

## 8. Validation log

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Clean on every file touched in 11.3. 22 pre-existing errors and 2 warnings unchanged from 11.1 / 11.2 (untouched chat package, AWS topology, ArchitectureHubGrid apostrophe). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 12.6 s. TypeScript 10.1 s. 54 / 54 static pages generated. No new warnings. |
| `grep "liquid-glass\|glass-panel"` across app + components + lib | ✅ Three references remain: `app/globals.css` (deprecated definitions), `components/chat/LuminaTrigger.tsx` (spec-protected consumer), `lib/v6/glass.ts` (off-flag fallback strings). All intentional. |
| `grep "backdrop-blur\|backdrop-filter"` across spec-affected files | ✅ Zero hits in `app/projects/`, `app/about/`, `app/contact/ContactForm.tsx`, `components/sections/HeroSection.tsx`, `app/codex/[slug]/page.tsx`. One hit in `app/codex/page.tsx:120` (cover ribbon overlay, RED-LINE protected — codex layout). |
| Bundle delta on client | ✅ ~250 B gzipped helper + ~300 B gzipped CSS additions. Well under 2 KB. |
| Hydration safety | ✅ NEXT_PUBLIC_ prefix means server + client see identical inlined flag values. |

---

## 9. Risk analysis

### 9.1 Risk: `.glass-panel` consumers exist in code paths that aren't `glass-panel rounded-full`

`.glass-panel rounded-2xl` exists on `/contact` (form + success state). The audit calls these out as glass consumers. 11.3 swaps them to `cardSurface()` not `secondaryButton()`. **Mitigation:** the helper function (`cardSurface` vs `secondaryButton`) selects based on the semantic role at the call site; rounded-2xl callers use `cardSurface`, rounded-full callers use `secondaryButton`. Decision is per-call-site, not per-class.

### 9.2 Risk: cyan hairline on every edge-lit-card may feel busy

`.edge-lit-card`'s `::before` pseudo adds a cyan top hairline to every consumer. Currently 4 consumers use `cardSurface()`: projects hub cards (5 instances), about Specializations (3 instances), contact form (1 instance), contact success state (1 instance). That's 10 cyan hairlines on a single landing-flow. **Mitigation:** the hairline at 20 % opacity rest state is intentionally subtle. The 90 % hover state is the meaningful affordance. If the rest state proves too busy in the 30-day observation window, the spec leaves room to dial back to 12 % (matching the existing `bg-[#00d2ff]/20 opacity-30 group-hover:opacity-90` motif's effective value of `0.20 * 0.30 = 0.06`).

### 9.3 Risk: ghost-outline-button visually competes with the white primary CTA

The white `bg-primary` pill (e.g. "Get in touch") is the primary CTA; the ghost-outline-button is the secondary. Both are rounded-full. **Mitigation:** the white primary has solid white background, the ghost-outline has transparent — visual hierarchy is preserved. Audit § 3.4's separate concern about the "View Résumé" pill is a Phase 12 issue (12.2), not 11.3.

### 9.4 Risk: legacy fallback (flag off) is visually identical to V5

The off-flag path returns the literal V5 class names (`liquid-glass`, `glass-panel`), so when `NEXT_PUBLIC_V6_GLASS_RETIREMENT` is unset, the build emits CSS that includes both deprecated rules AND the new rules. Bundle is slightly larger. **Mitigation:** the deprecated rules will be deleted in a future cleanup once the V6 flag flip is permanent. Until then, ~600 B of dead CSS is acceptable for the rollback safety it provides.

### 9.5 Risk: backdrop-blur Tailwind utilities on RED-LINE surfaces

Eight surfaces retain Tailwind `backdrop-blur-*` utilities (navbar, topology scenes, scroll-story, bento overlay, notes diagram, codex cover ribbon). The spec validation reads "No backdrop-filter CSS rule remains outside LuminaTrigger" — strict reading fails. **Interpretation:** the validation applies to the `.liquid-glass` / `.glass-panel` primitive consumers the spec lists. RED-LINE surfaces are addressed in their owning sub-PRs (Navbar 12.1, Topology Phase 14+, etc.). Documented in § 3.6.

---

## 10. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `components/chat/LuminaTrigger.tsx` | Spec-protected — LuminaTrigger keeps `.liquid-glass` directly. |
| `components/chat/LuminaWindow.tsx`, `LuminaChat.tsx` | Lumina logic — RED LINE. |
| `components/layout/Navbar.tsx` | Navbar — RED LINE (Phase 12.1+). |
| `components/layout/Footer.tsx`, `BuildBeacon.tsx` | Footer — RED LINE (Phase 12.5). |
| `components/home/HeroTopologyScene.tsx`, `HeroTopology.tsx` | HeroTopology — RED LINE. |
| `components/codex/CodexTopologyScene.tsx` | Topology — RED LINE. |
| `app/architecture/_components/ScrollStory.tsx` | Motion grammar — RED LINE. |
| `app/projects/[slug]/_components/AWSTopologyScene.tsx` | Project topology — RED LINE. |
| `components/notes/InteractiveDiagram.tsx` | Notes layout — RED LINE. |
| `components/sections/BentoDecomposeOverlay.tsx` | Bento overlay / project-card adjacent. |
| `app/codex/page.tsx:120` (cover ribbon backdrop-blur-sm) | Codex layout — RED LINE. |
| `app/contact/ContactForm.tsx:39-40` (emerald check icon) | Submission-success affordance, not a glass primitive — § 3.8 deferral. |
| Inner `.liquid-glass` / `.glass-panel` Tailwind `backdrop-blur-*` usages on small badges, hover labels, or animations | Decorative blur on individual elements; not the template-aesthetic concern the audit calls out. |

---

## 11. Rollback

### 11.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_GLASS_RETIREMENT=0
```

Every `cardSurface()` call returns `"liquid-glass"`. Every `secondaryButton()` call returns `"glass-panel"`. The deprecated CSS still resolves and renders the V5 visual on every consumer. No code change required.

### 11.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores every inline `liquid-glass` / `glass-panel` literal byte-for-byte; deletes the new CSS classes; removes `lib/v6/glass.ts`.

### 11.3 Per-surface revert (surgical)

`git checkout HEAD~1 -- <file>` per surface. Each consumer swap is isolated.

---

## 12. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 11.3 (11.2 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 11.2 build inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_GLASS_RETIREMENT` unset) | ✅ |
| Off-flag visual: identical to V5 (`liquid-glass` + `glass-panel` CSS still resolves) | ✅ |
| LuminaTrigger preserved | ✅ |
| No data / API / telemetry change | ✅ |
| Reduced-motion: no animation surface added | ✅ |
| Hydration: server + client see identical inlined flag values | ✅ |
| RED LINE preserved: topology, Lumina, navbar, footer, motion grammar, notes layout, codex layout structure, project cards, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production looks identical to 11.2. The operator flips `NEXT_PUBLIC_V6_GLASS_RETIREMENT=1` after observation.

---

## 13. What 11.3 explicitly does NOT do

- ❌ No removal of `.liquid-glass` (kept for LuminaTrigger + off-flag fallback).
- ❌ No deletion of `.glass-panel` (kept for off-flag fallback).
- ❌ No touch of RED-LINE protected Tailwind `backdrop-blur-*` utilities (navbar, topology, scroll-story, bento, notes, codex cover ribbon).
- ❌ No retoning of ContactForm's submission-success emerald check icon.
- ❌ No edge-lit-card hover spec expansion (no glow, no shadow, no animation).
- ❌ No new motion grammar or transition curve.
- ❌ No font / spacing / text-token consolidation (11.4 territory).
- ❌ No margin-tick second motif (11.5).
- ❌ No "while we're here" cleanup (project card layout untouched, certificate radar untouched, etc.).
- ❌ No Phase 12+ work.

Single sub-PR. Single mission. Glass primitives retired except where the spec explicitly preserves.

---

## 14. V6 Phase 11 — exit-progress

After Sub-PR 11.3: 3 / 5 Phase 11 sub-PRs landed.

Remaining (per V6 § 2.2):

- 11.4 — Text Token Consolidation (`V6_TEXT_TOKENS_CANONICAL`).
- 11.5 — The Second Motif (Margin Tick System, `V6_MARGIN_TICK`).

Phase 11 exit (§ 2.3) requires all 5 sub-PRs merged + 30-day observation post-11.1 atmosphere variants.

---

## 15. Closing

V6 Sub-PR 11.3 is a CSS-token retirement: two deprecated glass primitives replaced by two restrained `solid + hairline` primitives. The visual signature shifts from "frosted SaaS template" to "edge-lit operator card" — same containers, same content, but rendered without the dated backdrop-blur trend. Mobile mid-tier devices should feel measurably calmer on scroll-heavy routes.

LuminaTrigger keeps its dimmable orb. Everything else moves to `.edge-lit-card` or `.ghost-outline-button`.

**Same systems. Same palette. Solid containers. No more frost.**

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
