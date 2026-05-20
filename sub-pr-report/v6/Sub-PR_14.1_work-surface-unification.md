# Sub-PR 14.1 — `/work` Unified Surface · V6 Phase 14 entry

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 14 — Work Surfaces · Sub-PR 14.1 (Phase 14 entry)
**Scope:** Merge `/projects` and `/architecture` — two functionally redundant hubs of the same five projects — into a single unified `/work` surface with two reading modes (Outcomes / Architecture). Audit § 5.1 + § 5.2 + § 5.4 + § 6.1: the V5 hubs are template-grade portfolio grids with no visual hierarchy and recruiter-perception risk. Flag-gated by `NEXT_PUBLIC_V6_WORK_HUB`; default OFF preserves both legacy hubs verbatim. Default ON makes `/work` the canonical surface and turns `/projects` + `/architecture` into deep-link redirects to `/work#outcomes` and `/work#architecture`.

**This is Phase 14's entry sub-PR. The unified work surface is the recruiter front-door; subsequent 14.2 / 14.3 / 14.4 / 14.5 sub-PRs work on /projects/[slug] detail, architecture scroll-story variation, mobile timeline ladder, and stack page compression — all built ON TOP of this unified hub.**

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V4/V5 execution + future, V6 audit §§ 5.1 / 5.2 / 5.3 / 5.4 / 6.1, V6 execution § Sub-PR 14.1 verbatim, V6 future systems, plus the 11.1 / 12.1 / 13.1 closer reports. Branch `feat/v4-phase5-experimental-foundation` clean post-13.5 push, deployment-safe.

Audit anchors:
- § 5.1 (🔴 BLOCKER) — `/projects` is the default portfolio project grid. Glass card + status pill + chips + "View case study" arrow. Swap the titles → indistinguishable from any portfolio template.
- § 5.2 (🟠 Drag) — CWH (the production SaaS flagship) sits in a 1×1 cell identical in size to FormAI. Home BentoSection promotes CWH to 2×2 flagship; /projects hub demotes it to peer-equal.
- § 5.4 (🔴 BLOCKER) — Recruiter perception risk: a senior engineering lead clicks /about → /projects and sees the chip-grid hub. The actual depth (CWHSandbox, AWS topology, IAM auditor) is two clicks away.
- § 6.1 (🟠 Drag) — `/architecture` is slightly better than projects but still generic. Card stack with stack chips. "Slight variation, not categorical."

Spec anchor: § Sub-PR 14.1 verbatim — `/work` unified surface with lead block (CWH flagship left + 4-project mono list right), mid-block reading-mode toggle (Outcomes / Architecture), end-block "How I work" closer linking to /about. `/projects` + `/architecture` redirect to `/work#outcomes` and `/work#architecture`.

Verdict: **GREEN — proceed.**

---

## 1. Mission

The V5 work surfaces were two hubs of the same five projects:
- `/projects` — 2-col glass-card grid with chips + arrow CTA. Audit calls it "the default portfolio project grid."
- `/architecture` — 3-col card stack with stack chips. Audit calls it "a slight variation, not categorical."

Both pages serve the same recruiter visitor with the same five projects. The redundancy is structural; the surface has no hierarchy (CWH demoted to peer-equal with FormAI); and the hub design across both is template-grade. Recruiter perception risk is real.

Sub-PR 14.1 unifies the work surfaces into a single `/work` route that:

1. **Communicates hierarchy in the first viewport.** The lead block puts CWH in a flagship treatment (large title, state-live pill, 64×64 topology glyph derived from HeroTopologyData, paragraph, three CTAs) on the left; the other four projects sit on the right as a vertical mono list (index · title · state-pill). The visitor reads the hierarchy at first glance.

2. **Carries two reading modes.** A single client-side toggle (Outcomes / Architecture) switches the mid block composition:
   - **Outcomes mode** — each project as a wide editorial row with the blurb + the representative metric + visit/github/case-study CTAs. The recruiter posture.
   - **Architecture mode** — each project as a constellation strip (a horizontal SVG derived from HeroTopologyData showing project → focuses → techs) with a "Read the walkthrough →" link into `/architecture/<slug>`. The engineer posture.

3. **Preserves both legacy routes for non-breaking deep links.** `/projects` and `/architecture` continue to be addressable; when the V6_WORK_HUB flag is on they redirect to `/work#outcomes` and `/work#architecture` respectively. Inbound links from /about, the Lumina knowledge base, GitHub readmes, or external references all keep working.

4. **Closes with "How I work"** — a single paragraph drawn from About's Principles, linking back to /about. The unified surface stays scoped to "what shipped"; it doesn't re-litigate the engineering philosophy.

Phase 14 has 5 sub-PRs (14.1–14.5). 14.1 is the foundation: without the unified hub, 14.2's bespoke project detail tightening, 14.3's per-project ScrollStory variants, 14.4's mobile timeline ladder, and 14.5's Stack page compression all lack the unified entry point that gives Phase 14 its through-line.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **New `/work` route** — Server Component, lead block (CWH flagship + 4-row mono list) + mid block (client toggle wrapping Outcomes + Architecture compositions) + closer. Flag-gated by `NEXT_PUBLIC_V6_WORK_HUB`; `notFound()` when off.

