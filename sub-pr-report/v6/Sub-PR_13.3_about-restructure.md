# Sub-PR 13.3 — About Page: Promote The Best Content To The Top

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 13 — Reading Surfaces · Sub-PR 13.3
**Scope:** Reorder the `/about` page's 11 sections so the strongest single block (the Closing Transmission signature with the cyan-tick'd pulse pill + FIELD/BUILD/READING/STANCE read-out) arrives near the top instead of at the bottom. Rewrite the hero lead paragraph per 13.3a — the identity vector (01:30 bakery shifts) arrives first; the expertise list arrives second. Remove the "Outside The Terminal" lifestyle section entirely (Sub-PR 13.5 will host the content at `/pulse`). Compress Specializations from per-spec edge-lit cards into a single-row grid (title · paragraph · single-line chip row). Legacy V5 layout preserved in the same file behind `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` for rollback.

**One file refactored. Section order inverted around the operator's coordinates. Page length reduced by ~1.5 viewports per spec validation.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit §§ 4.1 (about page predictably vertical), 4.4 (best content at bottom), 4.6 (identity sentence buried), V6 execution § Sub-PR 13.3 verbatim (including the 13.3a hero lead rewrite spec), V6 future systems, plus the 13.1 / 13.2 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-13.2 push, deployment-safe.

Inventoried current V5 about/page.tsx structure (11 sections):
1. HERO
2. CINEMATIC PAUSE
3. OPERATING PHILOSOPHY (asymmetric 1+3 tiles)
4. OUTSIDE THE TERMINAL (Training / Motorcycle / Reading / Codex tiles)
5. ATMOSPHERIC BREATH ("What keeps the noise low")
6. PRINCIPLES (4 numbered tiles)
7. SPECIALIZATIONS (3 wide rows on edge-lit-card surface)
8. CURRENTLY (dt/dl rows)
9. RECEIPTS (GitHub heatmap)
10. IN FLIGHT (live builds)
11. CLOSING TRANSMISSION (H2 + paragraph + pulse pill + dt/dl + CTAs + end-signature)

Audit anchors:
- § 4.1 (🟠 Drag — "vertically predictable to the point of being a scroll-through").
- § 4.4 (Closing Transmission is the strongest single block but lives at the bottom).
- § 4.6 (identity vector buried in second paragraph).

Spec anchor: § Sub-PR 13.3 + § 13.3a — verbatim section order + hero lead rewrite.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 ends the about page with the strongest block — the Closing Transmission's pulse pill + FIELD/BUILD/READING/STANCE read-out — which a skimming visitor never reaches because the page is 11 vertically-uniform sections and the strongest signal sits last. The hero opens with the expertise list ("I design and operate production AWS infrastructure, AI-native tooling…"); the identity vector (01:30 bakery shifts) is buried in the second paragraph.

Sub-PR 13.3 implements the spec's exact section reorder:

```
NEW ORDER:
1.  HERO (rewritten lead — bakery first)
2.  CLOSING TRANSMISSION SIGNATURE (pulse pill + dt/dl, moved up)
3.  CINEMATIC PAUSE
4.  OPERATING PHILOSOPHY
5.  IN FLIGHT (live builds, was section 11)
6.  RECEIPTS (GitHub heatmap, retained but reframed as Section 6 not 9)
7.  PRINCIPLES
8.  SPECIALIZATIONS (compressed — no card surface, single chip line per spec)
9.  CURRENTLY
10. ATMOSPHERIC BREATH
11. CLOSING H2 + CTAs (remainder of Closing Transmission)
```

**Removed:** Outside The Terminal section — moved to a future `/pulse` route in Sub-PR 13.5.

**Compressed:** Specializations — V5's per-spec edge-lit-card grid retires in favour of a divider-line list with single-row chips.

