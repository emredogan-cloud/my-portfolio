# PORTFÖY V6 — UI FUTURE SYSTEMS

> **Vision layer — Interface Cognition Catalog.**
> This document answers a single question:
>
> "What would the interface evolution of an AI-native engineering
> ecosystem look like — without becoming spectacle, without breaking
> identity, without burning a single founder month on theater?"
>
> The systems below are not features. They are *interface primitives*
> for an ecosystem that already exists (V1 → V5) and now wants to
> communicate its intelligence at the cognition layer.

---

## WHY THIS DOCUMENT EXISTS

V5 closed an era. The ecosystem now has perception, temporal,
topology, twin, ambient subsystems — all live, all telemetered, all
publicly transparent.

What V5 did NOT do is make those subsystems *visible at the interface
layer in proportion to their depth*. The visitor today reads V5
through:

- The aura registry (built, unmounted).
- The adaptive pattern classifier (built, unmounted).
- The cognition signal (live, but only one consumer).
- The pacing engine (live, but only one consumer).
- The ambient context (live for Lumina internals only).

V6 is the *interface side* of those systems. Not new features.
**New legibility.**

Every system below passes the V6 four-question gate:

1. **Inheritance** — builds on a V5 system, never duplicates one.
2. **Invisibility** — felt, not announced.
3. **Restraint** — net removal preferred to net addition.
4. **Founder Sustainability** — ≤ 1.5 hours/month maintenance.

Two-of-four = reject.

---

## V6 SYSTEM CATEGORIES

```
1. Interface Grammar Canonization
2. Cognition-Aware Composition
3. Topology-Aware UI
4. Architectural Storytelling Surfaces
5. Interface Memory + Cross-Surface Continuity
6. Calm Intelligence Surfaces
7. Engineering Documentary UX
8. Believable Impossible-Feeling Transitions
9. Spatial Systems (Restrained)
10. Interaction Density Control
11. Recruiter-First Perception Systems
12. Silent Interface Intelligence (Conditional)
13. Future Interaction Primitives
```

Each category hosts 2–4 systems. Each system carries:
- a single-paragraph vision
- the V5 inheritance edge it consumes
- the cross-system tie-ins
- the **"why this is only meaningful here"** clause
- the **"what this is not"** anti-pattern
- estimated maintenance cost
- target phase

---

## 1. INTERFACE GRAMMAR CANONIZATION

The first family. Lock the implicit grammar of V1–V5 into explicit,
reusable primitives. Lowest spectacle, highest leverage.

### 1.1 useCompositionSignal() (Phase 11)

A unified hook that returns the visitor's current cognition signal,
pacing multiplier, and reduced-motion state in a single read — so
every V6 consumer reads from one place.

**Inheritance:** `useCognition()` + `usePacing()` + `useReducedMotion()`.
**Why here:** Without it, each V6 surface re-implements the same
three-hook pattern. Composition canon = single source of truth.
**Not:** A state machine. A new context. A side-effecting hook.
**Maintenance:** 0.3 h/month.

### 1.2 Aura Activation Pipeline (Phase 11)

The mount path for the dormant `AuraProvider`. CSS variables flow to
the document; two consumers (ambient gradient, Reveal pace) read them.
A flag-gated, observation-windowed mount.

**Inheritance:** `lib/v5/aura/*` (built V5 Phase 8.4).
**Why here:** The aura system encodes the per-page emotional
register of the entire ecosystem. Without activation, V5's most
subtle invariant remains invisible.
**Not:** A theme switcher. A color picker. A user-toggle. A new dark
mode.
**Maintenance:** 1.0 h/month.

### 1.3 Adaptive Composition Primitive (Phase 11)

Mount `AdaptivePatternProvider` at `/contact` scope. CSS `order`
reorders three sections based on classifier output. Default = V5
layout verbatim.

**Inheritance:** `lib/v5/contact/*` (built V5 Phase 8.5).
**Why here:** Recruiter, senior-engineer, and casual visitor each
land on `/contact` for different reasons. Composition order
(*not* content) reflects the most likely reason.
**Not:** Personalisation copy. A modal. A "we noticed…" surface.
**Maintenance:** 0.5 h/month.

### 1.4 Type / Spacing / Motion Canon Annotations (Phase 11)

Source-level annotations (`// V6 § 2.6`, `// V6 § 2.7`, `// V6 § 2.5`)
on every typography / spacing / motion decision across the codebase.
Optional lint rule.

**Inheritance:** V5 § 2.5, V5 § 2.6 grammar.
**Why here:** Future contributors / Lumina / repo-aware tools can
read the canon directly from source. Memory-as-Documentation Law
(V5 § 2.6) instantiated at file level.
**Not:** A design tokens JSON. A Figma sync. A theme provider.
**Maintenance:** 0.2 h/month.

### 1.5 Sub-PR Archive (Phase 11)

A new directory `sub-pr-report/v6/` hosts one Markdown report per
V6 sub-PR — before/after composition diff, mobile screenshot,
reduced-motion path, telemetry plan, rollback command.