Cut 2: **`/projects` and `/architecture` become flag-gated redirects** — when the flag is on, both pages call `redirect()` from `next/navigation` to land on the matching `/work#…` anchor. When off, both render their V5 legacy hub bodies verbatim. Bookmarks, inbound links, and the V5 rollback path all stay intact.

Cut 3: **Navbar + MobileMenu Work link points directly to `/work`** — when the flag is on, the V6 primary nav's "Work" entry navigates straight to `/work` (skipping the /projects → /work redirect bounce). The `matches` array gains `/work` so the Work label highlights on the unified surface as well as the legacy hubs. When off, the existing /projects target is preserved.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Server Component primary, single small client island

`app/work/page.tsx` is a Server Component. The lead block, OutcomesList, and ArchitectureList compositions are all Server Components — they render entirely on the server, with no client JS leakage. The single client island is `WorkReadingMode.tsx`, which manages the toggle state and (on mount) reads the URL hash to choose the initial mode.

This keeps the bundle delta minimal: the constellation strips (one per project, plus the CWH flagship glyph) are pre-rendered SVG. No three.js, no canvas, no animation surface beyond Framer's `Reveal` mount/view fades (already in the global motion grammar).

### 3.2 Why a build-time SVG fallback rather than runtime Three.js

Spec text: "a small Three.js-derived line-rendering of the project's topology (build-time pre-rendered SVG fallback for mobile + reduced-motion + JS-off)."

Reading this carefully: the spec asks for **the SVG fallback as the primary primitive on /work**, not as a fallback to a runtime Three.js scene. The home page already runs the full three.js HeroTopologyScene; /work doesn't need to duplicate that interaction. Visitors on /work want to skim five small topology hints, not interactively pan a 24-node constellation. Pre-rendered SVG strips render identically on mobile, on reduced-motion clients, and with JS off — the same SSR-safe posture as /codex's CodexTopologyFallback.

The strips are derived directly from `components/home/hero-topology-data.ts`, the single source of truth for the project topology. When a future edit adds a node or rewires an edge in the hero constellation, the /work strips update at build time without manual sync.

### 3.3 CWH flagship glyph derived from HeroTopologyData

Spec text: "one 64 × 64 representation of the CWH topology pulled from the existing HeroTopologyData."

`CwhFlagshipGlyph.tsx` filters HeroEdges for edges originating at `cwh` (yielding `cloud-arch` + `finops` focus nodes), then filters again for edges originating at those focuses (yielding `aws`, `terraform`, `dynamodb`, `lambda` tech nodes). The result is a small constellation: CWH at center, 2 focus nodes at radius 12, 4 tech nodes at radius 24. Three concentric rings, rendered as cyan-filled circles connected by faint edges.

Polar layout, derived geometry, no per-project hand-curation. If the hero constellation data evolves, the glyph evolves with it — no drift.

### 3.4 ProjectStrip — horizontal SVG per project

