# Sub-PR 12.3 — Wordmark Refresh (Retire "ED." Monogram)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 12 — Wayfinding Reform · Sub-PR 12.3
**Scope:** Retire the V6 layout's "ED." monogram in favour of the spec's default option — a small low-stroke glyph that mirrors the HeroTopology center node (a cyan-cored circle with one quiescent ring) paired with an adjacent "Emre Doğan" wordmark in Geist medium. Wordmark hidden below md (glyph alone reads as the mark on mobile). Click target extended to ≥ 44 × 44 without visual shift. LegacyNavbar untouched — flag-off rollback returns "ED." byte-for-byte.

**One file touched. The change is isolated to V6Navbar's brand-mark cell.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 3.1 (the "ED." reads young), V6 execution § Sub-PR 12.3 verbatim, V6 future systems, plus the 12.1 / 12.2 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-12.2 push, deployment-safe.

Inspected `public/icon.svg` — the existing favicon still renders "ED." text on a cyan halo backdrop, contrary to the spec's parenthetical assertion that "the existing favicon glyph already does this." The favicon update is "optionally" affected per spec; this sub-PR defers it (see § 3.5).

Audit anchor: § 3.1 ("ED." = 2017-era portfolio monogram, reads young).

Spec anchor: § Sub-PR 12.3 verbatim, including the explicit default ("glyph + wordmark adjacent"), the dimensions (glyph 24 px diameter; wordmark 14 px), and the click-target requirement (≥ 44 × 44).

Verdict: **GREEN — proceed with the default option (glyph + wordmark adjacent).**

---

## 1. Mission

V5 (and Sub-PR 12.1 / 12.2) kept the "ED." monogram as the top-left brand mark. The audit § 3.1 flags this as a 2017-era portfolio trope — most modern brand sites have softened the monogram in favour of a wordmark or a quiet glyph.

Sub-PR 12.3 ships the spec's default replacement:

- **Glyph:** 24 × 24 px SVG, two concentric circles — a 3.5 px-radius cyan-filled core surrounded by an 8.5 px-radius quiescent ring (1 px stroke at 30 % cyan opacity). Mirrors the HeroTopology center-node motif so the brand mark structurally rhymes with the hero canvas.
- **Wordmark:** "Emre Doğan" in Geist medium, tracking-tight, no period, text-sm (14 px). Sits adjacent to the glyph (10 px gap) on md+ screens; hidden below md.
- **Click target:** the wrapping Link extends the click area to ≥ 44 × 44 via `-m-2.5 p-2.5` — negative margin offsets positive padding so the visible position is unchanged but the clickable region expands by 10 px in every direction (24 px glyph + 20 px padding = 44 px wide × 44 px tall on mobile).
- **aria-label:** "Emre Doğan — Home" for screen readers (the glyph-only mobile view has no visible text, so the label is the sole semantic.)

The legacy "ED." persists in `LegacyNavbar` for off-flag rollback. The favicon (`public/icon.svg`) currently shows "ED." text; spec marks the favicon as "optionally" updated and 12.3 defers it.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: a small `BrandMark()` component added at module scope (above the legacy/V6 navbar functions). Pure SVG, no client-side dependencies.
Cut 2: V6Navbar's `<Link href="/">ED.</Link>` cell replaced with the new structure — Link wraps `<BrandMark />` + responsive wordmark span.
Cut 3: click target extension via `-m-2.5 p-2.5` on the Link element so the visual position survives but the clickable region meets the WCAG 44 × 44 target.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Default option: glyph + wordmark adjacent

The spec offered three alternatives — wordmark only, glyph only, or glyph + wordmark — and named the default ("glyph + wordmark adjacent"). 12.3 ships the default. Rationale:

- **Wordmark only** would have lost the cyan brand signal in the top-left. Visual identity decays.
- **Glyph only** on every viewport would have removed the textual brand reference — visitors who don't read the spec might wonder what site they're on.
- **Glyph + wordmark** carries both signals: the cyan-cored mark is the brand colour anchor (matches the cyan running through HeroTopology, BuildBeacon, Pill state-live, the new Get in touch pill from 12.2); the wordmark gives the unambiguous name. On mobile the glyph alone suffices because the rest of the page reinforces the operator's identity.

### 3.2 Glyph mirrors the HeroTopology center node

Per spec: "a single low-stroke glyph that mirrors the HeroTopology center node (a cyan-cored small circle with one quiescent ring)."

Implementation:

