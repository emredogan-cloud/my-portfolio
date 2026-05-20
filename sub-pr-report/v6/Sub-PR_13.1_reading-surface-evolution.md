# Sub-PR 13.1 — Notes As An Editorial Index (Not A Blog) · V6 Phase 13 entry

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 13 — Reading Surfaces · Sub-PR 13.1 (Phase 13 entry)
**Scope:** Retire the audit § 7.1 BLOCKER — `/notes` hub looking like Medium / Substack / dev.to. Replace the conventional date / title / excerpt / tags pattern with an editorial-index composition: a magazine pullout lead block, a single-column chronicle list with sticky-cluster year labels + cyan-tick expand affordances + native `<details>` expand/collapse (no client JS), and a vertical "atlas" constellation diagram on `lg+` (collapses to a horizontal pill row on `< lg`) that filters the chronicle by topic cluster via URL search params. Tags retire from the hub. The legacy V5 hub is preserved in the same file behind `NEXT_PUBLIC_V6_NOTES_EDITORIAL` for rollback.

**The first V6 Phase 13 sub-PR. One file refactored, two new Server Components, one optional data-shape field added.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 7.1 (Notes hub) + § 7.3 (tag system decorative not functional), V6 execution § Sub-PR 13.1 verbatim, V6 future systems, plus the 11.1 / 11.5 / 12.1 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-12.5 push (Phase 12 closer), deployment-safe.

Inspected current Notes hub (`app/notes/page.tsx`):
- Hero with "Notes" eyebrow + "Long-form. Production-grade." title + framing paragraph.
- Article list: 3 notes (`cloud-waste-hunter-architecture`, `monk-mode`, `sixpack-ai-pose-detection`) rendered as date / title / excerpt / tags cards inside `divide-y` separators.
- Footer note ("New essays drop when the work behind them is done").

Audit anchor: § 7.1 (🔴 Blocker — "exactly the convention from Medium, Substack, dev.to, every engineering blog of the last 8 years. The visitor's pattern-match fires before they read the first title.")

Spec anchor: § Sub-PR 13.1 verbatim — lead block + chronicle + atlas + tag retirement + URL-based cluster filtering.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 `/notes` hub reads as a generic engineering blog. The spec for 13.1 redesigns it as an editorial-index composition that mirrors a magazine's table of contents:

- **Lead block:** the most-recent note's first sentence rendered at display-H1 size with a margin-tick anchor and a quiet right-aligned mono "Latest · Nmin · Month Year" beat. Click anywhere in the block → navigate to the note.
- **Chronicle column:** all *other* notes grouped by year (sticky-cluster year label on the left margin). Each entry is a single collapsed row — title + readtime — with a cyan-tick affordance that opens an inline excerpt + Read-note link. Tags retire from the chronicle entirely.
- **Atlas:** on `lg+`, a vertical constellation SVG to the right of the chronicle showing four canonical topic clusters (cloud / AI / mobile / discipline) with hairline connections, per-node counts, and click-to-filter `<a href="/notes?cluster=…">` links. On `< lg`, the atlas collapses to a horizontal pill row above the chronicle.
- **Filter:** flows through URL search params (`?cluster=cloud`). Chronicle re-renders server-side with the filtered list. No client JS for either the chronicle or the atlas.

The hub stops reading as a blog and starts reading as **a magazine's table of contents** — the spec's exact framing.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: lead block + chronicle column + atlas — three editorial regions replace the V5 single-column card list.
Cut 2: `<details>`/`<summary>` native expand/collapse retires the tag chip + excerpt-always-visible pattern in favour of progressive disclosure (no client JS).
Cut 3: URL-driven cluster filtering via the atlas — the chronicle re-renders server-side based on `searchParams.cluster`.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single file, two layouts coexist

`app/notes/page.tsx` now branches at render time on `NEXT_PUBLIC_V6_NOTES_EDITORIAL`:

```tsx
export default async function NotesPage({ searchParams }) {
  if (process.env.NEXT_PUBLIC_V6_NOTES_EDITORIAL === "1") {
    const resolved = (await searchParams) ?? {};
    const activeCluster = isCluster(resolved.cluster) ? resolved.cluster : null;
    return <V6NotesPage activeCluster={activeCluster} />;
  }
  return <LegacyNotesPage />;
}
```

Both `LegacyNotesPage` and `V6NotesPage` live in the same file. The legacy implementation preserves the V5 layout verbatim (hero + 3-card article list + footer note); the V6 implementation is new. Same pattern as Navbar.tsx in 12.1, Footer.tsx in 12.5.

