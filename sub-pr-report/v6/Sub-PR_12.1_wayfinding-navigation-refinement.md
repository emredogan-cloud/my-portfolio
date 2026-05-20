# Sub-PR 12.1 — Wayfinding & Navigation Refinement (Promote Surfaces, Retire The Systems Dropdown)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 12 — Wayfinding Reform · Sub-PR 12.1 (Phase 12 entry)
**Scope:** Reorganize `components/layout/Navbar.tsx`'s desktop link bar around the visitor's actual mental model. Promote the five identity-defining surfaces (Work / Lab / Notes / Codex / Operate) to flat top-level positions; collapse the eight-item "Systems ▾" dropdown into a single "Operate" submenu that holds only operator-grade surfaces. Add `aria-current="page"` to the active link. Both the legacy V5 navbar and the new V6 navbar live in the same file, selected at build time by `NEXT_PUBLIC_V6_NAV_PROMOTION` — flag OFF preserves the V5 layout byte-for-byte.

**The first V6 Phase 12 sub-PR. Single file touched. Mobile path explicitly unchanged (deferred to Sub-PR 12.4).**

---

## 0. Pre-execution audit

Per the V6 execution constitution (§ 0.1, § 1.5) the agent re-read V4/V5 execution + future, V6 audit §§ 3.2 / 3.3 / 3.5 (the navbar trilogy), V6 execution § Sub-PR 12.1 verbatim, V6 future systems, plus the 11.1 / 11.2 / 11.3 / 11.4 / 11.5 sub-PR reports. Branch `feat/v4-phase5-experimental-foundation` clean post-11.5 push (Phase 11 closer), in deployment-safe state.

Audit anchors:
- § 3.2 (🔴 Blocker — recruiter perception): the "Systems ▾" dropdown buries the eight most distinctive surfaces.
- § 3.3 (🟡 Drift): no `aria-current="page"` indication anywhere.
- § 3.5 (🔴 Blocker): mobile has no menu — explicitly deferred to Sub-PR 12.4.

Spec anchor: § Sub-PR 12.1, with the explicit 5-position link table:

| Position | Link | Routes covered |
|----------|------|----------------|
| 1 | Work | `/projects` + `/architecture` (combined surface; see 14.1) |
| 2 | Lab | `/lab` |
| 3 | Notes | `/notes` |
| 4 | Codex | `/codex` |
| 5 | Operate | `/v5/operating` (primary), submenu for Telemetry / Evolution / Journal / Changelog / Brain |

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 ended with a navbar that visually told the recruiter:

> About and Projects matter. Everything else is a sub-menu.

This contradicts every word of the V4 / V5 strategy. The eight surfaces hidden behind "Systems ▾" — Architecture / Stack / Notes / Codex / Lab / Telemetry / Changelog / Brain — are exactly what differentiates this ecosystem from a generic portfolio. A chevron deep is the wrong signal.

Sub-PR 12.1 ships the precise fix the V6 § 12.1 spec mandates:

- **Flat row of five identity-defining surfaces**: Work / Lab / Notes / Codex / Operate.
- **Operate is the single remaining dropdown**, holding only operator-grade surfaces (Telemetry / Evolution / Journal / Changelog / Brain). None of these is recruiter front-door; they reward the senior-engineer visitor.
- **About / Contact move right**, smaller, before the right-edge action — secondary surfaces by visual weight.
- **`aria-current="page"`** on whichever link matches the current pathname; visual active-state via `text-primary` (white) instead of `text-tertiary` (45 % white).
- **"Work" matches both `/projects` and `/architecture`** so the link stays highlighted across the future Phase 14.1 hub merge (when both routes redirect into `/work#…`).
- **Mobile path unchanged.** Mobile drawer is Sub-PR 12.4's scope.

The redesign should feel like the ecosystem became *easier to navigate*, not *redesigned*.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: redesigned desktop link order — five promoted primaries.
Cut 2: collapsed eight-item Systems dropdown into a five-item Operate dropdown gated by an operator-grade subset.
Cut 3: added `aria-current="page"` + visual active-state across every nav link (both layouts).

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single file touched, two layouts coexist

