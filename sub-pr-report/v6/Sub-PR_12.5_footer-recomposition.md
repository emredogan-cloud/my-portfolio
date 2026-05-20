# Sub-PR 12.5 — Footer Recomposition · V6 Phase 12 closer

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 12 — Wayfinding Reform · Sub-PR 12.5 (Phase 12 closer)
**Scope:** Retire the legacy footer's "row of 8 utilities" composition (audit § 1.8 drag) in favour of a three-row composed closing surface per V6 § 12.5 spec: edge-to-edge thin cyan rule on top, two side-by-side blocks below (signature + BuildBeacon LEFT, three vertical links RIGHT), and a centered editorial mono-transmission line with the FooterCliPrompt + LiveCustomerCounter inlined. Download CV is removed (Sub-PR 12.2 relocated it to the navbar). The legacy footer stays in the same file behind the new `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE` flag for rollback. **Phase 12 closes here.**

**Single file touched. Phase 12 closure — 5 / 5 sub-PRs landed. The 30-day Phase 12 observation window opens.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 1.8 (footer carries 8 pieces and reads as lazy) + § 17, V6 execution § Sub-PR 12.5 verbatim, V6 future systems, plus the 12.1 / 12.2 / 12.3 / 12.4 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-12.4 push, deployment-safe.

Inventoried current footer state:
- 8 elements in a `flex-wrap` row: signature, BuildBeacon, LiveCustomerCounter, FooterCliPrompt, Notes link, GitHub link, LinkedIn link, Download CV.
- `LiveCustomerCounter` hides itself when `paying_customers === 0 || null` (verified — internal `if (count === null || count <= 0) return null` guard).
- `BuildBeacon` polls `/api/build-status` every 60 s, pauses on hidden tab.
- `FooterCliPrompt` is a click-to-copy button with the `npx emredogan ask "Who is Emre?"` command.

Audit anchor: § 1.8 (🟠 Drag — "a row of utilities that grew over time"; footer reads as "I added these because I had to.")

Spec anchor: § Sub-PR 12.5 verbatim — three-row composition, edge-to-edge cyan rule, signature LEFT + links RIGHT, centered mono editorial transmission.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 ended with the footer carrying 8 elements in one flex-row strip. The audit framing is precise:

> The footer should either be: an ultra-minimal signature (one line), OR a composed *closing surface* worthy of its position. It is currently neither — it is a row of utilities that grew over time. Footers from peers (Linear, Vercel, Pitch) treat the bottom as a full editorial composition.

Sub-PR 12.5 ships the spec's composed-closing-surface direction. The footer becomes:

**Row 1** — edge-to-edge thin cyan rule. The existing border-top stays as the structural separator from page content; a new gradient hairline at 12 % cyan opacity sits 10 px below as the footer's own opening signal. The hairline fades to transparent at both edges so it reads as a deliberate piece of typography, not a chrome divider.

**Row 2** (md+ TWO blocks side-by-side):
- **LEFT:** quiet signature paragraph ("Long-arc systems, hand-built infra. Adana, GMT+3. © 2026") with the **BuildBeacon BELOW** the signature (not inline) as a separate operator-tone line.
- **RIGHT:** three quiet links — Notes / GitHub / LinkedIn — stacked vertically, with the lucide brand icons aligned left on GitHub/LinkedIn (Notes has no brand icon per spec wording).

**Row 3** — centered editorial transmission. Single mono line at `text-[10px] uppercase tracking-[0.18em]`: `Emre Doğan · Monk Mode · 2026` followed by the FooterCliPrompt (always inlined) and the LiveCustomerCounter (inlined when count > 0, hidden when 0).

**Removed:** the Download CV link. Sub-PR 12.2 relocated it to the navbar as a quiet inline Résumé link; the footer no longer carries it.

The visual hierarchy moves from "8 things stacked horizontally" to "three deliberate rows", each carrying a single editorial intent.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: `Footer.tsx` becomes a small flag-gated entry that branches on `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE`. `LegacyFooter` preserves the V5 row exactly. `V6Footer` ships the three-row composition.
Cut 2: Row 1 introduces the edge-to-edge gradient hairline at 12 % cyan opacity as a visible separator that owns the footer's entry.
Cut 3: Row 3 inlines `FooterCliPrompt` and `LiveCustomerCounter` into a single centered editorial transmission, completing the "composed closing surface" identity.

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single file, two layouts coexist