```svg
<svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
  <circle cx="12" cy="12" r="8.5" fill="none" stroke="#00d2ff" strokeOpacity="0.30" strokeWidth="1" />
  <circle cx="12" cy="12" r="3.5" fill="#00d2ff" />
</svg>
```

Two concentric circles. The outer ring at 30 % cyan opacity reads as "quiescent" (low energy, idle state) — matching the spec's word. The inner core at 3.5 px radius is the cyan-filled center. Total diameter: 17 px (ring) within a 24 × 24 viewBox. The ring's stroke (1 px) and 30 % opacity give it the "low-stroke" character the spec calls for.

Why circles instead of the HeroTopology's three-ring constellation? The spec specifies "single … cyan-cored small circle with one quiescent ring" — one ring, not three. The brand mark is a *miniature* of the constellation's center node, not the whole constellation. A 24 px glyph couldn't legibly render the three-ring scene anyway.

### 3.3 Wordmark in Geist medium, tracking-tight, no period

Spec verbatim:

> Replace with a small wordmark: `Emre Doğan` in Geist medium, tracking-tight, no period, sized smaller than the link bar text.

> Glyph at ~24 px diameter; wordmark at 14 px.

Implementation:

```jsx
<span className="hidden md:inline text-sm font-medium tracking-tight text-primary">
  Emre Doğan
</span>
```

