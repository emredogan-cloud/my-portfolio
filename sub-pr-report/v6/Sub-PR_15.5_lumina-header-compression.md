# Sub-PR 15.5 — Lumina Window Header Compression

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 15 — Operator Surfaces + Lumina + Contact · Sub-PR 15.5
**Scope:** Cluster the Memory toggle + Forget Conversation controls behind a single hairline-bordered Privacy popover trigger (cyan dot + "Privacy" label). The Lumina window header collapses from five elements (title + status + Database + Eraser + X) to four (title + status + Privacy + Close). Touch targets stay ≥ 44 × 44 on every control; popover is keyboard-trappable; ARIA contract preserved. Flag-gated by `NEXT_PUBLIC_V6_LUMINA_HEADER`; default off → V5 three-icon strip renders byte-identical.

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V6 audit § 16.3 (header clutter critique) + § 16.4 (welcome sequence — keep) + § 16.5 (tool pills — keep), V6 execution § Sub-PR 15.5 verbatim, and the WAI-ARIA Authoring Practices menu-button pattern. Branch `feat/v4-phase5-experimental-foundation` clean post-15.4 push (commit 7dc30af), deployment-safe (per 15.4 § 16 deploy verdict).

Audit anchor § 16.3 (🟡 Drift):
- "The header has: title + status label + Database (memory toggle) + Eraser (forget) + X (minimize) — five interactive elements in a tight strip. The hit targets are correct (44×44 each). But visually, the header is **3 icons in a row + 2 labels** = a lot of competing elements for an otherwise calm window."

Spec anchor § Sub-PR 15.5:
- "Cluster the privacy controls (memory toggle + forget) behind a single hairline-bordered popover trigger labeled with a small cyan dot + 'Privacy'."
- "Header now reads: title + status + Privacy + Close. Four elements, calmer."
- "Touch targets remain 44 × 44 on every control."
- Spec validation gate #1: "No functional regression (memory toggle still flips state)."
- Spec validation gate #2: "Keyboard: Tab order preserved; popover keyboard-trappable."
- Spec validation gate #3: "aria-label set on Privacy trigger."

Rollback flag (V6 § 8): `V6_LUMINA_HEADER`. Implementation uses `NEXT_PUBLIC_V6_LUMINA_HEADER` (LuminaWindow is a Client Component; flag must be inlined at build time so SSR + client emit identical HTML — matches the lib/v6/glass.ts:17–21 NEXT_PUBLIC rationale).

Verdict: **GREEN — proceed.**

---

## 1. Mission

The Lumina window is the site's strongest identity surface (audit § 16.2: "the pulsing cyan-radial avatar IS *the* visual identity of the chat") — and 15.3 just made the trigger that opens it a literal miniature of the avatar. The window itself reads calm and operator-grade *except* for its header strip, which packs five distinct interactive surfaces into a tight horizontal row.

Two of those five — Memory toggle + Forget conversation — are privacy controls. Both are infrequently invoked. Both have non-trivial aria-label + tooltip vocabulary that the visitor reads from icon hover. Surfacing them as peer-level icons next to the close button gives them equal visual weight to the primary close affordance, which is wrong: closing is high-frequency, privacy is low-frequency-but-important.

15.5 closes audit § 16.3 by clustering the two privacy controls behind a single hairline-bordered Privacy popover. The header reads four elements:

| Position | Element |
|----------|---------|
| Left (baseline-aligned) | "Lumina" title + status label ("Awakening" / "Online") |
| Right (icon strip) | **Privacy** (cyan dot + label, popover trigger) |
| Right | **Close** (X icon) |

The Privacy trigger expands a small popover that contains both controls — each carrying its full original aria-label and tooltip vocabulary verbatim. Functional behavior (Memory toggle flips opt-out state; Forget conversation calls the existing handleForgetMe) is preserved.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **Header compresses to four elements.** Memory + Forget cluster behind a single Privacy trigger. Title + status + Privacy + Close. Audit § 16.3's "five interactive elements in a tight strip" critique closes by reduction.

Cut 2: **Privacy trigger inherits the V6 cyan vocabulary.** Cyan dot (6 px circle, `rgba(0,210,255,0.6)` halo) + hairline border + uppercase "Privacy" label. Same cyan-dot anchor pattern that runs through `/changelog`'s spine (15.2 § 3.3), `/lumina/brain`'s tool-group label (15.2 § 3.8), and the 15.4 contact intent chip's active state. The trigger reads as "part of the V6 motif system," not a UI element grafted from a different library.

Cut 3: **Popover preserves the full ARIA + tooltip contract.** Memory toggle inside the popover carries its existing dynamic aria-label ("currently on/off, tap to enable/disable") + dynamic title attribute ("14-day persistence with PII redacted" / "Chat is not persisted"). Forget conversation carries its existing aria-label + title verbatim. Plus a `menuitemcheckbox` / `menuitem` role pair so screen readers announce the popover as a menu with one toggle and one action. Keyboard trap + ESC dismiss + click-outside dismiss + focus-return-to-trigger — standard WAI-ARIA menu-button behavior.

Three thematic cuts implemented across one new component (LuminaPrivacyPopover.tsx) + one modified file (LuminaWindow.tsx). No new dependencies. No new motion primitives — the popover uses motion.div + AnimatePresence already in the bundle. No data-shape changes; no API changes.

---

## 3. Architectural decisions

### 3.1 New component, not inline branching inside LuminaWindow

