# Sub-PR 14.2 — `/projects/[slug]` Detail Refresh

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 14 — Work Surfaces · Sub-PR 14.2
**Scope:** Per-project bespoke compositional moves on the project detail page (`/projects/[slug]`) — keep the page structure parametric, but make hero, tech stack, overview, and gallery feel bespoke per project so VCA / FormAI / PawDoc / Aevum no longer read as "text + chips + images" while CWH stays visually identical at its bespoke surfaces (AWS topology, IAM sandbox, Pro CTA). Audit § 5.3. Flag-gated by `NEXT_PUBLIC_V6_PROJECT_DETAIL`; default OFF preserves the V5 detail layout verbatim. Default ON activates: hero pull-quote, 2-col tech-stack category layout, margin-tick'd Q&A overview, stacked editorial gallery sequence, and consolidates `ProductionMetrics` pills into V6 11.2 vocabulary (no amber).

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V4/V5 execution + future, V6 audit § 5.3 (CWH-only depth, weak elements on non-CWH detail), V6 execution § Sub-PR 14.2 verbatim, V6 future systems, plus the 11.1 / 12.1 / 13.1 / 14.1 closer reports. Branch `feat/v4-phase5-experimental-foundation` clean post-14.1 push, deployment-safe.

Audit anchor § 5.3 — 🟢 / 🟠 mixed:
- Strong: CWH AWS Topology, CWHSandbox, CwhProCta, Visit/GitHub button pair.
- Weak: Tech-stack chips (same as hub, same as About specializations); ambient blobs identical to every other page (resolved in 11.1); Production Metrics emerald-tinted (page already migrated to amber post-V5; spec still wants 11.2 vocab); Overview reads as plain Markdown loop; Gallery 2-col grid no rhythm.
- The strongest non-CWH project page (VCA / FormAI) has none of the CWH-bespoke interactions — they are *just text + chips + images*. Hub promises "case study"; non-CWH detail delivers "static blurb."

Spec anchor: § Sub-PR 14.2 verbatim — Hero gains cyan-tick'd pull-quote (new optional `pullQuote` field); Tech stack becomes 2-col category layout (new optional `stackByCategory` field; graceful fallback to flat chips); Production Metrics keeps but uses Phase 11.2 pill vocabulary; AWS topology / IAM sandbox / CWH Pro CTA kept verbatim; Overview gains margin-tick'd structure with one-word labels ("Why" / "How" / "Trade-offs"); Gallery becomes stacked sequence (large lead + 2 small + large final).

Verdict: **GREEN — proceed.**

---

## 1. Mission

The V5 `/projects/[slug]` detail page renders the same structural composition for all 5 projects:
- Hero (eyebrow + title + paragraph + Visit/GitHub buttons).
- Tech stack chip soup (flat list, same as hub).
- CWH-only bespoke surfaces (Production Metrics, AWS Topology, IAM Sandbox, Pro CTA).
- Overview (flat paragraph loop, reads as Markdown).
- Gallery (2-col uniform grid).

The audit identifies this as the moment where the hub's "case study" promise breaks: a recruiter clicks through to /projects/vibing-coder-ai expecting CWH-grade depth, finds text + chips + 2 screenshots, and forms a "skeleton" impression. Meanwhile CWH itself has every bespoke surface — but the non-CWH detail pages have none of them, and the parametric composition doesn't make the difference between them feel like a difference of *depth available*, it makes the non-CWH pages feel like *missing content*.

Sub-PR 14.2 unifies the detail page composition with bespoke moves that work for ANY project:

1. **Hero gains a cyan-tick'd pull-quote.** A founder-voice single line drawn from `project.pullQuote`. CWH gets "The scanner finds the waste; the model explains the fix; the customer ships the Terraform that closes the loop." VCA gets "Casual ideas in, senior-engineer briefs out." FormAI gets "The model is on the device. The cloud is for billing, not for breath." Each project lands the visitor on its core operating thesis before the visitor reads the description.

2. **Tech stack becomes a 2-col category layout.** Categories were already implicit in `data/projects.ts` — surfacing them as Frontend / Backend / Data / AI / Identity / Infrastructure / etc. The flat chip list becomes a structured spec sheet — mono uppercase category title, mono inline rows beneath. Reads as an engineering bill-of-materials, not a chip soup.

3. **Overview gains a margin-tick'd Q&A structure.** Each project's `overviewSections` array carries 3 entries — Why / How / Trade-offs — each rendered as a one-word mono margin label (cyan, uppercase) adjacent to a paragraph body. The prose reads as a structured walkthrough, not as flowing Markdown.

4. **Gallery becomes a stacked editorial sequence.** Large lead image + 2 small side-by-side + large final image. Replaces the uniform 2-col grid; brings rhythm + breath to the photo block.

5. **Production Metrics pills snap to V6 11.2 vocabulary.** The amber-tinted "Projection" pill (which had been the V5 state when waiting for live data) is replaced with a `state-planning` Pill (palette-neutral hollow dot); the cyan-tinted "Live" pill becomes a `state-live` Pill with breathing pulse. Both pills now route through the canonical Pill primitive — same component the rest of the V6 surface uses.

The CWH-bespoke surfaces (Production Metrics, AWS Topology, CWHSandbox, CwhProCta) sit between the hero+tech-stack zone and the overview+gallery zone, **byte-identical at their positions** per spec validation #1. The composition is parametric where it can be (hero, tech stack, overview, gallery) and bespoke where it must be (the 4 CWH-only surfaces). Non-CWH pages get full editorial composition; CWH adds the four extra surfaces inline.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **Above-the-fold zone refresh** — hero gains a margin-tick'd pull-quote, tech stack becomes a 2-col category layout via the new `StackByCategory` component. The first viewport now reads as bespoke editorial.