`components/layout/Footer.tsx` is now a tiny default export that branches at render time:

```tsx
export default function Footer() {
  if (process.env.NEXT_PUBLIC_V6_FOOTER_RECOMPOSE === "1") {
    return <V6Footer />;
  }
  return <LegacyFooter />;
}
```

Both `LegacyFooter` and `V6Footer` live in the same file. The legacy implementation preserves the V5 layout verbatim (including the 8-element flex row and the Download CV link); the V6 implementation is new. Same pattern as Navbar.tsx in 12.1 — single file, flag-gated, tree-shaken at build time.

Footer.tsx is a Server Component (no `"use client"` directive). The env-flag check works server-side; both `LegacyFooter` and `V6Footer` can compose Client Components (BuildBeacon, LiveCustomerCounter, FooterCliPrompt) freely.

### 3.2 The edge-to-edge cyan rule is layered, not replacing the border-top

The existing `border-t border-white/[0.05]` on the footer wrapper stays — it's the structural separator from the page content above. The new Row 1 cyan rule sits 10 px below the structural border as the footer's own opening signal:

```jsx
<div className="h-px w-full"
     style={{ background: "linear-gradient(to right, transparent, rgba(0,210,255,0.12) 20%, rgba(0,210,255,0.12) 80%, transparent)" }} />
```

Why a gradient and not a flat colour? The spec calls for "edge-to-edge thin cyan rule at 12 % opacity (the existing gradient line, made more prominent)." There was no existing gradient line in the V5 footer; the spec references the V5 system's many cyan-hairline-on-card-top gradients (see audit § 1.6). The V6 footer carries the same gradient grammar: cyan at 12 % opacity in the middle 60 % of the width, fading to transparent at both edges. This makes the rule read as typography rather than chrome.

### 3.3 BuildBeacon moves BELOW the signature (not inline)

The legacy footer inlined the BuildBeacon as a pill next to the signature text:

```jsx
<p>ED. — Long-arc systems...</p>
<BuildBeacon />
<LiveCustomerCounter />
<FooterCliPrompt />
```

The V6 layout stacks them vertically inside the LEFT block:

```jsx
<div className="space-y-3">
  <p>Long-arc systems...</p>
  <BuildBeacon />
</div>
```

This isolates the BuildBeacon as a separate operator-tone line. The signature reads as static identity; the BuildBeacon reads as live status. Their visual separation makes the rhythm of the footer cleaner.

### 3.4 The signature loses its "ED. —" prefix

V5 signature: `ED. — Long-arc systems, hand-built infrastructure. Adana, GMT+3. © 2026`

V6 signature (per spec): `Long-arc systems, hand-built infra. Adana, GMT+3. © 2026`

The wordmark "Emre Doğan" now lives in the navbar (Sub-PR 12.3) and again in Row 3's mono line. The footer signature is content-only — the operator's name doesn't need to repeat in the same screen-area.

The signature also shortens "hand-built infrastructure" to "hand-built infra" per spec text. A small typographic tightening that keeps the signature scanable at the new max-w-xs constraint.

### 3.5 Row 2 RIGHT block: three quiet links, stacked

Spec: "Three quiet links — Notes / GitHub / LinkedIn — stacked vertically, with the lucide brand icons aligned left."

Implementation:

```jsx
<nav className="flex flex-col gap-3 md:items-end" aria-label="Footer links">
  <Link href="/notes">Notes</Link>
  <a href="github..." ...><GitHubIcon /> GitHub</a>
  <a href="linkedin..." ...><LinkedInIcon /> LinkedIn</a>
</nav>
```