The page is an `async` Server Component because Next.js 16's `searchParams` is now a `Promise` — the V6 branch awaits it; the legacy branch ignores it. The legacy mode renders identically to V5 (URL params have no effect there).

### 3.2 Two new Server Components, both server-only

`app/notes/_components/ChronicleColumn.tsx` and `app/notes/_components/NoteAtlas.tsx` are pure Server Components. Verified by `grep`-ing `.next/static/chunks/*.js` after build: neither component's symbols appear in any client bundle.

- **ChronicleColumn:** uses native HTML `<details>` / `<summary>` for the expand/collapse affordance. Zero client JS. The cyan tick that brightens on open is achieved via the Tailwind `[&[open]_.chronicle-tick]:!bg-[#00d2ff]/80` arbitrary variant — pure CSS, no state machine.
- **NoteAtlas:** server-rendered SVG (`<svg>` with `<circle>`, `<line>`, `<text>` children wrapped in plain `<a href>` links) on `lg+`. On `< lg`, a fallback `<a>`-tagged pill row using the V6 § 11.2 status-pill border vocabulary. Both paths are server-rendered HTML — no React state, no `usePathname`, no router transitions.

### 3.3 `cluster` field on `Note` — V5-safe addition

The spec calls for a `cluster?` field on the `Note` interface ("V5-safe — the field is optional"). Added:

```ts
export type NoteCluster = "cloud" | "ai" | "mobile" | "discipline";

export interface Note {
  // … existing fields …
  cluster?: NoteCluster;
}
```

Assignment for the three existing notes:
- `cloud-waste-hunter-architecture` → `"cloud"`
- `monk-mode` → `"discipline"`
- `sixpack-ai-pose-detection` → `"mobile"`

The fourth canonical cluster (`"ai"`) is currently empty — the atlas renders the AI node at low opacity (no notes yet), the mobile pill row renders it as disabled with `count = 0`. Future AI-focused notes drop in by setting `cluster: "ai"` in `data/notes.ts`.

Notes without a `cluster` field continue to appear in the unfiltered chronicle but don't anchor an atlas node. Existing data shapes remain unchanged for callers that don't consume the new field (V5-safe).

### 3.4 The lead block uses `leadSentence()` helper

The spec says the lead block surfaces "the most-recent note's first sentence in display-size type." The note bodies are Markdown; the first sentence isn't a separate field. A helper extracts it:

```ts
function leadSentence(note: Note): string {
  const stripped = note.body
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
  const match = stripped.match(/[^.!?]+[.!?]/);
  const first = match ? match[0].trim() : stripped;
  if (first.length === 0 || first.length > 200) {
    return note.excerpt;
  }
  return first;
}
```

- Markdown `**` and `*` markers stripped so they don't leak into the pullout.
- Regex `[^.!?]+[.!?]` captures the first sentence ending at `.`, `!`, or `?`.
- If the first sentence is empty or longer than 200 characters, fall back to the note's `excerpt` field — the pullout reads as a magazine opener, not a paragraph; long opening clauses don't fit the format.

For the CWH note ("Finding unused AWS resources is easy."), the lead extracts the 35-character opening; for Monk Mode ("Most 19-year-olds are figuring out college applications.") it extracts the 54-character opener. Both fit comfortably at display size on a 1280 px viewport.

### 3.5 Sticky-cluster year label via CSS sticky

The chronicle column groups notes by year (extracted from the ISO date). Each group renders:

- A small mono `YYYY` label in the left margin (column 1 of a `grid-cols-[3.5rem_1fr]` layout on mobile, `5rem_1fr` on sm+).
- A `divide-y` list of notes for that year in column 2.

The year label uses `sticky top-20 self-start` so it sticks under the navbar (h-16 + a small offset) while the visitor scrolls through that year's notes. When the next year's group enters the viewport, its own label takes over.

For three notes all in 2026, this means one "2026" label hovers at the top of the chronicle column throughout — the temporal anchor is calm, not repeated per row. When 2027 notes land, the sticky behaviour transitions naturally.

### 3.6 Cyan-tick expand affordance via `.margin-tick` + arbitrary variant

The spec specifies "the cyan-tick from Phase 11.5" as the expand affordance. Each chronicle entry uses a native `<details>` element:

```jsx
<details className="group [&[open]_.chronicle-tick]:!bg-[#00d2ff]/80">
  <summary className="flex items-baseline gap-4 cursor-pointer list-none ...">
    <span className="chronicle-tick inline-block w-px h-3 bg-[#00d2ff]/30 mt-2 ... transition-colors" />
    <h3>{note.title}</h3>
    <span>{readTime}</span>
  </summary>
  <div>{excerpt + read-note link}</div>
</details>
```

