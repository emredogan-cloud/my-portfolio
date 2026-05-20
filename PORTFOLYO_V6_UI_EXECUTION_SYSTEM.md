# PORTFÖY V6 — UI EXECUTION SYSTEM

> **The redesign roadmap.**
> Source of every fix: `PORTFOLYO_V6_UI_AUDIT.md`.
> Source of every constraint: V4/V5 systems, contracts, telemetry,
> performance budget.
> Scope: **visual + spatial + interaction layers only.** No system
> logic touched. No routes added or removed. No data shape changed.

---

## ⚠️ RED LINE — WHAT THIS DOCUMENT REDESIGNS

This document does **not** redesign:
- V4 systems · V5 systems · topology logic · telemetry logic · temporal systems · operational twin · Lumina routing · architecture · the `/data` layer.

This document **does** redesign:
- the **presentation** of those systems on every visible surface.

If a sub-PR proposes a change to a data shape, a system contract, a
KV key, an API route, or any backend logic — it is not a V6 sub-PR.
Either:
1. Extract it into a V5-extension sub-PR first, then write the V6 redesign on top, OR
2. Defer the visual change until the system is genuinely ready.

V6 ships **only the visible layer**.

---

## 📋 0. OPERATING INSTRUCTIONS

### 0.1 Phase Numbering

V6 starts at **Phase 11**, continuing V5's sequence.

```
Phase 11 — TOKEN REFORM           palette, atmosphere variation, chip retirement, text canon (60–75 days)
Phase 12 — WAYFINDING REFORM      navbar, mobile menu, footer, surface promotion (60 days)
Phase 13 — READING SURFACES       Notes hub, Codex hub, About page restructure (90 days)
Phase 14 — WORK SURFACES          Projects hub, Architecture pages, Stack page (90–120 days)
Phase 15 — OPERATOR SURFACES      Telemetry, Evolution, /v5/* family, Lumina trigger (90–120 days)
```

Total: 5 phases. ~24 sub-PRs. ~7-10 months calendar.

### 0.2 Execution Order

Phases execute sequentially. Each phase's sub-PRs ship one at a
time, one commit per sub-PR. Between phases: 30-day observation
window (telemetry green, mobile Lighthouse ≥ 92, founder energy
green). No batching, no parallelism.

### 0.3 Rollback Posture

Every visible redesign sub-PR ships behind an env flag with a
literal V4/V5 baseline fallback. Flag off → visual identical to
pre-V6. Flag on → V6 redesign live. Defaults are off; the operator
flips to on after observation.

### 0.4 What Each Sub-PR Must Carry

A sub-PR is mergeable only when it carries:
1. **Before / After screenshot** at desktop (1280px) and mobile (375px).
2. **Reduced-motion path screenshot** verified.
3. **One-line rollback command** (the env flag flip or the `git revert`).
4. **Affected files** list — capped at 8 files; cross-cutting token
   sub-PRs may exceed but must justify.
5. **Companion `sub-pr-report/v6/Sub-PR_<phase>.<n>_<slug>.md`**.

No sub-PR merges without all five.

---

## 🧠 1. EXECUTION PHILOSOPHY (REDESIGN-SPECIFIC)

### 1.1 The Three-Cut Rule

Every V6 sub-PR makes at most **three visible cuts** to the live
interface. Three cuts feels like a redesign; six cuts feels like a
fresh template. The site evolves by short overlapping passes, never
a single big bang.

### 1.2 Identity Carry-Through

The audit identified what to keep (§ 21). Every V6 sub-PR must
honor:
- Closed palette (cyan `#00d2ff` + black + white-opacity).
- Geist typography only.
- HeroTopology constellation untouched.
- Lumina avatar + welcome sequence + tool pills untouched.
- Codex book detail page (`/codex/[slug]`) untouched.
- Lab typewriter rows (`/lab` hub) untouched.
- The cyan hairline-on-card-top motif — extended, not retired.
- Cinematic film grain overlay.
- All accessibility, reduced-motion, and performance budgets.

### 1.3 No New Spectacle

The Phase 8 WebGPU spectacle budget is spent. V6 introduces **zero
new spectacles**. Every visual move is restrained, composable, and
measurable by its quiet effect.

### 1.4 Performance Budget (Inherited)

V6 cannot violate:
- Initial bundle ≤ 180 KB gzipped, hard cap 250 KB.
- Mobile Lighthouse ≥ 92.
- LCP ≤ 1.5s on cached routes, ≤ 2.5s elsewhere.
- Idle CPU ≤ 0.3 % on mid-range mobile.
- Reduced-motion fully honored.

Any sub-PR that breaches: deferred.

### 1.5 The Audit-Driven Anti-Drift Gate

Before any sub-PR commit, the agent re-reads the relevant audit
section and confirms the fix is *exactly* what the audit demands —
no scope expansion, no opportunistic side-quests.

---

## 🎨 2. PHASE 11 — TOKEN REFORM & CROSS-CUTTING HYGIENE

**Duration:** 60–75 days
**Risk:** MEDIUM (cross-cutting; touches every page)
**Leverage:** 10/10 (Phase 12–15 build on the new tokens)
**Audit refs:** §§ 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 2.3 (manifesto chrome)

### 2.1 Mission

Replace the identical wallpaper, recolor the out-of-palette chips,
retire the glass-panel default, consolidate the text token ramp,
and introduce a *second* visual motif so the cyan-dot-and-hairline
is no longer the entire grammar.

### 2.2 Sub-PR Map (5 sub-PRs)

---

#### Sub-PR 11.1 — Atmospheric Variation System

**Audit ref:** § 1.1 (identical wallpaper across 17 surfaces).

**The problem:** Every page renders the same two-blur radial gradient
behind its content. The signature has become the template.

**The fix:** A typed `<PageAtmosphere variant="…">` server component
in `components/layout/PageAtmosphere.tsx`. Six variants, each a
*distinct* composition within the closed palette:

| Variant | Composition |
|---------|-------------|
| `signal` | One cyan blob top-right + diagonal hairline cyan rule descending from top-left corner |
| `archive` | One cyan blob bottom-left + faint dot-grid (12 px) at 4 % opacity in the top quarter |
| `lab` | One cyan blob top-left + a single 240×1px vertical cyan line at 12 % opacity bisecting the viewport horizontally |
| `editorial` | Two staggered black-on-black radial pools + a single off-canvas right-edge cyan tick |
| `operator` | Quadrant-anchored 1 px cyan hairlines at 6 % opacity (Margaret Calvert grid) |
| `narrative` | One large cyan ellipse top-right + per-page sigil glyph at 4 % opacity, very large, in the corner |

Per-page assignment (replaces the inline blob duplication):
- `/` → `signal`
- `/about` → `editorial`
- `/projects`, `/projects/[slug]` → `signal`
- `/architecture`, `/architecture/[slug]` → `narrative`
- `/notes`, `/notes/[slug]` → `editorial`
- `/codex`, `/codex/[slug]` → `narrative`
- `/stack` → `lab`
- `/lab`, `/lab/[slug]` → `lab`
- `/telemetry`, `/changelog`, `/v5/operating`, `/v5/journal`, `/v5/perception`, `/evolution`, `/lumina/brain`, `/lumina/failures` → `operator`
- `/contact` → `signal`

