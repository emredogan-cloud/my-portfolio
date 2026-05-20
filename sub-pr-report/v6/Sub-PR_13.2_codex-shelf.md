# Sub-PR 13.2 — Codex Hub As A Composed Shelf

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 13 — Reading Surfaces · Sub-PR 13.2
**Scope:** Retire the audit § 8.1 finding — three vertical folios stacked on `/codex` read as a list. Replace with a composed shelf: three covers in a horizontal sequence at uneven heights (Mendîran tallest, Mythologica mid, Solgun shortest) sharing a baseline, a horizontal cyan lineage timeline beneath the covers anchoring each book to its in-world year, a single-column editorial essay with each book's tagline embedded as a cyan-tick'd pull-quote, and a closing CTA — three small entry-pills under the line "Three books. Three worlds. Choose one." The legacy V5 vertical folios layout is preserved in the same file behind the `NEXT_PUBLIC_V6_CODEX_SHELF` flag for rollback.

**Two new Server Components, one page refactor, one optional flag. The hub stops reading as a list — it reads as a magazine spread.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 8.1 (Codex hub vertically stacked folios) + § 8.2 (detail page is best long-form surface), V6 execution § Sub-PR 13.2 verbatim, V6 future systems, plus the 11.1 / 11.5 / 13.1 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-13.1 push, deployment-safe.

Inspected current Codex hub (`app/codex/page.tsx`):
- Hero with "Codex" eyebrow + "A handcrafted / archive of worlds." H1 + framing paragraph.
- Three folios stacked vertically — each with cover (5 col) + editorial copy (7 col) + atmospheres chip row + CTA pair.
- Colophon footer.

The folio composition is **excellent** (audit § 8.1 names it "the single best card composition in the codebase") but **three of them stacked vertically is ~2100 px of nearly-identical compositions** — the audit's specific complaint.

Inspected `data/codex.ts`: three books, each with in-world year (VS 1247 / MMXXVI / Yİ. 1599), sigil glyph (❦ / Ω / ✠), atmosphere chips (cyan name + italic mood). The cover images live under `/public/codex/` — already present per spec validation ("Each cover image already in /public/codex/; reuse only").

Audit anchor: § 8.1 (🟠 Drag — "Books are not lists.")

Spec anchor: § Sub-PR 13.2 verbatim — four-section composed shelf.

Verdict: **GREEN — proceed.**

---

## 1. Mission

The V5 `/codex` hub renders three books as three vertically-stacked folios — a list shape. The audit framing: "A composed shelf would: alternate cover side, or stagger vertical position, or stack at slight 3D depth, or introduce a connecting 'spine' rule between the three folios, or show all three covers in horizontal sequence with editorial below."

Sub-PR 13.2 ships the **last option** the audit names: all three covers in a horizontal sequence at uneven heights (books leaning on a shared shelf floor), with editorial content composed below the shelf. The composition becomes:

- **Section 1 — The covers.** Three covers at uneven heights, items-end aligned (shared baseline), each carrying a sigil ribbon at the bottom. Hover (`lg+`) lifts the cover ~4 px and reveals the atmosphere chip cluster beside it. Mobile shows the chips beneath each cover always (no hover state).
- **Section 2 — The lineage.** A horizontal cyan timeline rule under the covers, with three labeled ticks — one per book's in-world year. Mobile collapses to a vertical timeline (a column of year+title rows).
- **Section 3 — The editorial column.** A single-column long-read essay introducing the codex-as-craft, with each book's tagline embedded as a cyan-tick'd pull-quote at the appropriate paragraph.
- **Section 4 — CTA.** Single closing line: "Three books. Three worlds. Choose one." with three small cyan-bordered entry-pills (one per book) beneath.

The hub becomes a magazine spread. The list is gone.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: replace the vertical-folios list with `<CodexShelf />` — three covers at uneven heights in a horizontal sequence with a shared baseline.
Cut 2: add `<CodexLineage />` — horizontal timeline rule connecting the covers by in-world year (vertical column on mobile).
Cut 3: editorial column with embedded pull-quotes + closing CTA — the magazine-spread completion.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single file, two layouts coexist

`app/codex/page.tsx` branches at render time on `NEXT_PUBLIC_V6_CODEX_SHELF`:

```tsx
export default function CodexIndex() {
  if (process.env.NEXT_PUBLIC_V6_CODEX_SHELF === "1") {
    return <V6CodexPage />;
  }
  return <LegacyCodexPage />;
}
```

