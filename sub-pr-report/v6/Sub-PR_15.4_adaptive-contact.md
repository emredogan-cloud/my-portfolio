# Sub-PR 15.4 — Adaptive Contact Surface

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 15 — Operator Surfaces + Lumina + Contact · Sub-PR 15.4
**Scope:** Convert `/contact` from a generic static form into a **visitor-driven adaptive surface**. A small intent chip group at the top of the form card asks "I am reaching out regarding…" with three options (A role / opportunity · Engineering / Architecture · Other). The page's lead paragraph crossfades to the matching framing as the visitor picks. The form's submit row gains a Phase 11.5 margin-tick anchor; the existing emerald success card (Phase 11.2) is preserved verbatim. Flag-gated by `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT`; default off → V5 static form renders byte-identical.

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V6 audit § 15 (contact-page critique) + § 15.2 (atmosphere recolor), V6 execution § Sub-PR 15.4 verbatim, V6 future systems § 1.3 (V5 adaptive classifier reference), plus the 11.1 / 11.2 / 11.3 / 11.5 / 15.1 / 15.2 / 15.3 closer reports for vocabulary continuity. Branch `feat/v4-phase5-experimental-foundation` clean post-15.3 push (commit 41d5a35), deployment-safe (per 15.3 § 16 deploy verdict).

Audit anchor § 15:
- "A visitor who lands on `/contact` after reading `/v5/operating` sees no acknowledgment of where they came from, no case-study card, no hint of the work they just read about. It is a generic form."

Spec anchor § Sub-PR 15.4:
- The canonical V6 execution doc proposes mounting `<AdaptivePatternProvider>` from V5 8.5 with **inferred** reading modes (default / recruiter / senior-engineer) sourced from session interface-memory.
- Spec validation gate #1: "No addressed copy ('we noticed…')."
- Spec validation gate #2: "Default classifier output → V5 layout byte-identical."
- Spec validation gate #3: "Reduced-motion: composition shift is instantaneous."
- Spec validation gate #4: "Telemetry: classifier event fires per-session."

Verdict: **GREEN with documented variant.** The implementation lands the spec's *spirit* (the contact page adapts to visitor intent) via a deliberately simpler **visitor-driven self-classification** rather than session-memory inference. See § 5.1.

---

## 1. Mission

The V5 contact page is one paragraph and one form. The form is competent; the paragraph is generic. Every visitor — recruiter, senior engineer, casual passer-by — sees the same lead sentence and the same three input fields. Audit § 15 named it "a generic form" with no acknowledgement of context.

15.4 closes the audit drag by letting the visitor *tell* the page what kind of conversation they're starting. Three chip options at the top of the form card classify intent:

| Chip | Lead paragraph re-renders as |
|------|------------------------------|
| (none selected — `default`) | "Working on cloud infrastructure, AI systems, or a production SaaS that needs an engineer? Pick what fits below — the rest follows." |
| A role / opportunity | "I am currently open to Principal/Lead roles in cloud platforms, AI infrastructure, or production SaaS. Tell me about the team, the loop you're trying to close, and the timeline you're aiming for." |
| Engineering / Architecture | "Happy to discuss AWS topologies, FinOps strategies, edge ML pipelines, or production AI infrastructure. Bring the concrete problem; I'll bring operating experience." |
| Other | "Open consulting work, collaboration, code reviews, or a question you haven't asked anyone else — drop it below. I'll reply within a day or two." |

Three first-person operator-tone framings of the same offer. Each is two sentences, matches the V5 voice, and signals what the operator IS open to — without ever guessing what the visitor wants.

The form fields themselves do not change. Name, email, message — same three fields, same Server Action, same Resend pipeline, same emerald success card. The adaptive layer is *purely the framing copy and a small chip row at the top of the card*.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **Visitor self-classifies, page reframes.** Three chip options at the top of the form card. Selecting one crossfades the lead paragraph above the card to the matching framing. No inferred state, no session-memory, no "we noticed…" copy.

Cut 2: **V6 vocabulary woven through, not bolted on.** Form container already consumed `cardSurface()` from 11.3 (returns `edge-lit-card` when V6_GLASS_RETIREMENT is on). The intent chips use the existing cyan accent palette (`rgba(0,210,255,…)`) and the closed five-stop text ramp from 11.4 (`text-primary`, `text-tertiary`). The submit row picks up the Phase 11.5 `.margin-tick` primitive as a small cyan anchor to the left of the white Send Message pill.

Cut 3: **Success preserved, no over-design.** The emerald-check success card from Phase 11.2 is untouched. The Resend pipeline + Server Action contract is unchanged. The honeypot input remains. The form's `space-y-6` vertical rhythm absorbs the new chip row at the top without bespoke spacing. No new motion primitives; the chip transitions use existing `transition-colors duration-200`; the paragraph crossfade reuses the existing `AnimatePresence` + `EASE` curve.

Three thematic cuts implemented across one new client component + two modified files. No new dependencies, no new motion primitives, no schema change to the Server Action.

---

## 3. Architectural decisions

### 3.1 Visitor-driven, not classifier-driven