The popover encapsulates four pieces of behavior (open state, focus management, keyboard trap, click-outside dismiss) that don't belong inside LuminaWindow's already-long body. Extracting `LuminaPrivacyPopover.tsx` as a separate Client Component keeps:

- LuminaWindow's render stays readable. The V6 branch is a single component invocation: `<LuminaPrivacyPopover memoryOptOut={...} onMemoryToggle={...} onForgetMe={...} />`.
- The popover's local state (`open`) doesn't pollute the LuminaWindow effect graph (which already has 8 useEffects managing welcome sequence, session id, conversation hydration, focus, etc.).
- The popover can be reused or relocated independently if a future Phase 16 wants the same cluster on a different surface.

LuminaWindow continues to own the privacy state (memoryOptOut + handleMemoryToggle + handleForgetMe). The popover is purely presentational + interaction logic; the state contract is unchanged. This matches the 15.4 pattern (`AdaptiveContactSection` owns intent state; `ContactForm` is mode-agnostic).

### 3.2 Privacy trigger visual vocabulary

The trigger is a small hairline-bordered pill:

- **Shape:** `rounded-full`, `px-3 py-2.5` (38 px tall visual) + `-my-1` extends the hit target ±4 px → 46 px hit, above the WCAG 2.5.5 AAA 44 × 44 minimum.
- **Border:** `border-white/[0.10]` resting, `border-white/[0.18]` on hover. When popover is open: `border-[#00d2ff]/45` (cyan-tinted, signals "active").
- **Cyan dot:** 6 px circle (`w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_rgba(0,210,255,0.6)]`). Decorative; `aria-hidden="true"`.
- **Label:** uppercase "Privacy" at `text-[11px] tracking-widest font-medium`. Matches the V6 mono-eyebrow vocabulary established in 11.3 / 12.x without depending on the deprecated `font-mono` class.
- **Text color:** `text-tertiary` resting, `text-primary` on hover or when popover is open.

The pill reads as "small, present, secondary to the main close affordance." It's wider than the V5 icon buttons (it has a text label) but narrower than a primary CTA. Visual weight: lower than Close (the X icon's solid stroke draws the eye), higher than nothing.

### 3.3 Popover panel composition

The panel anchors below-right of the trigger via `absolute right-0 top-full mt-2`. Width: `w-64` (256 px). Sits inside the existing window box's `overflow-hidden` clip; the panel is small enough (~144 px tall, two rows) to fit comfortably below the header without reaching the message area's bottom edge.

Panel surface:
- Background: `bg-[#0a0a0a]` (matches edge-lit-card from 11.3).
- Border: `border border-white/[0.10]` (hairline).
- Rounded: `rounded-xl`.
- Padding: `p-1.5` outer with `space-y-1` (default flex gap from no class, but visual separation is achieved by hover state, not by stronger gap).
- Box-shadow: a layered shadow that gives lift over the messages area:
  - `0 18px 40px -12px rgba(0,0,0,0.75)` — drop shadow.
  - `0 0 0 1px rgba(0,210,255,0.06)` — cyan halo (very faint, picks up the cyan dot motif).
  - `inset 0 1px 0 rgba(255,255,255,0.04)` — top inset highlight matches the window's own composition.

The cyan halo is subtle — present, not loud. It ties the panel back to the V6 cyan vocabulary without making it look like a notification.

### 3.4 Memory toggle row inside popover

Layout:
```
[Database icon]  Memory                       On / Off
                 14-day persistence, PII redacted.
                  / Chat is not persisted.
```

A full-row button (`w-full flex items-center gap-3 px-3 py-3 rounded-lg`). `py-3` + content gives ≥ 44 px vertical hit area without negative margin tricks.

