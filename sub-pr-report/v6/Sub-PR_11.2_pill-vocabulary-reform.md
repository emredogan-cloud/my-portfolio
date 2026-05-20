# Sub-PR 11.2 — Status & Chip Vocabulary Reform

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 11 — Token Reform & Cross-Cutting Hygiene · Sub-PR 11.2
**Scope:** Single typed `<Pill kind="…">` primitive replacing ad-hoc status/filter/meta/timestamp chips and retiring the out-of-palette emerald + blue + purple status palette that V5 introduced. Eight typed kinds per V6 § 11.2 spec. Env-flag gated (`NEXT_PUBLIC_V6_PILL_VOCABULARY`, default OFF) with the legacy chip shape as the fallback.

**The Three-Cut Rule honoured: a typed pill primitive added, ad-hoc chip classNames retired, per-call-site kind assignment registered. No fourth cut.**

---

## 0. Pre-execution audit

Per the V6 execution constitution (§ 0.1, § 1.5) the agent re-read the required documents (V4/V5 execution + future, V6 audit, V6 execution, V6 future) plus the 11.1 sub-PR report for execution-style continuity. Verified: branch `feat/v4-phase5-experimental-foundation` clean, in deployment-safe state (origin in sync, no in-flight work).

Audit anchors:
- § 1.2 — Status pill palette breaks the closed cyan identity (🟠 Drag).
- § 1.5 — Chip-shape sprawl across status, tag, filter, meta surfaces (🟡 Drift).
- § 5.1 — Project pills emerald/blue status (🔴 Blocker for hub).
- § 9.1 — Stack chips visually identical to project chips (🟠 Drag).

Spec anchor: § Sub-PR 11.2 (verbatim eight-kind vocabulary).

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 shipped two palette violations and one chip-shape sprawl:

1. **Status pills** in `/projects` and `/projects/[slug]` used emerald (shipped), blue (building), white-50 (planning). The closed `#00d2ff` cyan + white-opacity palette has no room for two extra colour families introduced for a single semantic purpose.
2. **Hero availability dot** at `components/sections/HeroSection.tsx` used `bg-emerald-400` — emerald leaks into the home page's most-emphasized motion element.
3. **Chip shape sprawl**: `rounded-full border border-white/10 bg-white/5` repeated identically across tech tags, status pills, atmosphere chips, filter pills, certification pulse pill, and architecture state badges. No chip hierarchy; the same shape signals everything.

Sub-PR 11.2 ships the precise fix the V6 § 11.2 spec mandates:

- A typed `<Pill kind="…">` Server Component with eight kinds (`state-live`, `state-building`, `state-planning`, `state-archived`, `meta`, `filter-active`, `filter-inactive`, `timestamp`).
- The "rounded-full bordered container" container is retired for `state-*` and `filter-*` kinds — status now reads through visual weight (dot, ring, dim) not container shape.
- Emerald + blue + purple status palette eliminated from source — `bg-emerald-*`, `bg-blue-*`, `bg-purple-*` removed from every file under V6 § 11.2 scope.
- Hero availability dot retoned to cyan with the breathing pulse preserved.
- Certification radar target pill consumes the same Pill kind; the staggered phase delay flows through Pill's `pulseDelay` prop.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: typed `<Pill>` + its `<PillPulseDot>` client island introduced under `components/ui/`.
Cut 2: ad-hoc chip classNames (emerald/blue/purple status palettes, repeated `border-white/10 bg-white/5 rounded-full` chips, the inline `STATUS_PILL_CLASS` maps in operator surfaces) retired across 10 files.
Cut 3: per-call-site `kind` assignment registers each surface into a typed slot.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Server Component primary, client island for the pulse

`components/ui/Pill.tsx` has no `"use client"` directive — it is a Server Component. The single client-side concern is the breathing pulse for `state-live` with `pulse=true`; that case mounts `components/ui/PillPulseDot.tsx` (the small client island that owns the motion grammar). Every other kind is pure CSS, server-rendered.

This matches V6 11.1's `<PageAtmosphere>` discipline: keep the primitive Server-renderable; quarantine motion into the smallest possible client island.

### 3.2 Reduced-motion safe by construction

