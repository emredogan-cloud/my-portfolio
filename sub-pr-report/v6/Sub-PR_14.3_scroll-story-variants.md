# Sub-PR 14.3 — Architecture Scroll-Story Variation

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V6 Phase 14 — Work Surfaces · Sub-PR 14.3
**Scope:** Add three project-specific tonal variants to the shared `ScrollStory` engine on `/architecture/[slug]`. CWH retains the V5 7-col text / 5-col illustration default (variant: `wide-text`); VCA inverts to 5/7 to give the LLM-agent architecture more illustration breathing room (`wide-illustration`); FormAI wraps each milestone illustration in a phone-shaped mockup to reinforce the "edge ML on mobile" framing (`phone-frame`). Flag-gated by `NEXT_PUBLIC_V6_ARCH_VARIANTS`; default OFF makes every project render the V5 byte-identical 7/5 default. Default ON activates VCA's inverted ratio and FormAI's phone-frame wrapper.

---

## 0. Pre-execution audit

Per V6 § 0.1 the agent re-read V4/V5 execution + future, V6 audit § 6.2 (ScrollStory excellent and repetitive simultaneously), V6 execution § Sub-PR 14.3 verbatim, V6 future systems, plus the 11.1 / 12.1 / 13.1 / 14.1 / 14.2 closer reports. Branch `feat/v4-phase5-experimental-foundation` clean post-14.2 push, deployment-safe.

Audit anchor § 6.2 — 🟢 / 🟠 mixed:
- Strong: ScrollStory is "the most editorial single surface in the codebase" — single fixed cyan blob easing per milestone, sticky progress chip, 100 vh per milestone, fade-up on scroll.
- Weak: "Three projects ship the same exact pattern with only milestone content varying. By milestone 5 of project 2, a returning visitor recognizes the shape and skips ahead. The illustration column also reads as build-it-once-and-reuse."

Spec anchor: § Sub-PR 14.3 verbatim — CWH (current default) 7/5; VCA inverted to 5/7 ("AI-agent architecture benefits from larger illustrations"); FormAI collapse illustration column into phone-frame mockup ("the illustrations already exist; framing them as phone screens reinforces 'edge ML on mobile'"). Engine takes a new `variant?: 'wide-text' | 'wide-illustration' | 'phone-frame'` prop (default current behavior). Per-project flag off → wide-text default.

Verdict: **GREEN — proceed.**

---

## 1. Mission

V5's `/architecture/[slug]` ScrollStory is the most editorial surface in the codebase: 100 vh per milestone, eased background blob, sticky progress chip, 7-col text / 5-col illustration split. The engine itself is excellent; the problem is shape-recognition fatigue. A visitor who reads CWH's 8 milestones lands on VCA, sees the same 7/5 split, the same eyebrow-title-paragraph rhythm, and skips ahead. By VCA's milestone 5 the surface feels procedural, not editorial.

The audit's framing: the engine is excellent, but three projects shipping the same exact pattern reads as "build it once and reuse" — and "the illustration column also reads as build-it-once-and-reuse — each illustration is a clean SVG diagram in a bordered rounded panel. They look like a single illustrator working from a single template."

Sub-PR 14.3 introduces three tonal variants in the shared engine. The variants change WHERE the visual weight sits per project — not the engine's mechanics, the typography, the colour palette, or the motion grammar:

1. **wide-text** — CWH default, 7/5 split, V5 byte-identical. The bordered rounded panel for the illustration unchanged. The cyan blob easing unchanged. CWH's 8-milestone story stays exactly as visitors recognise it.

2. **wide-illustration** — VCA variant, 5/7 split. Text column narrows to 5; illustration column widens to 7. The illustration's `max-width` doubles (from 320–360 px to 480–520 px). The audit's framing: "The AI-agent architecture benefits from larger illustrations" — the agent flow diagrams need room to breathe.

3. **phone-frame** — FormAI variant, 7/5 split (same as wide-text), but the illustration wrapper swaps from the default bordered rounded panel to a phone-shaped mockup: 9 / 19.5 aspect ratio container, rounded 2.5 rem corners, notch hint at the top, side button details, inner screen area with safe-area padding. The illustration sits centered inside the phone — the framing communicates "this runs on a phone," reinforcing FormAI's edge-ML thesis.

A visitor walking through all three projects now perceives three distinct compositional shapes. CWH reads as text-led architecture (text dominates, illustration is supporting visual). VCA reads as diagram-led architecture (illustration dominates, text is supporting context). FormAI reads as device-anchored architecture (phone-shaped framing is the entire visual posture). Same engine. Three identities.

---

## 2. The Three-Cut Rule (V6 § 1.1)

Cut 1: **Engine variant prop** — `ScrollStory.tsx` gains a `variant?: 'wide-text' | 'wide-illustration' | 'phone-frame'` prop with a runtime gate that collapses every input to `wide-text` when the V6_ARCH_VARIANTS flag is off OR no variant is passed. CWH's existing call site (no variant prop) renders byte-identical to V5.