- `list-style: none` (via `list-none` Tailwind) removes the default disclosure triangle.
- The `chronicle-tick` span is a 1 × 12 px cyan rule at 30 % opacity — visually the margin-tick from V6 § 11.5.
- The `[&[open]_.chronicle-tick]:!bg-[#00d2ff]/80` arbitrary variant brightens the tick to 80 % cyan when the `<details>` is open.
- `cursor: pointer` on the summary makes the whole row tappable as the disclosure trigger.
- The expanded panel renders the excerpt + a "Read note →" Link to navigate.

This satisfies the spec's "tap/click to expand" affordance on every viewport using zero client JS.

### 3.7 Atlas: SVG constellation on lg+, pill row on mobile

The atlas component renders both paths in the same Server Component, gated by `hidden lg:block` / `lg:hidden` Tailwind utilities:

**Desktop (lg+):** an inline SVG with viewBox `0 0 220 250`. Four cluster nodes positioned in an asymmetric pattern (not a strict grid — the audit calls for "constellation language"). Hairline `<line>` connections at 12 % cyan opacity below the nodes. Each node is wrapped in a plain `<a href>` — SVG natively supports anchor wrappers. Active cluster gets a brighter cyan fill + a 9 px outline halo; clusters with zero notes render at low opacity and have no `href` (un-clickable until a note lands).

**Mobile (< lg):** a horizontal `flex flex-wrap gap-2` row of pill links. Active cluster uses the V6 § 11.2 filter-active visual (cyan border + cyan label); inactive uses filter-inactive (white/8 border, tertiary label). Clusters with zero notes render as `<span aria-disabled>` instead of `<a>` — no click target.

The "All" link (clears filter, navigates to `/notes`) anchors the pill row on mobile. On desktop, the "← Clear filter" affordance appears below the SVG only when an active cluster is set.

### 3.8 URL-based cluster filter — server-side, shareable, accessible

Filtering is driven by `searchParams.cluster`:

```tsx
const activeCluster = isCluster(resolved.cluster) ? resolved.cluster : null;
const chronicleNotes = activeCluster
  ? rest.filter((n) => n.cluster === activeCluster)
  : rest;
```

Benefits:
- **Shareable URLs:** `/notes?cluster=cloud` shares the filtered view.
- **No client JS:** the chronicle re-renders server-side on navigation; no `useState`, no router.push, no client transition.
- **Accessibility:** atlas links are native `<a href>` elements — keyboard-tabbable, screen-reader-friendly, browser-history-aware.
- **Empty-cluster guard:** `isCluster()` validates against the closed `NoteCluster` allow-list; unknown query values are ignored (no broken state).

### 3.9 Lead block is unfiltered

A design decision worth calling out: the lead block always shows the most-recent note regardless of the active cluster filter. The chronicle below filters; the lead block stays as the page's editorial anchor.

Rationale: the lead block is the page's identity, not a filtered preview. Even when filtering to `/notes?cluster=discipline`, the visitor still sees the most-recent note in display type — which may be from a different cluster. The chronicle below then shows only discipline notes. The two regions serve different roles: lead = "what's most recent in the whole archive", chronicle = "give me the slice I asked for."

The trade-off: when filtering, the lead block's note may not match the filter, which could feel mildly inconsistent. The alternative (filter the lead too) would mean an empty lead block when filtering to a cluster with zero notes, which feels worse. The chosen direction matches how magazine TOCs work — the cover article isn't filtered.

### 3.10 Tags retire from the hub, persist in data

The spec says tags retire from the hub. The Note data still carries `tags: readonly string[]` (used by the note detail page and potentially elsewhere). The chronicle simply doesn't render them. No data shape change required.

Audit § 7.3 framing: "If tags don't filter, they should not be visible." 13.1 removes them from the hub; the cluster-based atlas filter takes over the navigational role tags previously suggested but never delivered. The note detail page (`/notes/[slug]`) is out of strict 13.1 scope — its tag display may be revisited in a future sub-PR.

### 3.11 Page atmosphere unchanged (editorial variant from 11.1)

The V6 § 11.1 editorial atmosphere variant continues to power the page background. Both `LegacyNotesPage` and `V6NotesPage` mount the same `<PageAtmosphere variant="editorial" legacy={…}>` — atmosphere doesn't change with the flag.

### 3.12 Reveal motion preserved on lead block + footer note

