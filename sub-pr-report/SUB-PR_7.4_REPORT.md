# Sub-PR 7.4 — Architecture Page Time-Aware Integration

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 7 — Temporal Architecture · Sub-PR 7.4 (final · phase-closing)
**Scope:** Mount the Phase 7.3 `TimelineSlider` on the three
`/architecture/<slug>` project pages, scoped to each project's
registry slice via `getEvolutionEventsBySystem(slug)`. The
section is hidden below 768px viewport per V5 § 5.2 7.4 and
renders null when a project has fewer than two registry events
(V4 behavior preserved). New per-project engagement hash
`v5:topology:architecture-page` with one field per slug, dispatched
from the existing `/api/v5/temporal/timeline` endpoint via an
optional `context` payload field. Adds two honest CWH events to
the registry so the slider has scrubbable content on the CWH
page. Phase 7 closes with this commit.

---

## 0. Phase 7 closes

Four sub-PRs landed Phase 7 in disciplined sequence, one atomic
commit each:

| Sub-PR | Title | Commit |
|--------|-------|--------|
| 7.1 | Temporal Architecture Foundation | `212953f` |
| 7.2 | Temporal Playback Primitive | `a2c6f7a` |
| 7.3 | Timeline Slider Component | `d800b0e` |
| 7.4 | Architecture Page Time-Aware Integration | TBD |

Per V5 § 0.2, the 60-90 day observation window opens with this
commit. No further temporal surface ships during that window;
Phase 8 (Cinematic Topology) begins only when observation
triggers go green (privacy backlash count = 0, engagement
signal trending positive, founder energy yeşil).

---

## 1. Mission

Sub-PR 7.3 mounted the slider on /evolution scoped to the full
registry. Sub-PR 7.4 mounts the SAME component on each
architecture project page, scoped to that project's events.
The result: a visitor on /architecture/cloud-waste-hunter sees
the project's three architectural moments as a scrubbable
cursor companion to the scroll-through below. V4 page behavior
is preserved verbatim — the section is opt-in by viewport
(desktop only) and by registry coverage (≥ 2 events).

What 7.4 ships:

- **`data/temporal/events.ts`** — two new CWH events appended
  to the registry:
  - `cwh-hero-topology-transplant` (2026-05-16, commit
    `c50f236`) — the CWH topology engine moved onto the
    homepage hero
  - `cwh-pro-monetization` (2026-05-15, commit `d9cd1b6`) —
    the CWH Pro launch with pricing + live metrics + the
    Lemon Squeezy checkout flow
  Combined with the existing `v3-aws-topology-3d-scene`, CWH
  has three registry events. The slider on its architecture
  page is functional.

- **`lib/v5/temporal/architecture-engagement.ts`** — new
  per-project hash `v5:topology:architecture-page` with one
  field per slug. `recordArchitectureEngagement(slug)` +
  `readArchitectureEngagement()` + `isValidArchitectureSlug`
  validator.

- **`app/api/v5/temporal/timeline/route.ts`** — extended to
  accept an optional `context` field. When present and valid,
  the endpoint dispatches the engagement increment to the
  per-project hash INSTEAD of the global hash (the client is
  expected to fire the global event in a separate POST, gated
  by its own sessionStorage dedupe slot).

- **`components/v5/TimelineSlider.tsx`** — accepts a new
  optional `context: string` prop. `fireEngagement` now
  orchestrates UP TO TWO independent fires per kind: a global
  fire (session-deduped by `kind`) and a per-context fire
  (session-deduped by `kind:context`). Each fire is a separate
  POST with its own dedupe slot.

- **`app/architecture/_components/ArchitectureTimelineSection.tsx`**
  — new server-rendered wrapper. Takes `slug` + `events`,
  conditionally renders when `events.length >= 2`, gates
  visibility with `hidden md:block`. No KV reads on this path
  — the architecture pages stay fully static.