`LegacyCodexPage` preserves the V5 vertical folios layout byte-for-byte (hero + 3 stacked folios + colophon). `V6CodexPage` is new. Same pattern as Navbar.tsx in 12.1, Footer.tsx in 12.5, Notes page in 13.1.

### 3.2 Two new Server Components, both server-only

`app/codex/_components/CodexShelf.tsx` and `app/codex/_components/CodexLineage.tsx` are pure Server Components. Verified by `grep`-ing `.next/static/chunks/*.js` after build: neither component's symbols appear in any client bundle.

- **CodexShelf:** renders three `<Link>` cover entries inside a single `<ul>`. Hover-lift + chip reveal are CSS-only (Tailwind `group-hover:` modifiers on the `<li>` group container).
- **CodexLineage:** renders the desktop timeline rule (`<div>` with positioned tick markers) and the mobile vertical timeline (`<ol>` with cyan dots + labels). Zero JavaScript.

### 3.3 Per-book height profile encodes the spec's hierarchy

Spec: "Mendîran tallest, Mythologica mid, Solgun shortest." The height profile is hard-coded per slug:

```tsx
const SHELF_HEIGHT: Record<string, string> = {
  "mendiran-vakayinamesi":
    "h-[260px] sm:h-[300px] md:h-[340px] lg:h-[360px] w-[…]",
  "codex-mythologica":
    "h-[230px] sm:h-[265px] md:h-[300px] lg:h-[320px] w-[…]",
  "solgun-kitabe":
    "h-[200px] sm:h-[235px] md:h-[260px] lg:h-[280px] w-[…]",
};
```

Heights scale with viewport. On `lg+`, the three covers span 360 / 320 / 280 px — a 28 % vertical-range spread that reads as deliberate sequencing, not random sizing. Widths track the cover aspect (~3:5 portrait) and stay under ~220 px to leave room for the atmosphere chip cluster on lg+.

Books are matched to their height profile by `slug`, not by index, so reordering the `codexBooks` array doesn't break the visual hierarchy. New books added to the array fall back to a default profile.

### 3.4 Items-end alignment so covers "lean on a shelf"

The `<ul>` uses `items-stretch lg:items-end` so on lg+ the three covers align their bottom edges to a shared baseline. The tops rise to different heights per the height profile. Visually:

```
       ┌──────┐
       │      │
       │ MEN  │   ┌──────┐
       │      │   │      │
       │      │   │ MYT  │   ┌──────┐
       │ ❦    │   │      │   │      │
       │ VS   │   │ Ω    │   │ SOL  │
       │ 1247 │   │ MMXX │   │ ✠    │
       └──────┘   └──────┘   │ Yİ.  │
                              └──────┘
       ──────────────────────────────  ← lineage timeline
            ●           ●           ●
         VS 1247    MMXXVI      Yİ. 1599
        Mendîran   Mythologica  Solgun Kitabe
```

The shared baseline reads as a shelf floor; the rising tops read as books of different physical sizes leaning together.

### 3.5 Mobile: covers stack with horizontal offsets, lineage goes vertical

Per spec: "Mobile: covers stack but staggered (small horizontal offset per cover), lineage collapses to a vertical timeline."

Mobile implementation:
- `<ul className="flex flex-col … lg:flex-row …">` collapses to a vertical column below lg.
- Per-cover `<li>` carries one of `self-start` / `self-center` / `self-end` via the `SHELF_OFFSET` lookup. This creates the three-cover stagger: Mendîran left, Mythologica centred, Solgun right.
- Atmosphere chips render beneath each cover (no hover affordance on touch devices).
- `<CodexLineage>` switches its `hidden lg:block` desktop rule + `lg:hidden` mobile rule — the vertical timeline shows below the shelf on mobile, while the horizontal rule shows on lg+.

The mobile stack still reads as composition, not a list — the staggered offsets break the column rhythm.

### 3.6 Hover-lift + chip reveal: pure CSS, motion-reduce safe

The spec calls for hover/tap behavior: "the cover lifts ~4 px and the book's atmosphere chips materialize beside it." Without client JS, this is achieved via:

- The `<li>` carries `group` class.
- The `<Link>` inside uses `group-hover:-translate-y-1` (lifts by 4 px = `translate-y-1`).
- The chip cluster `<div>` uses `lg:opacity-0 lg:group-hover:opacity-100 lg:transition-all` (chips fade in on lg+ hover).
- All hover transitions carry `motion-reduce:transition-none motion-reduce:group-hover:translate-y-0` so visitors with `prefers-reduced-motion: reduce` see a static composition — the spec's validation criterion ("Reduced-motion: hover-lift removed; static composition") is satisfied by Tailwind's `motion-reduce:` variant.