**Inheritance:** The existing `sub-pr-report/` directory for V5.
**Why here:** V6 makes invisible decisions; the archive is the
operator's only way to read the decision trail.
**Not:** A wiki. A Confluence page. A PR template.
**Maintenance:** 0.5 h/month (per sub-PR cadence).

---

## 2. COGNITION-AWARE COMPOSITION

Systems that modulate layout based on the cognition signal — not
addressed copy.

### 2.1 Reveal Density Modulation (Phase 12)

`Reveal` component reads cognition state. Engaged visitors see
elements at a tighter viewport margin (sooner reveal); arrival
visitors see the V5 default.

**Inheritance:** `useCompositionSignal()`.
**Why here:** Engaged visitors scrolling through V5's editorial
density want the *next* idea sooner; arrival visitors want the
cinematic baseline.
**Not:** A scroll-velocity hack. A skip-to-content shortcut. A
"reading mode" toggle.
**Maintenance:** 0.3 h/month.

### 2.2 Scroll-Story Pacing Density (Phase 12)

`/architecture/<slug>` ScrollStory adapts milestone height based on
cognition. Engaged → `100dvh - 4rem`. Arrival → V5 default `100svh`.

**Inheritance:** ScrollStory engine (V3); cognition signal.
**Why here:** Long-arc scroll stories optimised for first-read
versus deep-read are different. Composition handles both.
**Not:** A "skip to next" affordance. A summary mode. A TL;DR
generator.
**Maintenance:** 0.4 h/month.

### 2.3 Navigation Primary-Affordance Weighting (Phase 12)

Navbar's "View Résumé" pill subtly modulates its emphasis based on
cognition. Engaged visitor exiting toward `/contact` → emphasis up.
Arrival visitor → V5 default.

**Inheritance:** `useCompositionSignal()`, navigation observer.
**Why here:** The site already knows whether the visitor is mid-read
or deciding to act. The primary affordance breathes with that.
**Not:** A growing CTA. A pulsing button. A "click here!" emphasis.
The change is at the scale of 5 % size + 5 % opacity.
**Maintenance:** 0.2 h/month.

### 2.4 Cross-Page Continuity Crumb (Phase 14)

A small, optional, single-line breadcrumb above the page hero on
return visits within a session — naming the SURFACE the visitor
came from, not their behaviour.

Example: a visitor on `/architecture/cloud-waste-hunter` clicks
through to `/contact` and sees:
> *From: Cloud Waste Hunter*

No "we noticed". No "your usual". Just the surface.

**Inheritance:** Interface memory registry (Phase 14).
**Why here:** Continuity without speech. The interface remembers
its own shape; the visitor reads that as competence.
**Not:** A "you were here" notification. A back-button. A
breadcrumb chain.
**Maintenance:** 0.3 h/month.

### 2.5 Cognition-Driven Section Anchor Visibility (Phase 12)

Section anchor links (the `#` icons next to H2s, currently absent)
appear only for engaged visitors who have hovered nearby. Arrival
visitors don't see them.

**Inheritance:** Cognition signal + pointer-hover state.
**Why here:** Anchor links are a power-user affordance; surfacing
them for engaged visitors only matches the cognition load.
**Not:** Always-visible anchors. Hover-only without cognition gate.
A "share section" button.
**Maintenance:** 0.2 h/month.

### 2.6 Lumina Window Opening Heuristic Refinement (Phase 14)

Today Lumina auto-opens once per session at 1.5 s on first visit
(V4). Phase 14 refines: on a *returning* engaged visitor, Lumina
opens minimized + welcomes silently (no welcome sequence). On an
*arrival* first-time visitor, the V4 sequence runs.

**Inheritance:** Lumina lifecycle (V4) + cognition + interface
memory.
**Why here:** Returning engaged visitors don't need re-onboarding;
arrival visitors do. The window itself reads the signal.
**Not:** Auto-greeting. Memory-name recall. "Welcome back!" copy.
**Maintenance:** 0.3 h/month.

---

## 3. TOPOLOGY-AWARE UI

Surfaces that respond to *where* the visitor sits in the architecture
graph.

### 3.1 Per-Architecture-Slug Aura (Phase 12)

The aura registry extends from path-level to architecture-slug-level
specificity. Each project carries a calibrated aura:

- `cloud-waste-hunter` → cooler + focused + precise
- `vibing-coder-ai` → slightly warmer + analytical + clear
- `sixpack-ai` → warmer + curious + spatial
- `pawdoc` → warmer-still + tender (when content lands)
- `aevum` → calm + warm (when content lands)

**Inheritance:** Aura registry (Phase 11).
**Why here:** Each project carries a different emotional register;
the surrounding atmosphere should match.
**Not:** Theme switcher. Per-project brand color. A custom
landing-page hero per project.
**Maintenance:** 0.5 h/month.

### 3.2 Project Card Reordering (Phase 12)

`/projects` hub reorders cards based on session-flow. A visitor
arriving from `/codex` sees the AI/agent-flavored card first; a
visitor from `/architecture` sees the cloud-flavored card first.

**Inheritance:** Interface memory (Phase 14) — defers actual
implementation to that phase. Phase 12 lays the consumer pattern.
**Why here:** The visitor's prior surface predicts the most useful
next surface. Composition (CSS `order`), not content, encodes it.
**Not:** Personalisation copy. A "for you" label. A
recommendation engine.
**Maintenance:** 0.4 h/month.

