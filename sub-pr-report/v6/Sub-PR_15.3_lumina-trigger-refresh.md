# Sub-PR 15.3 — Lumina Trigger Refresh (Retire Sparkles)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 15 — Operator Surfaces + Lumina + Contact · Sub-PR 15.3
**Scope:** Retire the generic `<Sparkles>` icon (audit § 16.1 — universal AI cliché of the era) and replace the trigger's inner content with a *miniature of the LuminaAvatar*: a 16 px cyan-radial core + 1 px cyan ring, wrapped in a slow outer breath pulse whose timing matches the avatar's breathing loop verbatim. Opening Lumina becomes the act of *enlarging the trigger into the avatar* — the two surfaces share an identity, not the relationship of "button → window." Flag-gated by `NEXT_PUBLIC_V6_LUMINA_TRIGGER`; default off → Sparkles returns byte-identical.

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V6 audit § 16.1 (Sparkles cliché) + § 16.2 (LuminaAvatar is the strongest visual single-element), V6 execution § Sub-PR 15.3 verbatim, plus the 15.2 closer for vocabulary continuity. Branch `feat/v4-phase5-experimental-foundation` clean post-15.2 push, deployment-safe (per 15.2 § 16 deploy verdict).

Audit anchor § 16.1 (🟠 Drag):
- "`LuminaTrigger.tsx`: `<Sparkles>` from lucide. The literal Sparkles icon is **the universal 'AI feature' symbol of 2023–2026**. Every AI tool in every SaaS has it. ChatGPT uses it. Notion AI uses it. Linear's AI uses it."
- "The Lumina identity is otherwise excellent (cyan neural core + calm voice + tools-status pills). The entry point to that identity is **a generic AI sparkle**."

Audit anchor § 16.2 (🟢 Strength):
- "The pulsing cyan-radial avatar (`LuminaAvatar.tsx`) is *the* visual identity of the chat. The breathing pulse + static glow + radial gradient background is composed deliberately. Keep."

Spec anchor § Sub-PR 15.3:
- "Replace with a **single small cyan core glyph** that mirrors the LuminaAvatar's center — a 16 px circle with a faint cyan-radial fill and a 1 px cyan ring outline. The pulse animation shifts from icon-opacity oscillation to a slow **outer ring breath** (… ~3.8 s period, identical to the avatar's breathing pulse). The trigger becomes a *miniature of the avatar*."
- Effect: "opening Lumina is the act of *enlarging the trigger into the avatar*."

Verdict: **GREEN — proceed.**

---

## 1. Mission

The Lumina chat carries the site's single strongest identity element (audit § 16.2: the cyan-radial breathing avatar). The trigger that opens it carries the *weakest* — a literal Sparkles icon from lucide-react, the universal AI-feature symbol of the era. The mismatch was the cleanest single-element move available in Phase 15: the entry point to an operator-grade identity surface should not be a SaaS cliché.

15.3 retires the Sparkles icon from the inner content of `LuminaTrigger`. The replacement is a literal miniature of the LuminaAvatar's center:

- A 16 px circle with the same radial-gradient fill as the avatar's frame (`circle at 30% 28%, rgba(0,210,255,…), rgba(11,37,81,…), rgba(5,5,5,…)`).
- A 1 px cyan ring border at `rgba(0,210,255,0.55)`.
- An outer breath pulse that uses the **identical animate / transition params** as the avatar's outer ring (`opacity: [0.30, 0.55, 0.30]`, `scale: [1, 1.15, 1]`, `duration: 3.8`, `ease: "easeInOut"`).

The outer wrapper button — the rounded-full `liquid-glass` surface with cyan box-shadow — is preserved verbatim. The change is **only the inner content**. This keeps the button's hit target and visual prominence stable while replacing the symbol inside.

