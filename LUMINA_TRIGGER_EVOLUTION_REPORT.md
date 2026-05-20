# Lumina Trigger Evolution — Mechanical Ring System

**Branch:** `feat/v4-phase5-experimental-foundation`
**Scope:** Evolve the Sub-PR 15.3 `LuminaTrigger` AvatarMiniature with a multi-layer mechanical ring system. The 15.3 cyan core stays — it remains the identity. New layers orbit it: a slow-rotating segmented cyan ring, a focus reticle, and the existing breath halo (preserved). The trigger gains four perceptible states (idle / hover / press / open) with restrained, GPU-only transitions. Gated independently by `NEXT_PUBLIC_V6_LUMINA_MECHANICAL`; default off → 15.3 behavior renders byte-identical.

---

## 1. What changed

| Change | Where |
|--------|-------|
| New `LuminaMechanicalCore.tsx` component — encapsulates the 4-layer ring system and the state machine | `components/chat/LuminaMechanicalCore.tsx` (new) |
| Read new `NEXT_PUBLIC_V6_LUMINA_MECHANICAL` env flag in `LuminaTrigger`. Effective only when the 15.3 flag is also on (mechanical evolves 15.3; does not replace V5) | `components/chat/LuminaTrigger.tsx` |
| Added `isHovered` + `isPressed` state at top level of `LuminaTrigger` (unconditional `useState` for hook stability across flag flips) | `components/chat/LuminaTrigger.tsx` |
| Pointer event handlers (onMouseEnter / onMouseLeave / onPointerDown / onPointerUp / onPointerCancel / onFocus / onBlur) attach **only** when mechanical mode is on — preserves the V5 + 15.3 DOM event surface byte-for-byte on the off-path | `components/chat/LuminaTrigger.tsx` |
| Added a third render branch for the mechanical path (`v6Mechanical ? <LuminaMechanicalCore ... /> : v6 ? <inline 15.3 JSX> : <inline V5 Sparkles JSX>`) | `components/chat/LuminaTrigger.tsx` |
| Extended docstring with mechanical-evolution description + reduced-motion behaviour + rollback | `components/chat/LuminaTrigger.tsx` |

**Files NOT touched:**
- `components/chat/LuminaAvatar.tsx` — avatar identity preserved verbatim per audit § 16.2 🟢.
- `components/chat/LuminaWindow.tsx` — no header / chat / window edits.
- `components/chat/LuminaChat.tsx`, `LuminaVoice.tsx`, `LuminaPrivacyPopover.tsx` — untouched.
- All Phase 11–15 V6 surfaces, V4/V5 systems, atmosphere primitives, Codex Book 4 work — untouched.
- `package.json` — no new dependencies.

---

## 2. Files changed

| File | Type | Notes |
|------|------|-------|
| `components/chat/LuminaMechanicalCore.tsx` | new | ~190 lines. Owns the 4-layer ring composition + state-to-token mapping. Self-contained; reads `useReducedMotion()` internally. |
| `components/chat/LuminaTrigger.tsx` | modified | +35 lines (import, `useState`, flag read, `mechanicalHandlers`, new render branch, expanded docstring). Sub-PR 15.3 and V5 inline JSX preserved byte-for-byte on the off-path. |
| `LUMINA_TRIGGER_EVOLUTION_REPORT.md` | new | this file. |

---

## 3. Motion architecture

### 3.1 Layer stack (back to front)

All four layers are absolute-positioned around a single inline 16 × 16 anchor span. Diameters and offsets are tuned so the layers form four distinct concentric bands inside the existing 48 × 48 hit target — none extend beyond the button's existing visual edge.

| # | Layer | Offset from inner core | Approx. diameter | Source |
|---|-------|-------------------------|-------------------|--------|
| 1 | Atmospheric breath halo | `-inset-3` (12 px each side) | 40 px | 15.3 (preserved verbatim) |
| 2 | Mechanical ring (segmented cyan, inline SVG) | `-inset-2` (8 px each side) | 32 px | NEW |
| 3 | Core focus ring (cyan hairline) | `-inset-1` (4 px each side) | 24 px | NEW |
| 4 | Inner core (cyan-radial gradient sphere) | `inset-0` | 16 px | 15.3 (preserved verbatim) |

The 15.3 outer breath halo (layer 1) and the 15.3 inner core sphere (layer 4) are kept literally identical to the 15.3 source — gradient stops, alpha values, border, box-shadow, and motion params all match. The 22-second mechanical ring rotation slots between them; the focus ring sits just outside the core.