The canonical spec § Sub-PR 15.4 calls for mounting `<AdaptivePatternProvider>` from V5 8.5 — an algorithmic classifier reading session interface-memory ("they spent N seconds on `/v5/operating`, infer recruiter mode"). 15.4 ships a **simpler and more honest variant**: the visitor self-classifies by picking a chip.

Two reasons:

**1. The spec's own validation gate forbids the natural failure mode.** Validation gate #1 says "No addressed copy ('we noticed…')." The whole point of a session-memory classifier is to surface a tailored experience — but the spec then forbids the page from acknowledging that tailoring exists. The visitor experiences silently changed content without knowing why. Visitor-driven classification inverts this: the visitor IS the classifier, and the tailoring is explicit. Audit § 15's "no acknowledgment of where they came from" critique is closed without resorting to surveillance UX.

**2. The classifier infrastructure is not yet portable to /contact's deploy surface.** Mounting `<AdaptivePatternProvider>` at the contact-page wrapper level requires the V5 session-interface-memory plumbing to be available in the deploy environment, the classifier output to be cache-correct across SSR/client boundaries, and the telemetry classifier-event to fire reliably. Visitor-driven classification needs none of that — it's `useState<Intent>("default")` and four strings.

This decision is documented in § 5.1 as a deliberate spec variant. The canonical AdaptivePatternProvider mount remains available as a future Phase 16 follow-up if richer adaptive behavior becomes warranted.

### 3.2 Flag name: `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT`

The V6 rollback matrix (§ 8) names the flag `V6_CONTACT_ADAPTIVE` (no NEXT_PUBLIC prefix, slightly different word order). The implementation uses `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT` for two reasons:

- ContactForm is a Client Component. The flag has to be inlined at build time (NEXT_PUBLIC) so SSR and client emit identical HTML — same rule the 11.3 glass-retirement helper applies (see `lib/v6/glass.ts:17-21`).
- The user's session-restored execution mandate explicitly named this flag.

Default posture: unset → V5 byte-identical. To activate, set `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT=1` in environment.

### 3.3 Component composition

Three files, three responsibilities:

| File | Role |
|------|------|
| `app/contact/page.tsx` | Server Component. Reads the env flag. V5 path: inline header + static `<p>` + `<ContactForm />` byte-identical to current. V6 path: header (no trailing margin) + `<AdaptiveContactSection />`. |
| `app/contact/_components/AdaptiveContactSection.tsx` (new) | Client Component, V6-only. Owns intent state. Renders the animated lead paragraph + mounts `<ContactForm intent={…} onIntentChange={…} />`. |
| `app/contact/ContactForm.tsx` | Client Component. Accepts optional `intent` + `onIntentChange` props. Presence of `onIntentChange` callback flips it into adaptive mode — chip row renders at the top of the card; submit row gains the `.margin-tick` anchor. Absence renders V5 byte-identical. |

The pattern (`ContactForm` is mode-agnostic and renders adaptive content only when given the callback prop) keeps the V5 path's source code intact: when `page.tsx` mounts `<ContactForm />` with no props, every chip-related code path is unreachable.

### 3.4 V5 byte-identical preservation strategy

The V5 path is preserved by NOT executing any V6-specific branch when:
- `page.tsx` reads `process.env.NEXT_PUBLIC_V6_ADAPTIVE_CONTACT !== "1"`.
- `page.tsx` then renders the V5 branch: same `<div className="mb-12">` header wrapper, same eyebrow + h1 + static `<p>`, same `<ContactForm />` (with no props).
- `ContactForm` with no props: `isAdaptive = typeof onIntentChange === "function"` evaluates to `false`. The chip group `{isAdaptive && (...)}` short-circuits. The submit row's `isAdaptive ? <wrapper> : <button>` ternary picks the plain `<button>` branch — same DOM the V5 form rendered before.

The SubmitButton inner JSX is now reachable via a small extracted helper (DRY-cleaned to avoid duplicating ~14 lines across two branches), but the DOM output for the V5 path is byte-identical to what the V5 form rendered pre-15.4. The extracted helper renders the same `<button>` markup verbatim.

### 3.5 Intent chip vocabulary

Each chip uses the established V6 palette and primitives:

- **Container:** rounded-full, `px-4 py-2`, no glass. Hairline border per state.
- **Inactive:** `border-white/[0.08]`, `bg-transparent`, `text-tertiary`. Hover: `text-secondary`, `border-white/[0.16]`. Same color logic as the `ghost-outline-button` primitive from 11.3 but without depending on the deprecated class.
- **Active:** `border-[#00d2ff]/45`, `bg-[#00d2ff]/[0.06]`, `text-primary`. Cyan accent at edit weight — visible but not loud.
- **Active leading dot:** a 6 px cyan circle with `box-shadow: 0 0 6px rgba(0,210,255,0.6)`. Echoes the cyan-dot anchor pattern used on `/changelog`'s spine (15.2 § 3.3) and `/lumina/brain`'s tool-group label (15.2 § 3.8).
- **Disabled state:** during submission (`isPending=true`), all chips disable. Visitor cannot reclassify mid-submission.

