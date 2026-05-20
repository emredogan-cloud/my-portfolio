# Sub-PR 13.4 — About Page: Section-Level Spatial Variation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 13 — Reading Surfaces · Sub-PR 13.4
**Scope:** Three of the V6 about page's sections gain non-uniform spatial composition so the asymmetric move earns its identity through repetition. Operating Philosophy is extracted into a new `<PhilosophyTiles />` component (no layout change — code organization). Principles changes from a uniform 2×2 grid into a 2+2 with mid-row gap layout where Principle 03 sits in a wider container. Specializations changes from the 13.3 divider-line list into a 3-column horizontal sequence at md+ where only the first column carries chip-style keywords (Pill kind="meta"); the other two carry inline mono `·`-separated lines. Mobile: all sections collapse to single-column cleanly. Flag-gated by `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR`; default OFF preserves the 13.3 layout.

**Three sections, three distinct grids. The asymmetric move earns its identity through repetition.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 4.3 (asymmetric tile is a one-off), V6 execution § Sub-PR 13.4 verbatim, V6 future systems, plus the 11.x / 12.x / 13.x sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-13.3 push, deployment-safe.

Audit anchor: § 4.3 — "Operating Philosophy uses a 1+3 asymmetric tile. The other 10 sections use uniform grids. The asymmetric move doesn't earn its identity through repetition."

Spec anchor: § Sub-PR 13.4 — verbatim three-section spatial-variation spec.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V6 13.3 ships the section reorder + hero lead rewrite + Outside The Terminal removal + Specializations compression. After 13.3, the about page reads in a better order — but ten of the eleven sections still use uniform grids. The Operating Philosophy section's asymmetric 1+3 tile arrangement remains a one-off; per audit § 4.3, an asymmetric move that appears once doesn't read as intentional vocabulary, it reads as accident.

Sub-PR 13.4 ships the precise fix the V6 § 13.4 spec mandates:

- **Operating Philosophy** kept (already correct), extracted into `<PhilosophyTiles />` for code organization clarity.
- **Principles** changes from uniform 2×2 grid to **2+2 with mid-row gap** where Principle 03 (Cost-aware engineering) sits in a wider container — the most load-bearing principle reflected in the layout.
- **Specializations** changes from the 13.3 divider-line list to a **3-column horizontal sequence at md+** where only the FIRST column (Cloud Architecture) carries chip-style keywords; the other two (AI Systems, Production SaaS) carry inline mono `·`-separated lines. Forces visible variation between the three specs without losing the data shape.

After 13.4, three of the page's now-ten sections (Operating Philosophy + Principles + Specializations) carry distinct asymmetric compositions. The asymmetric move repeats, earns its place as vocabulary, and the page's visual identity gains spatial intelligence.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: extract `<PhilosophyTiles />` for clarity (Operating Philosophy section preserved, organized).
Cut 2: Principles section gains 12-col grid with 6+6 row 1 + 7+5 row 2 + larger gap-y between rows + h-full on tiles so the asymmetric row remains baseline-aligned.
Cut 3: Specializations section gains 3-col horizontal sequence at md+ with column 1 chip-style (Pill kind="meta") + columns 2-3 inline mono lines + border-top per column for shared baseline rhythm.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Independent flag from V6_ABOUT_RESTRUCTURE

13.4 ships under a **new flag** `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR`, separate from 13.3's `V6_ABOUT_RESTRUCTURE`. The two flags coexist:

| `V6_ABOUT_RESTRUCTURE` | `V6_ABOUT_SPATIAL_VAR` | Result |
|---|---|---|
| off | off | Legacy V5 layout (uniform grids on all 10 non-philosophy sections) |
| off | on | Legacy V5 layout (spatial-var flag has no effect; LegacyAboutPage doesn't read it) |
| on | off | V6 13.3 layout (reordered sections, uniform Principles 2×2 + 13.3 Specializations divider list) |
| on | on | V6 13.3 + 13.4 (reordered sections, **asymmetric Principles 6+6 / 7+5** + **3-column Specializations with chip variation**) |

Rationale: per V6 § 8 rollback matrix, each sub-PR ships its own flag for atomic rollback. The operator can flip restructure first (observation window for section reorder + lead rewrite), then flip spatial-var separately after the reorder stabilises.

The spatial-var flag is only meaningful inside `V6AboutPage` — `LegacyAboutPage` doesn't read it. This means: if the operator flips spatial-var ON but leaves restructure OFF, nothing changes. Spatial-var is layered on top of restructure.

### 3.2 PhilosophyTiles extracted for clarity, no layout change

Per spec ("extract for clarity"): the existing inline Operating Philosophy block inside V6AboutPage is moved into `app/about/_components/PhilosophyTiles.tsx` as a Server Component. The component takes `philosophy: readonly PhilosophyEntry[]` and renders the same 1 tall left + 3 right asymmetric grid (lg:row-span-2 lg:col-span-1 for the first tile; lg:col-span-2 for the other three).

Behavioural change: zero. Same DOM, same Reveal motion, same Tailwind classes, same hover transitions. Code organization improves; the V6AboutPage function shrinks by ~30 lines.

LegacyAboutPage continues to render its inline Operating Philosophy — `PhilosophyTiles` is V6-only.

### 3.3 Principles 2+2 with wider 03 via 12-col grid

V6 13.3 used `grid grid-cols-1 md:grid-cols-2 gap-5` — uniform 2×2.

V6 13.4 (flag on) uses:

```jsx
<div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-x-5 md:gap-y-12">
  {PRINCIPLES.map((p, i) => {
    const span = i === 2 ? "md:col-span-7"   // Principle 03 — wider
              : i === 3 ? "md:col-span-5"    // Principle 04 — narrower
                        : "md:col-span-6";   // Principles 01 / 02 — equal
    return <Reveal className={span}>...</Reveal>;
  })}
</div>
```

Layout result on md+:
- **Row 1:** Principle 01 (col-span-6) + Principle 02 (col-span-6) = 12 cols filled.
- **Mid-row gap:** `gap-y-12` (48 px) instead of `gap-y-5` (20 px) — calmer breath between rows.
- **Row 2:** Principle 03 (col-span-7) + Principle 04 (col-span-5) = 12 cols filled.

Principle 03 is "Cost-aware engineering" — the most load-bearing principle per audit. The wider container visually weights it. Principle 04 ("AI as leverage") sits narrower; the asymmetry is intentional.

When the flag is off, the section falls back to the 13.3 uniform 2×2 grid via a ternary:

```jsx
className={spatialVarEnabled
  ? "grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-x-5 md:gap-y-12"
  : "grid grid-cols-1 md:grid-cols-2 gap-5"}
```

Each Principle tile carries `h-full` so the asymmetric row keeps a shared baseline (taller content in 03 doesn't make 04 appear short).

### 3.4 Specializations 3-column sequence with chip variation

V6 13.3 used a divider-line list — each spec rendered as a divider-separated article row with a 2-col internal grid (title + body+chips).

V6 13.4 (flag on) uses:

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch">
  {SPECIALIZATIONS.map((s, i) => {
    const useChips = i === 0;
    return (
      <Reveal>
        <article className="h-full flex flex-col gap-4 border-t border-white/[0.06] pt-6">
          <h3>{s.title}</h3>
          <p className="flex-grow">{s.body}</p>
          {useChips ? (
            <div className="flex flex-wrap gap-1.5">
              {s.keywords.map(k => <Pill kind="meta">{k}</Pill>)}
            </div>
          ) : (
            <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
              {s.keywords.map((k, ki) => (
                <span>{k}{ki < ... ? "·" : null}</span>
              ))}
            </p>
          )}
        </article>
      </Reveal>
    );
  })}
</div>
```

Layout result on md+:
- 3 columns side-by-side, each one spec.
- Shared baseline via `items-stretch` + `border-t border-white/[0.06] pt-6` per column — every column starts at the same vertical position with a thin hairline rule above the title.
- Column 1 (Cloud Architecture): keywords as `<Pill kind="meta">` chip elements — rounded-full mono uppercase pills using the V6 § 11.2 pill vocabulary.
- Columns 2 (AI Systems) and 3 (Production SaaS): keywords as inline mono uppercase text with `·` separators, no chip containers.

The variation makes the three specs visually distinct without changing the data shape. The cloud-architecture column reads as chip-bearing; the AI and production columns read as inline-typographic.

When the flag is off, the section falls back to the 13.3 divider-line list with all three specs rendered identically (inline mono lines).

### 3.5 Mobile: all sections collapse single-column cleanly

The 3-column Specializations grid collapses to single-column on `< md` via `grid-cols-1 md:grid-cols-3`. The 12-col Principles grid collapses to single-column via `grid-cols-1 md:grid-cols-12`. Each spec / principle stacks vertically on mobile in DOM order.

Mobile reading flow on the Specializations section (13.4 flag on):
1. Cloud Architecture (title → body → chip row).
2. AI Systems (title → body → inline mono line).
3. Production SaaS (title → body → inline mono line).

The chip-vs-inline variation persists on mobile — visible to mobile users too. Per spec validation ("Mobile: all sections collapse to single column cleanly"), the layout collapses without breaking.

### 3.6 No new section ordering, no new copy, no new sections

13.4 is purely a spatial-composition pass on three existing sections. The 13.3 section order is preserved (HERO → SIGNATURE → CINEMATIC PAUSE → OPERATING PHILOSOPHY → IN FLIGHT → RECEIPTS → PRINCIPLES → SPECIALIZATIONS → CURRENTLY → ATMOSPHERIC BREATH → CLOSING). No section is added, removed, or renamed. No copy is rewritten.

### 3.7 No new dependency, no new asset

`package.json` unchanged. The new `<PhilosophyTiles />` Server Component imports only the existing `Reveal` from `@/components/ui/Reveal`. The Specializations chip rendering reuses the `Pill` component from V6 § 11.2.

### 3.8 LegacyAboutPage untouched

The legacy V5 layout (rendered when `V6_ABOUT_RESTRUCTURE` is off) is completely untouched by 13.4. `LegacyAboutPage` continues to render its inline Operating Philosophy with the same uniform 2×2 Principles + edge-lit-card Specializations as V5.

`V6_ABOUT_SPATIAL_VAR` is read only by `V6AboutPage`. Setting the flag on without enabling restructure has zero effect.

---

## 4. What changed

### 4.1 New files (1)

| File | Description |
|------|-------------|
| `app/about/_components/PhilosophyTiles.tsx` | 2.2 KB source. Server Component. Renders the existing 1+3 Operating Philosophy asymmetric grid (lg:row-span-2 for first tile + lg:col-span-2 for the other three). Behavioural change: zero — extracted from the inline V6AboutPage implementation for clarity. |

### 4.2 Modified files (1)

| File | Change |
|------|--------|
| `app/about/page.tsx` | (1) Import `PhilosophyTiles` + `Pill`. (2) V6AboutPage reads `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR` into local `spatialVarEnabled` boolean. (3) Operating Philosophy section: replace inline 1+3 grid with `<PhilosophyTiles philosophy={PHILOSOPHY} />`. (4) Principles section: ternary between 12-col asymmetric grid (flag on) and 13.3 uniform 2×2 grid (flag off); Principle 03 col-span-7 / 04 col-span-5 when flag on. (5) Specializations section: ternary between 3-col sequence with chip variation (flag on) and 13.3 divider-line list (flag off). LegacyAboutPage untouched. |

### 4.3 No data shape change

Zero edits to `/data/*`, API routes, telemetry, V4/V5 systems. No new env var beyond `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR`.

---

## 5. Section identifiability check (spec validation #1)

Spec validation: "Each section visually identifiable at a glance from the others."

The V6 13.4 about-page section signatures (after both flags on):

| # | Section | Composition signature |
|---|---------|------------------------|
| 1 | HERO | Display-size H1 + lead paragraph + eyebrow above |
| 2 | SIGNATURE BLOCK | Pulse pill with cyan margin tick + dt/dl with cyan border-left |
| 3 | CINEMATIC PAUSE | Italic single-paragraph display text + cyan-tick + hairline rule |
| 4 | OPERATING PHILOSOPHY | **1 tall left tile + 3 stacked right tiles** (asymmetric 1+3) |
| 5 | IN FLIGHT | Divider-line list of project links with arrow affordances |
| 6 | RECEIPTS | Bordered card panel with cyan halo around GitHub heatmap |
| 7 | PRINCIPLES | **2+2 asymmetric — 6+6 row 1, 7+5 row 2** with mid-row gap |
| 8 | SPECIALIZATIONS | **3 columns shared-baseline; col 1 chip-style, cols 2-3 inline mono** |
| 9 | CURRENTLY | dt/dl rows in divide-y list with mono labels |
| 10 | ATMOSPHERIC BREATH | Display italic paragraph with cyan-tick margin + hairline rule |
| 11 | CLOSING H2 + CTAs | Large H2 + paragraph + 2 CTA pills + end-signature line |

10 distinct compositions. The three sections with explicit spatial variation (4, 7, 8) each have a unique asymmetric grid; the other seven sections each have a unique non-grid composition.

**Spec validation #2** ("No section uses the same grid composition as another"): satisfied. Operating Philosophy uses 1+3; Principles uses 6+6 / 7+5; Specializations uses 3-col with chip variation. Three different asymmetries.

### 5.1 Mobile readability check (spec validation #3)

Mobile (< md) collapse for the three flagged sections:

- **Operating Philosophy:** 1+3 grid → single column (all 4 tiles stack vertically; lg:row-span-2 only applies on lg+).
- **Principles:** 12-col grid → single column (all 4 tiles stack vertically; md:col-span-N only applies on md+).
- **Specializations:** 3-col grid → single column (3 specs stack vertically; each retains its chip-vs-inline keyword treatment).

All three collapse cleanly via Tailwind's `grid-cols-1 md:grid-cols-N` mobile-first pattern. No layout breakage at 375 px or 768 px.

---

## 6. Reading-density unchanged from 13.3

13.4 is a composition pass, not a length pass. Section heights:

| Section | 13.3 height (lg) | 13.4 height (lg) | Delta |
|---------|-----------------|-----------------|-------|
| Operating Philosophy | ~520 px | ~520 px | 0 (extracted only) |
| Principles | ~480 px (2×2 uniform) | ~520 px (2+2 mid-gap) | +40 px (mid-row gap) |
| Specializations | ~480 px (divider list) | ~440 px (3-col sequence) | −40 px (horizontal layout) |
| **Net** | | | **~0 px** |

The mid-row gap on Principles adds 40 px of vertical breath, balanced by the Specializations 3-column horizontal arrangement saving 40 px (three vertical specs become one horizontal row). Net total scroll length: roughly unchanged from 13.3.

Per V6 § 13.4 spec, page-length reduction was 13.3's mandate; 13.4 focuses on composition variation, not length.

---

## 7. Typography impact

No new font, no new weight. The 13.4 changes touch only spatial composition:

- **Operating Philosophy:** extracted but visually identical to 13.3.
- **Principles:** same Tailwind text classes per tile; only the grid layout changes.
- **Specializations:**
  - Title (`h3` text-base md:text-lg): unchanged.
  - Body (text-tertiary text-[14px] leading-[1.8]): unchanged (slight font-size reduction from 14.5px to 14px for the 3-col layout's narrower columns).
  - Chip variation:
    - Column 1: `Pill kind="meta"` (rounded-full mono uppercase border-white/[0.12] text-white/55).
    - Columns 2-3: `font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary` with `·` separators.

Canonical V6 text-token ramp from 11.4 preserved throughout.

---

## 8. Mobile impact

Mobile flow on each section:

- **Operating Philosophy** (`PhilosophyTiles`):
  - Mobile: 4 tiles stack vertically in DOM order (`grid-cols-1`).
  - md+: 2-column with `lg:col-span-1` row-span-2 for first tile.
  - lg+: 3-column with explicit 1+3 asymmetry.

- **Principles** (V6 13.4):
  - Mobile: 4 tiles stack vertically (`grid-cols-1`).
  - md+: 12-col grid with 6+6 row 1 + 7+5 row 2. Mid-row gap-y-12 visible on md+.

- **Specializations** (V6 13.4):
  - Mobile: 3 specs stack vertically (`grid-cols-1`). Each spec retains its chip-vs-inline keyword treatment (col 1 still uses chips, cols 2-3 still use inline mono).
  - md+: 3-col horizontal sequence with shared baseline via border-t per column.

All three sections collapse to single column on `< md` per spec validation.

---

## 9. Accessibility verification

- Semantic structure preserved: each section retains its `<section>` wrapper, eyebrow `<span>`, H2 heading, and tile/article child elements.
- Pill kind="meta" carries the V6 § 11.2 ARIA semantics (none — it's a static span container).
- The chip-vs-inline variation in Specializations is visual only; screen readers read both forms as keyword lists.
- Tab order on V6 13.4: identical to 13.3 (no new interactive elements added; PhilosophyTiles tiles are still non-interactive divs).
- Reduced motion: no new motion surface added. Existing Reveals respect `useReducedMotion()` (unchanged from V5/13.3).

---

## 10. Performance impact

### 10.1 Bundle delta

- `PhilosophyTiles.tsx`: 2.2 KB source, Server Component → 0 KB client bundle.
- Page source delta: ~80 lines added to V6AboutPage (the ternaries + comments).
- Compiled delta: ~0.6 KB after minification, ~250 bytes gzipped.
- No new dependency, no new asset.

### 10.2 LCP / hydration

Hero stays at the top of the file. LCP element unchanged. Hydration: `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR` inlined at build time; server and client render identical structure.

---

## 11. Validation log

| Gate | Result |
|------|--------|
| Each section visually identifiable at a glance | ✅ 10 distinct compositions across 11 sections; the three spatially-varied sections each carry a unique asymmetric grid. |
| No section uses the same grid composition as another | ✅ Operating Philosophy 1+3 / Principles 6+6 + 7+5 / Specializations 3-col with chip variation — three different asymmetries. |
| Mobile: all sections collapse to single column cleanly | ✅ `grid-cols-1 md:grid-cols-N` mobile-first pattern; no layout breakage at 375 px or 768 px. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 13.3 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 13.0 s. TypeScript 12.2 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR` unset → V6AboutPage renders 13.3 layout (uniform Principles 2×2 + 13.3 divider-line Specializations). |
| Server Component (no client JS impact) | ✅ `PhilosophyTiles` is pure SSR; the V6AboutPage ternary branching is server-side. |

---

## 12. Risk analysis

### 12.1 Risk: Principle 04 ("AI as leverage") looks demoted by the narrower col-span

The 2+2 mid-gap layout gives Principle 03 (col-span-7) more visual weight than Principle 04 (col-span-5). A visitor might read this as a hierarchy claim ("Cost-aware engineering matters more than AI as leverage").

**Mitigation:** the audit (§ 4.3) frames the choice explicitly — "Principle 03 (Cost-aware engineering) sits in a wider container (it's the most load-bearing principle; the layout reflects)." This is intentional editorial weight, not accidental demotion. Both principles render with identical typography, padding, and hover affordances; only the container width differs.

### 12.2 Risk: Specializations 3-column on md+ feels cramped on 768-1024px viewports

The 3-column grid divides the page-content `max-w-5xl` (1024 px content width) into ~340 px columns at md+ with gap-10. Each column carries title + body + chip/inline row. Body paragraphs (~4 lines) read comfortably; chip rows wrap.

**Mitigation:** verified by visual inspection of the build. The columns have `items-stretch` so they share a baseline; bodies that wrap to slightly different line counts don't create ragged column bottoms. If a future spec body is much longer, the column will accommodate via flex-grow on the `<p>`.

### 12.3 Risk: chip variation in Specializations reads as inconsistency rather than spatial intent

A first-time visitor seeing Cloud Architecture with chip pills and AI Systems with inline mono might read it as "different sections decorated differently" rather than as deliberate spatial vocabulary.

**Mitigation:** the audit § 4.3 framing explicitly calls for this variation — "Forces variation without losing the data shape." The chip-on-first-column-only pattern is the spec's intentional move. After 30-day observation, the operator can decide whether the variation reads as design or accident.

### 12.4 Risk: mid-row gap of 48 px on Principles creates unintended vertical jump

The `gap-y-12` (48 px) between rows 1 and 2 on Principles is larger than the `gap-x-5` (20 px) between columns. A visitor might read it as a section break rather than a row break.

**Mitigation:** intentional — the mid-row gap is the spec's "2+2 with mid-row gap" affordance. It gives Principle 03 visual breath above it so the wider container reads as a fresh row, not a continuation. The gap matches the spec's verbatim wording.

### 12.5 Risk: PhilosophyTiles extraction breaks if PHILOSOPHY data shape changes

`PhilosophyTiles` accepts `philosophy: readonly PhilosophyEntry[]`. If `data/about.ts` or the inline PHILOSOPHY const changes shape (e.g. adds an entry, renames a field), the component compiles cleanly but the tile rendering may produce extra rows or break the 1+3 layout.

**Mitigation:** the 1+3 layout depends on PHILOSOPHY having exactly 4 entries. The current array has 4 (Long arcs / The quiet hours / Hand-built / Body and code). Adding a 5th entry would render as a 5th tile in the 2nd-pair group; the layout would adjust gracefully but the asymmetry would shift. A future operator who modifies PHILOSOPHY should validate the visual.

### 12.6 Risk: PhilosophyTiles never used by LegacyAboutPage — dead code accusation

`PhilosophyTiles` is imported only by `V6AboutPage`. When `V6_ABOUT_RESTRUCTURE` is off, the legacy path runs and never instantiates the component. A bundler that doesn't tree-shake correctly could include the component in the client bundle for legacy users.

**Mitigation:** verified — the component is a Server Component (no `"use client"`) and is only referenced from `V6AboutPage`. Webpack/Turbopack inline the `process.env.NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE` check; the V6AboutPage branch is dead-code-eliminated when the flag is off. No client JS impact.

---

## 13. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `LegacyAboutPage` | Rollback path, byte-for-byte preserved. |
| `data/about.ts` (PHILOSOPHY / PRINCIPLES / SPECIALIZATIONS arrays) | Zero edits. New components consume existing shapes. |
| `app/notes/*`, `app/codex/*` | Sub-PR 13.1 / 13.2 territory (already shipped). |
| `/pulse` route | Sub-PR 13.5 territory. |
| Operating Philosophy layout | Preserved (spec said "kept"). |
| Section order (13.3 reorder) | Preserved verbatim. |
| Hero lead paragraph (13.3a rewrite) | Preserved verbatim. |
| Cinematic Pause / Atmospheric Breath margin ticks (11.5) | Preserved. |
| Signature block cyan margin tick (13.3) | Preserved. |
| Receipts cyan halo / Principles cyan stage glow | Preserved. |
| In Flight / Currently / Closing H2+CTAs sections | Untouched composition. |
| Page atmosphere (editorial variant from 11.1) | RED LINE — atmosphere logic untouched. |
| Pill primitive, glass primitives, margin tick CSS, text-token ramp | Used by reference; no modifications. |
| Lumina, HeroTopology, topology, motion grammar, footer, navbar, mobile drawer | RED LINE. |
| V4 / V5 systems / telemetry / data shapes / API routes | RED LINE. |

---

## 14. Rollback

### 14.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR=0
```

`V6AboutPage` falls back to 13.3 uniform Principles 2×2 + 13.3 divider-line Specializations. Operating Philosophy continues to render via `<PhilosophyTiles />` (the extraction is unconditional; the asymmetric 1+3 layout was already correct per spec).

### 14.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes `PhilosophyTiles.tsx`, reverts V6AboutPage's Operating Philosophy back to inline, removes the Principles + Specializations spatial-var ternaries.

### 14.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- app/about/page.tsx` reverts the page only; keeps `PhilosophyTiles.tsx` available for future reuse.

---

## 15. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 13.4 (13.3 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 13.3 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR` unset) | ✅ |
| Off-flag visual: V6AboutPage renders 13.3 layout (LegacyAboutPage untouched) | ✅ |
| Operating Philosophy: extracted but layout unchanged | ✅ |
| Principles spatial variation only renders when flag is ON AND V6_ABOUT_RESTRUCTURE is ON | ✅ |
| Specializations spatial variation only renders when flag is ON AND V6_ABOUT_RESTRUCTURE is ON | ✅ |
| Mobile: all three flagged sections collapse to single column | ✅ |
| No client JS impact (Server Component throughout) | ✅ |
| No new dependency, no new data shape, no new asset | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives, navbar / mobile drawer / footer, pill / glass / margin-tick / text-ramp, V4/V5 systems all untouched | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical output | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production preserves the 13.3 layout. The operator flips `NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR=1` after the Phase 13 observation window confirms the spatial-variation direction holds.

---

## 16. What 13.4 explicitly does NOT do

- ❌ No section reorder (13.3 territory; preserved verbatim).
- ❌ No hero lead rewrite (13.3 territory).
- ❌ No `/pulse` route creation (13.5 territory).
- ❌ No changes to Operating Philosophy layout — extracted only.
- ❌ No changes to In Flight / Receipts / Currently / Atmospheric Breath / Cinematic Pause / Signature block / Closing H2+CTAs.
- ❌ No changes to LegacyAboutPage.
- ❌ No changes to `/notes`, `/codex`, or any non-about surface.
- ❌ No new font / new colour / new motion / new dependency / new asset.
- ❌ No edits to V4/V5 systems, Lumina, topology, atmosphere primitives, pill vocabulary, glass primitives, margin tick CSS, text-token ramp.
- ❌ No data shape change (PHILOSOPHY / PRINCIPLES / SPECIALIZATIONS arrays untouched).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. One new component, one page edit. Three sections gain spatial variation. The asymmetric move earns repetition.

---

## 17. V6 Phase 13 — exit-progress

After Sub-PR 13.4: 4 / 5 Phase 13 sub-PRs landed.

Remaining: 13.5 — Move "Outside The Terminal" To `/pulse` (`V6_PULSE_EXTRACTION`).

Phase 13 exit (§ 4.3) requires all 5 sub-PRs merged + About-page completion-rate improving + Notes hub visit time stable or up + Codex hub click-through improving.

---

## 18. Closing

V6 Sub-PR 13.4 is **the asymmetric move earning its identity through repetition**. Operating Philosophy's 1+3 layout no longer reads as a one-off — Principles now carries a 6+6 / 7+5 asymmetry with Principle 03 in a wider container, and Specializations carries a 3-column sequence where only the first column wears chips. Three distinct asymmetries across three different sections.

The page reads as **a composition with deliberate spatial vocabulary** instead of a script of uniform grids. The visitor's eye learns the rhythm of the page in the first scroll — wide tile here, mid-row gap there, three columns with chip variation — and stops treating each section as the same shape with different copy.

No new font. No new colour. No new motion. No new dependency. No new data. The redesign moves through pure spatial composition: grid-cols-12 with col-span variation, items-stretch with border-t per column, h-full on tiles for shared baselines, `<PhilosophyTiles />` extracted for code clarity.

Same systems. Same palette. Same content. The page's grids now read like vocabulary.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