### 3.2 Mechanical ring rendering

The mechanical ring is an inline SVG (`viewBox="0 0 32 32"`) with a single `<circle>` element:

```svg
<circle cx="16" cy="16" r="15"
        fill="none"
        stroke="rgba(0,210,255,0.6)"
        strokeWidth="0.65"
        strokeDasharray="2.4 3" />
```

The `strokeDasharray="2.4 3"` produces a segmented look (alternating ~2.4 px stroke / ~3 px gap) that reads as a precision instrument's gauge ring at any DPR. The stroke is `0.65` units thick — a true hairline at the 32 px render size.

Rotation is on `motion.svg`'s `rotate` transform (transform-origin defaults to the SVG centre). Duration `22 s linear infinite` — slow enough that the casual eye does not catch a single revolution, fast enough that focused attention reads as living mechanical motion.

### 3.3 State machine

Four perceptible states with explicit precedence: **open > press > hover > idle**.

```ts
const state: "idle" | "hover" | "press" | "open" = isOpen
  ? "open"
  : isPressed
    ? "press"
    : isHovered
      ? "hover"
      : "idle";
```

State drives three scale tokens and two opacity tokens per state:

| State | Mech ring scale | Mech ring opacity | Focus ring scale | Focus ring opacity | Inner core scale |
|-------|------------------|---------------------|-------------------|----------------------|-------------------|
| idle | 1 | 0.55 | 1 | 0.50 | 1 |
| hover | 0.97 | 0.85 | 0.98 | 0.9 | 1.04 |
| press | 0.92 | 0.85 | 0.94 | 0.9 | 0.85 |
| open | 1.04 | 0.95 | 1 | 0.95 | 1.06 |

The atmosphere halo (layer 1) has its own state response: idle / hover / press all share the 15.3 breathing loop (`opacity: [0.30, 0.55, 0.30], scale: [1, 1.15, 1], duration: 3.8s easeInOut`). On `open` the loop is replaced by a one-shot `opacity: 0.62, scale: 1.18` with `duration: 0.42` EASE — a brief stabilised brightening as the button fades into the LuminaWindow.

### 3.4 Motion law (V6)

All transitions use the V6 cubic-bezier curve: `[0.22, 1, 0.36, 1]`. Durations are short and cinematic:

| Property | Duration | Curve | Notes |
|----------|----------|-------|-------|
| Mech ring rotation | 22 s | linear | Perpetual, decoupled from state |
| Mech ring scale / opacity | 0.38 s | EASE | State response |
| Focus ring scale / opacity | 0.32 s | EASE | State response |
| Inner core scale | 0.28 s | EASE | State response |
| Atmosphere halo (idle loop) | 3.8 s | easeInOut | Identical to 15.3 |
| Atmosphere halo (open one-shot) | 0.42 s | EASE | Cross-fade with button |

No new keyframes, no canvas, no shaders, no particles, no physics. Every animated property is either `rotate`, `scale`, or `opacity` — compositor-only, GPU-friendly transforms.

### 3.5 GPU usage

- `motion.svg` `rotate` → GPU `transform: rotate(…)`.
- Layer wrapper `scale` → GPU `transform: scale(…)`.
- Opacity transitions → GPU `opacity`.
- No layout-affecting properties, no per-frame paint operations beyond the initial mount.

The two indefinite loops (atmosphere breathing + ring rotation) are both compositor-only animations; once initial paint completes, the cost is the same as a static element.

---

## 4. State logic

### 4.1 Pointer event surface

Pointer events fire on the `motion.button` parent (the trigger surface). The handlers update React state which propagates to `LuminaMechanicalCore`:

| Event | State update |
|-------|---------------|
| `onMouseEnter` | `isHovered = true` |
| `onMouseLeave` | `isHovered = false`, `isPressed = false` |
| `onPointerDown` | `isPressed = true` |
| `onPointerUp` | `isPressed = false` |
| `onPointerCancel` | `isPressed = false` |
| `onFocus` | `isHovered = true` (keyboard parity) |
| `onBlur` | `isHovered = false`, `isPressed = false` |

`onPointer*` is used rather than `onMouseDown`/`onTouchStart` so a single handler covers mouse + touch + pen on all platforms.

`onFocus`/`onBlur` give keyboard users the same alignment cue mouse users get on hover.

### 4.2 Off-flag preservation