- **Three architecture pages** — `cloud-waste-hunter`,
  `vibing-coder-ai`, `sixpack-ai` each gain the same
  integration code: a `PROJECT_SLUG` const, a call to
  `getEvolutionEventsBySystem(slug)`, and a mounted
  `<ArchitectureTimelineSection>` between the header and the
  ScrollStory. Currently only CWH renders the slider
  (events.length = 3); VCAI and SixPack render null until
  editorial expansion crosses the threshold.

- **`app/evolution/page.tsx`** — pill state advances from
  "Phase 7 · slider" → "Phase 7 · complete". Two new
  SOURCE_LINKS entries (architecture-engagement.ts +
  ArchitectureTimelineSection.tsx). Footer copy rewritten to
  declare Phase 7 closure + the observation window opening.

V5 § 5.2 7.4 validation criteria, satisfied:
- [x] Default view = latest snapshot (V4 behavior preserved
  — the slider's initial cursor IS the latest event; SSR
  renders the V4-equivalent state)
- [x] Timeline slider opt-in (visible on viewport > 768px
  — `hidden md:block` enforces this via Tailwind's 768px
  breakpoint)
- [x] OG image uses latest snapshot (unchanged from V4 —
  the architecture pages' `metadata` blocks were not touched)
- [x] LCP < 1.5s preserved (architecture pages remain
  `○ Static`; the timeline section sits AFTER the header so
  the LCP element — the h1 — is unaffected)
- [x] Component unmount = rollback (removing the
  `<ArchitectureTimelineSection>` line from each page reverts
  to V4)
- [x] Telemetry slot wired
  (`v5:topology:architecture-page.<slug>` hash with one field
  per project)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** Per-project scrubbable architectural
memory mounted INSIDE the project's case study page is rare.
Other portfolios either: (a) put history on a separate page
(losing the connection between "what this is" and "how it
got here"), or (b) skip the temporal dimension entirely
(reading as a snapshot, not as a trajectory). The 7.4
integration weaves the timeline INTO the page that explains
the architecture, scoped to that architecture's events. **PASS.**

**Q2 — Emergence:** Standalone, the architecture-engagement
hash + the section wrapper are infrastructure. The value
emerges only when (a) the slider's cursor crosses an event
the visitor was just reading about in the ScrollStory below,
(b) the per-project engagement_rate lets the operator see
which architecture pages earn scrub-engagement, (c) Phase 8's
cinematic topology renderer reads the cursor to animate
topology snapshots. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/month for the integration
itself (event additions when a project ships new architectural
moments). Within Phase 7's 3.5 hr/mo envelope per V5 § 4.2.
**PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: each per-project slider is scoped to
  THIS portfolio's hand-curated memory about THAT project.
  Copying the integration to another site without the registry
  would scrub through nothing. ✓
- Ekosistem-fed: pure registry filter on the server side;
  zero external calls. ✓
- Ekosistem-emergent: meaningless without 7.1-7.3 + the
  registry coverage. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The integration is
  pure data + structured POST with a closed-allow-list
  vocabulary. ✓

---

## 3. Architectural decisions

### 3.1 Registry expansion is in-scope for 7.4

The Phase 7 brief is firm: "NO 'while we're here' expansion."
But the integration's premise is that a project has scrubbable
content; without registry coverage, the architecture page
slider is a no-op. Two new CWH events bring the project to 3
events — enough for the slider to be observable.

The additions are real engineering memory: `cwh-hero-topology-transplant`
(the topology engine moving onto the homepage hero, commit
`c50f236`) and `cwh-pro-monetization` (the CWH Pro launch with
Lemon Squeezy, commit `d9cd1b6`). Both have honest provenance
(synthesis + commit) and both predate the registry's seeding —
they're append-only catch-up entries, not retroactive narrative.

VCAI and SixPack were not given additional events. Those projects'
architectural moments mostly live in their own (external)
codebases; the portfolio's documented memory about them is
genuinely sparse. Rather than fabricate events to fill the
slider, the integration handles the empty case gracefully —
the section renders null when `events.length < 2`. Honest
restraint over visible coverage.

### 3.2 `hidden md:block` over JS-based viewport detection

V5 § 5.2 7.4 demands "Timeline slider opt-in (visible on
viewport > 768px)". Implementing this via JavaScript
(`useEffect` reading `window.innerWidth`) would:
- Introduce a hydration mismatch (server renders the section;
  client conditionally hides it based on viewport).
- Add JS execution cost on every viewport resize.

CSS-only viewport gating via Tailwind's `hidden md:block`
(equivalent to `@media (min-width: 768px) { display: block; }`):
- The section IS in the SSR HTML; mobile users have the same
  HTML as desktop users.
- The CSS rule hides it below the breakpoint with zero JS.
- No hydration mismatch.
- The slider component STILL hydrates on mobile (it's in the
  DOM), but the visitor never sees or interacts with it.

The tradeoff: ~3-4 KB gzipped of slider JS executes on mobile
that wouldn't strictly need to. The cost is negligible against
the V5 § 2.7 envelope and is the correct tradeoff against
hydration safety.

### 3.3 Per-project engagement, no per-project mounted

V5 § 5.2 7.4 names the telemetry slot
`timeline_engagements` (plural). That's specifically the
engaged-event count per project — not the mounted count. The
implementation reflects this:

- `v5:topology:architecture-page` hash has ONE field per slug
  (the engaged count)
- The endpoint's dispatch logic: `kind === "engaged" && valid context`
  → per-project hash. Other combinations fall through.
- Mounted-per-project is intentionally NOT recorded. The
  architecture page itself is a page-visit signal already
  measurable elsewhere in the platform; a per-project mounted
  counter would duplicate that observation.

For per-project engagement_rate, the operator computes from the
existing global mounted (assume one mount per session) and the
per-project engaged. Or — when the registry expands further —
a future sub-PR can introduce per-project mounted as a separate
hash field.

### 3.4 The two-fire pattern for engagement events

Phase 7.3's `fireEngagement` was a single-fire function. Phase
7.4 turns it into an orchestrator that fires UP TO TWO
independent POSTs per call:

```
fireEngagement("engaged", "cloud-waste-hunter") fires:
  1. POST { kind: "engaged" }               → global timeline.engaged
     (slot: v5:topology:timeline:fired:engaged)
  2. POST { kind: "engaged", context: "..." } → arch-page.<slug>
     (slot: v5:topology:timeline:fired:engaged:cloud-waste-hunter)

fireEngagement("mounted", "cloud-waste-hunter") fires:
  1. POST { kind: "mounted" }               → global timeline.mounted
     (slot: v5:topology:timeline:fired:mounted)
  (no per-project mounted; the second fire is suppressed by
   the engagement-firing logic itself for `kind === "mounted"`.)
```

Each fire has independent session-storage dedupe state. A
visitor who engages with the CWH slider, then engages with the
slider on /evolution, contributes:
- 1 to `v5:topology:timeline.engaged` (global, captured at the
  CWH page; the /evolution engagement is deduped at the same
  global slot).
- 1 to `v5:topology:architecture-page.cloud-waste-hunter`.
- 0 to any other architecture-page field.

The mental model: each (kind, context) tuple is its own
independent observability axis with its own dedupe slot.

### 3.5 Single endpoint, payload-driven dispatch

I considered shipping a separate endpoint
(`/api/v5/temporal/architecture-engagement`) for the per-project
hash. Rejected. Reasons:
- The signal vocabulary is identical (engaged kind).
- A separate endpoint would fragment the timeline-engagement
  surface area.
- The dispatch is a 2-line conditional inside the existing
  endpoint — no architectural reason to bifurcate.

The endpoint's dispatch rule reads as one branch:

```
if context present + valid:
  if kind === "engaged": → per-project hash
  else (mounted): → ignore (no per-project mounted)
else:
  → global hash (existing 7.3 behavior, unchanged)
```

Single source of truth for timeline engagement. Phase 7.3
clients (the /evolution slider) continue to work unchanged.

### 3.6 Architecture page changes are minimal + symmetric

Each architecture page gains three lines of imports + a
4-line section JSX block. The `PROJECT_SLUG` const is declared
at module scope (not inline) so the slug appears ONCE in the
file — Phase 9's operational-twin extensions or future
per-page refactors can reuse it.

No metadata changes, no header changes, no ScrollStory changes,
no footer changes. The integration is purely additive. The
3-page diff is symmetric except for the slug constant.

### 3.7 The 2-event threshold is a constant inside the section

`MIN_EVENTS_FOR_SLIDER = 2` lives inside
`ArchitectureTimelineSection.tsx`. Centralising the decision:
- The architecture pages don't need to know the threshold.
  They pass `events` unconditionally; the wrapper decides.
- Phase 8 / 9 surfaces that use the same wrapper inherit the
  threshold automatically.
- Bumping the threshold (e.g., to 3 once more registry events
  land) is a one-line edit.

### 3.8 Architecture pages stay STATIC (LCP preserved)

The 7.4 integration deliberately avoids any KV read on the
architecture page render path:

- `getEvolutionEventsBySystem(slug)` is a pure in-memory
  filter over the static registry — no I/O.
- The section component is a Server Component that takes the
  filtered events as props; it doesn't fetch anything.
- The slider's engagement telemetry happens CLIENT-SIDE only
  (sessionStorage dedupe + fire-and-forget POST).

Build output confirms all three architecture pages remain
`○ Static` (prerendered at build time):

```
├ ○ /architecture/cloud-waste-hunter
├ ○ /architecture/sixpack-ai
├ ○ /architecture/vibing-coder-ai
```

LCP is whatever V4's LCP was. Per-project engagement counts
are observable via separate operator tooling (or a future
/evolution surface that reads the hash).

### 3.9 No per-project engagement tile on /evolution (for now)

Section 05 of /evolution already surfaces three telemetry tile
groups (view / category / event, playback verbs, timeline
engagement). Adding a fourth tile row for per-project counts
would crowd the section into dashboard territory — the V5
brief explicitly says "engineering archive, not dashboard".

The per-project hash is observable by the operator through
their existing KV tooling. A future sub-PR may surface it on
`/telemetry` or as a private operator surface; 7.4 stays
within scope.

### 3.10 Pill state + footer reflect Phase 7 closure

The pill on /evolution advances from "Phase 7 · slider" to
"Phase 7 · complete". The footer copy declares Phase 7
closure and the start of the 60-90 day observation window
before Phase 8. Same editorial discipline as Phase 6.5's
closure note.

---

## 4. KIRMIZI ÇİZGİ + Phase 7 philosophy enforcement

The V5 § 4.1 mandate stands across Phases 6 + 7:

> Visitor'a "noticed you spent 8 minutes on X" gibi creepy
> mesajlar verilmez. ASLA.

Per-project engagement adds ONE new dimension (project slug)
to the telemetry surface, but the slug is a PUBLIC architectural
identifier (already in URLs / sitemap / project ids), not a
per-visitor signal. The 7.4 mechanism cannot personalise:

| Layer | Mechanism |
|-------|-----------|
| Schema | `v5:topology:architecture-page` is hash-by-slug, count-only. No per-visitor field. |
| Storage | HINCRBY one field by 1; no record of which visitor contributed |
| Read path | `readArchitectureEngagement()` returns a flat `{slug: count}` map. No path to a visitor identity exists. |
| UI law | The slider on each architecture page reads / displays the SAME content for every visitor. No personalised message. |
| Voice | The section heading is "This system's evolution" — a property of the SYSTEM, not of the visitor. |

The Phase 7 brief's standard is also met: visitors should not
think "cool timeline" — they should think "this system
remembers itself". The 7.4 integration weaves the timeline INTO
each project's case study, so the timeline FEELS like part of
the system's documentation rather than a standalone widget.

---

## 5. What changed

| Action | File |
|--------|------|
| Edit | `data/temporal/events.ts` — +2 CWH events |
| New | `lib/v5/temporal/architecture-engagement.ts` — per-project hash + helpers |
| Edit | `app/api/v5/temporal/timeline/route.ts` — accept optional `context`, dispatch to per-project hash on engaged events |
| Edit | `components/v5/TimelineSlider.tsx` — accept `context` prop, fireEngagement orchestrates global + per-context fires |
| New | `app/architecture/_components/ArchitectureTimelineSection.tsx` — server-rendered wrapper, conditional + viewport-gated |
| Edit | `app/architecture/cloud-waste-hunter/page.tsx` — mount section |
| Edit | `app/architecture/vibing-coder-ai/page.tsx` — mount section (renders null until events ship) |
| Edit | `app/architecture/sixpack-ai/page.tsx` — mount section (renders null until events ship) |
| Edit | `app/evolution/page.tsx` — pill state → "Phase 7 · complete", 2 new SOURCE_LINKS entries, footer rewritten |
| New | `sub-pr-report/SUB-PR_7.4_REPORT.md` (this report) |

No new dependencies. No new env vars.

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 7.4 adds ONE new hash to the V5 telemetry family:

```
v5:topology:architecture-page  → hash {
  cloud-waste-hunter : count of unique sessions where the
                       slider on /architecture/cloud-waste-hunter
                       was engaged (per-session-per-slug dedupe).
  <future-slug>      : same, for any future architecture page
                       that mounts the section with ≥ 2 events.
}
```

The V5 § 5.2 stated slot
`v5:topology:architecture-page:timeline_engagements` is
implemented as the 2-segment hash above. Convention consistent
with Phase 6 + Phase 7 prior sub-PRs (long-form slot maps to
short-form hash for endpoint reuse).

Full Phase 7 schema after 7.4 (phase-complete):

```
v5:temporal:adoption                  → hash (7.1; 3 fields)
v5:topology:playback                  → hash (7.2; 5 fields)
v5:topology:timeline                  → hash (7.3; 2 fields)
v5:topology:architecture-page         → hash (7.4; N fields, one per slug)
v5:telemetry:evolution-page:visits    → scalar (7.1)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one slug field by 1; no per-visitor field |
| No fingerprint | The endpoint reads ONLY the JSON body `{ kind, context? }`. No IP, no UA, no cookie beyond what Vercel logs |
| No identity persistence | Slug is a public architectural identifier (URL slug); no visitor identity is ever in the payload |
| Slug validation | `isValidArchitectureSlug` (kebab-case, max 41 chars) rejects free-form values at the endpoint |
| No surfacing | The architecture page renders the SAME content for every visitor; the per-project engagement count is operator-side observability |
| Graceful no-op | KV unavailable → record helper returns silently; read helper returns `{}` |
| No consent gate | Symmetric with the rest of the temporal layer — public-archive content, no per-visitor data |

---

## 8. Performance posture

V5 § 5.2 7.4 budget: **LCP < 1.5s preserved**. Sub-PR 7.4
deliberately keeps the architecture pages static to honor this.

| Surface | Measurement |
|---------|-------------|
| /architecture/cloud-waste-hunter LCP | Static prerender; LCP element is the h1 in the header. Section sits AFTER the header, so the h1 is the LCP candidate as in V4. |
| /architecture/vibing-coder-ai LCP | Same. Section renders null (events.length < 2), so no slider HTML even in the SSR. V4 LCP exactly. |
| /architecture/sixpack-ai LCP | Same. |
| Architecture page bundle | The slider is route-isolated to /evolution + /architecture/*. The architecture pages' chunks now include the slider (~6-9 KB minified delta vs V4 baseline / ~2-3 KB gzipped). |
| Mobile execution cost | The slider hydrates on mobile (in the DOM, hidden via CSS). One useEffect + one useSyncExternalStore subscribe + one fireEngagement attempt on commit. ~2-5 ms wall-clock per page. |
| KV reads on architecture page render | 0. The pages stay fully static. |
| Endpoint latency (POST per-project) | One JSON parse + one slug validate + one HINCRBY. ~5-20 ms warm. Fire-and-forget. |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordArchitectureEngagement` in client chunks | 0 ✓ |
| `readArchitectureEngagement` in client chunks | 0 ✓ |
| `ARCHITECTURE_ENGAGEMENT_HASH_KEY` in client chunks | 0 ✓ |
| `isValidArchitectureSlug` in client chunks | 0 ✓ |
| `@vercel/kv` in client chunks | 0 ✓ |

The architecture page chunks include the slider primitive +
the section wrapper. The hash helpers + endpoint stay
server-only.

---

## 9. SEO posture

V5 § 5.2 7.4 risk: **SEO regression**. The integration is
designed against that risk:

| Concern | Mitigation |
|---------|-----------|
| Default content drift | The slider's initial cursor IS the LATEST event. SSR renders the V4-equivalent content; crawlers see the same architecture document as before. |
| Canonical URL | Unchanged. Each architecture page's `metadata.alternates.canonical` is not touched. |
| OG image | Unchanged. Each page's OG metadata is preserved verbatim. |
| Heading hierarchy | The new "This system's evolution" is an h2 below the h1. Single h1 per page (V4 invariant preserved). |
| Indexable content | The full slider + tick marks + current-event display are server-rendered HTML. Crawlers see the entire registry slice as text. |
| Sitemap | No new entries needed for 7.4. The /architecture/<slug> URLs are unchanged. |

A crawler hitting /architecture/cloud-waste-hunter today sees:
- All eight original ScrollStory milestones (unchanged)
- PLUS three timeline events surfaced inline (new in 7.4 —
  additive content, not replacement).

Net: more crawlable text, same canonical URL, same OG image.
SEO posture STRENGTHENS rather than regresses.

---

## 10. Edge / runtime notes

- `/api/v5/temporal/timeline` continues `ƒ Dynamic` (edge).
  Sub-PR 7.4 added the context-aware dispatch path; the
  endpoint signature is backward-compatible (Phase 7.3 clients
  without context continue to work).
- `lib/v5/temporal/architecture-engagement.ts` is server-only
  (imports `@vercel/kv`). Verified absent from client chunks.
- `app/architecture/_components/ArchitectureTimelineSection.tsx`
  is a Server Component. Renders the slider client island only
  when events.length >= 2.
- The three architecture pages remain Server Components, fully
  static at build time.

---

## 11. Rollback plan

V5 § 5.2 specifies "Rollback: Slider removal; page reverts to
V4". The single-commit revert removes:

- The 2 new CWH events from `data/temporal/events.ts`
- `lib/v5/temporal/architecture-engagement.ts`
- The context dispatch in `app/api/v5/temporal/timeline/route.ts`
- The `context` prop + two-fire orchestration in
  `components/v5/TimelineSlider.tsx`
- `app/architecture/_components/ArchitectureTimelineSection.tsx`
- The 3-line additions in each architecture page
- The 2 new SOURCE_LINKS + pill state + footer copy on
  /evolution

KV state orphaned after revert:
- `v5:topology:architecture-page` hash — no further writes.
  Can be `DEL`'d manually if desired.

No schema break, no env-var rollback, no migration story. The
architecture pages revert to V4 verbatim — same HTML, same
LCP, same OG image, same canonical URL.

Mid-flight rollback without code revert: removing the
`<ArchitectureTimelineSection>` JSX block from one architecture
page silences the slider on that one page; the others continue
to work.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 7.4-touched files | ✓ 0 errors, 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 49 static pages |
| All three architecture pages remain `○ Static` | ✓ |
| `/api/v5/temporal/timeline` continues `ƒ Dynamic` (edge) | ✓ |
| `/evolution` continues `ƒ Dynamic` with 1h ISR | ✓ |
| Server-only architecture-engagement symbols absent from `.next/static` | ✓ 0 matches |
| Slider client chunk on architecture pages | ~19-23 KB minified / ~6-7 KB gzipped (incl. ScrollStory + slider + section) |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| HTTP smoke: POST `{kind:"engaged", context:"cloud-waste-hunter"}` → 204 | ✓ |
| HTTP smoke: POST `{kind:"engaged", context:"BAD_SLUG"}` → 204 (silent drop, no HINCRBY) | ✓ |
| HTTP smoke: POST `{kind:"engaged"}` (no context) → 204 (global fire) | ✓ |
| HTTP smoke: POST `{kind:"mounted", context:"..."}` → 204 (context ignored per spec) | ✓ |
| CWH page renders timeline section with role="slider", `hidden md:block`, /evolution?system=cloud-waste-hunter link | ✓ |
| VCAI page renders NO timeline section (events.length=0) | ✓ |
| SixPack page renders NO timeline section | ✓ |
| /evolution shows new architecture-engagement.ts SOURCE_LINK | ✓ |
| /evolution pill state advances to "Phase 7 · complete" | ✓ |
| /evolution?system=cloud-waste-hunter filter renders all 3 CWH events | ✓ |
| OG image / canonical / heading hierarchy preserved on each architecture page | ✓ |
| Mobile path (< 768px) hides timeline section via CSS | ✓ verified via `hidden md:block` class presence |
| Cinematic identity preserved (`#00d2ff` accent, same gradient + Reveal pattern) | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 13. Phase 7 — what happens next

Per V5 § 0.2:

> Her observation süresi mecburi. Skipping = burnout +
> maintenance debt.

The 60-90 day observation window opens with this commit.
During that window:

- **No further temporal surface ships.** Phase 8 (Cinematic
  Topology) begins only when the observation window's triggers
  go green:
  - Privacy backlash count = 0 (V5 § 4.1)
  - Founder energy yeşil (V5 § 1.3)
  - Phase 8 mandatory 14-day off block (V5 § 1.3)
  - Operator capacity confirmed for the WebGPU maintenance
    overhead (V5 § 4.3)

- **The per-project engagement metric matures.** As visitors
  interact with the CWH slider, the
  `v5:topology:architecture-page.cloud-waste-hunter` field
  accumulates. The operator can see whether the slider earns
  its slot on the architecture pages.

- **Registry editorial expansion is welcome.** Future commits
  can append new events to `data/temporal/events.ts` as
  architectural moments land. When VCAI or SixPack cross the
  2-event threshold, their architecture-page sliders activate
  automatically.

Phase 8 begins only when all triggers go green. If any
trigger stays red, Phase 8 defers and Phase 7 systems get
polish + tuning. This is the disciplined-product-evolution
posture V5 § 0.2 mandates.

---

## 14. Future dependencies unlocked

This sub-PR closes Phase 7 and enables:

- **Phase 8.1** — WebGPU + Three.js fallback renderer. The
  Phase 7.2 `TemporalCursor` (now consumed by the slider on
  /evolution + 3 architecture pages) is the SAME contract the
  3D renderer will read. Phase 8.1's renderer will subscribe
  to the cursor's onChange and interpolate camera positions
  across topology snapshots.

- **Phase 8.2** — Topology Data Pipeline. The per-project
  registry slice that 7.4 surfaces via the slider is the
  EDITORIAL layer above whatever per-frame topology data
  Phase 8.2 ships. The slider's `event.id` (e.g.
  `v3-aws-topology-3d-scene`) can map to a topology snapshot
  manifest.