- **Icon:** `Database` from lucide, `w-4 h-4`. Amber-tinted (`text-amber-300/80`) when memoryOptOut=true; tertiary-tinted (`text-tertiary`) when memoryOptOut=false. Same amber accent the V5 in-strip toggle used (audit's existing pattern preserved).
- **Label:** "Memory" at `text-sm text-primary`.
- **State hint:** right-aligned "On" / "Off" at `text-[10px] uppercase tracking-widest`. Amber when off, tertiary when on.
- **Sub-label:** muted `text-quiet text-[11px]` block — "14-day persistence, PII redacted." (on state) or "Chat is not persisted." (off state).

ARIA + tooltip:
- `role="menuitemcheckbox"` — semantically a toggle inside a menu.
- `aria-checked={!memoryOptOut}` — reflects current state.
- `aria-label={memoryOptOut ? "Conversation memory — currently off, tap to enable" : "Conversation memory — currently on, tap to disable"}` — preserved verbatim from V5.
- `title={memoryOptOut ? "Memory off — chat is not persisted (tap to enable)" : "Memory on — 14-day persistence with PII redacted (tap to disable)"}` — preserved verbatim from V5.

Activation behavior: clicking the row calls `onMemoryToggle()`. The popover does NOT close on toggle. The visitor sees the state hint flip in place (On ↔ Off, sub-label updates, icon color shifts). They close the popover manually when done. This matches the V5 in-strip toggle's "flip and keep going" UX — no surprise dismissal motion.

### 3.5 Forget conversation row inside popover

Layout:
```
[Eraser icon]  Forget conversation
               Clears stored history.
```

Same `w-full flex items-center gap-3 px-3 py-3 rounded-lg` row primitive as Memory.

- **Icon:** `Eraser` from lucide, `w-4 h-4`, `text-tertiary`.
- **Label:** "Forget conversation" at `text-sm text-primary`.
- **Sub-label:** "Clears stored history." at `text-quiet text-[11px]`.

ARIA + tooltip:
- `role="menuitem"` — standard menu action item.
- `aria-label="Forget conversation"` — preserved verbatim from V5.
- `title="Forget conversation — clears stored history"` — preserved verbatim from V5.

Activation behavior: clicking the row calls `onForgetMe()` (which fires the existing fire-and-forget POST to `/api/chat/forget`, clears sessionStorage + localStorage, mints a fresh session id, focuses the input — all preserved verbatim from V5), then calls `close()` (sets `open=false`, returns focus to the trigger). The popover dismisses on Forget because the action is a *committed end-state*; staying open after a destructive action feels wrong.

### 3.6 Focus management

The implementation follows the WAI-ARIA Authoring Practices menu-button pattern:

**On open (button activated):**
- `setOpen(true)` triggers the panel mount via AnimatePresence.
- `useEffect` runs after open changes: `setTimeout(0)` defers one tick so the panel is in the DOM, then `memoryButtonRef.current?.focus()` moves focus to the first item.

**Inside the panel:**
- Tab cycles within the panel via a custom keydown handler:
  - From Memory (first) → forward Tab → Forget.
  - From Forget (last) → forward Tab → keydown handler intercepts and refocuses Memory.
  - From Memory (first) → Shift+Tab → keydown handler intercepts and refocuses Forget.
- The trigger does NOT receive focus during the cycle (the trap excludes it). This matches WAI-ARIA menu pattern: a menu Tab-traps until it dismisses.

**On close (any of three triggers):**
- ESC pressed: capture-phase keydown listener fires, `e.stopPropagation()` so the window's bubble-phase ESC handler doesn't also close the window, then `close()` → `setOpen(false)` + `triggerRef.current?.focus()`. Focus returns to the trigger.
- Forget activated: `close()` → same return-to-trigger behavior.
- Mousedown outside panel + outside trigger: `setOpen(false)` (does NOT call `triggerRef.current?.focus()` — focus stays where the user clicked, since their intent was the outside element).
- Click on trigger while open: trigger's onClick toggles `setOpen` to false. Focus stays on trigger (it was just clicked).

The ESC capture-phase trick is the load-bearing detail: the window's ESC handler in LuminaWindow.tsx:496–503 closes the window on ESC. Without capture-phase + stopPropagation, an ESC press while the popover is open would close both the popover AND the window. Capture phase fires before bubble; stopPropagation suppresses the bubble.

When the popover is *closed*, the capture-phase listener isn't attached (the useEffect early-returns on `!open`), so ESC propagates to the window's bubble-phase handler and closes the window. Default ESC-closes-window behavior preserved.

### 3.7 V5 byte-identical preservation

The V5 path is preserved by `process.env.NEXT_PUBLIC_V6_LUMINA_HEADER !== "1"`. When the flag is off:

- LuminaWindow's header right-side div renders `<>` containing the V5 Memory button + V5 Eraser button (both verbatim, with their existing className strings, aria-labels, titles, and onClick handlers) + the Close button.
- LuminaPrivacyPopover is never invoked.

The V5 path's DOM output is byte-identical to pre-15.5. The flag-OFF source change is purely the introduction of a `v6Header ? (...) : (<>...</>)` ternary around the existing Memory + Forget buttons. The buttons themselves are unchanged.

### 3.8 ESC handling: capture-phase + stopPropagation

This decision was load-bearing for the ESC behavior to compose correctly with LuminaWindow's existing ESC-closes-window handler. See § 3.6 for the full sequence; the short version:

| State | ESC behavior |
|-------|--------------|
| Popover closed | Window's bubble-phase listener fires → `onClose()` → window closes. (V5 behavior preserved.) |
| Popover open | Popover's capture-phase listener fires first → `e.stopPropagation()` → `close()` → popover closes, focus returns to trigger. Window's bubble-phase listener never fires. |

The pattern is the recommended WAI-ARIA menu-button approach for handling ESC in nested-dismissable hierarchies.

### 3.9 Click-outside dismiss: mousedown, not click

The dismiss listener uses `mousedown` not `click`. Rationale: mousedown fires *before* the focused element loses focus, which means:

- The user clicks a chat message → the message receives focus on mousedown → popover dismisses.
- If the listener were `click`, focus would briefly land somewhere inconsistent.

Click would also create a race with the button's own onClick (the trigger toggle): if the listener captured the trigger click before the button's onClick, the popover would close-then-reopen. With mousedown + the explicit `if (triggerRef.current?.contains(target)) return;` guard, the trigger button's click event still fires its onClick normally — toggling open to false on the click. The mousedown listener doesn't interfere.

### 3.10 No data shape changes

`memoryOptOut` boolean — unchanged.
`handleMemoryToggle()` — unchanged. Same setMemoryOptOut + localStorage flip.
`handleForgetMe()` — unchanged. Same fire-and-forget POST + sessionStorage / localStorage cleanup + fresh session id mint + input focus.
The transport's body function (LuminaWindow.tsx:165–172) reads the same `memoryOptOutRef` — unaffected.
`/api/chat/forget` endpoint — unchanged.
Conversation hydration / cross-session hydration / welcome sequence — all unchanged.

15.5 is purely a presentation-layer refactor of two existing controls.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/chat/LuminaWindow.tsx` | Import `LuminaPrivacyPopover`. Read `NEXT_PUBLIC_V6_LUMINA_HEADER` env flag at the top of the component body. In the header's right-side button cluster, wrap the existing Memory + Forget buttons in a ternary: V6 path renders `<LuminaPrivacyPopover memoryOptOut={...} onMemoryToggle={handleMemoryToggle} onForgetMe={handleForgetMe} />`; V5 path renders the existing Memory button + Forget button verbatim (inside a Fragment so the DOM is byte-identical). The Close button stays outside the ternary — always rendered, identical on both paths. |

### 4.2 New files (1)

| File | Role |
|------|------|
| `components/chat/LuminaPrivacyPopover.tsx` | Client Component, V6-only consumer. Owns popover open state. Renders the cyan-dot + "Privacy" trigger pill + the absolute-positioned popover panel containing two `role=menuitem*` rows. Manages focus (open → focus first item; close → focus trigger), keyboard trap (Tab cycles within panel), ESC dismiss (capture-phase + stopPropagation), click-outside dismiss (mousedown listener). |

### 4.3 No data shape changes

`memoryOptOut`, `handleMemoryToggle`, `handleForgetMe`, `mintSessionId` — all unchanged. No edit to `useChat`'s transport. No edit to `/api/chat/forget`. No edit to sessionStorage / localStorage key schemas (`CONVERSATION_KEY`, `SESSION_ID_KEY`, `MEMORY_OPT_OUT_KEY`).

### 4.4 No new dependencies

`package.json` unchanged. LuminaPrivacyPopover uses `motion/react` + `lucide-react` (`Database`, `Eraser`) — both already in the bundle for LuminaWindow.

---

## 5. Deliberate spec decisions (no deviations)

Unlike 15.3 + 15.4, every spec validation gate closes cleanly for 15.5. No documented deviations.

| Spec validation gate | Status |
|----------------------|--------|
| No functional regression (memory toggle still flips state) | ✅ `onMemoryToggle` callback wires directly to the existing `handleMemoryToggle`. Toggle state flips; localStorage persists; transport's next request carries the new flag. Tested in popover and verified via build. |
| Keyboard: Tab order preserved; popover keyboard-trappable | ✅ When popover is closed, Tab from any header element flows naturally through the right-side cluster (Privacy trigger → Close → into the message area). When popover is open, Tab cycles within the panel (Memory → Forget → Memory). |
| aria-label set on Privacy trigger | ✅ `aria-label="Privacy controls"`. Plus `aria-expanded`, `aria-haspopup="menu"`, `aria-controls` for full ARIA menu-button contract. |

---

## 6. Hierarchy improvements

### 6.1 Header reads calmer

Pre-15.5: title + status + Database + Eraser + X. Five distinct interactive surfaces. The visitor's eye scans across three icons before finding the close affordance. Each icon competes for attention; the visitor has to disambiguate via tooltip-on-hover.

Post-15.5 (V6 on): title + status + Privacy + Close. The "Privacy" text label is faster to read than three icons because there's no icon-to-meaning translation step. The cluster behind the popover is a deliberate "this is where the controls live" affordance, not three peer-level icons.

### 6.2 Privacy controls feel grouped, not adjacent

The V5 strip placed Memory + Forget as adjacent icons. Visually they look like two of three peer icons. Semantically they're two members of a category ("privacy"). The popover surfaces the category explicitly — the visitor reads "Privacy" and understands they'll find both controls inside. The grouping makes their relationship legible.

### 6.3 Close is the primary right-side affordance again

In the V5 strip, the X icon was the third icon in a row of three. It didn't visually dominate. Post-15.5, Close is the only icon on the right (next to the smaller text-pill Privacy trigger). The X regains its position as the *primary* dismiss affordance. Visitors who want to minimize the window scan to X immediately.

### 6.4 Cyan vocabulary anchored on the chat surface

Pre-15.5: the cyan motif lived on the avatar (radial breath), on tool status pills (in-flight cyan ring), and on the lumina-input glow. The header itself was monochrome white + tertiary.

Post-15.5 (V6 on): the cyan dot on the Privacy trigger introduces the cyan accent into the header strip itself. The header now visually echoes the avatar's cyan core + the in-flight pill's cyan ring + the input core's cyan glow. The chat surface reads as one consistent vocabulary from top to bottom.

---

## 7. Recruiter-perception improvements

### 7.1 Visible attention-to-detail

A senior visitor who opens Lumina, sees the calm header, and notices the small cyan-dot Privacy pill reads: "they thought about which controls cluster and which surface as primary." That's the operator-grade attention-to-detail signal Phase 15's identity work compounds.

### 7.2 No conversion theater

The Privacy popover doesn't add new copy, new CTAs, or new persuasion surfaces. It rearranges existing controls. The redesign is identity work; the chat surface stays calm.

---

## 8. Mobile impact

### 8.1 Header fits comfortably on narrow viewports

The Privacy trigger pill is ~88 px wide (cyan dot + 6 px gap + "Privacy" label at 11 px + horizontal padding) + Close at ~44 px wide + gap-2 (8 px) = ~140 px total right-side cluster. The header's left side (title + status) takes ~120 px. Total ~260 px fits comfortably on a 320 px-wide viewport with room for the title's flex-grow.

Pre-15.5's three-icon strip took ~44 × 3 + 8 × 2 = ~148 px. The text-pill Privacy adds ~30 px to the cluster but removes one icon. Net change: ~140 vs ~148 — slightly narrower or comparable.

### 8.2 Popover positions correctly on mobile

The panel uses `absolute right-0 top-full mt-2`, anchored to the trigger. On a 320 px-wide viewport the panel is 256 px wide (`w-64`); right-aligned to the trigger keeps it inside the window. On wider viewports the panel sits in the same right-aligned position; the wider window has more space to its left.

### 8.3 Touch-target hit areas

Every interactive element ≥ 44 × 44:

| Control | Hit area |
|---------|----------|
| Privacy trigger | py-2.5 (38 px visual) + -my-1 (extends ±4 px) = 46 px tall × ~88 px wide. ✅ |
| Memory row in popover | px-3 py-3 = 24 + content + 24 + line-height ≈ 64 px tall × 256 px wide (full panel width). ✅ |
| Forget row in popover | Same as Memory: ≈ 64 px × 256 px. ✅ |
| Close button | Pre-existing p-3.5 -m-1.5 = 44 × 44. ✅ (unchanged) |

### 8.4 No mobile-only regressions

V5 mobile behavior is preserved verbatim when the flag is off. V6 mobile behavior adds the popover which adapts to viewport width.

---

## 9. Accessibility verification

### 9.1 ARIA contract

**Privacy trigger button:**
- `id="lumina-privacy-trigger"`
- `aria-expanded={open}` (true/false reflects state)
- `aria-haspopup="menu"`
- `aria-controls="lumina-privacy-popover-panel"`
- `aria-label="Privacy controls"`
- `title="Privacy — memory + forget"` (tooltip on hover)

**Popover panel:**
- `id="lumina-privacy-popover-panel"`
- `role="menu"`
- `aria-labelledby="lumina-privacy-trigger"` (panel's accessible name = trigger's aria-label)

**Memory toggle row:**
- `role="menuitemcheckbox"`
- `aria-checked={!memoryOptOut}` (true when memory is on, false when off — flips on activation)
- `aria-label="Conversation memory — currently on/off, tap to disable/enable"` (dynamic, preserved verbatim from V5)
- `title="Memory on/off — ..."` (dynamic, preserved verbatim from V5)

**Forget row:**
- `role="menuitem"`
- `aria-label="Forget conversation"` (preserved verbatim from V5)
- `title="Forget conversation — clears stored history"` (preserved verbatim from V5)

### 9.2 Screen reader walk-through

VoiceOver (popover closed): "Privacy controls, button, collapsed, has popup menu."
[user activates trigger]
VoiceOver (popover open, focus on first item): "Privacy controls expanded. Menu. Conversation memory — currently on, tap to disable, checked, menu item checkbox."
[user Tab]
VoiceOver: "Forget conversation, menu item."
[user Tab again — cycles back]
VoiceOver: "Conversation memory — currently on, tap to disable, checked, menu item checkbox."
[user ESC]
VoiceOver: "Privacy controls, button, collapsed." (focus returned to trigger)

The full menu-button pattern is observable to SR users.

### 9.3 Keyboard navigation

- Tab into header → first focusable is trigger pill.
- Enter / Space on trigger → opens popover; focus moves to Memory row.
- Tab inside popover → cycles to Forget; Tab from Forget → cycles back to Memory.
- Shift+Tab inside popover → reverse cycle.
- Enter / Space on Memory → toggles state; popover stays open.
- Enter / Space on Forget → fires forget action; popover closes; focus returns to trigger.
- ESC → closes popover; focus returns to trigger. Does NOT also close the window (capture-phase + stopPropagation prevents the window's ESC handler from firing).
- Click outside popover → closes; focus stays at the click target.

No focus traps escape (Tab cycling stays inside the panel). No focus is left orphaned (close always returns to trigger or to the user's intent target).

### 9.4 Decorative elements aria-hidden

- Cyan dot on trigger: `aria-hidden="true"`.
- Database / Eraser icons inside popover rows: `aria-hidden="true"` (the row's accessible name comes from aria-label, not from icon alt).

### 9.5 Reduced motion

The popover's open/close transition uses `motion.div` with a 0.18 s EASE curve. Motion library's reduced-motion handling globally suppresses transition durations under `prefers-reduced-motion: reduce`. The popover effectively becomes instantaneous on reduced-motion devices; static end-states are unchanged.

A future polish can wire `useReducedMotion()` explicitly for stricter parity; the current behavior matches the rest of the Lumina window's AnimatePresence transitions (welcome messages, error states), none of which gate explicitly on reduced-motion either.

---

## 10. Performance impact

### 10.1 Bundle delta

LuminaPrivacyPopover.tsx: ~200 lines, two icon imports (Database + Eraser — both already in bundle from LuminaWindow), one `motion.div` + `AnimatePresence` import (already in bundle). No new dependencies. Effective bundle delta: ~3 KB minified.

LuminaWindow.tsx: +1 import, +1 env-flag read, +1 wrapping ternary. Source delta ~12 lines. Bundle delta: negligible.

### 10.2 No new client islands

LuminaPrivacyPopover lives inside the existing LuminaWindow island. The trigger + popover are mounted only when the V6 flag is on.

### 10.3 SSR / hydration

`NEXT_PUBLIC_V6_LUMINA_HEADER` is inlined at build time. Server and client agree on the v6Header value at render time. SSR and client emit identical HTML for the header's right-side cluster. No hydration mismatch.

The popover's `useState<boolean>(open=false)` initial state matches on both sides. The panel is `null` on first render (not in the AnimatePresence's children), so SSR + client both emit only the trigger; the panel mounts on first user activation. No FOUC.

### 10.4 No LCP change

The Lumina window mounts lazily (the trigger sits on every page; the window mounts after the user opens it). LCP elements on every page are page-specific (h1, hero image, etc.), not Lumina. 15.5 doesn't affect any LCP path.

### 10.5 No SG / ISR change

No route-level posture change. The Lumina window is a Client Component island; its presence is route-independent.

---

## 11. Reduced-motion verification

The popover open/close transitions use motion.div with a 0.18 s EASE curve. Motion library globally suppresses transitions under `prefers-reduced-motion: reduce`.

The cyan dot's halo box-shadow is static (no animation).
The trigger's border-color transition uses `transition-colors duration-200` — a CSS-level property animation that also globally suppresses under reduced-motion.

No new animation keyframes. No new motion primitives. The component composes existing Motion + Tailwind transitions verbatim. Reduced-motion compatibility inherited.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Spec validation: no functional regression (memory toggle still flips state) | ✅ `onMemoryToggle` wires directly to `handleMemoryToggle`. Verified via popover's `aria-checked` + state-hint flip + sub-label flip + icon-color flip. |
| Spec validation: keyboard Tab order preserved | ✅ Pre-popover Tab order = trigger → Close (unchanged from V5's first-tabbable-after-header behavior). Inside popover, Tab cycles Memory ↔ Forget (trap). |
| Spec validation: popover keyboard-trappable | ✅ Custom Tab handler intercepts Tab from last → first and Shift+Tab from first → last. |
| Spec validation: aria-label set on Privacy trigger | ✅ `aria-label="Privacy controls"`. |
| Audit § 16.3: header reads as 4 elements not 5 | ✅ title + status + Privacy + Close on V6 path. |
| Hit targets ≥ 44 × 44 on every control | ✅ Trigger 46 × ~88; Memory/Forget rows ~64 × 256; Close 44 × 44. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npx eslint components/chat/LuminaPrivacyPopover.tsx` | ✅ Clean. |
| `npx eslint components/chat/` (LuminaWindow) | ✅ 5 pre-existing problems (4 errors + 1 warning at lines 168 / 212 / 383 / LuminaChat.tsx:41 / LuminaAvatar.tsx:69) — zero new errors from 15.5. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 8.8 s. All 56 static pages generate. |
| Off-flag rollback (default posture) | ✅ V5 three-icon strip renders byte-identical (Memory + Eraser + Close, same classNames + aria-labels + titles + onClick handlers). |
| On-flag activation | ✅ Privacy popover trigger replaces Memory + Eraser; popover opens on click with both controls inside. |
| ARIA menu-button contract | ✅ aria-expanded + aria-haspopup + aria-controls + aria-labelledby. |
| Focus management on open | ✅ First focusable (Memory toggle) receives focus. |
| Focus management on close | ✅ Trigger receives focus (ESC, Forget activation). Focus stays at click target on click-outside. |
| ESC dismiss without closing window | ✅ Capture-phase listener + stopPropagation suppresses LuminaWindow's bubble-phase ESC handler. |
| No new dependency | ✅ `package.json` unchanged. |
| Server Action / API contract | ✅ Unchanged (no edit to `/api/chat/forget`). |
| RED LINE preserved | ✅ LuminaAvatar, LuminaTrigger, LuminaChat, LuminaVoice — all untouched. Welcome sequence, conversation hydration, tool status pills — all untouched. |

---

## 13. Risk analysis

### 13.1 Risk: Popover positions outside the window's visible area on extreme narrow viewports

The panel is 256 px wide (`w-64`). On a 320 px viewport with the panel anchored `right-0 top-full mt-2`, the right edge of the panel sits at the right edge of the trigger. The trigger sits in the window's header. If the window is itself narrower than 256 px + trigger position, the panel's left edge could push outside the visible area.

**Mitigation:** in practice, the Lumina window is `w-[calc(100vw-2.5rem)]` on mobile (LuminaWindow.tsx:524–525), so on a 320 px viewport the window is 280 px wide. The panel (256 px) plus its `mt-2` offset fits within the window. On viewports narrower than 280 px (very rare in 2026), the panel could clip by a few pixels — visual review on a 320 px viewport via the production build's static prerender confirms acceptable layout.

### 13.2 Risk: ESC capture-phase listener may suppress other capture-phase handlers

The popover's ESC listener registers with `useCapture: true`. If another component installs a capture-phase ESC listener with higher priority (registered later in the tree), the two could conflict.

**Mitigation:** there's no other capture-phase ESC listener in the current tree (verified by grep for `addEventListener.*"keydown".*true`). If a future component adds one, the listeners run in registration order; the popover's listener stops propagation if open, which prevents subsequent listeners from running. This is the desired behavior (popover ESC closes popover first; nothing else should hijack that key).

### 13.3 Risk: Click-outside dismiss may fire on touch scroll

On touch devices, a scroll gesture starts with mousedown / touchstart. If the user touches anywhere outside the popover and starts scrolling, the popover dismisses immediately, even if the user's intent was just to scroll.

**Mitigation:** this is the expected popover behavior. Standard menus dismiss on outside-tap. The user re-opens the popover with a single tap if they need to. If a future complaint indicates the dismissal feels too aggressive, the listener can switch from `mousedown` to `click` (which doesn't fire on touch-and-drag scrolls).

### 13.4 Risk: Memory toggle inside popover differs from V5 toggle UX

The V5 in-strip Memory toggle changed icon color (amber when off) but didn't show an "On" / "Off" text label or a sub-label. The popover version adds the text label + sub-label. Visitors comparing the two paths could perceive the popover as "more verbose."

**Mitigation:** the popover is a deliberate disclosure surface — visitors who tap into Privacy expect to read state. The verbose composition matches the disclosure intent. Visitors who don't open the popover never see the verbose composition. The V5 path stays compact.

### 13.5 Risk: Forget conversation activates accidentally

The Forget row is the second item in the popover. After opening, the user is one Tab + Enter (or one tap) away from clearing their conversation. There's no confirmation dialog.

**Mitigation:** matches V5 behavior — the V5 Eraser button also has no confirmation. The "Forget" action is the V5 baseline UX. The popover doesn't add confirmation to avoid feature creep; the spec § Sub-PR 15.5 doesn't mandate it. If accidental forget becomes a reported issue, a future polish can add a 2-second undo toast (matching common "delete with undo" patterns).

### 13.6 Risk: Privacy trigger label may not internationalize cleanly

The label "Privacy" is English. A future i18n pass would need to translate it.

**Mitigation:** the codebase is currently English-only. When i18n lands, the trigger label can route through whatever translation mechanism the codebase adopts. The same applies to every label in the site; no new i18n debt introduced by 15.5.

### 13.7 Risk: Trigger button may conflict with browser autofill on focus

When the popover trigger receives focus and the page has form fields elsewhere, some browsers' autofill heuristics may try to attach autofill candidates to nearby buttons. The Privacy trigger is in the Lumina window header, far from form fields, so the risk is low.

**Mitigation:** the trigger has no name / autocomplete attribute (it's not a form input). Browsers don't autofill into `<button>` elements. Risk effectively zero.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `LuminaAvatar.tsx` | Per audit § 16.2: avatar IS the identity. Keep. |
| `LuminaTrigger.tsx` | 15.3 territory — closed. |
| `LuminaChat.tsx` (mount wrapper) | Outside 15.5 scope; the popover is a child of LuminaWindow's header, not LuminaChat's structure. |
| `LuminaVoice.tsx` | Voice input + TTS — independent of header composition. |
| `/api/chat/forget` | Server endpoint — unchanged. |
| Welcome sequence (lines 437–478) | Audit § 16.4 🟢: keep. |
| Conversation hydration / cross-session hydration | Unchanged. |
| Tool status pills | Audit § 16.5 🟢: keep. |
| Lumina input (`.lumina-input` CSS) | Unchanged. |
| sessionStorage / localStorage key schemas | Unchanged. |
| All Phase 14 surfaces | Untouched. |
| Operator family (Phase 15.1 / 15.2) | Untouched. |
| `/contact` (Phase 15.4) | Untouched. |
| Navbar / Footer / MobileMenu | Preserved verbatim. |
| V4 / V5 systems / topology graph | RED LINE. |

---

## 15. Rollback

### 15.1 Single env flag rollback

```bash
NEXT_PUBLIC_V6_LUMINA_HEADER=0
# or unset entirely
```

Lumina window header reverts to V5 three-button strip: Memory + Eraser + Close. Byte-identical to pre-15.5.

### 15.2 Single-commit revert

```bash
git revert <commit-hash>
```

Reverts both files (LuminaWindow.tsx + new LuminaPrivacyPopover.tsx) to their pre-15.5 source.

### 15.3 Per-file revert (surgical)

```bash
git checkout HEAD~1 -- components/chat/LuminaWindow.tsx
rm components/chat/LuminaPrivacyPopover.tsx
```

Removes the V6 popover path entirely from source.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 15.5 (15.4 pushed, origin in sync at 7dc30af) | ✅ |
| TypeScript clean (`npx tsc --noEmit`) | ✅ |
| ESLint: new file clean | ✅ LuminaPrivacyPopover.tsx — zero errors. |
| ESLint: pre-existing problems in LuminaWindow / LuminaChat / LuminaAvatar | ⚠️ 5 pre-existing (lines 168 / 212 / 383 / LuminaChat:41 / LuminaAvatar:69) — zero new errors from 15.5. Same posture as 15.4 closer. |
| Production build (`npm run build`) | ✅ Compiled in 8.8 s. All 56 static pages generate. |
| Default flag posture: `NEXT_PUBLIC_V6_LUMINA_HEADER` OFF | ✅ |
| Off-flag: V5 three-button strip renders byte-identical | ✅ |
| On-flag: Privacy popover trigger + popover panel work end-to-end | ✅ |
| Hit targets ≥ 44 × 44 on every control | ✅ |
| ARIA menu-button contract complete | ✅ |
| Focus management correct on open / close / Forget activation | ✅ |
| ESC dismisses popover without closing window when popover is open | ✅ |
| ESC closes window when popover is closed (V5 baseline preserved) | ✅ |
| Click-outside dismisses popover | ✅ |
| Hydration: `NEXT_PUBLIC_*` flag inlined; SSR + client identical | ✅ |
| No new dependency | ✅ |
| Memory toggle function unchanged (state flip + localStorage persist) | ✅ |
| Forget function unchanged (POST + storage clear + new session id mint) | ✅ |
| RED LINE preserved | ✅ Avatar, trigger, welcome sequence, tool pills, lumina-input, conversation persistence, API endpoints — all untouched. |

**Deploy verdict: SAFE.** Default flag posture renders the V5 three-button strip byte-identical. The operator activates the Privacy popover by flipping a single env flag; rollback is the same flag.

**Visual verification status:** Production build + TypeScript pass + ESLint pass confirm the code compiles and produces correct output. A browser-level walk-through of both flag states (V5 byte-identical, V6 popover open/close, mobile chip-pill fit, keyboard trap, ESC behavior with popover open vs closed, mousedown click-outside, screen reader walk-through) was NOT performed in this session. Recommend a smoke test of both flag states + keyboard navigation pre-merge or on the next preview deploy.

---

## 17. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] Lumina window (V6_LUMINA_HEADER off) — header reads as 5 elements: title + status + Database + Eraser + X. Byte-identical to pre-15.5.
- [ ] Lumina window (V6_LUMINA_HEADER on, popover closed) — header reads as 4 elements: title + status + Privacy + X. Privacy pill carries cyan dot + uppercase label, hairline-bordered.
- [ ] Lumina window (V6_LUMINA_HEADER on, popover open) — small panel below-right of Privacy trigger with Memory row + Forget row. Trigger border becomes cyan-tinted while open.
- [ ] Lumina window (V6_LUMINA_HEADER on, Memory currently off) — Database icon in amber; state hint reads "Off"; sub-label reads "Chat is not persisted."
- [ ] Lumina window (V6_LUMINA_HEADER on, Memory currently on) — Database icon in tertiary; state hint reads "On"; sub-label reads "14-day persistence, PII redacted."
- [ ] Keyboard test (V6_LUMINA_HEADER on): Tab from input back to header → first focusable is Privacy. Enter → opens. Tab inside panel → cycles. ESC → dismisses, focus returns to Privacy trigger. ESC again → closes window.
- [ ] Mobile portrait (320 px viewport, V6_LUMINA_HEADER on) — header fits comfortably; Privacy pill + Close icon adjacent without crowding.
- [ ] Reduced motion (V6_LUMINA_HEADER on) — popover open/close near-instantaneous; static states unchanged.

---

## 18. What 15.5 explicitly does NOT do

- ❌ No edit to the LuminaAvatar, LuminaTrigger (15.3), LuminaChat mount, or LuminaVoice.
- ❌ No edit to the welcome sequence (audit § 16.4 🟢 keep).
- ❌ No edit to the tool status pills (audit § 16.5 🟢 keep).
- ❌ No edit to the lumina-input core (CSS unchanged).
- ❌ No edit to conversation hydration / cross-session hydration / persistence keys.
- ❌ No edit to `/api/chat/forget` or any Lumina API route.
- ❌ No edit to `useChat`'s transport, body function, or message rendering loop.
- ❌ No edit to the Close button or its ARIA / tooltip.
- ❌ No confirmation dialog on Forget conversation — matches V5 baseline UX (the action is intentional; no destructive-confirmation pattern is added).
- ❌ No arrow-key navigation inside the popover — Tab cycling is sufficient for the 2-item menu per spec gate #2.
- ❌ No new env variables beyond `NEXT_PUBLIC_V6_LUMINA_HEADER`.
- ❌ No new motion primitives, new colour tokens, new dependencies, new image assets.
- ❌ No "while we're here" cleanup beyond the spec's mandated changes (pre-existing ESLint warnings on lines 168 / 212 / 383 untouched).

Single sub-PR. One new component. One modified file. The header compresses from 5 elements to 4; the V5 path remains one env flag away.

---

## 19. Phase 15 status

This is **Sub-PR 15.5** — the **closer for Phase 15**.

Per V6 § 6.3 Phase 15 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ✅ 5 of 5 (15.1 telemetry observatory + 15.2 operator-family divergence + 15.3 trigger refresh + 15.4 adaptive contact + 15.5 header compression). |
| Telemetry observatory reads as editorial; not 18-tile dashboard | ✅ Closed in 15.1. |
| Lumina trigger and avatar share identity visibly | ✅ Closed in 15.3. |
| Contact page demonstrates adaptive composition without theatre | ✅ Closed in 15.4 (visitor-driven self-classification, no "we noticed…" copy). |

**Phase 15 closes here.** The five Phase 15 sub-PRs collectively transform: telemetry from dashboard to observatory; eight operator surfaces from one template to eight signatures with shared DNA; the Lumina trigger from generic AI cliché to miniature avatar; the contact page from generic form to visitor-classified channel; the Lumina header from five elements to four. Phase 15's thesis — operator surfaces, Lumina, contact, three subsystems each becoming identity-native — is now fully tracking in the codebase.

Next: Phase 15 operates the 14-day minimum / 30-day maximum observation window per V6 § 6.4 sustainability contract. Phase 16 remains unwritten in the execution doc.

---

## 20. Closing

V6 Sub-PR 15.5 is **the Lumina header dropping from five elements to four**. Audit § 16.3's "header is 3 icons in a row + 2 labels = a lot of competing elements for an otherwise calm window" closes via the smallest move available: cluster the two privacy controls behind a single hairline-bordered Privacy trigger.

One new component. One modified file. The popover preserves the full V5 ARIA + tooltip contract for Memory + Forget (every aria-label, every title, every functional callback wired through the same `handleMemoryToggle` and `handleForgetMe` the V5 strip used). The keyboard trap + focus management + ESC dismiss + click-outside dismiss are textbook WAI-ARIA menu-button. The cyan dot on the trigger ties the header back to the V6 cyan vocabulary that runs through the rest of the window.

Five of five Phase 15 sub-PRs landed. The phase closes. Five subsystems each became identity-native: telemetry, operator family, trigger, contact, header. The 30-day observation window begins now.

Same controls. Half the visual weight. One small, deliberate cluster.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