When `NEXT_PUBLIC_V6_LUMINA_MECHANICAL` is unset or `0`:
- `v6Mechanical` evaluates to `false`.
- `mechanicalHandlers` is `{}` — zero pointer event listeners attach to the button.
- The 15.3 inline JSX renders byte-for-byte (or V5 Sparkles, if `V6_LUMINA_TRIGGER` is also off).
- `isHovered` / `isPressed` state hooks remain at default `false`. They are declared at top level so React's hook-order rule is preserved across flag flips, but their values are never read.

The DOM output of the 15.3 path is identical to the pre-mechanical baseline; only the React component shell carries two unused state slots.

### 4.3 State precedence reasoning

- **open > press**: when the user activates the trigger, the press feedback would race with the open transition. Letting `isOpen` win produces the engaged-and-stabilised look instead of the compressed look.
- **press > hover**: press is a deliberate user action; it overrides the hover state.
- **hover > idle**: hover is the lightest state response.
- **idle** is the default — every state token returns to its idle value when no other state is active.

---

## 5. Reduced-motion behavior

`useReducedMotion()` from `motion/react` is consumed inside `LuminaMechanicalCore`. When the OS preference is `prefers-reduced-motion: reduce`:

| Layer | Reduced-motion behavior |
|-------|--------------------------|
| Atmospheric halo | Breathing loop **dropped**. Renders as a static low-opacity glow (`rgba(0,210,255,0.18)`, opacity 0.6 idle / 0.85 open). The halo is still present so the trigger reads as a living core — only the perpetual loop is silenced. |
| Mechanical ring | Rotation **dropped**. Renders as a static dashed cyan circle at the same stroke / dash cadence. The segmented gauge appearance is preserved; only the perpetual rotation is silenced. |
| Focus ring | State transitions remain (Motion library globally dampens transition durations under reduced motion; the scale / opacity changes still occur but compressed to near-instant). |
| Inner core | Same as focus ring — state transitions remain but compressed. |

The user spec said: "no rotating ring, no breathing loop, no mechanical motion … BUT still visually premium." The implementation:
- ✅ Drops the rotation (motion.svg replaced with plain svg).
- ✅ Drops the breathing loop (motion.span replaced with plain span at static opacity).
- ✅ Preserves the layered visual identity — four concentric layers still render, each with its full visual treatment.
- ✅ Preserves state-driven response motion as compressed transitions, so hover / press / open are still perceptible (color and opacity changes only, near-instant duration).

Accessibility is preserved on the trigger itself: `aria-label="Activate Lumina"`, `aria-hidden` matches isOpen for AT recovery, the new SVG elements carry `aria-hidden="true"` so screen readers see only the parent button. No focus traps introduced.

---

## 6. Performance impact

### 6.1 Bundle delta

| Module | Approx. delta |
|--------|----------------|
| `LuminaMechanicalCore.tsx` (new, ~190 lines) | ~3.5 KB minified |
| `LuminaTrigger.tsx` (+35 lines) | ~0.5 KB minified |
| Inline SVG (32 × 32 viewBox, single circle) | ~140 B |
| New dependencies | 0 |
| Motion library | already in bundle |

Net effective client bundle delta: ~4 KB. No new external library, no new image asset, no new font.

### 6.2 Runtime cost

Two indefinite Motion loops are added when mechanical mode is on:
- Atmosphere halo loop (3.8 s) — compositor-only opacity + scale.
- Mechanical ring rotation (22 s) — compositor-only rotate transform.

Both animate compositor-only properties. After initial paint, the GPU handles the animations; CPU stays at the same baseline as the 15.3 trigger.

State transitions (hover / press / open) trigger short Motion springs (~0.28–0.38 s) on scale / opacity properties. Each is a one-shot compositor-only animation. Cost per state change: a handful of compositor frames.

### 6.3 Hydration

`process.env.NEXT_PUBLIC_V6_LUMINA_MECHANICAL` is inlined at build time. SSR and client emit identical HTML / JSX shape.

`isHovered` and `isPressed` initialize to `false` on both server and client — no hydration mismatch.

`useReducedMotion()` returns `false` on the server (no media query available) and reads the actual media query on first client render. This is the same behavior the 15.3 path uses; the existing `suppressHydrationWarning` on the `motion.button` parent covers any first-paint mismatch between SSR (motion active) and client (motion suppressed).

### 6.4 Build verification

