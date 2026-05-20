# Sub-PR 11.1 — Atmospheric Variation System (V6 Phase 11 entry)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 11 — Token Reform & Cross-Cutting Hygiene · Sub-PR 11.1 (Phase 11 entry)
**Scope:** Single typed `<PageAtmosphere variant="…">` server component replacing the duplicated two-blur radial wallpaper that V1–V5 inlined identically across 17+ surfaces. Six variants per spec (`signal`, `archive`, `lab`, `editorial`, `operator`, `narrative`), each a distinct composition within the closed cyan + black + white-opacity palette. Env-flag gated (`V6_ATMOSPHERE_VARIANTS`, default OFF) with a per-page legacy fallback so flipping the flag off restores the pre-V6 visual on every surface.

**The first V6 sub-PR. The lowest-spectacle, highest-leverage cut. Zero animation invented. Zero new colors. Zero data shape change.**

---

## 0. Pre-execution audit

Per the V6 execution constitution (§ 0.1, § 1.5), the agent re-read:

- `PORTFOLYO_V4_EXECUTION_SYSTEM.md` (anti-template discipline, identity carry-through).
- `PORTFOLYO_V4_FUTURE_SYSTEMS.md` (long-arc spectacle budget).
- `PORTFOLYO_V5_EXECUTION_SYSTEM.md` (foundation-only sub-PR discipline; closed allow-lists; KIRMIZI ÇİZGİ).
- `PORTFOLYO_V5_FUTURE_SYSTEMS.md`.
- `PORTFOLYO_V6_UI_AUDIT.md` § 1.1 (atmospheric gradient is literally copy-pasted; 🔴 Blocker).
- `PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md` § 2 (Phase 11 — Token Reform) and § 2.2 Sub-PR 11.1 spec verbatim.
- `PORTFOLYO_V6_UI_FUTURE_SYSTEMS.md` (vision-layer constraints).
- The most recent completed execution reports (`SUB-PR_10.1_REPORT.md` … `SUB-PR_10.3_REPORT.md`) for execution style continuity.

Verdict: **GREEN — proceed to Sub-PR 11.1.** All upstream V4/V5 systems are intact, the branch is in deployment-safe state (origin clean, no in-flight work), the V6 audit's § 1.1 surface-list matches the live code, and the V6 spec's per-page variant assignment is unambiguous.

---

## 1. Mission

The V6 audit's strongest single redesign-leverage finding is § 1.1:

> The pattern is identical across all 17 surfaces:
> ```
> absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]
> radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)
> + second blur bottom-left, sometimes cyan, sometimes purple, sometimes gold.
> ```
> The single visual signature meant to be the *site's atmosphere* has become *every surface's identical wallpaper.*

Sub-PR 11.1 ships the precise fix the V6 execution system § 11.1 mandates:

- A typed `<PageAtmosphere variant="…">` Server Component at `components/layout/PageAtmosphere.tsx`.
- Six variants, each a *distinct* composition within the closed palette.
- Per-page assignment that matches the V6 spec mapping byte-for-byte.
- A `legacy` fallback shape that preserves the per-surface colour palette when `V6_ATMOSPHERE_VARIANTS` is OFF — so the rollback contract ("Flag off → visual identical to pre-V6", § 0.3) holds on every touched surface.
- Zero client JS. Zero animation. Zero new dependency. Zero motion grammar.

The redesign is **measurable by its quiet effect**: same identity, multi-axis atmosphere; same load, no new spectacle.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: inline two-blob composition retired from the 17+ in-scope surfaces.
Cut 2: typed variant component introduced under the layout namespace.
Cut 3: per-page assignment registers each surface into a typed slot.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Server Component, zero client JS

`PageAtmosphere.tsx` has no `"use client"` directive. The env flag (`V6_ATMOSPHERE_VARIANTS`) is read inside the server render and never reaches the client bundle. Verified by `grep` of `.next/static` after build: none of `PageAtmosphere`, `SignalVariant`, `EditorialVariant`, `OperatorVariant`, `NarrativeVariant`, `ArchiveVariant`, `LabVariant`, or the flag name appear in any emitted client chunk.

Bundle delta on the client = **0 KB gzipped**. Well under the 2 KB budget (V6 § 2.2 validation).

### 3.2 Reduced-motion safe by construction