**Affected files:** New `components/layout/PageAtmosphere.tsx`,
delete inline atmosphere blocks from all 17 pages, single import
swap per page.

**Validation:**
- [ ] Each variant visually distinct at 1280 px and 375 px.
- [ ] All six variants honor reduced-motion (no animation).
- [ ] LCP unchanged within ±50 ms on every page.
- [ ] Bundle delta < 2 KB gzipped (the component is small).
- [ ] Mobile Lighthouse ≥ 92 on every changed route.

**Rollback:** Single env flag `V6_ATMOSPHERE_VARIANTS`. Flag off →
component renders the legacy two-blob composition (preserved as
`legacy` variant). Flag on → variant-per-page.

**Telemetry:** None — purely visual. No new KV keys.

---

#### Sub-PR 11.2 — Status & Chip Vocabulary Reform

**Audit ref:** §§ 1.2 (out-of-palette emerald/blue/purple), 1.5 (chip
sprawl), 5.1 (project pills), 9.1 (stack chips).

**The problem:** Status pills break the closed cyan palette with
emerald/blue/purple. Tech chips, status chips, atmosphere chips,
filter chips, tag chips, certification pills all use the same
`border-white/10 bg-white/5` chip — there's no chip hierarchy.

**The fix:** A typed `<Pill kind="…">` primitive that defines:

| Kind | Visual | Use |
|------|--------|-----|
| `state-live` | Cyan filled dot + cyan-tinted ring outline | "Live" status |
| `state-building` | Open cyan ring outline + hairline cyan inset | "Building" status |
| `state-planning` | Ghost outline at white/8 + dimmed label | "Planning" status |
| `state-archived` | No border, just white/30 mono label | "Archived" status |
| `meta` | Hairline white outline + secondary text | Tech tags, atmosphere chips |
| `filter-active` | Cyan dotted underline + secondary text | Active filter pills (`/evolution`, `/changelog`) |
| `filter-inactive` | Bare mono label + ghost hover underline | Inactive filter pills |
| `timestamp` | Right-aligned mono uppercase, no container | Time-ago labels |

The "rounded-full pill in a bordered container" pattern is **retired
for `state-*` and `filter-*`**. Status now reads through visual
weight, not container shape.

**Affected files (cross-cutting):**
- New: `components/ui/Pill.tsx`.
- Edit: `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`,
  `components/sections/HeroSection.tsx` (availability dot →
  state-live without the green), `app/architecture/page.tsx`,
  `app/lab/page.tsx`, `app/changelog/page.tsx`,
  `app/evolution/page.tsx`, `app/stack/page.tsx`,
  `components/sections/CertificationRadar.tsx`,
  `app/v5/operating/page.tsx`.

**Validation:**
- [ ] Zero `emerald-*`, `blue-*`, `purple-*` color references remain.
- [ ] Single Pill component used by all status/filter surfaces.
- [ ] Hero availability dot retains pulse animation; just retoned cyan.
- [ ] Reduced-motion: state-live's pulse becomes a static cyan dot.

**Rollback:** Pill defaults to legacy chip shape when flag off; chip
classNames preserved in the same file for easy revert.

**Telemetry:** None.

---

#### Sub-PR 11.3 — Glass-Panel Retirement

**Audit ref:** § 1.3 (glassmorphism on most secondary surfaces).

**The problem:** `liquid-glass` and `glass-panel` are now the default
secondary container. The dated trend signature dominates.

**The fix:** Replace site-wide glass usages with **edge-lit cards**:
no backdrop-blur, no semitransparent fill; instead:
- Solid `#0a0a0a` background.
- 1 px white/6 border.
- A single cyan hairline 1 px on the top edge at 20 % opacity, rising to
  90 % on hover (the existing `inset-x-7 top-0 h-px` motif extended).
- `inset 0 1px 0 rgba(255,255,255,0.04)` for a single highlight scan-line.

`globals.css` keeps `.liquid-glass` as a deprecated class for
**only** the LuminaTrigger button (the dimmable orb effect there is
correct). Every other usage migrates to `.edge-lit-card`.

**Affected files:**
- `app/globals.css` (add `.edge-lit-card`; mark `.liquid-glass`
  deprecated comment).
- `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`,
  `app/about/page.tsx` (Specializations), `app/contact/ContactForm.tsx`
  if any glass usage, every page using `glass-panel` for secondary
  buttons (replaced with a quieter ghost-outline button).

**Validation:**
- [ ] No `backdrop-filter` CSS rule remains outside `LuminaTrigger`.
- [ ] Mobile Lighthouse improves by ≥ 1 point (backdrop-filter cost retires).
- [ ] Idle CPU on mobile mid-tier devices measurably lower.

**Rollback:** Flag `V6_GLASS_RETIREMENT` off → classNames revert to
`liquid-glass` and `glass-panel`.

---

#### Sub-PR 11.4 — Text Token Consolidation

**Audit ref:** § 1.5 (parallel ad-hoc opacity system).

**The problem:** `text-gray-400`, `text-gray-500`, `text-white/40`,
`text-white/50`, `text-white/55`, `text-white/60`, `text-white/65`,
`text-white/70` coexist with the canonical `text-primary` /
`text-secondary` / `text-tertiary` / `text-quiet` / `text-faint`.

**The fix:** Source-level replacement:

| Legacy | Canonical |
|--------|-----------|
| `text-white` | `text-primary` |
| `text-white/85`, `text-white/80`, `text-white/75` | `text-primary` (high-confidence reading content) |
| `text-white/70`, `text-white/65`, `text-gray-400` | `text-secondary` |
| `text-white/60`, `text-white/55`, `text-white/50`, `text-gray-500` | `text-tertiary` |
| `text-white/45`, `text-white/40` | `text-tertiary` |
| `text-white/30`, `text-white/25` | `text-quiet` |
| `text-white/20`, `text-white/15`, `text-white/10` | `text-faint` |

Audit-and-replace pass across every `.tsx` file. No exception.
After this sub-PR, the only opacity tints permitted are 100/70/45/30/15 — the canonical five.

**Affected files (large surface, low risk):** Approximately 50
files, all `.tsx`. Mechanical replacement; visual diff should be
imperceptible.

**Validation:**
- [ ] `rg "text-white/" app components` returns only `/85`, `/70`,
      `/45`, `/30`, `/15` (and exceptions explicitly approved).
- [ ] `rg "text-gray-[0-9]" app components` returns zero.
- [ ] Visual regression test: every page diffs ≤ 2 pixels at any
      typography position.

**Rollback:** Per-file `git revert`. Mechanical replacement → mechanical reversal.

---

#### Sub-PR 11.5 — The Second Motif (Margin Tick System)

**Audit ref:** § 1.6 (cyan hairline + cyan dot is the entire visual vocabulary).

**The problem:** The site has one motif. Identity-rich, but mono.

**The fix:** Introduce a **margin-tick** system as a co-equal motif.
The margin tick is a small 1 px × 12 px vertical cyan rule at 30 %
opacity, anchored to the left margin of editorial blocks (heroes,
manifestos, narrator surfaces). Optional second variant: a hairline
horizontal tick on the right margin of operator surfaces (rising
to 90 % on hover).

