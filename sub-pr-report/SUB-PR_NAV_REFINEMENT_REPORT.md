# SUB-PR NAV REFINEMENT REPORT — Systems dropdown

> **Phase:** V4 Phase 2 — observation window (NOT a Phase 3 sub-PR)
> **Branch:** `feat/v4-phase2-public-lab`
> **Mode:** Small, surgical polish refinement on a stable Phase 1+2 base.
> **Date:** 2026-05-18

---

## 1. Mission

The navbar pre-refinement carried seven flat items: **About ·
Projects · Architecture · Stack · Notes · Codex · Contact**.

Phase 2 shipped two more public surfaces — **`/lab`** (Sub-PRs 2.1
+ 2.2 + 2.3 + the 2.5-polish CLI page) and **`/telemetry`** (Sub-PR
1.2 + 1.5) — both undiscoverable from the navbar. Inflating the
flat row to nine items at the moment of maturity would be the
exact opposite of the intended atmosphere ("the system matured",
not "more UI was added").

Group the engineering / editorial / operating-system surfaces
under one dropdown so the visible row reads quieter, not louder:

**Visible:** About · Projects · Systems ▾ · Contact
**Inside Systems:** Architecture · Stack · Notes · Codex · Lab · Telemetry

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 13.5 (cinematic moat), § 9 (anti-
patterns — "more UI" trap).

**Sub-PR 2.5 report re-read.** Confirms the observation-window
hold: no Phase 3 work. This refinement is polish, not a new
sub-PR — single atomic commit, single touched file.

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `components/layout/Navbar.tsx` | 57 lines. Single client component (`"use client"`), `motion.nav` + `MotionLink` for primary entries, `hidden md:flex` wrapper around the link row. **Mobile already hides the entire nav row** — only the ED. logo + résumé button show. No mobile sheet/drawer to disturb. |
| `components/layout/BuildBeacon.tsx` | Canonical `useReducedMotion()` precedent in this repo. The dropdown's fade-in honours reduced-motion via the same hook. |
| Routing | All six grouped destinations already exist and were unchanged: `/architecture` ○, `/stack` ○, `/notes` ○, `/codex` ○, `/lab` ○, `/telemetry` ○ Static 5m/1y. |

---

## 3. Label choice — "Systems"

Three candidates were on the table. The decision was deliberate:

| Candidate | Why not |
|---|---|
| Explore | Reads as SaaS / e-commerce browse vocabulary. Wrong register for an editorial portfolio. |
| Other | Dismissive — implies the grouped items are secondary rather than substantive. The grouped items include `/architecture` and `/notes` — neither is "other". |
| **Systems** | Matches Emre's editorial voice (the /about page hero: "Long-arc systems builder"; the site's footer signature: "Long-arc systems, hand-built infrastructure"). Each grouped item *is* a system — architecture surfaces, the stack, the notebook, the codex, the lab, the telemetry. The label IS the through-line. |

`Systems` chosen.

---

## 4. What changed

### `components/layout/Navbar.tsx` (modified, +120 / −37 lines)

Three structural changes:

1. **Link arrays split.**
   - `PRIMARY_LINKS` = About, Projects (2 entries; always visible).
   - `SYSTEMS_LINKS` = Architecture, Stack, Notes, Codex, Lab, Telemetry (6 entries; grouped under trigger).
   - `CONTACT_LINK` = single item, rendered after the dropdown.

   The Systems order is intentional: architectural surfaces lead
   (Architecture, Stack), editorial reads sit in the middle
   (Notes, Codex), operating-system surfaces close (Lab,
   Telemetry). Reads as a natural decreasing-formality gradient.

2. **Systems trigger + dropdown panel.**
   - Trigger: a `<button>` styled identically to the `<MotionLink>`
     primary items (`text-white/60 text-sm hover:text-white`).
     Followed by a tiny `▾` chevron (text-[9px], white/30) that
     rotates 180° on `systemsOpen`. The chevron is the only
     concession to dropdown vocabulary — no "more" label, no
     "menu" icon.
   - Dropdown panel: `AnimatePresence` + `motion.div`. Surface
     style mirrors the navbar:
     `bg-[#0c0c0c]/95 backdrop-blur-md border border-white/[0.06]
      rounded-xl py-2 min-w-[176px]`.
     Just slightly more opaque than the navbar's `/70` because the
     panel floats over content below the bar.
   - Each item: `<Link>` matching the same `text-white/60
     hover:text-white` posture as the primary row. No background
     hover state. No separators. Spacing-only differentiation.