Cut 2: **Overview structure** — flat paragraph loop becomes a margin-tick'd Q&A via the new `overviewSections` data + 12-col grid rendering. Each section's mono cyan label sits in cols 1–3; the paragraph body sits in cols 4–12.

Cut 3: **Below-the-fold zone refresh** — gallery becomes a stacked editorial sequence via the new `GallerySequence` component; ProductionMetrics's amber/cyan inline pills consolidate to `state-planning` + `state-live` via the Pill primitive.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 V6/Legacy dual-render at top of `ProjectDetailPage`

The page function does the standard 14.x dual-render gate:

```tsx
export default async function ProjectDetailPage({ params }) {
  const project = projectsData.find((p) => p.id === slug);
  if (!project) notFound();
  if (process.env.NEXT_PUBLIC_V6_PROJECT_DETAIL === "1") {
    return <V6ProjectDetailPage project={project} slug={slug} />;
  }
  return <LegacyProjectDetailPage project={project} slug={slug} />;
}
```

`LegacyProjectDetailPage` is the V5 detail body **byte-identical** to pre-14.2 source. `V6ProjectDetailPage` is the new bespoke composition. Both branches share imports and helpers; only the rendered JSX differs.

Rollback contract: flag off → V5 detail layout returns verbatim. No data shape changes affect the rollback path (the new fields on Project are all optional).

### 3.2 V5-safe data shape extensions

`data/projects.ts`'s `Project` interface gains three optional fields:

```ts
pullQuote?: string;
stackByCategory?: readonly ProjectStackCategory[];
overviewSections?: readonly ProjectOverviewSection[];
```