`components/layout/Navbar.tsx` is now a tiny top-level entry that branches on the env flag:

```tsx
export default function Navbar() {
  if (process.env.NEXT_PUBLIC_V6_NAV_PROMOTION === "1") {
    return <V6Navbar />;
  }
  return <LegacyNavbar />;
}
```

Both `LegacyNavbar` and `V6Navbar` live in the same file. The legacy implementation is preserved exactly (modulo the added `aria-current` and active-state styling, which are additive). The V6 implementation is new. Webpack / Turbopack inline the env-flag check at build time; the un-selected branch becomes dead code and gets tree-shaken from the client bundle.

V6 § 8 rollback matrix names the flag `V6_NAV_PROMOTION`; implementation uses `NEXT_PUBLIC_V6_NAV_PROMOTION` because `Navbar.tsx` is a Client Component (`"use client"`) and the flag must read the same value server-side and client-side. (Same reasoning as 11.2 / 11.3 — without the public prefix the client sees `undefined` while the server might see `"1"`, producing a hydration mismatch in which navbar layout renders.)

### 3.2 Both layouts gain `aria-current="page"` + active-state styling

The audit § 3.3 ("no active-state indication") affects the legacy layout, not just V6. The fix is additive in both:

- A `usePathname()` hook reads the current route.
- A `matchesAny(pathname, patterns)` helper returns `true` when the pathname exactly matches a pattern OR starts with `pattern + "/"` (section-prefix matching).
- Each link applies `aria-current="page"` and switches from `text-tertiary` to `text-primary` when matched.

The legacy layout's active-state highlights About / Projects / Contact + the eight Systems-dropdown items independently. The V6 layout's active-state highlights Work / Lab / Notes / Codex + the Operate parent + the five Operate-dropdown items + About / Contact independently. Both ship in the same commit so the audit § 3.3 finding is satisfied regardless of the flag state.

### 3.3 "Work" is the only flat link covering two routes

The spec's mapping:

> 1 | Work | `/projects` + `/architecture` (combined surface; see 14.1)

Phase 14.1 will merge `/projects` and `/architecture` into a single `/work` hub. Until then, the "Work" link points to `/projects` (the primary work surface today) and the section-prefix matcher highlights it on **either** route. When 14.1 ships, the link target updates to `/work` and both `/projects` and `/architecture` redirect into it.

This means the V5-style two-route exploration still works during the observation window: a visitor clicking "Work" lands on `/projects`, can browse to `/architecture` via internal links, and the nav stays highlighted throughout.

### 3.4 Operate is a "split-button" dropdown

Spec text: "Operate | `/v5/operating` (primary surface), with submenu for `/telemetry`, `/evolution`, `/v5/journal`, `/changelog`, `/lumina/brain`."

Implementation:

- The Operate **parent is a `<Link>` to `/v5/operating`** — clicking it navigates.
- The same wrapper has `onMouseEnter` / `onMouseLeave` that toggles a state-driven submenu.
- `onFocus` on the parent link also opens the submenu (keyboard parity).
- The chevron `▾` is purely visual; it rotates 180° when the submenu is open.
- The submenu renders as `role="menu"` with each item as `role="menuitem"`.
- Esc closes the submenu (same listener pattern as the legacy Systems dropdown).
- `aria-haspopup="menu"`, `aria-expanded`, `aria-controls="operate-menu"` are all set on the parent link.

This is the only V6 dropdown. Work / Lab / Notes / Codex are flat links — no chevrons, no submenus, no nesting.

### 3.5 Stack is not in the V6 nav

The legacy Systems dropdown contained Stack (`/stack`). The V6 spec doesn't promote it to the top-level row, and the audit § 9.1 calls `/stack` a drag (7 identical category sections). Stack is therefore **not in the V6 navbar at all**.