### 3.3 Topology Breadcrumb Auras (Phase 12)

Pages that sit within an architectural hierarchy (e.g.,
`/architecture/cloud-waste-hunter` → child of `/architecture`)
inherit a softened version of the parent's aura on top of their
own. The aura system gains hierarchical composition.

**Inheritance:** Aura registry + URL parsing.
**Why here:** Architectural hierarchies should feel hierarchical at
the atmospheric layer too.
**Not:** A visible breadcrumb. A back-link. A "you are here" map.
**Maintenance:** 0.3 h/month.

### 3.4 Hero Topology Cognition Modulation (Phase 12)

The HeroTopology 3D scene reads cognition signal. Engaged visitors
returning to `/` see a slightly tighter camera frame (the
constellation feels closer); arrival visitors see the V4 default
wide frame.

**Inheritance:** HeroTopologyScene + cognition signal.
**Why here:** Returning visitors don't need the introductory
spatial unveiling; they want to *see* the topology faster.
**Not:** A new 3D scene. A new spectacle. A spectacle inflation.
Mobile fallback is unaffected.
**Maintenance:** 0.5 h/month.

---

## 4. ARCHITECTURAL STORYTELLING SURFACES

The interface that *explains* the architecture without becoming a
generic AI explainer.

### 4.1 Architecture Narrator (Phase 13)

A small component on `/architecture/<slug>` pages that surfaces
rationale at perceptive dwell-time thresholds.

- 3 s: 1 sentence ("STS AssumeRole because shared credentials
  failed audit.")
- 30 s: 1 paragraph (the WHY in 3–4 sentences).
- 2 min: 1 full decision thread (linked).

All text *build-time pre-rendered* from commit messages, WHY
paragraphs, and `data/temporal/events.ts`.

**Inheritance:** Lumina repo-aware tools (V4 Phase 4); evolution
registry; commit history.
**Why here:** The site already KNOWS the architectural rationale
through V4/V5 systems. The narrator surfaces that knowledge at the
moment the visitor's attention earns it.
**Not:** A chatbot. A live LLM call. A generic "explain code" feature.
**Maintenance:** 1.5 h/month (editorial calibration).

### 4.2 Decision Provenance Threads (Phase 13)

`/architecture/<slug>/decisions/<topic>` static pages render the
threaded history per architectural decision. Each thread:

- Date-ordered entries.
- Each entry linked to a real commit.
- Cross-links to `/evolution#<event-id>`.

Examples per project (CWH):
- "DynamoDB over Postgres"
- "STS AssumeRole adoption"
- "Bedrock streaming via Lambda Function URLs"

**Inheritance:** `data/temporal/events.ts` registry + Lumina
`explainCommitRationale` tool.
**Why here:** Engineering history is the single most valuable
recruiter-grade evidence. Wiki-grade documentation, commit-grounded
provenance, zero invention.
**Not:** A wiki. A Markdown blog. A retrospective. An RFC archive.
**Maintenance:** 1.0 h/month (registry curation).

### 4.3 Operating Recent-Decisions Mini-Surface (Phase 13)

A new block on `/v5/operating` showing the last 3 architectural
decisions with one-line rationale + commit link.

**Inheritance:** Operational snapshot composer (V5 Phase 9.1).
**Why here:** The twin should reflect engineering thinking, not
only engineering doing.
**Not:** A roadmap. A "what's next". A planning document.
**Maintenance:** 0.3 h/month.

### 4.4 Failure-Mode Theater Surface (Phase 13)

`/lumina/failures` (already live) gains visual story shape: each
failure entry becomes a small narrative card — `what / why / fix /
delta`. Same data, restructured layout.

**Inheritance:** `/lumina/failures` data layer.
**Why here:** Public failure cataloging is one of V4/V5's strongest
identity assets. The interface should reflect that strength.
**Not:** A "lessons learned" buzzword list. A retrospective tool.
A user-facing "report a problem" form.
**Maintenance:** 0.5 h/month.

### 4.5 Architectural Why-Map (Phase 14)

A small map view on `/architecture/<slug>` that visually links
each scroll-story milestone to its decision thread. Tap a milestone
→ see the WHY thread inline; tap again → jump to the full
provenance page.

**Inheritance:** ScrollStory + Decision Provenance Threads.
**Why here:** The visitor reading the architecture should be able
to *expand* any milestone into its decision history without
leaving the page.
**Not:** A new view. A mini-map. A graph visualization library
import.
**Maintenance:** 0.7 h/month.

---

## 5. INTERFACE MEMORY + CROSS-SURFACE CONTINUITY

The interface remembers its own decisions across the session.

### 5.1 Interface Memory Registry (Phase 14)

A typed in-memory registry holds the last N visited surface IDs
(capped at 5) in `sessionStorage`. Schema:

```ts
type SurfaceVisit = {
  surface: 'project' | 'architecture' | 'lab' | 'note' | 'codex' | 'misc';
  id: string;
  visitedAt: number; // ms since epoch
};
type InterfaceMemory = SurfaceVisit[];
```

**Inheritance:** sessionStorage primitive; perception layer
contract.
**Why here:** Cross-surface continuity requires *some* memory; this
is the smallest possible version. Capped, typed, session-scoped,
no fingerprint.
**Not:** A localStorage. A KV record. A cookie. A cross-session id.
**Maintenance:** 0.3 h/month.

### 5.2 useInterfaceMemory() Hook (Phase 14)

A hook returning the registry as a typed array. Consumers branch
on `surface` + `id` shapes; never display the array.

**Inheritance:** 5.1.
**Why here:** Single read-path; consumers can't accidentally render
the memory contents.
**Not:** A debugging panel. A user-visible memory view. A "clear
history" button (sessionStorage clears on tab close — that IS the
clear).
**Maintenance:** 0.2 h/month.