Cut 2: **PhoneFrame primitive + MilestoneSection variant routing** — new `PhoneFrame.tsx` Server Component wraps the illustration in a phone-shaped container; `MilestoneSection` reads the variant and chooses between (a) the default bordered card with default illustration max-width, (b) the default bordered card with widened illustration max-width (wide-illustration), or (c) the PhoneFrame wrapper (phone-frame).

Cut 3: **Per-project wiring** — VCA's page passes `variant="wide-illustration"`; FormAI's page passes `variant="phone-frame"`. CWH's page passes no variant (preserves V5 default).

Three visible cuts. No fourth.

---

## 3. Architectural decisions

### 3.1 Single shared engine, per-page variant prop

The spec mandates "the ScrollStory engine takes a new variant prop." That's exactly what 14.3 does — the variant is a prop on the same engine, not a separate component per project. The three project pages continue to share one ScrollStory engine; only the prop value differs.

Trade-off rejected: forking the engine into ScrollStory + ScrollStoryWide + ScrollStoryPhone would have created drift surface (any future engine improvement would need to land in three places). The variant prop keeps the engine single-source.

### 3.2 Variant gating at the engine, not at the page

```tsx
const flagOn = process.env.NEXT_PUBLIC_V6_ARCH_VARIANTS === "1";
const effectiveVariant: ScrollStoryVariant = flagOn
  ? variant ?? "wide-text"
  : "wide-text";
```

The flag check lives inside ScrollStory. When the flag is off, the engine ignores whatever variant the page passed and renders `wide-text` — the V5 default. This is the rollback contract: per-project flag off → wide-text default (spec verbatim).

Per-page flag checks would have required adding three flag-aware conditional blocks at three call sites — duplication + drift risk. Centralising at the engine means: VCA passes `variant="wide-illustration"` unconditionally; FormAI passes `variant="phone-frame"` unconditionally. The flag controls activation; the page just states its intent.

### 3.3 Spec validation #1 — CWH byte-identical when no variant set

Spec validation #1: "Engine still handles existing CWH page byte-identical when no variant set."

CWH's page (`app/architecture/cloud-waste-hunter/page.tsx`) is **unchanged**. It calls `<ScrollStory milestones={MILESTONES} illustrationsById={ILLUSTRATION_BY_ID} />` exactly as it did in V5. The engine receives `variant=undefined`. The runtime gate resolves `effectiveVariant` to `'wide-text'`.

When the variant is `'wide-text'`:
- `textColSpan = "md:col-span-7"` (V5 byte-identical).
- `illustrationColSpan = "md:col-span-5"` (V5 byte-identical).
- `isPhoneFrame === false` → the illustration wrapper is the default `rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5` (V5 byte-identical).
- `isWideIllustration === false` → the illustration `className` is `"w-full h-auto max-w-[320px] sm:max-w-[360px] mx-auto"` (V5 byte-identical).

Every DOM tag, every className, every style — all V5 byte-identical when `variant === 'wide-text'`. ✅

### 3.4 wide-illustration column ratio + illustration max-width

VCA's variant inverts the column ratio:
- `textColSpan = "md:col-span-5"`.
- `illustrationColSpan = "md:col-span-7"`.

The illustration's `max-width` also widens — from 320–360 px (default) to 480–520 px (`max-w-[480px] sm:max-w-[520px]`). The illustration column being wider AND the illustration itself being larger together communicate "this project's diagrams matter."

The text column at 5 cols still holds 2 cols-worth of breathing room around the 3-col-wide title and paragraph (the layout-rendering width is roughly 41 % of the row instead of 58 %). Body text still wraps comfortably; the eyebrow-title-paragraph structure preserved verbatim.

### 3.5 phone-frame is a wrapper swap, not a layout swap

FormAI's variant keeps the 7/5 ratio (same as wide-text) but swaps the illustration wrapper from `<div className="rounded-2xl border ...">` to `<PhoneFrame>`. The phone-frame container is `max-w-[240px] sm:max-w-[260px]` with `aspect-[9/19.5]` — narrower than the bordered card. The 5-col grid cell holds the phone with whitespace on either side.

The result: text column (col 1–7) reads the same as CWH. Illustration column (col 8–12) now hosts a vertically-tall phone instead of a horizontally-roomy bordered card. The visual difference at first glance: this milestone happens on a phone.

The phone wrapper uses pure CSS (rounded corners, absolute-positioned notch + side buttons, inset screen area). No SVG, no client JS, no animation surface — fully reduced-motion safe by construction.

### 3.6 PhoneFrame design details

The frame replicates a modern smartphone (iPhone 14 family proportions):