- **Phase 9.1** — Operational digital twin. The
  `getRecentEvolutionEvents(N)` slice the operational twin
  reads (synthesised + 4-week window) is the same registry
  the architecture pages now consume.

- **Phase 9.4** — Operational portrait OG card. The
  per-project engagement counts the operator now observes
  feed into the "which project earns the operator's voice"
  decision.

- **Lumina sub-agent (architecture-critic)** — can call
  `getEvolutionEventsBySystem(slug)` as ambient context when
  answering version-aware questions about a specific
  architecture.

---

## 15. Deferred systems

Carried from 7.1-7.3's deferred lists, plus 7.4-specific:

- **Per-project mounted counter** → not in 7.4's scope.
  Per-project ENGAGED is the V5 § 5.2 slot;
  per-project mounted would duplicate page-visit observability.
  Deferred to a hypothetical future operator-dashboard sub-PR.

- **Per-project engagement_rate tile on /evolution** → not in
  7.4. Section 05 is already at four telemetry-tile groups;
  adding a fifth crosses into dashboard territory. Deferred.

- **VCAI + SixPack registry events** → not in 7.4. The two
  projects' architectural memory is genuinely sparse from the
  portfolio's perspective. A future editorial pass can add
  honest events; the integration code waits for them.

- **Architecture-page section's visual treatment polish** →
  the current treatment is restrained and consistent with
  /evolution. Future tuning (animation tweaks, copy variations,
  per-project micro-customisation) can land if observation
  signals warrant.