Placement (Phase 11 introduces it; Phases 12–15 deploy it):
- Page heroes: margin tick to the left of the eyebrow.
- About atmospheric breath paragraphs: margin tick to the left.
- Codex detail epigraph: replace the current left border with the tick.
- Narrator surfaces (Phase 13): tick + cyan ellipsis arrival.

Affected in Phase 11: only globals + a single demonstrator surface
(the `/about` cinematic-pause block). Other deployments earn their
slot per future sub-PR.

**Affected files:** `app/globals.css` (`.margin-tick`,
`.margin-tick-right`), `app/about/page.tsx` (the cinematic pause and
the "What keeps the noise low" section).

**Validation:**
- [ ] Tick renders without backdrop-filter; pure border-left.
- [ ] Tick honors reduced-motion (no opacity transition; ships at
      30 % opacity baseline).
- [ ] About page now has TWO visual motifs (cyan tick + cyan
      hairline-on-top); identity is multi-axis.

**Rollback:** Flag `V6_MARGIN_TICK` off → no tick rendered; current
left border preserved.

### 2.3 Phase 11 Exit Criteria

- [ ] All 5 sub-PRs merged.
- [ ] No `emerald-*` / `blue-*` / `purple-*` color references.
- [ ] No `text-gray-*` references.
- [ ] No `backdrop-filter` outside `LuminaTrigger`.
- [ ] Mobile Lighthouse ≥ 92 on every changed route.
- [ ] 30-day observation post-merge of 11.1 (atmosphere variants).

### 2.4 Phase 11 Maintenance: 1.0 h / month

---

## 🧭 3. PHASE 12 — WAYFINDING REFORM

**Duration:** 60 days
**Risk:** MEDIUM (navbar + footer are global)
**Leverage:** 9/10 (mobile nav fixes the worst single discoverability gap)
**Audit refs:** §§ 3.1, 3.2, 3.3, 3.4, 3.5 (navbar), 1.8 (footer), 18.1 (mobile)

### 3.1 Mission

Replace the "ED. monogram + Systems▾ dropdown + View Résumé pill"
pattern with a navbar that promotes the distinctive surfaces and
ships a real mobile menu. Recompose the footer.

### 3.2 Sub-PR Map (4 sub-PRs)

---

#### Sub-PR 12.1 — Promote Surfaces, Retire The Systems Dropdown

**Audit ref:** § 3.2.

**The problem:** Architecture, Lab, Telemetry, Brain, Evolution,
Codex — the most identity-native surfaces — are folded behind a
dropdown labelled "Systems."

**The fix:** Reorganize the navbar's link bar around the visitor's
actual mental model:

| Position | Link | Routes covered |
|----------|------|----------------|
| 1 | Work | `/projects` + `/architecture` (combined surface; see 14.1) |
| 2 | Lab | `/lab` |
| 3 | Notes | `/notes` |
| 4 | Codex | `/codex` |
| 5 | Operate | `/v5/operating` (primary surface), with submenu for `/telemetry`, `/evolution`, `/v5/journal`, `/changelog`, `/lumina/brain` |

About / Contact move to the **right** of the bar, smaller, before
the right-edge action (see 12.2).

The "Operate" submenu is **the only dropdown that remains**, and
the items in it are operator-only surfaces (none of them are
front-door for a recruiter).

**Affected files:** `components/layout/Navbar.tsx`.

**Validation:**
- [ ] All 5 primary surfaces accessible without a dropdown.
- [ ] Operate dropdown has 5 items, all operator-grade.
- [ ] Esc closes the dropdown (existing behavior preserved).
- [ ] `aria-current="page"` set on the active route's link (also fixes audit § 3.3).
- [ ] Mobile path defers to Sub-PR 12.4.

**Rollback:** Flag `V6_NAV_PROMOTION` off → legacy link order returns.

---

#### Sub-PR 12.2 — Retire The "View Résumé" Pill As The Visual Anchor

**Audit ref:** § 3.4.

**The problem:** The most-emphasized element on every page is a CV
download — visually contradicting "the work IS the resume."

**The fix:** Replace the white pill with a **calm right-edge cluster**:

- A single quiet inline link `Résumé` (mono uppercase, white/55).
- Followed by a small cyan-bordered "Get in touch" pill (the actual
  intended conversion).
- The white-on-black high-contrast pill is gone.

The "Get in touch" pill becomes the visual anchor — pointing to
`/contact`, which is the higher-leverage conversion. The résumé
remains accessible but no longer dominates.

**Affected files:** `components/layout/Navbar.tsx`.

**Validation:**
- [ ] Navbar's visual weight shifts from white résumé pill → cyan
      contact pill.
- [ ] Résumé link still works, opens in new tab.
- [ ] Contact pill visually distinct from the Lumina trigger (no
      conflict).

**Rollback:** Flag `V6_NAV_PROMOTION` off → legacy pill returns.

---

#### Sub-PR 12.3 — Wordmark Refresh (Retire "ED." Monogram)

**Audit ref:** § 3.1 (the "ED." reads young).

**The problem:** "ED." is a 2017-era portfolio monogram.

**The fix:** Replace with a small wordmark: `Emre Doğan` in Geist
medium, tracking-tight, no period, sized smaller than the link bar
text. Or — alternative — a single low-stroke glyph that mirrors the
HeroTopology center node (a cyan-cored small circle with one
quiescent ring) as the brand mark, with `Emre Doğan` as an
adjacent wordmark on `md+` screens.

The decision (glyph vs wordmark vs both) goes through one A/B in
the sub-PR review; default is the **glyph + wordmark adjacent**.

**Affected files:** `components/layout/Navbar.tsx`, optionally
`app/icon.svg` (the existing favicon glyph already does this — the
nav mark should match).

**Validation:**
- [ ] On `md+`, mark = glyph + "Emre Doğan" wordmark; on `< md`,
      mark = glyph only.
- [ ] Glyph at ~24 px diameter; wordmark at 14 px.
- [ ] Click target ≥ 44 × 44.

**Rollback:** Flag off → "ED." returns.

---

#### Sub-PR 12.4 — Real Mobile Navigation

**Audit ref:** §§ 3.5, 18.1 (mobile has no menu).

**The problem:** On `< md`, the link bar is `hidden`. Mobile
visitors see no menu. No path to /about, /projects, /lab.

**The fix:** A mobile drawer that **shares its identity with the
desktop Operate dropdown** — so the patterns repeat, not collide:

- Trigger: a quiet horizontal-line glyph (3 stacked 1 px lines), no
  "hamburger" suggestion. Top-right of the mobile navbar.
- Drawer: slides from the right; fills 78vw at max-width 320px;
  black bg, 1px cyan-tick on the left edge.
- Contents: the 5 primary nav items (Work / Lab / Notes / Codex /
  Operate) as large mono-eyebrow + serif H3 row pairs. Each row =
  ~80 px tall (massive touch target).
- The Operate item expands inline (no second drawer).
- Bottom of drawer: Résumé link + small "Get in touch" pill.
- Close: tap outside, swipe right, or Esc (with hardware keyboard).
- Lumina trigger continues to live at bottom-right corner; drawer
  does not cover it.

**Affected files:** `components/layout/Navbar.tsx` (mobile path),
new `components/layout/MobileMenu.tsx`.