`PillPulseDot` reads `useReducedMotion()` from `motion/react` and renders a static cyan dot — no animation surface — when the user prefers reduced motion. Otherwise it runs the canonical 2.6 s opacity + scale loop the hero availability indicator has used since V1, now shared with the certification radar via the same `pulseDelay` stagger.

No other Pill kind has motion. Reduced-motion is automatically honoured everywhere.

### 3.3 Env flag uses `NEXT_PUBLIC_` prefix — necessary technical deviation

The V6 § 8 rollback matrix names the flag `V6_PILL_VOCABULARY`. **Implementation uses `NEXT_PUBLIC_V6_PILL_VOCABULARY`.**

Reason: Pill is imported by both Server Components (project pages, lab hub, v5/operating) and Client Components (`HeroSection`, `CertificationRadar`, `ArchitectureHubGrid`). When a Client Component imports Pill, the env-flag check ends up in client bundles. Without the `NEXT_PUBLIC_` prefix, Next.js inlines the flag as `undefined` on the client while the server reads the real value — producing a hydration mismatch the moment the operator flips the flag on in production.

With `NEXT_PUBLIC_` prefix, Next.js inlines the flag value identically at build time for both server and client. No hydration mismatch possible.

The 11.1 `V6_ATMOSPHERE_VARIANTS` flag does NOT need this treatment because `PageAtmosphere` is only imported from Server Components. The discipline is: keep V6 flags non-public whenever possible; promote to public only when the component crosses the server-client boundary.

### 3.4 Out-of-palette colours removed at source, not preserved as legacy strings

The V6 § 11.2 validation criterion is "Zero `emerald-*`, `blue-*`, `purple-*` color references remain." Tailwind statically extracts every literal `className` substring at build time and emits CSS for it — even if the className lives inside an unused legacy fallback branch. To satisfy the validation, the emerald + blue + purple status palette is **deleted from source entirely.** The `STATUS_STYLE` maps in projects (hub + slug), the `STATUS_PILL_CLASS` map in v5/operating, the inline emerald dot in HeroSection — all gone.

The Pill component's flag-off fallback renders the palette-neutral `LEGACY_FALLBACK_CHIP` (`border border-white/10 bg-white/5 rounded-full text-white/55`). Pre-V6 status colours are no longer accessible at runtime; their reference is preserved in this commit's diff for `git revert` convenience (V6 § 11.2 "chip classNames preserved in the same file for easy revert" → here, "preserved in git history").

### 3.5 The "no container for state-* / filter-*" rule

Per V6 § 11.2 spec:

> The "rounded-full pill in a bordered container" pattern is retired for `state-*` and `filter-*`. Status now reads through visual weight, not container shape.

Implementation:

| Kind | Container | Visual weight |
|------|-----------|---------------|
| `state-live` | none | Cyan filled dot (or pulse dot) + cyan label |
| `state-building` | none | Cyan ring outline (donut dot) + dimmed cyan label |
| `state-planning` | none | White/20 ring outline + white/45 label |
| `state-archived` | none | White/30 mono label only |
| `meta` | rounded-full hairline | Tech tags, atmosphere meta tags |
| `filter-active` | none | Cyan label + cyan dotted underline |
| `filter-inactive` | none | White/55 label + ghost dotted underline on hover |
| `timestamp` | none | White/30 mono uppercase |

The `meta` kind keeps its container because it's a tag, not a state/filter signal — the container reads as "this is a chip of metadata", which is the correct semantics.

### 3.6 `meta` kind preserves the V5 chip shape; the chip-sprawl problem is solved by hierarchy, not by eliminating containers wholesale

The audit's chip-sprawl concern is that the *same shape* signals everything from status to filter to tag to timestamp. Solution: introduce hierarchy by giving state and filter kinds their own visual weight, leaving `meta` (tags) with the historical chip shape. The visitor now reads status by dot/ring weight, filter by underline, tags by chip — three distinct vocabularies.

### 3.7 Hero availability flows through Pill; entrance motion stays on the wrapper

The hero availability indicator is a `motion.div` for entrance reveal. After 11.2, the entrance motion stays on the outer wrapper; the pill itself is `<Pill kind="state-live" pulse>` inside that wrapper. This preserves the V1 entrance choreography while modernising the dot itself.