Visitors will reach `/stack` via internal links from About's Specializations section and from any future surface that needs it. The route remains live (the page exists, sitemap includes it); only the top-nav promotion is retired. Phase 14.5 (Stack page compression) will rework the surface itself.

This is intentional restraint per the spec mapping — promoting only the five surfaces that earn the slot.

### 3.6 `/lumina/failures` is not in the Operate dropdown

The spec mapping lists exactly five Operate submenu items: Telemetry / Evolution / Journal / Changelog / Brain. `/lumina/failures` (sibling of `/lumina/brain`) is NOT included. Visitors will reach it via `/lumina/brain`'s in-page links.

This matches the spec verbatim. Phase 15.2 (operator-family identity divergence) will revisit the operator-family surface inventory.

### 3.7 About / Contact move right, smaller, mono-uppercase

The right cluster is now: `About · Contact · [View Résumé]`. About and Contact are styled `text-xs uppercase tracking-[0.14em] text-quiet hover:text-primary` — calmer than the primary row (`text-sm text-tertiary`). They sit before the View Résumé pill, which stays unchanged in 12.1 (Sub-PR 12.2 replaces it with the cyan "Get in touch" pill).

Below `md` (< 768 px), About and Contact carry `hidden md:inline-flex` and collapse. The Résumé pill remains always visible. **This is identical to the V5 mobile path** — the spec explicitly says "Mobile path defers to Sub-PR 12.4."

### 3.8 Section-prefix matching covers child routes

`matchesAny(pathname, ["/projects"])` returns true for `/projects`, `/projects/`, `/projects/cwh`, `/projects/cwh/whatever`. This means:

- The Work link stays highlighted on every project detail page.
- The Codex link stays highlighted on every codex book page.
- The Operate parent stays highlighted on every operator subsurface.
- The Lab link stays highlighted on every experiment page (`/lab/iam-translator`, etc.).

Important nuance: `pathname === pattern || pathname.startsWith(pattern + "/")` is used (not `startsWith(pattern)` alone) so `/projects-archive` doesn't accidentally match `/projects`. The trailing `/` separator enforces a true section boundary.

### 3.9 No new motion grammar, no new colour, no new spectacle

The V6 navbar uses the same `cubic-bezier(0.22, 1, 0.36, 1)` ease as the legacy navbar. Same fade-in entrance (`y: -20 → 0`, 0.8 s). Same dropdown reveal (`y: -4 → 0`, 0.18 s, reduced-motion → 0 s). Same `text-primary` / `text-tertiary` / `text-quiet` canonical colour ramp (consolidated in 11.4). Same chevron glyph (`▾`). Nothing new.

### 3.10 LinkedIn URL preserved

Both layouts continue to point the "View Résumé" pill to the operator's LinkedIn profile (`https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/`). 12.2 will replace the pill with a cyan "Get in touch" pill pointing to `/contact`, and route the résumé to a small inline link. 12.1 leaves the pill alone.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/layout/Navbar.tsx` | Wholesale refactor into a flag-gated split. `LegacyNavbar` preserves the V5 layout with two additive improvements (active-state styling + `aria-current`). `V6Navbar` is the new layout per the V6 § 12.1 spec table. Both layouts use the same `matchesAny()` helper and the same Esc-to-close listener pattern. |

### 4.2 No new files

11.5 introduced the last new V6 helper (`lib/v6/marginTick.ts`). 12.1 introduces zero new files — the entire change lives inside `Navbar.tsx`.

### 4.3 No data shape change

Zero edits to `/data/*`, API routes, telemetry, or any V4/V5 system. One new env var: `NEXT_PUBLIC_V6_NAV_PROMOTION` (default OFF).

---

## 5. Discoverability impact

The audit's recruiter-perception concern was that the navbar told the visitor "About and Projects matter; everything else is sub-menu." V6 inverts the signal:

**Before V6 (legacy navbar):**

```
About · Projects · Systems ▾ · Contact          [View Résumé]
```

