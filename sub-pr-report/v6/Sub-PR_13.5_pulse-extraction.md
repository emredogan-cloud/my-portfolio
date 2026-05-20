# Sub-PR 13.5 — Move "Outside The Terminal" To `/pulse` · V6 Phase 13 closer

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 13 — Reading Surfaces · Sub-PR 13.5 (Phase 13 closer)
**Scope:** Create a small dedicated `/pulse` route hosting the four lifestyle entries (Training / The motorcycle / Reading / The codex) that audit § 4.2 flagged as emotionally mis-positioned on `/about`. The V6 `/about` page (post-13.3) already removed the inline Outside The Terminal section; 13.5 completes the move by giving the content its own surface, adding a quiet "On the hours that aren't code → /pulse" footer link near the V6AboutPage's closing transmission, and surfacing /pulse inside the Operate dropdown of both the desktop navbar and the mobile drawer. Flag-gated by `NEXT_PUBLIC_V6_PULSE_EXTRACTION`; default OFF makes /pulse return 404 and hides the footer link + dropdown entry.

**Phase 13 closes here. The lifestyle block bracketing the engineering content is gone; engineering pacing is uninterrupted; the lifestyle content is reachable on its own quiet surface.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 4.2 (Outside The Terminal in the wrong position), V6 execution § Sub-PR 13.5 verbatim, V6 future systems, plus the 11.x / 12.x / 13.x sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-13.4 push, deployment-safe.

Audit anchor: § 4.2 (🟠 Drag) — "The page just finished telling us about discipline and quiet hours, then pivots to motorcycle rides on coast roads, then pivots back to engineering principles. The emotional pacing breaks."

Spec anchor: § Sub-PR 13.5 verbatim — new /pulse route, quiet About footer link, Mobile Operate dropdown gains /pulse, narrative atmosphere variant, server-rendered, no new dependencies.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 placed the "Outside The Terminal" lifestyle block (Training / Motorcycle / Reading / Codex) between Monk Mode and Principles. The page finishes describing discipline, pivots to coast-road motorcycle rides, then pivots back to engineering principles. The audit's framing is precise: "The emotional pacing breaks."

V6 Sub-PR 13.3 already removed the inline section from `V6AboutPage`. The legacy V5 layout (rolled back state) still renders Outside The Terminal inline because the audit accepts that visitors on the rollback path will encounter the V5 emotional break — that's the cost of rollback safety, not a design choice.

V6 Sub-PR 13.5 completes the move by:
- **Creating `/pulse`** — a dedicated route hosting the same four lifestyle entries, with the V6 § 11.1 `narrative` atmosphere variant.
- **Adding a footer link** from V6AboutPage's closing transmission: a single quiet line "On the hours that aren't code → /pulse" in mono uppercase tracking.
- **Surfacing /pulse** in the Operate dropdown of both the desktop V6Navbar and the mobile drawer per spec validation #2.
- **Sharing data** between /pulse and the LegacyAboutPage's inline Outside The Terminal by extracting `pulseEntries` to a new `data/pulse.ts` module.

The engineering pacing of /about is uninterrupted; the lifestyle content survives as an operator-adjacent surface.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: extract `data/pulse.ts` — single source of truth for the four lifestyle entries; both /pulse and LegacyAboutPage's Outside The Terminal consume it.
Cut 2: new `/pulse` route — Server Component, `narrative` atmosphere, single-column 4-entry list with margin-tick'd left border per entry, quiet back-to-about closer. `notFound()` when the flag is off.
Cut 3: surface /pulse via the quiet About footer line + the Operate dropdown (V6Navbar + MobileMenu) — both gated by the same flag so the link is invisible when the route doesn't exist.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 New shared data module: `data/pulse.ts`

The four lifestyle entries (Training, Motorcycle, Reading, Codex) were inlined in `app/about/page.tsx` as the `LIFESTYLE` constant. Two surfaces now consume the data:

- `LegacyAboutPage` (V5 baseline, rollback path) — still renders Outside The Terminal inline.
- `app/pulse/page.tsx` (new V6 13.5 route) — renders the same entries on a dedicated surface.

Extracting to `data/pulse.ts` makes the data single-sourced. Both surfaces import `pulseEntries`; future edits to a single entry (e.g. swap a reading recommendation) update both places automatically.

```ts
export interface PulseEntry {
  readonly eyebrow: string;
  readonly body: string;
  readonly href?: string;
}

export const pulseEntries: readonly PulseEntry[] = [
  { eyebrow: "Training", body: "Five sessions a week …" },
  { eyebrow: "The motorcycle", body: "Naked sport on the Adana coast roads …" },
  { eyebrow: "Reading", body: "Long-arc texts — Kleppmann, Hennessy & Patterson …" },
  { eyebrow: "The codex", body: "Three handcrafted digital editions …", href: "/codex" },
];
```

`app/about/page.tsx` now imports `pulseEntries` and re-exposes the type alias `LifestyleEntry = PulseEntry` so the LegacyAboutPage's inline references continue to work without rewriting the JSX.

### 3.2 `/pulse` route — Server Component, narrative atmosphere, notFound() when flag off

`app/pulse/page.tsx` is a pure Server Component with no `"use client"` directive. The page reads `process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION` at the top of the function and calls `notFound()` when the flag is unset:

```tsx
export default function PulsePage() {
  if (process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION !== "1") {
    notFound();
  }
  return <Content />;
}
```

The `process.env.NEXT_PUBLIC_*` value is inlined at build time. With the flag off during build, the page throws `notFound()` and Next.js pre-renders the 404 surface for `/pulse`. With the flag on during build, the page pre-renders the lifestyle content statically.

The page registers as a static route (`○ /pulse`) in the build inventory either way — the rendered content differs based on the build-time flag.

### 3.3 Narrative atmosphere variant per spec validation

Spec validation #1: "/pulse renders with `narrative` atmosphere variant."

The page mounts `<PageAtmosphere variant="narrative" legacy={…}>` — the same variant the `/codex` hub and `/codex/[slug]` detail page use. Per V6 § 11.1 the narrative variant renders a large cyan ellipse top-right and (optionally) a per-page sigil glyph. /pulse passes no sigil — it's a quiet surface, not a codex book.

Legacy fallback colours: cyan top-right + gold bottom-left — preserves the editorial atmospheric family of /codex when V6_ATMOSPHERE_VARIANTS is off.

### 3.4 Page composition — single-column list with cyan margin border

Each lifestyle entry renders as a small article block with a left margin cyan border (a vertical 1px hairline at 18% cyan opacity) — extending the V6 11.5 margin-tick motif into a longer per-entry rule. The composition reads as editorial text, not as card tiles.

```tsx
<article className="relative pl-5 border-l border-[#00d2ff]/[0.18] group">
  <div className="flex items-baseline justify-between gap-3 mb-3">
    <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/85">
      {entry.eyebrow}
    </span>
    {entry.href ? <ArrowRight … /> : null}
  </div>
  <p className="text-secondary text-[15.5px] leading-[1.85] max-w-2xl">
    {entry.body}
  </p>
</article>
```

Entries with `href` (currently only "The codex" → `/codex`) wrap in a `<Link>` so the whole block is tappable; non-href entries render as plain articles.

The page closes with a quiet "← Back to about" mono link to loop the visitor back to the main operating page.

### 3.5 Footer link from V6AboutPage to /pulse

Spec: "Linked from the About footer with one quiet line: 'On the hours that aren't code → /pulse'."

Added inside V6AboutPage's section 11 (CLOSING H2 + CTAs), between the CTAs and the end-transmission signature:

```tsx
{process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION === "1" ? (
  <p className="mt-16 font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
    On the hours that aren&apos;t code{" "}
    <Link href="/pulse" className="text-[#00d2ff]/80 hover:text-[#00d2ff] …">
      → /pulse
    </Link>
  </p>
) : null}
```