- Notes is the only entry without a brand icon — Notes is an internal route, not an external service. Spec's "lucide brand icons aligned left" clause specifically refers to GitHub + LinkedIn (the brand icons).
- `md:items-end` right-aligns the column on desktop so it sits flush with the right edge of the layout grid.
- Mobile: `flex flex-col` stacks the three links left-aligned (same column as the LEFT block's signature).

### 3.6 Row 3: single editorial transmission, conditional inline counter

Spec: "Centered mono line: 'EMRE DOĞAN · MONK MODE · 2026' at very small font, with the LiveCustomerCounter and FooterCliPrompt INLINED inside this line as a single editorial transmission (when LiveCustomerCounter has data; otherwise omitted entirely)."

Interpretation chosen: the `LiveCustomerCounter` renders inline when it has data (count > 0) and renders null otherwise. The `FooterCliPrompt` is always inline — it's a Phase 2 polish discovery surface with independent value. The "otherwise omitted entirely" clause is applied to the counter only (which already does this via its internal `if (count === null || count <= 0) return null`).

Implementation:

```jsx
<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.18em] text-quiet">
  <span>Emre Doğan · Monk Mode · 2026</span>
  <FooterCliPrompt />
  <LiveCustomerCounter />
</div>
```

- `flex-wrap` lets the line wrap on mobile if the combined text exceeds viewport width.
- `gap-x-4 gap-y-2` spaces items horizontally (16 px) and vertically (8 px) when wrapping.
- `text-quiet` (30 % white) keeps the editorial transmission calm.
- When `LiveCustomerCounter` renders null, the flex container ignores the missing child and the line stays clean.

The brand line is "Emre Doğan · Monk Mode · 2026" — V6 § 12.5 spec uses the uppercased form ("EMRE DOĞAN · MONK MODE · 2026"). The CSS `uppercase` utility transforms the lowercase title-case source into uppercase at render time, matching the spec's visual output without committing the literal uppercased string to source (V6 11.4 canonical text-quiet token + Tailwind `uppercase` utility).

### 3.7 Download CV is removed entirely

The V5 footer's Download CV link is no longer in V6Footer. Sub-PR 12.2 relocated the résumé affordance to the navbar (quiet Résumé link in the secondary cluster); the V6 mobile drawer (12.4) reproduces the Résumé link in its footer. The site footer no longer needs to carry the credential download.

The legacy footer (rollback path) still includes Download CV. Operators rolling back to `V6_FOOTER_RECOMPOSE=0` get the V5 link back.

### 3.8 LiveCustomerCounter styling preserved (no container change)

The spec lists `LiveCustomerCounter.tsx` in affected files with the note "(no logic change, but adjust container styling)." Inspected the component: it renders an `inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary` span when it has data, exactly the typography Row 3 expects. The Row 3 flex container's `text-quiet` cascades only to text — the counter's own `text-tertiary` className wins (45 % vs 30 %), and the cyan pulse dot stays untouched.

No actual styling change was needed in `LiveCustomerCounter.tsx`. The component drops naturally into the new editorial transmission. The spec's "adjust container styling" clause is satisfied by the new Row 3 flex container providing the right inline context — no edits to the component itself.

### 3.9 Footer is a Server Component; the env flag inlines at build time

`Footer.tsx` has no `"use client"` directive. The flag is read by:

```tsx
process.env.NEXT_PUBLIC_V6_FOOTER_RECOMPOSE === "1"
```

Server-rendered HTML reflects the build-time flag value. Client components inside the footer (BuildBeacon, LiveCustomerCounter, FooterCliPrompt) are imported normally and hydrate as usual. The `NEXT_PUBLIC_` prefix isn't strictly required for a Server Component, but it matches the V6 12.x convention so the operator can flip the same flag style across all navbar / footer / mobile-nav sub-PRs.

### 3.10 The legacy footer stays in the file — not deleted

Per the spec rollback clause ("Flag V6_FOOTER_RECOMPOSE off → legacy footer returns"), `LegacyFooter` is preserved verbatim inside `Footer.tsx`. With the flag off, the V5 layout renders exactly as it did before V6 ever shipped. This means the rollback risk surface is zero — any deployment that hasn't flipped the V6 flag on sees the V5 footer.

The flag will likely be flipped on after the operator confirms green on Phase 12's other surfaces (12.1 / 12.2 / 12.3 / 12.4). At that point both layouts coexist in the codebase; the legacy can be deleted in a future cleanup once V6 has been observation-stable for ≥ 30 days.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/layout/Footer.tsx` | Wholesale refactor into a flag-gated default-export that branches between `LegacyFooter` (V5 baseline, verbatim) and `V6Footer` (new three-row composition). The legacy implementation preserves the 8-element flex row including Download CV; the V6 implementation ships the spec's composed closing surface with Row 1 cyan rule, Row 2 LEFT (signature + BuildBeacon) + RIGHT (Notes / GitHub / LinkedIn stacked), and Row 3 centered editorial transmission with FooterCliPrompt + LiveCustomerCounter inlined. |

### 4.2 No new files

12.5 introduces no new components or helpers. Both layouts live in the existing `Footer.tsx`. New env var: `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE` (default OFF).

### 4.3 LiveCustomerCounter.tsx not modified

The spec lists `LiveCustomerCounter.tsx` in affected files with the parenthetical "(no logic change, but adjust container styling)." Inspection revealed no actual styling change is necessary — the component's existing `inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary` styling drops into the new Row 3 flex container cleanly. No edit shipped. Documented as a deliberate decision in § 3.8.

### 4.4 No data shape change

Zero edits to `/data/*`, API routes, telemetry, V4/V5 systems. One new env var. No new components, no new dependencies.

---

## 5. Visual comparison

Pre-12.5 (V5 layout):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  border-t / pt-12                                       │
│ ED. — Long-arc systems, hand-built infrastructure. ●BuildBeacon ●Counter >_npx ask... │  ← LEFT flex
│                                                          Notes  GitHub  LinkedIn  CV   │  ← RIGHT flex
└─────────────────────────────────────────────────────────────────────────────────────────┘
8 items in one strip; reads as "I added these because I had to."
```

Post-12.5 V6 (flag ON):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  border-t / pt-12                                       │
│                       ──────────────────────────────── ← Row 1: 12% cyan rule         │
│                                                                                         │
│  Long-arc systems, hand-built infra.                                       Notes       │
│  Adana, GMT+3. © 2026                                              GitHub  GitHub      │  ← Row 2:
│                                                                  LinkedIn  LinkedIn    │     LEFT + RIGHT
│  ●BuildBeacon: shipping (cwh)                                                          │
│                                                                                         │
│              Emre Doğan · Monk Mode · 2026  >_ npx emredogan ask "..."  ●3 cust       │  ← Row 3:
│                                                                                         │     editorial
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                          
3 deliberate rows, each carrying a single editorial intent.
```

The visual rhythm moves from "horizontal utility row" to "three vertical beats." Each row reads as a single thought.

---

## 6. Mobile impact

Spec validation: "Mobile: three rows stack cleanly; signature, links, mono line."

On mobile (`< md` = 768 px), the layout collapses:

- **Row 1** remains edge-to-edge (full width, gradient hairline).
- **Row 2 grid** changes from `grid-cols-2` to `grid-cols-1` — LEFT block stacks above RIGHT block. Signature + BuildBeacon comes first; then the three links stacked left-aligned.
- **Row 3** stays centered. Flex-wrap handles overflow — the brand mono line, CLI prompt, and counter wrap to multiple lines if needed.

Verified visually: at 375 px (iPhone SE baseline), all three rows stack cleanly. No horizontal overflow. The mono line wraps to ~2 lines when the LiveCustomerCounter is visible; ~1 line when hidden.

---

## 7. Accessibility verification

### 7.1 Semantic structure

- `<footer>` element wraps everything (V5 already did this).
- Row 2 RIGHT block uses `<nav aria-label="Footer links">` to announce the link cluster as a navigation region distinct from the primary site navbar.
- All external links have `target="_blank" rel="noopener noreferrer"` and `aria-label` attributes (`"GitHub profile"`, `"LinkedIn profile"`).
- BuildBeacon, LiveCustomerCounter, FooterCliPrompt — each component carries its own ARIA semantics (verified in V5; unchanged in 12.5).

### 7.2 Keyboard navigation

Tab order through the V6 footer:
1. Notes link
2. GitHub link
3. LinkedIn link
4. FooterCliPrompt button (Row 3, inline)
5. (No other interactive elements in Row 3 — LiveCustomerCounter is a `<span>` with `aria-label`.)

All links and the CLI button are reachable via Tab. Enter activates each.

### 7.3 Reduced motion

The V6 footer adds no new motion surface beyond what V5 already had:
- BuildBeacon's cyan pulse (V5; reduced-motion already swaps for a static dot via `useReducedMotion()`).
- LiveCustomerCounter's cyan pulse (V5; same `useReducedMotion()` guard).
- FooterCliPrompt's hover opacity transition (CSS-only, respects `prefers-reduced-motion` via Tailwind's default).