### 5.3 Continuity-Aware Lab Highlighting (Phase 14)

`/lab` highlights the experiment matching the visitor's last
architecture page. Visitor came from `/architecture/cloud-waste-hunter`
→ IAM Translator card emphasized (border accent +2 %).

**Inheritance:** Interface memory hook.
**Why here:** Each lab experiment maps loosely to an architecture
discipline. Continuity follows the natural follow-on path.
**Not:** A "you might like" recommendation. A modal. A
"continue where you left off" CTA.
**Maintenance:** 0.3 h/month.

### 5.4 Continuity-Aware Contact Case Study (Phase 14)

`/contact` pre-positions the case-study card matching the visitor's
last architecture page. Visitor came from `/architecture/sixpack-ai`
→ FormAI case study appears above the form.

**Inheritance:** Interface memory hook + adaptive pattern classifier.
**Why here:** The recruiter / hiring manager arriving with a
specific project in mind sees that project's case study without
having to find it.
**Not:** A "previously viewed" widget. A history breadcrumb. A
"continue" affordance.
**Maintenance:** 0.4 h/month.

### 5.5 Cross-Session Continuity OFF By Design (Documentation)

V6 makes one explicit choice: continuity is **session-only**.
Cross-session linkage requires per-visitor identity, which V5 § 2.4
+ V6 § 2.13 forbid.

The documentation surface (`/v5/perception` extension) explicitly
states: *interface memory clears on tab close; no cross-session
linkage exists by design*.

**Inheritance:** Privacy posture inheritance.
**Why here:** The negative space is itself a feature; visitors who
care about privacy can confirm the design choice without reading
the code.
**Not:** A toggle. An opt-in to cross-session memory. A "log in to
keep context" affordance.
**Maintenance:** 0.1 h/month.

---

## 6. CALM INTELLIGENCE SURFACES

V5 § 10 (Post-SaaS Interface Philosophy) carried forward. The
interface dissolves; the system becomes the protagonist.

### 6.1 Interface as Telemetry Surface (Persistent Doctrine)

Re-stated for V6: every visible surface should be reading from a
canonical data source, not a hand-curated content layer. V6
sub-PRs validate this; any "hardcoded" content is suspect.

**Inheritance:** V5 § 10.1.
**Why here:** Visitors recognize the difference between
hand-written marketing copy and surfaces *grounded in the work*.
The latter compounds; the former rots.
**Not:** A marketing landing page. A "features" page. A "pricing"
page. (V4 § 1.2 already forbids these; V6 hardens.)
**Maintenance:** 0 (doctrine, not surface).

### 6.2 Quiet-State Surfaces (Phase 12)

Surfaces with no data (e.g., `/v5/journal` with no entries yet, or
the `/v5/operating` empty failures section) currently render an
honest empty state with terminal-style copy. V6 extends this
*everywhere* — there is never a fake state, never placeholder data,
never demo-ware. Empty = honest.