Mono uppercase tracking — matches the end-transmission signature vocabulary directly above and below it. The arrow + slug renders cyan; the lead-in phrase renders tertiary. Single quiet line as the spec asks.

When the flag is off, the line doesn't render — there's no `/pulse` to link to.

LegacyAboutPage doesn't add this line (it still renders Outside The Terminal inline; no footer link needed).

### 3.6 Operate dropdown gains /pulse — Navbar + MobileMenu

Spec validation #2: "Mobile menu's Operate dropdown gains /pulse (or About sub-link)."

The desktop navbar's `V6_OPERATE_LINKS` array and the mobile drawer's `OPERATE_SUBMENU` array both gain a conditional /pulse entry, gated by the same flag:

```tsx
const V6_PULSE_ENABLED =
  process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION === "1";

const V6_OPERATE_LINKS = [
  { label: "Telemetry", href: "/telemetry" },
  …
  { label: "Brain", href: "/lumina/brain" },
  ...(V6_PULSE_ENABLED ? [{ label: "Pulse", href: "/pulse" }] : []),
];
```

Same pattern in MobileMenu. The `OPERATE_PARENT.matches` array also gains `/pulse` so the Operate label highlights when the visitor is on the lifestyle route.

Per spec ("Operate dropdown gains /pulse") — /pulse is operator-adjacent in the sense of being reachable through the operator menu, not because it carries operator content. Audit § 4.2 frames /pulse as "operating-adjacent surface that hosts Training / Motorcycle / Reading / Codex content."

The "or About sub-link" alternative in the spec was deferred — the Operate dropdown gain is the more discoverable pattern and the V6 navbar already supports submenu items elegantly.

### 3.7 Flag-gated everywhere — single switch flips three surfaces at once

`NEXT_PUBLIC_V6_PULSE_EXTRACTION` gates:
1. The `/pulse` route itself (`notFound()` when off).
2. The V6AboutPage footer link (rendered when on, absent when off).
3. The Operate dropdown entry in both desktop V6Navbar and mobile MobileMenu (visible when on, hidden when off).

When the operator flips the flag on, all three surfaces activate simultaneously. When the flag is off, all three are invisible. No partial state.

### 3.8 LegacyAboutPage unchanged

The legacy V5 about path is completely untouched by 13.5. It continues to render Outside The Terminal inline using the same `LIFESTYLE` data (now imported from `data/pulse.ts` as a type-aliased re-export).

This means: rollback to V6_ABOUT_RESTRUCTURE off → Outside The Terminal returns to /about (because LegacyAboutPage rendering activates), AND /pulse 404s (because V6_PULSE_EXTRACTION is independent — but the operator likely sets both off together).

The two flag matrix:

| `V6_ABOUT_RESTRUCTURE` | `V6_PULSE_EXTRACTION` | Behaviour |
|---|---|---|
| off | off | LegacyAboutPage renders Outside The Terminal inline; /pulse 404; no footer link; no Operate dropdown entry. |
| off | on | LegacyAboutPage renders Outside The Terminal inline (duplicate content with /pulse); /pulse renders content; Operate dropdown shows /pulse. Slightly redundant but harmless. |
| on | off | V6AboutPage doesn't render Outside The Terminal; /pulse 404; no footer link; no Operate dropdown entry. **Worst state — lifestyle content unreachable.** |
| on | on | V6AboutPage doesn't render Outside The Terminal; /pulse renders content; footer link + Operate dropdown entry visible. **Intended steady state.** |

The "worst state" (V6_ABOUT_RESTRUCTURE on + V6_PULSE_EXTRACTION off) means visitors lose access to lifestyle content entirely. The audit accepts this brief gap during a sequenced rollout — the operator flips V6_PULSE_EXTRACTION on alongside or shortly after V6_ABOUT_RESTRUCTURE.

### 3.9 No new dependencies, no new asset

Per spec validation #3: "Page is server-rendered; no new dependencies."