**Validation:**
- [ ] Drawer fully keyboard-navigable.
- [ ] Reduced-motion: drawer fades instead of slides.
- [ ] No layout shift on first paint (drawer rendered initially closed).
- [ ] Bundle delta < 3 KB gzipped.
- [ ] Lumina trigger remains tappable while drawer is open.

**Rollback:** Flag `V6_MOBILE_NAV` off → mobile path reverts to
"link bar hidden" (the current broken state). The flag should not
remain off in production for more than 7 days post-deploy.

### 3.3 Sub-PR 12.5 — Footer Recomposition

**Audit ref:** §§ 1.8, 17.

**The problem:** Footer has 8 elements in one strip.

**The fix:** A composed three-row footer:

```
Row 1: Edge-to-edge thin cyan rule at 12 % opacity (the existing
       gradient line, made more prominent).

Row 2: TWO blocks side-by-side (on md+).
       LEFT: Quiet signature ("Long-arc systems, hand-built infra.
             Adana, GMT+3. © 2026") + BuildBeacon BELOW the signature
             (not inline) as a separate operator-tone line.
       RIGHT: Three quiet links — Notes / GitHub / LinkedIn — stacked
              vertically, with the lucide brand icons aligned left.

Row 3: Centered mono line: "EMRE DOĞAN · MONK MODE · 2026" at very
       small font, with the LiveCustomerCounter and FooterCliPrompt
       INLINED inside this line as a single editorial transmission
       (when LiveCustomerCounter has data; otherwise omitted entirely).

Résumé download relocates to the navbar (already 12.2); footer no
longer carries it.
```

The footer becomes **a closing composition**, not a utility cluster.

**Affected files:** `components/layout/Footer.tsx`,
`components/layout/LiveCustomerCounter.tsx` (no logic change, but
adjust container styling).

**Validation:**
- [ ] Mobile: three rows stack cleanly; signature, links, mono line.
- [ ] BuildBeacon visible.
- [ ] LiveCustomerCounter still hides itself when count is 0.

**Rollback:** Flag `V6_FOOTER_RECOMPOSE` off → legacy footer returns.

### 3.4 Phase 12 Exit Criteria

- [ ] All 5 sub-PRs merged.
- [ ] Mobile nav functional and observation-stable.
- [ ] Surface promotion data: `/lab`, `/codex`, `/notes` visit counts
      should rise from baseline within 14 days post-promotion.

### 3.5 Phase 12 Maintenance: 0.5 h / month

---

## 📖 4. PHASE 13 — READING SURFACES (NOTES, CODEX HUB, ABOUT)

**Duration:** 90 days
**Risk:** MEDIUM (high-traffic surfaces; visitor expectation calibration)
**Leverage:** 9/10
**Audit refs:** §§ 4.1–4.6 (About), 7.1–7.3 (Notes), 8.1 (Codex hub)

### 4.1 Mission

Escape the conventional blog-list pattern on Notes. Compose the
Codex shelf, don't stack it. Restructure the About page so the best
content arrives in the first 1.5 viewports instead of the last one.

### 4.2 Sub-PR Map (5 sub-PRs)

---

#### Sub-PR 13.1 — Notes As An Editorial Index (Not A Blog)

**Audit ref:** § 7.1.

**The problem:** The hub looks like Medium / Substack / dev.to.

**The fix:** Replace the date/title/excerpt/tags pattern with an
**editorial index** composition:

- Page leads with **the most-recent note's first sentence in
  display-size type** (display H1-sized, treated like a magazine
  pullout), with a quiet right-aligned mono "Latest · 5 min" beat.
  Click → that note.
- Below: a single-column **chronicle column** of all other notes,
  each rendered as:
  - Tiny mono year label on the left margin (sticky-cluster: all
    "2026" notes share the year label visually).
  - Title in Geist medium, larger than current.
  - **No excerpt by default.** A small expand-affordance (the
    cyan-tick from Phase 11.5) reveals the excerpt inline on hover
    / tap (mobile = tap to expand).
  - Tags retire (or move to a per-note detail surface; see § 7.3 of
    the audit).
- Right of the chronicle column on `lg+`: a vertical "atlas" — a
  small composed map of the notes' topic clusters (cloud / AI /
  mobile / discipline), rendered as a hairline-and-dot diagram
  borrowed from the constellation language. Clicking a cluster
  filters the chronicle.

The page no longer reads as a blog list. It reads as a magazine's
table of contents.

**Affected files:** `app/notes/page.tsx`, new
`app/notes/_components/ChronicleColumn.tsx`,
`app/notes/_components/NoteAtlas.tsx`, `data/notes.ts` (no shape
change; only the optional `cluster` field added — V5-safe).

**Validation:**
- [ ] LCP ≤ 1.5s.
- [ ] No client JS for the chronicle (server-rendered).
- [ ] Atlas component lazy-loads; no impact on initial bundle.
- [ ] Mobile: atlas collapses to a horizontal pill row above the chronicle.
- [ ] Tags removed; no broken backlinks (no `?tag=` routes existed).

**Rollback:** Flag `V6_NOTES_EDITORIAL` off → V5 layout.

---

#### Sub-PR 13.2 — Codex Hub As A Composed Shelf

**Audit ref:** § 8.1.

**The problem:** Three folios stacked vertically read as a list.

**The fix:** A **deliberately composed shelf**:

- Section 1 — *The covers*: Three covers in a **horizontal sequence
  at uneven heights** (Mendîran tallest, Mythologica mid, Solgun
  shortest) — like books actually leaning on a shelf. Each cover
  carries its sigil ribbon at the bottom. On hover/tap, the cover
  lifts ~4 px and the book's atmosphere chips materialize beside
  it.
- Section 2 — *The lineage*: A single horizontal cyan timeline rule
  underneath the covers connects the three books by their in-world
  years (1247, 1304, 1488 — illustrative). Each book is anchored to
  its year as a labeled tick.