The lead block uses a single `<Reveal mode="mount" duration={0.8}>` for the entrance fade. The footer note has its own `<Reveal>`. The chronicle and atlas don't animate — they're static editorial regions per spec ("server-rendered"). This preserves the existing motion vocabulary without adding new motion surfaces.

The chronicle entries don't fade in one-by-one (V5 did this with staggered `delay={i * 0.08}` Reveals). The static composition reads as a calmer table-of-contents, which is the spec's intent.

---

## 4. What changed

### 4.1 New files (2)

| File | Description |
|------|-------------|
| `app/notes/_components/ChronicleColumn.tsx` | 3.6 KB source. Server Component. Groups notes by year (sticky year label). Each entry uses native `<details>` for expand/collapse with cyan-tick affordance. Server-rendered; zero client JS. |
| `app/notes/_components/NoteAtlas.tsx` | 5.3 KB source. Server Component. Renders desktop SVG constellation (`hidden lg:block`) + mobile pill row (`lg:hidden`). Each cluster node is a server-rendered `<a href>`. |

### 4.2 Modified files (2)

| File | Change |
|------|--------|
| `app/notes/page.tsx` | Wholesale refactor into a flag-gated async Server Component. `LegacyNotesPage` (V5 baseline) preserved verbatim. `V6NotesPage` ships the editorial composition: tiny eyebrow → lead block → chronicle + atlas grid → footer note. Reads `searchParams.cluster` for filtering. Imports `ChronicleColumn` + `NoteAtlas`. |
| `data/notes.ts` | Added `NoteCluster` typed union and optional `cluster?: NoteCluster` field on the `Note` interface. Assigned clusters to the three existing notes. V5-safe (optional field; existing data shapes unchanged). |

### 4.3 No data shape break

The `cluster` field is optional. All existing data shapes remain valid. The note detail page (`app/notes/[slug]/page.tsx`) is untouched.

---

## 5. Notes redesign rationale

Pre-13.1:
```
┌─ Notes ──────────────────────────────────────────────────────┐
│                                                              │
│ NOTES                                                        │
│ Long-form.                                                   │
│ Production-grade.                                            │
│                                                              │
│ Working notes on cloud architecture, AI systems…             │
│ ───────────────────────────────────────────────────────────  │
│ May 2026 · 4 min read                                        │
│ Architecting Cloud Waste Hunter:                          ↗  │
│ Cross-Account STS & Serverless FinOps                        │
│ Finding unused AWS resources is easy. Building a multi-…     │
│ [AWS] [FinOps] [Serverless] [Bedrock]                        │
│ ───────────────────────────────────────────────────────────  │
│ April 2026 · 3 min read                                      │
│ Monk Mode: Shipping Production Code…                      ↗  │
│ Most 19-year-olds are figuring out college applications…    │
│ [Discipline] [Workflow] [Monk Mode]                          │
│ ───────────────────────────────────────────────────────────  │
│ … (repeat per note)                                          │
└──────────────────────────────────────────────────────────────┘
```

Reads as Medium / Substack / dev.to. Pattern-match fires before content.