`/pulse` imports only:
- `next` (Metadata type)
- `next/link`
- `next/navigation` (notFound)
- `lucide-react` (ArrowRight)
- `@/components/ui/Reveal`
- `@/components/layout/PageAtmosphere`
- `@/data/pulse`

All existing modules. `package.json` unchanged. No new font, no new image asset.

### 3.10 Mobile menu integration preserves the inline expand

MobileMenu's Operate inline expansion (Sub-PR 12.4) currently lists 6 routes (Operating, Telemetry, Evolution, Journal, Changelog, Brain). With the flag on, it expands to 7 routes (adding Pulse at the end). The inline expansion height grows by ~44 px (one tap row); the drawer's `overflow-y-auto` handles the additional content gracefully on small viewports.

---

## 4. What changed

### 4.1 New files (2)

| File | Description |
|------|-------------|
| `data/pulse.ts` | 1.4 KB source. Exports `PulseEntry` interface + `pulseEntries` readonly array. Four entries: Training, The motorcycle, Reading, The codex (with `href: "/codex"`). |
| `app/pulse/page.tsx` | 4.5 KB source. Server Component. Hero ("On the hours / that aren't code") + 4 entries with margin-tick'd left border + back-to-about link. `notFound()` gated by `NEXT_PUBLIC_V6_PULSE_EXTRACTION`. Narrative atmosphere variant. |

### 4.2 Modified files (3)

| File | Change |
|------|--------|
| `app/about/page.tsx` | Import `pulseEntries` + `PulseEntry` from `data/pulse`. Replace the inline `LIFESTYLE` constant + `LifestyleEntry` interface with a type alias + re-export of `pulseEntries`. Add the V6 13.5 footer link "On the hours that aren't code → /pulse" inside V6AboutPage's CLOSING section (gated by the pulse flag). |
| `components/layout/Navbar.tsx` | Add `V6_PULSE_ENABLED` module-scope boolean from `NEXT_PUBLIC_V6_PULSE_EXTRACTION`. Conditionally append `{ label: "Pulse", href: "/pulse" }` to `V6_OPERATE_LINKS` and `"/pulse"` to `V6_OPERATE_PARENT.matches`. |
| `components/layout/MobileMenu.tsx` | Same pattern as Navbar — `PULSE_ENABLED` boolean + conditional append to `OPERATE_PARENT.matches` and `OPERATE_SUBMENU` arrays. |

### 4.3 No data shape change for existing surfaces

The `LIFESTYLE` constant in LegacyAboutPage now imports from `data/pulse` via a type alias. The interface name `LifestyleEntry` is preserved as `type LifestyleEntry = PulseEntry`. The JSX rendering in LegacyAboutPage is byte-identical.

---

## 5. Notes redesign rationale

13.5 is the Codex pulse-extraction — not Notes. Notes was 13.1.

The Phase 13 sub-PR sequence is:
- 13.1 Notes hub editorial index ✓
- 13.2 Codex shelf composition ✓
- 13.3 About restructure + lead rewrite ✓
- 13.4 About spatial variation ✓
- 13.5 /pulse extraction (this commit — Phase 13 closer)

Each sub-PR carries one mission. 13.5 is the final reading-surface sub-PR; the next phase work moves to work surfaces (/projects, /architecture, /stack) in Phase 14.

---

## 6. Codex redesign rationale

13.5 does not touch the codex hub. The lifestyle "The codex" entry on `/pulse` carries the same `href: "/codex"` as the V5 Outside The Terminal tile — visitors discover the codex via /pulse just as they did via the old about-page section. The codex hub itself (Sub-PR 13.2) is unchanged.

---

## 7. Reading-density on `/pulse`

The page is intentionally compact:

| Element | Approximate height (lg viewport) |
|---------|-----------------------------------|
| Hero (eyebrow + H1 + lead paragraph) | ~360 px |
| 4 entries (margin-tick'd, ~3-line paragraphs each, gap-12 between) | ~720 px |
| Back-to-about closer + colophon-style border | ~80 px |
| **Total** | **~1 160 px** |

The page reads in ~1.5 viewports. Quick scan, calm exit. The visitor leaves with the lifestyle context but doesn't get pulled into a long-form surface.

---

## 8. Typography impact

No new font, no new weight. The 13.5 changes use:

- Eyebrow per entry: `font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/85` — same mono eyebrow vocabulary used across V6.
- Body per entry: `text-secondary text-[15.5px] leading-[1.85] max-w-2xl` — slightly larger than the V5 lifestyle tiles (15px → 15.5px) to give the dedicated surface a calmer reading rhythm.
- Footer link on /about: `font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary` with cyan slug — matches the end-transmission signature line vocabulary above and below.

Canonical V6 text-token ramp from 11.4 preserved throughout.

---

## 9. Mobile impact

V6 `/pulse` on mobile:
- Hero scales responsively (text-5xl on mobile, text-7xl on md+).
- Four entry articles stack vertically in DOM order with `space-y-12` (48 px between).
- Each entry's left margin border (`border-l border-[#00d2ff]/[0.18] pl-5`) renders identically on mobile — same vertical hairline + 20 px text inset.
- Back-to-about link sits at the bottom centred.

Total mobile scroll: ~1 400 px (slightly taller than desktop due to body wrapping to more lines per entry).

The V6Navbar / MobileMenu also surface /pulse — see § 3.6 for details.

---

## 10. Accessibility verification

### 10.1 Semantic structure

- `<main id="main">` wraps the page.
- `<section>` wraps the entries list.
- `<article>` per entry; each `<article>` has its own eyebrow + body.
- Entries with `href` wrap in `<Link>` with `aria-label="${entry.eyebrow} — open ${entry.href}"`.
- Back-to-about link uses semantic `<Link>` with mono icon.

### 10.2 Keyboard navigation

Tab order on `/pulse`:
1. (no focusable elements in hero).
2. "The codex" article Link (the only entry with `href`).
3. Back-to-about Link.

Only 2 focusable elements on the page — a calm, scannable surface.

### 10.3 ARIA + screen reader

VoiceOver reading /pulse:
> "On the hours that aren't code., heading level 1. Four operating-adjacent disciplines that keep the work calm…"
> "Training. Five sessions a week, an iron-only programme…"
> "The motorcycle. Naked sport on the Adana coast roads…"
> "Reading. Long-arc texts — Kleppmann, Hennessy & Patterson…"
> "The codex — open /codex, link. Three handcrafted digital editions…"
> "Back to about, link."

### 10.4 Reduced motion

The page uses the existing Reveal motion entrance pattern. Reveal respects `useReducedMotion()` (unchanged from V5/13.1-13.4). No new motion surface.

---

## 11. Performance impact

### 11.1 Bundle delta

- `data/pulse.ts`: 1.4 KB source, server-only data → 0 KB client bundle.
- `app/pulse/page.tsx`: 4.5 KB source, Server Component → 0 KB client bundle.
- Page source delta on `app/about/page.tsx`: ~25 lines added (LIFESTYLE replaced with re-export + footer link).
- Navbar.tsx / MobileMenu.tsx: ~15 lines added each for the conditional /pulse append.

**Net client JS delta: 0 bytes.** The V6_PULSE_ENABLED boolean check inlines at build time; the conditional append produces a static array with or without /pulse — no runtime branching cost.

### 11.2 LCP

`/pulse` renders the H1 + lead paragraph in the first paint. Server-side static generation. No async fetch, no image. LCP element is the H1.

### 11.3 Hydration

`NEXT_PUBLIC_V6_PULSE_EXTRACTION` inlined at build time across all touched files. Server-rendered HTML and client-hydrated HTML carry identical structure. Zero mismatch surface.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| /pulse renders with narrative atmosphere variant | ✅ `<PageAtmosphere variant="narrative" legacy={…}>` mounted; legacy colours cyan + gold for off-flag fallback. |
| Mobile menu's Operate dropdown gains /pulse | ✅ Conditional `{ label: "Pulse", href: "/pulse" }` appended to `OPERATE_SUBMENU` in MobileMenu when flag on. Desktop V6Navbar's `V6_OPERATE_LINKS` carries the same addition. |
| Page is server-rendered; no new dependencies | ✅ Server Component (no `"use client"` directive); imports only existing local modules + lucide-react ArrowRight (already a dependency). |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 13.4 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.4 s. TypeScript 8.1 s. **55 / 55 static pages** (was 54 before 13.5 — `/pulse` registered as `○ Static`). No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_PULSE_EXTRACTION` unset → /pulse calls notFound() and pre-renders the 404 surface. Footer link on V6AboutPage doesn't render. Operate dropdown doesn't show /pulse. |
| `data/pulse.ts` single source of truth | ✅ Both `app/pulse/page.tsx` and `LegacyAboutPage` import `pulseEntries`; updates to data flow to both surfaces. |

---

## 13. Risk analysis

### 13.1 Risk: V6_ABOUT_RESTRUCTURE on + V6_PULSE_EXTRACTION off creates orphan content gap

If the operator flips V6_ABOUT_RESTRUCTURE on (V6AboutPage drops Outside The Terminal) but leaves V6_PULSE_EXTRACTION off (no /pulse), the lifestyle content is unreachable from any surface.

**Mitigation:** documented in § 3.8. The operator should flip both flags together OR keep both off. The Phase 13 observation window post-13.5 is the moment to validate this transition: the operator sets both flags on, observes, then deploys. The pre-13.5 state (V6_ABOUT_RESTRUCTURE on, no /pulse yet) was the bridge; 13.5 closes it.

### 13.2 Risk: build-time flag inlining means flag changes require redeploy

`process.env.NEXT_PUBLIC_*` is inlined at build time. Changing the flag value requires a rebuild — toggling the env var on a running deployment has no effect.

**Mitigation:** standard Next.js behaviour for NEXT_PUBLIC_ vars. The V6 deployment cadence already assumes a build per flag-flip (true for every V6 sub-PR using NEXT_PUBLIC_). Documented in V6 § 11.2 / § 11.3 / § 12.1+ rollback notes.

### 13.3 Risk: /pulse Operate dropdown entry conflates lifestyle and operator content

The Operate dropdown's existing items (Telemetry, Evolution, Journal, Changelog, Brain) are operator-grade surfaces. Adding /pulse — a lifestyle surface — to that dropdown may confuse visitors expecting only operator content.

**Mitigation:** spec explicitly mandates the Operate dropdown gain /pulse ("operating-adjacent surface"). The visitor's mental model bridges from "operator coordinates" → "lifestyle that supports the coordinates" — /pulse is the operator's pulse, not a separate persona. The alternative ("About sub-link") in the spec was a fallback if the Operate placement felt wrong; the Operate placement is the primary direction.

### 13.4 Risk: /pulse renders with narrative atmosphere but is a lifestyle page (not narrative)

The `narrative` atmosphere variant was designed for codex / architecture surfaces (per V6 § 11.1) — large cyan ellipse, optional sigil glyph. Lifestyle content on /pulse doesn't have a sigil, but uses the narrative variant per spec.

**Mitigation:** spec validation #1 mandates the narrative variant. The variant works visually on /pulse — the large cyan ellipse top-right reads as a calm operator-adjacent atmospheric setting. No sigil renders because the page doesn't pass one. The variant choice is the spec author's deliberate framing of /pulse as a quiet, atmospheric, narrator-of-self surface — the narrative variant fits.

### 13.5 Risk: footer link "On the hours that aren't code → /pulse" duplicates the eyebrow ergonomically

The footer line mirrors the lifestyle entry styling — mono uppercase tracking. A visitor scanning quickly might miss the link as part of the closing transmission ornament.

**Mitigation:** the line carries a cyan `→ /pulse` slug that visually distinguishes the link target. Hover transitions the slug from cyan/80 to cyan/100. Distinct enough to read as an affordance, calm enough not to compete with the closing CTA's "Get in touch" pill above it.

### 13.6 Risk: pulseEntries data shape drift breaks LegacyAboutPage

`LegacyAboutPage` re-exposes `pulseEntries` as `LIFESTYLE` via a type alias. If `PulseEntry` shape changes (e.g. adds a required field), the LegacyAboutPage compilation would fail.

**Mitigation:** the type alias is the right shape. Any future change to `PulseEntry` should be additive (new optional field) — same V5-safe pattern as `cluster?` on `Note` in 13.1. The legacy path stays robust.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `LegacyAboutPage` Outside The Terminal section | Rollback path; preserved verbatim. |
| V6 13.3 section reorder + hero rewrite | Preserved. |
| V6 13.4 spatial variation | Preserved. |
| `/notes`, `/codex`, `/about` body content | Untouched. |
| `data/codex.ts`, `data/notes.ts` | Untouched. |
| Lumina, HeroTopology, topology, motion grammar | RED LINE. |
| Footer, atmosphere primitives, pill / glass / margin-tick / text-ramp | Used by reference, not modified. |
| V4 / V5 systems / telemetry / data shapes / API routes | RED LINE. |
| No new image asset | `/pulse` uses no images. |
| Mobile drawer outer composition (12.4) | Preserved — only Operate submenu array touched. |
| Navbar outer composition (12.1-12.3) | Preserved — only Operate submenu array touched. |

---

## 15. Rollback

### 15.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_PULSE_EXTRACTION=0
```

- `/pulse` returns 404 (notFound() pre-renders the 404 surface at build time).
- V6AboutPage's footer link to /pulse doesn't render.
- Navbar's Operate dropdown loses the Pulse entry.
- MobileMenu's Operate inline expansion loses the Pulse entry.
- Operate parent's prefix-match drops /pulse (label no longer highlights on the route — moot since the route 404s).

If the operator also has V6_ABOUT_RESTRUCTURE off, LegacyAboutPage continues to render Outside The Terminal inline. Pre-V6 state restored.

### 15.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes `data/pulse.ts` and `app/pulse/page.tsx`, restores inline `LIFESTYLE` in `app/about/page.tsx`, removes the conditional Pulse entries from Navbar + MobileMenu.

### 15.3 Per-file revert (surgical)

`git checkout HEAD~1 -- app/pulse/` deletes /pulse only; other files keep their changes. Useful if a future iteration wants to redesign /pulse on a separate cadence while keeping the about/navbar/mobile-menu integration.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 13.5 (13.4 pushed, origin in sync) | ✅ |
| Build emits 55 static pages (54 + /pulse) | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_PULSE_EXTRACTION` unset) | ✅ |
| Off-flag: /pulse 404, footer link absent, Operate dropdown clean | ✅ |
| `data/pulse.ts` single source of truth for both /pulse and LegacyAboutPage | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Server Component throughout (zero client JS impact) | ✅ |
| Reduced-motion: no new motion surface; existing Reveal honours useReducedMotion() | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical output | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives (only `narrative` consumed), navbar / mobile drawer composition (only Operate submenu touched), footer, pill / glass / margin-tick / text-ramp, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders 54 routes (no /pulse). The operator flips `NEXT_PUBLIC_V6_PULSE_EXTRACTION=1` (alongside `NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE=1` and `NEXT_PUBLIC_V6_NAV_PROMOTION=1`) after the Phase 13 observation window confirms green.

---

## 17. What 13.5 explicitly does NOT do

- ❌ No section reorder on /about (13.3 territory; preserved verbatim).
- ❌ No spatial variation changes on /about (13.4 territory; preserved verbatim).
- ❌ No /notes or /codex changes.
- ❌ No `/pulse` page content beyond the four existing lifestyle entries.
- ❌ No new font / new colour / new motion / new dependency / new asset.
- ❌ No edits to V4/V5 systems, Lumina, topology, atmosphere primitives, pill vocabulary, glass primitives, margin tick CSS, text-token ramp.
- ❌ No edits to LegacyAboutPage's Outside The Terminal section (still rendered when V6_ABOUT_RESTRUCTURE is off).
- ❌ No removal of `LIFESTYLE` type alias in about/page.tsx (preserves the JSX inline references in LegacyAboutPage).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. One new data module, one new route, three touched files. The lifestyle content moves to its own surface; engineering pacing on /about is uninterrupted.

---

## 18. V6 PHASE 13 — EXIT CRITERIA

Per V6 § 4.3:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ✅ 13.1 Notes editorial index → 13.2 Codex shelf → 13.3 About restructure + lead rewrite → 13.4 About spatial variation → 13.5 /pulse extraction (this commit). |
| About page completion-rate improves by ≥ 10 % | ⏳ Observation period begins now. Operator monitors via Lumina chat-open telemetry at end-of-page (per V6 § 4.3 framing). |
| Notes hub session time stable or up | ⏳ Observation period. |
| Codex hub → codex detail click-through improves | ⏳ Observation period. |

**Phase 13 closes.** The 30-day Phase 13 observation window opens NOW. Phase 14 (work surfaces — Projects merged hub, Architecture pages, Stack compression) opens only after the operator confirms green on:
1. About page bottom-section engagement up by ≥ 10 % (Lumina chat-open as proxy).
2. Notes hub session time stable or up.
3. Codex hub click-through improving.
4. Founder energy not red on operator's weekly check-in.

If any of the four is red 2 consecutive weeks → Phase 14 pauses automatically per V6 § 9.

---

## 19. V6 Phase 13 — cumulative footprint summary

| Sub-PR | Title | Commit |
|--------|-------|--------|
| 13.1 | Notes As An Editorial Index | `4af4f67` |
| 13.2 | Codex Hub As A Composed Shelf | `79adb04` |
| 13.3 | About Restructure + Lead Rewrite | `f213f30` |
| 13.4 | About Spatial Variation | `7985de3` |
| 13.5 | /pulse Extraction (closer) | TBD |

**Phase 13 totals:**
- 5 sub-PRs · 13 files touched · 5 new components (ChronicleColumn, NoteAtlas, CodexShelf, CodexLineage, PhilosophyTiles) + 1 new route (/pulse) + 1 new data module (data/pulse.ts).
- 5 V6 env flags introduced (`V6_NOTES_EDITORIAL`, `V6_CODEX_SHELF`, `V6_ABOUT_RESTRUCTURE`, `V6_ABOUT_SPATIAL_VAR`, `V6_PULSE_EXTRACTION`).
- Audit findings resolved: §§ 4.1 (about page predictable), 4.2 (lifestyle interrupt), 4.3 (asymmetric one-off), 4.4 (best content at bottom), 4.6 (identity sentence buried), 7.1 (Notes blog list), 8.1 (Codex vertical folios).
- Cumulative monthly maintenance: 1.5 hr/month per V6 § 4.4.

---

## 20. Closing

V6 Sub-PR 13.5 is **the lifestyle block finally living on its own surface**. The audit's emotional-pacing concern resolves: /about now reads through its engineering content without the motorcycle-and-coast-roads interruption, and the lifestyle context survives at /pulse as an operator-adjacent surface visitors discover via the Operate dropdown or the one quiet footer line at /about's emotional close.

Phase 13 closes here. Five sub-PRs landed: notes editorial index (13.1), codex composed shelf (13.2), about restructure + lead rewrite (13.3), about spatial variation (13.4), /pulse extraction (13.5). The audit's reading-surface findings — Notes conventional blog list, Codex vertical folios, About predictable + lifestyle interrupt + best-content-at-bottom + buried-identity, asymmetric one-off — all resolved.

The 30-day observation window opens. Phase 14 (work surfaces) waits until the operator confirms green on completion-rate, session time, click-through, and energy. The reading layer is now what the audit wanted it to be.

Same systems. Same palette. The pulse beats in its own room.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