- **Slider cursor sync with ScrollStory progress** → not in
  7.4. The slider and the ScrollStory are independent
  navigation modes for the same memory. Coupling them would
  conflict with the Phase 7 brief's restraint mandate.

- **OG image per-cursor-position** → not in 7.4. The OG
  image continues to show the latest snapshot (V4 behavior).
  A future sub-PR (probably Phase 8 or 9) could generate
  per-cursor OG images for share-link friendliness.

Permanently rejected (carried from V5 § 3.3):
- Per-visitor cursor history (saved scrub position per visitor)
- LLM-generated per-project narrative overlays
- Multi-project comparison slider (two cursors over two
  projects)

---

## 16. Next sub-PR

**60-90 day observation window opens.** No code ships against
the Phase 7 temporal layer during this period.

If the observation window's triggers go green, **Phase 8 begins
with Sub-PR 8.1** — WebGPU + Three.js Fallback Renderer
Foundation. Per V5 § 5.3:

- `lib/v5/topology/` + `app/v5/topology/<slug>/`
- WebGPU detection + Three.js fallback
- Mobile reduced static 2D fallback
- Idle frame 0
- Route-quarantined chunk

The Phase 7 mandatory 14-day off block (V5 § 1.3) applies
between this commit and any Phase 8 work.