- Section 3 — *The editorial column*: A single-column long-read
  paragraph beneath the shelf, written as **one continuous
  essay** about the three books, with each book's tagline
  embedded as a quiet pull-quote (cyan-tick'd margin) at the
  appropriate paragraph.
- Section 4 — CTA: A single closing line: "Three books. Three
  worlds. Choose one." Three small entry-pills (one per book).

The hub is now a magazine spread, not a list.

**Affected files:** `app/codex/page.tsx`, new
`app/codex/_components/CodexShelf.tsx`,
`app/codex/_components/CodexLineage.tsx`.

**Validation:**
- [ ] Mobile: covers stack but staggered (small horizontal offset
      per cover), lineage collapses to a vertical timeline.
- [ ] Reduced-motion: hover-lift removed; static composition.
- [ ] No new third-party dependency.
- [ ] Each cover image already in `/public/codex/`; reuse only.

**Rollback:** Flag `V6_CODEX_SHELF` off → vertical folios return.

---

#### Sub-PR 13.3 — About Page: Promote The Best Content To The Top

**Audit refs:** §§ 4.1, 4.4, 4.6.

**The problem:** 11 vertically-uniform sections. Best content at
the bottom (Closing Transmission). Identity sentence ("bakery
shifts behind") buried in the second paragraph.

**The fix:** Restructure section order without rewriting content:

```
NEW ORDER:
1.  HERO — rewritten lead paragraph (see 13.3a below)
2.  CLOSING TRANSMISSION SIGNATURE (the dt/dl FIELD/BUILD/READING/
    STANCE block + the cyan-tick'd pulse pill) — moved here, near
    the top, so the strongest single block arrives early.
3.  CINEMATIC PAUSE (italic single sentence)
4.  OPERATING PHILOSOPHY (the asymmetric 1+3 tile layout — promoted
    as THE shape of the page, not the only one)
5.  IN FLIGHT (live builds, was section 11)
6.  RECEIPTS (GitHub heatmap, retained but reframed as Section 6 not 9)
7.  PRINCIPLES (the 4 numbered tiles)
8.  SPECIALIZATIONS (the 3 wide rows — keep, but compress to a
    single paragraph + chip line per spec; reduces vertical sprawl)
9.  CURRENTLY (the dt/dl rows — small, intentional footer block)
10. ATMOSPHERIC BREATH ("What keeps the noise low" — kept but
    re-anchored so it bridges Currently to the page's emotional
    close)
11. CLOSING H2 + CTAs ("Building tools engineers actually use" + the
    two CTAs)

REMOVED:
- "Outside The Terminal" (Training / Motorcycle / Reading / Codex)
  → moved entirely to a small footer-of-About strip OR to a
  dedicated /pulse route (see Sub-PR 13.5).
```

The bakery sentence moves to the **first sentence of the first
paragraph** (see 13.3a).

**Sub-PR 13.3a — Hero Lead Rewrite:**

```
BEFORE: "I'm Emre Doğan. I design and operate production AWS
infrastructure, AI-native tooling, and full-stack systems — from a
small, quiet desk in Adana, on time horizons measured in years.
The work began behind early bakery shifts and finished after
school days; two years on, what remains is the discipline. A
slower kind of build, made daily."

AFTER: "The work began behind 01:30 bakery shifts and finished
after school days. Two years on, the discipline is what remains —
the rest is production AWS infrastructure, AI-native tooling, and
full-stack systems, designed on time horizons measured in years
from a small desk in Adana."
```

The identity vector arrives first. The expertise list arrives
second. Same content, inverted order.

**Affected files:** `app/about/page.tsx`.

**Validation:**
- [ ] Page length reduced by ~1.5 viewports (Outside The Terminal
      moved out).
- [ ] LCP unchanged; hero remains at top of file.
- [ ] Mobile: section reordering preserves readability.

**Rollback:** Flag `V6_ABOUT_RESTRUCTURE` off → legacy order.

---

#### Sub-PR 13.4 — About Page: Section-Level Spatial Variation

**Audit ref:** § 4.3 (asymmetric tile is a one-off).

**The problem:** Operating Philosophy uses a 1+3 asymmetric tile.
The other 10 sections use uniform grids. The asymmetric move
doesn't earn its identity through repetition.

**The fix:** Three of the new About sections gain **non-uniform
spatial composition**:

- **Operating Philosophy** (kept): 1 tall left + 3 right (already correct).
- **Principles**: 2+2 with mid-row gap, where Principle 03 (Cost-
  aware engineering) sits in a wider container (it's the most
  load-bearing principle; the layout reflects).
- **Specializations**: Single horizontal sequence at md+, where the
  three columns share a baseline grid and only the first column
  carries chips (the other two carry inline mono lines). Forces
  variation without losing the data shape.

**Affected files:** `app/about/page.tsx`,
`app/about/_components/PhilosophyTiles.tsx` (extract for clarity).

**Validation:**
- [ ] Each section visually identifiable at a glance from the others.
- [ ] No section uses the same grid composition as another.
- [ ] Mobile: all sections collapse to single column cleanly.

**Rollback:** Flag off → uniform grid returns.

---

#### Sub-PR 13.5 — Move "Outside The Terminal" To `/pulse`

**Audit ref:** § 4.2 (emotional pacing break).

**The problem:** Lifestyle block interrupts engineering content.

**The fix:** Create a small dedicated `/pulse` route — operating-
adjacent surface that hosts Training / Motorcycle / Reading / Codex
content. Linked from the About footer with one quiet line: "On the
hours that aren't code → /pulse". Removes the section from the
emotional center of /about.

The Codex link inside that block already pointed to /codex; the
move preserves the Codex affordance through that surface.

**Affected files:** New `app/pulse/page.tsx`, edit
`app/about/page.tsx` (remove Outside The Terminal block, add the
footer link).

**Validation:**
- [ ] /pulse renders with `narrative` atmosphere variant.
- [ ] Mobile menu's Operate dropdown gains /pulse (or About sub-link).
- [ ] Page is server-rendered; no new dependencies.

**Rollback:** Flag off → block returns to /about; /pulse 404.

### 4.3 Phase 13 Exit Criteria

- [ ] All 5 sub-PRs merged.
- [ ] About page completion-rate (proxy via Lumina chat opens at
      end-of-page) improves by ≥ 10 %.
- [ ] Notes hub visit time improves vs baseline.
- [ ] Codex hub → codex detail click-through rate improves vs baseline.

### 4.4 Phase 13 Maintenance: 1.5 h / month

---

## 🏗️ 5. PHASE 14 — WORK SURFACES (PROJECTS, ARCHITECTURE, STACK)

**Duration:** 90–120 days
**Risk:** HIGH (these are the recruiter-perception load-bearing surfaces)
**Leverage:** 10/10 (most-visited routes after `/`)
**Audit refs:** §§ 5.1–5.4 (Projects), 6.1–6.4 (Architecture), 9.1–9.2 (Stack)

### 5.1 Mission

Retire the generic 2-col glass-card grid on `/projects`. Add
spatial variation to the architecture pages and bring the timeline
slider to mobile. Compress the 7-category Stack rhythm.

### 5.2 Sub-PR Map (5 sub-PRs)

---

#### Sub-PR 14.1 — `/work` Unified Surface (Merge `/projects` + `/architecture` Hubs)

**Audit refs:** §§ 5.1, 5.2, 6.1.

**The problem:** `/projects` and `/architecture` are functionally
redundant hubs of the same 5 projects. Hub design is generic.

**The fix:** Merge into a single `/work` hub with **two reading
modes** (no route restructure that breaks links — both `/projects`
and `/architecture` continue to exist as redirects-to-anchors):

- **Lead block:** A single horizontal layout — left half has the
  flagship CWH treatment (large title, status `state-live`, one
  paragraph, one 64×64 representation of the CWH topology pulled
  from the existing `HeroTopologyData`), right half is a vertical
  list of the other four projects, each as a single mono row
  (number · title · state-pill).
- **Mid block:** The reading-mode toggle — "Outcomes / Architecture"
  — switches the page composition:
  - Outcomes mode: each project as a wide editorial row with
    blurb + visit/github links + a single representative metric
    (live customers, MRR, infrastructure scale where available).
  - Architecture mode: each project as a horizontal "constellation
    strip" — a small Three.js-derived line-rendering of the project's
    topology (build-time pre-rendered SVG fallback for mobile +
    reduced-motion + JS-off), with a "Read the walkthrough →" link
    into `/architecture/<slug>`.
- **End block:** A small "How I work" closer — one paragraph drawn
  from About's Principles, linking to /about.

The two existing hub routes (`/projects`, `/architecture`) become
anchor redirects to `/work#outcomes` and `/work#architecture`.

**Affected files:** New `app/work/page.tsx`,
`app/projects/page.tsx` → redirect, `app/architecture/page.tsx` →
redirect (or both kept as deep links to `/work` with the same
anchor map). New `app/work/_components/ProjectStrip.tsx`.

**Validation:**
- [ ] Both `/projects` and `/architecture` continue to work (redirect or render same content).
- [ ] CWH retains its flagship position visually.
- [ ] Mobile: lead block stacks (CWH first, then list); toggle
      becomes two side-by-side pills.
- [ ] Status pills use Phase 11.2 vocabulary (no emerald).
- [ ] Reading-mode toggle does NOT use URL state; pure client-side.

**Rollback:** Flag `V6_WORK_HUB` off → `/work` 404; existing hubs render.

---

#### Sub-PR 14.2 — `/projects/[slug]` Detail Refresh

**Audit ref:** § 5.3.

**The problem:** CWH detail is rich; VCA + FormAI + PawDoc + Aevum
are text + chips + images.

**The fix:** Per-project bespoke compositional moves while keeping
the page structure parametric:

- **Hero**: title + status; the wide paragraph; CTAs. *Add*: an
  inline cyan-tick'd pull-quote (a single line from the founder
  on what the system actually does) — sourced from `data/projects.ts`
  (one new optional field, V5-safe).
- **Tech stack**: replace the chip flat list with **a 2-col
  category layout** (Frontend / Backend / Data / AI / Identity).
  Categories already implicit in `data/projects.ts`; surface them.
- **Production metrics** (CWH only): keep, but use Phase 11.2 pill
  vocabulary (no emerald).
- **AWS topology** (CWH only): keep verbatim. Strong asset.
- **Live IAM sandbox** (CWH only): keep verbatim.
- **CWH Pro CTA** (CWH only): keep verbatim.
- **Overview**: paragraphs gain a **margin-tick'd structure** —
  each paragraph anchored to a one-word margin label ("Why" / "How"
  / "Trade-offs"), so the prose reads as a structured Q&A, not
  flowing text.
- **Gallery**: 2-col image grid replaced with a **stacked sequence**
  — large lead image, then 2 small support images side-by-side,
  then a final large image. Editorial rhythm, not a uniform grid.

For non-CWH projects, the bespoke surfaces (AWS topology, sandbox,
Pro CTA) remain hidden. The bespoke composition still applies to
hero, tech stack, overview, gallery.

**Affected files:** `app/projects/[slug]/page.tsx`, new
`app/projects/[slug]/_components/StackByCategory.tsx`, new
`app/projects/[slug]/_components/GallerySequence.tsx`,
`data/projects.ts` (optional `pullQuote`, `stackByCategory` fields).

**Validation:**
- [ ] CWH page visually identical at AWS topology + sandbox positions.
- [ ] VCA / FormAI pages no longer feel "skeleton" — bespoke composition fills.
- [ ] Tech-stack categories work without backfill in data file (graceful fallback to flat chips).

**Rollback:** Flag off → V5 detail layout.

---

#### Sub-PR 14.3 — Architecture Scroll-Story Variation

**Audit ref:** § 6.2.

**The problem:** Three projects ship the same exact ScrollStory
shape.

**The fix:** Three project-specific tonal variations within the
shared engine:

- **CWH** (current default): 7-col text / 5-col SVG illustration.
- **VCA**: invert the ratio — 5-col illustration / 7-col text. The
  AI-agent architecture benefits from larger illustrations.
- **FormAI**: collapse the illustration column into a **phone-frame
  mockup** that shows the relevant ML Kit UI per milestone (the
  illustrations already exist; framing them as phone screens
  reinforces "edge ML on mobile").

The ScrollStory engine takes a new `variant?: 'wide-text' | 'wide-illustration' | 'phone-frame'` prop (default current behavior).

**Affected files:** `app/architecture/_components/ScrollStory.tsx`,
`app/architecture/vibing-coder-ai/page.tsx`,
`app/architecture/sixpack-ai/page.tsx`.

**Validation:**
- [ ] Engine still handles existing CWH page byte-identical when no variant set.
- [ ] Phone-frame variant respects reduced-motion (no parallax).
- [ ] Mobile: variants collapse to single-column with appropriate spacing per project.

**Rollback:** Per-project flag off → wide-text default.

---

#### Sub-PR 14.4 — Architecture Timeline Slider On Mobile

**Audit ref:** §§ 6.3, 18.1.

**The problem:** Timeline slider hidden on `< md`.

**The fix:** Replace the `hidden md:block` gate with a **mobile-
optimized timeline composition**:

- Desktop: keep the existing slider unchanged.
- Mobile (< 768px): replace the slider with a vertical
  **timestamp ladder** — a column of cyan-dotted year markers, each
  tappable, expanding inline to show that snapshot's title + date +
  rationale. The same data, the same engagement signal, a
  composition appropriate to one-thumb scrolling.
- The interaction signal (`engaged` event) fires identically; data
  shape unchanged.

**Affected files:**
`app/architecture/_components/ArchitectureTimelineSection.tsx`,
new `components/v5/TimelineLadder.tsx`.

**Validation:**
- [ ] Mobile users can scrub through all snapshots.
- [ ] Telemetry `engaged` event fires correctly on mobile.
- [ ] Reduced-motion: tap-to-expand becomes always-expanded.
- [ ] No layout shift on hydration.

**Rollback:** Flag off → mobile reverts to V5 hidden.

---

#### Sub-PR 14.5 — Stack Page Compression

**Audit ref:** § 9.1 (7 identical category sections).

**The problem:** 7 vertical category sections all in the same shape.

**The fix:** Compress the rhythm — instead of 7 sections, render a
**single composed grid** with categories as **vertical lanes**:

- Desktop (`lg+`): 4-column grid where each lane is a category.
  Category title sits at the top of each lane; tech items stack
  beneath in mono-rendered rows (no chip containers — just the name
  + tiny role line).
- Tablet (`md`): 2-lane grid with categories in priority order
  (Cloud / Application / Backend / AI / Data / Identity / Observability).
- Mobile: single-column accordion. Each category collapsed by
  default; tap to expand. Reduces 7 stacked sections to ~7 small
  rows.

Certifications Radar moves from "section 08" inside the same page
to its own micro-section at the bottom, with one tight composition
(2 cards side-by-side on md+).

**Affected files:** `app/stack/page.tsx`, replace
`app/stack/_components/TechCard.tsx` with a lane-row primitive.

**Validation:**
- [ ] Page length reduced by ~60 % on desktop.
- [ ] Mobile accordion fully keyboard-accessible.
- [ ] All 50+ tech items still visible somewhere.

**Rollback:** Flag off → 7-section vertical layout returns.

### 5.3 Phase 14 Exit Criteria

- [ ] All 5 sub-PRs merged.
- [ ] `/work` (or `/projects` + `/architecture`) bounce rate measurably lower.
- [ ] Mobile architecture engagement (timeline ladder) telemetry shows non-zero `engaged` events from mobile sessions.
- [ ] Stack page session time stable or improved.

### 5.4 Phase 14 Maintenance: 2.0 h / month

---

## 📡 6. PHASE 15 — OPERATOR SURFACES + LUMINA + CONTACT

**Duration:** 90–120 days
**Risk:** MEDIUM (operator surfaces are operator-facing; lower risk than work surfaces)
**Leverage:** 8/10
**Audit refs:** §§ 11.1–11.3 (Telemetry), 13.1–13.3 (operator family), 14 (Lumina), 15 (Contact), 16 (chat trigger)

### 6.1 Mission

Differentiate the operator surface family so the five pages stop
reading as one template. Replace the Sparkles AI cliché on the
Lumina trigger. Mount the V5 adaptive classifier on `/contact`.

### 6.2 Sub-PR Map (5 sub-PRs)

---

#### Sub-PR 15.1 — `/telemetry` From Dashboard To Observatory

**Audit refs:** §§ 11.1, 11.2, 11.3.

**The problem:** 18 tiles, no hierarchy, dashboard-flavored.

**The fix:** A composed editorial observatory:

- **Section 01 — The Operating Loop**: One paragraph + 3 *anchor
  observations* (Lumina p95 / Auto-tweet success / npm weekly
  downloads), each rendered as a **sentence with the number inline**.
  Example: "Lumina answers in about **420 ms** at the 95th
  percentile, measured against the last 100 conversations." The
  number is the largest text in the sentence; the rest is body.
- **Section 02 — Cost & Capacity**: Bedrock cost / day · MRR ·
  lab-spending rolling window. A single 3-col tight strip.
- **Section 03 — Surface Adoption**: visits to operator surfaces
  (/telemetry, /changelog, /lab, /v5/perception, /v5/operating).
  Rendered as a single sparkline-of-counts horizontal sequence —
  no individual tiles, no chrome. Just the numbers in mono with
  cyan ticks beneath like a low-resolution bar chart.
- **Section 04 — Lab Throughput**: IAM Translator + Prompt Rescuer
  + Commit Narrator (completions and cost). A 3-row table with
  consistent ratios per row, mono.
- **Section 05 — CLI Adoption**: ask completions + npm weekly
  downloads. Two anchor observations.
- **Section 06 — Notes Engagement**: audio plays + diagram interactions.
  One micro-section.
- Provenance footer kept (slug list).

Total elements drop from 18 → ~6 composed observations. Identity
becomes editorial-operator, not dashboard-operator. Recruiter
reads it as "this person measures the right things at the right
depth," not "this person built another dashboard."

**Affected files:** `app/telemetry/page.tsx`, new
`app/telemetry/_components/Observation.tsx`,
`app/telemetry/_components/AdoptionStrip.tsx`.

**Validation:**
- [ ] Same data sourced from same KV keys; no telemetry contract change.
- [ ] LCP improves (less DOM).
- [ ] Mobile: each observation a single paragraph; total page = 6 viewports, was 18.
- [ ] All 18 metrics still surfaced; none deleted (some grouped).

**Rollback:** Flag `V6_TELEMETRY_OBSERVATORY` off → 18-tile grid returns.

---

#### Sub-PR 15.2 — Operator-Family Identity Divergence

**Audit ref:** § 13.1.

**The problem:** `/telemetry`, `/changelog`, `/v5/operating`,
`/v5/journal`, `/v5/perception`, `/evolution`, `/lumina/brain` all
read as the same template.

**The fix:** Each operator surface gains **one signature element**
that the others don't have, while preserving structural family
DNA (mono eyebrow, edge-lit cards, numbered sections):

| Surface | Signature element |
|---------|--------------------|
| `/telemetry` | The inline-observation sentence treatment (Sub-PR 15.1) |
| `/changelog` | Vertical *spine* — a left-margin cyan rule that connects every day-bucket header to the next |
| `/v5/operating` | Sectional numbering rendered as **two-digit large mono** (01·02·03) anchored OUTSIDE the content column on `lg+`, like chapter numbers |
| `/v5/journal` | Each weekly entry's first line of narrative rendered in display-size type, the rest as collapsed metadata — week as a magazine spread |
| `/v5/perception` | The ASCII flow diagram (audit § 13.3) becomes a **first-class signature element** that anchors the page; it moves to section 02 (was 03) and gains intentional spacing |
| `/evolution` | The slider becomes more prominent (larger spacing, larger thumb); each event card uses the margin-tick from Phase 11.5 |
| `/lumina/brain` | Tool registry rendered as a **typed grammar tree**, not a card list — categories as branch labels, tools as leaves with the existing purpose lines |
| `/lumina/failures` | "Failure mode theater" — each entry rendered as a **four-cell narrative card** (What / Why / Fix / Delta), borrowing the architecture page's milestone composition (audit § 14.2) |

Each move is small. Cumulatively, the family stops blurring.

**Affected files:** Each operator page file (`.tsx`).

**Validation:**
- [ ] Family-level visual identifier: every surface still uses
      mono eyebrow + numbered sections + edge-lit cards (DNA preserved).
- [ ] Each surface has at least one element no other has.
- [ ] No telemetry contract changes.

**Rollback:** Per-surface flags `V6_OPERATOR_<surface>` off → V5 layout.

---

#### Sub-PR 15.3 — Lumina Trigger Refresh (Retire Sparkles)

**Audit ref:** § 16.1.

**The problem:** `<Sparkles>` is the universal AI icon.

**The fix:** Replace with a **single small cyan core glyph** that
mirrors the LuminaAvatar's center — a 16 px circle with a faint
cyan-radial fill and a 1 px cyan ring outline. The pulse animation
shifts from icon-opacity oscillation to a slow **outer ring breath**
(the existing ring just gains a subtle scale+opacity loop, ~3.8s
period, identical to the avatar's breathing pulse). The trigger
becomes a *miniature of the avatar*.

Effect: opening Lumina is the act of *enlarging the trigger into the
avatar*. The two surfaces share an identity, not a relationship of
"button → window."

**Affected files:** `components/chat/LuminaTrigger.tsx`.

**Validation:**
- [ ] No lucide icon imports remain in the file.
- [ ] Hit target ≥ 44 × 44.
- [ ] Reduced-motion: static cyan glyph (no breath).
- [ ] Open transition between trigger and avatar reads as continuity (not "icon swap to image").

**Rollback:** Flag off → Sparkles returns.

---

#### Sub-PR 15.4 — Mount AdaptivePatternProvider On `/contact`

**Audit ref:** § 15.

**The problem:** V5 8.5 shipped the adaptive classifier; `/contact`
doesn't mount it. The page is the V5 default.

**The fix:** Mount the `<AdaptivePatternProvider>` at the contact
page wrapper level, with three reading modes (composition only, no
addressed copy — V5 § 2.4 + audit § 1.3 of V5 future systems
catalog):

- **default** (V5 baseline): hero / form / footer.
- **recruiter**: hero / **case-study card for last-viewed project**
  (sourced from session interface-memory if implemented; otherwise
  just CWH) / form / footer.
- **senior-engineer**: hero / **engineering reference strip** (last
  3 commits with WHY paragraphs) / form / footer.

Recolor the contact page atmosphere (audit § 15.2) to the
`signal` variant from Phase 11.1.

**Affected files:** `app/contact/page.tsx`,
`app/contact/_components/RecruiterCaseStudy.tsx` (new),
`app/contact/_components/EngineeringReference.tsx` (new).

**Validation:**
- [ ] No addressed copy ("we noticed…").
- [ ] Default classifier output → V5 layout byte-identical.
- [ ] Reduced-motion: composition shift is instantaneous.
- [ ] Telemetry: classifier event fires per-session.

**Rollback:** Flag `V6_CONTACT_ADAPTIVE` off → default V5 layout.

---

#### Sub-PR 15.5 — Lumina Window Header Compression

**Audit ref:** § 16.3.

**The problem:** Header has 5 interactive surfaces (title, status,
memory toggle, forget, close).

**The fix:** Cluster the privacy controls (memory toggle + forget)
behind a single hairline-bordered popover trigger labeled with a
small cyan dot + "Privacy":

- Tap "Privacy" → opens a tight popover with the two existing
  controls (Memory on/off · Forget conversation), each with its
  current label and tooltip preserved.
- Header now reads: title + status + Privacy + Close. Four
  elements, calmer.
- Touch targets remain 44 × 44 on every control.

**Affected files:** `components/chat/LuminaWindow.tsx`, new
`components/chat/LuminaPrivacyPopover.tsx`.

**Validation:**
- [ ] No functional regression (memory toggle still flips state).
- [ ] Keyboard: Tab order preserved; popover keyboard-trappable.
- [ ] aria-label set on Privacy trigger.

**Rollback:** Flag off → 3-button strip returns.

### 6.3 Phase 15 Exit Criteria

- [ ] All 5 sub-PRs merged.
- [ ] Telemetry observatory reads as editorial; not 18-tile dashboard.
- [ ] Lumina trigger and avatar share identity visibly.
- [ ] Contact page demonstrates adaptive composition without theatre.

### 6.4 Phase 15 Maintenance: 2.0 h / month

---

## 🔧 7. SUB-PR EXECUTION TEMPLATE

```
SUB-PR <phase>.<n> — <slug>

PRE-EXECUTION
1. Re-read PORTFOLYO_V6_UI_AUDIT.md (the specific section this fixes).
2. Re-read PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § <phase>.<n>.
3. Confirm the Three-Cut Rule (§ 1.1) — ≤ 3 visible cuts.
4. Confirm V4/V5 system contracts untouched (§ 1.2 identity carry-through).

EXECUTION
5. Single commit. ≤ 8 files (cross-cutting tokens excepted).
6. Ship env flag default off.
7. Companion report at sub-pr-report/v6/Sub-PR_<phase>.<n>_<slug>.md.
8. Before/after screenshots desktop (1280) + mobile (375).
9. Reduced-motion path verified.
10. Mobile Lighthouse ≥ 92 on changed routes.

POST
11. Push. Deploy. Observe 14 days minimum, 30 days for token reforms.
12. Operator flips flag on after observation green.
13. Approve next sub-PR.
```

---

## 🛡️ 8. ROLLBACK MATRIX

Every V6 sub-PR is flag-gated. Phase-level rollback = all flags in
the phase off; route renders V5 baseline.

| Flag | Surface(s) | Default |
|------|-----------|---------|
| `V6_ATMOSPHERE_VARIANTS` | All pages | off |
| `V6_PILL_VOCABULARY` | Status surfaces | off |
| `V6_GLASS_RETIREMENT` | All glass usages | off |
| `V6_TEXT_TOKENS_CANONICAL` | All text | off (replacement is mechanical; flag is preference) |
| `V6_MARGIN_TICK` | About, future surfaces | off |
| `V6_NAV_PROMOTION` | Navbar | off |
| `V6_MOBILE_NAV` | Navbar mobile | off |
| `V6_FOOTER_RECOMPOSE` | Footer | off |
| `V6_NOTES_EDITORIAL` | `/notes` | off |
| `V6_CODEX_SHELF` | `/codex` | off |
| `V6_ABOUT_RESTRUCTURE` | `/about` | off |
| `V6_ABOUT_SPATIAL_VAR` | `/about` | off |
| `V6_PULSE_EXTRACTION` | `/about`, new `/pulse` | off |
| `V6_WORK_HUB` | `/work`, hubs | off |
| `V6_PROJECT_DETAIL` | `/projects/[slug]` | off |
| `V6_SCROLL_STORY_VARIANTS` | `/architecture/*` | off |
| `V6_TIMELINE_MOBILE` | `/architecture/*` mobile | off |
| `V6_STACK_COMPRESS` | `/stack` | off |
| `V6_TELEMETRY_OBSERVATORY` | `/telemetry` | off |
| `V6_OPERATOR_FAMILY` | Operator family pages | off |
| `V6_LUMINA_TRIGGER` | LuminaTrigger | off |
| `V6_CONTACT_ADAPTIVE` | `/contact` | off |
| `V6_LUMINA_HEADER` | LuminaWindow | off |

Full V6 rollback: every flag off; site renders V5 baseline. No code revert required.

---

## ♻️ 9. SUSTAINABILITY CONTRACT

V6 cumulative monthly maintenance budget:

| Phase | New monthly hours | Cumulative |
|-------|--------------------|-------------|
| 11 | 1.0 | 1.0 |
| 12 | 0.5 | 1.5 |
| 13 | 1.5 | 3.0 |
| 14 | 2.0 | 5.0 |
| 15 | 2.0 | 7.0 |

Plus V5 baseline (12 h/month) plus V4 baseline. Total stays within
the V5 § 1.3 ceiling of 50 h/month.

Phase pauses automatically if:
- Mobile Lighthouse drops below 92.
- Founder energy red 2 consecutive weeks.
- Atmosphere variants ship hydration mismatch (rollback to legacy).
- Any operator surface visit count drops by ≥ 25 % post-redesign.

---

## 📊 10. SUCCESS METRICS

Per-phase success signals:

| Phase | Primary signal | Secondary signal |
|-------|----------------|-------------------|
| 11 | Site no longer reads as templated wallpaper | No color palette violations remain |
| 12 | Mobile nav drawer usage > 0 within 14 days | Lab + Codex visit counts rise (surface promotion) |
| 13 | About page bottom-section engagement up by ≥ 20 % | Notes hub session time stable or up |
| 14 | `/work` or merged hub session time improves vs legacy hubs | Mobile architecture timeline engagement non-zero |
| 15 | Telemetry session time stable despite less content | Lumina trigger ↔ avatar visual continuity verified by user feedback |

Overall V6 success: an anonymous senior engineer encounter sends an
unsolicited "I've never seen a portfolio like this" message via
`/contact` within 6 months of Phase 15 close — without being able
to point to a single feature as the cause.

---

## 🌟 CLOSING

V6 is **interface evolution**. The systems below remain. The
presentation above evolves.

Twenty-four sub-PRs. Five phases. ~7-10 months calendar. Every
sub-PR small enough to revert with one flag flip. Every redesign
preserving every V4/V5 contract.

The recruiter visiting after V6 completion should see:
- Top of `/` — identity legible in 8 seconds.
- Navbar — distinctive surfaces promoted, not hidden.
- Mobile — designed, not collapsed.
- `/work` — bespoke compositions per project, no template chips.
- `/architecture` — three projects, three tonal variations.
- `/codex` — three books, one composed shelf.
- `/telemetry` — observatory, not dashboard.
- `/lumina` — trigger ↔ avatar continuity.
- Atmosphere — six variants across the surface family.
- Identity — cyan + black + Geist, intact and intentional.

Same systems. New interface.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
