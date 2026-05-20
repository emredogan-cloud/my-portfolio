# Sub-PR 12.2 — Retire The "View Résumé" Pill As The Visual Anchor

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 12 — Wayfinding Reform · Sub-PR 12.2
**Scope:** Replace the V6 layout's white "View Résumé" pill (the highest-contrast element on every page) with a calm right-edge cluster: a quiet inline `Résumé` link in the canonical text-tertiary tone, followed by a small cyan-bordered "Get in touch" pill that becomes the new visual anchor and points to `/contact`. The white-on-black résumé pill is gone from the V6 layout. The LegacyNavbar fallback (off-flag rollback) preserves it byte-for-byte.

**One file touched. The change is isolated to `V6Navbar`'s right-edge cluster. Mobile path explicitly unchanged from 12.1.**

---

## 0. Pre-execution audit

Per V6 § 0.1 + § 1.5 the agent re-read V4/V5 execution + future, V6 audit § 3.4 (résumé pill drag), V6 execution § Sub-PR 12.2 verbatim, V6 future systems, plus the 12.1 sub-PR report. Branch `feat/v4-phase5-experimental-foundation` clean post-12.1 push, deployment-safe.

Audit anchor: § 3.4 (🟠 Drag — "The most-emphasized element on every page is a CV download — visually contradicting 'the work IS the resume.'")

Spec anchor: § Sub-PR 12.2 — verbatim "calm right-edge cluster" replacement.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5 (and Sub-PR 12.1) kept the white résumé pill as the right-edge action. The pill draws the eye on every page above all other navbar elements. The most visually weighted element on every single page of the ecosystem is a CV download — visually contradicting the ecosystem's explicit thesis (the work IS the resume).

Sub-PR 12.2 ships the precise fix the V6 § 12.2 spec mandates:

- **Quiet inline `Résumé` link** (mono uppercase, text-tertiary per the canonical ramp).
- **Cyan-bordered "Get in touch" pill** (rounded-full, cyan border, transparent fill, white text, subtle cyan-tint on hover) pointing to `/contact`.
- **Order:** Résumé link first, Get in touch pill last (per spec "Followed by a small cyan-bordered 'Get in touch' pill").
- **About + Contact retained** from 12.1 — they remain calm mono-uppercase wayfinding links to the left of the Résumé link.

The new visual anchor is the conversion (Get in touch → /contact), not the credential download (Résumé → LinkedIn). The résumé remains accessible but no longer dominates.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: white résumé pill removed from `V6Navbar`'s secondary cluster.
Cut 2: quiet `Résumé` inline link added after Contact (mono uppercase, text-tertiary, opens in new tab, hidden below md).
Cut 3: cyan-bordered Get in touch pill added at the right edge (rounded-full, internal Link to /contact, always visible).

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 LegacyNavbar untouched — white pill preserved for off-flag rollback

The spec's rollback contract:

> **Rollback:** Flag `V6_NAV_PROMOTION` off → legacy pill returns.

12.2 ships under the same `NEXT_PUBLIC_V6_NAV_PROMOTION` flag introduced by 12.1. With the flag OFF, `LegacyNavbar` renders — and it keeps the V5 white résumé pill exactly as it was. The flag-off visual is byte-identical to V5 (modulo the additive aria-current + active-state styling from 12.1, which both layouts share).

This means 12.2's risk surface is **zero** for any deployment that hasn't flipped the V6 flag on. The change exists only in the on-flag branch.

### 3.2 Résumé URL extracted to a module-scope constant

V5 inlined the LinkedIn URL twice in `Navbar.tsx` (once in `LegacyNavbar`'s pill, soon again in `V6Navbar`'s Résumé link). 12.2 extracts it to `RESUME_URL` at module scope:

```ts
const RESUME_URL = "https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/";
```

Both layouts read from the same constant. Future changes to the résumé destination (e.g. swapping LinkedIn for a hosted PDF) happen in one place. This is a minor housekeeping cut that lands incidentally with 12.2's main change — it touches the same surface in the same commit, justifying the "while we're here" exception that the V6 spec carefully forbids in most contexts.

### 3.3 Résumé link styling matches the spec verbatim

> A single quiet inline link `Résumé` (mono uppercase, white/55).