The page reads as **identity → coordinates → philosophy → work → receipts → principles → practice → close**. The operator's signature arrives by the second screen-fold; everything below it earns trust against an anchor the visitor has already read.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: invert the section order around the operator's signature block — move it from section 11 to section 2.
Cut 2: rewrite the hero lead paragraph per 13.3a — same content, inverted clause order.
Cut 3: remove Outside The Terminal + compress Specializations — net ~1.5 viewport shorter scroll.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single file, two layouts coexist

`app/about/page.tsx` now branches at render time on `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE`:

```tsx
export default function AboutPage() {
  if (process.env.NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE === "1") {
    return <V6AboutPage />;
  }
  return <LegacyAboutPage />;
}
```

Both `LegacyAboutPage` and `V6AboutPage` live in the same file. `LegacyAboutPage` preserves the V5 11-section layout byte-for-byte. `V6AboutPage` is new. Same pattern as Navbar.tsx (12.1), Footer.tsx (12.5), Notes page (13.1), Codex page (13.2).

The shared constants (`PHILOSOPHY`, `LIFESTYLE`, `PRINCIPLES`, `SPECIALIZATIONS`, `CURRENTLY`, `FEATURED`) stay at module scope and are consumed by both layouts. `LIFESTYLE` is unused by V6 but kept for the legacy rollback path.

### 3.2 Closing Transmission split into two sections

V5's Closing Transmission is a single section containing:
1. Eyebrow + H2 ("Building tools / engineers actually use.")
2. Stance paragraph
3. Pulse pill ("Build window · open · Adana · GMT+3")
4. dt/dl read-out (Field / Build / Reading / Stance)
5. CTAs (Get in touch + See the work)
6. End-transmission signature line

13.3 splits this into:
- **Section 2 (SIGNATURE BLOCK):** parts 3 + 4 (pulse pill + dt/dl) — moved up.
- **Section 11 (CLOSING H2 + CTAs):** parts 1, 2, 5, 6 (eyebrow, H2, paragraph, CTAs, signature line) — stays at the bottom.

The split is structurally clean — the H2 "Building tools engineers actually use" is rhetorical/closing copy that needs to sit at the page's emotional close, while the pulse pill + dt/dl are diagnostic data (the operator's coordinates) that earn their slot early. Splitting them aligns each subblock with its rhetorical purpose.

### 3.3 V6 13.3 cyan margin tick added to the pulse pill

Per spec ("the cyan-tick'd pulse pill"): the pulse pill in the signature block gets a 1×12 px cyan margin tick to its left, anchored via the `.margin-tick` CSS class from V6 11.5.

```jsx
<div className="flex items-baseline gap-3">
  <span aria-hidden="true" className="margin-tick mt-1 shrink-0" />
  <p className="inline-flex items-center … rounded-full border …">
    <span … cyan dot … />
    <span>Build window · open</span>
    …
  </p>
</div>
```

The margin tick visually anchors the pulse pill as a deliberate signature element, distinguishing it from other rounded-pill chips elsewhere on the page. This is the second deployment of the margin-tick motif beyond the about-page Cinematic Pause and Atmospheric Breath (where 11.5 originally mounted it).

### 3.4 dt/dl read-out: left border retoned from white/06 to cyan/20

V5's dt/dl block had `border-l border-white/[0.06] pl-5`. The V6 13.3 layout retones this to `border-l border-[#00d2ff]/[0.20] pl-5` — same structural border, recoloured to cyan at 20 % opacity. This keeps the signature block visually unified with the pulse pill above (both share the cyan-margin-tick vocabulary).

This is a minor retoning, not a structural change. The dt/dl content (Field / Build / Reading / Stance) is preserved verbatim from V5.

### 3.5 Hero lead rewrite (Sub-PR 13.3a)

Per spec:

> AFTER: "The work began behind 01:30 bakery shifts and finished after school days. Two years on, the discipline is what remains — the rest is production AWS infrastructure, AI-native tooling, and full-stack systems, designed on time horizons measured in years from a small desk in Adana."

The V6AboutPage hero paragraph renders this verbatim. The H1 ("Built slowly. / On purpose.") is preserved from V5.