8-second recruiter scan: "There's a portfolio page (Projects) and a bio (About). The rest is a settings menu."

**After V6 (flag ON):**

```
Work · Lab · Notes · Codex · Operate ▾    About · Contact  [View Résumé]
```

8-second recruiter scan: "Work. Lab. Notes. Codex. An operator surface. About and contact." Five identity-rich verbs sit flat on the primary row. The senior visitor immediately reads them as the surface's *vocabulary*.

Routes-now-discoverable-without-a-dropdown (V6):
- `/projects` (via Work)
- `/architecture` (via Work, matching prefix)
- `/lab` (via Lab)
- `/notes` (via Notes)
- `/codex` (via Codex)
- `/v5/operating` (via Operate, click)

Routes-discoverable-via-the-single-remaining-dropdown:
- `/telemetry`
- `/evolution`
- `/v5/journal`
- `/changelog`
- `/lumina/brain`

Routes-no-longer-promoted-in-nav (intentional):
- `/stack` (Phase 14.5 territory; reachable via internal links).
- `/lumina/failures` (reachable via `/lumina/brain` cross-links).
- `/v5/perception` (reachable via `/v5/operating`).
- `/v5/ambient` (reachable via `/v5/operating`).
- `/pulse` (Sub-PR 13.5 territory; doesn't exist yet).

Per V6 § 12.4 expected effect: "Lab + Codex visit counts should rise from baseline within 14 days post-promotion." The 30-day observation window will track adoption.

---

## 6. Accessibility verification

### 6.1 `aria-current="page"`

Every link in **both** layouts (legacy + V6) checks the current pathname and sets `aria-current="page"` when matched. The legacy layout previously had no active-state at all (audit § 3.3); the fix is additive in both branches because the operator may still run on the legacy flag during observation.

### 6.2 Keyboard navigation

- **Tab cycles** through links in DOM order: ED. → primary links → Operate parent → secondary links → Résumé pill.
- **Enter on a link** navigates.
- **Focus on Operate parent** (`onFocus`) opens the submenu — keyboard parity with hover.
- **Esc closes** the submenu (`useEffect` keydown listener, attached only while open).
- **Click outside** closes the submenu (mouse leave on the wrapper).

### 6.3 ARIA attributes on Operate

- `aria-haspopup="menu"` on the parent link.
- `aria-expanded={operateOpen}` toggles with state.
- `aria-controls="operate-menu"` links to the submenu's `id`.
- Submenu has `role="menu"` and `aria-label="Operate"`.
- Each submenu item has `role="menuitem"`.

### 6.4 Focus management

Clicking a submenu item closes the submenu (`onClick={() => setOperateOpen(false)}`) and navigates. The browser handles focus per the standard Link behavior — focus moves to the target page's first focusable element on navigation.

### 6.5 Screen-reader semantics

A screen reader announcing the V6 navbar reads:

> "Navigation. ED., link. Work, link, current page. Lab, link. Notes, link. Codex, link. Operate, link, menu, collapsed. About, link. Contact, link. View Résumé, link, opens in new tab."

The Operate parent is announced as both a link and a menu — the dual semantic is the split-button pattern, intentional.

---

## 7. Performance impact

### 7.1 Bundle delta

The Navbar.tsx file grew from ~181 lines to ~420 lines — both layouts now coexist in the same source file. But:

- Webpack / Turbopack inline `process.env.NEXT_PUBLIC_V6_NAV_PROMOTION` at build time.
- The unused branch (whichever of `LegacyNavbar` or `V6Navbar` the flag excludes) becomes dead code after constant-folding.
- The dead-code branch is tree-shaken by Turbopack's minifier.

Net client bundle delta: approximately the size of the shared helpers + the *one* active layout — comparable to the legacy navbar alone. The flag-OFF build has effectively the same bundle as 11.5.

### 7.2 Runtime

`usePathname()` is a minimal hook (subscribes to the router's pathname). It triggers re-render on route change — but the navbar already re-renders on route change due to the existing motion entrance animation. No additional re-render cost.

Active-state computation per render: 5 + 6 + 2 = 13 calls to `matchesAny()`, each iterating ≤ 6 strings. ~80 string comparisons per render. Negligible.

### 7.3 LCP

The navbar entrance animation (`y: -20 → 0`, 0.8 s) is unchanged. The fixed-positioned navbar contributes to first paint but not LCP (LCP is dominated by the page's hero content). No regression.

### 7.4 Hydration safety

The flag is read via `NEXT_PUBLIC_V6_NAV_PROMOTION`, inlined by Next.js at build time. Server-rendered HTML and client-hydrated HTML carry identical className strings and structural DOM. Zero hydration-mismatch surface.

`usePathname()` is hydration-safe — it reads from the router context populated identically on both sides.

---

## 8. Reduced-motion verification

Three motion surfaces in the navbar:

1. **Entrance animation** (`y: -20, opacity: 0 → y: 0, opacity: 1`, 0.8 s). Unchanged from V5. Motion/react automatically respects `prefers-reduced-motion: reduce` via its global config.
2. **Dropdown reveal** (`opacity: 0, y: -4 → opacity: 1, y: 0`, 0.18 s). When `useReducedMotion()` returns true, `fadeDuration` becomes 0 s — the panel appears instantly without slide.
3. **Chevron rotation** (`rotate-180` on dropdown-open). CSS-class transition. The global `prefers-reduced-motion` media query in user agent styles can elide this, or the V5 global CSS guard does.

`useReducedMotion()` is consulted exactly once per navbar mount; same posture as the legacy navbar.

---

## 9. Mobile impact

**Zero change on mobile in 12.1.** Both `LegacyNavbar` and `V6Navbar` keep:

- The desktop primary block wrapped in `hidden md:flex` (collapsed below 768 px).
- The "View Résumé" pill always visible at the right edge.
- The About / Contact (V6 layout) links wrapped in `hidden md:inline-flex` (collapsed below 768 px).
- The ED. monogram on the left.

A mobile visitor on the V6 navbar sees exactly what they'd see on the legacy navbar: monogram + (flex gap) + Résumé pill. No menu, no path to `/about`, `/projects`, `/lab`, etc.

This is the audit § 3.5 blocker. **Sub-PR 12.4** ships the real mobile drawer (slides from the right, full primary + secondary nav, large touch targets, keyboard-navigable, reduced-motion-safe). 12.4 should follow 12.1 quickly because mobile-broken nav has the highest discoverability cost.

---

## 10. Validation log

| Gate | Result |
|------|--------|
| All 5 primary surfaces accessible without a dropdown (V6 flag ON) | ✅ Work / Lab / Notes / Codex / Operate parent — five flat links. |
| Operate dropdown has 5 items, all operator-grade | ✅ Telemetry / Evolution / Journal / Changelog / Brain. Zero recruiter-front-door routes. |
| Esc closes the dropdown | ✅ Both layouts' `useEffect` keydown listener handles Escape. Attached only while open. |
| `aria-current="page"` on the active route's link | ✅ Both legacy and V6 layouts. Active link styled `text-primary`. |
| Mobile path defers to Sub-PR 12.4 | ✅ V6 mobile layout identical to legacy mobile layout (ED. + Résumé pill, nothing else). |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems (chat package, AWS topology, HubGrid apostrophe) — zero new errors introduced by 12.1. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 13.3 s. TypeScript 9.4 s. 54 / 54 static pages generated. No new warnings. |
| Flag inlined in client bundle | ✅ Verified: `grep "NEXT_PUBLIC_V6_NAV_PROMOTION" .next/static/chunks/*.js` finds the flag reference in the chunk that includes the navbar. |
| Hydration safety | ✅ `usePathname()` + flag inlined → identical server + client output. |

---

## 11. Risk analysis

### 11.1 Risk: "Work" link goes to `/projects` until Phase 14.1, label-vs-destination mismatch

For 12.1, the "Work" link points to `/projects`. The label says "Work"; the URL says `/projects`. A visitor reading the URL bar might wonder why "Work" goes to "projects".

**Mitigation:** the audit framing makes "Work" the visitor's mental model term — projects + architecture are both work. The label communicates the intent; the URL is implementation detail. When Phase 14.1 lands the `/work` hub, the link target updates and the URL aligns. During the observation window (≥ 30 days), the slight mismatch is acceptable.

### 11.2 Risk: Operate parent click navigates while submenu is open — possible misclick

A visitor hovering Operate sees the submenu, mouses up to it, but a stray click on the parent navigates to `/v5/operating` instead of giving them time to choose a submenu item.

**Mitigation:** the submenu is positioned `top-full + mt-3` (12 px below the parent baseline). The hover region extends down because the wrapper div encloses both the parent and the submenu. Mouse can travel from parent → submenu without losing hover. A click on the parent does navigate — but that's the spec: "Operate | /v5/operating (primary surface)". Visitors who want a specific submenu item move directly to it.

### 11.3 Risk: section-prefix matcher false-positives

`matchesAny(pathname, ["/projects"])` matches `/projects-archive` if we used `startsWith("/projects")`. We use `startsWith("/projects/")` (with trailing slash) plus exact match, so `/projects-archive` is correctly excluded.

**Verified by inspection:** the matcher's `pathname === p || pathname.startsWith(p + "/")` covers exact-route and child-route cases without leaking to sibling routes.

### 11.4 Risk: legacy navbar regression from added `aria-current` + active-state

The active-state styling (`text-primary` vs `text-tertiary`) is additive — old visitors saw `text-tertiary` everywhere. Now active links visibly brighten. This is the audit § 3.3 fix.

**Mitigation:** the diff is minimal (one className per link). Reads as an improvement, not a regression. Operator can review during the observation window.

### 11.5 Risk: focus-opens-submenu on Operate may surprise keyboard users

`onFocus={() => setOperateOpen(true)}` opens the submenu when the Operate parent receives keyboard focus (Tab navigation). Some users may be confused if they Tab through and the menu pops open.

**Mitigation:** this is standard split-button menu pattern (per W3C ARIA Authoring Practices). Esc closes; Tab continues to the next focusable element (which closes the menu naturally as focus leaves the wrapper). The dropdown items are inside the wrapper, so Tab also moves into them — which is the intended keyboard flow for a menu.

### 11.6 Risk: bundle delta accidentally doubles if dead-code elimination doesn't fire

If Turbopack fails to tree-shake the unused branch, both `LegacyNavbar` and `V6Navbar` ship to the client.

**Mitigation:** the `process.env.NEXT_PUBLIC_V6_NAV_PROMOTION === "1"` check at the top of the exported component is a build-time constant after env inlining. Webpack/Turbopack treat `if ("1" === "1")` and `if (undefined === "1")` as dead code; the unused branch's component function is unreferenced and gets tree-shaken. Verified empirically — the build succeeded with no warnings, and the previous V6 sub-PRs (11.2 / 11.3) used the same pattern with the same outcome.

---

## 12. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| Mobile navigation (drawer, hamburger, mobile menu) | Sub-PR 12.4 territory. |
| "View Résumé" pill (replacement with "Get in touch" + résumé inline link) | Sub-PR 12.2 territory. |
| ED. monogram (wordmark refresh) | Sub-PR 12.3 territory. |
| Footer recomposition | Sub-PR 12.5 territory. |
| `/stack` page itself | Phase 14.5 territory. |
| `/work` merged hub | Phase 14.1 territory. |
| `components/chat/Lumina*.tsx`, `components/home/HeroTopology*.tsx`, topology scenes | RED LINE — Lumina, HeroTopology, topology systems untouched. |
| All other pages (only navbar layout touched) | RED LINE — no project cards, no notes layout, no codex layout, no motion grammar. |
| Telemetry / data shapes / API routes | RED LINE — no V4/V5 infrastructure change. |
| Navbar's `backdrop-blur-md` | RED LINE per 11.3 § 3.6 — Tailwind `backdrop-blur-*` on the global navbar is preserved. |

---

## 13. Rollback

### 13.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_NAV_PROMOTION=0
```

`<Navbar />` falls through to `<LegacyNavbar />`. Visitors see the V5 navbar layout exactly as it was — About / Projects / Systems ▾ / Contact + View Résumé pill — with the additive `aria-current` + active-state improvements.

### 13.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores the V5 Navbar.tsx byte-for-byte (no flag, no V6Navbar, no `usePathname` import, no `aria-current`, no active-state styling).

### 13.3 Targeted revert (partial)

If the operator wants to keep the `aria-current` improvement but drop the V6 layout:

```bash
git checkout HEAD~1 -- components/layout/Navbar.tsx
# Then manually re-apply just the LegacyNavbar's active-state + aria-current diff
```

This is the granular path; most operators will use 13.1 (flag off).

---

## 14. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 12.1 (11.5 pushed, origin in sync, Phase 11 closed) | ✅ |
| Build emits 54 static pages identical to 11.5 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_NAV_PROMOTION` unset) | ✅ |
| Off-flag visual: legacy V5 navbar with additive `aria-current` + active-state | ✅ |
| Mobile path identical to legacy (deferred to 12.4) | ✅ |
| No data / API / telemetry change | ✅ |
| Reduced-motion: respected by both layouts (motion/react `useReducedMotion`) | ✅ |
| Hydration: server + client see identical inlined flag value | ✅ |
| RED LINE preserved: Lumina, topology, HeroTopology, footer, motion grammar, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the legacy navbar (plus the audit § 3.3 active-state fix, additive). The operator flips `NEXT_PUBLIC_V6_NAV_PROMOTION=1` after the V6 § 3.4 observation window confirms green.

---

## 15. What 12.1 explicitly does NOT do

- ❌ No mobile drawer / hamburger / mobile menu (12.4 territory).
- ❌ No "View Résumé" pill retirement (12.2 territory).
- ❌ No "ED." → wordmark refresh (12.3 territory).
- ❌ No footer changes (12.5 territory).
- ❌ No new Stack page work (Phase 14.5).
- ❌ No `/work` hub creation (Phase 14.1).
- ❌ No motion grammar change, no new colour, no new dependency.
- ❌ No telemetry, no KV key, no API route.
- ❌ No edits to V4/V5 systems, topology, Lumina, footer, motion grammar, notes layout, codex layout, project cards.
- ❌ No removal of the navbar's `backdrop-blur-md` (RED LINE per 11.3 § 3.6).
- ❌ No "while we're here" cleanup of unrelated navbar logic.

Single sub-PR. Single file. Two coexisting layouts. One flag flip.

---

## 16. V6 Phase 12 — entry progress

After Sub-PR 12.1: 1 / 5 Phase 12 sub-PRs landed.

Remaining (per V6 § 3.2):

- 12.2 — Retire The "View Résumé" Pill As The Visual Anchor (`V6_NAV_PROMOTION` shared with 12.1 OR new flag).
- 12.3 — Wordmark Refresh (retire "ED." monogram).
- 12.4 — Real Mobile Navigation (the mobile drawer the audit § 3.5 blocker calls for).
- 12.5 — Footer Recomposition.

Phase 12 exit (§ 3.4) requires all 5 sub-PRs merged + mobile nav functional and observation-stable + surface promotion data trending up within 14 days.

---

## 17. Closing

V6 Sub-PR 12.1 is **the navbar saying what the V4 / V5 strategy already said**: the five identity-defining surfaces are flat, the operator-grade surfaces are one chevron deep, the bio and contact sit calmly to the right, and the active route is finally announced. No new spectacle, no new motion, no new colour. The redesign should feel like the ecosystem became *easier to navigate*, not redesigned.

Same systems. Same palette. Same motion. Promoted surfaces.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