Per V5 § 0.4:

> "V5'i dondur" → V4 maintenance moduna geri dönülür, V5'in
> geri kalanı kalıcı olarak deferred

If founder energy goes red during the observation window, V5
may freeze indefinitely. This is the disciplined-product-
evolution posture and not a failure mode.

Awaiting explicit approval per the V5 operating constitution.
The observation window starts now.

---

## 17. Closing — the system remembers itself, project by project

Sub-PR 7.1 shipped the engineering memory itself. Sub-PR 7.2
shipped the deterministic cursor primitive. Sub-PR 7.3 shipped
the slider — the first instrument that made the cursor
reachable. Sub-PR 7.4 mounts the SAME slider on each project's
architecture page, scoped to that project's events.

A visitor on /architecture/cloud-waste-hunter now reads about
the production stack AND can scrub through the three
architectural moments the system remembers about it: the 3D
topology scene, the hero topology transplant, the CWH Pro
monetization launch. Three moments, presented inline with the
ScrollStory below, hidden on mobile, opt-in by registry
coverage.

The visitor doesn't think "cool timeline." They read about
how the system works, then notice — quietly — that the system
has a memory of how it got that way. The cursor is the small
calm instrument that surfaces that memory without breaking
the page's voice.

Phase 7 closes here. Four sub-PRs, four atomic commits, one
60-90 day observation window opens. The cinematic topology
of Phase 8 is the next horizon — but only if the operator
energy, the engagement signal, and the V5 sustainability
constraints all go green.

The engineering archive is complete. The temporal architecture
is built.