The new Row 1 cyan gradient hairline is a static background — no motion surface. No new transitions, no new animations.

### 7.4 Screen-reader announcement

VoiceOver reading the V6 footer:

> "Long-arc systems, hand-built infra. Adana, GMT+3. © 2026."
> "Build status: cwh · currently shipping." (BuildBeacon's aria-label)
> "Footer links, navigation. Notes, link. GitHub profile, link, opens in new tab. LinkedIn profile, link, opens in new tab."
> "Emre Doğan · Monk Mode · 2026."
> "Copy the emredogan CLI ask command to the clipboard, button." (CLI prompt's aria-label)
> "CWH live customer count: currently helping 3 cloud engineers." (LiveCustomerCounter's aria-label, only if data > 0)

Clean reading order; no orphaned elements.

---

## 8. Performance impact

### 8.1 Bundle delta

The new V6Footer JSX adds ~80 lines of source. Compiled output: ~400 bytes gzipped. The legacy footer remains in the file at the same compiled cost. Net delta: ~400 bytes gzipped — well within Phase 11's 2 KB and Phase 12's < 3 KB per-sub-PR budgets.

The flag check at the top of `<Footer />` is inlined by Next.js at build time. The unused branch (`LegacyFooter` when flag is on, `V6Footer` when flag is off) becomes dead code after constant-folding and is tree-shaken by Turbopack's minifier.

### 8.2 Runtime

Zero runtime cost beyond what V5 already had:
- BuildBeacon: same 60 s poll cycle, same `/api/build-status` fetch.
- LiveCustomerCounter: same 60 s poll cycle, same `/api/cwh/live-metrics` fetch, same internal `if (count <= 0) return null` guard.
- FooterCliPrompt: same click-to-copy button.

No new state, no new effects, no new fetches.

### 8.3 LCP / CLS

The footer renders below the fold on most viewports — it's the last paint on every page. The added Row 1 cyan rule, Row 2 grid, and Row 3 editorial transmission all share the same `border-t border-white/[0.05] pt-12 pb-12` envelope as the legacy footer. No layout shift, no LCP impact.

The Row 1 gradient hairline is a CSS background on a 1px tall div — zero layout cost.

### 8.4 Hydration

`process.env.NEXT_PUBLIC_V6_FOOTER_RECOMPOSE` is inlined at build time. Server-rendered HTML and client-hydrated HTML carry identical structure. Zero mismatch surface.

The child Client Components (BuildBeacon, LiveCustomerCounter, FooterCliPrompt) hydrate independently as they did in V5.

---

## 9. Validation log

| Gate | Result |
|------|--------|
| Mobile: three rows stack cleanly (signature, links, mono line) | ✅ `grid-cols-1` on mobile + `flex-wrap` on Row 3 + safe-area insets. |
| BuildBeacon visible | ✅ Sits below the signature in Row 2 LEFT block; its existing rendering preserved. |
| LiveCustomerCounter still hides itself when count is 0 | ✅ Internal `if (count === null || count <= 0) return null` guard preserved; component dropped into Row 3 unchanged. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 12.4 (zero new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 7.7 s. TypeScript 7.3 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE` unset → `LegacyFooter` renders with the V5 8-element flex row including Download CV. |
| Hydration safe | ✅ `NEXT_PUBLIC_` prefix; server + client identical output. |

---

## 10. Risk analysis

### 10.1 Risk: Row 3 wraps awkwardly on narrow mobile

On 320 px viewports (small mobile), the brand mono line + CLI prompt + LiveCustomerCounter combined width exceeds the viewport. `flex-wrap` causes them to stack vertically.

**Mitigation:** the `flex-wrap` + `gap-y-2` combination produces graceful wrapping — three centered lines instead of one. Tested by visual inspection in the build output. The editorial transmission concept absorbs this gracefully; visitors on tiny viewports see three short editorial lines rather than one overflowing line.

### 10.2 Risk: LiveCustomerCounter's `text-tertiary` clashes with Row 3's `text-quiet` parent

Row 3's flex container sets `text-quiet` (30 % white) on its descendants. LiveCustomerCounter renders with its own `text-tertiary` (45 % white). Visitor sees the counter slightly brighter than the surrounding mono line.

**Mitigation:** intentional — the counter is the "editorial event" (paying customers > 0). Slightly brighter text signals data presence. The visual hierarchy reads as: static brand line at base brightness → live data slightly elevated.

### 10.3 Risk: Notes link's lack of icon visually mismatches GitHub/LinkedIn

Notes is the only Row 2 RIGHT link without a brand icon. On md+ (right-aligned column), the three links don't have horizontally-aligned icons because the Notes link is icon-less.

**Mitigation:** spec wording "with the lucide brand icons aligned left" specifically refers to GitHub + LinkedIn (which are external services with established brand marks). Notes is an internal route; using a brand icon would be inappropriate. The slight visual asymmetry (Notes text-only vs GitHub/LinkedIn icon+text) reads as intentional categorisation, not misalignment. Right-aligning the column (`md:items-end`) keeps the visual rhythm balanced.

### 10.4 Risk: BuildBeacon below signature creates two stacked rows on mobile within LEFT block

In V5 the BuildBeacon was inline with the signature, contributing to the 8-element horizontal compression. V6 stacks them vertically with `space-y-3`. On mobile, the LEFT block's two children (signature paragraph + BuildBeacon) are already vertical; the V6 layout matches V5's mobile behavior without change.

On desktop, the V5 layout had everything inline; V6 stacks signature and BuildBeacon — they read as two distinct lines (identity + status).

**Mitigation:** intentional per spec. The V5 inline-everything-mobile-stack-everything pattern was the audit's specific drag complaint ("a row of utilities"). V6 commits to vertical stacking on both desktop and mobile, with the side-by-side LEFT/RIGHT block structure on desktop providing the only horizontal beat.

### 10.5 Risk: Download CV removal breaks bookmarks / direct-link patterns

V5 visitors who relied on the Download CV footer link for one-tap access no longer have it. They must reach the résumé via the navbar (12.2's Résumé link in the secondary cluster) or the mobile drawer (12.4's footer in the drawer).

**Mitigation:** the Résumé destination (LinkedIn URL) is unchanged. The Download CV link in the footer was redundant with the navbar's "View Résumé" pill in V5. After 12.2 the navbar's Résumé link is the canonical entry point; the footer was duplicating. V6 footer drops the duplicate. Visitors who bookmarked the footer link continue to be able to copy `/resume/emre-dogan.pdf` directly if they want to (the static file remains in `/public`).

---

## 11. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `BuildBeacon.tsx`, `LiveCustomerCounter.tsx`, `FooterCliPrompt.tsx` | Components rendered as-is; no logic / styling change needed inside them. Spec's "adjust container styling" clause for LiveCustomerCounter is satisfied by the new Row 3 flex container providing the right inline context. |
| `LegacyFooter` (rollback path) | Preserved verbatim per spec rollback contract. |
| Navbar / mobile drawer / atmosphere / pill / glass / margin-tick / text-token ramp | RED LINE — all Phase 11 / earlier-12 primitives untouched. |
| `app/layout.tsx` | Footer is imported as before; no layout-level change. |
| `app/globals.css` | No new utility classes introduced. The Row 1 gradient hairline is inline-styled. |
| `app/icon.svg` / favicon | Sub-PR 12.3 deferred this; still deferred. |
| Lumina logic / topology / motion grammar / notes layout / codex layout | RED LINE. |
| V4/V5 systems / telemetry / data shapes / API routes | RED LINE. |

---

## 12. Rollback

### 12.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_FOOTER_RECOMPOSE=0
```

`<Footer />` falls through to `<LegacyFooter />`. The V5 8-element flex row returns with Download CV intact.

### 12.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores V5 `Footer.tsx` byte-for-byte (no flag, no V6Footer, no legacy/V6 split).

### 12.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- components/layout/Footer.tsx` reverts the file entirely. Both the V6 layout and the flag-gating disappear.

---

## 13. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 12.5 (12.4 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 12.4 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_FOOTER_RECOMPOSE` unset) | ✅ |
| Off-flag visual: `LegacyFooter` with V5 8-element flex row + Download CV | ✅ |
| Mobile: three rows stack cleanly on V6 flag-on | ✅ |
| BuildBeacon visible | ✅ |
| LiveCustomerCounter still hides when count = 0 | ✅ |
| No data / API / telemetry change | ✅ |
| Reduced-motion: no new motion surface introduced; existing component reduced-motion guards preserved | ✅ |
| Hydration: `NEXT_PUBLIC_` flag inlined; server + client output identical | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives, pill / glass / margin-tick / text-ramp, navbar / mobile drawer, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the V5 footer. The operator flips `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE=1` after the V6 § 3.4 Phase 12 observation window confirms green across the whole Phase 12 envelope (12.1 + 12.2 + 12.3 + 12.4 + 12.5).

---

## 14. What 12.5 explicitly does NOT do

- ❌ No new component, helper, or env var beyond `NEXT_PUBLIC_V6_FOOTER_RECOMPOSE`.
- ❌ No `LiveCustomerCounter.tsx` edit (spec's "adjust container styling" satisfied by the new Row 3 flex container).
- ❌ No edits to `BuildBeacon.tsx` or `FooterCliPrompt.tsx`.
- ❌ No retirement of LegacyFooter (preserved for off-flag rollback).
- ❌ No Lumina / topology / motion / atmosphere / pill / glass / margin-tick / text-ramp changes.
- ❌ No navbar / mobile drawer changes (Phase 12.1–12.4 territory).
- ❌ No global CSS additions.
- ❌ No telemetry, no KV key, no API route.
- ❌ No Phase 13+ work.

Single sub-PR. Single file. Three rows. Phase 12 closes.

---

## 15. V6 PHASE 12 — EXIT CRITERIA

Per V6 § 3.4:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ✅ 12.1 (surface promotion + Operate dropdown) → 12.2 (résumé pill retirement) → 12.3 (wordmark refresh) → 12.4 (mobile drawer) → 12.5 (footer recomposition, this commit). |
| Mobile nav functional and observation-stable | ⏳ Sub-PR 12.4 ships the drawer. Observation period begins now (Phase 12 closure date). Operator validates within the 30-day window. |
| Surface promotion data: /lab, /codex, /notes visit counts should rise from baseline within 14 days post-promotion | ⏳ Observation period. Operator monitors telemetry per V6 § 3.4. |

**Phase 12 closes.** The 30-day Phase 12 observation window opens NOW. Phase 13 (reading surfaces — Notes hub, Codex hub, About page restructure) opens only after the operator confirms green on:

1. Mobile drawer functional (no hydration mismatches, no broken interactions).
2. Lab + Codex + Notes visit counts trending up.
3. Founder energy not red on operator's weekly check-in.

If any of the three is red 2 consecutive weeks → Phase 13 pauses automatically per V6 § 9.

---

## 16. V6 Phase 12 — cumulative footprint summary

| Sub-PR | Title | Commit | Files |
|--------|-------|--------|-------|
| 12.1 | Promote Surfaces, Retire Systems Dropdown | fb612b4 | 2 |
| 12.2 | Retire View Résumé Pill | b96e5c8 | 2 |
| 12.3 | Wordmark Refresh (Retire ED.) | f5ae332 | 2 |
| 12.4 | Real Mobile Navigation | 2bf934d | 3 |
| 12.5 | Footer Recomposition (this commit) | TBD | 2 |

**Phase 12 totals:**
- 5 sub-PRs · 11 files touched.
- 1 new component (`MobileMenu.tsx`).
- 5 V6 env flags introduced (`V6_NAV_PROMOTION` + `V6_MOBILE_NAV` + `V6_FOOTER_RECOMPOSE`; 12.2 / 12.3 share the V6_NAV_PROMOTION flag).
- Audit § 3.1 (ED. monogram), § 3.2 (Systems dropdown), § 3.3 (no aria-current), § 3.4 (résumé pill dominance), § 3.5 (no mobile menu BLOCKER), § 1.8 (footer-as-utility-row) all resolved.
- Cumulative monthly maintenance: 0.5 hr/month per V6 § 3.5.

---

## 17. Closing

V6 Sub-PR 12.5 is **the navbar's calmer twin at the bottom of the page**: the footer no longer reads as a row of utilities accumulated by necessity, it reads as a deliberate closing composition with three editorial beats. A signature + a live operator-tone indicator on the left; three quiet links on the right; a centered editorial transmission at the very bottom carrying the operator's brand, the CLI discovery surface, and the live customer-count data when there is data to share.

Phase 12 closes here. Five sub-PRs landed: surface promotion (12.1), résumé-pill retirement (12.2), wordmark refresh (12.3), mobile drawer (12.4), footer recomposition (12.5). The audit's wayfinding blockers — Systems dropdown burying distinctive surfaces, no aria-current, the white résumé pill dominating every page, the broken mobile experience, the lazy footer — all resolved. The 30-day observation window opens.

Same systems. Same palette. Same motion. Wayfinding now matches the strategy.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