**Inheritance:** Existing V5 empty-state pattern.
**Why here:** The site advertises restraint by being honest about
what's not there.
**Not:** Lorem ipsum. Demo data. "Coming soon" badges (except in
the lab where they're earned).
**Maintenance:** 0.2 h/month (audits).

### 6.3 No Loading Spinners (Phase 11)

V6 audits every loading state. Spinners are forbidden. Replace with
*absence* (whitespace where content will appear) or skeleton
(low-contrast placeholder). The HeroTopology already uses the
skeleton pattern; V6 generalizes.

**Inheritance:** V4/V5 loading-state discipline.
**Why here:** Spinners signal "this might fail"; skeletons signal
"this is computing"; absence signals "wait calmly".
**Not:** A custom loader animation. A progress bar. A "0 % … 100 %"
display. A loading screen with logo.
**Maintenance:** 0.2 h/month.

### 6.4 No Notification Bubbles (Persistent Doctrine)

V6 reaffirms: no toast notifications, no badge counts, no "new!"
indicators on navigation items, no red dots, no animated bells. The
ecosystem communicates through composition and content, never
through interruption.

**Inheritance:** V4 § 1.2.
**Why here:** Notification UI is the hallmark of generic SaaS.
**Not:** Slack-style updates. Browser notification opt-ins. A
"what's new" modal.
**Maintenance:** 0.

---

## 7. ENGINEERING DOCUMENTARY UX

The interface as a long-arc documentary of one engineer's work.

### 7.1 Operational Portrait Card Evolution (Phase 13)

V5 9.4 shipped the operational portrait OG card. V6 expands:

- One card per V6 phase milestone.
- Cards generated *deterministically* from the operational snapshot.
- Each card linkable as a permanent share artifact.

**Inheritance:** V5 9.4 `api/og/operating` route.
**Why here:** Each phase produces an artifact visitors can share
that *encodes the phase's content*.
**Not:** A marketing OG card. An announcement card. A "we hit
$XK MRR!" card.
**Maintenance:** 0.5 h/month.

### 7.2 Engineering Diary OG Cards Per Journal Entry (Phase 13)

`/v5/journal/<week-id>` already exists. V6 generates per-entry OG
cards — visually consistent with the operational portrait but
showing that specific week's narrative.

**Inheritance:** V5 9.3 journal cron.
**Why here:** Every weekly journal entry becomes a shareable
artifact without manual design effort.
**Not:** Weekly social-media graphics. Auto-generated marketing
posts.
**Maintenance:** 0.3 h/month.

### 7.3 Architecture Atlas (Phase 14)

A single quiet page at `/architecture/atlas` collecting every
architectural decision across every project + every milestone +
every commit, threaded by topic. Read-only, build-time generated,
no client JS beyond the existing navigation primitives.

**Inheritance:** Decision Provenance Threads (Phase 13) +
Architectural Why-Map (Phase 14).
**Why here:** The cumulative atlas becomes the strongest single
artifact about the engineer's thinking. Recruiters share it.
**Not:** A documentation site. A `/docs` route. A book PDF.
**Maintenance:** 0.7 h/month.

### 7.4 Yearly Operational Recap (Phase 14)

Once a year (December cron), an automatic operational recap fires
similar to the weekly journal but year-scoped. Same composer
pattern, same OG card, same archive.

**Inheritance:** Journal cron + composer.
**Why here:** The site reflects its own multi-year arc.
**Not:** "Year in review" marketing. A retrospective post. A
public reflection blog.
**Maintenance:** 0.2 h/month (annual surge).

### 7.5 Public Engineering Reflection Surface (Phase 14)

A small surface on `/about` that updates monthly with a *single
sentence* of operating posture. The sentence is hand-written but
the field is structured (`data/v6/reflections.ts` append-only).

**Inheritance:** `/about` Closing Transmission section.
**Why here:** The page already carries a "Currently" section; this
extends to a single-line *posture* that updates with the work.
**Not:** A blog. A timeline. A "thoughts" feed.
**Maintenance:** 0.3 h/month.

---

## 8. BELIEVABLE IMPOSSIBLE-FEELING TRANSITIONS

V6 systems that make the *cumulative* experience feel impossible
while no single transition exceeds the restraint budget.

### 8.1 Cross-Page Aura Continuity (Phase 12)

When a visitor navigates `/architecture/cloud-waste-hunter` →
`/projects/aws-waste-hunter`, the aura value crossfades over ~400 ms
rather than snapping. The PacingProvider's multiplier governs the
transition.

**Inheritance:** Aura activation (Phase 11) + PacingProvider.
**Why here:** Cross-page continuity at the atmosphere layer makes
the ecosystem feel like one room, not multiple pages.
**Not:** A page transition animation. A loading screen. A
view-transition API trick that obscures content.
**Maintenance:** 0.3 h/month.

### 8.2 Composition Memory Transition (Phase 14)

When a composition shift happens (e.g., adaptive contact reorder),
the shift is animated under the PacingProvider's curve, not snapped.
Reduced-motion path snaps; motion-allowed path eases.

**Inheritance:** Adaptive composition + PacingProvider.
**Why here:** The shift is felt, not seen as a "jump".
**Not:** A page flip. A modal reveal. A cinematic camera move.
**Maintenance:** 0.2 h/month.

### 8.3 Reveal Cascade Across Surfaces (Phase 12)

Pages reveal their sections in a *cascaded* rhythm that varies
slightly per-page based on aura pace. The cumulative effect: the
site feels syncopated but never repetitive.

**Inheritance:** Reveal + Aura.
**Why here:** Subtle per-page variation prevents the site from
feeling templated.
**Not:** A new motion library. A complex orchestrator. A "page
chrome" animation.
**Maintenance:** 0.2 h/month.

### 8.4 Navigation Bar Compaction (Phase 12)

The navbar compacts subtly on engaged sessions — slightly shorter
height, slightly tighter spacing, slightly thinner border. Arrival
sessions see the V4 default.

**Inheritance:** Cognition signal + navbar.
**Why here:** Engaged visitors are scrolling deeper; less chrome.
Arrival visitors need the full chrome to find affordances.
**Not:** A scroll-to-hide pattern. A mobile drawer. A hamburger
menu.
**Maintenance:** 0.2 h/month.

---

## 9. SPATIAL SYSTEMS (RESTRAINED)

V6 introduces no new spectacle, but extends the existing spatial
vocabulary with discipline.

### 9.1 Aura-Aware Background Atmosphere (Phase 11)

The existing radial-gradient atmospheric blobs (present on every
page) read their position, intensity, and color temperature from
the aura value. Within the closed cyan palette, the variation is
detectable but subtle.

**Inheritance:** Existing atmospheric gradient pattern.
**Why here:** The atmosphere is already present; reading from aura
makes it cohere with the rest of the cognition system.
**Not:** New gradients. New colors. New "particle" systems. New
animated backgrounds.
**Maintenance:** 0.3 h/month.

### 9.2 Spatial Depth via Z-Layer Convention (Phase 12)

V6 codifies the existing z-stack:

| Layer | z-index | Use |
|-------|---------|-----|
| 0 | content baseline | Page text + components |
| 10 | content overlay | Inline reveals, sticky pills |
| 20 | sticky chrome | Progress header on ScrollStory |
| 30 | navigation primary | Navbar baseline |
| 35 | environment dimming | Lumina centered mode dim |
| 40 | navigation overlay | Navbar fixed-position |
| 55 | chat trigger | LuminaTrigger |
| 60 | chat window | LuminaWindow |
| 100 | accessibility skip | Skip-to-content focus pill |

V6 sub-PRs touching z-index must reference this canon. No new
z-layer added without explicit V6 spec extension.

**Inheritance:** Implicit V1–V5 z-stack.
**Why here:** Documented z-layer canon prevents accidental
overlap drift.
**Not:** A new layering library. A portal manager. A z-index
calculator.
**Maintenance:** 0 (doctrine).

### 9.3 Spatial Anchor Points (Phase 13)

Architecture pages develop subtle spatial anchors — small
non-interactive cyan dots on the page margin that mark the visual
midpoint of each milestone. Read like a film's chapter markers.

**Inheritance:** ScrollStory milestone refs.
**Why here:** Visitors orient themselves spatially through the
long scroll; anchors provide a calm map without a navigation bar.
**Not:** A timeline. A sticky table of contents. A "scroll to
section" button.
**Maintenance:** 0.2 h/month.

---

## 10. INTERACTION DENSITY CONTROL

Per-surface density is editorial; V6 codifies and enforces.

### 10.1 Density Bracket Lint Rule (Phase 11)

A custom lint rule (or convention) flags any surface adding more
than its bracket allows. Optional warning level; documented in the
sub-PR archive.

**Inheritance:** V6 § 1.6 density doctrine.
**Why here:** Operator-grade defense against density creep.
**Not:** A hard build failure. A blocking rule.
**Maintenance:** 0.2 h/month.

### 10.2 Element Retirement Pipeline (Phase 11)

Every V6 sub-PR adding an interactive element must identify one
element to retire OR explicitly justify why the surface is *under*
its density bracket and can absorb the addition.

**Inheritance:** V6 § 1.5 anti-decoration default.
**Why here:** Net additions accumulate; explicit retirement keeps
the interface quiet.
**Not:** A "redesign" pass. A removal sprint. A "spring cleaning"
sub-PR.
**Maintenance:** 0 (process).

### 10.3 Decorative Element Audit (Phase 11)

Once per phase, a single sub-PR audits decorative elements (purely
visual hairlines, gradients, dividers) and retires those that no
longer earn their pixel. The Phase 11 audit retires ~6 elements;
each subsequent phase ~2.

**Inheritance:** V6 § 1.5.
**Why here:** Decoration debt compounds invisibly.
**Not:** A "minimalism" mode. A "clean version" toggle.
**Maintenance:** Once per phase.

---

## 11. RECRUITER-FIRST PERCEPTION SYSTEMS

V5 introduced the "Compelled to Contact" standard. V6 sharpens it
into perception systems specifically tuned for senior engineers,
hiring managers, CTOs, and founders.

### 11.1 Recruiter-Pattern Composition (Phase 11–12)

Already partially shipped as `AdaptivePatternProvider`. V6 wires
its `recruiter` pattern explicitly:

- `/contact` reorders to case studies → contact form.
- The "View Résumé" CTA in navbar gains subtle emphasis.
- The footer's CV download surfaces above the social links on
  mobile.

**Inheritance:** Adaptive pattern classifier.
**Why here:** Recruiters are the highest-value visitor segment; the
composition makes their next action obvious without ceremony.
**Not:** "For recruiters" badge. A separate `/recruiter` route. A
landing page experiment.
**Maintenance:** 0.4 h/month.

### 11.2 Senior-Engineer-Pattern Composition (Phase 12)

A visitor classified as `senior-engineer` (long dwell on
`/architecture`, `/lumina/brain`, `/v5/operating`) sees:

- `/contact` reorders to engineering references → form.
- `/about` surfaces "Specializations" above "Principles".
- Each architecture page's narrator surfaces deeper-thread first
  (skips the 3 s intro, lands at 30 s level).

**Inheritance:** Adaptive pattern classifier + Architecture Narrator.
**Why here:** Senior engineers don't need the on-ramp; they want
the depth.
**Not:** A "developer mode" toggle. A "show me the code" affordance.
A `/dev` route.
**Maintenance:** 0.4 h/month.

### 11.3 Casual-Pattern Composition (Phase 12)

Casual visitor (short dwell, broad page-flow) sees:

- `/contact` reorders to elevator pitch → form.
- Hero's secondary line emphasised (download CV is dimmer; explore
  projects brighter).