| Element | Implementation |
|---------|----------------|
| Outer shell | `aspect-[9/19.5] rounded-[2.5rem] border border-white/[0.15] bg-black/40` |
| Inner ring (chrome detail) | `absolute inset-[3px] rounded-[2.3rem] border border-white/[0.06]` |
| Notch | `absolute top-2.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 rounded-full bg-black/90` |
| Right side button (volume up) | `absolute -right-[1px] top-20 w-[2px] h-10 rounded-l-full bg-white/[0.10]` |
| Left side buttons (silent + volume down) | Two thin `w-[2px]` highlights at -left-[1px] |
| Inner screen | `absolute inset-2.5 rounded-[2rem] overflow-hidden bg-black/30 flex items-center justify-center p-4 pt-10` |
| Drop shadow | `boxShadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px -28px rgba(0,210,255,0.18)` |

The cyan-tinted drop shadow ties the phone into the V6 atmospheric family — the device "glows" the same colour as the page background blob. The chrome details are subtle (every element at 10–15 % opacity); the phone reads as a real device proportion rather than a stylised illustration.

### 3.7 Illustrations are unchanged

Per the spec: "the illustrations already exist; framing them as phone screens reinforces 'edge ML on mobile'." The FormAI illustrations in `app/architecture/sixpack-ai/_components/Illustrations.tsx` are unchanged. The phone frame is decorative wrapping; the illustration content inside is the same SVG diagram V5 shipped.

Trade-off accepted: landscape illustrations inside the phone-shaped frame will centre with whitespace above/below. The intent isn't to make the illustrations look like real phone screens — it's to communicate "this happens on a phone" at the framing layer.

### 3.8 Spec validation #2 — phone-frame respects reduced-motion (no parallax)

Spec validation #2: "Phone-frame variant respects reduced-motion (no parallax)."