V5 lead structure: name → expertise → place → tail (bakery in past tense).
V6 lead structure: bakery → discipline arc → expertise → place.

Same content, inverted clause order. The identity vector arrives first; the expertise list arrives second. The bakery sentence is now the FIRST clause of the FIRST sentence — no longer buried.

### 3.6 Outside The Terminal section: removed from V6, preserved in legacy

V5's Outside The Terminal section (Training / Motorcycle / Reading / Codex tiles) is REMOVED from `V6AboutPage` entirely. The LIFESTYLE constant at module scope is preserved for `LegacyAboutPage`'s rollback path.

Per spec ("see Sub-PR 13.5"): the content migrates to a dedicated `/pulse` route in 13.5. Until 13.5 ships, the lifestyle content lives only in the legacy V5 rendering — visitors on the V6 flag-on path don't see it.

The spec accepts this gap: "Page length reduced by ~1.5 viewports (Outside The Terminal moved out)" is a validation criterion, meaning the removal is the intended effect. 13.5 is the next sub-PR in sequence, so the gap is brief.

### 3.7 Specializations compression — drop edge-lit-card, single chip line

V5's Specializations renders each spec inside an edge-lit-card (`cardSurface()` from 11.3) with a 3-col internal grid: title + body + chip array (wrapping to multiple lines). Per spec ("compress to a single paragraph + chip line per spec; reduces vertical sprawl"), the V6 layout:

- Drops the per-spec edge-lit-card. Each spec renders as an article inside a divider-line list.
- 2-col grid on md+: title (col 1) + body + chip line (col 2).
- Chip line renders chips as inline mono labels separated by `·` dots, on a SINGLE row (`flex-wrap` with small horizontal gaps). No `border` chip container — the chips are typographic, not chip-shaped.
- Vertical breathing between specs reduced to ~64 px (was ~140 px).

Estimated savings: ~250 px vertical (3 specs × ~80 px savings each).

The compression keeps all content — title, body, every keyword — but renders it in a quieter, more editorial composition.

### 3.8 Sections preserved verbatim from V5

The following sections render with V5 content unchanged (just reordered):

- Cinematic Pause (with 11.5 margin tick already in place).
- Operating Philosophy (asymmetric 1+3 tile layout).
- In Flight (live builds list).
- Receipts (GitHub heatmap with cyan halo).
- Principles (4 numbered tiles with cyan stage glow).
- Currently (dt/dl rows).
- Atmospheric Breath ("What keeps the noise low" with 11.5 margin tick).
- Closing H2 + CTAs (preserved minus the moved pulse pill + dt/dl).

No section content is rewritten beyond the hero lead. The compression on Specializations is structural (drop card surface, compress chip rendering), not content.

### 3.9 LCP unchanged — hero stays at top of file

Spec validation: "LCP unchanged; hero remains at top of file."

The V6AboutPage hero is the first rendered block in the page DOM. The H1 + paragraph are server-rendered from static data. No new async fetch, no new image. LCP element is the H1 — same as V5.

### 3.10 Page atmosphere unchanged (editorial variant from 11.1)

Both `LegacyAboutPage` and `V6AboutPage` mount the same `<PageAtmosphere variant="editorial" legacy={…}>` — atmosphere doesn't shift with the flag.

### 3.11 Margin-tick guard still respects V6_MARGIN_TICK flag

The Cinematic Pause and Atmospheric Breath sections in `V6AboutPage` continue to gate their margin ticks on `isMarginTickEnabled()` (from V6 11.5). The new tick on the Signature pulse pill (§ 3.3 above) is unconditional — it's a V6 13.3 element, gated by `V6_ABOUT_RESTRUCTURE` only.