- Architecture narrator surfaces only the 3 s line; never escalates.

**Inheritance:** Adaptive pattern classifier.
**Why here:** Casual visitors aren't the target — but they aren't
the enemy either. The composition respects their tempo.
**Not:** A "consumer view". A simplified mode. A "tour" affordance.
**Maintenance:** 0.3 h/month.

### 11.4 Default-Pattern Composition (Persistent)

The conservative fallback. The V5 layout verbatim. V6 explicitly
codifies that the default pattern is the *highest-quality* layout
— it must work for every visitor, every context, every device.
The adaptive system only ever *raises* a more-specific composition
above the default; never *lowers* below it.

**Inheritance:** V5 baseline.
**Why here:** Without an excellent default, adaptive composition
becomes a bandaid on a weak baseline.
**Not:** A "fallback" experience.
**Maintenance:** 0.

---

## 12. SILENT INTERFACE INTELLIGENCE (CONDITIONAL — PHASE 15)

The final family. May never execute.

### 12.1 UI-Side Ambient Anchoring (Phase 15)

The UI consumes the same ambient context block Lumina reads
internally (V5 Phase 10.1/10.2). Composition shifts subtly based
on:

- Active operational systems → architecture page emphases match.
- Latest weekly journal narrative → home hero subhead modulates
  (single word change, e.g., "this month" → "this week").