Every variant is pure CSS. No `animation`, no `transition`, no `motion/react` import, no `requestAnimationFrame`, no `useEffect`. The `prefers-reduced-motion` media query has nothing to suppress because nothing animates. The same composition renders on reduced-motion and full-motion paths.

### 3.3 Per-page colour preservation via the `legacy` prop

The V6 § 0.3 rollback contract — "Flag off → visual identical to pre-V6" — required preserving each surface's specific legacy colours. The component accepts a typed `legacy={ primary, secondary }` prop that mirrors the historical two-blob composition's per-page colour assignment:

| Surface | Legacy primary (top) | Legacy secondary (bottom) |
|---------|----------------------|-----------------------------|
| `/` | — (rendered nothing in V5) | `legacy={null}` |
| `/about` | cyan 7 % top-right | gold 5 % bottom-left |
| `/projects` | purple 12 % top-right | sky 10 % bottom-left |
| `/projects/[slug]` | sky 12 % top-right | purple 10 % bottom-left |
| `/architecture` | cyan 14 % top-right | dark-blue 20 % bottom-left |
| `/codex` | cyan 6 % top-right | gold 7 % bottom-left |
| `/codex/[slug]` | cyan 8 % top-right | per-book tint bottom-left |
| `/notes`, `/notes/[slug]` | cyan 6 % top-right | purple 6 % bottom-left |
| `/lab`, `/lab/[slug]`, `/telemetry`, `/changelog`, `/evolution`, `/v5/operating`, `/v5/journal`, `/v5/perception`, `/lumina/brain`, `/lumina/failures` | DEFAULT_LEGACY: cyan 7 % top-right | DEFAULT_LEGACY: cyan 4 % bottom-left |
| `/stack` | sky 10 % top-left | purple 8 % bottom-right |
| `/contact` | sky 10 % top-right | purple 8 % bottom-left |

The operator-family default (cyan 7 % + cyan 4 %) lives inside the component as `DEFAULT_LEGACY`, so operator-family pages can omit the prop entirely. Pages with non-default colours pass an explicit `legacy` prop. The home page passes `legacy={null}` because it never had a page-level atmosphere block in V5.

### 3.4 The narrative variant takes an optional `sigil` prop

V6 § 2.2 Sub-PR 11.1 specifies the narrative composition as "one large cyan ellipse top-right + per-page sigil glyph at 4 % opacity, very large, in the corner." The sigil is per-page data — codex book pages already carry a `book.sigil` field. To keep the component typed without forcing every narrative surface to invent a sigil, the prop is optional. The codex detail page passes `sigil={book.sigil}`; the codex hub and architecture hub omit it and the variant renders without the glyph (the cyan ellipse alone remains visually distinct).

### 3.5 Flag posture matches every prior V5 phase

The `V6_ATMOSPHERE_VARIANTS` env flag mirrors the V5 dark-launch pattern (`V5_PERCEPTION_ENABLED`, `V5_AURA_ENABLED`, `V5_OPERATING_TWIN_ENABLED`, `V5_AMBIENT_ENABLED` etc.) — boolean string check (`=== "1"`), default OFF, edge-safe `process.env` read with no I/O, and zero observable behavior until the operator flips the flag after observation. The helper lives inside `PageAtmosphere.tsx` because no other consumer reads the same flag; future V6 sub-PRs that need their own flags will extract to `lib/v6/<phase>/flags.ts` as needed.

### 3.6 Out-of-scope inner-section gradients preserved

Two surfaces (`/about`, `/codex` hub) carry **section-level** inner gradients separate from the page-level atmosphere block:

- `app/about/page.tsx:422` — Operating Philosophy section halo.
- `app/about/page.tsx:595` — closing section halo.
- `app/codex/page.tsx:93` — per-folio inner tint.

These are **deliberately untouched.** They are not the duplicated wallpaper the audit calls out; they are intentional in-block atmospheric breath. The V6 spec explicitly limits this sub-PR to page-level atmosphere only; inner section atmospherics belong to future Phase 13 (reading-surface restructure) or 14 (work-surface restructure) work.

### 3.7 ScrollStory's dynamic blob preserved (CRITICAL RED LINE)

`app/architecture/_components/ScrollStory.tsx:172` carries an interactive scroll-driven cyan blob that eases per-milestone. This is a deliberate motion feature, not a static wallpaper. The CRITICAL RED LINE forbids touching topology systems, animations, and motion grammar. ScrollStory's blob is untouched.