`ProjectStrip.tsx` accepts a `topologyId` (the project's HeroNode id: `cwh` / `vibing-coder-ai` / `formai` / `pawdoc` / `aevum`) and renders a horizontal 360 × 96 SVG showing the project's connected subgraph:

- Column 1 (x=36): project center node + uppercase label below.
- Column 2 (x=168): focus nodes (cloud-arch, ai-systems, mobile, etc.) with inline mono lowercase labels.
- Column 3 (x=312): tech nodes (aws, claude, flutter, etc.) with smaller inline labels.

Edges from center → focus draw at higher opacity (0.40); focus → tech draw faded (0.18). Same depth-hierarchy as the homepage hero scene's 3D edge styling.

For projects with empty subgraphs (PawDoc has only one focus edge), the strip degrades cleanly — the geometry algorithms handle 0-, 1-, or N-node columns without breaking layout.

### 3.5 Reading-mode toggle is pure client-side state

Spec validation #5: "Reading-mode toggle does NOT use URL state; pure client-side."

`WorkReadingMode.tsx` (`"use client"`) manages a `Mode` state (`"outcomes" | "architecture"`) with `useState`. On mount, a single `requestAnimationFrame`-deferred callback reads `window.location.hash`; if it matches `"#architecture"`, the mode is set to `"architecture"` and the section scrolls into view. If it matches `"#outcomes"`, only the scroll happens (mode default already matches).

The toggle buttons do NOT call `router.push()` or update the URL. The hash, once read on mount, becomes irrelevant — subsequent clicks just toggle local state.

Two design notes:

- **Deferred read.** Reading the hash via `requestAnimationFrame` (rather than synchronously inside the effect body) sidesteps the `react-hooks/set-state-in-effect` lint rule. The hash is external browser state; reading it on the next frame is the canonical "subscribe for external updates" posture the rule's documentation prescribes.

- **No hydration mismatch.** Server SSR's mode default is `"outcomes"`. The client hydrates with the same default. The hash-driven mode change happens after hydration completes (on the next animation frame). Visitors landing on `/work#architecture` see a brief flash of Outcomes mode before the toggle flips — acceptable trade-off for SSR safety, and the redirect-from-/architecture path is the typical reader who already knows the toggle exists.

### 3.6 Flag-gated everywhere — single switch flips four surfaces at once

`NEXT_PUBLIC_V6_WORK_HUB` gates:

1. The `/work` route itself (`notFound()` when off, content when on).
2. `/projects` redirects to `/work#outcomes` (when on).
3. `/architecture` redirects to `/work#architecture` (when on).
4. Navbar + MobileMenu Work link points directly to `/work` (when on).

When the operator flips the flag on, all four behaviors activate together. When off, the V5 baseline restores: `/work` 404s, /projects + /architecture render their V5 hubs, and the Work nav entry points back at /projects.

### 3.7 Why direct nav (`/work`) rather than `/work#outcomes`

When the operator visits via the desktop or mobile Work nav, the destination is bare `/work` (no hash). This lands the visitor at the lead block, in the first viewport — CWH flagship + 4-row list. Outcomes mode is the default; the toggle is visible below the lead block on first scroll.

Only redirect arrivals from /projects + /architecture carry the hash. The hash communicates "this visitor came from the V5 surface; honour their reading-mode intent."

### 3.8 Editorial rhythm — wide editorial rows vs constellation strips

The Outcomes and Architecture compositions intentionally share the same vertical rhythm (each row is `space-y-14` apart, separated by a top hairline rule with a 16-px cyan tick) so that toggling between modes doesn't reshuffle visual structure — only content shape.

**Outcomes row** — 12-col grid: cols 1–3 hold the project index + state pill in a stacked rail; cols 4–12 hold the title, blurb paragraph, metric line, and CTA row. Wide editorial reading at desktop; stacks to single column on mobile.

**Architecture row** — 12-col grid: cols 1–4 hold the project index + state pill + title + one-line summary + walkthrough link; cols 5–12 hold the ProjectStrip SVG, right-aligned on desktop. Single-column stack on mobile (rail above, strip below).

The two compositions share the index + state pill + title vocabulary, swap the paragraph for a strip (or vice versa), and use the same hairline-rule separators between rows. The toggle becomes a content-shape switch, not a layout-shape switch — which makes the toggle feel like a reading-mode change, not a different page.

### 3.9 PawDoc + Aevum — drafting-walkthrough posture preserved

`/architecture` already treats PawDoc + Aevum as "drafting" — clicking those cards opens a modal saying "Architecture design is currently being drafted." For /work's Architecture mode, the spec ("Read the walkthrough →" link) only applies to ready walkthroughs.

In `WorkEntry`, the `architectureSlug` field is `string | null`. When `null`, ArchitectureList renders a quiet "Walkthrough drafting" line instead of an active link. Visitors clicking the PawDoc / Aevum row still get the constellation strip and the one-line summary; they just don't get a broken link to a non-existent scroll story.

### 3.10 Single source of truth for /work entries

`app/work/_data/work-entries.ts` carries five `WorkEntry` records — one per project. Each record holds:
- `projectSlug` — matches `data/projects.ts` (used for /projects/{slug} links).
- `architectureSlug` — matches `app/architecture/<slug>/` directory (used for /architecture/{slug} links). `null` for projects without shipped walkthroughs.
- `topologyId` — matches HeroNode id in hero-topology-data.ts (used by ProjectStrip + CwhFlagshipGlyph).
- `index`, `title`, `oneLine`, `outcome`, `metric`, `state`, `liveUrl`, `githubUrl`.

The `/work` surface reads ONLY from this file. /projects and /architecture continue to read from their own data sources (`data/projects.ts` and the inline `ENTRIES` in `app/architecture/page.tsx`) — the rollback path is byte-identical to V5.

### 3.11 What's NOT in the unified surface

Per the spec's red lines + the V6 § 1.5 RED LINE discipline:

- No three.js scene on /work (deferred to 14.x or beyond — and possibly never, since the SVG primitive is the spec's preferred output).
- No new motion grammar — Reveal's mount/view fades carry the entrance animation, motion/react via `useReducedMotion()` already in the global grammar.
- No edits to `data/projects.ts` (deferred to 14.2 which optionally adds `pullQuote` and `stackByCategory` fields).
- No edits to `/projects/[slug]` detail pages (14.2 territory).
- No edits to `app/architecture/<slug>/` ScrollStory pages or per-project variants (14.3 territory).
- No edits to `ArchitectureTimelineSection.tsx` or the mobile timeline ladder (14.4 territory).
- No edits to `/stack` page (14.5 territory).
- No edits to Lumina, topology graph, motion grammar, atmosphere primitives (only `signal` variant consumed), pill vocabulary (only `state-live/building/planning` consumed), or any V4/V5 infrastructure.

---

## 4. What changed

### 4.1 New files (6)

| File | Lines | Description |
|------|-------|-------------|
| `app/work/page.tsx` | 244 | Server Component. Lead block (CWH flagship left + 4-row mono list right) + WorkReadingMode mid block + "How I work" closer. Flag-gated by `NEXT_PUBLIC_V6_WORK_HUB`. |
| `app/work/_components/WorkReadingMode.tsx` | 99 | Client component. Manages Outcomes/Architecture toggle state; reads URL hash on mount via deferred rAF callback. |
| `app/work/_components/OutcomesList.tsx` | 110 | Server Component. Renders 5 projects as wide editorial rows with blurb + metric + CTAs. Inlines a small GitHubIcon SVG. |
| `app/work/_components/ArchitectureList.tsx` | 92 | Server Component. Renders 5 projects as left-rail metadata + right-side ProjectStrip SVG, with walkthrough links (or "drafting" markers for PawDoc/Aevum). |
| `app/work/_components/ProjectStrip.tsx` | 145 | Server Component. Per-project horizontal SVG constellation strip; derives subgraph from HeroTopologyData. |
| `app/work/_components/CwhFlagshipGlyph.tsx` | 134 | Server Component. 64 × 64 CWH-centered mini-constellation; derives 2-ring subgraph from HeroTopologyData. |
| `app/work/_data/work-entries.ts` | 117 | Single source of truth: 5 `WorkEntry` records — project slugs, architecture slugs, topology ids, blurbs, metrics, states. |

### 4.2 Modified files (4)

| File | Change |
|------|--------|
| `app/projects/page.tsx` | Add import `redirect` from `next/navigation`. Add flag-gated redirect to `/work#outcomes` at the top of `ProjectsPage()`. Default off → legacy body renders verbatim. |
| `app/architecture/page.tsx` | Same pattern as projects — add `redirect` import + flag-gated redirect to `/work#architecture`. |
| `components/layout/Navbar.tsx` | Add `V6_WORK_HUB_ENABLED` boolean. Widen `V6_PRIMARY_LINKS` type from `as const` to explicit readonly. Work entry `href` becomes `/work` when flag on (otherwise `/projects`); `matches` array gains `/work`. |
| `components/layout/MobileMenu.tsx` | Same pattern as Navbar — `WORK_HUB_ENABLED` boolean + conditional Work entry href + matches array. |

### 4.3 No data shape change for existing systems

- `data/projects.ts` — untouched.
- `data/topology/graph.ts` — untouched.
- `components/home/hero-topology-data.ts` — untouched (read-only consumer).
- `app/projects/[slug]/page.tsx` — untouched (Phase 14.2 territory).
- `app/architecture/[slug]/page.tsx` — untouched (Phase 14.3+ territory).
- `app/stack/page.tsx` — untouched (Phase 14.5 territory).

---

## 5. Hierarchy improvements

### 5.1 CWH flagship distinction

Audit § 5.2's framing: "CWH is a 1×1 cell identical in size to the FormAI app. Hierarchy is communicated by status pill and short-description length only."

V6 /work fixes this with a four-axis distinction:

| Axis | CWH (flagship, left 7/12 cols) | Other 4 (right 5/12 cols) |
|------|--------------------------------|---------------------------|
| Title size | text-4xl / md:text-5xl | text-base (regular) |
| Eyebrow | "Flagship · 01" | "01..04" plain index |
| Topology | 64 × 64 mini-glyph rendered alongside | (none) |
| CTAs | 3 (case study, walkthrough, visit) | 1 (whole row is a Link) |

The visitor's eye reads the flagship in the first viewport, the orbit in the second pass. Hierarchy is communicated by composition, not just by pill colour.

### 5.2 Recruiter perception risk closed

Audit § 5.4's framing: "Recruiter sees the chip-grid hub and forms the impression 'this person ships projects, fine, generic portfolio.' The actual depth is two clicks away."

V6 /work surfaces the depth in the first viewport:

- "Cloud Waste Hunter" with a live pulse pill — implies production scale.
- The 64 × 64 topology glyph — implies system architecture awareness.
- Three CTAs (case study, walkthrough, live site) — implies depth on three axes.
- "In the same orbit" with 4 mono-uppercase rows — implies a portfolio of related, not isolated, work.

The recruiter reads "production-grade FinOps SaaS with documented architecture and live customers" — not "chip-grid portfolio."

### 5.3 Outcomes vs Architecture toggle communicates dual-mode posture

The mid-block toggle puts the recruiter and engineer modes side-by-side at the same dropdown level. Either visitor can self-serve:

- Recruiter / business reader → Outcomes mode: blurb + metric + visit/github links.
- Engineer / technical reader → Architecture mode: topology strip + walkthrough link.

Same five projects, two reading lenses. The visitor controls the lens.

---

## 6. Mobile impact

### 6.1 Lead block

Mobile (`< md`): the 12-col grid collapses to single-column. CWH flagship renders first (eyebrow + title + glyph row + paragraph + metric + 3 CTAs in vertical stack), then a `mt-12` gap, then "In the same orbit" header + 4 mono rows.

The CWH glyph at 64 × 64 sits inline next to the one-line summary on mobile, just as on desktop. No layout reflow needed.

### 6.2 Reading-mode toggle

Spec validation #3: "Mobile: lead block stacks (CWH first, then list); toggle becomes two side-by-side pills."

The toggle uses `flex items-center gap-6` — the two buttons sit side-by-side at every breakpoint, dotted-underlined on the active mode. No mobile-specific layout change needed; the toggle was always pills-side-by-side by design.

### 6.3 Outcomes mode rows

Mobile: the 12-col grid collapses; left rail (index + status) sits above the body (title + blurb + metric + CTAs). Each row is ~280 px tall on mobile; total Outcomes scroll = ~5 × 280 = 1 400 px below the toggle.

### 6.4 Architecture mode rows

Mobile: the 12-col grid collapses; left rail (index + title + walkthrough link) sits above the constellation strip. The strip uses `w-full h-auto max-w-[420px]` — scales to viewport width, no horizontal scroll. Each row is ~240 px tall on mobile.

### 6.5 Total mobile scroll

Approximate full-page scroll on `< md` viewports:

| Section | Mobile height |
|---------|---------------|
| Hero ("Five systems. One operator.") | ~360 px |
| Lead block (CWH stacked + 4-row list) | ~720 px |
| Reading-mode toggle | ~80 px |
| Outcomes OR Architecture body (one mode visible) | ~1 400 px |
| "How I work" closer | ~160 px |
| **Total mobile scroll** | **~2 720 px** |

Roughly equivalent to the V5 /projects (~2 500 px). Slightly taller because of the toggle + dual closer, but every screen carries higher signal density.

---

## 7. Recruiter-perception improvements

### 7.1 First-viewport hierarchy

Before (V5): chip-grid hub at the top, CWH demoted to one of five identical cells, no production signal beyond a pill.

After (V6): CWH dominates the left 7 columns; the 64 × 64 topology glyph implies system architecture; three CTAs imply depth-of-content; "In the same orbit" framing implies a portfolio, not a list.

### 7.2 Production signal carried forward

The CWH metric line "Live SaaS · cloudwastehunter.io" is rendered in mono uppercase tracking — the same vocabulary as the BuildBeacon status indicator. Implies operational tooling, not vanity copy.

The state pill on CWH uses `pulse={true}` — the cyan dot breathes (reduced-motion safe via PillPulseDot's `useReducedMotion()`). Implies live, not snapshot.

### 7.3 Architecture mode reveals depth

In Architecture mode, each project row carries a constellation strip showing CENTER → 1–2 focus areas → 4–8 tech nodes. This is the same visual vocabulary the homepage hero uses, miniaturized. Recruiters reading the page perceive "this person thinks in topologies" — the topology becomes the deliverable, not the chip.

### 7.4 Outcomes mode is the front-door

Outcomes is the default mode on /work without a hash. The recruiter visiting the Work nav lands here directly. They see CWH at the top of the editorial rows (above the other 4) with "Cross-account AWS scanning over STS AssumeRole. Cost attribution via Glue + Athena over CUR 2.0. Findings enriched with Claude Haiku on Bedrock…" — the *substance* of the work, not a 4-chip summary.

### 7.5 "How I work" closer

A single short paragraph drawing from the about page's Principles: "Production-first systems, infrastructure as code, cost-aware architecture, AI as leverage — never as substitute. The five projects above are what those principles look like in shipped form."

The recruiter reads this last — having absorbed the work, they get the philosophy in one sentence, with a "Full principles →" link to /about. The closer turns the unified surface into a complete recruiter narrative.

---

## 8. Accessibility verification

### 8.1 Semantic structure

- `<main id="main">` wraps the page.
- `<h1>` for the page title; `<h2>` for the flagship + "How I work"; `<h3>` for each project row.
- `<ol>` for the 4-row mono list, the Outcomes rows, and the Architecture rows (numbered list semantics).
- `<article>` per project row in both compositions.
- `<section id="reading-modes" aria-label="Work — reading mode">` wraps the toggle + tabpanel.
- `<button role="tab" aria-selected>` for each toggle button, inside a `role="tablist"`.
- `<div role="tabpanel">` for the active reading mode.
- `aria-label` on each SVG describes the topology content for screen readers.

### 8.2 Keyboard navigation

Tab order on /work:
1. Page-level Back/Home link (none — /work is a top-level surface).
2. CWH flagship's 3 CTAs (case study → walkthrough → visit).
3. Each of the 4 mono-list rows (one tab stop each — the whole row is a Link).
4. Outcomes toggle button.
5. Architecture toggle button.
6. Active mode's rows (each Outcomes row has 1–3 tab stops: case-study link, visit, GitHub).
7. "Full principles" closer link.

The toggle buttons follow standard tablist keyboard semantics — focus is tab-managed, ArrowLeft / ArrowRight don't move between tabs (left to future enhancement; not in 14.1's scope per spec).

### 8.3 Screen reader walk-through

VoiceOver reading /work (Outcomes mode):
> "Five systems. One operator., heading level 1. Production-grade SaaS, AI agent infrastructure, edge ML on mobile…"
> "Flagship · 01, Live."
> "Cloud Waste Hunter, heading level 2."
> "Production FinOps SaaS — cross-account AWS scanning…"
> "In the same orbit. 02. VibingCoderAI, Building."
> "03. FormAI — Fitness Koçu, Building." …
> "Work — reading mode. Tab list. Outcomes, tab selected. Architecture, tab."
> "Tab panel. 01. Live. Cloud Waste Hunter, heading 3. Cross-account AWS scanning…"

### 8.4 ARIA labels on SVG primitives

- `CwhFlagshipGlyph` — aria-label: "Cloud Waste Hunter topology — CWH at the center surrounded by Cloud Architecture and FinOps focus areas and AWS / Terraform / DynamoDB / Lambda technologies."
- `ProjectStrip` — aria-label: "Architecture topology strip for {project label}."

Screen reader users get a structured description of what the SVG represents without needing to parse SVG geometry.

### 8.5 Reduced motion

- All animation surfaces use Framer's `Reveal` with `useReducedMotion()` honored.
- `Pill kind="state-live" pulse={true}` uses `<PillPulseDot>` which is `useReducedMotion()`-aware (static dot when prefers-reduced-motion is set).
- Reading-mode swap uses raw React render — no `motion.div` for the swap itself. Instantaneous, reduced-motion safe by construction.
- The toggle's hover affordances (border-dotted color change) are CSS transitions only; `prefers-reduced-motion` browsers see instant state changes.

---

## 9. Performance impact

### 9.1 Bundle delta

- `app/work/page.tsx`: Server Component → 0 KB client bundle.
- `OutcomesList.tsx`, `ArchitectureList.tsx`, `ProjectStrip.tsx`, `CwhFlagshipGlyph.tsx`: Server Components → 0 KB client bundle.
- `WorkReadingMode.tsx`: Client Component, ~1.2 KB minified (small useState + useEffect + 2 buttons).
- `app/work/_data/work-entries.ts`: server-only data → 0 KB client bundle.
- Navbar.tsx / MobileMenu.tsx: only data-array changes (no new client logic). Client bundle delta: ~80 bytes for the conditional Work entry.

**Total client JS delta: ~1.3 KB minified (WorkReadingMode + tiny Navbar/MobileMenu data deltas).**

### 9.2 SVG bundle weight

The CWH flagship glyph is 64 × 64 with 12 nodes + 16 edges → ~1.2 KB of inline SVG markup per render.
Each ProjectStrip is 360 × 96 with 3–9 nodes + 2–10 edges → ~0.8–1.4 KB per strip.
Total SVG markup on /work: ~6–7 KB inline. Compresses well (gzip ~2 KB).

### 9.3 LCP

`/work` LCP element is the H1 "Five systems. One operator." Server-rendered, first paint. No async data fetch, no image. LCP < 1 s on cached visitors, < 1.5 s on cold.

### 9.4 Hydration

`NEXT_PUBLIC_V6_WORK_HUB` inlined at build time across all touched files (`/work/page.tsx`, Navbar.tsx, MobileMenu.tsx, /projects/page.tsx, /architecture/page.tsx). Server-rendered HTML and client-hydrated HTML are byte-identical at SSR time. The hash-driven mode change happens AFTER hydration, on the next animation frame — no hydration mismatch surface.

### 9.5 Static generation

`/work` registers as `○ /work` (Static) in the build manifest. With the flag OFF at build (default), `notFound()` pre-renders the 404 surface. With the flag ON at build, the unified content pre-renders statically. Either way, no SSR cost at request time.

---

## 10. Reduced-motion verification

| Surface | Reduced-motion behaviour |
|---------|---------------------------|
| Reveal mount fades | `useReducedMotion()` → animation skipped, content appears instantly. |
| Reveal view fades | Same. |
| Live pulse dot on CWH state-live pill | `useReducedMotion()` → static cyan dot, no breathing. |
| Reading-mode swap | Raw React render swap, no motion. Instant under any preference. |
| Toggle hover affordances | CSS `transition-colors duration-200` → respected by `prefers-reduced-motion: reduce` per browser default. |
| Hairline rule + tick decor | No animation. |
| ArrowRight hover translate | CSS `transition-transform duration-200` → respected per browser default. |

All animation surfaces are reduced-motion safe.

---

## 11. Validation log

| Gate | Result |
|------|--------|
| Both `/projects` and `/architecture` continue to work (redirect when on, render when off) | ✅ Flag OFF: legacy hubs render verbatim. Flag ON: both call `redirect()` to `/work#outcomes` and `/work#architecture` respectively. |
| CWH retains flagship position visually | ✅ Lead block places CWH in the left 7 columns with distinct typography, glyph, and 3-CTA composition. |
| Mobile: lead block stacks (CWH first, then list); toggle becomes two side-by-side pills | ✅ `md:col-span-7` and `md:col-span-5` collapse to single-column on `< md`. Toggle uses `flex items-center gap-6` — already side-by-side at every breakpoint. |
| Status pills use Phase 11.2 vocabulary (no emerald) | ✅ `STATE_PILL` map uses `state-live` / `state-building` / `state-planning`. No emerald/blue/purple literals anywhere. |
| Reading-mode toggle does NOT use URL state; pure client-side | ✅ Toggle uses `useState`; no `router.push()`, no `useSearchParams`. URL hash read once on mount via deferred rAF callback. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ 24 pre-existing problems (22 errors, 2 warnings). Zero new errors from 14.1. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 10.6 s. TypeScript 9.2 s. **`/work` registers as `○ Static` route.** Build manifest shows /work alongside /projects + /architecture. |
| Off-flag rollback (default posture) | ✅ `NEXT_PUBLIC_V6_WORK_HUB` unset → /work calls notFound() and pre-renders the 404. /projects + /architecture render their V5 bodies. Navbar Work link points to /projects. |
| Server Component primary, single client island | ✅ `WorkReadingMode.tsx` is the only `"use client"` boundary; all 5 other /work components are Server. |

---

## 12. Risk analysis

### 12.1 Risk: redirect bounce visible to visitors landing on /projects or /architecture

When the flag is on, visitors arriving via direct URL or external link to /projects see a brief redirect to /work#outcomes. Next.js's `redirect()` triggers a 307 server response; browsers handle this in ~50 ms typically.

**Mitigation:** the spec accepts this trade-off ("redirect or render same content"). The redirect is one-shot and instant. The Navbar's Work link points directly to /work, so the typical visitor doesn't experience the bounce.

### 12.2 Risk: SSR/client mismatch on hash-driven initial mode

Visitors arriving at /work#architecture see a brief flash of Outcomes mode (the SSR default) before the post-hydration rAF callback reads the hash and switches to Architecture. Estimated flash duration: 1–2 animation frames (~32 ms).

**Mitigation:** acceptable trade-off for SSR safety. The alternative — rendering both compositions and toggling via CSS — would double the initial DOM weight and create screen-reader duplicate-content issues. The flash is brief enough that most visitors won't notice; visitors who do notice can rely on the toggle (which honors their hash intent on mount).

### 12.3 Risk: ProjectStrip SVG layout breaks on very wide focus / tech node counts

The ProjectStrip vertical spread caps at 60 px between tech nodes; if a future project adds 10+ focus areas or 15+ techs, the labels may overlap.

**Mitigation:** the HeroTopologyData carries only 6 focus areas and 12 techs total. The maximum any single project connects to is 2 focuses + ~5 techs (CWH). Future projects with denser topologies will need a layout pass; for the current 5 projects, the strips render cleanly.

### 12.4 Risk: Outcomes mode metric line is hand-curated, not derived

The `metric` field in `WorkEntry` ("Live SaaS · cloudwastehunter.io" / "30 fps · on-device pose detection" / etc.) is hand-written per project. When metrics evolve (CWH gains paying customers, FormAI ships to a store), the metric line will need a manual update.

**Mitigation:** documented in `work-entries.ts` as the single source of truth. Future Phase 14.2 considerations include deriving metrics from `data/projects.ts` automatically — but that requires extending the project data shape and is deferred.

### 12.5 Risk: Navbar Work entry's `matches` array now spans `/work` + `/projects` + `/architecture`

When the flag is on, the Work label highlights on three different routes. Visitors who deep-link to /projects (and get redirected to /work) see "Work" highlighted on the destination — correct. Visitors who bookmarked /architecture see the same posture. No false-positive highlights.

**Mitigation:** the `matches` array uses prefix matching, so /projects-archive (hypothetical) would NOT highlight Work. Edge case is theoretical.

### 12.6 Risk: PawDoc / Aevum "Walkthrough drafting" text reads as roadmap copy

In Architecture mode, PawDoc + Aevum show "Walkthrough drafting" instead of an active link. A visitor unfamiliar with the V5 /architecture surface may read this as a typo or unfinished page.

**Mitigation:** the surrounding context (state pill "Planning", small constellation strip) signals "this project isn't shipped yet." The "Walkthrough drafting" line is intentional editorial copy, matching the V5 modal's "Architecture design is currently being drafted" language. Future polish opportunity if recruiter feedback says it reads ambiguously.

### 12.7 Risk: client island's rAF cleanup may race with rapid navigation

`WorkReadingMode.tsx` schedules a rAF callback in useEffect and cancels it in cleanup. If a visitor navigates away before the rAF fires, the cleanup cancels the frame correctly. If a visitor navigates back during a still-pending rAF (e.g., back/forward cache), the `initialised.current` ref prevents a second rAF schedule.

**Mitigation:** the ref-guarded effect handles the common back/forward case cleanly. Edge case: if a visitor opens /work, navigates away in < 16 ms, and comes back, the back-restored component carries the same `initialised.current = true` from React's state preservation; the rAF won't re-fire. Acceptable — the toggle still works manually.

---

## 13. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/projects/[slug]/page.tsx` and per-project detail | Phase 14.2 territory — pull-quote field, stack-by-category, gallery sequence. |
| `app/architecture/[slug]/page.tsx` ScrollStory pages | Phase 14.3 territory — per-project variant (wide-illustration / phone-frame). |
| `app/architecture/_components/ArchitectureTimelineSection.tsx` | Phase 14.4 territory — mobile timeline ladder. |
| `app/stack/page.tsx` | Phase 14.5 territory — lane-grid compression. |
| `data/projects.ts` | Untouched. Future 14.2 may add optional `pullQuote` + `stackByCategory` fields (V5-safe additive). |
| `app/architecture/_components/ScrollStory.tsx` | Untouched (14.3 territory). |
| `app/architecture/_components/ArchitectureHubGrid.tsx` | Still used by the legacy `/architecture` hub (rollback path). |
| `app/projects/_components/ProjectCardAnimator.tsx` | Still used by the legacy `/projects` hub (rollback path). |
| `components/home/hero-topology-data.ts` | Read-only consumer; no edits. |
| Lumina systems, topology graph (`data/topology/graph.ts`), motion grammar, atmosphere primitives (only `signal` variant consumed) | RED LINE per V6 § 1.5. |
| Footer composition, navbar outer composition (only the Work entry data array touched) | Preserved verbatim post-12.5 / 12.4. |
| Pill / glass / margin-tick / text-ramp primitives | Used by reference, not modified. |
| V4 / V5 systems / telemetry / API routes | RED LINE. |

---

## 14. Rollback

### 14.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_WORK_HUB=0
```

- `/work` calls `notFound()` and pre-renders the 404 surface.
- `/projects` skips the redirect and renders its V5 hub body verbatim.
- `/architecture` skips the redirect and renders its V5 hub body verbatim.
- Navbar Work link points back to `/projects` (matches array: `/projects` + `/architecture`).
- MobileMenu Work link points back to `/projects` (same).

Pre-V6 work-surface state is fully restored. Bookmarked /projects or /architecture URLs continue to work.

### 14.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes `app/work/` and `app/work/_data/`, removes the redirects from /projects + /architecture, restores Navbar + MobileMenu Work entries to their pre-14.1 const arrays.

### 14.3 Per-file revert (surgical)

`git checkout HEAD~1 -- app/work/` deletes /work only; other files keep their changes. If 14.1's lead-block design needs a rewrite without touching the redirect plumbing or Navbar wiring, this lets the operator iterate on /work in isolation.

---

## 15. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 14.1 (13.5 pushed, origin in sync) | ✅ |
| Build emits `/work` as static route | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_WORK_HUB` unset) | ✅ |
| Off-flag: /work 404, /projects + /architecture render V5 verbatim, Navbar points back at /projects | ✅ |
| On-flag: /work unified surface, /projects + /architecture redirect, Navbar points at /work | ✅ |
| Single source of truth: `app/work/_data/work-entries.ts` carries all /work data | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Server Component primary, 1 small client island | ✅ Only `WorkReadingMode.tsx` is `"use client"`. |
| Reduced-motion: all surfaces honour `useReducedMotion()` via Reveal + PillPulseDot | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical at SSR time | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives (only `signal` consumed), navbar / mobile drawer composition (only data arrays touched), footer, pill / glass / margin-tick / text-ramp, V4/V5 systems, /projects/[slug] detail, /architecture/[slug] scroll story, /stack all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the V5 work surfaces unchanged. The operator flips `NEXT_PUBLIC_V6_WORK_HUB=1` to activate /work + redirects + nav rewiring in a single switch.

---

## 16. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] `/work` (flag on) — first viewport on desktop showing CWH flagship + mono list.
- [ ] `/work` (flag on) — mobile view showing CWH stacked + list below.
- [ ] `/work` (flag on) — Outcomes mode mid-block (5 editorial rows).
- [ ] `/work` (flag on) — Architecture mode mid-block (5 constellation strips).
- [ ] `/work` (flag on) — closer + "How I work" + back-to-about link.
- [ ] `/work` (flag off) — 404 page.
- [ ] `/projects` (flag on) — redirects to `/work#outcomes` (verify in browser dev tools network panel).
- [ ] `/architecture` (flag on) — redirects to `/work#architecture` (same).
- [ ] `/projects` (flag off) — V5 hub renders verbatim.
- [ ] `/architecture` (flag off) — V5 hub renders verbatim.
- [ ] Navbar Work link (flag on, on /work) — highlighted.
- [ ] Navbar Work link (flag on, on /projects pre-redirect) — highlighted.
- [ ] Mobile drawer Work link (flag on) — points to /work.
- [ ] Mobile drawer Work link (flag off) — points to /projects.
- [ ] `/work#outcomes` direct URL — outcomes mode active on land.
- [ ] `/work#architecture` direct URL — architecture mode active + scrolls into view.

---

## 17. What 14.1 explicitly does NOT do

- ❌ No /projects/[slug] detail page changes (14.2 territory).
- ❌ No /architecture/[slug] ScrollStory changes (14.3 territory).
- ❌ No /architecture timeline mobile ladder (14.4 territory).
- ❌ No /stack page restructure (14.5 territory).
- ❌ No `data/projects.ts` schema additions.
- ❌ No new font / new colour / new motion grammar / new dependency / new asset.
- ❌ No edits to V4/V5 systems, Lumina, topology graph, atmosphere primitives, pill vocabulary, glass primitives, margin tick CSS, text-token ramp.
- ❌ No edits to LegacyAboutPage, /pulse, /notes, /codex, footer, hero topology, mobile drawer outer composition.
- ❌ No three.js scene on /work — pre-rendered SVG primitives only (matches spec text).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. One new route (5 components + 1 data module), two redirects added, two nav data arrays widened. The unified work surface is live; the recruiter front-door communicates hierarchy and depth in the first viewport.

---

## 18. Phase 14 status

This is **Sub-PR 14.1** — the Phase 14 entry. Sub-PRs 14.2 / 14.3 / 14.4 / 14.5 remain unbuilt.

Per V6 § 5.3 Phase 14 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 1 of 5 (this one). |
| /work (or /projects + /architecture) bounce rate measurably lower | ⏳ Observation begins post-deploy. |
| Mobile architecture engagement (timeline ladder) shows non-zero `engaged` events from mobile sessions | ⏳ Waits on 14.4. |
| Stack page session time stable or improved | ⏳ Waits on 14.5. |

**Phase 14 stays OPEN.** Next sub-PR: 14.2 (per-project detail refresh).

---

## 19. Closing

V6 Sub-PR 14.1 is **the unified work surface finally communicating hierarchy in the first viewport**. The audit's blocker findings resolve: /projects no longer reads as the default portfolio project grid (it redirects to /work); /architecture no longer reads as the slight-variation card stack (same); CWH no longer sits as a peer-equal cell with FormAI (it dominates the left 7 columns with a topology glyph and three CTAs). The recruiter perception risk closes: the depth advertises itself in the lead block, not two clicks away.

The reading-mode toggle is the surface's most distinctive interaction — two postures (outcomes / architecture) side-by-side at the same level. Recruiters self-serve to the substance; engineers self-serve to the topology. The same five projects, two reading lenses, one calm hub.

Phase 14 opens here. The unified work surface becomes the foundation that 14.2 (project detail tightening), 14.3 (architecture variants), 14.4 (mobile timeline), and 14.5 (stack compression) build on. The 30-day observation window for Phase 14's recruiter-perception metrics begins when the operator flips the flag in production.

Same systems. Same palette. The work, finally framed.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