This means with `V6_ABOUT_RESTRUCTURE=1` and `V6_MARGIN_TICK=0`, the signature pulse pill carries the cyan tick but the Cinematic Pause and Atmospheric Breath don't. Slight inconsistency, but each tick is independently flag-controlled per the spec's per-sub-PR rollback discipline.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `app/about/page.tsx` | Wholesale refactor into a flag-gated default export. The previous `AboutPage` function renamed to `LegacyAboutPage` (preserving V5 layout byte-for-byte). New `V6AboutPage` function added at the end of the file with 11 sections in the new order: HERO (rewritten lead) / SIGNATURE BLOCK / CINEMATIC PAUSE / OPERATING PHILOSOPHY / IN FLIGHT / RECEIPTS / PRINCIPLES / SPECIALIZATIONS (compressed) / CURRENTLY / ATMOSPHERIC BREATH / CLOSING H2+CTAs. Outside The Terminal section excluded from V6. New default export branches on `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE`. |

### 4.2 No new files, no new dependencies

13.3 is purely a reorder + lead rewrite + compression operation on a single file. No new components, no new data, no new dependencies, no new asset.

### 4.3 Shared constants preserved

`PHILOSOPHY`, `LIFESTYLE`, `PRINCIPLES`, `SPECIALIZATIONS`, `CURRENTLY`, `FEATURED` arrays remain at module scope. `LIFESTYLE` is unused by V6 but preserved for the legacy rollback path — removing it would break the legacy render.

---

## 5. About redesign rationale

Pre-13.3 page flow (V5):
```
HERO ──→ CINEMATIC PAUSE ──→ OPERATING PHILOSOPHY ──→
OUTSIDE THE TERMINAL ──→ ATMOSPHERIC BREATH ──→
PRINCIPLES ──→ SPECIALIZATIONS ──→ CURRENTLY ──→
RECEIPTS ──→ IN FLIGHT ──→ CLOSING TRANSMISSION (signature + CTAs)
```

A visitor reads it top to bottom and the strongest signal — the operator's coordinates — arrives at the end. Bounce risk: high. The first paragraph leads with credentials, not identity.

Post-13.3 page flow (V6 flag on):
```
HERO (bakery first) ──→ SIGNATURE BLOCK (pulse pill + dt/dl) ──→
CINEMATIC PAUSE ──→ OPERATING PHILOSOPHY ──→ IN FLIGHT ──→
RECEIPTS ──→ PRINCIPLES ──→ SPECIALIZATIONS (compressed) ──→
CURRENTLY ──→ ATMOSPHERIC BREATH ──→ CLOSING H2 + CTAs
```