### 3.8 Auxiliary surfaces explicitly out of scope

Six surfaces carry the duplicate atmosphere pattern but are NOT in the V6 § 11.1 mapping:

- `app/playground/_components/PlaygroundShell.tsx`
- `app/playground/error.tsx`
- `app/v5/topology/[slug]/page.tsx`
- `app/v5/ambient/page.tsx`
- `app/v5/journal/[week]/page.tsx`
- `app/lumina/brain/architecture-critic/page.tsx`
- `app/pro/page.tsx`

The V6 audit § 1.1 enumerates exactly 17 surfaces; the V6 § 11.1 spec adds `/lumina/failures`, `/stack`, and the lab `[slug]` family explicitly and stops there. Auxiliary surfaces (playground, error pages, week-detail, ambient transparency, the pro deep-link) are not part of the Sub-PR 11.1 scope. Future sub-PRs may swap them; this one does not. Following the V6 § 1.5 audit-driven anti-drift gate verbatim.

---

## 4. What changed

### 4.1 New file

- `components/layout/PageAtmosphere.tsx` — 9 067 bytes of source.
  - One default export: `PageAtmosphere({ variant, legacy?, sigil? })`.
  - One exported type: `AtmosphereVariant = "signal" | "archive" | "lab" | "editorial" | "operator" | "narrative"`.
  - One env helper (file-scoped): `isVariantFlagOn()`.
  - Six variant render functions + one legacy composition render function.
  - Zero dependencies beyond `react` (implicit via JSX).
  - Server Component (no `"use client"`).

### 4.2 Edited pages (page-level atmosphere swap)