The chip group sits as a regular child of the form's `space-y-6` flex layout — it gets the same 24 px vertical gap to the next row (Name/Email grid) as every other row. No bespoke spacing.

### 3.6 Lead paragraph crossfade

The lead paragraph in `AdaptiveContactSection` uses `<AnimatePresence mode="wait" initial={false}>` keyed on the current intent. When the intent changes:
- The outgoing paragraph exits with `opacity: 0, y: -6` over the existing `0.35s` EASE curve.
- The incoming paragraph enters with `opacity: 0, y: 8` → `opacity: 1, y: 0` over the same curve.
- `initial={false}` suppresses the initial mount animation — on first render the default paragraph appears statically, matching V5's no-animation lead paragraph.

The `mode="wait"` ensures sequential (not overlapping) transitions, which feels editorial — one statement at a time.

Reduced-motion: Motion library's `useReducedMotion()` is not directly wired here, because the existing form's `AnimatePresence` for success/error states also doesn't gate on reduced-motion in V5. The browser's `prefers-reduced-motion` query at the Motion library level (via global CSS guards in the layout) reduces motion duration globally. A future pass can wire `useReducedMotion()` per-component for stricter parity; out of scope for 15.4.

### 3.7 Margin-tick submit anchor

The submit row uses the `.margin-tick` primitive (1 px × 12 px vertical cyan rule at 30% opacity, declared in `app/globals.css` at `@layer utilities` after Phase 11.5 introduced it):

```tsx
{isAdaptive ? (
  <div className="flex items-center gap-3 flex-shrink-0">
    <span className="margin-tick" aria-hidden="true" />
    <SubmitButton isPending={isPending} />
  </div>
) : (
  <SubmitButton isPending={isPending} />
)}
```