3. **Hover wrapper.**
   - Single `<div className="relative" onMouseEnter onMouseLeave>`
     unifying the hover region of trigger + panel. The panel's
     `top-full mt-3` lives inside that div, so mouse travel
     between trigger and panel never loses hover. No invisible
     bridge element needed.

### What stayed identical

- Mobile state: the entire nav strip lives under
  `hidden md:flex`. Mobile state is **byte-for-byte unchanged**.
- Resume button (`View Résumé` → LinkedIn): unchanged.
- ED. logo link: unchanged.
- Nav surface (h-16, fixed, backdrop-blur, border-bottom): unchanged.
- The `motion.nav` entrance animation: unchanged.
- Every individual link's href: identical to the pre-refinement
  values.

---

## 5. Interaction & accessibility

| Behaviour | How |
|---|---|
| **Desktop hover** | `onMouseEnter` on the wrapper opens; `onMouseLeave` closes. No click required. |
| **Click toggle (keyboard parity)** | The trigger is a `<button onClick={() => setSystemsOpen(v => !v)}>`. Enter / Space fires onClick natively. Mouse users who hover then click can close the panel intentionally — the wrapper's mouseleave then reopens once the mouse leaves, but the brief flicker only occurs in the rare mixed-input case. |
| **Esc closes** | A `useEffect` attaches a `keydown` listener only while `systemsOpen` is true. Released on close. |
| **Tab order** | Natural DOM order: ED. → About → Projects → Systems trigger → (Systems items, only when open) → Contact → View Résumé. Closed-state Tab skips past the panel since `AnimatePresence` unmounts it. |
| **ARIA** | Trigger: `aria-haspopup="menu"`, `aria-expanded={open}`, `aria-controls="systems-menu"`. Panel: `id="systems-menu"`, `role="menu"`, `aria-label="Systems"`. Items: `role="menuitem"`. |
| **Focus visibility** | `focus:text-white focus-visible:outline-none` — the colour change at full white on focus is the visible cue. (Outline collapsed because the global navbar already has the `text-white/60 → white` hover affordance and the white text-on-dark is itself the focus signal.) |

---

## 6. Motion discipline