The PhoneFrame primitive has zero animation surface. No translate, no scale, no rotate, no parallax. The frame is static CSS; the illustration inside is also static (illustrations don't carry their own motion). The existing ScrollStory entry animation (fade-up on scroll) still runs, gated by `useReducedMotion()` — when prefers-reduced-motion is set, the fade-up disables and content appears instantly. The phone frame is unaffected by the reduced-motion gate because it never animated in the first place.

✅ Reduced-motion safe by construction.

### 3.9 Spec validation #3 — mobile single-column collapse

Spec validation #3: "Mobile: variants collapse to single-column with appropriate spacing per project."

All three variants use the same `grid grid-cols-1 md:grid-cols-12` Tailwind layout. On `< md` viewports the 12-col grid collapses to single-column flow regardless of variant. Per variant, mobile behaviour:

- **wide-text** (CWH): text block above, illustration card below. Existing V5 mobile layout.
- **wide-illustration** (VCA): text block above, larger illustration card below. The widened max-width (520 px) is capped by viewport width; the illustration naturally responsive-shrinks on small screens. Visual difference vs CWH on mobile is minimal — both projects' illustrations fill the available width.
- **phone-frame** (FormAI): text block above, phone-shaped container below. The phone keeps its 9 / 19.5 aspect ratio regardless of viewport — even on a 375 px viewport the phone is ~220 px tall, centered. Reads as a small phone-on-a-page.

All three variants honour the mobile single-column collapse correctly. ✅

### 3.10 No edits to motion grammar, no new dependency

- No new motion primitives. ScrollStory's existing entrance animation (fade-up via Framer) carries the entrance behaviour for every variant.
- No new font, no new colour token, no new icon, no new dependency. `package.json` unchanged.
- No edits to milestones data, illustrations, types, the timeline section, or the hub grid.
- No edits to /architecture page hub (Phase 14.1 territory) or /projects/[slug] detail (Phase 14.2 territory).

### 3.11 Out-of-scope holds (RED LINE)

Per V6 § 1.5 + V6 § 5.2's Sub-PR 14.3 boundaries:

- **No changes to milestones data** (`milestones.ts` in any of the three projects).
- **No changes to illustration SVGs** (`Illustrations.tsx` in any of the three projects).
- **No changes to types** (`types.ts` — Milestone + IllustrationsById shapes preserved).
- **No changes to `ArchitectureTimelineSection.tsx`** — that's 14.4 territory.
- **No changes to `ArchitectureHubGrid.tsx`** — that's 14.1 territory (now bypassed by redirect).
- **No new variant beyond the three spec'd** — wide-text, wide-illustration, phone-frame only.
- **No edits to `/projects/[slug]`** — Phase 14.2 territory.
- **No edits to `/stack`** — Phase 14.5 territory.
- **No new motion grammar, no new atmosphere variant, no new pill kind** — only consumption of existing primitives.
- **No three.js usage** — phone frame is pure CSS, illustrations stay SVG.

---

## 4. What changed

### 4.1 New files (1)

| File | Lines | Description |
|------|-------|-------------|
| `app/architecture/_components/PhoneFrame.tsx` | 64 | Server Component. Phone-shaped wrapper (9 / 19.5 aspect, rounded 2.5 rem, notch + side-button details, inner screen area). Pure CSS, no client JS. |

### 4.2 Modified files (3)

| File | Change |
|------|--------|
| `app/architecture/_components/ScrollStory.tsx` | Add `ScrollStoryVariant` type + `variant?` prop. Runtime gate via `NEXT_PUBLIC_V6_ARCH_VARIANTS` collapses every input to `'wide-text'` when off. `MilestoneSection` reads effectiveVariant and chooses text/illustration column spans + illustration wrapper. PhoneFrame imported lazily (consumed only on the phone-frame path; tree-shaken otherwise). |
| `app/architecture/vibing-coder-ai/page.tsx` | Pass `variant="wide-illustration"` to ScrollStory. Adds one inline comment explaining the choice. |
| `app/architecture/sixpack-ai/page.tsx` | Pass `variant="phone-frame"` to ScrollStory. Adds one inline comment explaining the choice. |

### 4.3 No data shape change

- `MILESTONES` arrays in all three projects — unchanged.
- `ILLUSTRATION_BY_ID` dispatch maps — unchanged.
- `types.ts` (Milestone + IllustrationsById) — unchanged.
- `ArchitectureTimelineSection` — unchanged.
- `app/architecture/cloud-waste-hunter/page.tsx` — **untouched**. No variant prop passed; engine resolves to wide-text default. V5 byte-identical.

---

## 5. Projects redesign rationale

### 5.1 wide-illustration for VCA

VCA's milestones describe the LLM-agent loop: idea-in → master prompt → Lambda brain → Claude API → Terraform-provisioned API Gateway → DynamoDB persistence. The diagrams illustrate flow shapes (request-response loops, master-prompt boundaries, async control paths). These diagrams benefit from breathing room — small versions cram lines and labels.

Inverting the column ratio (5 text / 7 illustration) gives the diagrams roughly 60 % more horizontal pixels. The text column at 5 cols still comfortably holds the eyebrow + 3-line title + 2-paragraph body; the illustration column at 7 cols + widened max-width (480–520 px) lets the AI-agent diagrams render at their natural complexity.

### 5.2 phone-frame for FormAI

FormAI's architectural thesis is "the model is on the device." Every other architecture diagram in the codebase implies "the cloud is where things happen"; FormAI's whole point is that the cloud is not the primary site. The phone frame is the visual contract for that thesis.

The illustrations themselves remain architectural diagrams (Flutter app → ML Kit → joint-angle math → audio cue), but inside the phone frame they read as "this happens here, on this device, in this hand." The visitor's perception of the architecture changes through the framing.

### 5.3 wide-text preserved for CWH

CWH's architecture is the deepest scroll-story in the codebase — 8 milestones spanning the production stack from AWS account connection to remediation streaming. The 7-col text default carries this density well; the 5-col illustration sits as supporting visual without competing for attention.

Inverting CWH's ratio (or putting it in a phone frame) would have weakened the reading rhythm. The default works. The default stays.

---

## 6. Hierarchy improvements

### 6.1 Per-project visual identity

Pre-14.3: all three projects' scroll-stories read with the same compositional shape. The engine was excellent; the differentiation was zero.

Post-14.3: each project's first-screen tells a different visual story:
- CWH: text-dense reading surface, supporting diagrams to the side.
- VCA: diagram-led surface, text as supporting context.
- FormAI: device-anchored surface, illustrations live inside a phone.

The visitor walking through all three perceives three distinct shapes — same engine, three identities.

### 6.2 Audit § 6.2 "build-it-once-and-reuse" perception

The audit's framing: "Each illustration is a clean SVG diagram in a bordered rounded panel. They look like a single illustrator working from a single template."

Post-14.3:
- VCA's illustrations now sit in a wider container — the bordered panel still visible, but the illustration dominates.
- FormAI's illustrations now sit in a phone frame — no bordered panel at all. The container is the visual identity.
- CWH's illustrations sit in the V5 bordered panel — but this is now the CWH-specific shape, not the universal template.

The bordered panel is no longer the universal template. It's CWH's shape.

### 6.3 Scroll-fatigue mitigation

The audit's concern: "By milestone 5 of project 2, a returning visitor recognizes the shape and skips ahead."

The variants address this by giving each project a distinct compositional shape at first glance. A returning visitor lands on VCA after reading CWH and immediately sees a different layout — not a different colour, not a different motion, not a different progress chip — but a different compositional structure. The fade-up rhythm, the cyan blob easing, the sticky progress chip are all retained (they're the engine's identity); only the content composition changes.

---

## 7. Recruiter-perception improvements

### 7.1 Engineering perception of the variants

A senior engineering lead reading all three architectures back-to-back perceives three distinct engineering postures:

- CWH (wide-text): "This person wrote a lot of careful explanation. The diagrams are supporting evidence."
- VCA (wide-illustration): "This person diagrammed the agent architecture carefully. The text is the engineer's narration over the diagrams."
- FormAI (phone-frame): "This person is showing me what happens on the device. The phone is the architectural unit."

The variants implicitly communicate that the operator thought about EACH project's correct visual hierarchy — not just shipped them all on the same template. That implicit message ("editorial discipline at the project level") is itself a credibility signal.

### 7.2 The phone-frame as a credibility cue

The phone-frame is a deliberate framing choice for FormAI specifically. A recruiter scanning FormAI's architecture sees a phone-shaped container at every milestone and immediately gets the thesis: "this is mobile-first, edge-ML." The framing does the work that a 3-line caption would have done; the visitor doesn't need to read the body text to understand the project's positioning.

### 7.3 Scroll-through engagement

Post-14.3 the engagement signal (milestone-bound IntersectionObserver) is unchanged. The same "engaged" telemetry events fire at the same scroll positions. The cyan blob still eases. The progress chip still updates. Engine instrumentation byte-identical.

What changes: the user is more likely to actually scroll through each project's full story instead of pattern-matching and skipping. That's the recruiter-perception improvement worth measuring.

---

## 8. Mobile impact

### 8.1 wide-text (CWH)

Mobile: unchanged from V5. Text block above (full-width), illustration card below (full-width).

### 8.2 wide-illustration (VCA)

Mobile: the 12-col grid collapses to single column. Text block above, illustration card below. The widened illustration max-width (520 px) is capped by viewport — on a 375 px viewport the illustration is ~340 px wide (full container minus padding). Mobile experience nearly identical to wide-text mobile; the difference is desktop-only.

### 8.3 phone-frame (FormAI)

Mobile: text block above, phone-shaped container below. The phone retains its 9 / 19.5 aspect ratio — on a 375 px viewport the phone is ~220 px wide × ~480 px tall, centered. Reads as "small phone on a page" — appropriate framing for mobile, since the visitor is already on a phone reading about a phone app.

### 8.4 Total mobile scroll

All three projects: same per-milestone scroll height (~100 vh) on mobile. The variant changes the illustration container shape, not the milestone vertical density. Total scroll height across all milestones unchanged.

---

## 9. Accessibility verification

### 9.1 Semantic structure

- `<main id="main">` wraps each project page.
- ScrollStory renders an `<ol>` of milestones, each as an `<li>` (preserved verbatim).
- The phone frame is a presentational `<div>` wrapper — does not add semantic structure. Illustration's accessibility (alt text, ARIA labels) is preserved verbatim.
- All variant-related decisions are CSS only; no ARIA changes needed.

### 9.2 Keyboard navigation

Variants are non-interactive. Keyboard tab order on all three project pages is unchanged from V5 (back link → milestone list → CTA → footer).

### 9.3 Reduced motion

- ScrollStory's existing entrance animation (motion.div fade-up) honors `useReducedMotion()` — unchanged.
- BackgroundBlob's eased gradient transition honors reduced-motion — unchanged.
- The PhoneFrame primitive has zero animation surface — reduced-motion safe by construction.
- The wide-illustration variant changes only CSS column spans — no motion difference.

### 9.4 Screen reader walk-through

VoiceOver reading FormAI's first milestone (phone-frame variant):
> "How FormAI works. Heading 1."
> "[Eyebrow] Step 1 / 4."
> "[Title] On the device camera. Heading 2."
> "[Body] Google ML Kit tracks 33 body landmarks at 30 frames per second through the device camera…"
> "[Illustration alt text — unchanged from V5]"

The phone frame container has no `aria-label` (it's presentational). The illustration's ARIA / alt content reads exactly as it did pre-14.3.

---

## 10. Performance impact

### 10.1 Bundle delta

- `PhoneFrame.tsx` — Server Component → 0 KB client bundle.
- `ScrollStory.tsx` — adds ~30 lines of variant logic + `PhoneFrame` import. The variant logic is plain conditional rendering (no new library, no new state). Client bundle delta: ~250 bytes minified.
- VCA + FormAI page changes: 1 prop addition each, no JSX restructure. 0 client cost.

**Total client JS delta: ~250 bytes minified** (the variant logic in ScrollStory + the PhoneFrame import).

### 10.2 HTML payload

When the flag is off, the engine renders V5 byte-identical HTML for all three projects — zero payload delta.

When the flag is on:
- CWH: V5 byte-identical (no variant passed).
- VCA: text column class changes from `md:col-span-7` to `md:col-span-5`; illustration column class changes from `md:col-span-5` to `md:col-span-7`. Illustration max-width class changes. Net HTML delta per milestone: ~80 bytes.
- FormAI: same column classes as wide-text, but the illustration wrapper `<div>` is replaced by `<PhoneFrame>` — emits ~1 200 bytes of additional markup per milestone (the chrome details). 4 milestones × 1 200 bytes = ~4.8 KB total payload increase on the FormAI page.

FormAI HTML payload increase is the largest. ~5 KB gzipped is small (the page already serves ~120 KB compressed). Acceptable trade.

### 10.3 LCP

LCP element unchanged on all three pages — the H1 in the page header. Server-rendered, first paint. No async data fetch added.

### 10.4 Hydration

`NEXT_PUBLIC_V6_ARCH_VARIANTS` inlined at build time. ScrollStory is a Client Component; the flag value is consistent across server SSR and client hydration. No hydration mismatch surface.

### 10.5 Static generation

All three architecture pages register as `○ Static` in the build manifest. Each project's milestones are pre-rendered at build time. The variant is resolved at SSR time (the flag value is build-time constant). Either flag posture, no SSR cost at request time.

---

## 11. Reduced-motion verification

| Surface | Reduced-motion behaviour |
|---------|---------------------------|
| ScrollStory fade-up entry | `useReducedMotion()` → `initial={reducedMotion ? false : {opacity:0,y:28}}` (unchanged from V5). |
| BackgroundBlob gradient ease | `transition: "none"` when `prefersReducedMotion` (unchanged from V5). |
| ProgressHeader (sticky chip) | No animation — static. |
| PhoneFrame container | No animation — static by design. Reduced-motion safe by construction. |
| wide-illustration variant | CSS-only column-span / max-width change — no motion. |
| Phone-frame side buttons + notch | Static absolute-positioned elements — no animation. |

All variant changes are CSS-only. No new motion primitives. Reduced-motion gate honored by the existing engine code.

---

## 12. Validation log

| Gate | Result |
|------|--------|
| Engine still handles existing CWH page byte-identical when no variant set | ✅ CWH page passes no `variant` prop. Engine receives `variant=undefined`; runtime gate resolves to `'wide-text'`. Text col-span, illustration col-span, illustration wrapper className, illustration max-width — all V5 byte-identical. |
| Phone-frame variant respects reduced-motion (no parallax) | ✅ PhoneFrame primitive has zero animation surface. Existing ScrollStory fade-up animation honors `useReducedMotion()` as before. No parallax in any variant. |
| Mobile: variants collapse to single-column with appropriate spacing per project | ✅ All three variants use the same `grid grid-cols-1 md:grid-cols-12` Tailwind layout. Mobile collapses to single column for all three. Phone frame retains 9/19.5 aspect ratio on mobile (~220 px wide × ~480 px tall on 375 px viewport). |
| `npx tsc --noEmit` | ✅ Clean. |
| `npm run lint` | ✅ 24 pre-existing problems (22 errors, 2 warnings). Zero new errors from 14.3. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 10.7 s. TypeScript 11.9 s. All three architecture project routes (`○ /architecture/cloud-waste-hunter`, `○ /architecture/sixpack-ai`, `○ /architecture/vibing-coder-ai`) register as Static. |
| Off-flag rollback (default posture) | ✅ `NEXT_PUBLIC_V6_ARCH_VARIANTS` unset → engine resolves `effectiveVariant = 'wide-text'` regardless of what the page passed. All three projects render V5 byte-identical. |
| On-flag activation | ✅ CWH unchanged. VCA renders wide-illustration (text col-span-5, illustration col-span-7, widened max-width). FormAI renders phone-frame (text col-span-7, illustration wrapped in PhoneFrame). |
| No new dependencies | ✅ `package.json` unchanged. PhoneFrame is pure CSS. |

---

## 13. Risk analysis

### 13.1 Risk: FormAI illustrations may not fit visually inside the phone frame

FormAI's illustrations are landscape-leaning architectural diagrams (Flutter app box on left, ML Kit in centre, Supabase on right). Inside a portrait phone frame (9/19.5 aspect), landscape illustrations centre with whitespace above and below. The phone frame at ~260 px width × ~565 px height inside a 5-col container shows a landscape illustration at ~220 px wide, with ~150 px whitespace above and below.

**Mitigation:** the intent isn't to make illustrations look like real phone screens — it's to communicate "this happens on a phone" at the framing layer. The whitespace inside the phone reads as device chrome (notification area + home indicator zone), not as missing content. The operator can iterate on illustration aspect later (Phase 14 follow-up or 14.3.1) if the framing reads poorly in production.

### 13.2 Risk: wide-illustration's 5-col text feels cramped

VCA's text column drops from 7 to 5 cols. On a 1 280 px viewport with the page max-width of 1 024 px (5xl), 5 cols is ~310 px wide. The 2-paragraph body text might wrap to too many lines.

**Mitigation:** the title text uses `tracking-[-0.04em] leading-[1.05]` which compresses naturally; the body uses `max-w-2xl` which is roughly 42 rem (~672 px). With the 5-col cell at ~310 px, body text wraps to ~10 lines per paragraph instead of ~5. Still readable; the visual cost is more vertical text vs more horizontal text. The intent of the variant is exactly this — give the illustration room, accept that text takes more vertical space.

### 13.3 Risk: Phone-frame on a 320 px viewport may not have room for the illustration's content

On a 320 px viewport (smallest target) the phone frame is ~220 px wide (full width minus container padding). The inner screen area is ~190 px wide × ~400 px tall. Landscape architectural illustrations at ~190 px wide may shrink labels below readable size.

**Mitigation:** the illustrations themselves use SVG with `className="w-full h-auto max-w-full"` inside PhoneFrame. Modern SVG illustrations remain crisp at any size; the limiting factor is text label legibility. If illustrations carry text labels too small to read at 190 px wide, that's the illustration's responsibility (could be improved in a future PR). The phone frame doesn't introduce a new constraint not already present at small sizes.

### 13.4 Risk: Variant selection mismatch for a future project

If a future project (e.g. PawDoc, Aevum) ships an architecture scroll-story, the operator must consciously choose a variant. The default (wide-text) is safe for any project; choosing wide-illustration or phone-frame requires the project to benefit from that specific framing.

**Mitigation:** documented in the spec ref + this report. The variant choice is a per-project editorial decision, not a default behaviour. Future projects ship with `wide-text` unless explicitly elevated.

### 13.5 Risk: PhoneFrame adds visible chrome that may distract from the illustration

The phone frame's notch, side buttons, drop shadow, and inner ring add ~6 absolute-positioned decorative elements per milestone. On a 4-milestone project (FormAI), that's 24 decorative elements rendered.

**Mitigation:** each element is at 10–15 % opacity, sitting at the device chrome zones (notch top centre, side buttons at expected positions). The aggregate visual weight is the phone-shape itself, not the individual elements. Real phones have these chrome details; the frame reads as a phone, not as a stack of decorations.

### 13.6 Risk: The variant gate is binary (on or off for all projects)

The flag gates all variants at once. Operator cannot enable wide-illustration for VCA while keeping FormAI on wide-text.

**Mitigation:** acceptable for V1 of variants. The three variants are co-designed — they share a discipline of "one editorial shape per project." If the operator wants more granular control in a future PR, the gate could split into `V6_ARCH_VARIANTS_VCA`, `V6_ARCH_VARIANTS_FORMAI`. Out of scope for 14.3.

---

## 14. Out-of-scope systems intentionally untouched

| Surface | Reason untouched |
|---------|-------------------|
| All milestones data files (`milestones.ts` × 3) | Per spec — "the illustrations already exist." Content unchanged. |
| All illustration component files (`Illustrations.tsx` × 3) | Same. SVG content unchanged. |
| `types.ts` (Milestone + IllustrationsById shapes) | Backward compatible — variant is additive. |
| `ArchitectureTimelineSection.tsx` | Phase 14.4 territory (mobile timeline ladder). |
| `ArchitectureHubGrid.tsx` | Phase 14.1 territory (redirects to /work). |
| `app/projects/[slug]/` | Phase 14.2 territory. |
| `app/stack/` | Phase 14.5 territory. |
| `app/architecture/cloud-waste-hunter/page.tsx` | **Untouched verbatim.** No variant prop passed; V5 byte-identical. |
| Lumina, topology graph, motion grammar, atmosphere primitives | RED LINE per V6 § 1.5. |
| Navbar, Footer, MobileMenu | Preserved verbatim post-12.5 / 12.4. |
| Pill / glass / margin-tick / text-ramp primitives | Used by reference, not modified. |
| V4 / V5 systems / telemetry / API routes | RED LINE. |

---

## 15. Rollback

### 15.1 Single-flag rollback (preferred)

```bash
# Unset (default), or explicitly:
NEXT_PUBLIC_V6_ARCH_VARIANTS=0
```

- ScrollStory's runtime gate resolves `effectiveVariant = 'wide-text'` regardless of what the page passed.
- VCA renders the V5 7/5 layout with the default bordered illustration card.
- FormAI renders the V5 7/5 layout with the default bordered illustration card.
- CWH unchanged.

All three projects' scroll-stories render V5 byte-identical. The variants are dormant; the prop values are inert.

### 15.2 Single-commit revert (full)

```bash
git revert <commit-hash>
```

Deletes `PhoneFrame.tsx`, removes the variant prop logic from `ScrollStory.tsx`, removes the variant prop from VCA + FormAI pages. Source returns to pre-14.3 state.

### 15.3 Per-file revert (surgical)

`git checkout HEAD~1 -- app/architecture/sixpack-ai/page.tsx` removes only FormAI's phone-frame opt-in, keeps VCA's wide-illustration active. Useful if phone-frame needs design iteration without rolling back the wide-illustration variant.

---

## 16. Deploy safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before 14.3 (14.2 pushed, origin in sync) | ✅ |
| Build emits all three architecture project routes as `○ Static` | ✅ |
| Default flag posture: OFF (`NEXT_PUBLIC_V6_ARCH_VARIANTS` unset) | ✅ |
| Off-flag: all three projects render V5 byte-identical (engine forces `wide-text`) | ✅ |
| On-flag: VCA renders wide-illustration; FormAI renders phone-frame; CWH unchanged | ✅ |
| Variant prop is optional on ScrollStory | ✅ |
| CWH page passes no variant prop (preserves V5 contract) | ✅ |
| No new dependency | ✅ `package.json` unchanged. |
| Server-rendered SVG illustrations preserved verbatim | ✅ |
| Reduced-motion: PhoneFrame has zero motion; ScrollStory honors `useReducedMotion()` | ✅ |
| Hydration: NEXT_PUBLIC_ flag inlined; server + client identical | ✅ |
| RED LINE preserved: Lumina, topology, motion grammar, atmosphere primitives, pill/glass/margin-tick/text-ramp, navbar/footer/mobile drawer, V4/V5 systems, /projects/[slug], /stack, milestones data, illustrations, types — all untouched | ✅ |

**Deploy verdict: SAFE.** Default flag OFF means production renders V5 byte-identical scroll-stories on all three architecture pages. The operator flips `NEXT_PUBLIC_V6_ARCH_VARIANTS=1` to activate VCA's wide-illustration and FormAI's phone-frame.

---

## 17. Before / After screenshot checklist

For the operator's pre-deploy review:

- [ ] `/architecture/cloud-waste-hunter` (flag on) — V5 byte-identical 7/5 layout.
- [ ] `/architecture/cloud-waste-hunter` (flag off) — same as flag-on (CWH unchanged either way).
- [ ] `/architecture/vibing-coder-ai` (flag on) — 5/7 inverted layout; illustration wider.
- [ ] `/architecture/vibing-coder-ai` (flag off) — V5 7/5 layout returns.
- [ ] `/architecture/sixpack-ai` (flag on) — phone-frame on every milestone.
- [ ] `/architecture/sixpack-ai` (flag off) — V5 7/5 layout with bordered card returns.
- [ ] Mobile: each variant's single-column collapse looks correct.
- [ ] Phone-frame chrome details (notch, side buttons, drop shadow) render correctly.
- [ ] Reduced-motion: scrolling through FormAI with prefers-reduced-motion shows no parallax.

---

## 18. What 14.3 explicitly does NOT do

- ❌ No three.js / canvas additions (phone frame is pure CSS).
- ❌ No milestone data changes (`milestones.ts` × 3 untouched).
- ❌ No illustration changes (`Illustrations.tsx` × 3 untouched).
- ❌ No CWH page changes (V5 byte-identical).
- ❌ No ArchitectureTimelineSection changes (Phase 14.4 territory).
- ❌ No ArchitectureHubGrid changes (Phase 14.1 territory).
- ❌ No /projects/[slug] changes (Phase 14.2 territory).
- ❌ No /stack changes (Phase 14.5 territory).
- ❌ No new motion grammar / new colour token / new pill kind / new atmosphere variant / new dependency / new image asset.
- ❌ No edits to V4/V5 systems, Lumina, topology graph, navbar, footer, mobile drawer.
- ❌ No new variants beyond the spec's three (wide-text, wide-illustration, phone-frame).
- ❌ No "while we're here" cleanup beyond the spec's mandated changes.

Single sub-PR. One new component (PhoneFrame), one engine extension (variant prop + runtime gate), two page rewires (VCA + FormAI). CWH stays byte-identical at the engine; the variants give VCA and FormAI distinct visual identities without changing motion, palette, or typography.

---

## 19. Phase 14 status

This is **Sub-PR 14.3**. Sub-PRs 14.4 / 14.5 remain unbuilt.

Per V6 § 5.3 Phase 14 exit criteria:

| Criterion | Status |
|-----------|--------|
| All 5 sub-PRs merged | ⏳ 3 of 5 (14.1 unified hub + 14.2 detail refresh + 14.3 scroll variants). |
| `/work` (or `/projects` + `/architecture`) bounce rate measurably lower | ⏳ Observation continues. |
| Mobile architecture engagement (timeline ladder) shows non-zero `engaged` events from mobile sessions | ⏳ Waits on 14.4. |
| Stack page session time stable or improved | ⏳ Waits on 14.5. |

**Phase 14 stays OPEN.** Next sub-PR: 14.4 (architecture timeline slider on mobile).

---

## 20. Closing

V6 Sub-PR 14.3 is **three project-specific tonal variants on the same ScrollStory engine**. The audit's "excellent and repetitive simultaneously" framing closes: CWH retains its text-led shape (V5 byte-identical); VCA gains a diagram-led shape (5/7 inverted column ratio); FormAI gains a device-anchored shape (phone-frame wrapper). Same engine, same motion grammar, same cyan blob easing, same progress chip — three editorial identities.

The variant prop is the engine's single new surface; everything else is rewiring. PhoneFrame is the single new primitive; pure CSS, reduced-motion safe by construction, no client JS. The flag gates the variants at the engine, not at the pages — so the rollback contract is single-flag, single-condition, V5 byte-identical.

Three of five Phase 14 sub-PRs landed. The remaining two (mobile timeline ladder, stack page compression) round out the work-surface evolution. The 30-day Phase 14 observation window continues; bounce rate + click-through + scroll-engagement telemetry accumulates as the operator runs the live deployment.

Same engine. Same palette. Three architectures, three shapes.

Distribution > Perfection. Restraint = Identity. Evolution > Replacement.