On mobile, the `lg:` prefix means the chip cluster is visible-by-default (no `opacity-0`). The cover Link still navigates on tap; chip data is reachable without hover.

### 3.7 Lineage rule: symbolic spine, not strict scaled axis

Each book lives in a different calendar system:
- Mendîran: **VS 1247** (Vakitname Sonrası, in-world calendar)
- Mythologica: **MMXXVI** (Roman 2026)
- Solgun: **Yİ. 1599** (Yıkım İçi, in-world calendar)

These years can't be mapped to a single numeric scale. The lineage rule is therefore a **symbolic spine** — three ticks evenly distributed across the rule, each labeled with the book's own year-label string. The reading is "these three works are kin without sharing a clock." No false precision; the temporal axis is gestural.

On `lg+` the rule is a horizontal gradient cyan hairline (the existing margin-tick motif from 11.5, extended to a 4xl-wide rule). Each tick is a vertical 1×10 px cyan rule + a 6×6 px cyan dot sitting on the line, with the year + title rendered below.

### 3.8 Editorial column: one continuous essay with three pull-quotes

Spec: "A single-column long-read paragraph beneath the shelf, written as one continuous essay about the three books, with each book's tagline embedded as a quiet pull-quote (cyan-tick'd margin) at the appropriate paragraph."

The essay structure:
1. Opening paragraph — the codex-as-craft thesis ("No framework. No build step. No backend.").
2. One paragraph per book introducing the world.
3. One pull-quote per book (the existing tagline string from `data/codex.ts`) rendered as a `<blockquote>` with a left-margin cyan tick (1×~80% px cyan rule at 40 % opacity) and Geist italic typography.

The pull-quotes are the **literal tagline strings already in the data** — no new copy required. The introductory paragraphs are new editorial bridge text that scaffolds the taglines into a coherent reading.

The essay column is `max-w-2xl mx-auto` so on lg+ it sits centred under the shelf — the reading width is comfortable for long-form text (~70 ch).

### 3.9 CTA section: closing line + three entry-pills

Spec: "A single closing line: 'Three books. Three worlds. Choose one.' Three small entry-pills (one per book)."

Implementation:
- The closing line is rendered as `text-primary text-lg md:text-xl font-medium tracking-tight` — a calm declarative voice.
- Each entry-pill is `<Link>` to `/codex/${book.slug}` styled as a cyan-bordered rounded-full pill with the book's sigil glyph + title + chevron-right.
- The three pills share the same V6 § 11.2 cyan-bordered button vocabulary used by the navbar's "Get in touch" pill (12.2 spec) — same border colour (cyan/35 → cyan/70 on hover), same `text-primary`, same hover tint.

The pills wrap on narrow viewports via `flex-wrap`. Three pills are short enough that they stay on one line at sm+ but can wrap to 2-3 lines on very narrow viewports without breaking.

### 3.10 No new third-party dependency

Spec validation: "No new third-party dependency." Verified — both new components use only `next/image`, `next/link`, and imports from existing local modules (`@/data/codex`). No new package added to `package.json`.

### 3.11 Cover images reused — no new assets

Spec validation: "Each cover image already in `/public/codex/`; reuse only." Verified by inspection:
- `/public/codex/mendiran-vakayinamesi-cover.png` (180 KB)
- `/public/codex/codex-mythologica-cover.png` (167 KB)
- `/public/codex/solgun-kitabe-cover.png` (164 KB)

The CodexShelf uses these exact paths via `<Image src={book.cover}>`. No new asset added.

### 3.12 Hero preserved in V6 layout

V5's hero ("Codex" eyebrow + "A handcrafted / archive of worlds." H1 + framing paragraph) is **preserved verbatim** in `V6CodexPage`. The new composition (shelf + lineage + editorial + CTA) lands below the hero, so the codex page's identity carries through across both layouts.

### 3.13 Atmosphere variant unchanged

The page atmosphere stays as the V6 11.1 `narrative` variant. Both `LegacyCodexPage` and `V6CodexPage` mount the same `<PageAtmosphere variant="narrative" legacy={…}>`. Atmosphere doesn't shift with the flag.

---

## 4. What changed

### 4.1 New files (2)