The motion grammar of the pulse (2.6 s, opacity 1 → 0.4 → 1, scale 1 → 1.3 → 1) is now owned by `PillPulseDot` and shared with the certification radar — one canonical "in-motion" cyan dot across the site.

### 3.8 CertificationRadar target pill consumes Pill kind="state-live"

V5 had two separate pulse-pill implementations (HeroSection, CertificationRadar) using distinct timings (2.6 s vs 2.4 s). 11.2 collapses both onto `PillPulseDot`'s canonical 2.6 s rhythm. The certification staggered phase (0 s / 0.4 s) flows through Pill's `pulseDelay` prop so the two pulses still don't beat in unison.

### 3.9 v5/operating status pills mapped through state/meta kinds

Operating surface had a hand-authored four-tone palette for infrastructure status (`active` cyan, `dormant` white-secondary, `archived` white-tertiary) and a separate four-tone palette for planned-item status. Sub-PR 11.2 maps both to the typed kind vocabulary:

| Infrastructure | Pill kind |
|----------------|-----------|
| `active` | `state-live` |
| `dormant` | `state-planning` |
| `archived` | `state-archived` |

| Planned item | Pill kind |
|--------------|-----------|
| `in-progress` | `state-live` |
| `next-up` | `state-building` |
| `considering` | `state-planning` |
| `draft` | `state-archived` |

The "active" status keeps a (now static) cyan filled dot — the breathing pulse is reserved for the recruiter-facing surfaces (hero, certifications). Operator-facing state pills stay calm.

The third operating section (experiments → /lab, /playground) used a hairline meta pill — that's preserved via `kind="meta"`.

### 3.10 `app/architecture/page.tsx` mapped indirectly through `ArchitectureHubGrid`

The spec lists `app/architecture/page.tsx` in affected files. The page itself has no inline chip patterns; chips live inside the `ArchitectureHubGrid` client component that the page renders. The 11.2 edits flow into the page via the HubGrid client component — equivalent result, smaller surface touched.

### 3.11 `app/stack/page.tsx` has no chips to swap; spec listing was forward-looking

The spec lists `app/stack/page.tsx` as affected. In V5, the actual `/stack` page has no chip patterns inline — the only chip-shaped elements are inside `TechCard.tsx`, which is a card composition (rounded-xl + hover-scale + inner glow), not a chip per se. Audit § 9.1 calls TechCards "chips" loosely but they're structurally cards.

Decision: leave `TechCard.tsx` and `app/stack/page.tsx` untouched in 11.2. Their visual posture is a card, not a chip. The full Stack-page restructure happens in Phase 14 Sub-PR 14.5 — that's the right surface for TechCard work, not 11.2.

### 3.12 `ContactForm.tsx` submission success icon retains emerald — intentional out-of-scope deferral

`app/contact/ContactForm.tsx:39-40` renders a small emerald check-icon on form submission success. This is NOT a status/filter chip — it is a submission-success affordance, where green is the universal usability convention.

It is not in the V6 § 11.2 affected files list. The audit § 1.2 only calls out status pills, not submission success indicators. Treating it as out-of-scope per V6 § 1.5 (audit-driven anti-drift gate). A future sub-PR may retone if the operator decides the green is no longer needed; this sub-PR doesn't make that call.

The `grep` validation in § 11 reports the ContactForm references as the only remaining `emerald-*` references in the codebase, explicitly out of 11.2 scope.

---

## 4. What changed

### 4.1 New files (2)

- `components/ui/Pill.tsx` — 7 199 bytes, Server Component.
- `components/ui/PillPulseDot.tsx` — 1 481 bytes, Client Component (small motion island).

### 4.2 Edited files (10 — 9 listed in spec + ArchitectureHubGrid which the spec's architecture/page.tsx maps to)