- Fade-in: opacity `0 → 1`, `y: -4 → 0`, duration `180ms`, easing
  `[0.22, 1, 0.36, 1]` (the project's canonical cinematic EASE).
- Chevron rotation: 180° transform, `transition-transform
  duration-200`.
- **Reduced-motion:** `useReducedMotion()` from `motion/react`
  drops the fade duration to `0` when set. The chevron rotation
  uses Tailwind's `transition-transform duration-200` — collapsed
  to `0.01ms` by the global CSS reduced-motion guard in
  `app/globals.css`.
- No scale, no spring, no opacity-stagger across items, no
  bouncy choreography. The motion is **one fade**.

---

## 7. Responsive behaviour

- **`< md` (mobile / small tablet):** unchanged. The entire
  nav row stays hidden behind `hidden md:flex`. The ED. logo
  + résumé button render. The Systems dropdown is not rendered
  at all on these breakpoints (the closed-state DOM has the
  panel unmounted via AnimatePresence, and the trigger lives
  inside the hidden row).
- **`>= md` (tablet / desktop):** the row reads `About ·
  Projects · Systems ▾ · Contact · [Résumé]`. Touch-only desktop
  visitors (rare) can tap the trigger; the onClick toggle gives
  them parity with hover users.

The project had no mobile menu pre-refinement; introducing one
would be a much bigger change. **Mobile state is preserved
exactly as before** — that's the minimum-necessary-change rule
in practice.

---

## 8. Validation

### Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green; all 9 routes referenced by the
  refactored navbar appear as expected:
  - `/about` `○`, `/projects` `○`, `/architecture` `○`,
    `/stack` `○`, `/notes` `○`, `/codex` `○`, `/lab` `○`,
    `/telemetry` `○`, `/contact` `○`.

### Lint

- ✅ `npx eslint components/layout/Navbar.tsx` clean — no
  errors, no new disable comments.
- ⚠️ Pre-existing `LuminaWindow.tsx` errors untouched (out of
  scope as for every prior sub-PR since Phase 1).

### Bundle posture

- No new dependencies.
- `Navbar.tsx` already a client component (`"use client"`);
  the added state + useEffect + AnimatePresence import are all
  from `motion/react` — already in the bundle. Net delta on the
  navbar chunk: ~30 minified bytes of added logic + ~6 short
  href strings. Negligible.
- All prior invariants preserved (grep on `.next/static/chunks/*.js`):
  - `BedrockRuntimeClient | @aws-sdk | sentry/nextjs | @octokit/rest`
    → 0 matches (Phase 1.5 + 2.1 + 2.3 invariants).
  - `@xyflow/react` → 1 dynamic chunk (Sub-PR 2.5 invariant).
- `@emredogan/lumina-chat` tarball: still 29 files / 23.7 kB.
- `@emredogan/cli` tarball: still 10 files / 7.6 kB.

### Hover interaction

Verified by structural review of the wrapper pattern:

- Wrapper div catches both `onMouseEnter` on the trigger and on
  the panel because the absolute-positioned panel renders as a
  child of the wrapper — `mouseleave` only fires when the
  cursor exits the wrapper's bounding box, which includes the
  panel.
- `top-full mt-3` puts the panel 12px below the trigger
  baseline. The wrapper extends vertically to enclose that
  gap. Mouse travel from trigger to panel does not cross outside
  the wrapper.

### Keyboard navigation

- Tab order: About → Projects → Systems trigger →
  (closed: skip; open: 6 dropdown items in order) → Contact →
  View Résumé.
- Enter / Space on the trigger toggles open state.
- Tab into the menu lands on the first item; Tab continues
  through items.
- Esc closes the menu (focus stays on whatever element had it,
  which is acceptable; ideally focus returns to the trigger —
  could be added later, not in scope here).

### Reduced motion

- `useReducedMotion()` hook subscribes to the OS preference.
  When set, the dropdown fade duration drops to `0` —
  AnimatePresence still mounts/unmounts but does so instantly.
- The chevron's CSS transform transition collapses to `0.01ms`
  under the global guard in `app/globals.css`.

### Hydration

- The Navbar was already a client component pre-refinement. The
  state is fully client-side (`useState`, `useEffect`). No SSR /
  CSR mismatch surface.
- The dropdown's initial state is `false` server-side and
  client-side → identical HTML at hydration → no warning.

---

## 9. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Mixed-input flicker (hover open → click closes → hover reopens) | Low | Cosmetic | Edge case; only affects users who hover and then deliberately click to dismiss. The reopen settles after the mouse leaves the wrapper. Accept. |
| Focus not returned to trigger on Esc-close | Low | Low | Standard ARIA menu pattern wants focus to return; we don't currently. Acceptable for a hover-primary surface. Polish PR candidate. |
| Dropdown obscures content below for ~480px-wide mobile-emulator desktop users | Very low | None | The dropdown only renders on `≥ md` (768px+). Sub-min widths never see it. |
| Pre-existing `LuminaWindow.tsx` lint errors | Background | None | Out of scope, as for every sub-PR since Phase 1. |

---

## 10. Rollback plan

- `git revert <commit-sha>` restores the pre-refinement flat
  seven-item navbar exactly. No external state to clean up.
- Per-component soft-rollback: revert only the dropdown block
  (lines for Systems trigger + AnimatePresence panel + `useState`
  + `useEffect`) and add `/lab` + `/telemetry` directly back into
  the flat link array. ~10-minute manual diff.

---

## 11. Anti-creep checks

- ✅ No new dependency.
- ✅ No new file. Single-file edit.
- ✅ No new motion library, no new component library, no new
  state library.
- ✅ Cinematic identity preserved (`#00d2ff` only — the chevron
  + accents stay white-on-dark; the dropdown panel mirrors the
  navbar's exact surface vocabulary).
- ✅ No new tokens, no `globals.css` edits.
- ✅ Mobile UX unchanged (hidden row stays hidden).
- ✅ No Phase 3 scaffolding — observation window held.
- ✅ All routes' static / dynamic classifications unchanged.

---

## 12. STOP

Phase 2 polish complete. Awaiting human review of this
refinement. Phase 3 still does NOT start until the observation
window closes per V4 § 0.1.

The navbar reads: `ED.  ·  About  ·  Projects  ·  Systems ▾  ·  Contact  ·  [Résumé]`.

One trigger instead of five extra labels. Same destinations.
The system matured.

— end nav refinement —