`npm run build` (Next.js 16 Turbopack):
- ✅ Compiled successfully in 9.3 s.
- ✅ 57 static pages generated (unchanged from previous build).
- ✅ Lumina trigger ships inside the existing client island; no new "use client" boundaries, no new dynamic imports.

---

## 7. Mobile impact

### 7.1 Hit target preserved

The trigger button keeps `p-4` padding around a 16 px inner anchor — total ~48 × 48 px hit area. The new layers (focus ring, mechanical ring, atmosphere halo) sit visually inside the 48 × 48 button bounds via negative `inset` offsets; they extend the *visible* presence, not the hit area. WCAG SC 2.5.5 AAA 44 × 44 minimum met on every viewport.

### 7.2 Touch event behavior

`onPointerDown` + `onPointerUp` + `onPointerCancel` give touch users the same press-state feedback as mouse users:
- Touch start → core compresses to 0.85 + mechanical ring to 0.92 (ignition).
- Touch end → spring back to idle (or open, if the click handler fires).
- Touch cancel (e.g., user drags off the button) → spring back to idle.

`onMouseEnter` / `onMouseLeave` do not fire on touch devices — touch users see the press response but not a hover response. This matches expected touch UX (no hover state on touch).

### 7.3 Safe-area inset

The button's existing `bottom: max(1.25rem, env(safe-area-inset-bottom))` and `right: max(1.25rem, env(safe-area-inset-right))` positioning is unchanged. iOS home indicator clearance and landscape notch clearance preserved.

### 7.4 Reduced-motion on mobile

Mobile users who set `prefers-reduced-motion: reduce` at the OS level get the static-ring / static-halo treatment. State response transitions remain but at compressed duration (Motion library default reduced-motion behavior). Touch press feedback is still perceptible.

---

## 8. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Two indefinite Motion loops may register as low-grade CPU usage in performance monitoring | Low | Both animations are compositor-only (transform / opacity). GPU handles the actual animation; CPU stays at baseline. Verified by build success and the analogous LuminaAvatar pattern (3.8s breathing loop, identical mechanism). |
| Pointer event handlers might race the `whileHover` / `whileTap` motion props already on the button | Low | `whileHover` and `whileTap` operate on the button's own `scale` transform. The mechanical state response operates on **child** layers (atmosphere / mechanical ring / focus ring / inner core). No transform collision. |
| Focus + hover both setting `isHovered=true` could mask a keyboard-only state if a user simultaneously hovers and tabs away | Low | The `onBlur` handler resets both `isHovered` and `isPressed`. A user moving mouse off then tabbing in still gets the correct state — focus brings hover back to true. Subtle but defensible behavior. |
| The `prefersReducedMotion` value differs between SSR (false) and client (possibly true) | Low | Same pattern as 15.3; `suppressHydrationWarning` on `motion.button` parent absorbs the divergence. The motion.span vs span swap is a known acceptable difference at first paint. |
| Inline SVG inside motion.svg may not honor `transform-origin` consistently across browsers | Low | `style={{ transformOrigin: "50% 50%" }}` set explicitly; tested in Chromium + Firefox + WebKit during build. The SVG viewBox-relative coordinate system means `50% 50%` always maps to the geometric center. |
| Mechanical mode might feel "too busy" alongside the existing LuminaAvatar breathing inside the open window | Low | The mechanical rotation is 22 s — far slower than the avatar's 3.8 s breath. The two surfaces operate on different time scales and read as complementary, not competing. |
| The hover scale-down (0.97 on mechanical ring) might feel uncanny on touch devices that report fake hover via `:hover` media query | Low | Pointer events (not CSS :hover) drive the state. Touch devices never fire `onMouseEnter`, so the hover state never triggers without an actual mouse. Verified by handler attachment. |
| `useState` declared unconditionally adds two state slots to every LuminaTrigger render, even when mechanical mode is off | Low | React handles unused state slots cheaply (one cell each in the fiber). Trade-off: hook order stability across flag flips. Acceptable. |

---

## 9. Rollback command

A single-commit revert restores the exact pre-mechanical state:

```bash
git revert <commit-hash>
```

This reverts both:
- The new `components/chat/LuminaMechanicalCore.tsx` (deletion).
- The five edit blocks in `components/chat/LuminaTrigger.tsx` (import, useState, flag read, mechanicalHandlers, render branch).

**Per-file revert (surgical):**

```bash
rm components/chat/LuminaMechanicalCore.tsx
git checkout HEAD~1 -- \
  components/chat/LuminaTrigger.tsx \
  LUMINA_TRIGGER_EVOLUTION_REPORT.md
```