A visitor reads it top to bottom and:
1. **First sentence:** the bakery sentence (identity vector).
2. **First fold:** the H1 + lead paragraph (identity + expertise).
3. **Second fold:** the operator's coordinates (Build window, Adana, Reading, Stance).
4. **Third fold:** the cinematic pause (the page's thesis line).
5. **The rest:** philosophy, live work, receipts, principles, specializations, currently, breath, closing.

The first three folds carry every signal that matters: identity, expertise, coordinates, thesis. A visitor who bounces after the third fold still leaves with the operator's position read correctly.

---

## 6. Reading-density improvements

V5 about-page section heights (≈ lg viewport):

| Section | V5 height | V6 height | Delta |
|---------|-----------|-----------|-------|
| HERO | ~520 px | ~520 px | 0 (preserved, lead rewritten) |
| CINEMATIC PAUSE | ~260 px | ~260 px | 0 |
| OPERATING PHILOSOPHY | ~520 px | ~520 px | 0 |
| OUTSIDE THE TERMINAL | ~440 px | — | **−440 px** (removed) |
| ATMOSPHERIC BREATH | ~360 px | ~360 px | 0 (moved to section 10) |
| PRINCIPLES | ~520 px | ~520 px | 0 |
| SPECIALIZATIONS | ~720 px | ~480 px | **−240 px** (compressed) |
| CURRENTLY | ~360 px | ~360 px | 0 |
| RECEIPTS | ~580 px | ~580 px | 0 |
| IN FLIGHT | ~440 px | ~440 px | 0 |
| CLOSING TRANSMISSION | ~860 px | — | replaced |
| SIGNATURE BLOCK | — | ~360 px | new, moved up |
| CLOSING H2 + CTAs | — | ~440 px | replaces V5's Closing Transmission |
| **Total** | **~5 580 px** | **~4 800 px** | **−780 px (~1.4 viewports)** |

Spec target: "Page length reduced by ~1.5 viewports." Actual: ~1.4 viewports — within tolerance. The two compressions land where expected: −440 px (Outside The Terminal removed) + −240 px (Specializations compressed) + −100 px (Closing Transmission split — pulse pill + dt/dl moved up rather than duplicated).

---

## 7. Typography impact

No new font, no new weight. The 13.3 changes touch:

- **Hero paragraph:** rewritten copy at the same `text-base md:text-lg` body size as V5.
- **Signature block H2:** "Coordinates of practice." at `text-3xl md:text-4xl font-medium tracking-[-0.03em]` — same scale as Operating Philosophy / Principles / Specializations H2s in V5. The signature block aligns visually with the other top-level sections.
- **Specializations title:** retained at `text-base md:text-lg` (same as V5's per-card title size, no longer wrapped in a card so it sits flush with the body in a 2-col grid).
- **Specializations chips:** rendered as `font-mono uppercase tracking-[0.18em] text-[10px]` inline tokens with `·` separators — replacing the V5 chip-shape pill rendering.

Canonical V6 text-token ramp from 11.4 preserved throughout.

---

## 8. Mobile impact

The V6 reorder preserves readability on mobile:
- **Hero:** unchanged in size; rewritten paragraph is the same byte length as V5 (~280 chars vs ~290 chars).
- **Signature block:** pulse pill wraps below the margin tick on narrow viewports (already `flex items-baseline gap-3`). dt/dl 80px label column is comfortable on 375 px viewports.
- **Specializations compression:** the 2-col grid collapses to single-column on `< md` — title above body + chip line. The chip line still renders inline (with `flex-wrap`) so chips break to multiple rows on narrow viewports.
- **Section ordering:** identical on mobile and desktop. No section is hidden on mobile.

The mobile scroll is roughly 780 px shorter on V6 than V5 — visitors reach the closing CTA faster.

---

## 9. Accessibility verification

- All H2 elements preserved (eyebrow + h2 pattern across every section). Heading order: H1 → H2 (×9 in V6, was ×10 in V5).
- The dt/dl signature read-out uses semantic `<dl> / <dt> / <dd>` markup — screen readers announce as "description list."
- All Links and CTAs preserved verbatim.
- The new margin tick on the pulse pill carries `aria-hidden="true"` (decorative).
- Reduced-motion: all existing Reveal motion respects `useReducedMotion()` (unchanged from V5).

Tab order on V6:
1. (no focusable in HERO).
2. (no focusable in SIGNATURE BLOCK).
3. (no focusable in CINEMATIC PAUSE).
4. (no focusable in OPERATING PHILOSOPHY tiles — non-interactive).
5. IN FLIGHT — 3 project Links.
6. (no focusable in RECEIPTS heatmap — GithubActivity client island has its own focus handling).
7. (no focusable in PRINCIPLES tiles — non-interactive).
8. (no focusable in SPECIALIZATIONS — non-interactive).
9. (no focusable in CURRENTLY).
10. (no focusable in ATMOSPHERIC BREATH).
11. CLOSING — 2 CTA Links (Get in touch + See the work).

Total: 5 focusable elements in DOM order. Same as V5.

---

## 10. Performance impact

### 10.1 Bundle delta

- Source delta: ~370 lines added to `app/about/page.tsx` (V6AboutPage function + comments).
- Compiled delta: ~3 KB after minification, ~1 KB gzipped.
- Tree-shaking: the V6 branch and the legacy branch coexist; webpack/turbopack inline the `process.env.NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` check and dead-code-eliminate the unused branch in production builds.
- Net client JS delta: 0 bytes (Server Component, no client island added by 13.3).

### 10.2 LCP

The H1 stays at the top of the file. LCP target unchanged from V5 (the H1 "Built slowly. / On purpose." renders in the first paint).

### 10.3 Hydration

`NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` is inlined at build time. Server and client render identical structures. No hydration mismatch surface.

### 10.4 Image weight

V6 uses the same images as V5 (the GithubActivity client island, the page atmosphere). No new image asset. Image weight unchanged.

---

## 11. Reduced-motion verification

V6AboutPage uses the same Reveal motion entrance pattern V5 used. Each `<Reveal>` wraps a section; the underlying `Reveal` component uses motion/react with `useReducedMotion()` (unchanged from V5).

The margin ticks (Cinematic Pause, Atmospheric Breath, Signature pulse pill) are static — no animation surface.

The dt/dl border, the pulse pill border, the chip line — all static CSS with no transition. Reduced-motion safe by construction.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Page length reduced by ~1.5 viewports | ✅ Net ~780 px (~1.4 viewports) reduction across the lg-viewport scroll. Outside The Terminal (−440 px) + Specializations compression (−240 px) + Closing Transmission split (−100 px) = ~780 px. |
| LCP unchanged; hero remains at top of file | ✅ H1 renders in the first paint at the page's top; server-rendered static content; no async fetch. |
| Mobile: section reordering preserves readability | ✅ All sections collapse to single-column on `< md`. Pulse pill + margin tick lay out via `flex items-baseline gap-3`. dt/dl 80px label column comfortable at 375 px. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 13.2 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 7.2 s. TypeScript 7.1 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` unset → `LegacyAboutPage` renders byte-for-byte with V5 layout including Outside The Terminal section. |
| Hero lead rewrite matches spec 13.3a | ✅ "The work began behind 01:30 bakery shifts and finished after school days. Two years on, the discipline is what remains — the rest is production AWS infrastructure, AI-native tooling, and full-stack systems, designed on time horizons measured in years from a small desk in Adana." — verbatim. |

---

## 13. Risk analysis

### 13.1 Risk: Outside The Terminal removal leaves a content gap until 13.5

The V6 layout doesn't render Outside The Terminal at all. Visitors on V6_ABOUT_RESTRUCTURE=1 see no path to the lifestyle content (Training / Motorcycle / Reading / Codex tiles) until Sub-PR 13.5 creates `/pulse`.

**Mitigation:** the spec accepts this gap ("Removed: Outside The Terminal moved entirely to a small footer-of-About strip OR to a dedicated /pulse route (see Sub-PR 13.5)"). The next sub-PR in sequence (13.5) creates `/pulse` and adds a footer link. The operator can choose to delay the V6 flag flip until 13.5 ships, OR flip immediately and accept a brief gap.

The LegacyAboutPage retains the section in source so rollback restores the content immediately if needed.

### 13.2 Risk: Signature block H2 ("Coordinates of practice.") competes with the Hero H1

The V6 layout has two top-of-page H2-scale elements: the hero H1 ("Built slowly. / On purpose.") and the signature H2 ("Coordinates of practice."). Both arrive within the first viewport on lg+.

**Mitigation:** the H1 uses `text-5xl md:text-7xl` (display-scale); the signature H2 uses `text-3xl md:text-4xl` (section-scale). Visually distinct hierarchy. The signature block also has an eyebrow ("Signature") above the H2 — same vertical rhythm as every other section.

### 13.3 Risk: Specializations compression loses the "premium card" feel

V5's Specializations used the edge-lit-card surface from 11.3 — a polished premium container. V6's compressed version uses divider lines instead.

**Mitigation:** the compression IS the spec's mandate ("reduces vertical sprawl"). The premium card aesthetic was part of the audit § 1.3 glassmorphism concern — V6 prefers calm composition over decorated cards. The divider-line list reads as editorial, which matches the about page's tone.

### 13.4 Risk: signature block dt/dl cyan-tinted border may look heavy

V5's dt/dl had `border-l border-white/[0.06]` — very subtle. V6 13.3 retones to `border-l border-[#00d2ff]/[0.20]` — same width, cyan at 20 % opacity. Slightly more visible.

**Mitigation:** the cyan border at 20 % is calibrated against the cyan margin tick (30 % opacity) and the cyan pulse dot (80 %) within the same block. The three cyan elements form a visual rhythm of increasing intensity (border → tick → dot). The 20 % border reads as part of that rhythm, not as a heavier element.

### 13.5 Risk: margin tick on pulse pill not visible if `.margin-tick` CSS isn't loaded

The `.margin-tick` class lives in `app/globals.css` from V6 11.5. If the V6 11.5 sub-PR's commit was somehow reverted, the class would be missing and the tick wouldn't render.

**Mitigation:** verified that `app/globals.css` contains `.margin-tick { … }` definition. The V6 11.5 commit is in branch history (`4735101`). The class is unconditional — it doesn't depend on `V6_MARGIN_TICK` flag (the FLAG only gates deployment of the tick at specific call sites; the CSS class itself is always available).

### 13.6 Risk: hero lead rewrite changes voice slightly

V5 lead: "I'm Emre Doğan. I design and operate production AWS infrastructure…" (first-person introduction).

V6 lead: "The work began behind 01:30 bakery shifts…" (third-person narrative).

The voice shifts from "I am X" to "The work began Y." Subtle but real.

**Mitigation:** the rewrite is the spec's exact wording per 13.3a. The voice shift is the intended effect — the page opens with the work's origin instead of the worker's introduction. The H1 ("Built slowly. / On purpose.") and the rest of the page voice are unchanged.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/about/_components/GithubActivity.tsx` | Receipts heatmap untouched; rendered identically in V6 and V5. |
| `app/notes/*` | Sub-PR 13.1 territory. |
| `app/codex/*` | Sub-PR 13.2 territory. |
| `/pulse` route | Sub-PR 13.5 territory. |
| `LegacyAboutPage` (rollback path) | Preserved verbatim per spec rollback contract. |
| `LIFESTYLE` constant at module scope | Used by `LegacyAboutPage` for Outside The Terminal section. Preserved for rollback. |
| Page atmosphere (editorial variant from 11.1) | RED LINE — atmosphere logic untouched. |
| Pill primitive, glass primitives, margin tick, text-token ramp | Used by reference (`.margin-tick`, `cardSurface()`, `secondaryButton()`), not modified. |
| Lumina, HeroTopology, topology, motion grammar, footer, navbar, mobile drawer | RED LINE. |
| V4 / V5 systems / telemetry / data shapes / API routes | RED LINE. |
| `GithubActivity`, hero copy, principle tile content | All preserved verbatim — only hero lead paragraph rewritten per 13.3a. |

---

## 15. Rollback

### 15.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE=0
```

`<AboutPage />` falls through to `<LegacyAboutPage />`. The V5 11-section layout including Outside The Terminal renders exactly as it did before V6 13.3 ever touched the file.

### 15.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Removes the V6AboutPage function + the flag check, restores the original V5 `AboutPage` function. Single-file revert.

### 15.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- app/about/page.tsx` reverts just the file. No other paths depend on the new V6 layout (no new components, no new data, no shared module).

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 13.3 (13.2 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 13.2 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` unset) | ✅ |
| Off-flag visual: `LegacyAboutPage` byte-identical to V5 | ✅ |
| No client JS impact (Server Component, no new client island) | ✅ |
| No new dependency, no new file, no new data shape | ✅ |
| Reduced-motion: no new motion surface; existing Reveals preserve `useReducedMotion()` guards | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives, navbar / mobile drawer / footer, pill / glass / margin-tick / text-ramp, V4/V5 systems all untouched | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical output | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the V5 about page. The operator flips `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE=1` after the Phase 13 observation window confirms the reorder + lead rewrite + Outside The Terminal removal direction holds. The 13.5 `/pulse` route should land alongside the flip so visitors gain a path to the lifestyle content.

---

## 17. Before/After screenshot checklist

| # | Viewport | Flag | Path | Capture |
|---|----------|------|------|---------|
| 1 | 1280 × 800 | off | `/about` | V5 layout: HERO (V5 lead) → CINEMATIC PAUSE → … → CLOSING TRANSMISSION (signature at bottom). |
| 2 | 1280 × 800 | on  | `/about` | V6 layout: HERO (rewritten lead, bakery first) → SIGNATURE BLOCK (cyan-tick'd pulse pill + dt/dl) → … → CLOSING H2 + CTAs (no pulse pill / dt/dl at bottom). |
| 3 | 1280 × 800 | on  | `/about` (Specializations region) | Compressed list — title + body + inline mono chip line per spec, no edge-lit-card. |
| 4 | 1280 × 800 | on  | `/about` (sections 1-3) | First viewport: HERO + SIGNATURE BLOCK + start of CINEMATIC PAUSE — the strongest signal arrives early. |
| 5 | 375 × 667 | off | `/about` | V5 mobile stack. |
| 6 | 375 × 667 | on  | `/about` | V6 mobile stack: same section order; Outside The Terminal absent; Specializations compressed; signature block readable in second screen-fold. |

---

## 18. What 13.3 explicitly does NOT do

- ❌ No content rewrite beyond the hero lead paragraph (13.3a verbatim).
- ❌ No `/pulse` route creation (13.5 territory).
- ❌ No section-level spatial variation (Sub-PR 13.4 territory — Operating Philosophy stays as the only asymmetric layout in V6 13.3).
- ❌ No edits to `/notes`, `/codex`, or any other surface.
- ❌ No new font / new colour / new motion / new dependency / new asset.
- ❌ No edits to V4/V5 systems, Lumina, topology, atmosphere primitives, pill vocabulary, glass primitives, margin tick CSS, text-token ramp.
- ❌ No removal of `LegacyAboutPage` (preserved for off-flag rollback).
- ❌ No removal of `LIFESTYLE` constant from source (legacy depends on it).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.
- ❌ No edits to `GithubActivity` client island.
- ❌ No retoning of Operating Philosophy tile colours, Principles cyan stage glow, or Receipts cyan halo.

Single sub-PR. One file refactored. Section order inverted around the operator's coordinates. Lead rewritten. Compressed where the spec mandates. Removed where 13.5 will reclaim.

---

## 19. V6 Phase 13 — exit-progress

After Sub-PR 13.3: 3 / 5 Phase 13 sub-PRs landed.

Remaining (per V6 § 4.2):

- 13.4 — About Page: Section-Level Spatial Variation (`V6_ABOUT_SPATIAL_VAR`).
- 13.5 — Move "Outside The Terminal" To `/pulse` (`V6_PULSE_EXTRACTION`).

Phase 13 exit (§ 4.3) requires all 5 sub-PRs merged + About-page completion-rate improving + Notes hub visit time stable or up + Codex hub click-through improving.

---

## 20. Closing

V6 Sub-PR 13.3 is **the about page finally leading with what matters**. The 01:30 bakery shifts open the page in the first sentence of the first paragraph. The operator's coordinates — Build window, Adana, GMT+3, what's being built today, what's being read, the stance — arrive by the second screen-fold instead of the eleventh.

The page is ~1.4 viewports shorter. Outside The Terminal — the lifestyle tiles that interrupted the engineering pacing — is gone (briefly, until Sub-PR 13.5 lands `/pulse`). Specializations compresses from per-card stacks into a clean editorial divider list.

No new font. No new colour. No new motion grammar. No new dependency. The redesign moves through pure reordering + a single-paragraph rewrite + composition compression — exactly what the audit calls for.

Same systems. Same palette. The page now reads in the order it should have read all along.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