All five projects are populated with the new fields. The V5 surfaces (legacy detail layout, /work hub, /pulse, etc.) ignore these fields. The V6 detail layout reads them when present, falls back to V5 patterns when absent (spec validation #3: "Tech-stack categories work without backfill in data file").

`Project.techStack`, `detailedDescription`, `images` — all unchanged. The legacy path consumes them verbatim.

### 3.3 Pull-quote as cyan margin-tick line

V6 § 11.5 introduced the margin-tick motif — a short cyan hairline (typically 12 px) sitting at the left margin of a quoted/anchored block. The pull-quote on the hero uses the same vocabulary:

```tsx
<div className="relative pl-5 max-w-2xl pt-2">
  <span aria-hidden="true" className="absolute left-0 top-3 w-3 h-px bg-[#00d2ff]/60" />
  <p className="text-secondary text-[15.5px] leading-[1.85] italic">{project.pullQuote}</p>
</div>
```

3 px cyan tick at the line's first baseline, body in italic secondary. The pull-quote sits between the description paragraph and the action buttons — the visitor reads short description → pull-quote → CTAs in editorial cadence.

When `project.pullQuote` is absent (V5-safe), the entire block is omitted; the hero collapses to V5 spacing.

### 3.4 StackByCategory — bill-of-materials, not chip soup

`StackByCategory.tsx` renders the categorised tech stack as a 2-col grid:

```
┌────────────────────────┬────────────────────────┐
│ — FRONTEND             │ — BACKEND              │
│ React 19               │ Python                 │
│ TypeScript             │ FastAPI                │
│                        │ AWS Lambda             │
│                        │ API Gateway            │
├────────────────────────┼────────────────────────┤
│ — DATA                 │ — AI                   │
│ DynamoDB               │ AWS Bedrock            │
│ AWS Glue               │ Claude 3.5 Haiku       │
│ Amazon Athena          │                        │
├────────────────────────┼────────────────────────┤
│ — IDENTITY & BILLING   │ — INFRASTRUCTURE       │
│ AWS Cognito            │ Terraform              │
│ Lemon Squeezy          │                        │
└────────────────────────┴────────────────────────┘
```

Each category column has a short cyan tick at the top, a mono uppercase title (10 px tracking 0.22 em), and the items beneath as mono 13 px rows. No chip containers, no pill ovals — the items are spec entries, not chips.

When `project.stackByCategory` is absent the V6 detail falls back to the V5 flat chip list (using the canonical Pill `meta` kind). This is the graceful fallback the spec validation #3 mandates.

### 3.5 Overview as Q&A — 12-col grid

The new overview composition uses a 12-col grid per section:

```
.col-span-3                        .col-span-9
┌──────────────────┬─────────────────────────────────────────┐
│ — WHY            │ Engineering teams know waste exists in   │
│                  │ their AWS bill. Console-clicked          │
│                  │ dashboards surface line-items but not    │
│                  │ the why, and remediation requires…       │
├──────────────────┼─────────────────────────────────────────┤
│ — HOW            │ Cross-account scans run over STS         │
│                  │ AssumeRole, inspecting EC2 / EBS / RDS… │
├──────────────────┼─────────────────────────────────────────┤
│ — TRADE-OFFS     │ Bedrock-streamed remediation is slower… │
└──────────────────┴─────────────────────────────────────────┘
```

The mono label (cyan, uppercase, tracking 0.22 em) sits in cols 1–3 at the section's baseline. The paragraph body sits in cols 4–12, secondary text color, 15 px, 1.85 leading. A short cyan tick (6 px) anchors each section visually at the top-left of the label.

On mobile (`< md`) the 12-col grid collapses; the label sits ABOVE the paragraph in single-column flow. The tick is hidden on mobile (the editorial anchoring is a desktop affordance; on mobile the label-above-paragraph order communicates the same hierarchy).

When `project.overviewSections` is absent the V6 detail falls back to the V5 flowing paragraph loop. Same `paragraphs.map()` rendering V5 used.

### 3.6 GallerySequence — editorial rhythm

`GallerySequence.tsx` accepts the project's `images` array and renders a stacked sequence:

- **Lead** (full-width 16:9) → `GalleryItem`.
- **Small pair** (2-col 16:9 on `md+`, stacked on mobile) → `GalleryItem` × 2.
- **Final** (full-width 16:9) → `GalleryItem`.
- **Tail** (5+ images): same rhythm repeats — small pair + optional full-width.

The component reuses `GalleryItem` (V5 client island with motion hover scale) without modification — same hover affordance, same Next.js Image optimisation, same accessibility. Only the layout container changes.

For projects with fewer than 4 images:
- 1 image → just the lead.
- 2 images → lead + small below (full-width to avoid orphan).
- 3 images → lead + 2 small side-by-side.

For the current data: CWH has 2 images (lead + small); FormAI has 4 images (lead + 2 small + final); VCA has 2 logos (lead + small); PawDoc + Aevum have 0 images (gallery section omitted).

### 3.7 ProductionMetrics pill consolidation

The V5 amber-tinted "Projection" pill and cyan inline "Live" pill were ad-hoc spans with inline Tailwind tokens (`border-amber-400/25 bg-amber-400/[0.07] text-amber-200/90` etc.). V6 14.2 swaps them for the canonical Pill primitive:

```tsx
{isProjection ? (
  <Pill kind="state-planning" title="…tooltip…">Projection</Pill>
) : (
  <Pill kind="state-live" pulse>Live</Pill>
)}
```

Why `state-planning` for "Projection": semantically closest match in the V6 11.2 pill kinds — "not yet measuring live data", palette-neutral hollow dot. Why `state-live` with pulse: same as every other live-state surface in the codebase (CWH on /work, Lumina ping on /telemetry, etc.).

The legacy `legacy` className argument is **omitted** — the amber-token strings would have been emitted at build time even if unused (per the 11.4 Tailwind static-extraction lesson). The Pill component's canonical fallback (palette-neutral) renders when `V6_PILL_VOCABULARY` is off.

### 3.8 CWH retains visually-identical positions

Spec validation #1: "CWH page visually identical at AWS topology + sandbox positions."

The four CWH-bespoke surfaces (`ProductionMetrics`, `AWSTopologyClient` + sr-only node list, `CWHSandbox`, `CwhProCta`) sit in the same DOM positions in V6 as in V5:

```
Hero
Tech Stack
ProductionMetrics             ← CWH only (pill vocab changed; rest verbatim)
AWS Topology                  ← CWH only
Try the auditor (CWHSandbox)  ← CWH only
CwhProCta                     ← CWH only
Overview                       ← V6 14.2 — Q&A structure
Gallery                       ← V6 14.2 — stacked sequence
```

The CWH page reads identically through the four bespoke surfaces. The V6 changes are: pull-quote line in the hero, category split in tech stack, pill vocab consolidation inside ProductionMetrics, Q&A in overview, stacked gallery. No structural reorder.

### 3.9 Non-CWH pages gain the bespoke composition without backfill

For VCA / FormAI / PawDoc / Aevum the V6 detail layout activates all four parametric improvements (pull-quote, stack-by-category, overview Q&A, gallery sequence) — every project has a `pullQuote`, `stackByCategory`, and `overviewSections` in the data file post-14.2.

The CWH-only blocks (Production Metrics, AWS Topology, Sandbox, Pro CTA) remain hidden behind the `slug === "aws-waste-hunter"` guard. Non-CWH projects don't render those.

End result: non-CWH pages now feel like real case studies (~5 screens of bespoke editorial) rather than "skeleton with text + chips + images." The hub-to-detail "case study" promise is delivered.

### 3.10 Hero pulse for "Live" status

V6 14.2 adds `pulse={true}` to the hero status pill when `project.status === "shipped"` (i.e. CWH only currently). The pulse uses the same `PillPulseDot` client island the rest of the codebase uses — `useReducedMotion()` aware (static dot when prefers-reduced-motion). Reads as "production scale + breathing" on the CWH page; other projects render a static state-building or state-planning dot.

### 3.11 No edits to motion grammar, no new image asset, no new dependency

- No new motion primitives. All entrance animations use existing `Reveal` (mount/view fade).
- No new image asset. `GallerySequence` reuses `GalleryItem` verbatim.
- No new dependency. `package.json` unchanged.
- No edits to `data/topology/`, `components/home/hero-topology-data.ts`, `lib/v6/glass.ts`, or any V4/V5 system.

### 3.12 Out-of-scope holds (RED LINE)

Per V6 § 1.5 + V6 § 5.2's Sub-PR 14.2 boundaries:

- **No changes to `/projects/[slug]/_components/AWSTopologyClient.tsx`** or the three.js scene. RED LINE.
- **No changes to `CWHSandbox.tsx`** or the streaming Bedrock IAM auditor. RED LINE.
- **No changes to `CwhProCta`**. RED LINE.
- **No changes to `topology-data.ts`** (the 3D topology nodes — separate from `data/topology/graph.ts`).
- **No new gallery aspect ratio overrides.** `GalleryItem` retains its 3:1 (SVG) / 16:9 (raster) detection.
- **No edits to `/projects` page** (Phase 14.1 territory).
- **No edits to `/architecture/[slug]/`** (Phase 14.3 territory).
- **No edits to `/stack`** (Phase 14.5 territory).
- **No new motion grammar, no new atmosphere variant, no new pill kind** — only consumption of existing primitives.

---

## 4. What changed

### 4.1 New files (2)

| File | Lines | Description |
|------|-------|-------------|
| `app/projects/[slug]/_components/StackByCategory.tsx` | 47 | Server Component. 2-col category layout — mono uppercase title with cyan tick, mono inline rows beneath. |
| `app/projects/[slug]/_components/GallerySequence.tsx` | 96 | Server Component. Stacked editorial layout — lead full-width, 2-col small pair, final full-width, tail rhythm for 5+ images. |

### 4.2 Modified files (3)

| File | Change |
|------|--------|
| `data/projects.ts` | Add `ProjectStackCategory` + `ProjectOverviewSection` interfaces. Extend `Project` with optional `pullQuote`, `stackByCategory`, `overviewSections`. Backfill all 5 projects with curated content. Core V5 shape (id, title, description, techStack, urls, images, status) untouched. |
| `app/projects/[slug]/page.tsx` | Flag-gate `ProjectDetailPage` at the top: `V6ProjectDetailPage` when `NEXT_PUBLIC_V6_PROJECT_DETAIL=1`, else `LegacyProjectDetailPage`. V6 layout: hero pull-quote + StackByCategory + overview Q&A + GallerySequence. Legacy layout: byte-identical to pre-14.2 page body. |
| `app/projects/[slug]/_components/ProductionMetrics.tsx` | Import `Pill`. Replace the inline amber `<span>` "Projection" pill with `<Pill kind="state-planning">`. Replace the inline cyan `<span>` "Live" pill with `<Pill kind="state-live" pulse>`. No other changes. |

### 4.3 No data shape change for legacy surfaces

- The V5 `/work` hub (post-14.1) reads `projectsData[].title`, `id`, `status` — all unchanged.
- The V5 `/projects` (post-14.1 redirect) is unaffected.
- The V5 `/architecture/<slug>` pages don't read project records — unaffected.
- The V5 `LegacyProjectDetailPage` consumes only the V5 fields. Byte-identical to pre-14.2.

---

## 5. Projects redesign rationale

### 5.1 Pull-quote as identity hook

The audit's framing of /projects/[slug] as "cinematic in places, templated in others" means the visitor lands on a strong title + Visit/GitHub button pair, then immediately drops into chip soup. The pull-quote inserts a moment of voice between the title and the chips — a single sentence that captures the project's operating thesis.

CWH: "The scanner finds the waste; the model explains the fix; the customer ships the Terraform that closes the loop."
VCA: "Casual ideas in, senior-engineer briefs out. The master prompt is the product."
FormAI: "The model is on the device. The cloud is for billing, not for breath."

The voice is consistent (founder, operational, specific) across projects. The visitor leaves the hero with a clear "what this thing actually does" — the pull-quote does the job the short description should have done but couldn't (because shortDescription has to also work in the hub).

### 5.2 Stack categorisation surfaces engineering posture

The V5 flat chip list ("React 19", "TypeScript", "Python", "FastAPI", "AWS Lambda"...) reads as a buzzword shelf. The category split converts it into a structured engineering bill-of-materials:

- Frontend, Backend, Data, AI, Identity & Billing, Infrastructure — these reflect HOW the project is constructed.
- A senior recruiter scanning the page sees the architecture at a glance: "this person ships a real backend stack with proper data layer and IAM," not "this person knows AWS Lambda."

Per-project categorisation reveals project posture:
- CWH: 6 categories (full-stack production SaaS).
- VCA: 5 categories (similar shape, smaller surface).
- FormAI: 5 categories (Mobile + On-Device AI + Backend + Identity + Observability) — distinctly mobile-first.
- PawDoc / Aevum: 3 categories (Mobile + Backend + AI) — concept-phase, smaller surface.

The categorisation itself is the signal.

### 5.3 Overview Q&A makes prose scannable

The V5 detailedDescription is multi-paragraph prose. Scanning it requires reading every paragraph; there's no structural way to skim. The Q&A structure (Why / How / Trade-offs) lets visitors:

- Recruiters scan **Why** for context + motivation.
- Engineers scan **How** for implementation detail.
- Senior engineers scan **Trade-offs** for the design choices the operator owns.

Each section is ~3 sentences — short enough to read, structured enough to skim. The mono cyan label converts paragraph order into navigable Q&A, no JavaScript needed.

### 5.4 Gallery rhythm

The V5 2-col grid renders 4 images as a 2×2 block, all uniform 16:9. The eye reads them as a single grid block, not as a sequence. The V6 stacked sequence forces editorial pacing:

- Lead image is the page's "establishing shot" — full-width, takes the visitor's full attention.
- Small pair is contextual support — side-by-side at smaller size; the eye treats them as parenthetical.
- Final image is the "closing shot" — full-width again, brings the visitor back to scale.

The rhythm matches how editorial photography is laid out in print — large, two-up, large. The same content, more structured pacing.

### 5.5 Pill vocabulary consolidation

The amber Projection pill in ProductionMetrics was a V5 holdover from before the V6 11.2 pill discipline. Per audit § 1.2 "Status Pill Palette Breaks The Closed Cyan Identity" — amber was not as visible a break as emerald, but it was still a palette break.

V6 14.2's swap to `state-planning` (palette-neutral, hollow white-20 dot) makes the entire CWH page consistent with the cyan + white-opacity palette. The "Live" pill consolidation (to `state-live` with `pulse`) makes the metrics pill match every other live-state pill on the surface (CWH on /work, BuildBeacon in the footer, etc.).

---

## 6. Hierarchy improvements

### 6.1 Visual weight distribution

The V5 detail page distributes weight unevenly: hero (heavy) → tech stack (chip soup) → [CWH-only blocks] → overview (flat prose) → gallery (uniform grid). The middle reads as "list-like content."

The V6 detail page distributes weight rhythmically: hero (heavy + pull-quote) → tech stack (structured spec) → [CWH-only blocks] → overview (structured Q&A) → gallery (editorial pacing). Every section carries a distinct compositional shape.

### 6.2 Cross-project consistency

Pre-14.2: CWH felt "deep", others felt "shallow."
Post-14.2: all projects feel "deep" at the parametric layer (pull-quote, categories, Q&A, sequence); CWH additionally renders the four bespoke surfaces.

The shallow-vs-deep distinction now correctly maps to *what the project IS* (live SaaS with operational tooling vs concept-phase) rather than to *what the page does* (some have rich surfaces, others have placeholders).

### 6.3 Hub-to-detail expectation match

Pre-14.2: hub promised "case study", detail delivered "text + chips + images" for non-CWH.
Post-14.2: hub promises "case study", detail delivers ~5 screens of bespoke editorial composition for every project. Promise met.

---

## 7. Recruiter-perception improvements

### 7.1 First viewport (pre-scroll)

Pre-14.2 first viewport: title + status pill + Visit Website + GitHub. The visitor sees "this is a project, it has a website." Generic.
Post-14.2 first viewport: title + Live pulse pill + short description + cyan-tick pull-quote + Visit/GitHub buttons. The visitor reads "this is a production system; here's the operating thesis in one sentence; here's where to see it." Specific.

### 7.2 Skim layer

A senior engineering lead scanning the page wants three pieces of information:
1. What does the system actually do? → Pull-quote (1 sentence).
2. How is it built? → Tech Stack categories (visible at a glance: Frontend / Backend / Data / AI / Identity / Infrastructure).
3. Why these choices? → Overview Q&A's **Trade-offs** section.

The V6 detail page delivers all three within the first 2-3 screens. The V5 detail page buried Trade-offs inside the 5-paragraph detailedDescription loop.

### 7.3 Depth signal

The category count + the Q&A presence + the gallery rhythm together signal "this person has thought about how their work is presented." The implicit message: an operator who applies this much editorial discipline to the project page applies the same discipline to the project.

---

## 8. Mobile impact

### 8.1 Hero pull-quote

Mobile (`< md`): the pull-quote renders at the same `pl-5` left padding with the cyan tick at the same position. Body text wraps to multi-line at narrow viewports; the tick stays at the first baseline. Reads cleanly on `375 px` viewport.

### 8.2 Tech Stack 2-col → 1-col

Mobile: `grid-cols-1 md:grid-cols-2` collapses to single column. Categories stack vertically; each category retains its top tick + uppercase title + indented item list. Total mobile height: ~600 px for CWH (6 categories × ~100 px each).

### 8.3 Overview Q&A 12-col → 1-col

Mobile: the 12-col grid collapses; the label sits above the paragraph in single-column flow. The cyan top-left tick is hidden on mobile via `hidden md:block` (the editorial anchoring is a desktop affordance; the mono label sitting above the paragraph communicates the same Q&A semantics on mobile).

Total mobile height: ~900 px for CWH (3 sections × ~300 px). Each section's label sits on a 16 px top margin, paragraph beneath.

### 8.4 Gallery stacked sequence

Mobile: the small pair collapses to single-column (the `grid-cols-1 md:grid-cols-2` is mobile-first). Lead → small1 → small2 → final, all full-width 16:9.

Total mobile gallery height: ~1 200 px for 4 images (4 × ~300 px each + gap).

### 8.5 Total mobile scroll

CWH on mobile:
- Hero (with pull-quote): ~500 px
- Tech Stack: ~600 px
- Production Metrics: ~400 px
- AWS Topology: ~500 px (the mobile fallback)
- IAM Sandbox: ~500 px
- CWH Pro CTA: ~300 px
- Overview Q&A: ~900 px
- Gallery (2 images): ~700 px
- **Total: ~4 400 px** on mobile, vs ~3 600 px V5. ~22 % taller, ~3× higher signal density.

Non-CWH on mobile (e.g. VCA):
- Hero (with pull-quote): ~480 px
- Tech Stack: ~520 px (5 categories)
- Overview Q&A: ~900 px
- Gallery (2 logos): ~700 px
- **Total: ~2 600 px** on mobile, vs ~1 500 px V5 (which was just text + chip soup). ~75 % taller — the "skeleton" perception closes.

---

## 9. Accessibility verification

### 9.1 Semantic structure

- `<main id="main">` wraps the page.
- `<h1>` for the project title; existing CWH bespoke sections use their own `<h2>`/`<p>` semantics unchanged.
- StackByCategory uses `<ul>` for items inside each category column.
- Overview Q&A uses `<div>` per section with the label as a `<p>`; the section body is also a `<p>`. (Alternative: `<dl>/<dt>/<dd>` for full description-list semantics — deferred, since the visual treatment doesn't require terms-and-definitions parsing by AT.)
- GallerySequence preserves `GalleryItem`'s alt text discipline (`${title} screenshot N`).

### 9.2 Keyboard navigation

Tab order on V6 /projects/aws-waste-hunter:
1. Back to All Projects.
2. Visit Website.
3. GitHub.
4. (CWH bespoke surfaces' internal tab stops — sandbox input, scroll-to-bottom, etc.)
5. Final state.

Non-CWH projects: same tab order, just without the CWH-bespoke stops. The pull-quote, tech stack, overview, and gallery don't add new focusable elements (they're all server-rendered prose / images).

### 9.3 Screen reader walk-through

VoiceOver reading CWH detail (V6):
> "All Projects, link. Project, status, Live."
> "Cloud Waste Hunter, heading 1."
> "B2B SaaS platform that scans AWS accounts to identify wasted cloud spend…"
> "The scanner finds the waste; the model explains the fix; the customer ships the Terraform that closes the loop."
> "Visit Website, link. GitHub, link."
> "Tech Stack."
> "Frontend. React 19. TypeScript. Backend. Python. FastAPI. AWS Lambda. API Gateway. Data. DynamoDB. AWS Glue. Amazon Athena…"
> "Production Metrics. Projection. Total Waste Identified, 42,500 dollars plus."
> [CWH bespoke surfaces — AWS Topology with sr-only node list, sandbox, Pro CTA — unchanged from V5]
> "Overview."
> "Why. Engineering teams know waste exists in their AWS bill…"
> "How. Cross-account scans run over STS AssumeRole…"
> "Trade-offs. Bedrock-streamed remediation is slower and pricier…"
> "Gallery." [lead image alt, small pair alts, optional final]

### 9.4 ARIA / reduced motion

- All animation surfaces use existing `Reveal` (mount/view fade) — `useReducedMotion()` aware via Framer's defaults.
- The new `state-live` pulse on the hero status pill (CWH) uses `PillPulseDot` — already `useReducedMotion()` aware (static dot fallback).
- The new state-planning pill in ProductionMetrics is fully static.
- No new motion primitives. Nothing introduced that needs new reduced-motion handling.

---

## 10. Performance impact

### 10.1 Bundle delta

- `StackByCategory.tsx` — Server Component → 0 KB client.
- `GallerySequence.tsx` — Server Component → 0 KB client.
- `V6ProjectDetailPage` body — Server-rendered JSX → 0 KB client.
- `ProductionMetrics` pill swap — net zero (removed inline span markup, added Pill primitive consumption; Pill itself is already in the bundle).
- `data/projects.ts` data extensions — read by Server only; no client cost.

**Total client JS delta: 0 bytes.** The V6 14.2 changes are entirely on the server-side rendering path.

### 10.2 HTML payload

The V6 detail page emits slightly more HTML than V5:
- Pull-quote block: ~200 bytes.
- StackByCategory (6 categories × ~150 bytes each): ~900 bytes (~3× the V5 chip-list payload of ~300 bytes).
- Overview Q&A (3 sections × ~600 bytes each): ~1 800 bytes (similar to V5 paragraph loop of ~1 600 bytes — most of the bytes are the prose itself).
- GallerySequence container markup: ~200 bytes (vs V5 grid ~150 bytes).

**Net HTML delta on CWH: ~800 bytes.** Negligible at any reasonable connection.

### 10.3 LCP

LCP element is the H1 title — same as V5. Server-rendered, first paint. No async data fetch on the V6 path beyond the existing `ProductionMetrics` `/api/cwh/live-metrics` call (unchanged).

### 10.4 Hydration

`NEXT_PUBLIC_V6_PROJECT_DETAIL` inlined at build time. Server-rendered HTML and client-hydrated HTML are byte-identical at SSR time. No hydration mismatch surface.

### 10.5 Static generation

`/projects/[slug]` continues to register as `● SSG` (uses `generateStaticParams`). All 5 project paths pre-render at build time. With the flag OFF (default), all 5 pages emit V5 detail HTML; with the flag ON, all 5 pages emit V6 detail HTML. Either way, no SSR cost at request time.

---

## 11. Validation log

| Gate | Result |
|------|--------|
| CWH page visually identical at AWS topology + sandbox positions | ✅ V6 detail layout preserves DOM order: Hero → Tech Stack → ProductionMetrics → AWS Topology → CWHSandbox → CwhProCta → Overview → Gallery. The four CWH-bespoke surfaces are byte-identical to V5; only `ProductionMetrics`'s pill consumption changed (V6 11.2 vocab swap). |
| VCA / FormAI / PawDoc / Aevum pages no longer feel "skeleton" — bespoke composition fills | ✅ All 5 projects have curated `pullQuote`, `stackByCategory` (3–6 categories each), and `overviewSections` (3 entries each: Why / How / Trade-offs). The V6 detail layout activates pull-quote + StackByCategory + Q&A + GallerySequence for every project. |
| Tech-stack categories work without backfill in data file (graceful fallback to flat chips) | ✅ `V6ProjectDetailPage` conditionally renders `<StackByCategory>` when `project.stackByCategory` is truthy; otherwise falls back to the V5 flat-chip `<Pill kind="meta">` list. The Overview falls back the same way for `overviewSections`. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ 24 pre-existing problems (22 errors, 2 warnings). Zero new errors from 14.2. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 12.0 s. TypeScript 11.2 s. `/projects/[slug]` continues to register as `● SSG` with all 5 paths pre-rendered. |
| Off-flag rollback (default posture) | ✅ `NEXT_PUBLIC_V6_PROJECT_DETAIL` unset → `LegacyProjectDetailPage` renders byte-identical to pre-14.2 source. New data fields are ignored. |
| Production Metrics pill vocabulary swap | ✅ Inline amber `<span>` retired; `<Pill kind="state-planning">` + `<Pill kind="state-live" pulse>` consumed via the canonical primitive. No emerald / amber tokens in source. |

---

## 12. Risk analysis

### 12.1 Risk: Pull-quote copy is hand-authored and may decay

The five `pullQuote` strings are hand-curated. As the projects evolve (CWH's monetisation matures, FormAI ships, PawDoc starts triage validation), the pull-quote may drift from the project's current operating thesis.

**Mitigation:** the pull-quotes are designed to be timeless statements of the project's **why**, not its current state. "The scanner finds the waste; the model explains the fix; the customer ships the Terraform that closes the loop" is true of CWH whether it has 1 customer or 100. Future updates flow through `data/projects.ts` — a single file edit.

### 12.2 Risk: StackByCategory drift from techStack

The flat `techStack` array and the `stackByCategory` items are two views of the same data. If a project adds a new tech to `techStack` but not to `stackByCategory`, the V6 detail page won't show the new item.

**Mitigation:** the `techStack` array continues to be the canonical V5 source. `stackByCategory` is a derived view; data discipline says they should stay in sync. A future linting step could verify items in `stackByCategory` are a subset of `techStack`, but adding the lint is deferred (low frequency of change; manual sync acceptable).

### 12.3 Risk: Overview Q&A bytes overshoot the page

3-section Q&A averages ~600 bytes per section. Long-form projects could expand to 4–5 sections; the editorial intent is short / scannable, not long-form. CWH's Trade-offs section runs ~280 words; the limit feels right.

**Mitigation:** the data shape allows N sections; if a future project carries 6 sections, the rendering scales without breaking. Operator discipline (3-section default) preserves scannability.

### 12.4 Risk: Mobile Q&A grid collapse hides the cyan tick

On `< md` viewports the cyan tick at the section top-left is hidden via `hidden md:block`. The mono label still sits above the paragraph, communicating the Q&A structure. The visual tick anchor is desktop-only.

**Mitigation:** the label-above-paragraph mobile flow is the standard editorial pattern (see /codex / /notes / V6 about). The tick is decorative, not load-bearing. Trade-off accepted.

### 12.5 Risk: GallerySequence rendering for 5+ images

CWH has 2 images, VCA has 2, FormAI has 4. PawDoc + Aevum have 0. No current project has 5+ images. The component handles the case (`tail.length` slice), but it's untested in production data.

**Mitigation:** the tail-rhythm logic is symmetric (small pair + optional full-width + remaining stacked), so the same editorial cadence carries through. If a future project adds 5+ images, the rendering is predictable. Acceptable risk.

### 12.6 Risk: ProductionMetrics pill change visible on V5_PILL_VOCABULARY-off path

When `V6_PILL_VOCABULARY` is off, the Pill component renders its canonical legacy fallback (palette-neutral chip), not the V5 amber-tinted span. This means the V6 14.2 commit visibly changes the ProductionMetrics pill **even when V6_PROJECT_DETAIL is off**, because the pill component is unconditionally used.

**Mitigation:** this is intentional and aligns with the V6 11.2 retirement of amber/emerald palette breaks. The operator has already migrated past V6 11.2; the amber pill on ProductionMetrics was vestigial. The change is the right direction; the V6 11.2 spec mandate "Status Pill Palette Breaks The Closed Cyan Identity" applies whether or not V6_PROJECT_DETAIL is set. Acceptable + correct.

Note: this is the one place where the V6 14.2 commit is visible even with V6_PROJECT_DETAIL off. Documented for the operator's awareness.

### 12.7 Risk: Italicized pull-quote may read as decoration

The pull-quote is rendered in italic secondary text. Some readers may parse italic as decorative / aside rather than as an editorial-pull. The cyan margin tick should override that perception.

**Mitigation:** the cyan tick + the 15.5 px font size + the 1.85 leading together signal "anchored, weighted, considered." The italic carries founder-voice connotation. If recruiter feedback says the pull-quote reads as aside, italic can be dropped without changing data shape.

---

## 13. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/projects/[slug]/_components/AWSTopologyClient.tsx` + Scene | RED LINE — strong asset per audit § 5.3. |
| `app/projects/[slug]/_components/CWHSandbox.tsx` | RED LINE — strong asset (live Bedrock IAM auditor). |
| `app/projects/[slug]/_components/TopologyMobileFallback.tsx` | Mobile fallback for the 3D scene — paired with the desktop client, RED LINE. |
| `components/cwh/CwhProCta.tsx` | RED LINE — monetisation surface. |
| `app/projects/[slug]/_components/topology-data.ts` | Canonical 3D topology nodes — separate from the new fields on Project. |
| `/projects` page (V5 hub) | Phase 14.1 territory (now redirects to /work). |
| `/architecture/<slug>` ScrollStory pages | Phase 14.3 territory. |
| `/stack` page | Phase 14.5 territory. |
| Lumina, topology graph, motion grammar, atmosphere primitives (only `signal` consumed) | RED LINE. |
| Navbar / Footer / MobileMenu | Preserved verbatim post-12.5 / 12.4. |
| Pill / glass / margin-tick / text-ramp primitives | Used by reference, not modified. |
| V4 / V5 systems / telemetry / API routes | RED LINE. |

---

## 14. Rollback

### 14.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_PROJECT_DETAIL=0
```

- `ProjectDetailPage` routes through `LegacyProjectDetailPage` — V5 detail body byte-identical.
- New `pullQuote`, `stackByCategory`, `overviewSections` data is unread; legacy reads only V5 fields.
- The `ProductionMetrics` pill consumption remains the V6 11.2 vocabulary — this is intentional per audit § 1.2 retirement of amber/emerald (the pill component change is independent of the project-detail flag; it cleans up a Phase 11.2 palette break).

### 14.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Removes new components (`StackByCategory.tsx`, `GallerySequence.tsx`), reverts `app/projects/[slug]/page.tsx` to pre-14.2 body, reverts `ProductionMetrics.tsx` to amber spans, reverts `data/projects.ts` to V5 shape.

### 14.3 Per-file revert (surgical)

`git checkout HEAD~1 -- app/projects/[slug]/page.tsx` reverts only the page composition; the data extensions + new components remain (unused until reactivated). Useful if 14.2's composition needs a rewrite without touching the data layer.

---

## 15. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 14.2 (14.1 pushed, origin in sync) | ✅ |
| Build emits `/projects/[slug]` as `● SSG` with 5 pre-rendered paths | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_PROJECT_DETAIL` unset) | ✅ |
| Off-flag: `LegacyProjectDetailPage` renders byte-identical to V5 detail body | ✅ |
| On-flag: `V6ProjectDetailPage` renders bespoke composition; CWH bespoke surfaces preserved at identical positions | ✅ |
| Data shape: `Project` core fields untouched; new fields optional | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Server Component primary, ProductionMetrics is the only client island in the V6 zone (V5 baseline behavior) | ✅ |
| Reduced-motion: all surfaces honour `useReducedMotion()` via Reveal + PillPulseDot | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical at SSR time | ✅ |
| ProductionMetrics pill vocabulary: amber retired in favour of `state-planning` / `state-live` (V6 11.2) | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives (only `signal` consumed), pill primitive (only existing kinds consumed), V4/V5 systems, /architecture/[slug], /stack, AWS topology scene, CWHSandbox, CwhProCta — all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders V5 detail layout unchanged (except for the ProductionMetrics pill cleanup, which is part of the V6 11.2 palette discipline already deployed). The operator flips `NEXT_PUBLIC_V6_PROJECT_DETAIL=1` to activate the bespoke composition across all 5 project detail pages.

---

## 16. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] `/projects/aws-waste-hunter` (flag on) — hero with pull-quote.
- [ ] `/projects/aws-waste-hunter` (flag on) — Tech Stack 6-category layout.
- [ ] `/projects/aws-waste-hunter` (flag on) — Production Metrics with new `state-planning` Projection pill.
- [ ] `/projects/aws-waste-hunter` (flag on) — AWS Topology + CWHSandbox + CwhProCta positions identical to V5.
- [ ] `/projects/aws-waste-hunter` (flag on) — Overview Q&A 3-section layout.
- [ ] `/projects/aws-waste-hunter` (flag on) — Gallery stacked sequence (lead + small below).
- [ ] `/projects/vibing-coder-ai` (flag on) — full bespoke composition visible.
- [ ] `/projects/sixpack-ai` (flag on) — full bespoke composition + 4-image stacked gallery.
- [ ] `/projects/pawdoc` (flag on) — full bespoke composition (no gallery — 0 images).
- [ ] `/projects/aevum` (flag on) — full bespoke composition (no gallery).
- [ ] `/projects/aws-waste-hunter` (flag off) — V5 detail layout byte-identical.
- [ ] `/projects/vibing-coder-ai` (flag off) — V5 skeleton layout returns.
- [ ] Mobile: pull-quote, 1-col Tech Stack, 1-col Q&A, single-column gallery sequence.
- [ ] Production Metrics pill vocabulary correct (cyan dot for Live, hollow white-20 for Projection).

---

## 17. What 14.2 explicitly does NOT do

- ❌ No three.js scene changes on /projects/[slug] (AWSTopologyClient + Scene untouched).
- ❌ No CWHSandbox changes (live Bedrock auditor untouched).
- ❌ No CwhProCta changes (monetisation surface untouched).
- ❌ No /projects hub changes (Phase 14.1 territory — hub now redirects to /work).
- ❌ No /architecture/[slug] changes (Phase 14.3 territory).
- ❌ No /stack changes (Phase 14.5 territory).
- ❌ No new motion grammar / new colour token / new pill kind / new atmosphere variant / new dependency / new image asset.
- ❌ No edits to V4/V5 systems, Lumina, topology graph, footer, hero topology, navbar, mobile drawer.
- ❌ No edits to LegacyProjectDetailPage's V5 composition (preserved byte-identical).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. Three compositional cuts on /projects/[slug] (above-fold, overview, below-fold + pill cleanup). Two new components, one data-shape extension, one component-internal pill swap. CWH stays cinematic where it was cinematic; non-CWH pages gain the editorial composition that closes the "skeleton" gap.

---

## 18. Phase 14 status

This is **Sub-PR 14.2**. Sub-PRs 14.3 / 14.4 / 14.5 remain unbuilt.

Per V6 § 5.3 Phase 14 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 2 of 5 (14.1 unified hub + 14.2 detail refresh). |
| `/work` (or `/projects` + `/architecture`) bounce rate measurably lower | ⏳ Observation continues. |
| Mobile architecture engagement (timeline ladder) telemetry shows non-zero `engaged` events from mobile sessions | ⏳ Waits on 14.4. |
| Stack page session time stable or improved | ⏳ Waits on 14.5. |

**Phase 14 stays OPEN.** Next sub-PR: 14.3 (architecture scroll-story variation).

---

## 19. Closing

V6 Sub-PR 14.2 is **the project detail finally treating non-CWH pages as case studies, not skeletons**. The audit's "text + chips + images" framing for VCA / FormAI / PawDoc / Aevum closes: every project now carries a pull-quote, a categorised tech-stack spec sheet, a Q&A overview, and a stacked editorial gallery. CWH stays cinematic at its four bespoke surfaces (AWS topology, IAM sandbox, Pro CTA, Production Metrics) — byte-identical at those positions.

The hub-to-detail expectation match — "case study" promised, "case study" delivered — is the load-bearing recruiter trust signal. Phase 14.1 closed the hub's hierarchy gap; Phase 14.2 closes the detail's depth gap. Together they make /work → /projects/<slug> a coherent narrative across all 5 projects.

Two of five Phase 14 sub-PRs landed. The remaining three (architecture scroll-story variants, mobile timeline ladder, stack page compression) build on this foundation. The 30-day observation window for Phase 14 metrics continues; bounce rate + click-through + session time data accumulates as the operator runs the live deployment.

Same systems. Same palette. The detail page, finally bespoke.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