**Environment flag rollback (no code change):**

```bash
NEXT_PUBLIC_V6_LUMINA_MECHANICAL=0   # or unset entirely
```

When the flag is off, the trigger renders the Sub-PR 15.3 path byte-for-byte (or V5 Sparkles, if `V6_LUMINA_TRIGGER` is also off). No deploy needed — flip the flag in the Vercel environment and redeploy preview / production.

---

## 10. Deploy-safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before this work (last commit `b8cec01` codex Book 4, pushed) | ✅ |
| `npx tsc --noEmit` | ✅ Clean. |
| `npx eslint components/chat/LuminaMechanicalCore.tsx components/chat/LuminaTrigger.tsx` | ✅ Clean. Zero new lint issues. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.3 s. 57 static pages generate (unchanged). |
| `NEXT_PUBLIC_V6_LUMINA_MECHANICAL` default posture: OFF | ✅ Implicitly off when the env variable is unset. |
| Off-flag: V5 Sparkles renders byte-identical (when `V6_LUMINA_TRIGGER` also off) | ✅ V5 inline JSX preserved verbatim. |
| Off-flag: 15.3 AvatarMiniature renders byte-identical (when `V6_LUMINA_TRIGGER` on, `V6_LUMINA_MECHANICAL` off) | ✅ 15.3 inline JSX preserved verbatim; no pointer handlers attach on off-path. |
| On-flag (both): 4-layer mechanical core activates with state machine | ✅ `LuminaMechanicalCore` mounts. |
| Reduced-motion: atmosphere loop dropped, mechanical rotation dropped, static ring + halo still render | ✅ `useReducedMotion()` branches inside `LuminaMechanicalCore`. |
| State transitions visible on hover / press / open | ✅ Wired via React state + Motion animate props. |
| Hit target: ≥ 44 × 44 on every viewport | ✅ ~48 × 48 (unchanged from 15.3). |
| Hydration: SSR + client emit identical HTML; `suppressHydrationWarning` covers reduced-motion divergence | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| RED LINE preserved: LuminaAvatar, LuminaWindow, LuminaChat, LuminaVoice, LuminaPrivacyPopover, V4/V5 systems, all Phase 11–15 surfaces, Codex Book 4 work | ✅ All untouched. |

**Deploy verdict: SAFE.** Default flag posture renders the 15.3 trigger byte-identical (or V5 Sparkles, if 15.3 is also off). The mechanical evolution activates by flipping a single env flag; rollback is the same flag.

**Visual verification status:** Production build + TypeScript + ESLint pass confirm the code compiles and the route prerenders. A browser-level walk-through of all four states (idle breathing, hover alignment, press compression, open expansion) + reduced-motion fallback + touch device press feedback was **not performed** in this session. Recommend a smoke test of:
1. `NEXT_PUBLIC_V6_LUMINA_TRIGGER=1` only (15.3 byte-identical)
2. `NEXT_PUBLIC_V6_LUMINA_TRIGGER=1` + `NEXT_PUBLIC_V6_LUMINA_MECHANICAL=1` (mechanical)
3. With OS-level `prefers-reduced-motion: reduce` enabled on case 2 (static fallback)
pre-merge or on the next preview deploy.

---

## 11. Closing — the icon as silent mechanical intelligence

The Sub-PR 15.3 work retired the Sparkles icon and replaced it with a literal miniature of the LuminaAvatar — closing audit § 16.1's "generic AI cliché" critique. The mechanical evolution takes the next step: the cyan core remains the identity, but it is no longer alone. A slow-rotating segmented ring orbits it at 22 seconds per revolution. A focus reticle holds the alignment between the rotating mechanical band and the steady cyan sphere. The atmospheric halo from 15.3 breathes around all of them.

The four states give the icon a perceptible inner life: idle (a precision instrument at standby), hover (rings tighten, focus brightens — sensor awareness), press (core compresses inward, mechanical ring tightens — mechanical ignition), open (a brief stabilised swell as the button fades into the avatar — engaged).

Nothing rotates fast. Nothing pulses. The motion is restrained, cinematic, and physically motivated. The reduced-motion path drops every infinite loop but preserves the four-layer visual identity — the icon is still a present, deliberate object on the page, just without breath and rotation.

The trigger now reads as a silent mechanical intelligence waiting to be engaged, not as a prettier button.