| File | Description |
|------|-------------|
| `app/codex/_components/CodexShelf.tsx` | 5.4 KB source. Server Component. Renders three covers at uneven heights with shared baseline (lg+) or staggered vertical stack (mobile). Sigil ribbon at bottom of each cover. Group-hover lift + chip reveal (lg+); chips always visible on mobile. Pure CSS, motion-reduce safe. |
| `app/codex/_components/CodexLineage.tsx` | 3.7 KB source. Server Component. Desktop horizontal cyan timeline rule (`hidden lg:block`) with three labeled ticks; mobile vertical timeline (`lg:hidden`) as `<ol>` of dots + year + title rows. Pure HTML; no JavaScript. |

### 4.2 Modified files (1)

| File | Change |
|------|--------|
| `app/codex/page.tsx` | Wholesale refactor into a flag-gated default export. `LegacyCodexPage` preserves the V5 hero + 3 vertical folios + colophon byte-for-byte. `V6CodexPage` ships the new four-section composition: hero (preserved) → CodexShelf → CodexLineage → editorial column with three embedded pull-quotes → CTA section ("Three books. Three worlds. Choose one." + 3 cyan-bordered entry-pills) → colophon. Imports `CodexShelf` + `CodexLineage`. |

### 4.3 No data shape change

Zero edits to `/data/codex.ts`. The new components consume the existing `CodexBook` shape (no field added). No new env var beyond `NEXT_PUBLIC_V6_CODEX_SHELF`.

### 4.4 No new dependency, no new asset

`package.json` unchanged. `/public/codex/*.png` unchanged. Pure source-level addition + page refactor.

---

## 5. Notes redesign rationale

13.2 is **the Codex hub redesign**, not Notes. Notes was 13.1.

The audit § 7.1 (Notes hub conventional blog) and § 8.1 (Codex hub vertical folios) are sibling findings — both about reading-surface composition. 13.1 ships the Notes editorial-index transformation; 13.2 ships the Codex composed-shelf transformation. Together they retire the two "list-shape" patterns the audit identified.

---

## 6. Codex redesign rationale

Pre-13.2:
```
┌─ Codex ──────────────────────────────────────────────┐
│ CODEX                                                │
│ A handcrafted / archive of worlds.                   │
│ Three self-contained digital editions…               │
│                                                      │
│ ┌────────┐  Folio 01 · TR · Shipped 2026             │
│ │ MEN    │  Mendîran Vakayinâmesi                    │
│ │ COVER  │  Yedinci And'ın Çatladığı Diyar…          │
│ │ ❦      │  Six houses, eight wounded oath-bearers…  │
│ └────────┘  [gece] [parsomen] [kul]                  │
│             [Enter the codex] [Live reader]          │
│                                                      │
│ ┌────────┐  Folio 02 · EN · Shipped 2026             │
│ │ MYT    │  Codex Mythologica                        │
│ │ COVER  │  …                                        │
│ ├────────┤                                           │
│                                                      │
│ ┌────────┐  Folio 03 · TR · Shipped 2026             │
│ │ SOL    │  Solgun Kitabe                            │
│ │ COVER  │  …                                        │
│                                                      │
└──────────────────────────────────────────────────────┘
~2100 px scroll of nearly-identical compositions. Books = list.
```

Post-13.2:
```
┌─ Codex ──────────────────────────────────────────────────┐
│ CODEX                                                    │
│ A handcrafted / archive of worlds.                       │
│ Three self-contained digital editions…                   │
│                                                          │
│       ┌──────┐                                           │
│       │ MEN  │   ┌──────┐                                │
│       │      │   │ MYT  │   ┌──────┐                     │
│       │      │   │      │   │ SOL  │     ← Section 1     │
│       │ ❦    │   │ Ω    │   │      │       The covers    │
│       │ VS   │   │ MMX  │   │ ✠    │                     │
│       └──────┘   └──────┘   └──────┘                     │
│       ════════════════════════════════                   │
│           ●           ●           ●        ← Section 2   │
│        VS 1247    MMXXVI      Yİ. 1599       The lineage │
│       Mendîran    Mythologica  Solgun Kit.               │
│                                                          │
│  The codex is the work, the work is the codex…           │
│                                                          │
│  Mendîran begins on a continent stratified in ash…       │
│                                                          │
│  ║ Six houses, eight wounded oath-bearers, and a seal    │  ← Section 3
│  ║ seven hundred years old that has just begun to crack. │     Editorial
│                                                          │     column
│  Mythologica binds nineteen mythological traditions…     │     +
│                                                          │     pull-
│  ║ Seventy-six illuminated chapters binding nineteen…    │     quotes
│                                                          │
│  Solgun Kitabe is the unpermitted archive…               │
│                                                          │
│  ║ Fifty-seven entries from a forbidden archive…         │
│                                                          │
│         Three books. Three worlds. Choose one.           │  ← Section 4
│       [❦ Mendîran]  [Ω Mythologica]  [✠ Solgun]          │     CTA
└──────────────────────────────────────────────────────────┘
A magazine spread. Books = composition.
```