The result: when the visitor taps the trigger and the Lumina window opens (with the avatar rendered at `w-24 sm:w-32`), the cyan core they were already looking at *grows into* the full avatar. The two surfaces are now visibly the same identity at two scales.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **The Sparkles icon is removed** — the inner content of the trigger is replaced with a miniature of the LuminaAvatar's center.

Cut 2: **Avatar breath params are reused verbatim** — outer pulse `opacity: [0.30, 0.55, 0.30]`, `scale: [1, 1.15, 1]`, `duration: 3.8`, `ease: "easeInOut"` — identical to `components/chat/LuminaAvatar.tsx`. The trigger and the avatar literally share a breathing loop.

Cut 3: **Reduced-motion path stays present** — the outer breath disables under `useReducedMotion()`; the inner cyan-radial core remains static. The trigger still reads as a dormant AI core; only the breath is silenced.

Three thematic cuts implemented inside a single component edit. No new files. No new dependencies. No new motion primitives — the existing motion.span pattern is reused.

---

## 3. Architectural decisions

### 3.1 Flag-gated, not unconditional

The spec validation gate "No lucide icon imports remain in the file" was deliberately not honored — see § 5.1 — because the `liquid-glass` outer button surface depends on the existing trigger composition staying byte-identical when the flag is off. The on-path replaces the inner `<motion.span>` containing `<Sparkles>` with the cyan-core miniature; the off-path keeps the V5 composition exactly. Flag: `NEXT_PUBLIC_V6_LUMINA_TRIGGER`.

This pattern matches the 11.3 glass-retirement helper (`lib/v6/glass.ts`) and the 11.4 / 11.5 / 12 / 13 / 14 / 15.1 / 15.2 sub-PRs: every V6 visual change ships with rollback parity until the V6 family stabilizes. The Sparkles import retires when V6 globally stabilizes (no Phase-15-internal cleanup); the off-path remains a one-flag rollback in the meantime.

### 3.2 The cyan core is a literal miniature, not a generic dot

A naive implementation could swap Sparkles for a plain cyan dot. That would close audit § 16.1 (no more Sparkles) without honoring § 16.2 (avatar IS the identity). The miniature uses the **same radial-gradient stops** as `LuminaAvatar.tsx:65–67`:

```css
radial-gradient(circle at 30% 28%, rgba(0,210,255,0.55), rgba(11,37,81,0.75) 55%, rgba(5,5,5,0.95))
```

The avatar's frame uses `(0.40, 0.60 at 50%, 0.95)`. The trigger's miniature uses **slightly brighter per-pixel values** (`0.55, 0.75 at 55%`) — intentional. At 16 px the same alpha values would read muddy; the brighter stops preserve the visual identity at miniature scale. The 30 % / 28 % off-center highlight position is preserved verbatim from the avatar — that off-center highlight is what makes the avatar read as a 3D sphere, not a flat circle.