- Topology validator state → if validation failed, subtle visual
  acknowledgment in operator surfaces (a slightly warmer aura on
  `/v5/operating` to signal "look here").

All anchoring is composition; no addressed copy.

**Inheritance:** Phase 10.1 ambient registry.
**Why here:** The same context Lumina anchors to should anchor the
UI; the visitor reads consistency without explanation.
**Not:** A live dashboard. A real-time data display. A "system
status" banner.
**Maintenance:** 0.5 h/month (conditional; only if Phase 15 ships).

### 12.2 Cognition-Topology Cross-Anchoring (Phase 15)

The cognition signal × the ambient operational topology produces a
combined "operator context" that V15 surfaces consume in their
composition decisions:

- `/lab` highlight intensity scales with both cognition (engaged →
  brighter) AND active-experiment count (more experiments → tighter
  spacing).
- `/architecture` narrator threshold modulates with both dwell time
  (already) AND latest journal narrative (if recent weeks are
  refactor-heavy, narrator threshold drops to surface rationale
  faster).

**Inheritance:** Phase 12 + Phase 10 ambient.
**Why here:** True identity-native intelligence is the *emergent*
behavior across multiple signals; this primitive makes it visible
in composition.
**Not:** A scoring system. A predictive engine. A
"recommendations" surface.
**Maintenance:** 0.7 h/month (conditional).

### 12.3 Disappearing Interface (Phase 15)

The aspirational endpoint. Across cumulative V6 phases, the
interface fades behind the system — visitors who spent enough time
report that they remember the *content* (the architectures, the
decisions, the operational portrait) but cannot recall a single UI
element specifically.

**Inheritance:** V5 § 10.3.
**Why here:** Interface as identity is the V5–V6 endpoint.
**Not:** A "no UI" experiment. A pure-content layout. A reading
mode.
**Maintenance:** N/A (doctrine).

---

## 13. FUTURE INTERACTION PRIMITIVES

Catalog of primitives V6 *prepares* but does not ship in Phase
11–15. Each is a candidate for a hypothetical V7 — listed here so
V6's foundation work doesn't accidentally invalidate them.

### 13.1 Multimodal Operator Console (Deferred — V7+)

A surface where Lumina + telemetry + topology + memory compose into
a single operator-grade console. Read-only; never an editable
surface. Deferred because cumulative restraint requires V6 to land
first.

**Inheritance candidate:** All V5 surfaces + V6 interface memory.
**Why deferred:** Premature integration would compress the V6
restraint; the console works only on top of stable cognition-aware
composition.
**Not:** A SaaS dashboard. A "command center".

### 13.2 Spatial Audio for Operator Console (Deferred — V7+)

A subtle sonic layer (ElevenLabs spatial) for the V7 console only.
Off by default. Audio reflects ambient operational rhythm.

**Inheritance candidate:** V5 § 2.3 spatial audio primitive.
**Why deferred:** Audio surfaces require dedicated UX
experimentation that V6 deliberately avoids.

### 13.3 Visual Decision Tree (Deferred — V7+)

A per-architecture interactive tree showing every decision branch
considered (including the ones not taken). Build-time generated
from registry; visitor explores.

**Inheritance candidate:** Decision Provenance Threads.
**Why deferred:** Requires careful UX design to avoid becoming a
"what-if" generator.

### 13.4 Cross-Project Topology Atlas (Deferred — V7+)

A single page composing all three production project topologies
into one explorable map. Shared infrastructure highlighted; project-
specific subsystems dimmed-then-revealed.

**Inheritance candidate:** HeroTopologyScene + per-project
topologies.
**Why deferred:** Would re-invoke spectacle.

### 13.5 Engineering Memoir Surface (Deferred — V7+)

A long-form surface composing every weekly journal into a yearly
"engineering memoir" — read top to bottom as a single narrative.
Build-time generated.