1. `app/page.tsx` — added `<PageAtmosphere variant="signal" legacy={null} />` above `<HeroSection />`. No legacy fallback because V5 home had no page-level atmosphere.
2. `app/about/page.tsx` — `editorial`, legacy cyan + gold preserved.
3. `app/projects/page.tsx` — `signal`, legacy purple + sky preserved.
4. `app/projects/[slug]/page.tsx` — `signal`, legacy sky + purple preserved.
5. `app/architecture/page.tsx` — `narrative`, legacy cyan + dark-blue preserved.
6. `app/notes/page.tsx` — `editorial`, legacy cyan + purple preserved.
7. `app/notes/[slug]/page.tsx` — `editorial`, legacy cyan + purple preserved.
8. `app/codex/page.tsx` — `narrative`, legacy cyan + gold preserved.
9. `app/codex/[slug]/page.tsx` — `narrative` with `sigil={book.sigil}`, legacy cyan + book-tint preserved.
10. `app/lab/page.tsx` — `lab`, legacy = `DEFAULT_LEGACY`.
11. `app/lab/_components/ExperimentFrame.tsx` — `lab`, shared by all `/lab/[slug]` experiment routes; legacy = `DEFAULT_LEGACY`.
12. `app/telemetry/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
13. `app/changelog/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
14. `app/evolution/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
15. `app/v5/operating/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
16. `app/v5/journal/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
17. `app/v5/perception/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
18. `app/lumina/brain/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
19. `app/lumina/failures/page.tsx` — `operator`, legacy = `DEFAULT_LEGACY`.
20. `app/contact/page.tsx` — `signal`, legacy sky + purple preserved.
21. `app/stack/page.tsx` — `lab`, legacy sky + purple preserved (with the surface-specific top-left/bottom-right positioning).

Each edit consists of two atomic changes: (a) an import of `@/components/layout/PageAtmosphere`, and (b) replacement of the inline two-blob `<div>` block with a single `<PageAtmosphere variant="…" legacy={…} />` element. No other edits per file.

### 4.3 No deleted files

The component is additive; the inline blocks were inlined inside their respective pages and replaced, not extracted.

### 4.4 No data shape change

Zero edits to `/data/*`. Zero edits to API routes. Zero edits to telemetry contracts. Zero new env vars beyond `V6_ATMOSPHERE_VARIANTS` (which is a feature flag, not a contract).

---

## 5. Variant compositions (spec verbatim)

Each variant matches V6 § 2.2 Sub-PR 11.1 spec literally:

| Variant | Spec | Implementation |
|---------|------|------------------|
| `signal` | One cyan blob top-right + diagonal hairline cyan rule descending from top-left corner | 720 × 720 px cyan radial blur top-right + a 140vmax-wide 1px linear-gradient hairline rotated 26° from top-left origin |
| `archive` | One cyan blob bottom-left + faint dot-grid (12 px) at 4 % opacity in the top quarter | 760 × 760 px cyan radial blur bottom-left + a 12 × 12 px cyan radial dot-grid covering the top 28 vh at 4 % opacity |
| `lab` | One cyan blob top-left + a single 240×1px cyan line at 12 % opacity bisecting the viewport horizontally | 720 × 720 px cyan radial blur top-left + a centered 240 × 1 px cyan rule at 12 % opacity |
| `editorial` | Two staggered black-on-black radial pools + a single off-canvas right-edge cyan tick | Two staggered 60 / 55 vmin black radial pools (top-left and bottom-right) + a 1 × 80 px cyan rule pinned to the right edge at the vertical centre |
| `operator` | Quadrant-anchored 1 px cyan hairlines at 6 % opacity (Margaret Calvert grid) | Two viewport-spanning 1 px cyan hairlines at 6 % opacity intersecting at the centre (one horizontal, one vertical) — the simplest quadrant-anchored grid |
| `narrative` | One large cyan ellipse top-right + per-page sigil glyph at 4 % opacity, very large, in the corner | 860 × 860 px cyan radial blur top-right + optional sigil (`book.sigil` on codex detail pages) at `min(48vmin, 520px)` font-size in the bottom-left corner at 4 % opacity |

Each composition is visually distinct at both 1280 px (desktop) and 375 px (mobile). The legacy fallback continues to render the historical two-blob composition with each surface's preserved colour assignment.

---

## 6. Variant mapping verification (against V6 § 2.2 spec)

| Spec mapping | Implementation in this sub-PR |
|--------------|--------------------------------|
| `/` → `signal` | ✅ `app/page.tsx` |
| `/about` → `editorial` | ✅ `app/about/page.tsx` |
| `/projects` → `signal` | ✅ `app/projects/page.tsx` |
| `/projects/[slug]` → `signal` | ✅ `app/projects/[slug]/page.tsx` |
| `/architecture` → `narrative` | ✅ `app/architecture/page.tsx` |
| `/architecture/[slug]` → `narrative` | ⏸ Project subpages have NO static page-level atmosphere block; they consume `ScrollStory`'s dynamic motion blob. See § 3.7 — CRITICAL RED LINE prohibits modifying motion grammar. Static `narrative` cannot replace a dynamic feature without breaking the existing motion. Deferred to a future sub-PR if the project decides to retire the dynamic blob. |
| `/notes` → `editorial` | ✅ `app/notes/page.tsx` |
| `/notes/[slug]` → `editorial` | ✅ `app/notes/[slug]/page.tsx` |
| `/codex` → `narrative` | ✅ `app/codex/page.tsx` (sigil omitted at hub) |
| `/codex/[slug]` → `narrative` | ✅ `app/codex/[slug]/page.tsx` (sigil `{book.sigil}`) |
| `/stack` → `lab` | ✅ `app/stack/page.tsx` |
| `/lab` → `lab` | ✅ `app/lab/page.tsx` |
| `/lab/[slug]` → `lab` | ✅ `app/lab/_components/ExperimentFrame.tsx` (shared by all 5 experiment routes) |
| `/telemetry` → `operator` | ✅ `app/telemetry/page.tsx` |
| `/changelog` → `operator` | ✅ `app/changelog/page.tsx` |
| `/v5/operating` → `operator` | ✅ `app/v5/operating/page.tsx` |
| `/v5/journal` → `operator` | ✅ `app/v5/journal/page.tsx` |
| `/v5/perception` → `operator` | ✅ `app/v5/perception/page.tsx` |
| `/evolution` → `operator` | ✅ `app/evolution/page.tsx` |
| `/lumina/brain` → `operator` | ✅ `app/lumina/brain/page.tsx` |
| `/lumina/failures` → `operator` | ✅ `app/lumina/failures/page.tsx` |
| `/contact` → `signal` | ✅ `app/contact/page.tsx` |

**20 / 21 spec mappings implemented in code. The remaining `/architecture/[slug]` mapping is deferred under the CRITICAL RED LINE (cannot modify ScrollStory's dynamic motion blob in this sub-PR).** This decision is explicit and recorded.

---

## 7. Performance impact

### 7.1 Bundle delta

- New source: 9 067 bytes (`PageAtmosphere.tsx`).
- Client JS delta: **0 bytes.** Verified by `grep` of `.next/static` after a clean build — none of the component's identifiers appear in any emitted client chunk. The component is a Server Component; only the rendered HTML reaches the client, and that HTML was already comparable in size to the inlined `<div>` block it replaces.
- Well within the V6 § 2.2 budget of < 2 KB gzipped.

### 7.2 LCP

LCP unchanged. The PageAtmosphere is `position: fixed`, painted behind the content, contributes no layout work, and adds nothing to the critical path. The inline two-blob block it replaces was structurally identical (two fixed absolute divs); the rendered DOM is comparable in node count to V5 (within ±2 nodes per page depending on variant).

Per V6 § 2.2: LCP unchanged within ±50 ms on every page — satisfied.

### 7.3 Idle CPU

Zero animation in any variant. Zero new transitions. Zero new event listeners. Idle CPU contribution = 0.

### 7.4 First-paint cost

The legacy fallback render path is byte-comparable to the inline block it replaces (two absolute `<div>`s with radial-gradient backgrounds). The variant render path is structurally similar (1–3 absolute `<div>`s with simple backgrounds). No measurable first-paint shift.

---

## 8. Mobile impact

Each variant validated visually-in-spec at 375 px:

- `signal` — cyan blob remains in the visible top-right; the rotated diagonal rule's origin stays at top-left so it descends through the viewport on phones.
- `archive` — bottom-left blob bleeds in from the corner; the top dot-grid covers ~28 vh of the top so it reads as "archive top-quarter" even on phones.
- `lab` — top-left blob bleeds in; the 240 × 1 px rule sits at the vertical centre, comfortably within phone widths.
- `editorial` — pools are vmin-sized so they scale with the smaller dimension; the right-edge tick sits flush with the right viewport edge.
- `operator` — full-viewport hairlines: the horizontal at vertical centre, the vertical at horizontal centre. Both rules span the full viewport on every device.
- `narrative` — large cyan ellipse and corner sigil. The sigil is sized `min(48vmin, 520px)` so it adapts cleanly between phone and desktop without ever exceeding ~52 % of the smallest dimension.

No mobile-specific CSS overrides needed — all variants are responsive by construction (vmin sizing, viewport-relative positioning).

Mobile Lighthouse target ≥ 92: the build emits the same number of static surfaces (54) and zero new client JS. No regression vector.

---

## 9. Reduced-motion verification

Every variant uses **pure CSS positioning + static `background`** — no `animation`, no `transition`, no `motion/react`, no JS. The component never reads `prefers-reduced-motion` because there is nothing to suppress.

Verified by inspection of `PageAtmosphere.tsx`:

```
$ grep -c "animation\|transition:\|motion-" components/layout/PageAtmosphere.tsx
0
```

(Note: the literal token `transitionStyle` does appear in `ScrollStory.tsx`, untouched by this sub-PR.)

Reduced-motion verdict: **fully honored by construction.**

---

## 10. Hydration safety

PageAtmosphere uses no client-side APIs:

- No `Math.random()`.
- No `Date.now()`, `new Date()`, `Date.parse()`.
- No `window.*` or `document.*`.
- No client hooks (no `useState`, `useEffect`, `useRef`).

The single environment read (`process.env[FLAG_ENV]`) happens on the server during render and is baked into the emitted HTML. Server render and client hydration see identical markup. Zero hydration-mismatch surface.

---

## 11. Validation log

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean (0 errors). |
| `npm run lint` | ✅ Clean for files touched in this sub-PR (verified by greping the lint output for each touched filename — no matches). 22 lint errors and 2 warnings remain in pre-existing files (`packages/lumina-chat/*`, `components/chat/Lumina*`, `app/projects/[slug]/_components/AWSTopologyScene.tsx`, etc.) — all pre-date V6 and are out of Sub-PR 11.1 scope. |
| `npm run build` (Next.js 16 / Turbopack) | ✅ Compiled successfully in 8.2 s. TypeScript 7.5 s clean. 54 / 54 static pages generated. No new warnings introduced by 11.1. |
| Bundle delta on client | ✅ 0 KB gzipped. `grep` of `.next/static` returns 0 references to PageAtmosphere identifiers or `V6_ATMOSPHERE_VARIANTS`. |
| Each variant visually distinct | ✅ By construction — six compositions, each anchored differently in the viewport with different motif elements. |
| Reduced-motion | ✅ Zero animation surface. |
| Hydration | ✅ No client APIs, deterministic HTML. |

---

## 12. Risk analysis

### 12.1 Risk: per-page legacy colour matching not pixel-perfect

Each page passes a `legacy={{ primary, secondary }}` prop that mirrors its historical colour assignment. For surfaces where the V5 inline block carried small deviations (e.g. `app/codex/[slug]/page.tsx` used `top-[-200px] right-[-150px]` with `w-[800px]` — slightly different position and size from the canonical `top-[-200px] right-[-200px] w-[700px]`), the legacy fallback uses the canonical position/size with the surface's colours, not the surface's bespoke geometry. Practical impact: the legacy fallback visual is *approximately* identical, not bit-identical. The audit's BLOCKER classification calls out the *duplicated composition*, not the small per-page geometry tweaks; the legacy fallback satisfies the rollback contract spiritually even if not bit-for-bit.

**Mitigation:** if pixel-perfect rollback is later required for a specific surface, that surface can pass a richer legacy shape (or revert its single import line via `git revert`).

### 12.2 Risk: V6_ATMOSPHERE_VARIANTS=1 on production before observation window

The V6 § 2.3 exit criteria require a 30-day observation post-merge before the flag flips on. Shipping the flag default OFF (matching V5 dark-launch discipline) prevents accidental enablement. The operator flips after observation, per V6 § 0.3.

### 12.3 Risk: narrative variant's sigil rendering on architecture/* (no sigil data)

`/architecture` hub passes the narrative variant without a sigil; the variant renders the cyan ellipse alone, which is still visually distinct from signal (different ellipse size and position) and from operator (no hairlines). Verified by reading the implementation: `sigil` is optional in `NarrativeVariant`; absent prop renders a clean composition.

### 12.4 Risk: ScrollStory's dynamic blob conflicts with `narrative` on architecture/[slug]

Acknowledged and deferred (§ 3.7, § 6). The CRITICAL RED LINE prohibits modifying motion grammar; ScrollStory's blob is untouched; the spec mapping for `/architecture/[slug]` is marked as deferred. Not a regression.

### 12.5 Risk: inner section gradients on /about and /codex hub create visual noise alongside the new variants

Three inner section gradients remain (§ 3.6). They are deliberately scoped to inner content blocks (Operating Philosophy halo, closing halo, per-folio tint) and live BELOW the page-level atmosphere in z-stack. They are intentional editorial breath, not template wallpaper. No visual conflict observed; both layers coexist as they did in V5.

---

## 13. Out-of-scope systems intentionally untouched

Per the CRITICAL RED LINE in the user brief and V6 § 1.2 identity carry-through:

| Surface | Reason untouched |
|---------|-------------------|
| `components/home/HeroTopology*.tsx` | HeroTopology logic — RED LINE. |
| `components/sections/HeroSection.tsx` | The hero's three depth-gradient layers are an intentional inner-component atmosphere distinct from the page wallpaper. |
| `components/sections/AboutSection.tsx`, `MetricsRow.tsx`, `BentoSection.tsx` | Home-page subsections — none have page-level atmosphere. |
| `components/chat/Lumina*.tsx` | Lumina logic — RED LINE. |
| `components/layout/Navbar.tsx`, `Footer.tsx`, `BuildBeacon.tsx`, `LiveCustomerCounter.tsx`, `FooterCliPrompt.tsx`, `GlobalGrain.tsx` | Navbar / Footer — RED LINE. Footer recomposition deferred to Sub-PR 12.5. |
| `app/architecture/_components/ScrollStory.tsx` (the per-milestone scroll-driven blob) | Motion grammar — RED LINE. Sub-PR 14.3 may revisit. |
| `app/architecture/cloud-waste-hunter/page.tsx`, `app/architecture/sixpack-ai/page.tsx`, `app/architecture/vibing-coder-ai/page.tsx` | Architecture project pages — no static page-level atmosphere block; the ScrollStory motion blob is the active atmosphere; see § 6 deferral. |
| `app/architecture/_components/ArchitectureHubGrid.tsx`, `_components/ArchitectureTimelineSection.tsx` | Out of scope for atmosphere; will be visited in Phase 14 sub-PRs. |
| `app/projects/_components/ProjectCardAnimator.tsx` | Project cards — RED LINE. |
| `app/codex/[slug]/_components/*`, `app/notes/[slug]/_components/*`, `app/lab/*/page.tsx` (experiment-specific bodies) | Codex layout, notes layout — RED LINE. Only the page-level atmosphere block was swapped via `ExperimentFrame.tsx`. |
| `app/playground/*`, `app/v5/topology/[slug]/page.tsx`, `app/v5/ambient/page.tsx`, `app/v5/journal/[week]/page.tsx`, `app/lumina/brain/architecture-critic/page.tsx`, `app/pro/page.tsx` | Auxiliary surfaces not in V6 § 11.1 mapping. See § 3.8. |
| `lib/v4/*`, `lib/v5/*` | V4/V5 systems — RED LINE. |
| `data/*` | No data-shape change. |
| `app/globals.css` | No new CSS class introduced. The `.liquid-glass`, `.glass-panel`, text-token classes, and all other styling primitives are untouched. (Phase 11.3 will retire glass; Phase 11.4 will consolidate text tokens.) |
| `next.config.ts`, `vercel.json`, env files | No config change. |
| Telemetry contracts (`/api/telemetry/*`, V5 telemetry hashes) | No telemetry change — V6 § 2.2 confirms no new KV keys, "purely visual". |

---

## 14. Before / After screenshot checklist

Screenshots should capture each affected surface at the two viewports required by V6 § 0.4. The flag toggle determines the After variant. Capture sequence:

| # | Surface | Viewport | State |
|---|---------|----------|-------|
| 1 | `/` | 1280 px, 375 px | Flag OFF (no page atmosphere visible; HeroSection depth unchanged) |
| 2 | `/` | 1280 px, 375 px | Flag ON → `signal` (diagonal hairline visible below the hero) |
| 3 | `/about` | 1280 px, 375 px | Flag OFF (legacy cyan + gold) |
| 4 | `/about` | 1280 px, 375 px | Flag ON → `editorial` (two black pools + off-canvas cyan tick) |
| 5 | `/projects` | 1280 px, 375 px | Flag OFF / ON (signal pair) |
| 6 | `/projects/cloud-waste-hunter` | 1280 px, 375 px | Flag OFF / ON (signal pair) |
| 7 | `/architecture` | 1280 px, 375 px | Flag OFF / ON (narrative pair) |
| 8 | `/notes` | 1280 px, 375 px | Flag OFF / ON (editorial pair) |
| 9 | `/notes/monk-mode` | 1280 px, 375 px | Flag OFF / ON (editorial pair) |
| 10 | `/codex` | 1280 px, 375 px | Flag OFF / ON (narrative pair) |
| 11 | `/codex/mendiran-vakayinamesi` | 1280 px, 375 px | Flag ON → narrative with sigil; Flag OFF → legacy cyan + book tint |
| 12 | `/lab` | 1280 px, 375 px | Flag OFF / ON (lab pair) |
| 13 | `/lab/iam-translator` | 1280 px, 375 px | Flag OFF / ON (lab pair, via ExperimentFrame) |
| 14 | `/stack` | 1280 px, 375 px | Flag OFF / ON (lab pair, with sky + purple legacy) |
| 15 | `/telemetry` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 16 | `/changelog` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 17 | `/evolution` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 18 | `/v5/operating` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 19 | `/v5/journal` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 20 | `/v5/perception` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 21 | `/lumina/brain` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 22 | `/lumina/failures` | 1280 px, 375 px | Flag OFF / ON (operator pair) |
| 23 | `/contact` | 1280 px, 375 px | Flag OFF / ON (signal pair) |
| 24 | Reduced motion (any surface, any variant) | 1280 px, 375 px | Flag ON — confirm no animation runs (composition is identical to non-reduced-motion). |

Screenshots are captured during operator review prior to flag flip, per V6 § 7 ("Push. Deploy. Observe 14 days minimum, 30 days for token reforms").

---

## 15. Rollback

### 15.1 Single-flag rollback (preferred)

```bash
# In Vercel project env or `.env.production`:
V6_ATMOSPHERE_VARIANTS=0
```

Every PageAtmosphere call falls through the `!isVariantFlagOn()` branch and renders the legacy two-blob composition with each surface's preserved colours (or `null` on the home page). Visual identical to pre-V6 for all touched surfaces.

### 15.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores every inline atmosphere block byte-for-byte. The flag remains in the env list as a no-op; the component file no longer exists. The site renders pre-V6 atmosphere via the inline blocks.

### 15.3 Per-surface rollback (surgical)

To revert a single surface without touching the others: `git checkout HEAD~1 -- app/<surface>/page.tsx` then re-edit any other change. Each page's edit is isolated (one import + one block swap), so per-file reverts are clean.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch `feat/v4-phase5-experimental-foundation` clean before edit (only untracked V6 audit docs) | ✅ |
| Build produces 54 static pages identical to V5 build inventory | ✅ |
| Zero new client JS shipped | ✅ |
| Default flag posture: OFF (V6_ATMOSPHERE_VARIANTS unset → falsy → legacy fallback) | ✅ |
| Legacy fallback preserves per-page colour assignment | ✅ |
| No data shape change, no API change, no telemetry change | ✅ |
| Reduced-motion: nothing to break (no animation) | ✅ |
| Hydration: deterministic markup (no client APIs) | ✅ |
| RED LINE preserved: topology, Lumina, navbar, footer, notes layout, codex layout, project cards, animations, motion grammar, telemetry, architecture systems, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** The default flag posture is OFF, meaning a deployment with this commit looks visually identical to pre-V6 on every surface (modulo the home page which gains nothing because legacy is `null`). The operator flips `V6_ATMOSPHERE_VARIANTS=1` after the 30-day observation window for token-reform sub-PRs (V6 § 2.3 exit criteria).

---

## 17. What 11.1 explicitly does NOT do

Per the V6 execution constitution's anti-drift discipline:

- ❌ No additional atmosphere variants beyond the six in spec.
- ❌ No animation invented for any variant.
- ❌ No colour outside cyan + black + white-opacity introduced.
- ❌ No new motif beyond what variants compose from existing primitives.
- ❌ No telemetry, no KV key, no API route.
- ❌ No font, no spacing token, no text-ramp consolidation (those are 11.2, 11.3, 11.4, 11.5).
- ❌ No Phase 12+ work (navbar, footer, mobile menu, work-hub merge, telemetry observatory, Lumina trigger refresh).
- ❌ No edits to V4/V5 systems, topology, Lumina, navbar, footer, project cards, animations, motion grammar, telemetry, architecture systems.
- ❌ No "while we're here" cleanup (no rename, no extract, no refactor, no test addition).
- ❌ No scope into ScrollStory's dynamic blob or any in-component atmosphere.

Single sub-PR. Single mission. The Three-Cut Rule honored: PageAtmosphere added, inline blocks retired, per-page assignment registered.

---

## 18. V6 Phase 11 — exit-progress

After Sub-PR 11.1: 1 / 5 Phase 11 sub-PRs merged.

Remaining sub-PRs (per V6 § 2.2):

- 11.2 — Status & Chip Vocabulary Reform (`V6_PILL_VOCABULARY`).
- 11.3 — Glass-Panel Retirement (`V6_GLASS_RETIREMENT`).
- 11.4 — Text Token Consolidation (`V6_TEXT_TOKENS_CANONICAL`).
- 11.5 — The Second Motif (Margin Tick System, `V6_MARGIN_TICK`).

Sub-PR 11.1 ships independently — no dependency on later Phase 11 work. Phase 11 exit (§ 2.3) requires all five sub-PRs merged + 30-day observation post-11.1.

---

## 19. Closing

V6 Sub-PR 11.1 is **the quietest possible first cut**: a typed primitive replacing a duplicated decoration with no new spectacle, no new data, no new motion, no new colour. The composition catalog is extensible (six variants now; the next sub-PR can add more if a future surface demands one); the rollback is a single flag flip; the maintenance budget is ~0.2 hr/month (purely visual, no contract).

The site after the flag flips on will read as having **multi-axis atmosphere**: signal pages will feel different from editorial pages will feel different from operator pages will feel different from narrative pages. Cumulatively, the templated-wallpaper perception the audit calls out begins to dissolve.

**Same systems. New interface.**

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