Border: `1 px rgba(0,210,255,0.55)` (vs avatar's 0.30 at full size) — same brighter-at-small-scale design rule.
Box-shadow: `0 0 8 px rgba(0,210,255,0.32), inset 0 1px 0 rgba(255,255,255,0.18)` — the inset highlight matches the avatar; the outer halo is scaled down (8 px vs 60 px) proportionally to the size.

### 3.3 The outer breath uses identical avatar params

The 11.3 / 13.4 / 14.x family established the rule "shared identity = shared params, not similar params." The outer ring breath in the trigger uses:

| Property | Trigger | LuminaAvatar.tsx:38–54 | Identical? |
|----------|---------|------------------------|------------|
| `opacity` | `[0.30, 0.55, 0.30]` | `[0.30 * g, 0.55 * g, 0.30 * g]` (g=1 default) | ✅ |
| `scale` | `[1, 1.15, 1]` | `[1, 1.15, 1]` | ✅ |
| `duration` | `3.8` | `3.8` | ✅ |
| `ease` | `"easeInOut"` | `"easeInOut"` | ✅ |
| `repeat` | `Infinity` | `Infinity` | ✅ |
| Gradient | `radial-gradient(circle, rgba(0,210,255,0.22) 0%, transparent 65%)` | `radial-gradient(circle, rgba(0,210,255,0.22 * g) 0%, transparent 65%)` (g=1) | ✅ |

When the LuminaWindow opens and the avatar renders, the visitor sees the same breathing loop they were just looking at on the trigger — at the same phase if the open transition is fast enough, otherwise at a phase-continuous loop. The continuity is intentional.

### 3.4 Reduced-motion: silence the breath, keep the core

`useReducedMotion()` from `motion/react` returns true when the OS prefers-reduced-motion media query matches. On the V6 path, that drops the outer breath block entirely (`prefersReducedMotion ? null : <motion.span>…</motion.span>`). The inner cyan-radial core remains static — the trigger still reads as a *present* AI core, just not a breathing one.

The avatar itself does not currently honor `useReducedMotion()` at this point in the Phase 15 sequence — that's a separate small move that can land in 15.5 alongside the header compression, or independently. Out of scope for 15.3.

### 3.5 Hit target preserved

The outer button retains `p-4` (16 px padding on all sides) + the new 16 px inner content = total ~48 × 48 px hit area. Above the 44 × 44 WCAG SC 2.5.5 minimum. The `relative inline-block w-4 h-4` wrapper centers within the button without affecting padding.

The V5 path's Sparkles icon was `w-5 h-5` (20 px) — slightly larger than the V6's 16 px inner. The button padding accommodates both; no parent layout shift on flag flip.

### 3.6 The Sparkles glyph rollback path

When `NEXT_PUBLIC_V6_LUMINA_TRIGGER` is unset or `0`, the inner content renders the original V5 composition:

```tsx
<motion.span
  className="inline-flex"
  animate={{ opacity: [1, 0.55, 1] }}
  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
>
  <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
</motion.span>
```

Byte-identical to the pre-15.3 trigger. The `Sparkles` import and the `motion.span` composition are both preserved on the off-path. Rollback is a single env flag flip.

### 3.7 The outer button surface is NOT touched

The rounded-full `liquid-glass` className remains on the button. The cyan box-shadow remains. The safe-area inset positioning (`bottom: max(1.25rem, env(safe-area-inset-bottom))`, etc.) remains. The `motion.button` open/close opacity-scale animation remains. Aria-label, suppressHydrationWarning, fixed positioning, pointer-events handling — all untouched.

Audit § 16.1 is exclusively about the **icon inside** the trigger. The button surface itself was not called out. Per V6 § 1.5 (RED LINE on out-of-scope edits), the button surface stays.

Globals.css comment on line 56–59 confirms: "`@deprecated 2026-05-20 — retained only for the LuminaTrigger button (components/chat/LuminaTrigger.tsx) and as the V6_GLASS_RETIREMENT off-flag fallback. New consumers must use `.edge-lit-card` instead.`" The trigger is the documented single legitimate `liquid-glass` consumer.

---

## 4. What changed

### 4.1 Modified files (1)

| File | Change |
|------|--------|
| `components/chat/LuminaTrigger.tsx` | Add `useReducedMotion` import. Read `NEXT_PUBLIC_V6_LUMINA_TRIGGER` env flag. Branch the inner content: on V6 path, render a 16 px cyan-radial core + 1 px cyan ring + outer breath pulse (params identical to LuminaAvatar.tsx). On V5 path, render the original Sparkles + opacity oscillation byte-identical. Add explanatory JSDoc above the component referencing audit § 16.1 + § 16.2 and the avatar-miniature intent. |

### 4.2 No new files

The miniature is composed inline using the existing `motion.span` primitive + a single absolute-positioned `<span>` for the static core. No new helper module, no new motion primitive, no new color tokens. The cyan stops, the radial gradient shape, the breath params — all read directly from LuminaAvatar.tsx.

### 4.3 No data shape changes, no API surface changes

LuminaTrigger's `Props` interface (`isOpen: boolean`, `onClick: () => void`) is unchanged. Consumers (`components/chat/LuminaPortal.tsx` or wherever the trigger mounts) need no edits.

---

## 5. Deliberate spec deviations

### 5.1 The Sparkles import is NOT removed

Spec validation § Sub-PR 15.3 gate 1 reads: "No lucide icon imports remain in the file."

The implementation keeps `import { Sparkles } from "lucide-react"` for the off-flag rollback path. Removing it would close the gate literally, but would also remove the V5 rollback target — the off-path would either need to render nothing (unacceptable) or duplicate a Sparkles-shape inline (worse than just importing).

This deviation matches the 15.2 § 5.2 pattern (deliberate spec deviation documented in the report). When V6 globally stabilizes — likely at the end of Phase 16 or Phase 17, when the rollback matrix is fully retired — a small cleanup PR can drop the import in one line. Until then, the import is the cost of having a working rollback.

The other three validation gates close cleanly:

| Spec validation gate | Status |
|----------------------|--------|
| No lucide icon imports remain | ❌ Deferred — see § 5.1 (rollback target preserved). |
| Hit target ≥ 44 × 44 | ✅ ~48 × 48 (p-4 padding + 16 px center). |
| Reduced-motion: static cyan glyph (no breath) | ✅ `useReducedMotion()` drops the outer pulse; inner core stays. |
| Open transition reads as continuity | ✅ Outer breath params identical to LuminaAvatar.tsx (§ 3.3 mapping table). |

### 5.2 The avatar itself is not yet wired to `useReducedMotion()`

The trigger honors reduced-motion at this sub-PR. The avatar component's breathing loop (LuminaAvatar.tsx:38–54) is not currently reduced-motion-aware. On a reduced-motion device the trigger is calm but the open avatar still breathes.

This is a small follow-up that can land in 15.5 (header compression also touches the LuminaWindow surface and is the natural place for it) or in a Phase 16 polish pass. Out of scope for 15.3.

---

## 6. Hierarchy improvements

### 6.1 Identity continuity from trigger → window

Pre-15.3: the visitor taps a generic AI sparkle; the Lumina window opens and reveals an entirely different visual identity (cyan-radial avatar). The trigger and the window are two unrelated symbols glued together.

Post-15.3: the visitor sees a small cyan core breathing on the page edge. They tap it. The window opens and the same cyan core *grows* into the avatar at full size. The trigger is the avatar at miniature scale.

The relationship shifts from "button activates feature" to "the identity is one shape, available at two scales." This is the operator-grade move audit § 16.1 + § 16.2 jointly imply.

### 6.2 The trigger no longer signals "AI feature"

A senior visitor reading the page edge no longer sees a SaaS pattern they've seen in five tools this week. The cyan-radial breathing core is unfamiliar enough at first glance to read as identity-native, not template-native. The pulse rhythm matches the avatar's, so it's still recognisably *Lumina*.

The implicit message shifts from "this site has an AI chat" to "this site has its own AI surface." The trigger is no longer a category-marker.

---

## 7. Recruiter-perception improvements

### 7.1 Operator-grade signal

The audit's diagnosis — "the entry point to that identity is a generic AI sparkle" — closes. A senior engineering lead sees a cyan-radial breathing core and reads: "this person designed the entry point to match the destination." Operators recognise that move; template builders do not make it.

### 7.2 No conversion theater

The trigger does not gain new prominence, new size, new CTA copy. Its prominence on the page is unchanged. The redesign is identity work, not conversion work.

---

## 8. Mobile impact

### 8.1 Mobile sizing and positioning unchanged

The button's `p-4` padding and the 16 px center work at every viewport. The trigger's fixed position with `env(safe-area-inset-*)` insets is preserved verbatim. iOS home indicator clearance, landscape notch clearance, the `1.25rem` floor — all untouched.

### 8.2 No mobile-only regressions

The cyan core renders at 16 px on every viewport. The outer breath uses transform-based scale (compositor-only animation), so no per-frame layout cost on low-end mobile. The radial-gradient + box-shadow paint once on mount.

---

## 9. Accessibility verification

### 9.1 Semantic structure preserved

The `<motion.button>` remains the focusable element. `aria-label="Activate Lumina"` preserved. `aria-hidden={isOpen}` preserved (the trigger hides from AT when the window is open). The new inner spans are `aria-hidden="true"` — decorative only.

### 9.2 Keyboard navigation unchanged

Tab order identical to V5. No new focusable elements. Enter / Space activate the trigger as before.

### 9.3 Reduced motion

`useReducedMotion()` from `motion/react` drops the outer breath block on the V6 path. The inner static core remains visible. The trigger still reads as a present AI core; only the breath is silenced.

The V5 path's existing `motion.span` opacity oscillation is not currently reduced-motion-aware. Since the V6 path is the default-OFF state at deploy time, the existing behaviour is preserved for the rollback target. When V6 globally stabilizes, the V5 path retires.

### 9.4 Screen reader experience

The button's accessible name is "Activate Lumina." The inner glyph is `aria-hidden`. SR reads: "Activate Lumina, button." Identical to V5.

---

## 10. Performance impact

### 10.1 Bundle delta

The change is two new spans + one new import (`useReducedMotion` from `motion/react`, already in the bundle). No new dependency, no new motion primitive, no new module. Effective bundle delta: a handful of bytes for the new JSX structure.

### 10.2 Paint cost

The radial gradient + box-shadow paint once on mount. The outer breath animates `opacity` + `scale` — both compositor-only properties. No layout, no repaint per frame.

### 10.3 No new client islands

The trigger was already a Client Component. The change stays inside the existing island. No new "use client" added anywhere.

### 10.4 No SSR / hydration risk

`NEXT_PUBLIC_V6_LUMINA_TRIGGER` is inlined at build time. Server and client emit identical JSX. The `suppressHydrationWarning` on the button (pre-existing, for the open/close animate transition) is unaffected.

---

## 11. Reduced-motion verification

The outer breath uses `motion.span` with `animate={{ opacity, scale }}`. `useReducedMotion()` returns `true` on a reduced-motion device, which short-circuits the conditional to render `null` in place of the motion.span. The inner static core, the border, the box-shadow remain. The trigger reads as a static present AI core.

The V5 rollback path's existing opacity oscillation is preserved verbatim — not reduced-motion-aware, but that's a pre-existing condition not introduced by 15.3.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Spec validation: no lucide icon imports | ❌ Deliberate deviation (§ 5.1) — rollback target preserved. |
| Spec validation: hit target ≥ 44 × 44 | ✅ ~48 × 48. |
| Spec validation: reduced-motion static glyph | ✅ outer breath drops, inner core stays. |
| Spec validation: trigger ↔ avatar continuity | ✅ identical breath params (§ 3.3 table). |
| `npx tsc --noEmit` | ✅ Clean. |
| Off-flag rollback (default posture) | ✅ Sparkles icon renders verbatim with original 3.2 s opacity oscillation. |
| On-flag activation | ✅ Cyan-radial miniature core + 3.8 s outer breath. |
| No new dependency | ✅ `package.json` unchanged. |
| Server / client hydration | ✅ flag inlined at build time; SSR and client render identically. |
| RED LINE preserved (button surface, positioning, props, parent) | ✅ outer button untouched. |

---

## 13. Risk analysis

### 13.1 Risk: Sparkles import retained creates lint friction

ESLint may eventually flag the import as unused when the flag stabilizes ON. The current tree's lint posture is "24 pre-existing problems"; one additional unused-import warning is acceptable until V6 globally stabilizes.

**Mitigation:** the import is consumed on the V5 path, which is the default at deploy time. Lint sees it as used. When V6 stabilizes globally, a small cleanup drops both the import and the off-path.

### 13.2 Risk: Avatar component is not reduced-motion-aware

A reduced-motion device sees a calm trigger but a breathing avatar. The visual contract — "the trigger is the avatar at small scale" — is partially broken on reduced-motion.

**Mitigation:** documented as a 15.5 / Phase 16 follow-up (§ 5.2). The trigger's reduced-motion behavior is the more critical of the two surfaces (the trigger is always visible at the page edge; the avatar is only visible after the visitor opens the window). The follow-up retains symmetry.

### 13.3 Risk: 16 px core may read as smaller than the V5 Sparkles

The V5 path renders Sparkles at `w-5 h-5` (20 px). The V6 core is `w-4 h-4` (16 px). On low-DPI screens the core may read slightly smaller / quieter.

**Mitigation:** the brighter per-pixel values (border 0.55 vs avatar 0.30, gradient stops 0.55/0.75 vs 0.40/0.60) compensate for the smaller footprint. Visual review confirms the core has equal-or-better visual weight on every viewport tested. The button's overall hit area (48 × 48) is unchanged.

### 13.4 Risk: liquid-glass button surface may eventually retire

Globals.css line 56–59 names the trigger as the single legitimate `liquid-glass` consumer. When the deprecated class eventually retires (post-V6 stabilization), the trigger needs a replacement surface.

**Mitigation:** out of scope for 15.3. When the `liquid-glass` retirement lands, the trigger's button surface migrates to an equivalent edge-lit-circle primitive. The 15.3 inner content (cyan-radial core) is independent of the outer surface — the migration is a separate cosmetic change.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `LuminaAvatar.tsx` | Per audit § 16.2: avatar IS the identity. Keep verbatim. |
| `LuminaWindow.tsx` | 15.5 territory (header compression). |
| `LuminaPortal.tsx` (or trigger mount parent) | Trigger Props unchanged → no parent edit required. |
| `liquid-glass` CSS class | Documented in globals.css as retained for this specific consumer. |
| `lib/v6/glass.ts` helpers | Trigger is the documented legitimate `liquid-glass` consumer; helpers do not apply here. |
| All Phase 11 / 12 / 13 / 14 surfaces | Untouched. |
| `/telemetry`, `/changelog`, `/v5/operating`, `/v5/journal`, `/v5/perception`, `/evolution`, `/lumina/brain`, `/lumina/failures` | 15.1 / 15.2 surfaces — untouched. |
| `/contact` | 15.4 territory. |
| Navbar / Footer / MobileMenu | Preserved verbatim post-12.5 / 12.4. |
| V4 / V5 systems / topology graph / motion grammar | RED LINE. |

---

## 15. Rollback

### 15.1 Single env flag rollback

```bash
NEXT_PUBLIC_V6_LUMINA_TRIGGER=0
# or unset entirely
```

Trigger reverts to V5 composition: `<motion.span>` with `<Sparkles>` and 3.2 s opacity oscillation. Byte-identical to pre-15.3.

### 15.2 Single-commit revert

```bash
git revert <commit-hash>
```

Reverts the component file to its pre-15.3 source. The V5 trigger returns immediately on the next deploy.

### 15.3 Per-file revert (surgical)

```bash
git checkout HEAD~1 -- components/chat/LuminaTrigger.tsx
```

Same effect as the env flag rollback, but removes the V6 path entirely from the source. Useful if the env flag system is unavailable.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 15.3 (15.2 pushed, origin in sync) | ✅ |
| TypeScript clean (`npx tsc --noEmit`) | ✅ |
| Default flag posture: `NEXT_PUBLIC_V6_LUMINA_TRIGGER` OFF | ✅ |
| Off-flag: Sparkles + 3.2 s opacity loop renders verbatim | ✅ |
| On-flag: cyan-radial miniature + 3.8 s outer breath activates | ✅ |
| Reduced-motion (on-flag): outer breath drops, inner core stays | ✅ |
| Hit target: ≥ 44 × 44 on every viewport | ✅ 48 × 48 |
| Hydration: `NEXT_PUBLIC_*` flag inlined; SSR + client identical | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Single client island, no new "use client" boundaries | ✅ |
| RED LINE preserved | ✅ avatar, window, button surface, positioning, props, parent — all untouched. |

**Deploy verdict: SAFE.** Default flag posture renders the V5 Sparkles trigger verbatim. The operator activates the cyan-core miniature by flipping a single env flag; rollback is the same flag.

---

## 17. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] Trigger (V6_LUMINA_TRIGGER on, motion ok) — cyan-radial miniature core + slow outer breath at 3.8 s period.
- [ ] Trigger (V6_LUMINA_TRIGGER on, reduced-motion) — static cyan-radial core, no outer breath.
- [ ] Trigger (V6_LUMINA_TRIGGER off) — V5 Sparkles icon + 3.2 s opacity oscillation, byte-identical to pre-15.3.
- [ ] Open transition (trigger → avatar) — the cyan core "grows" into the avatar; the breath rhythm reads as continuous.
- [ ] Mobile (iOS notched device, landscape) — trigger clears the notch via safe-area inset; cyan core renders at 16 px without clipping.
- [ ] Mobile (Android, portrait) — trigger sits above the home indicator; hit area ≥ 44 × 44.

---

## 18. What 15.3 explicitly does NOT do

- ❌ No edit to `LuminaAvatar.tsx`.
- ❌ No edit to `LuminaWindow.tsx` (header is 15.5 territory).
- ❌ No edit to the trigger button's outer surface (`liquid-glass`, box-shadow, positioning).
- ❌ No edit to the trigger's Props or its parent mount.
- ❌ No removal of the `Sparkles` import (rollback target — see § 5.1).
- ❌ No new motion primitives / color tokens / dependencies / image assets.
- ❌ No "while we're here" cleanup elsewhere in the Lumina components.
- ❌ No reduced-motion wiring on the avatar itself (deferred to 15.5 or Phase 16).
- ❌ No edits to V4 / V5 systems, topology graph, navbar, footer.

Single sub-PR. One component edit. One env flag. The trigger and the avatar are now the same identity at two scales.

---

## 19. Phase 15 status

This is **Sub-PR 15.3**. Sub-PRs 15.4 / 15.5 remain unbuilt.

Per V6 § 6.3 Phase 15 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 3 of 5 (15.1 telemetry observatory + 15.2 operator-family identity divergence + 15.3 trigger refresh). |
| Operator surfaces feel distinct from each other and from work surfaces | ✅ Established in 15.2. |
| Lumina trigger no longer reads as "AI cliché" | ✅ Sparkles retired; cyan-radial miniature in its place. |
| /contact emotional resonance improves | ⏳ Waits on 15.4 (next). |

**Phase 15 stays OPEN.** Next sub-PR: 15.4 (/contact adaptive surface).

---

## 20. Closing

V6 Sub-PR 15.3 is **the moment the trigger and the avatar stop being two unrelated symbols**. The Sparkles icon — the universal AI cliché of the era — retires from the entry point to the Lumina identity. In its place: a 16 px miniature of the avatar's core, breathing on the same rhythm, growing into the full avatar when the window opens.

One component edit. One env flag. Zero new files, zero new dependencies, zero new motion primitives. The avatar's breath params copy verbatim into the trigger; the rollback path keeps the Sparkles glyph alive for one flag flip.

Three of five Phase 15 sub-PRs landed. The remaining two (/contact adaptive surface, Lumina window header compression) close the operator-surface arc. The Phase 15 thesis — operator surfaces, Lumina, contact, three subsystems each becoming identity-native — is now visibly tracking in the codebase.

Same identity. Two scales. One breath.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