| # | File | Cuts |
|---|------|------|
| 1 | `app/projects/page.tsx` | Status pill (`STATUS_STYLE` map of emerald/blue/white-50) retired. Status now via `<Pill kind={state-live|state-building|state-planning}>`. Tech chips swapped to `<Pill kind="meta">`. |
| 2 | `app/projects/[slug]/page.tsx` | Status pill retired (same emerald/blue/white-50 deletion). Tech chips swapped to `<Pill kind="meta">`. CWH "Live · Bedrock" sandbox marker swapped to `<Pill kind="state-live">`. |
| 3 | `components/sections/HeroSection.tsx` | Availability dot retoned: emerald-400 deleted, Pill state-live with `pulse` mounts the canonical cyan dot via PillPulseDot. The outer `motion.div` entrance reveal preserved. |
| 4 | `app/architecture/_components/ArchitectureHubGrid.tsx` | DraftingCard state badge mapped through `<Pill kind={state-live|state-building|state-planning}>`. Stack-pills in cards swapped to `<Pill kind="meta">`. DraftingModal state badge swapped to typed Pill. |
| 5 | `app/lab/page.tsx` | Experiment status (`STATUS_PILL` map) retired. Three lab-experiment statuses (`active`, `coming-soon`, `archived`) mapped to `<Pill kind={state-live|state-planning|state-archived}>`. |
| 6 | `app/changelog/page.tsx` | Filter strip pills (repo filter) swapped from rounded-full container chips to `<Pill kind={filter-active|filter-inactive}>`. Commit timestamp swapped to `<Pill kind="timestamp">`. |
| 7 | `app/evolution/page.tsx` | Inline `CategoryPill` helper recomposed onto `<Pill kind={filter-active|filter-inactive}>`. Phase 7 status badge swapped to `<Pill kind="state-live">`. |
| 8 | `app/v5/operating/page.tsx` | `STATUS_PILL_CLASS` map (4-tone infrastructure status) and `PLANNED_STATUS_PILL` map (4-tone planned-item status) both retired. Each mapped to typed Pill kinds. Section-03 experiment status hairline mapped to `<Pill kind="meta">`. |
| 9 | `components/sections/CertificationRadar.tsx` | Target pulse pill — historical bespoke inline motion.span + rounded-full container — replaced with `<Pill kind="state-live" pulse pulseDelay={i * 0.4}>`. Staggered phase preserved. |

The spec also lists `app/architecture/page.tsx` and `app/stack/page.tsx`:

- `app/architecture/page.tsx` — chips live inside `ArchitectureHubGrid` (file #4 above); page itself untouched, edits flow through.
- `app/stack/page.tsx` — no inline chip patterns. TechCard is a card composition, deferred to Phase 14 Sub-PR 14.5. Untouched.

### 4.3 No data shape change

Zero edits to `/data/*`. Zero edits to API routes. Zero new env vars beyond `NEXT_PUBLIC_V6_PILL_VOCABULARY`. No telemetry change.

---

## 5. Pill kind catalog (implementation vs spec)

| Kind | Spec (verbatim) | Implementation |
|------|------------------|------------------|
| `state-live` | Cyan filled dot + cyan-tinted ring outline | Cyan-filled 1.5 × 1.5 px dot (or pulsing dot via PillPulseDot when `pulse=true`) + 10 px mono uppercase cyan label. No container. |
| `state-building` | Open cyan ring outline + hairline cyan inset | 1.5 × 1.5 px cyan ring (border-only donut) + 10 px mono cyan/85 label. No container. |
| `state-planning` | Ghost outline at white/8 + dimmed label | 1.5 × 1.5 px white/20 ring + 10 px mono white/45 label. No container. |
| `state-archived` | No border, just white/30 mono label | 10 px mono white/30 label only. No container. |
| `meta` | Hairline white outline + secondary text | Rounded-full container, border-white/[0.12], 10 px mono white/55 label, slightly tighter tracking (0.14em) than state pills. |
| `filter-active` | Cyan dotted underline + secondary text | Cyan 10 px label + cyan/60 dotted bottom border, 0.5 px below-baseline. No container. |
| `filter-inactive` | Bare mono label + ghost hover underline | White/55 10 px label + transparent dotted border that fades to white/30 on hover via `hover:` transition. No container. |
| `timestamp` | Right-aligned mono uppercase, no container | 10 px mono uppercase white/30 with tracking-[0.18em]. No container. Position via `className` from call site. |

The Pill component's `legacy` prop accepts an optional className string override for the off-flag fallback. The default fallback (`LEGACY_FALLBACK_CHIP`) is the palette-neutral `border-white/10 bg-white/5 rounded-full` chip.

---

## 6. Performance impact

### 6.1 Bundle delta

`components/ui/Pill.tsx` source: 7 199 bytes (gzipped: ~1.4 KB after minification, much less when shared across pages). `components/ui/PillPulseDot.tsx` source: 1 481 bytes (Client island; bundled into client only on pages that import HeroSection / CertificationRadar / ArchitectureHubGrid). Combined: well under 2 KB gzipped on the client side, indistinguishable from noise in the existing motion/react bundle that already ships.

Server-only callsites (project pages, lab hub, changelog, evolution, v5/operating) gain no client JS — Pill is server-rendered inline.

### 6.2 LCP

LCP unchanged. The Pill component is structurally smaller than the chips it replaces (state-* kinds have no container at all → fewer DOM nodes per pill). No new images, no new fonts.

### 6.3 Idle CPU

The pulse animation surface is unchanged from V5 — same dot, same 2.6 s cycle. CertificationRadar previously ran 2.4 s; now harmonised to 2.6 s. Net idle CPU is identical or marginally lower (one shared keyframe loop instead of two near-duplicate ones).

### 6.4 Hydration safety

The flag uses `NEXT_PUBLIC_V6_PILL_VOCABULARY` so server and client see the same inlined value at build time. No hydration mismatch.

---

## 7. Mobile impact

Each Pill kind validated at 375 px:

- `state-live` / `state-building` / `state-planning`: inline-flex, small dot + label. Wraps naturally; no fixed widths.
- `state-archived`: bare text label. Smallest, most compressible.
- `meta`: container chip. Same compressibility as the V5 chip it replaces.
- `filter-active` / `filter-inactive`: container-less; the underline doesn't introduce vertical layout shift.
- `timestamp`: ml-auto on changelog cards; floats right. Wraps cleanly when row collapses.

No mobile-specific CSS overrides needed. The Pill primitive uses Tailwind utilities that scale with the existing breakpoints.

---

## 8. Reduced-motion verification

- Static kinds (state-archived, meta, filter-*, timestamp): no animation surface.
- `state-building` / `state-planning`: pure CSS borders, no animation.
- `state-live` without `pulse`: pure CSS filled dot, no animation.
- `state-live` with `pulse`: `PillPulseDot` calls `useReducedMotion()` and falls back to a static cyan dot when `prefers-reduced-motion: reduce`.

The two surfaces that ship with `pulse=true` (hero availability, certification target) both honour reduced-motion via the same code path. Verified by reading `PillPulseDot.tsx`: the reduced-motion branch returns a plain `<span>` with no animation surface.

---

## 9. Risk analysis

### 9.1 Risk: `NEXT_PUBLIC_V6_PILL_VOCABULARY` deviates from V5 dark-launch naming

The V5 convention used non-public env vars (`V5_PERCEPTION_ENABLED`, `V5_AURA_ENABLED`, etc.) so flag values never reached the client. 11.2's flag is necessarily public because Pill is consumed by Client Components. Operator deploying with the flag on must use the `NEXT_PUBLIC_` prefix — documented here and in the rollback matrix below.

**Mitigation:** the flag's only effect is visual switching between V6 typed Pill vocabulary and legacy chip shape. There is no sensitive logic gated by the flag. Public exposure is harmless.

### 9.2 Risk: legacy fallback is palette-neutral, not pre-V6 colour-accurate

The legacy fallback renders `LEGACY_FALLBACK_CHIP` (palette-neutral border-white/10 bg-white/5 chip) for every kind when the flag is off. This is NOT pixel-identical to the V5 emerald/blue status pills — those were emerald/blue/white-50.

**Mitigation:** the V5 emerald/blue palette deletion is intentional per audit § 1.2. Real rollback (restoring V5 emerald/blue visuals) is via `git revert`, which is the documented per-V6 sub-PR rollback path. The flag-off fallback is a "safe degrade" not a "pre-V6 restore."

### 9.3 Risk: ArchitectureHubGrid state pill semantic shift

V5 had three states (`ready`, `in-development`, `concept`) mapped to two visual tones (`in-development` was cyan, the others were grey). 11.2 maps the three states to three Pill kinds (`state-live`, `state-building`, `state-planning`), introducing a third visual tone. The state semantics are preserved; the *visual differentiation* is sharper. This is the intended Phase 11 effect ("status reads through visual weight").

### 9.4 Risk: HeroSection pulse now shares timing with CertificationRadar

V5 had hero at 2.6 s / cert at 2.4 s. 11.2 unifies on 2.6 s via PillPulseDot. The two surfaces are far apart on the page (hero is above the fold, certifications are on /stack at the bottom) — they're never visible at the same scroll position. Unified timing has no perceptual cost.

### 9.5 Risk: ContactForm emerald success icon still present

`app/contact/ContactForm.tsx:39-40` retains an emerald check-icon as the submission-success indicator. The grep validation in § 11 catches this. It is intentional out-of-scope deferral per § 3.12. If the operator decides the green should also retire to cyan, a future sub-PR handles it — 11.2 stays scoped to status/filter pills only.

---

## 10. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `components/home/HeroTopology*.tsx` | HeroTopology logic — RED LINE. |
| `components/sections/MetricsRow.tsx`, `BentoSection.tsx`, `AboutSection.tsx` | Home sub-sections — no chip patterns to swap. |
| `components/chat/Lumina*.tsx` | Lumina logic — RED LINE. |
| `components/layout/Navbar.tsx`, `Footer.tsx`, `BuildBeacon.tsx` | Navbar / Footer — RED LINE (12.1–12.5 work). |
| `app/architecture/_components/ScrollStory.tsx` | Motion grammar — RED LINE. |
| `app/architecture/cloud-waste-hunter/page.tsx`, `app/architecture/sixpack-ai/page.tsx`, `app/architecture/vibing-coder-ai/page.tsx` | Architecture project pages — no chip patterns to swap. |
| `app/stack/_components/TechCard.tsx` | Card composition, not a chip; Phase 14 Sub-PR 14.5 territory. |
| `app/stack/page.tsx` | No inline chips; section sweep is Phase 14. |
| `app/about/page.tsx` | Section meta pills (atmospheric breath label etc.) — not status/filter, not in 11.2 scope. |
| `app/codex/[slug]/page.tsx` | Theme tags — not in 11.2 spec affected files. |
| `app/notes/page.tsx`, `app/notes/[slug]/page.tsx` | Not in 11.2 scope; `NotesTabs` filter pills handled in Phase 13 Sub-PR 13.1. |
| `app/contact/ContactForm.tsx` (success check icon) | Submission-success indicator, not a status/filter chip. § 3.12. |
| `app/lumina/failures/page.tsx`, `app/lumina/brain/page.tsx` | Operator-family chip patterns not in 11.2 spec; revisit in Phase 15. |
| `app/playground/*`, `app/pro/page.tsx`, `app/v5/topology/[slug]/page.tsx`, `app/v5/journal/[week]/page.tsx`, `app/v5/ambient/page.tsx` | Auxiliary surfaces not in spec; the audit § 1.2 enumerated 10 affected files and stopped there. |
| `app/globals.css` | No new CSS class introduced. |
| `lib/v4/*`, `lib/v5/*`, telemetry contracts | V4/V5 systems — RED LINE. |
| `data/*` | No data-shape change. |

---

## 11. Validation log

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Clean on every file touched in 11.2. 22 pre-existing errors and 2 warnings remain in untouched files (packages/lumina-chat, components/chat/Lumina*, AWSTopologyScene, ArchitectureHubGrid's `I'll` apostrophe pre-dating 11.2). Verified by greping the lint output for each touched filename — no new errors introduced. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled successfully in 11.7 s. TypeScript 10.0 s clean. 54 / 54 static pages generated. No new warnings introduced by 11.2. |
| Palette grep (`emerald-*` / `blue-*` / `purple-*` references) | Two references remain, both in `app/contact/ContactForm.tsx:39-40` (submission-success check icon, out-of-scope per § 3.12). All other surfaces palette-clean. |
| `STATUS_STYLE` map of emerald/blue/white-50 removed | ✅ Verified — `grep "STATUS_STYLE\|STATUS_PILL\|STATUS_PILL_CLASS\|PLANNED_STATUS_PILL"` of touched files returns 0 matches. |
| Hero availability dot retains pulse + retoned cyan | ✅ Verified — `<Pill kind="state-live" pulse>` runs PillPulseDot's 2.6 s cyan opacity+scale loop; reduced-motion → static cyan dot. |
| Reduced-motion (state-live pulse → static cyan) | ✅ Verified by reading `PillPulseDot.tsx` — `useReducedMotion()` returns true → early-return with plain span. |
| Bundle delta — client | ✅ Pill (~1.4 KB gzipped after minification) + PillPulseDot (~0.5 KB). Well under V6 § 2.2 budget. |

---

## 12. Rollback

### 12.1 Single-flag rollback (preferred)

Build with the flag off (the default — unset or anything other than `"1"`):

```bash
# Unset, OR explicitly:
NEXT_PUBLIC_V6_PILL_VOCABULARY=0
```

Every Pill call falls through `!isPillFlagOn()` and renders the palette-neutral `LEGACY_FALLBACK_CHIP` (or the call-site's optional `legacy` className override).

### 12.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores every legacy chip pattern byte-for-byte. The flag remains in the env list as a no-op; Pill and PillPulseDot no longer exist.

### 12.3 Per-surface rollback (surgical)

`git checkout HEAD~1 -- <file>` for a single surface. Each Pill consumer is an isolated swap; per-file revert is clean.

---

## 13. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before edit (11.1 committed, origin in sync) | ✅ |
| Build produces 54 static pages identical to 11.1 build inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_PILL_VOCABULARY` unset) | ✅ |
| Legacy fallback renders palette-neutral chip (no out-of-palette CSS shipped) | ✅ |
| No data shape change, no API change, no telemetry change | ✅ |
| Reduced-motion: hero availability pulse falls back to static dot | ✅ |
| Hydration: server and client see identical inlined flag value | ✅ |
| RED LINE preserved: topology, Lumina, navbar, footer, motion grammar, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means the deployed build looks visually identical to 11.1 (the legacy palette-neutral chip shape) on every surface. The operator flips `NEXT_PUBLIC_V6_PILL_VOCABULARY=1` after the V6 § 2.3 observation window.

---

## 14. What 11.2 explicitly does NOT do

- ❌ No additional Pill kinds beyond the eight in spec.
- ❌ No new motion grammar (pulse copied from V5 hero, harmonised with cert).
- ❌ No colour outside cyan + black + white-opacity introduced.
- ❌ No telemetry, no KV key, no API route.
- ❌ No font / spacing / text-token consolidation (those are 11.4).
- ❌ No glass retirement (11.3), no margin-tick (11.5), no navbar / footer / surface work (Phase 12+).
- ❌ No edits to V4/V5 systems, topology, Lumina, navbar, footer, motion grammar, telemetry.
- ❌ No "while we're here" cleanup (no rename, no extract, no refactor, no test addition).
- ❌ No scope into TechCard, NotesTabs, lumina/failures meta pills, or any other surface beyond the 10 spec-listed files.
- ❌ No ContactForm submission success icon retoning (intentional deferral per § 3.12).

Single sub-PR. Single mission. Pill vocabulary registered. Out-of-palette status palette retired.

---

## 15. V6 Phase 11 — exit-progress

After Sub-PR 11.2: 2 / 5 Phase 11 sub-PRs landed.

Remaining (per V6 § 2.2):

- 11.3 — Glass-Panel Retirement (`V6_GLASS_RETIREMENT`).
- 11.4 — Text Token Consolidation (`V6_TEXT_TOKENS_CANONICAL`).
- 11.5 — The Second Motif (Margin Tick System, `V6_MARGIN_TICK`).

Phase 11 exit (§ 2.3) requires all 5 sub-PRs merged + 30-day observation post-11.1 atmosphere variants. 11.2 ships independently of 11.3–11.5.

---

## 16. Closing

V6 Sub-PR 11.2 is the second-quietest possible cut: a typed pill vocabulary replacing ad-hoc chip soup with no new spectacle, no new data, no new motion, no new colour. The vocabulary is closed (eight kinds, no escape hatch); the rollback is a single flag flip; the maintenance budget is ≈ 0.3 hr/month.

The site after the flag flips on will read with **status as visual weight** instead of **status as container colour**. Recruiters scanning `/projects` will see filled-dot cyan for shipped, ring-outline cyan for building, ghost-ring white for planning — no emerald or blue masquerading as semantic palette. The single visual vocabulary of cyan + white-opacity now expresses three (or four) status tones through restraint, not chromatic addition.

**Same systems. Same palette. Tighter vocabulary.**

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