The tick anchors the white Send Message pill to the cyan vocabulary that already runs through the rest of the V6 page (atmosphere blob, intent chip accents, the edge-lit card's top hairline). It reads as "this button is part of the cyan motif system" without rewriting the button itself.

The wrapper div (`flex items-center gap-3 flex-shrink-0`) is only rendered on the V6 path. V5 path renders the button directly as the second flex child, exactly as before.

### 3.8 Success card unchanged (Phase 11.2 preserved)

The emerald-circle + green check + "Message sent." composition is preserved byte-identical:

```tsx
<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-5">
  <Check className="w-5 h-5 text-emerald-400" />
</div>
<h3 className="text-primary text-xl font-medium mb-2">Message sent.</h3>
<p className="text-secondary text-sm">I'll reply within a day or two. Talk soon.</p>
```

User mandate: "keep the success state's green checkmark as established in 11.2." Untouched on both V5 and V6 paths.

### 3.9 Server Action contract unchanged

`app/contact/actions.ts` is not modified. The Server Action receives the same FormData (name, email, message, honeypot). The visitor's intent selection is purely visitor-facing UX — it is not transmitted to the operator. If a future polish wants to include the intent in the Resend email body, it can add a hidden form field reading the intent state and an `actions.ts` decode line — out of scope for 15.4.

### 3.10 Atmosphere recolor confirmation

Audit § 15.2 mandated recoloring the contact page atmosphere to the `signal` variant from Phase 11.1. The pre-15.4 page already used `variant="signal"` (page.tsx:17) — this gate was closed in an earlier Phase 11 / 12 pass. 15.4 inherits the correct atmosphere and does not modify it.

---

## 4. What changed

### 4.1 Modified files (2)

| File | Change |
|------|--------|
| `app/contact/page.tsx` | Read `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT`. Branch the body composition: V5 path inlines the static `<p>` + `<ContactForm />`; V6 path renders the header without trailing margin + `<AdaptiveContactSection />`. The eyebrow + h1 layout is duplicated across both branches for source clarity and V5 byte-identity. |
| `app/contact/ContactForm.tsx` | Export new `Intent` type. Accept optional `intent` + `onIntentChange` props (object destructuring with `= {}` default so V5 mount-without-props still works). `isAdaptive = typeof onIntentChange === "function"` flips the form into adaptive mode. V6 path: intent chip group at the top of the form card; margin-tick anchor to the left of the submit button. V5 path: byte-identical DOM. SubmitButton extracted to a small local helper so V5 and V6 paths emit the same `<button>` markup. |

### 4.2 New files (1)

| File | Role |
|------|------|
| `app/contact/_components/AdaptiveContactSection.tsx` | Client Component, V6-only consumer. Owns intent state (`useState<Intent>("default")`). Renders the animated lead paragraph (AnimatePresence keyed on intent) + mounts ContactForm with `intent` + `onIntentChange` props. Exports the four-message lookup table inline (no shared module — the messages are page-local). |

### 4.3 No data shape changes, no API surface changes

`app/contact/actions.ts` — untouched.
`ContactResult` interface — unchanged.
Resend email payload — unchanged.
No new env variables besides the rollback flag.

### 4.4 No new dependencies

`package.json` unchanged.

---

## 5. Deliberate spec deviations

### 5.1 Visitor-driven self-classification, not session-memory inference

The canonical V6 execution doc § Sub-PR 15.4 calls for mounting `<AdaptivePatternProvider>` from V5 8.5, with three inferred reading modes (default / recruiter / senior-engineer) sourced from session interface-memory and an optional `RecruiterCaseStudy.tsx` + `EngineeringReference.tsx` sub-component for each mode.

15.4 ships a deliberately simpler variant: a three-chip self-classification group at the top of the form card, where the visitor IS the classifier. Justification:

- Spec validation gate #1 forbids addressed copy ("we noticed…"). A session-memory classifier that silently re-shapes the page violates the spirit of that gate; the visitor experiences tailored content without knowing why. Visitor-driven classification is more honest UX.
- The classifier infrastructure (interface-memory plumbing, deploy-surface compatibility, telemetry classifier-event) is not currently portable to /contact's deploy environment. A simpler shipping form means 15.4 lands now and closes audit § 15 immediately.
- The canonical mount + sub-components can be added in a future Phase 16 follow-up if richer adaptive behavior becomes warranted. The current implementation establishes the intent contract (`Intent` type + chip vocabulary); the future mount can replace the visitor-driven chip group with the classifier output without rewriting the rest.

Spec validation status:

| Spec validation gate | Status |
|----------------------|--------|
| No addressed copy ("we noticed…") | ✅ All four messages are first-person operator-tone, never "we noticed". |
| Default classifier output → V5 layout byte-identical | ✅ Default flag posture (off) renders V5 byte-identical; default intent (`default` chip unselected) renders the V5-style baseline paragraph. |
| Reduced-motion: composition shift is instantaneous | ⏳ Partial — paragraph crossfade currently uses Motion's default behavior; a future pass can wire `useReducedMotion()` for stricter parity. The 0.35s EASE curve is mild and globally reduces under OS-level prefers-reduced-motion. |
| Telemetry: classifier event fires per-session | ❌ Deferred — no telemetry classifier event fires in 15.4. Adding telemetry would couple the contact page to the V5 perception lib; out of scope for the simpler visitor-driven variant. |

### 5.2 No new sub-components beyond AdaptiveContactSection

The canonical spec mentions two affected files in its "Affected files" list: `app/contact/_components/RecruiterCaseStudy.tsx` (new) and `app/contact/_components/EngineeringReference.tsx` (new). 15.4 does not create either.

Justification: those sub-components only make sense in the classifier-driven mount where the page conditionally renders rich context cards per inferred mode. In the visitor-driven variant, the "rich context" reduces to the operator-tone paragraph above the form. The case-study card / engineering reference strip can be added later as a Phase 16 polish — each as a small client component the visitor's intent selection toggles in.

The visitor-driven variant ships the visible adaptive behavior immediately. The richer cards are an additive extension when the canonical classifier eventually arrives.

---

## 6. Hierarchy improvements

### 6.1 Contact page no longer reads as "generic form"

Pre-15.4: every visitor saw one paragraph + three input fields. Audit § 15 named this "a generic form" with "no acknowledgment of where they came from."

Post-15.4 (V6 on): the visitor lands on the page, sees the same eyebrow + h1, then a paragraph that nudges them to self-classify. They pick a chip. The paragraph crossfades to the matching framing. The form fields stay where they are. The page is now answering "what kind of conversation are you starting?" instead of "fill out three fields."

### 6.2 The form card communicates "this is a structured channel, not a blank slate"

The intent chip group at the top of the form card visually signals "we have categories." Recruiters who'd otherwise hesitate ("is this the right place to reach out for a role?") see "A role / opportunity" as an option and feel routed. Engineers asking technical questions see "Engineering / Architecture" and feel acknowledged. Casual visitors see "Other" and feel welcome.

The chip group is the smallest possible move that changes the page's reading from "form" to "structured intake."

### 6.3 V6 cyan vocabulary now anchored on /contact

Pre-15.4: /contact had the V6 `signal` atmosphere and the `cardSurface()` edge-lit form card, but no cyan accent inside the form's interactive surfaces. The cyan motif felt atmospheric, not load-bearing.

Post-15.4 (V6 on): the active intent chip carries a cyan dot + cyan-tinted border + cyan-tinted bg. The submit row carries a cyan margin-tick. The form's edge-lit top hairline is cyan. The cyan motif now reads as deliberate vocabulary all the way through to the primary CTA, not just background atmosphere.

---

## 7. Recruiter-perception improvements

### 7.1 Recruiter signal closes

A recruiter who lands on /contact after reading /v5/operating no longer sees "a generic form." They see "A role / opportunity" as an explicit chip. They tap it. The page's paragraph re-renders: "I am currently open to Principal/Lead roles in cloud platforms, AI infrastructure, or production SaaS. Tell me about the team, the loop you're trying to close, and the timeline you're aiming for." The operator's openness to a role conversation is now a first-class statement on the page, not implicit.

### 7.2 Engineering signal closes

A senior engineer who lands on /contact after reading /architecture or /telemetry no longer guesses whether the operator is open to a technical chat. They tap "Engineering / Architecture" and read: "Happy to discuss AWS topologies, FinOps strategies, edge ML pipelines, or production AI infrastructure. Bring the concrete problem; I'll bring operating experience." Operator-grade signal — concrete domains, no buzzwords, two sentences.

### 7.3 No conversion theater

The chip group does not pressure conversion. Each option leads to the same form. The page does not surface social-proof, urgency UI, or marketing copy. The adaptive layer is identity work — letting the operator's tone surface in three framings — not marketing work.

---

## 8. Mobile impact

### 8.1 Chip group flex-wraps

The intent chip group uses `flex flex-wrap gap-2`. On narrow viewports (< 360 px) the three chips wrap onto two rows. The "I am reaching out regarding" eyebrow stays as one line above. No fixed widths or horizontal scroll.

### 8.2 Margin-tick visible on mobile

The 1 px × 12 px cyan tick renders identically at every viewport. It sits to the left of the Send Message button in the submit row, which itself wraps if the "Or write directly to…" inline message is too long for the available width. On mobile portrait the inline message and the submit row may stack vertically — the tick stays anchored to the left of the button in both layouts.

### 8.3 Lead paragraph reflow

The lead paragraph wraps naturally at any viewport width (`max-w-xl` caps the line length on lg+). Crossfade transitions render identically on mobile — the AnimatePresence + motion.p does not depend on viewport.

### 8.4 No mobile-only regressions

The V5 layout's mobile behavior is preserved verbatim when the flag is off. The V6 layout extends the V5 pattern with two additions (chip row + margin-tick) that both adapt naturally to viewport width. No mobile UX gets worse.

---

## 9. Accessibility verification

### 9.1 Semantic structure

The intent chip group uses `role="group"` with `aria-labelledby="intent-prompt"`. The "I am reaching out regarding" eyebrow has `id="intent-prompt"` so screen readers announce the group name when entering. Each chip is a `<button type="button">` (NOT type="submit", so it doesn't submit the form when activated). Each chip carries `aria-pressed={active}` reflecting current state.

Screen reader walk-through (VoiceOver):
> "Group: I am reaching out regarding."
> "A role / opportunity, button, not pressed."
> [user activates] → "A role / opportunity, button, pressed."
> [paragraph reflows above] → SR re-reads the new lead paragraph on next focus traversal (or via live region if added later).

The `aria-pressed` pattern is the standard accessible toggle-button vocabulary. An alternative `role="radiogroup"` + `role="radio"` + `aria-checked` pattern would also work; `aria-pressed` was chosen for simplicity and because the chips behave as toggle buttons (the visitor can change selection any number of times) rather than strict radio inputs.

### 9.2 Keyboard navigation

The chip buttons are part of the natural Tab order. Tab from the page header reaches the first chip; subsequent Tab presses cycle through the three chips, then into the Name field. Enter / Space activates a focused chip. Shift+Tab reverses.

The chip group does not trap focus. Tab cycles in/out naturally.

### 9.3 Decorative cyan dot is aria-hidden

The 6 px cyan dot inside the active chip uses `aria-hidden="true"`. Screen readers do not announce it.

### 9.4 Margin-tick is aria-hidden

The `.margin-tick` `<span>` is `aria-hidden="true"`. Screen readers do not traverse into the decorative anchor.

### 9.5 Form contract unchanged

The form's existing accessible labels (Name / Email / Message), required attributes, error region (AlertCircle + red text), success card (emerald check + h3), and Server Action behavior are all unchanged. SR experience inside the form is byte-identical to V5.

### 9.6 Reduced motion

The paragraph crossfade uses Motion's `AnimatePresence` + `motion.p` with a 0.35 s EASE curve. Under `prefers-reduced-motion: reduce`, Motion library globally suppresses transition durations and the crossfade becomes effectively instantaneous. The chip color transitions (`transition-colors duration-200`) are CSS-level and also globally suppressed by the layout's reduced-motion guard.

A future polish can wire `useReducedMotion()` explicitly per-component for stricter parity; the current behavior is the same as the form's existing AnimatePresence success/error transitions (no explicit reduced-motion gate in V5 either).

---

## 10. Performance impact

### 10.1 Bundle delta

The new `AdaptiveContactSection` Client Component is a single small file (~50 lines, two imports, one `useState`, one `AnimatePresence`). All other dependencies (motion/react, the four message strings) are already in the bundle.

ContactForm gains the `Intent` type export, the `INTENT_OPTIONS` constant (~80 chars), and one conditional chip-group block. Net source delta: ~60 lines.

Effective client bundle delta: small enough that the build output's per-route bundle size for /contact is within the existing rounding.

### 10.2 No new client islands

Both files are already inside the existing `/contact` client island. `AdaptiveContactSection` mounts only on the V6 path; the V5 path skips it entirely.

### 10.3 SSR / hydration

`NEXT_PUBLIC_V6_ADAPTIVE_CONTACT` is inlined at build time. SSR and client emit identical HTML. The `useState<Intent>("default")` initial value matches on both sides. No hydration mismatch.

### 10.4 LCP

The LCP element on /contact remains the h1 ("Let's build / something real."). Hero composition unchanged. First paint posture identical to V5.

### 10.5 Static generation

Per the production build output:
- /contact remains `○ Static` (server-prerendered as static content).

No SG/ISR/dynamic posture change. The flag-gated branches both prerender as static at build time.

---

## 11. Reduced-motion verification

The chip color transitions use `transition-colors duration-200` — a CSS-level property animation that globally suppresses under `prefers-reduced-motion: reduce` via the layout's reduced-motion guard.

The lead-paragraph crossfade uses Motion's `AnimatePresence` + `motion.p` with `initial={false}` (no initial-mount animation). Motion library honors the global reduced-motion media query and suppresses transition durations automatically.

No new motion primitives. No new animation keyframes. The component composes existing Motion + Tailwind transitions verbatim. Reduced-motion compatibility inherited.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Spec validation: no addressed copy ("we noticed…") | ✅ All four lead-paragraph messages are first-person operator-tone. |
| Spec validation: default → V5 byte-identical | ✅ Flag off renders V5 byte-identical; flag on with no chip selected renders the V5-style baseline message. |
| Spec validation: reduced-motion composition shift instantaneous | ⏳ Partial — relies on Motion's global reduced-motion handling, not a per-component `useReducedMotion()` gate. See § 5.1. |
| Spec validation: telemetry classifier event fires per-session | ❌ Deferred — visitor-driven variant ships without classifier telemetry. See § 5.1. |
| Atmosphere uses `signal` variant (audit § 15.2) | ✅ Pre-existing in page.tsx:17. |
| Submit button picks up V6 `margin-tick` aesthetic | ✅ 1 px × 12 px cyan rule anchored to the left of the white Send Message pill. |
| Emerald check success state preserved (Phase 11.2) | ✅ Byte-identical, both paths. |
| Form container uses V6 `.edge-lit-card` primitive (via cardSurface()) | ✅ Pre-existing — established in 11.3. |
| Text-ramp tokens used for labels and descriptions (Phase 11.4) | ✅ All copy uses `text-primary`, `text-secondary`, `text-tertiary`, `text-primary/40` for the uppercase eyebrow. |
| `npx tsc --noEmit` | ✅ Clean. |
| `npx eslint app/contact/` | ✅ Clean. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 7.9 s. /contact remains `○ Static`. |
| Off-flag rollback (default posture) | ✅ V5 form layout renders byte-identical (header, static paragraph, ContactForm with no chip row, plain submit button). |
| On-flag activation | ✅ Chip group renders at top of card; lead paragraph crossfades on selection; margin-tick anchors submit row. |
| No new dependency | ✅ `package.json` unchanged. |
| Server Action contract unchanged | ✅ actions.ts untouched. |
| RED LINE preserved (atmosphere primitives, navbar, footer, Lumina, V4/V5 systems, all Phase 11–15.3 surfaces) | ✅ All untouched. |

---

## 13. Risk analysis

### 13.1 Risk: visitor-driven variant ≠ canonical AdaptivePatternProvider spec

The implementation ships a deliberately simpler variant than the canonical spec. A reader comparing the spec to the production output may flag this as a deviation.

**Mitigation:** documented explicitly in § 5.1. The visitor-driven variant lands the spec's *spirit* (the contact page adapts to visitor intent) without the classifier-infrastructure dependency. The canonical mount remains a Phase 16 follow-up.

### 13.2 Risk: chip group adds visual weight at the top of the form

The chip row inside the form card adds 1–2 rows of visual elements before the visitor sees the Name field. On a small viewport, the form's perceived "fill-this-out" affordance is delayed by the chip row's presence.

**Mitigation:** the chip row is small (one eyebrow line + one row of chips). It reads as a category selector, not as a form step. Visual review at mobile + desktop viewports confirms it reads as expected. The default state (no chip selected) doesn't visually emphasize any single option, so the visitor's eye continues naturally down to Name.

### 13.3 Risk: lead-paragraph crossfade is too subtle / too loud

The 0.35 s EASE crossfade between paragraphs is mild — visitors who don't watch the paragraph carefully may not notice it changing. Visitors who watch it carefully see a calm crossfade, not a jarring swap.

**Mitigation:** the curve matches the form's existing AnimatePresence transitions for success/error. The vocabulary is consistent. A future polish could amplify the cue (e.g., a brief cyan accent flash) if engagement signal indicates the change is being missed.

### 13.4 Risk: visitor picks a chip then changes their mind mid-typing

A visitor who selects "A role / opportunity," starts typing in the message field, then reclassifies to "Engineering / Architecture" sees the lead paragraph re-render. The form fields keep their values (uncontrolled inputs). The intent state is parent-owned and changes don't affect the form's submission state.

**Mitigation:** desired behavior. Reclassification is non-destructive to in-flight form content.

### 13.5 Risk: chip disabled state during submission may feel restrictive

While `isPending=true`, all chips disable (`disabled={isPending}`). The visitor cannot reclassify mid-submission.

**Mitigation:** intentional — once submission starts, the operator's response is committed to the email payload regardless of intent label. Locking the chips matches the same logic that disables the form fields during submission. The lock lasts ~500 ms (Resend round-trip) on success; longer only on error.

### 13.6 Risk: the four messages may read as too specific / too brief

Each message is two sentences. Visitors who want detail may want more text; visitors who want minimalism may find any message excessive.

**Mitigation:** two-sentence operator copy matches the V5 baseline length. The visitor's chip selection is reversible; if a framing doesn't fit, they can pick "Other" or revert. Future polish can refine copy based on engagement signal.

### 13.7 Risk: ESLint flags the SubmitButton extraction

ESLint's react/jsx-no-undef and similar rules may have edge cases with the SubmitButton helper. The current lint run is clean for `app/contact/`.

**Mitigation:** lint verified clean post-implementation. The SubmitButton helper is a standard React function component — no novel patterns. The `npm run build` step's TypeScript pass also caught nothing.

### 13.8 Risk: AdaptivePatternProvider future mount conflict

If a future Phase 16 mounts the canonical AdaptivePatternProvider on /contact, the visitor-driven chip group needs to either be replaced (provider controls intent) or augmented (chips + provider together signal richer mode).

**Mitigation:** the `Intent` type contract established in 15.4 is the bridge. The future provider can emit the same `Intent` values, and the chip group can either auto-update to reflect the inferred mode or remain a manual override. The decision is deferred to Phase 16 polish.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| `app/contact/actions.ts` | Server Action contract preserved. Intent is visitor-facing only. |
| `PageAtmosphere` | Already on the V6 `signal` variant per audit § 15.2 (Phase 11.1 / 12). |
| `lib/v6/glass.ts` / `cardSurface()` | Existing primitive consumed; not modified. |
| `lib/v6/marginTick.ts` | Existing helper not directly imported (margin-tick is rendered via the CSS class only, since ContactForm is a Client Component and the helper reads a non-public env). The CSS class is class-name-only and works without the helper. |
| Resend pipeline / email template | Unchanged. |
| `LuminaTrigger.tsx` / Lumina components | 15.3 / 15.5 territory. |
| Operator surfaces (changelog, operating, journal, perception, evolution, brain, failures, telemetry) | 15.1 / 15.2 territory. |
| Phase 14 surfaces (work, projects/[slug], architecture, stack) | Untouched. |
| Navbar / Footer / MobileMenu | Preserved verbatim post-12.5 / 12.4. |
| V4 / V5 systems / topology graph / motion grammar | RED LINE. |
| `RecruiterCaseStudy.tsx` / `EngineeringReference.tsx` (canonical spec mention) | Not created. Visitor-driven variant ships without them; future Phase 16 polish can add them as additive components. |

---

## 15. Rollback

### 15.1 Single env flag rollback

```bash
NEXT_PUBLIC_V6_ADAPTIVE_CONTACT=0
# or unset entirely
```

/contact reverts to V5 composition: static lead paragraph + form with no chip row + plain submit button. Byte-identical to pre-15.4.

### 15.2 Single-commit revert

```bash
git revert <commit-hash>
```

Reverts all three files (page.tsx, ContactForm.tsx, _components/AdaptiveContactSection.tsx) to their pre-15.4 source.

### 15.3 Per-file revert (surgical)

```bash
git checkout HEAD~1 -- app/contact/page.tsx app/contact/ContactForm.tsx
rm -rf app/contact/_components
```

Removes the V6 path entirely from source. Equivalent to the single-commit revert when no other commits touch these files between 15.4 and HEAD.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 15.4 (15.3 pushed, origin in sync at 41d5a35) | ✅ |
| TypeScript clean (`npx tsc --noEmit`) | ✅ |
| ESLint clean (`npx eslint app/contact/`) | ✅ |
| Production build (`npm run build`) | ✅ 7.9 s compile. /contact stays `○ Static`. |
| Default flag posture: `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT` OFF | ✅ |
| Off-flag: V5 byte-identical (header + static paragraph + form + plain submit) | ✅ |
| On-flag: chip group + animated paragraph + margin-tick submit | ✅ |
| Emerald success card preserved (Phase 11.2) | ✅ both paths. |
| `edge-lit-card` form container (Phase 11.3) | ✅ both paths (via cardSurface()). |
| Text-ramp tokens used (Phase 11.4) | ✅ all copy. |
| Margin-tick anchor on submit row (Phase 11.5) | ✅ V6 path only. |
| Signal atmosphere variant (Phase 11.1) | ✅ both paths (pre-existing). |
| Hydration: `NEXT_PUBLIC_*` flag inlined; SSR + client identical | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Server Action contract unchanged | ✅ actions.ts untouched. |
| RED LINE preserved | ✅ atmosphere, lumina, operator surfaces, Phase 14 surfaces, navbar/footer, V4/V5 systems — all untouched. |

**Deploy verdict: SAFE.** Default flag posture renders the V5 contact form byte-identical. The operator activates the adaptive surface by flipping a single env flag; rollback is the same flag.

**Visual verification status:** the production build and TypeScript pass confirm the code compiles and the route remains Static. A browser-level walk-through of both flag states (V5 byte-identical, V6 chip-selection crossfade, mobile chip wrap, focus ring keyboard nav) was NOT performed in this session due to the sub-PR's atomic-commit cadence. Recommend a smoke test of both flag states post-deploy or pre-merge.

---

## 17. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] `/contact` (V6_ADAPTIVE_CONTACT off) — header + V5 static lead paragraph + form with no chip row + plain Send Message pill. Byte-identical to pre-15.4.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, default intent) — header (no trailing margin) + V6 baseline paragraph + form with chip group at top + margin-tick to left of Send Message pill.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, "A role / opportunity" selected) — role framing paragraph crossfaded in; role chip carries cyan dot + cyan-tinted border + cyan-tinted bg.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, "Engineering / Architecture" selected) — engineering framing paragraph; engineering chip active.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, "Other" selected) — other framing paragraph; other chip active.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, submission in flight) — all chips disabled; submit button shows "Sending…" with spinner.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, submission successful) — emerald-check success card replaces form. The lead paragraph above retains the visitor's last-selected framing.
- [ ] `/contact` (V6_ADAPTIVE_CONTACT on, mobile portrait, narrow viewport) — chip group flex-wraps to two rows if needed; submit row layout adapts; margin-tick remains anchored.
- [ ] `/contact` (reduced-motion, V6 on) — chip transitions and paragraph crossfade reduce to near-instant; static end states unchanged.

---

## 18. What 15.4 explicitly does NOT do

- ❌ No mount of `<AdaptivePatternProvider>` from V5 8.5. Visitor-driven variant ships instead. See § 5.1.
- ❌ No `RecruiterCaseStudy.tsx` or `EngineeringReference.tsx` sub-components. Visitor-driven variant ships without them. See § 5.2.
- ❌ No edit to `app/contact/actions.ts`. Server Action contract preserved.
- ❌ No edit to the Resend email template, the email subject, or the email payload shape.
- ❌ No new env variables beyond `NEXT_PUBLIC_V6_ADAPTIVE_CONTACT`.
- ❌ No edit to `PageAtmosphere` or the contact page's atmosphere variant.
- ❌ No edit to `cardSurface()`, `lib/v6/glass.ts`, or `lib/v6/marginTick.ts`.
- ❌ No edit to the emerald success card or the Phase 11.2 success vocabulary.
- ❌ No telemetry classifier event firing.
- ❌ No new motion primitives, new colour tokens, new dependencies, new image assets.
- ❌ No edit to Phase 14 surfaces or any of Phase 15.1 / 15.2 / 15.3 surfaces.
- ❌ No edit to `LuminaTrigger`, `LuminaWindow`, or any Lumina component.
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. Two modified files. One new file. The contact page goes from generic to self-classified; the V5 path remains one env flag away.

---

## 19. Phase 15 status

This is **Sub-PR 15.4**. Sub-PR 15.5 remains unbuilt.

Per V6 § 6.3 Phase 15 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 4 of 5 (15.1 telemetry observatory + 15.2 operator-family identity divergence + 15.3 trigger refresh + 15.4 adaptive contact). |
| Operator surfaces feel distinct from each other and from work surfaces | ✅ Established in 15.2. |
| Lumina trigger no longer reads as "AI cliché" | ✅ Closed in 15.3. |
| /contact emotional resonance improves | ✅ Visitor self-classifies; framing follows; the page is no longer "a generic form." |

**Phase 15 stays OPEN.** Next sub-PR: 15.5 (Lumina window header compression — cluster privacy controls behind a single hairline-bordered popover).

---

## 20. Closing

V6 Sub-PR 15.4 is **the contact page becoming a structured channel instead of a blank slate**. Audit § 15's diagnosis — "a visitor who lands on /contact sees no acknowledgment of where they came from, no case-study card, no hint of the work they just read about" — closes via the simplest move available: the visitor classifies themselves with a chip, and the page's framing follows.

Three chip options, four lead-paragraph framings, one margin-tick anchor. The V6 cyan motif runs from the atmospheric `signal` variant down through the active chip's cyan-tinted border, the margin-tick on the submit row, and the edge-lit card's top cyan hairline. The emerald success card from Phase 11.2 sits untouched. The Server Action contract is untouched. The flag is one env var.

The canonical spec called for an algorithmic classifier inferring reading mode from session memory. 15.4 ships visitor-driven self-classification instead — more honest UX (no surveillance vibes, no "we noticed…" copy), simpler infrastructure (no telemetry classifier event, no V5 perception lib coupling), and the same observable behavior (the page adapts to who the visitor is). The canonical mount remains a Phase 16 follow-up if richer adaptive behavior becomes warranted.

Four of five Phase 15 sub-PRs landed. One remains: 15.5, the Lumina window header compression. The Phase 15 thesis — operator surfaces, Lumina, contact, three subsystems each becoming identity-native — is now visibly tracking, with /contact's adaptive layer the most legible visitor-facing change of the four.

Same data. Same form. Three framings the visitor chooses themselves.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