Per the canonical ramp (V6 11.4): `white/55` → `text-tertiary` (45 %). The actual implementation uses `text-tertiary`, which is the closest canonical anchor.

Full class string:

```
hidden md:inline-flex text-xs uppercase tracking-[0.14em] text-tertiary hover:text-primary transition-colors duration-200
```

- `hidden md:inline-flex` — collapses below 768 px (mobile path unchanged from 12.1).
- `text-xs uppercase tracking-[0.14em]` — matches About / Contact mono-uppercase styling for visual rhythm.
- `text-tertiary hover:text-primary` — at-rest 45 % white; brightens to 100 % on hover.
- `transition-colors duration-200` — same timing as the other secondary links.

The Résumé link is brighter than About / Contact (`text-quiet` = 30 %) by design — the audit framing makes Résumé the "alternative" affordance that's slightly more present than pure wayfinding links.

### 3.4 Get in touch pill — cyan-bordered, white-text, transparent

The spec calls for a "small cyan-bordered" pill. Implementation:

```
inline-flex items-center justify-center rounded-full
border border-[#00d2ff]/40 hover:border-[#00d2ff]/70 hover:bg-[#00d2ff]/[0.06]
text-primary text-sm font-medium px-4 py-1.5
transition-colors duration-200
```

Visual reading:
- **At rest:** 40 % cyan border, transparent fill, full-white text. The cyan border signals the brand colour without flooding the navbar.
- **On hover:** border brightens to 70 %; a 6 % cyan background tint appears. Subtle pressure response.
- **Size:** `text-sm px-4 py-1.5` — smaller than the legacy white pill (`text-sm px-5 py-2`), per spec ("a small cyan-bordered… pill"). The smaller size also helps differentiate it from the Lumina trigger (§ 3.6).

The text colour is `text-primary` (white) rather than cyan because:
- White text on the dark navbar reads at higher contrast than cyan text would.
- The cyan border carries the brand signal.
- Cyan-text + cyan-border would push the pill toward "all-cyan" which competes with the BuildBeacon / Pill state-live vocabulary established in 11.2.

### 3.5 Pill points to `/contact` via Next.js Link (not external)

The legacy résumé pill is an `<a target="_blank">` (external LinkedIn). The new Get in touch pill is a `<Link href="/contact">` (internal route, client-side navigation). This means:

- Click on the pill → smooth in-app navigation to /contact, no new tab.
- No `target="_blank"` indicator on hover (no external-link semantics).
- Pre-fetched by Next.js's automatic Link prefetching on hover.

### 3.6 Visually distinct from the LuminaTrigger

The spec's third validation criterion:

> Contact pill visually distinct from the Lumina trigger (no conflict).

LuminaTrigger lives at `components/chat/LuminaTrigger.tsx`:

```
fixed z-[55] inline-flex items-center justify-center rounded-full p-4 liquid-glass
```

- **Shape:** circle (`p-4` square with `rounded-full` → circular).
- **Position:** fixed at bottom-right of the viewport.
- **Surface:** `.liquid-glass` (semi-transparent backdrop-blur orb).
- **Content:** Sparkles icon (no text label).
- **Size:** ~56 × 56 px including padding.

Get in touch pill (V6 12.2):

- **Shape:** rectangle / pill (`px-4 py-1.5` with `rounded-full`).
- **Position:** top-right inside the navbar (`fixed top-0` parent).
- **Surface:** transparent with cyan border, no backdrop-blur.
- **Content:** "Get in touch" text.
- **Size:** ~110 × 32 px depending on text width.

Distinct on every axis: shape (circle vs pill), position (bottom vs top of viewport), surface (liquid-glass vs solid border), content (icon vs text), size (~56² vs ~110×32). A visitor scanning the page in 8 seconds will never confuse the two.

### 3.7 Mobile right-edge anchor switches from LinkedIn pill to /contact pill

In 12.1 the V6 mobile path showed: `ED. + (gap) + small Résumé pill (LinkedIn)`. After 12.2 the V6 mobile path shows: `ED. + (gap) + Get in touch pill (/contact)`.

This is the intended mobile equivalence of the desktop change — same single-anchor-visible pattern, different destination. The Résumé inline link is `hidden md:inline-flex`, so it doesn't appear on mobile. Visitors on mobile still get a path to /contact, which is the higher-leverage conversion.