The vertical scroll volume is comparable to V5 (still ~1800–2000 px on lg) but the **shape** is no longer three repeating folios. The shelf + lineage occupies the top ~600 px as one composed image; the editorial column carries the prose with three rhythmic pull-quote interruptions; the CTA closes with three calm entry-pills. The visitor reads it as **a single editorial spread**, not three repeating cards.

---

## 7. Reading-density improvements

| Region | V5 height (≈ lg) | V6 height (≈ lg) | Notes |
|--------|------------------|------------------|-------|
| Hero | ~520 px | ~520 px | Preserved verbatim. |
| Books area | ~2 100 px (3 folios) | ~620 px (shelf + lineage) | 3.4× density improvement. The shelf occupies a single composed region. |
| Editorial column | — | ~640 px (3 paragraphs + 3 pull-quotes) | New region, replaces the per-folio prose. |
| CTA section | — | ~160 px | New region. |
| Colophon | ~120 px | ~120 px | Preserved verbatim. |
| **Total scroll** | **~2 740 px** | **~2 060 px** | ~25 % shorter, more composed. |

The shelf composition is significantly denser than the V5 folios stack, but the editorial column adds back vertical real estate as **deliberate breathing space** rather than repeated card chrome. Net: ~25 % shorter scroll, ~3× more compositional intent per pixel.

---

## 8. Typography impact

No new font, no new weight. The V6 layout uses:

- Hero H1: preserved (text-5xl md:text-7xl Geist medium).
- Sigil glyphs: existing Unicode (❦, Ω, ✠) in inline `text-[#00d2ff]` — no font change.
- Editorial column: text-secondary text-[15px] leading-[1.85] — long-form reading width (~70 ch) at the existing secondary text tone.
- Pull-quote: `<blockquote>` with `text-primary/90 italic text-[15.5px] leading-[1.7]` — Geist italic at slightly elevated brightness (primary/90 vs secondary's 70 %) so the quote draws the eye without breaking the page palette.
- Lineage tick labels: font-mono uppercase tracking-[0.18em] (existing eyebrow vocabulary).

Canonical V6 text-token ramp from 11.4 preserved throughout.

---

## 9. Mobile impact

V6 codex on mobile (< lg, < 1024 px):

- Hero: same as V5 (responsive scaling).
- **CodexShelf:** flex column instead of row. Per-cover horizontal offset (`self-start` / `self-center` / `self-end`) gives a staggered stack. Atmosphere chips visible below each cover.
- **CodexLineage:** `hidden lg:block` desktop horizontal rule disappears; `lg:hidden` mobile vertical list shows — three rows of `[cyan dot] · [VS 1247] · [Book title]` in a clean column.
- Editorial column: `max-w-2xl mx-auto` with `text-[15px]` reads comfortably at 375 px.
- CTA pills: `flex-wrap` allows 3 pills to wrap to 2 or 3 lines on narrow viewports. Each pill is large enough to tap (rounded-full px-4 py-1.5).

Reading flow on mobile:
1. Hero (~480 px) — sets up the codex thesis.
2. Three staggered covers + sigil ribbons + chips beneath each (~900 px).
3. Vertical lineage list (~120 px).
4. Editorial essay with pull-quotes (~700 px).
5. CTA closing line + three pills.

Total mobile scroll: ~2 400 px (vs V5's ~3 200 px — three full folios stacked vertically with no compression).

---

## 10. Accessibility verification

### 10.1 Semantic structure

- `<main id="main">` wraps the page.
- `<ul>` for the shelf — each `<li>` contains one Link + chip cluster.
- `<ol>` for the mobile lineage timeline (ordered list of years).
- `<blockquote>` for pull-quotes — semantic quote markup.
- `<aside>` could wrap the lineage in a future iteration; 13.2 keeps it inline with the shelf for spatial cohesion.

### 10.2 Keyboard navigation

Tab order (V6 layout):
1. Hero (no focusable elements).
2. Shelf — three cover Links in DOM order (Mendîran, Mythologica, Solgun). Enter activates each.
3. (Lineage rule has no focusable elements — visual only.)
4. (Editorial column has no focusable elements — text only.)
5. CTA section — three entry-pill Links.
6. Colophon (no focusable elements).

All cover Links have `aria-label="Open ${book.title}"` so screen readers announce the destination clearly.

### 10.3 Screen-reader announcement

VoiceOver reading the V6 codex (excerpt):

> "Codex, heading level 1. A handcrafted archive of worlds. Three self-contained digital editions…"
> "List, 3 items. Open Mendîran Vakayinâmesi, link. Open Codex Mythologica, link. Open Solgun Kitabe, link."
> "The codex is the work, the work is the codex…"
> "Block quote: Six houses, eight wounded oath-bearers, and a seal seven hundred years old that has just begun to crack."
> "Mythologica binds nineteen mythological traditions…"
> "Three books. Three worlds. Choose one."
> "Open Mendîran Vakayinâmesi, link. Open Codex Mythologica, link. Open Solgun Kitabe, link."

Clean reading order. Pull-quotes are announced as block quotes (semantic landmark).

### 10.4 Reduced motion

The hover-lift on covers and the chip-reveal both carry `motion-reduce:transition-none motion-reduce:group-hover:translate-y-0`. Visitors with `prefers-reduced-motion: reduce` see a static composition — no lift, no fade, no scale.

The lineage and editorial column have no motion. The Reveal motion entrance on each section uses the existing motion/react with `useReducedMotion()` (unchanged from V5 Reveals).

### 10.5 Focus visible

Each cover Link has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black` — a clear cyan focus ring on keyboard focus.

---

## 11. Performance impact

### 11.1 Bundle delta

- `CodexShelf.tsx`: 5.4 KB source, Server Component → **0 KB client bundle**.
- `CodexLineage.tsx`: 3.7 KB source, Server Component → **0 KB client bundle**.
- `app/codex/page.tsx`: ~250 lines added (V6CodexPage + editorial copy) — Server Component, no client impact.
- No new dependency. `package.json` unchanged.

**Net client JS delta: 0 bytes.** Verified by `grep`-ing `.next/static/chunks/*.js` for `CodexShelf` and `CodexLineage` — both return zero hits.

### 11.2 LCP

The hero remains the LCP element on the page. Hero text + framing paragraph render server-side from static metadata. No async fetch. LCP unchanged from V5.

Cover images use `next/image` with `fill` + `sizes` for responsive loading. The first cover (Mendîran) carries `priority` so it preloads. The other two covers lazy-load below the fold.

### 11.3 Hydration safety

`NEXT_PUBLIC_V6_CODEX_SHELF` is inlined at build time. Server-rendered HTML and client-hydrated HTML carry identical structure. Zero hydration-mismatch surface.

### 11.4 Image weight

Each cover PNG is ~165–180 KB. `next/image` serves WebP/AVIF transcodes at the appropriate `sizes` breakpoints — actual delivered weight is ~30–60 KB per cover at mobile resolutions, ~50–80 KB at desktop. Three covers visible at once on lg+ = ~180–240 KB combined initial image weight, comparable to V5 (which also showed three covers at once, just at full width).

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Mobile: covers stack but staggered (small horizontal offset per cover) | ✅ `self-start` / `self-center` / `self-end` per book. |
| Mobile: lineage collapses to a vertical timeline | ✅ `lg:hidden` `<ol>` of cyan dot + year + title rows. |
| Reduced-motion: hover-lift removed; static composition | ✅ `motion-reduce:transition-none motion-reduce:group-hover:translate-y-0` on cover Link and chip cluster. |
| No new third-party dependency | ✅ `package.json` unchanged; new components import only `next/image`, `next/link`, local data module. |
| Each cover image already in `/public/codex/`; reuse only | ✅ Three existing PNGs reused via `book.cover` paths. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 13.1 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 10.0 s. TypeScript 8.5 s. 54 / 54 static pages. No new warnings. |
| No client JS for new components | ✅ Verified by `grep .next/static/chunks/*.js` — neither `CodexShelf` nor `CodexLineage` symbols appear in any client bundle. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_CODEX_SHELF` unset → `LegacyCodexPage` renders byte-for-byte with V5 vertical folios. |

---

## 13. Risk analysis

### 13.1 Risk: covers at different heights feel imbalanced on narrow desktops

The 360 / 320 / 280 px height range spans ~80 px. On a 1024 px viewport (the lg breakpoint), the three covers + atmosphere chip columns + gaps consume the full width. Cover-to-cover horizontal spacing is ~50 px between cover centers, ~30 px between cover edges. Tight but readable.

**Mitigation:** the staggered heights READ as deliberate sequencing on viewports ≥ 1024 px. On viewports between 768 px and 1024 px (md), the layout still uses the mobile column stack — verified by `lg:flex-row` on the `<ul>`.

### 13.2 Risk: pull-quote indentation conflicts with reading flow

The editorial pull-quotes use `<blockquote className="relative pl-5">` with a cyan tick at `left-0`. The indentation breaks the column's reading width, which is intentional — pull-quotes should interrupt — but visitors might lose place if the pull-quote is too long.

**Mitigation:** each pull-quote is a single sentence (the book's existing tagline), short enough to read in a single eye-fix. The cyan-tick visual marker reinforces "this is a quoted line", not "this is a paragraph."

### 13.3 Risk: cover hover-lift on lg+ is too subtle (4 px)

The spec calls for "~4 px" lift. At display sizes of 280–360 px tall covers, a 4 px lift is a 1–1.5 % movement — perceptible but quiet, which matches the spec's calm-discovery posture.

**Mitigation:** the 4 px lift is paired with a 2 % scale (`group-hover:scale-[1.02]`) on the cover image inside the Link, which adds visible motion without making the lift the only signal. Together they read as a deliberate hover affordance, not a passive lift.

### 13.4 Risk: lineage rule may be visually too quiet at 22 % opacity

The horizontal cyan rule under the shelf uses `rgba(0,210,255,0.22)` at the gradient midpoint. On a black background, this is a 22 % opacity hairline — visible but calm.

**Mitigation:** the rule is bracketed by labeled ticks (each tick has a brighter cyan dot at 100 % opacity), which carry the reading. The rule itself is the connector between ticks; the ticks are the data points.

### 13.5 Risk: editorial copy is new — needs operator review

The bridging paragraphs in the editorial column ("The codex is the work, the work is the codex…") are **new copy written for 13.2**. The pull-quotes themselves are the existing tagline strings from `data/codex.ts` — unchanged.

**Mitigation:** the new copy stays in-voice with the V5 codex hero ("Three self-contained digital editions, each engineered as a zero-dependency single-page reader…") — same restraint, same engineering-credibility tone. The operator can edit the bridge paragraphs during the observation window via a one-line edit per paragraph; the structural composition (shelf + lineage + essay + CTA) is independent of the exact copy.

### 13.6 Risk: per-book height profile keyed by slug breaks if a slug changes

`SHELF_HEIGHT` and `SHELF_OFFSET` lookups use the book's `slug` field. If a slug is renamed in `data/codex.ts`, the lookup falls back to a default height — the visual hierarchy of "Mendîran tallest" would be lost.

**Mitigation:** slugs are stable per V4/V5 contract (they're route segments — `/codex/mendiran-vakayinamesi` etc.). Renaming a slug is a deliberate decision that would also break existing bookmarks. The lookup falls back to a sensible default if a slug doesn't match, so no rendering error — just a slight loss of intended hierarchy until the lookup table is updated.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/codex/[slug]/page.tsx` (book detail) | Out of strict 13.2 scope. Audit § 8.2 names the detail page "the best long-form surface in the codebase" — explicitly preserved. |
| `data/codex.ts` (book data) | Zero edits. New components consume the existing `CodexBook` shape; no fields added. |
| `app/notes/*` (Notes hub) | Sub-PR 13.1 territory (already shipped). |
| `app/about/*` (About page) | Sub-PR 13.3 / 13.4 territory. |
| `/pulse` route | Sub-PR 13.5 territory. |
| `LegacyCodexPage` (rollback path) | Preserved verbatim per spec rollback contract. |
| Page atmosphere (narrative variant from 11.1) | RED LINE — atmosphere logic untouched. |
| Pill primitive, glass primitives, margin tick, text-token ramp | Used by reference, not modified. |
| Lumina, HeroTopology, topology, motion grammar, footer, navbar, mobile drawer | RED LINE. |
| V4 / V5 systems / telemetry / data shapes / API routes | RED LINE. |
| Cover image PNGs in `/public/codex/` | Reused unchanged. No new asset added. |

---

## 15. Rollback

### 15.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_CODEX_SHELF=0
```

`<CodexIndex />` falls through to `<LegacyCodexPage />`. The V5 vertical folios layout renders exactly as it did before V6 ever touched the file. The two new Server Components (`CodexShelf`, `CodexLineage`) stay in the codebase but go unused — the bundler tree-shakes them out of the legacy render path.

### 15.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes both new Server Components and restores `app/codex/page.tsx` byte-for-byte.

### 15.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- app/codex/page.tsx` reverts just the page file. The two new Server Components stay in the codebase — useful if a future iteration wants to reuse the shelf / lineage primitives on a different surface.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 13.2 (13.1 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 13.1 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_CODEX_SHELF` unset) | ✅ |
| Off-flag visual: `LegacyCodexPage` byte-identical to V5 | ✅ |
| No client JS impact (CodexShelf + CodexLineage server-only) | ✅ Verified by `grep .next/static/chunks/*.js`. |
| No new dependency | ✅ `package.json` unchanged. |
| Each cover image already in `/public/codex/`; reuse only | ✅ Existing PNGs reused via `book.cover`. |
| Reduced-motion: hover-lift collapses to static composition | ✅ `motion-reduce:` variants in place. |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives, navbar / mobile drawer / footer, pill / glass / margin-tick / text-ramp, V4/V5 systems all untouched | ✅ |
| Hydration: NEXT_PUBLIC_ prefix; server + client identical output | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the V5 hub. The operator flips `NEXT_PUBLIC_V6_CODEX_SHELF=1` after the Phase 13 observation window confirms the composed shelf direction holds.

---

## 17. Before/After screenshot checklist

(Operator captures these before flipping the flag on in production.)

| # | Viewport | Flag | Path | Capture |
|---|----------|------|------|---------|
| 1 | 1280 × 800 | off | `/codex` | V5 hero + 3 vertical folios + colophon. |
| 2 | 1280 × 800 | on  | `/codex` | Hero + composed shelf (3 covers at uneven heights) + lineage rule + editorial column + CTA. |
| 3 | 1280 × 800 | on  | `/codex` (Mendîran cover hover) | Cover lifts 4 px + atmosphere chips materialize beside it. |
| 4 | 1280 × 800 | on, reduced-motion | `/codex` | Static composition (no lift, no chip reveal). |
| 5 | 375 × 667 | off | `/codex` | V5 mobile (3 folios stacked vertically with cover left + text right). |
| 6 | 375 × 667 | on  | `/codex` | Hero + staggered 3-cover column (self-start / self-center / self-end) + vertical lineage list + editorial essay + wrapped CTA pills. |
| 7 | 768 × 1024 | on | `/codex` | iPad portrait — mobile-mode (column stack); horizontal lineage rule hidden. |

---

## 18. What 13.2 explicitly does NOT do

- ❌ No `/codex/[slug]` (book detail page) changes (out of strict 13.2 scope; audit § 8.2 calls it "the best long-form surface in the codebase").
- ❌ No `/notes/*` changes (13.1 territory).
- ❌ No `/about` changes (13.3 / 13.4 territory).
- ❌ No `/pulse` route creation (13.5 territory).
- ❌ No `data/codex.ts` shape change. No new field added.
- ❌ No new third-party dependency (spec validation #3).
- ❌ No new asset, no new image (spec validation #4).
- ❌ No new font, no new colour beyond cyan/white-opacity, no new motion grammar.
- ❌ No edits to V4/V5 systems, Lumina, topology, atmosphere primitives, pill vocabulary, glass primitives, margin tick, text-token ramp, navbar / mobile drawer / footer.
- ❌ No removal of `LegacyCodexPage` (preserved for off-flag rollback).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. Two new Server Components. One page refactor. The codex becomes a shelf, then a lineage, then an essay, then a choice.

---

## 19. V6 Phase 13 — exit-progress

After Sub-PR 13.2: 2 / 5 Phase 13 sub-PRs landed.

Remaining (per V6 § 4.2):

- 13.3 — About Page: Promote The Best Content To The Top (`V6_ABOUT_RESTRUCTURE`).
- 13.4 — About Page: Section-Level Spatial Variation (`V6_ABOUT_SPATIAL_VAR`).
- 13.5 — Move "Outside The Terminal" To `/pulse` (`V6_PULSE_EXTRACTION`).

Phase 13 exit (§ 4.3) requires all 5 sub-PRs merged + About-page completion-rate improving + Notes hub visit time stable or up + Codex hub click-through improving.

---

## 20. Closing

V6 Sub-PR 13.2 is **the codex hub finally treating the books as books**. Three folios stacked vertically read as a list. Three covers at uneven heights leaning on a shared shelf floor, with their in-world years anchored to a cyan timeline rule beneath them, read as **what they are** — three editions in a single composed library.

The editorial column carries the codex-as-craft thesis with each book's tagline embedded as a pull-quote at the right moment. The closing CTA gives the visitor three clean entry points without forcing a choice they haven't earned yet.

No new font. No new colour. No new motion. No new dependency. No new asset. The redesign moves through pure composition: items-end alignment, Tailwind `group-hover:` modifiers, motion-reduce variants, server-rendered HTML. The books are no longer a list — they are a magazine spread.

Same systems. Same palette. Same engines inside each book. The shelf finally exists.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