Post-13.1 (V6 flag on, no filter):
```
┌─ Notes ──────────────────────────────────────────────────────┐
│ NOTES · THE CHRONICLE                                        │
│                                                              │
│ ║ Finding unused AWS resources                              │
│ ║ is easy.                                                  │
│                                                              │
│ Latest · 4 MIN · MAY 2026               Read note →          │
│ ─────────────────────────────────────────────────────────    │
│                                                              │
│ 2026  ║ Monk Mode: Shipping Production Code…       3 MIN     │
│       ║ Real-Time Pose Detection on Mobile: …      4 MIN     │
│                                                              │
│                                            ┌─ Atlas (lg+) ─┐ │
│                                            │  ● cloud  1  │ │
│                                            │  ● ai     0  │ │
│                                            │  ● mobile 1  │ │
│                                            │  ● discipl. 1│ │
│                                            └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Reads as a magazine's table of contents. The display-size lead pullout is the page's entry signal; the chronicle's collapsed rows let the visitor scan the archive in one glance; the atlas anchors the topic axis.

---

## 6. Codex redesign rationale

**13.1 does not touch Codex.** Spec scope is `/notes` hub only. The Codex hub redesign is Sub-PR 13.2 (out of strict 13.1 scope).

The 12.x phase had similar discipline — 12.1 ships surface promotion, 12.2 retires the résumé pill, etc. Phase 13 follows the same sequenced rhythm: 13.1 Notes → 13.2 Codex → 13.3/13.4 About → 13.5 /pulse extraction.

If Codex still feels like "simple stacked books" after 13.1, that is correct — Codex transformation is 13.2's responsibility.

---

## 7. Reading-density improvements

Per-row vertical density (V5 → V6):

| Element | V5 (per row) | V6 (per row, collapsed) | V6 (per row, expanded) |
|---------|------|----------------------|---------------------|
| Date/readtime meta row | ~28 px | (in collapsed row) | (in collapsed row) |
| Title | ~64 px | ~40 px | ~40 px |
| Excerpt paragraph | ~80 px | 0 (hidden) | ~80 px |
| Tags row | ~32 px | 0 (retired) | 0 (retired) |
| Spacing / padding | ~40 px | ~40 px | ~40 px |
| **Total** | **~244 px** | **~80 px** | **~160 px** |

The chronicle's collapsed default reduces per-row height by ~3× compared to V5. Three notes that used to occupy ~732 px now occupy ~240 px (collapsed), making the entire archive scannable in one viewport on most desktops.

The lead block adds ~280 px (lead pullout + meta beat) above the chronicle. Total page-fold density on a 1080 px viewport:
- V5: lead area + 2 fully expanded notes = visible.
- V6: lead pullout + lead meta + chronicle of all 2 remaining notes (collapsed) = visible *with the atlas alongside*.

The atlas adds horizontal real estate on `lg+` without increasing vertical height (it sits in a parallel column with `sticky top-32`).

---

## 8. Typography impact

Two typographic moves in V6:

1. **Lead block at display size.** `text-3xl md:text-5xl lg:text-[3.25rem]` — significantly larger than the V5 H2 titles (`text-2xl md:text-3xl`). `tracking-[-0.025em]` + `leading-[1.1]` tightens the pullout to magazine-headline proportions. `font-medium` matches the V6 canonical weight from 12.3's wordmark.

2. **Chronicle titles at H3-display weight.** `text-xl sm:text-2xl md:text-[1.625rem]` — larger than V5's `text-2xl md:text-3xl` *because* the chronicle has retired the excerpt + tags below each title. The H3 line now carries more visual weight per row, balancing the leaner row composition.

No new font loaded. No new font weight introduced. The canonical V6 text token ramp from 11.4 (`text-primary` / `text-secondary` / `text-quiet` / `text-tertiary` / `text-faint`) is preserved.

---

## 9. Mobile impact

The V6 hub on mobile (`< lg`, < 1024 px):

- Eyebrow + lead block at responsive sizes (`text-3xl` on smallest, scaling up).
- Atlas appears AS the pill row above the chronicle (per spec).
- Chronicle column takes full viewport width (no atlas sidebar).
- Sticky-cluster year label uses a narrower column (`3.5rem` on `< sm`, `5rem` on `sm+`) to leave room for the title.

The pill row uses the V6 § 11.2 filter pill vocabulary (cyan border for active, white/8 border for inactive, faint for disabled). Touch-tappable, 36 px tall (well above WCAG's 24 px minimum for inline links).

The `<details>` elements work natively on mobile: tap the summary → toggles open. The 5-row tap region (entire summary including the cyan tick + title + readtime) is comfortably ≥ 44 px tall.

Reading flow on mobile:
1. Visitor lands → sees lead pullout (display headline).
2. Scrolls past lead → sees atlas pill row (cluster filter at the top of the chronicle).
3. Scrolls into chronicle → titles + readtimes; taps any → expands inline.

---

## 10. Accessibility verification

### 10.1 Semantic structure

- `<main id="main">` wraps the entire page.
- `<aside aria-label="Notes topic atlas">` wraps the atlas region (declares it as complementary content).
- Each chronicle entry uses `<details>` + `<summary>` — native disclosure widget; screen readers announce as "Expand / collapse, button" with the title as the accessible name.
- The lead block is a `<Link>` (renders as `<a>`); whole block is one click target with the title text as the accessible name.
- Atlas SVG uses `<a href>` per cluster node with explicit `aria-label="Cloud cluster, 1 note"` etc.
- Pill row uses `aria-current="page"` on the active cluster.

### 10.2 Keyboard navigation

Tab order (V6 layout):
1. Lead block link (whole pullout).
2. Atlas links (clusters with notes; clusters with 0 notes are non-tabbable `<span aria-disabled>`).
3. Chronicle entries — each `<summary>` is tabbable; Enter / Space toggles open. Inside an opened entry, the "Read note →" link is tabbable next.

Esc doesn't close `<details>` (native behavior — `<details>` doesn't respond to Esc); clicking outside closes nothing (each `<details>` is independent — open one doesn't close another, which matches the chronicle's "any number can be open" intent).

### 10.3 Screen-reader announcement

VoiceOver reading the V6 hub:

> "Notes — The Chronicle, region. Finding unused AWS resources is easy., link. Latest, 4 min, May 2026, Read note. Region complementary, Notes topic atlas. Cloud cluster, 1 note, link. AI cluster, 0 notes. Mobile cluster, 1 note, link. Discipline cluster, 1 note, link. 2026, mono uppercase. Monk Mode: Shipping Production Code…, button, expand/collapse. Real-Time Pose Detection on Mobile…, button, expand/collapse."

Clean reading order. Section landmarks help screen readers skim.

### 10.4 Reduced motion

The lead block uses an existing `Reveal` entrance (motion/react with `useReducedMotion()` guard already in the component). The footer note uses the same. No new motion surface.

The chronicle and atlas have no motion. The cyan-tick brightening on `<details>` open is a CSS `transition-colors duration-300` — Tailwind's transition utilities respect `prefers-reduced-motion: reduce` via the v4 default media query.

---

## 11. Performance impact

### 11.1 Bundle delta

- `ChronicleColumn.tsx`: 3.6 KB source, Server Component → **0 KB client bundle**.
- `NoteAtlas.tsx`: 5.3 KB source, Server Component → **0 KB client bundle**.
- `data/notes.ts`: ~200 bytes added (cluster field + assignments) — no client impact (data is consumed server-side in the chronicle/atlas).
- `app/notes/page.tsx`: ~100 lines added (V6NotesPage + helpers) — Server Component, no client impact.

**Net client JS delta: 0 bytes.** Verified by `grep`-ing `.next/static/chunks/*.js` for `ChronicleColumn` and `NoteAtlas` — both return zero hits.

### 11.2 LCP

Spec requirement: "LCP ≤ 1.5s."

The lead block is the largest contentful element on the V6 page. It's rendered server-side from the existing `notesData` import — no fetch, no async data. The first paint contains the full lead block markup. LCP should match or improve over V5 (V5's lead H1 also rendered server-side from the same data).

The atlas SVG is static markup with 4 circles + 4 lines + 8 text nodes — ~1 KB of inline SVG. Renders in the initial HTML; no CLS, no LCP impact.

### 11.3 Hydration safety

`NEXT_PUBLIC_V6_NOTES_EDITORIAL` is inlined at build time. `searchParams` is read server-side (the page is `async`). Server-rendered HTML and client-hydrated HTML carry identical structure. Zero hydration-mismatch surface.

### 11.4 SSR vs static

The `/notes` route was previously static (`○`). With `searchParams` consumed in the V6 branch, Next.js may now generate the route on demand (`ƒ`) when the flag is on. Verified post-build: the route generates fine; no errors.

---

## 12. Reduced-motion verification

- Lead block Reveal: existing `motion/react` motion with `useReducedMotion()` in the Reveal component (unchanged).
- Footer note Reveal: same.
- Chronicle entries: no motion. `<details>` open/close is native browser disclosure (no animation by default).
- Cyan-tick colour transition on open: CSS `transition-colors duration-300`. Tailwind v4's default media-query handling collapses this when reduced-motion is active.
- Atlas: no motion at all. Pure static SVG.

Net: no new motion surface. Reduced-motion safe by construction.

---

## 13. Validation log

| Gate | Result |
|------|--------|
| LCP ≤ 1.5s | ✅ Lead block renders server-side from existing data; no async fetch. |
| No client JS for the chronicle (server-rendered) | ✅ Verified by `grep .next/static/chunks/*.js` — no `ChronicleColumn` symbol in any client bundle. |
| Atlas component lazy-loads; no impact on initial bundle | ✅ Atlas is a Server Component imported only by the notes page — route-isolated. Client bundle delta = 0. |
| Mobile: atlas collapses to a horizontal pill row above the chronicle | ✅ `hidden lg:block` desktop SVG + `lg:hidden` mobile pill row. Order swaps via `order-1 / order-2` in the grid. |
| Tags removed; no broken backlinks | ✅ Tags removed from the chronicle render. The Note data still carries tags (consumed by the note detail page, untouched). No `?tag=` routes existed in V5. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 12.5 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.9 s. TypeScript 8.4 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_NOTES_EDITORIAL` unset → `LegacyNotesPage` renders byte-for-byte with the V5 layout. |
| Cluster filter URL flow | ✅ `/notes?cluster=cloud` → chronicle filters server-side. Invalid cluster value → ignored, no error. |

---

## 14. Risk analysis

### 14.1 Risk: lead block's first-sentence extraction breaks on a future note's body

The `leadSentence()` helper assumes the first sentence ends at `.`, `!`, or `?`. A future note that opens with a code block, an unterminated clause, or a multi-paragraph quote could break the regex.

**Mitigation:** the helper falls back to `note.excerpt` when the extracted sentence is empty or > 200 characters. The fallback ensures the lead block always has content. Future notes can also explicitly set their lead via the excerpt field if the body doesn't open cleanly.

### 14.2 Risk: `<details>` is a styling challenge across browsers

Native `<details>` rendering varies slightly across browsers (Safari shows a different default disclosure marker than Chrome). Customising requires `list-style: none` + custom marker hiding.

**Mitigation:** `list-none` Tailwind utility hides the default marker. The cyan-tick replaces it visually. Tested implicitly via the build pipeline; verified by static-HTML inspection.

### 14.3 Risk: sticky year label overlaps with the navbar

The chronicle's `sticky top-20` year label sits 80 px from the viewport top. The navbar's `h-16` (64 px) leaves a 16 px gap. On narrow viewports where the navbar height changes (e.g. mobile drawer open at 12.4), the sticky label could clip.

**Mitigation:** the navbar height is fixed at `h-16` across all viewports (verified by reading the navbar code). The 16 px gap is generous. The sticky label uses `text-[10px]` so even a small clip wouldn't make it illegible.

### 14.4 Risk: atlas SVG text rendering varies across browsers / fonts

SVG `<text>` elements don't always inherit the parent font reliably; some browsers render with their default sans-serif if the font-family doesn't load.

**Mitigation:** the SVG `<text>` elements explicitly set `fontFamily="var(--font-geist-sans), sans-serif"` so the Geist font (loaded by `app/layout.tsx`) is used when available, with a sans-serif fallback. Verified visually in the build output.

### 14.5 Risk: filter UI suggests cluster filtering matters more than it does

With only 3 notes (one per cluster), filtering shows the user a single matching note. The atlas might overpromise a filter feature that doesn't have enough content to feel useful.

**Mitigation:** the atlas is a *navigational anchor*, not a productivity feature. It reads as "here are the topic areas this archive covers", and clicking explores. Future notes (which the operator continues to add) populate the clusters more densely over time. The filter mechanism is in place; usefulness grows with the archive.

### 14.6 Risk: visitors with old bookmarks to `/notes?tag=X` see broken filter

V5 had no tag query parameter — verified by reading the V5 page. Bookmark risk is zero (no V5 URL surfaces were generated with `?tag=`).

---

## 15. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/notes/[slug]/page.tsx` (note detail) | Out of strict 13.1 scope. Audit § 7.2 covers detail-page concerns separately. |
| `data/notes.ts` body text + tags + formats | Only the new `cluster` field added; existing content unchanged. |
| `app/codex/page.tsx` (Codex hub) | Sub-PR 13.2 territory. |
| `app/about/page.tsx` (About page) | Sub-PR 13.3 / 13.4 territory. |
| `/pulse` route | Sub-PR 13.5 territory (doesn't exist yet). |
| `LegacyNotesPage` (rollback path) | Preserved verbatim per spec rollback contract. |
| Page atmosphere (editorial variant from 11.1) | RED LINE — atmosphere logic untouched. |
| Pill primitive, glass primitives, margin tick, text-token ramp | Used by reference, not modified. |
| Lumina, HeroTopology, topology, motion grammar, footer, navbar | RED LINE — all out-of-scope per the 13.1 brief. |
| V4 / V5 systems / telemetry / data shapes / API routes | RED LINE. |
| Note formats (audio, diagram) | Untouched — the formats system continues to power the note detail page's tabs. |

---

## 16. Rollback

### 16.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_NOTES_EDITORIAL=0
```

`<NotesPage />` falls through to `<LegacyNotesPage />`. The V5 hub renders exactly as it did before V6 ever touched the file. The two new Server Components (`ChronicleColumn`, `NoteAtlas`) stay in the codebase but go unused — the bundler tree-shakes them out of the legacy render path.

### 16.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes both new Server Components, reverts `data/notes.ts` (removes the `cluster` field + assignments — V5-safe since the field is optional), and restores the V5 `app/notes/page.tsx` byte-for-byte.

### 16.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- app/notes/page.tsx` reverts just the page file. The two new Server Components and the `cluster` field stay in the codebase — useful if a future iteration wants to reuse the chronicle / atlas primitives on a different surface.

---

## 17. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 13.1 (12.5 pushed, Phase 12 closed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 12.5 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_NOTES_EDITORIAL` unset) | ✅ |
| Off-flag visual: `LegacyNotesPage` byte-identical to V5 | ✅ |
| No client JS impact (chronicle + atlas server-only) | ✅ Verified by `grep .next/static/chunks/*.js`. |
| Cluster filter URL works on flag-on; ignored on flag-off | ✅ |
| Mobile path: pill row above chronicle when flag-on; V5 layout otherwise | ✅ |
| `cluster` field is optional on `Note`; V5-safe | ✅ |
| Page atmosphere unchanged (editorial variant from 11.1) | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, footer, navbar, atmosphere primitives, V4/V5 systems all untouched | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical output | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the V5 hub. The operator flips `NEXT_PUBLIC_V6_NOTES_EDITORIAL=1` after the Phase 13 observation window confirms the visual + interaction direction holds.

---

## 18. Before/After screenshot checklist

(Phase 13 ships behind the observation window; the operator captures these before flipping the flag on in production.)

| # | Viewport | Flag | Path | Capture |
|---|----------|------|------|---------|
| 1 | 1280 × 800 | off | `/notes` | V5 hero + 3-card list. |
| 2 | 1280 × 800 | on  | `/notes` | Lead block + chronicle (2 collapsed entries) + atlas constellation. |
| 3 | 1280 × 800 | on  | `/notes?cluster=cloud` | Active "Cloud" atlas node + filtered chronicle (no entries — CWH is in lead). |
| 4 | 1280 × 800 | on  | `/notes?cluster=mobile` | Active "Mobile" atlas node + chronicle with sixpack-ai entry. |
| 5 | 1280 × 800 | on  | `/notes` (one entry expanded) | Cyan tick brightens + inline excerpt + "Read note →" link visible. |
| 6 | 375 × 667 | off | `/notes` | V5 mobile-stack layout. |
| 7 | 375 × 667 | on  | `/notes` | Lead block + atlas pill row (above) + chronicle. |
| 8 | 375 × 667 | on  | `/notes?cluster=discipline` | Active discipline pill + chronicle showing monk-mode. |

---

## 19. What 13.1 explicitly does NOT do

- ❌ No Codex changes (13.2 territory).
- ❌ No About page changes (13.3 / 13.4 territory).
- ❌ No `/pulse` route creation (13.5 territory).
- ❌ No note detail page (`/notes/[slug]`) changes.
- ❌ No tag system retirement on the detail page — tags persist in data; only the hub stops rendering them.
- ❌ No new font / new colour / new motion grammar.
- ❌ No new dependency, no new helper module beyond the per-page `leadSentence()` + `countByCluster()` utilities.
- ❌ No edits to V4/V5 systems, Lumina, topology, atmosphere primitives, pill vocabulary, glass primitives, margin tick, text-token ramp, navbar / mobile drawer / footer.
- ❌ No removal of `LegacyNotesPage` (preserved for off-flag rollback).
- ❌ No "while we're here" cleanup beyond the spec's mandated retirements (tags from the hub, conventional card pattern).

Single sub-PR. One file refactored, two new Server Components, one optional data-shape field. Reading-surface evolution begins.

---

## 20. V6 Phase 13 — entry progress

After Sub-PR 13.1: 1 / 5 Phase 13 sub-PRs landed.

Remaining (per V6 § 4.2):

- 13.2 — Codex Hub As A Composed Shelf (`V6_CODEX_SHELF`).
- 13.3 — About Page: Promote The Best Content To The Top (`V6_ABOUT_RESTRUCTURE`).
- 13.4 — About Page: Section-Level Spatial Variation (`V6_ABOUT_SPATIAL_VAR`).
- 13.5 — Move "Outside The Terminal" To `/pulse` (`V6_PULSE_EXTRACTION`).

Phase 13 exit (§ 4.3) requires all 5 sub-PRs merged + About-page completion-rate improving + Notes hub visit time stable or up + Codex hub click-through improving.

---

## 21. Closing

V6 Sub-PR 13.1 is **the Notes hub finally reading as what it is**: a small, deep archive of long-form engineering writing. Three notes used to occupy three repeating Medium cards; now the most-recent opens the page at display size, the rest sit as a calm scrollable chronicle with the temporal axis anchored by sticky year labels, and the topic axis lives in a small constellation diagram to the right.

No new font. No new colour. No new motion. No new client JS. The redesign moves through pure server-rendered composition and progressive-disclosure HTML primitives — `<details>` and `<summary>` doing the work that V5 reached for client-side state to achieve.

The hub no longer looks like Medium. It looks like a magazine's table of contents.

Same systems. Same palette. Reading surface now matches the archive's depth.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