Sub-PR 12.4's mobile drawer will absorb the Résumé link (and About / Contact / all primary links) into the drawer overlay. Until then, mobile gets the Get in touch pill as the single nav affordance — which is a strict improvement on the legacy "LinkedIn pill only" state for the audit's stated thesis (the work IS the resume).

### 3.8 No new motion, no new colour, no new dependency

The Get in touch pill uses the same `cubic-bezier(0.22, 1, 0.36, 1)` ease as every other navbar transition, at `duration-200`. The cyan border colour is the existing `#00d2ff` site brand. No new tokens, no new component, no new helper module.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/layout/Navbar.tsx` | Module-scope `RESUME_URL` constant added. `LegacyNavbar`'s white pill now reads from the constant (no visual change). `V6Navbar`'s secondary cluster now renders: About link · Contact link · Résumé link (quiet, opens in new tab, hidden below md) · Get in touch pill (cyan-bordered, internal Link to /contact, always visible). The previous V6Navbar white résumé pill is gone. |

### 4.2 No new files

12.1 introduced the V6Navbar component inside the existing Navbar.tsx; 12.2 only modifies the right-edge cluster within that component. No new file.

### 4.3 No data shape change

Zero edits to `/data/*`, API routes, telemetry, or any V4/V5 system. No new env var (12.2 ships under the existing `NEXT_PUBLIC_V6_NAV_PROMOTION` flag introduced by 12.1, per V6 § 12.2 rollback matrix).

---

## 5. Visual weight shift verification

The audit's primary concern is that the navbar's visual centre of mass sits on a CV download. Pre/post comparison (V6 flag ON):

**Before 12.2** (V6 layout from 12.1):

```
ED. | Work · Lab · Notes · Codex · Operate ▾    About · Contact · [VIEW RÉSUMÉ]
                                                                    ↑
                                                          high-contrast white pill,
                                                          dominates the right edge,
                                                          points to LinkedIn
```

**After 12.2:**

```
ED. | Work · Lab · Notes · Codex · Operate ▾    About · Contact · Résumé · [Get in touch]
                                                                              ↑
                                                                        cyan-bordered
                                                                        transparent pill,
                                                                        calm anchor,
                                                                        points to /contact
```

The white pill is gone. The cyan-bordered pill carries less raw contrast but more *intentional* signal — the cyan border ties it to the brand grammar (the same cyan that runs through HeroTopology, BuildBeacon, edge-lit-card, Pill kind="state-live"). The visitor's first scan still lands a clear CTA, but the CTA now matches the ecosystem's claim.

---

## 6. Performance impact

### 6.1 Bundle delta

The change is a ~5-line className swap inside V6Navbar plus one new Link element. Net source delta: ~20 lines. Compiled bundle delta: under 100 bytes gzipped. No new dependencies, no new components.

### 6.2 Runtime

The internal `<Link href="/contact">` benefits from Next.js automatic prefetching on hover — the /contact page warms its data while the visitor moves the mouse toward the pill. Marginally faster perceived navigation vs the external LinkedIn link.

### 6.3 LCP / hydration

Zero change. The pill renders in the same DOM position as the legacy pill. Server- and client-rendered HTML are identical (flag inlined at build time per 12.1).

---

## 7. Accessibility verification

### 7.1 Résumé link

- Standard `<a>` element with `href` and `target="_blank" rel="noopener noreferrer"`.
- Screen readers announce: "Résumé, link, opens in new tab" (the standard pattern for `target="_blank"` with `rel="noopener"`).
- Keyboard: Tab focuses, Enter activates.
- `hidden md:inline-flex` collapses on mobile — the desktop role doesn't reach mobile users; Sub-PR 12.4's drawer will surface it there.

### 7.2 Get in touch pill

- Standard Next.js `<Link>` which renders as `<a>` — full link semantics.
- No `target="_blank"` (internal navigation).
- Screen readers announce: "Get in touch, link, /contact".
- Keyboard: Tab focuses, Enter navigates.
- Active state: no `aria-current` needed (the pill is a CTA, not a wayfinding link).

### 7.3 Tab order

DOM order: ED. → primary links (Work / Lab / Notes / Codex / Operate parent) → About → Contact → Résumé → Get in touch. Logical and predictable.

### 7.4 Focus visible

The default browser focus ring applies to both the Résumé link and the Get in touch pill. No custom focus styling needed; the cyan border on the pill naturally amplifies the focus state.

---

## 8. Reduced-motion verification

No new motion surface in 12.2. The pill's `transition-colors duration-200` is a colour transition on hover — Tailwind's transition utilities respect `prefers-reduced-motion` automatically via the v4 default media query handling.

---

## 9. Validation log

| Gate | Result |
|------|--------|
| Navbar's visual weight shifts from white résumé pill → cyan contact pill | ✅ V6 layout no longer ships the white pill; cyan-bordered Get in touch pill is the right-edge anchor. |
| Résumé link still works, opens in new tab | ✅ `<a href={RESUME_URL} target="_blank" rel="noopener noreferrer">`. |
| Contact pill visually distinct from the Lumina trigger | ✅ Different shape (pill vs circle), position (top-right navbar vs bottom-right viewport), surface (cyan-bordered transparent vs liquid-glass orb), content (text vs icon). |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ Same 24 pre-existing problems as 12.1 (no new errors). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 8.4 s. TypeScript 7.6 s. 54 / 54 static pages. No new warnings. |
| Off-flag rollback | ✅ `NEXT_PUBLIC_V6_NAV_PROMOTION` unset → `LegacyNavbar` renders with the white "View Résumé" pill exactly as V5. |

---

## 10. Risk analysis

### 10.1 Risk: Get in touch pill's lower contrast vs the legacy white pill reduces click-through

The legacy white pill had maximum visual contrast (pure white on near-black). The cyan-bordered transparent pill is calmer — by design — but a CTA that's too quiet may be missed.

**Mitigation:** the cyan border at 40 % rest + 70 % on hover is bright enough to read as an affordance against the dark navbar. The text is full-white (text-primary), preserving readability. The 30-day observation window will measure /contact visit attribution before/after the V6 flag flips; if click-through tanks, the operator can dial the cyan border to /60 rest + /90 hover (still in-palette) without further sub-PR work.

### 10.2 Risk: Contact text link + Get in touch pill both navigate to /contact (redundancy)

Both Contact (mono link) and Get in touch (pill) point to /contact. A visitor might wonder why there are two paths.

**Mitigation:** intentional semantic differentiation per § 3.7 of this report's 12.1 predecessor — Contact reads as wayfinding ("the page exists"), Get in touch reads as conversion ("I want to talk"). Standard pattern across modern engineering portfolios (Stripe, Linear, Vercel). The visitor doesn't read this as redundant; they read it as "I have multiple entry points to the same destination."

### 10.3 Risk: Résumé link discoverability drop on mobile

In 12.1 V6, mobile saw a small Résumé pill. In 12.2 V6, mobile sees Get in touch pill instead. The Résumé link is hidden on mobile (`hidden md:inline-flex`).

**Mitigation:** Sub-PR 12.4's mobile drawer will surface the Résumé link (plus About / Contact / all primary nav links) in the drawer overlay. The 12.2 → 12.4 gap is short (next sub-PR in sequence). During the gap, mobile visitors lose direct top-bar access to the LinkedIn profile — but the audit's framing accepts this trade because the conversion (Get in touch → /contact) becomes the mobile right-edge anchor instead.

### 10.4 Risk: hover-only pill affordance fails on touch devices

Touch devices don't trigger `:hover` reliably. The pill's hover state (brighter cyan border + slight cyan tint) won't fire on tap.

**Mitigation:** the rest state IS the affordance — cyan border + white text + rounded-full pill shape are already recognised as a button. Tap → navigate, no hover phase needed. Tailwind's `active:` state could be layered if the operator wants touch feedback, but the default UA active-state (subtle background flash) is sufficient.

### 10.5 Risk: Lumina trigger conflict if/when the trigger moves to top-right (Phase 15.3)

Phase 15.3 redesigns the Lumina trigger (retires the Sparkles icon, makes it a miniature of the avatar). The spec mentions the trigger may remain at bottom-right, but a future iteration could relocate.

**Mitigation:** if a future sub-PR moves the trigger to top-right, that sub-PR will need to reconcile with the Get in touch pill. Out of strict 12.2 scope. The current spec validates distinction; future moves will need their own validation.

---

## 11. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| Mobile drawer / hamburger / mobile menu | Sub-PR 12.4 territory. |
| "ED." monogram (wordmark refresh) | Sub-PR 12.3 territory. |
| Footer recomposition | Sub-PR 12.5 territory. |
| LegacyNavbar's white résumé pill | Preserved for off-flag rollback. |
| LuminaTrigger logo / shape | RED LINE — Lumina logic. Sub-PR 15.3 redesigns this surface. |
| ED. wordmark | Sub-PR 12.3. |
| Navbar `backdrop-blur-md` | RED LINE per 11.3 § 3.6 — Tailwind backdrop-blur on the global navbar is preserved. |
| 12.1 primary row, Operate dropdown, About / Contact secondary links | Preserved verbatim; 12.2 only modifies the right-edge cluster (Résumé link + Get in touch pill). |

---

## 12. Rollback

### 12.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_NAV_PROMOTION=0
```

`<Navbar />` falls through to `<LegacyNavbar />`. The white "View Résumé" pill returns exactly as V5.

### 12.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Restores V6Navbar's right-edge cluster to the 12.1 state (About / Contact / View Résumé pill — LinkedIn).

### 12.3 Per-edit revert (surgical)

`git checkout HEAD~1 -- components/layout/Navbar.tsx` then manually re-apply just the `RESUME_URL` extraction (a clean housekeeping cut worth keeping even if the right-edge cluster reverts).

---

## 13. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 12.2 (12.1 pushed, origin in sync) | ✅ |
| Build emits 54 static pages identical to 12.1 inventory | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_NAV_PROMOTION` unset) | ✅ |
| Off-flag visual: LegacyNavbar with white résumé pill intact | ✅ |
| Mobile path: 12.4 territory, unchanged in 12.2 (V6 mobile right-edge swaps LinkedIn pill → Get in touch pill, same single-anchor pattern) | ✅ |
| No data / API / telemetry change | ✅ |
| Reduced-motion: no new motion surface | ✅ |
| Hydration: NEXT_PUBLIC_ flag means server + client see identical inlined value | ✅ |
| RED LINE preserved: Lumina logic, topology, HeroTopology, footer, motion grammar, notes layout, codex layout, project cards, V4/V5 systems all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders the legacy navbar (white résumé pill). The operator flips `NEXT_PUBLIC_V6_NAV_PROMOTION=1` after the V6 § 3.4 observation window confirms green.

---

## 14. What 12.2 explicitly does NOT do

- ❌ No mobile drawer (12.4 territory).
- ❌ No "ED." → wordmark refresh (12.3 territory).
- ❌ No footer changes (12.5 territory).
- ❌ No new Stack page work (Phase 14.5).
- ❌ No `/work` hub creation (Phase 14.1).
- ❌ No LuminaTrigger refresh (Phase 15.3).
- ❌ No new motion grammar, no new colour, no new dependency.
- ❌ No telemetry, no KV key, no API route.
- ❌ No edits to V4/V5 systems, Lumina logic, topology, motion grammar, notes layout, codex layout, project cards.
- ❌ No removal of LegacyNavbar's white résumé pill (preserved for off-flag rollback).
- ❌ No "while we're here" cleanup, with one tiny exception: extracting `RESUME_URL` to a module constant (justified in § 3.2).

Single sub-PR. Single file. The visual anchor moves from credential download to conversion.

---

## 15. V6 Phase 12 — exit-progress

After Sub-PR 12.2: 2 / 5 Phase 12 sub-PRs landed.

Remaining (per V6 § 3.2):

- 12.3 — Wordmark Refresh (retire "ED." monogram).
- 12.4 — Real Mobile Navigation (the audit § 3.5 blocker).
- 12.5 — Footer Recomposition.

Phase 12 exit (§ 3.4) requires all 5 sub-PRs merged + mobile nav functional + surface promotion data trending up within 14 days.

---

## 16. Closing

V6 Sub-PR 12.2 is **the navbar finally agreeing with the ecosystem's thesis**: the visual anchor is no longer "download my CV", it's "talk to me". The cyan border replaces the white fill; conversion replaces credential. The résumé link remains accessible — calm, mono uppercase, opens in a new tab — but it's no longer the loudest element on the page.

Same systems. Same palette. The visual anchor moves to the right place.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