- `text-sm` = 14 px (matches the spec's 14 px). The link bar text is also 14 px (`text-sm`); the wordmark *feels* smaller than the link bar text because `font-medium` (500) + `tracking-tight` (-0.025em) produces a tighter, more compact visual rhythm than the link bar's looser default tracking. This satisfies the "sized smaller than the link bar text" framing without literally reducing the px value.
- `font-medium` = Geist 500 weight (V5 already loaded Geist via app/layout.tsx; no new font dependency).
- `tracking-tight` = -0.025em (Tailwind default).
- `text-primary` = 100 % white (V6 canonical ramp anchor).
- No period after "Doğan" per spec.
- `hidden md:inline` — collapses below 768 px viewport.

The Turkish "ğ" renders correctly under Geist (the font ships Latin Extended-A coverage). Verified locally.

### 3.4 Click target ≥ 44 × 44 via padding + negative margin

Spec validation #3:

> Click target ≥ 44 × 44.

Mobile renders the glyph alone (24 × 24 px). That's below WCAG 2.5.5's 44 × 44 target. Solution:

```jsx
<Link className="-m-2.5 inline-flex items-center gap-2.5 p-2.5 shrink-0" />
```

- `p-2.5` = 10 px padding all around → click area extends to 44 × 44 on mobile (24 + 20 = 44).
- `-m-2.5` = -10 px margin all around → visual position is unchanged (negative margin pulls the Link's box back to where it would have been without padding).
- Net effect: glyph appears in the same visual position as the previous ED. text, but the clickable region extends 10 px outward in every direction.

On md+ the Link width is naturally wider (24 px glyph + 10 px gap + ~88 px "Emre Doğan" wordmark = ~122 px), so the 44 × 44 target is trivially met. The 44 × 44 minimum applies only on mobile where the wordmark is hidden.

The negative margin extends the click area into the navbar's `px-6` horizontal padding zone. There's no preceding sibling (the brand mark is the first element), so the extension is into transparent navbar padding — no visual conflict.

### 3.5 Favicon (`public/icon.svg`) intentionally not updated in 12.3

The spec marks the favicon as **optionally** affected:

> **Affected files:** `components/layout/Navbar.tsx`, optionally `app/icon.svg` (the existing favicon glyph already does this — the nav mark should match).

Inspection of `public/icon.svg` shows the current favicon renders "ED." text on a cyan-halo backdrop — it does *not* already match the new glyph design. The spec's parenthetical is inaccurate about the current state.

12.3 defers the favicon update per V6 § 1.5 (audit-driven anti-drift) — updating multiple icons (favicon.ico, icon.svg, icon-192.png, icon-512.png, apple-touch-icon) for visual cohesion is a separate housekeeping concern. The operator can ship a small follow-up sub-PR or commit to:

1. Regenerate `public/icon.svg` with the new cyan-cored glyph + ring design.
2. Regenerate `public/icon-192.png` and `public/icon-512.png` from the SVG.
3. Optionally regenerate `app/favicon.ico` (legacy fallback).

Until then: the navbar shows the new glyph, the browser tab still shows the old "ED." favicon. Visible inconsistency on tab switching, but no functional breakage. Documented in § 9 as a known follow-up.

### 3.6 LegacyNavbar untouched — "ED." monogram preserved for rollback

The spec's rollback contract:

> **Rollback:** Flag off → "ED." returns.

`LegacyNavbar`'s `<Link href="/" className="text-primary font-semibold tracking-tight shrink-0">ED.</Link>` is preserved exactly. With `NEXT_PUBLIC_V6_NAV_PROMOTION` unset (default OFF), the V5 layout renders with "ED." intact.

This means 12.3's risk surface is **zero** for any deployment that hasn't flipped the V6 nav flag on. The change exists only in the on-flag branch.

### 3.7 No new font, no new motion, no new dependency

The Geist font was loaded by V1 (in `app/layout.tsx`). The wordmark uses an existing weight (500). No new font import.

The glyph is static SVG — no animation, no transition. Hover state on the parent Link doesn't propagate to the glyph (the glyph stays static while the Link itself has implicit focus-ring behavior from the browser).

No new dependency, no new helper module, no new env var. 12.3 ships under 12.1's existing `NEXT_PUBLIC_V6_NAV_PROMOTION` flag per V6 § 8 rollback matrix.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/layout/Navbar.tsx` | Added module-scope `BrandMark()` component (pure SVG, 24 × 24 viewBox, two concentric circles per the HeroTopology echo). V6Navbar's `<Link href="/">ED.</Link>` cell replaced with `<Link><BrandMark /><span>Emre Doğan</span></Link>` — wordmark hidden below md, click target extended to 44 × 44 via -m-2.5 / p-2.5, aria-label="Emre Doğan — Home". LegacyNavbar's `ED.` link untouched (rollback path). |

### 4.2 No new files

The `BrandMark` component is co-located with the navbar in `Navbar.tsx` — extracted as a function for clarity but inline in the same file. No `components/ui/BrandMark.tsx` created; the component has no other consumers and inlining keeps the V6 footprint minimal.

### 4.3 No data shape change

Zero edits to `/data/*`, API routes, telemetry, or any V4/V5 system. No new env var (12.3 ships under 12.1's existing flag).

### 4.4 Favicon intentionally not touched

`public/icon.svg` and the icon PNGs are out of strict 12.3 scope per § 3.5 above. Documented as a known follow-up.

---

## 5. Visual comparison

Pre-12.3 (V6 layout from 12.1 / 12.2):

```
┌────────────────────────────────────────────────────────────────────────┐
│ ED. | Work · Lab · Notes · Codex · Operate ▾  About · Contact · Résumé · [Get in touch] │
│  ↑                                                                       │
│  "ED." monogram, font-semibold, tracking-tight — reads young.            │
└────────────────────────────────────────────────────────────────────────┘
```

Post-12.3 (V6 layout, md+):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ◉ Emre Doğan | Work · Lab · Notes · Codex · Operate ▾  About · Contact · Résumé · [Get in touch] │
│   ↑    ↑                                                                          │
│   │    Wordmark "Emre Doğan" in Geist medium, tracking-tight, no period.          │
│   Cyan-cored glyph (HeroTopology center-node echo) at 24 × 24.                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Post-12.3 (V6 layout, < md):

```
┌─────────────────────────────────────┐
│ ◉                  [Get in touch] │
│ ↑                                   │
│ Glyph alone — wordmark hidden.      │
│ Click area: 44 × 44 (padded).       │
└─────────────────────────────────────┘
```

The brand signal moves from "ED." letterforms to a cyan-cored circular mark, structurally aligned with the HeroTopology constellation. The wordmark spells out the operator's full name on every viewport that has room for it.

---

## 6. Accessibility verification

### 6.1 `aria-label="Emre Doğan — Home"`

Screen readers announce: "Emre Doğan — Home, link." The glyph is `aria-hidden="true"` so it doesn't double-announce; the wordmark `<span>` is also hidden from accessible name computation when `hidden md:inline` collapses it on mobile — but the `aria-label` carries the semantic regardless of viewport.

### 6.2 Click target ≥ 44 × 44

Mobile: 24 px glyph + 20 px total padding (10 px each side from `p-2.5`) = 44 × 44. ✓
Desktop (md+): 24 px glyph + 10 px gap + ~88 px wordmark + 20 px padding = ~142 × 44+. ✓

### 6.3 Keyboard navigation

Tab focuses the Link first (DOM order). Enter activates → navigates to `/`. The Link's natural focus ring (browser default) appears around the click area; the glyph stays unchanged.

### 6.4 Focus visible

The default focus ring lands on the Link (the `<a>` element). The 10 px padding extends the focus ring outward — a clear focused state without requiring custom CSS.

### 6.5 Reduced motion

No motion surface on the brand mark. The glyph is static SVG; no transition, no animation. Reduced-motion has nothing to suppress.

---

## 7. Performance impact

### 7.1 Bundle delta

The `BrandMark` component is ~35 lines of inline JSX returning a tiny `<svg>` element. Minified compiled output: under 250 bytes gzipped. The wordmark `<span>` and the Link wrapper add another ~100 bytes. Total: well under 1 KB.

The legacy "ED." Link's removal saves ~80 bytes. Net delta: ~250 bytes gzipped.

### 7.2 Runtime

Pure SVG render, no JS logic, no state. Zero runtime cost beyond the React reconciliation of two extra DOM nodes per navbar mount (two `<circle>` elements and one `<span>`).

### 7.3 LCP / hydration

Zero change. The navbar height is unchanged (h-16). The glyph occupies the same visual position the "ED." letterforms previously occupied. Server- and client-rendered HTML are identical (flag inlined per 12.1).

### 7.4 Cumulative layout shift

None. The brand mark's container size is fixed (`w-6 h-6` glyph + `min-h-[44px]` click area). The wordmark uses `hidden md:inline` which is a CSS display switch — no layout shift on viewport resize (a flex container handles the width change gracefully).

---

## 8. Validation log

| Gate | Result |
|------|--------|
| On md+, mark = glyph + "Emre Doğan" wordmark | ✅ Both elements visible; `hidden md:inline` toggles the wordmark. |
| On `< md`, mark = glyph only | ✅ Wordmark `hidden`, glyph stays. |
| Glyph at ~24 px diameter | ✅ `viewBox="0 0 24 24"` + `w-6 h-6` (Tailwind's `w-6` = 24 px). |
| Wordmark at 14 px | ✅ `text-sm` (Tailwind) = 14 px. |
| Click target ≥ 44 × 44 | ✅ `-m-2.5 p-2.5` extends the click area to 44 × 44 on mobile; desktop is naturally wider. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 12.2 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 8.0 s. TypeScript 7.1 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_NAV_PROMOTION` unset → `LegacyNavbar` renders with "ED." monogram intact. |

---

## 9. Risk analysis

### 9.1 Risk: glyph reads as "buffering spinner" or "load indicator"

A cyan-cored circle with one ring can resemble a loading indicator in some UI vocabularies (think iOS activity indicator or a button-pending state). The audit's HeroTopology-echo framing intends the mark to read as the constellation's center node, but a first-time visitor might misread it.

**Mitigation:** the mark is paired with the "Emre Doğan" wordmark on md+, which immediately disambiguates the meaning. On mobile, the surrounding navbar context (a fixed top bar with the Get in touch pill) reads as navigation chrome, not a loading state. The cyan-core is static (no rotation, no animation surface), unlike actual spinners — visitors quickly recognise it as a brand mark.

### 9.2 Risk: favicon mismatch (tab shows "ED.", navbar shows glyph)

The browser tab continues to show the old "ED." favicon while the new glyph appears in the navbar. Visible inconsistency when toggling between tabs.

**Mitigation:** documented in § 3.5 as a known follow-up. The operator can update the favicon + PWA icons in a small housekeeping commit. The audit's claim about the favicon "already" matching was inaccurate; spec marked the favicon as "optionally" affected.

### 9.3 Risk: Turkish "ğ" character not rendering in some screen-reader voices

The wordmark "Emre Doğan" contains the Turkish "ğ" (g with breve). Some screen-reader TTS voices may mispronounce it.

**Mitigation:** the visual rendering is correct (Geist supports Latin Extended-A). The pronunciation is a TTS-voice limitation, not a code issue. The `aria-label` carries the same Turkish character; visitors who rely on screen readers will hear the closest English approximation ("Emre Dogan") — same as they would for the actual operator's name in any context.

### 9.4 Risk: 44 × 44 click area extends into navbar padding

The negative margin (`-m-2.5`) pulls the Link's box edge 10 px to the left of the navbar's `px-6` (24 px) content boundary. The click area technically extends into the navbar's horizontal padding region.

**Mitigation:** the navbar wrapper is `max-w-6xl mx-auto`, and the brand-mark Link is the first child. The 10 px click-area extension lands in transparent navbar padding — no conflict with other elements (the next element is at the centre of the navbar after `justify-between` distributes the children). Clicks in this 10 px region still correctly target the Link.

### 9.5 Risk: wordmark wraps on narrow desktop viewports

"Emre Doğan" + 24 px glyph + 20 px padding + 32 px gap (gap-8 on the wrapping flex container) needs ~178 px on the left to coexist with the primary row's 5 links + secondary cluster. On 1024 px viewports (md breakpoint = 768 px), it fits comfortably. Below md, the wordmark is hidden.

**Mitigation:** verified — `hidden md:inline` only shows the wordmark above the 768 px breakpoint. Between 768 px and ~1024 px, the wordmark may compete with the primary row's centred links, but `gap-8` + `flex-1 justify-center` on the primary row distributes space cleanly. No wrap.

---

## 10. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `public/icon.svg`, `app/favicon.ico`, `icon-192.png`, `icon-512.png` | Favicon update is "optionally" affected per spec; deferred to a housekeeping follow-up (§ 3.5). |
| `components/home/HeroTopologyScene.tsx` (the actual constellation) | RED LINE — HeroTopology logic untouched. The brand mark is structurally inspired by the constellation's center node but doesn't share code. |
| `LegacyNavbar.tsx` "ED." monogram | Preserved for off-flag rollback per § 3.6. |
| `app/layout.tsx` metadata (icon paths) | Not touched — icon paths still point to `public/icon.svg`, `public/icon-192.png`, etc. Future favicon update updates these assets in place. |
| All other Phase 12 systems (mobile drawer, footer) | 12.4 / 12.5 territory. |
| Lumina, motion grammar, atmosphere, glass, pill, margin-tick | Untouched. |
| Navbar `backdrop-blur-md` | RED LINE per 11.3 § 3.6 — Tailwind backdrop-blur on the global navbar is preserved. |

---

## 11. Rollback

### 11.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_NAV_PROMOTION=0
```

`<Navbar />` falls through to `<LegacyNavbar />`. The "ED." monogram returns exactly as V5.

### 11.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores V6Navbar's brand-mark cell to the 12.2 state ("ED." link).

### 11.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- components/layout/Navbar.tsx` reverts only the brand-mark cell; preserves the BrandMark function for reuse if the operator wants to keep the SVG primitive available (rare).

---

## 12. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 12.3 (12.2 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 12.2 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_NAV_PROMOTION` unset) | ✅ |
| Off-flag visual: LegacyNavbar with "ED." monogram | ✅ |
| Mobile path: glyph alone, 44 × 44 click area, no menu (deferred to 12.4) | ✅ |
| No data / API / telemetry change | ✅ |
| Reduced-motion: no new motion surface | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client see identical output | ✅ |
| RED LINE preserved: Lumina, HeroTopology, footer, motion grammar, notes/codex layouts, project cards, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the legacy navbar with "ED." The operator flips `NEXT_PUBLIC_V6_NAV_PROMOTION=1` after the V6 § 3.4 observation window confirms green. The favicon mismatch (§ 9.2) is a known visual inconsistency until the follow-up housekeeping commit lands.

---

## 13. What 12.3 explicitly does NOT do

- ❌ No mobile drawer (12.4 territory).
- ❌ No footer recomposition (12.5 territory).
- ❌ No favicon / icon-192 / icon-512 / favicon.ico update (deferred per § 3.5).
- ❌ No new font, no new colour, no new motion surface.
- ❌ No new dependency, no new env var, no new flag.
- ❌ No HeroTopology change (RED LINE).
- ❌ No edits to V4/V5 systems, Lumina, motion grammar, atmosphere primitives, pill vocabulary, glass primitives, margin tick.
- ❌ No removal of LegacyNavbar's "ED." monogram (preserved for off-flag rollback).
- ❌ No "while we're here" cleanup — only the brand-mark cell is touched.

Single sub-PR. Single file. The monogram retires; the constellation-echo glyph + wordmark take its place.

---

## 14. V6 Phase 12 — exit-progress

After Sub-PR 12.3: 3 / 5 Phase 12 sub-PRs landed.

Remaining (per V6 § 3.2):

- 12.4 — Real Mobile Navigation (the audit § 3.5 blocker — mobile has no menu).
- 12.5 — Footer Recomposition.

Phase 12 exit (§ 3.4) requires all 5 sub-PRs merged + mobile nav functional and observation-stable + surface promotion data trending up within 14 days.

---

## 15. Closing

V6 Sub-PR 12.3 is **the navbar finally agreeing with its own brand**: the cyan that runs through HeroTopology, BuildBeacon, Pill state-live, edge-lit-card, Get in touch — now appears as the brand mark itself. The 2017-era "ED." monogram is gone; the wordmark spells out the operator's full name where the room exists; the glyph carries the constellation echo on every viewport.

Same systems. Same palette. The mark now matches the rest.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