**Inheritance candidate:** V5 9.3 journal corpus.
**Why deferred:** Yearly cadence requires the journal cron to have
≥ 26 weekly entries (~half a year of data) before composition is
worth the effort.

---

## CLOSING — V6'S UNIQUENESS PROOF

The 28 systems above describe an *interface evolution layer* whose
test is the same as V5's:

> **"I have never seen technology used this way before."**
> said quietly, without referencing a specific UI element.

If V6 succeeds:
- The aura is felt but not seen.
- The composition shifts but never speaks.
- The architecture narrates but never lectures.
- The interface remembers but never addresses.
- The cognition guides but never personalises.
- The spectacle is conserved (zero new ones).
- The restraint compounds.

If V6 fails:
- A visitor recalls a specific "wow moment" → over-shot.
- A visitor recalls an addressed message → personalisation theatre.
- A founder month is consumed maintaining a single surface →
  scope creep.
- A V5 system gets duplicated rather than consumed → inheritance
  violation.
- A new spectacle ships → spectacle budget breached.

The V6 phase agent reads this catalog before every sub-PR. Every
system here is *optional but disciplined*; the phase document
selects which subset to ship in which order.

V6 is not a feature roadmap.
V6 is a **legibility roadmap**.

When V5's invisible intelligence becomes legible at the interface
layer — without ever announcing itself — V6 has fulfilled its
single purpose:

**The system becomes the interface. The interface becomes the
identity. The identity becomes the credential.**

---

## APPENDIX A — V6 NEVER LIST (PERSISTENT REJECTION CATALOG)

Carried forward, extended:

| System | Reason |
|--------|--------|
| Generic AI chat surface beyond Lumina | Anti-Generic-AI Law |
| Generic RAG-over-website | Generic AI tool category |
| LLM-powered general search | ChatGPT replicates |
| Code generation as service | Cursor / V0 territory |
| Multi-tenant SaaS | Identity-native incompatible |
| White-label of any V6 system | Identity-native incompatible |
| Distributed agent mesh | V4/V5 hard-forbid |
| Autonomous infrastructure remediation | Security risk |
| Voice wake-word | Privacy + permission UX |
| Always-on background music | Cinematic restraint violation |
| VR / WebXR | Niche, outside mainstream loop |
| Cryptocurrency / NFT integration | Identity conflict |
| Subdomain federation pre-V11 | Path-based works |
| Mobile native app | Web-only platform |
| Theme switcher / dark mode toggle | Identity is closed |
| Notifications / toasts / badges | Calm interface |
| Loading spinners | Skeleton or absence only |
| Animated logos | Identity stability |
| Particle systems beyond V1 | Decoration debt |
| Glassmorphism inflation | One glass panel type ships site-wide |
| Spring physics | Type-system banned |
| Page intro animation > 300 ms | Cinematic pacing law |
| Backdrop-filter on every modal | GPU cost (V4 lesson) |
| Per-page custom branding | Identity stability |
| Yearly redesign | V6 IS the evolution |
| Visual editor / no-code builder | Not in operating model |
| Real-time presence indicators | Surveillance feel |
| "Online now" pulses | Operator-only surfaces |
| Confetti / celebration effects | Spectacle inflation |
| AI-generated marketing copy | Anti-Generic-AI |
| Generated personas / avatars | Identity-native |
| Tour overlays / onboarding modals | Calm interface |
| Cookie banners (beyond strict compliance) | Privacy posture |

This list is **growing**. Every sub-PR review adds entries when a
candidate idea is explicitly rejected.

---

## APPENDIX B — V6 MAINTENANCE BUDGET RECONCILIATION

Per-phase cumulative maintenance ceiling:

| Phase | New maintenance/month | Cumulative V6 | + V5 base (12 h) | + V4 base | Total |
|-------|------------------------|----------------|-------------------|-----------|-------|
| 11 close | 3.0 | 3.0 | 15.0 | + V4 maint | ≤ 30 h/month |
| 12 close | +2.0 | 5.0 | 17.0 | + V4 maint | ≤ 35 h/month |
| 13 close | +3.0 | 8.0 | 20.0 | + V4 maint | ≤ 42 h/month |
| 14 close | +1.5 | 9.5 | 21.5 | + V4 maint | ≤ 45 h/month |
| 15 close (if shipped) | +2.0 | 11.5 | 23.5 | + V4 maint | ≤ 48 h/month |

V5 § 1.3 ceiling = 50 h/month. V6 stays inside the ceiling
throughout. If at any point the actual cumulative breaches the
projected, the next phase auto-defers.

---

## APPENDIX C — SUCCESS METRIC

The single V6 success metric:

> **An anonymous senior engineer encountered for the first time spends
> ≥ 4 minutes on the site, navigates ≥ 3 surfaces, opens Lumina, and
> sends an unsolicited "I've never seen a portfolio do this" message
> via /contact — without being able to point to any single feature.**

This event happening ≥ 1 / month for 6 consecutive months = V6
success.

Until it does, V6 is incomplete.

After it does, V6 is the silent operating layer of the engineering
identity.

---

*End of vision document.*

*The execution constitution is in `PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md`.*

*Phase 11 begins when the operator says so.*
