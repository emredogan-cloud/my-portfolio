# Sub-PR 6.5 — Public Perception Transparency Page (Expanded)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 6 — Sensory Awakening · Sub-PR 6.5 (Tier A · final)
**Scope:** Expansion of `/v5/perception`. Adds the public
algorithm description (three gates + ASCII flow + inference
layers), a cross-reference to /lumina/brain for the memory
layer's separate transparency surface, an extended source-files
catalog covering all Phase 6 modules, and the Phase 6 closure
note. No new dependencies, no new endpoints, no new env vars.
Single file edit.

---

## 0. Phase 6 closes

This is the FINAL Phase 6 sub-PR. After it lands, the V5 § 0.2
sequencing rule applies: a **60-90 day observation window**
opens before Phase 7 (Temporal Architecture) begins. No further
perception surface ships during that window — V5 § 1.3's
"sustainability tavanı" enforces it architecturally.

The five Phase 6 sub-PRs landed in disciplined sequence:

| Sub-PR | Title | Commit |
|--------|-------|--------|
| 6.1 | Perception Telemetry Foundation | `5eb14c3` |
| 6.2 | Cognition-Aware Navigation Primitives | `8f0949a` |
| 6.3 | Cinematic Pacing Engine | `01fe54a` |
| 6.4 | Memory Layer V5 (Extended) | `694feab` |
| 6.5 | Public Perception Transparency Page (this PR) | TBD |

Each shipped a single atomic commit. Each passed `tsc`, `eslint`,
`eval:lumina` (13/13), `eval:playground` (1/1), and a production
build. Each preserved cinematic identity, reduced-motion
compliance, and the KIRMIZI ÇİZGİ.

---

## 1. Mission

Sub-PR 6.1 shipped the foundation version of `/v5/perception`
(consent toggle + schema + privacy invariants + live snapshot).
6.5 expands that page with the **public algorithm description**
V5 § 2.3 mandates — visitors should see not just WHAT is
collected, but HOW the collection algorithm works, gate by
gate.

What 6.5 adds:

- **New Section 03 — "How it works"**: the three gates (env
  switch / closed schema / consent cookie) explained in
  operator-grade detail; an ASCII-style flow diagram showing
  every step from opt-in toggle to KV row; the two inference
  layers above storage (cognition state + pacing multiplier).
- **New Section 09 — "Related transparency"**: cross-links to
  `/lumina/brain` (memory contract + adoption hit-rate) and
  `/telemetry` (platform-wide dashboard). A privacy-minded
  reader of one finds the other.
- **Section renumbering**: 03→04, 04→05, 05→06, 06→07, 07→08,
  08→10 so the new sections land in their natural order.
- **Source-files catalog extended**: 7 new entries covering
  the cognition observer (6.2), pacing engine (6.3), and
  memory extensions (6.4). The catalog now describes every
  Phase 6 module that touches the perception layer.
- **Cinematic copy polish**: hero paragraph rewritten to
  frame the page as the audit surface for every Phase 6
  observer; the "Lumina memory" reference in section 04 now
  cross-links and mentions the configurable TTL from 6.4;
  footer updated with Phase 6 closure note.
- **Header pill state shift**: "Phase 6 · foundation" →
  "Phase 6 · transparency" with cyan accent, signaling the
  page has moved from chassis-only to the canonical audit
  surface.

V5 § 5.1 validation criteria, satisfied:
- [x] Public algorithm description (new Section 03)
- [x] What we collect / what we don't / how to opt out (sections 01, 02, 04 — preserved + cross-linked)
- [x] Cinematic-grade copy (hero polish + footer note + header pill state)
- [x] Static prerender, 1h ISR (unchanged from 6.1)
- [x] Telemetry: `v5:telemetry:perception-page:visits` (already wired via VisitPing in 6.1)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** Publishing the full algorithm rather than
legalese IS the V5 § 2.3 differentiator — "Visitor sadece ne
çalıştığını değil, **neden öyle çalıştığını** görür". The closed
schema + the three-gate explanation + the ASCII flow diagram
together turn the privacy contract into an operator console.
**PASS.**

**Q2 — Emergence:** The page closes the Phase 6 narrative:
every primitive 6.1-6.4 shipped is now audit-able from one URL.
The page is only meaningful BECAUSE 6.1-6.4 exist; in
isolation it would be empty documentation. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/month per V5 § 4.1 (page is
near-static; updates when a new category lands). **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):** Ecosystem-
bound, ecosystem-fed (reads its own KV), ecosystem-emergent
(only meaningful with 6.1-6.4 in place). ✓

**Anti-Generic-AI Law (V5 § 2.4):** No NL input, no upload, no
LLM call. Pure transparency content. ✓

---

## 3. Architectural decisions

### 3.1 New section inserted between 02 and 04, not appended

The algorithm description COULD have appended as a new section
near the bottom. Instead it sits at section 03 — directly after
the closed schema (02) and before the negative-space list (04).

Reasoning:
- Reading order matters. After the reader sees WHAT categories
  exist, the next natural question is HOW those categories get
  populated. The new section answers that question at the right
  moment.
- The negative-space list ("what is never collected") reads more
  powerfully after the reader has internalized the positive-space
  algorithm. The contrast lands harder when the algorithm is
  fresh.
- Renumbering subsequent sections is a one-pass edit — clean,
  reversible, mechanical.

### 3.2 The three gates explained with operator-grade depth

Each gate has its own card with: a name, a code-style condition,
and a paragraph explaining what the gate enforces and why. The
cards read like a runbook a future maintainer would consult:

```
Gate 1 · operator master switch  →  process.env[V5_PERCEPTION_ENABLED] === "1"
Gate 2 · closed schema           →  isPerceptionCategory ∧ isValidBucket
Gate 3 · visitor consent         →  Cookie: v5_perception_consent=granted
```

The third gate's `adoption` bypass is documented explicitly —
the only exception architecturally, and it's surfaced in plain
language ("recording the consent decision cannot itself
require prior consent").

### 3.3 ASCII flow diagram, not SVG

The flow from opt-in to KV row is rendered as a monospace text
block inside a `<pre>` element styled with the page's existing
black-card aesthetic. Trade-offs vs SVG:

| Form | Pros | Cons |
|------|------|------|
| ASCII | Renders identically on every device + reader mode + screen reader. Greppable. Editable in PRs. No SVG bundle. | Visual texture is austere. |
| SVG | Richer styling. Animated transitions possible. | Adds an asset, screen-reader unfriendly, harder to update in a PR diff. |

The ASCII form matches the rest of the page's monospace command-
shell motif (the "$ perception.snapshot" empty-state from 6.1
already establishes this voice). The cinematic-grade-copy
criterion in V5 § 5.1 is satisfied through restraint, not
ornament.

### 3.4 Cognition + pacing surfaced under "Two inference layers above storage"

The cognition signal and pacing multiplier are not stored as
raw data — they're computed from existing inputs (session
counter, OS preference) and exposed via React Context to
consumers. This is architecturally important enough that the
algorithm section calls it out explicitly.

The dl-list form (label + paragraph) is the same shape Section
05 "Privacy invariants" uses. Visual consistency reinforces the
semantic relationship: these are operating guarantees, not
data points.

### 3.5 Related transparency cross-links sit between WHY and SOURCE

The cross-references (Section 09) intentionally land AFTER "Why
this exists" (Section 08) but BEFORE "Source files" (Section 10).
Reading order:

1. Why this layer exists (the operating reason)
2. Where else V5 transparency lives (the ecosystem reference)
3. The source files themselves (the proof)

A reader who finishes the WHY but isn't yet at the SOURCE level
sees the cross-link and can navigate to the related surface
without losing their place.

### 3.6 Source-files catalog extended to 11 entries

The original 6.1 catalog had 5 entries (the perception modules
+ endpoint + this page). Sub-PR 6.5 extends it to 11 by adding:

- Cognition observer + cognition inference (6.2)
- Pacing provider + pacing inference (6.3)
- Memory TTL + memory adoption (6.4)

The catalog now describes every Phase 6 module visible from
this surface. The 11 entries fit the existing divide-y dl
layout without overflowing — each row is a single line of
descriptive note.

### 3.7 Header pill state shift

The 6.1 pill read "Phase 6 · foundation" in neutral white-tinted
border. 6.5 changes it to "Phase 6 · transparency" with the
cyan accent. The shift signals:

- The page is no longer a foundation placeholder (it now
  carries the full algorithm description).
- It's the canonical V5 transparency surface — earning the
  identity-color accent that other completed V5 surfaces use.

The tooltip text updates accordingly: "Phase 6 foundation
complete — observation window opens after Sub-PR 6.5."

### 3.8 Footer adds Phase 6 closure note

The 6.1 footer was a single line of metadata pills. 6.5 keeps
that line (with one minor edit) and adds a paragraph below it
that announces the Phase 6 closure + the 60-90 day observation
window before Phase 7. This is the V5 § 0.2 sequencing rule
made visitor-visible without breaking the cinematic restraint.

---

## 4. KIRMIZI ÇİZGİ enforcement (unchanged)

The V5 § 4.1 mandate stands across all five Phase 6 sub-PRs.
6.5 changes nothing about the no-creepiness guarantee:

| Layer | Mechanism |
|-------|-----------|
| Schema | Eight categories, all bucket-only. Unchanged from 6.4. |
| Storage | Eight HASHES. No per-visitor field. Unchanged. |
| UI law | Section 09 cross-links to /lumina/brain (memory) and /telemetry (platform) — both are aggregate-only surfaces themselves. No new visitor-addressed message anywhere on the page. |
| Algorithm description | The new Section 03 describes the algorithm but does NOT describe per-visitor outputs. The cognition signal explanation says "the state never regresses within a session" — that's a per-session invariant, not a per-visitor exposure. |

The page reads to the visitor as a system documentation, not a
personalised report. There is still no surface anywhere that
addresses the visitor about their own collected data — and
architecturally, there can't be one, because per-visitor data
doesn't exist.

---

## 5. What changed

| Action | File |
|--------|------|
| Edit | `app/v5/perception/page.tsx` — see breakdown below |
| New | `sub-pr-report/SUB-PR_6.5_REPORT.md` (this report) |

The page edit covers:
- Docblock rewritten to describe the 10-section structure.
- `PAGE_DESCRIPTION` updated to mention the full algorithm.
- Header pill state + label + tooltip updated.
- Hero paragraph rewritten for cinematic restraint.
- **NEW Section 03** — 3 gate cards + ASCII flow + 2 inference dl-list rows (~120 lines of TSX).
- Section 04 (negative space) updated: Lumina memory cross-link + configurable TTL mention.
- Sections 05-08 numbered up by 1 each (one-line edits each).
- **NEW Section 09** — Related transparency cross-links to /lumina/brain and /telemetry.
- Section 10 (Source files) renumbered + extended with 6 new entries (cognition observer, cognition inference, pacing provider, pacing inference, memory TTL, memory adoption).
- Footer extended with Phase 6 closure note.

**Single file edit**, per the spec's "Affected: Yeni
app/v5/perception/page.tsx" line. No other file touched.

---

## 6. Telemetry schema (unchanged)

No new categories, no new hash keys, no new endpoints. The page
visit counter `v5:telemetry:perception-page:visits` continues to
fire via the existing `VisitPing surface="v5-perception"` island
mounted in 6.1.

The eight perception categories the page now documents in full:

```
v5:perception:scroll-velocity     → 4 buckets (no observer yet)
v5:perception:dwell-time          → 6 buckets (no observer yet)
v5:perception:section-engagement  → dynamic-shape (no observer yet)
v5:perception:tab-visibility      → 3 buckets (no observer yet)
v5:perception:navigation-flow     → dynamic-shape (6.2 observer writes)
v5:perception:cognition-signal    → 3 buckets (6.2 observer writes)
v5:perception:pacing-transition   → 4 buckets (6.3 visibility beacon writes)
v5:perception:adoption            → 3 buckets (6.1 opt-in toggle writes)
```

Plus the per-event memory adoption hash:

```
v5:memory:adoption                → 4 fields (6.4; surfaced on /lumina/brain)
```

---

## 7. Privacy guarantees (unchanged)

All eight invariants from Sub-PR 6.1's Section 04 / Privacy
contract continue to hold:

- Aggregate-only
- No fingerprint
- No identity persistence
- Opt-in default-off
- No surfacing
- Graceful no-op
- One-click revoke
- Monotonically additive aggregation

Sub-PR 6.5 adds zero new data paths. The new content is
descriptive, not collection-extending.

---

## 8. Performance posture

V5 § 5.1 budget: static prerender, 1h ISR.

| Surface | Measurement |
|---------|-------------|
| `/v5/perception` render | Static prerender at build; ISR every 1h. Unchanged from 6.1. |
| Page weight (raw HTML) | Increased by ~3 KB minified (~1 KB gzipped) from the new content. Within the V5 § 2.7 envelope. |
| LCP impact | None — the new content sits below the fold (sections 03+ render after the hero + opt-in card). |
| Client JS | Unchanged. Only `OptInToggle` (existing client island from 6.1) ships JS; the new content is server-rendered HTML. |
| KV reads at ISR time | Unchanged at 8 HGETALL calls via `readPerceptionSnapshot()`. |
| Bundle posture | Unchanged. No new server-only symbols, no new dependencies. |

---

## 9. Edge / runtime notes

- `/v5/perception` continues to register as `○ Static` with
  `1h` revalidate. Build output confirms.
- `/api/v5/perception/event` continues to register as `ƒ
  Dynamic` (edge). Unchanged from 6.1.
- The new ASCII flow diagram is a static `<pre>` block —
  rendered server-side, no client interaction, no hydration
  state.

---

## 10. Rollback plan

V5 § 5.1 specifies "Rollback: Route delete". In practice the
cleaner rollback is to revert just the 6.5 commit, which:

- Restores the 6.1 page (5-section structure)
- Removes the new Section 03 (How it works)
- Removes the new Section 09 (Related transparency)
- Removes the 6 new source-file entries
- Restores the original footer + hero copy

No KV state is touched by 6.5. No new endpoints exist. No new
modules exist. The rollback is a single-file diff.

If a more drastic rollback is needed (full route deletion), the
recipe is identical to the 6.1 rollback: delete `app/v5/` and
`app/api/v5/`, revert the `v5-perception` surface from
`app/api/telemetry/visit/route.ts` allow-list and from the
`VisitPing` surface union. The KV hashes orphan harmlessly.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint app/v5/perception/page.tsx` | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/v5/perception` registered `○ Static`, 1h ISR | ✓ |
| `/api/v5/perception/event` registered `ƒ Dynamic` (edge) | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core) | ✓ |
| Reduced-motion compliance (no new motion; inherits globals.css guard) | ✓ |
| Hydration safety (Server Component edits only; no new client state) | ✓ |
| No new endpoint, no new env var, no new dependency | ✓ |
| Single-file edit (spec compliance) | ✓ |
| Cross-link to /lumina/brain works (route exists, visible) | ✓ |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 12. Phase 6 — what happens next

Per V5 § 0.2:

> Her observation süresi mecburi. Skipping = burnout +
> maintenance debt.

The 60-90 day observation window opens with this commit. During
that window:

- **No further perception sub-PR ships.** The chassis is
  complete; observation tests whether the foundation earns
  its slot.
- **The aggregate snapshot accumulates.** If the operator
  flips `V5_PERCEPTION_ENABLED=1` AND visitors opt in, the
  perception categories will gather signal that Phase 7-10
  surfaces can read as ambient context.
- **Privacy backlash is the single trigger for early-exit.**
  V5 § 4.1 lists privacy backlash as the Phase 6 risk; one
  signal of creepiness lands an immediate audit + potential
  rollback.
- **Memory hit-rate is the second metric.** If the
  `/lumina/brain` adoption tile shows the hit-rate < 30%
  after 60 days, the layer isn't earning its KV cost; V5 §
  2.10 says "weekly cost projection > $500/month → Phase
  pause".

Phase 7 (Temporal Architecture) begins only when:
- Observation window ≥ 60 days
- Privacy backlash count = 0
- Founder energy yeşil (per V5 § 1.3)
- Memory hit-rate trends positive

If any of those isn't green, Phase 7 defers and Phase 6 systems
get polish + tuning. This is the disciplined-product-evolution
posture V5 § 0.2 mandates.

---

## 13. Deferred systems (carried forward)

6.5 closes Phase 6 without un-deferring anything. The following
remain explicit Phase 6 deferrals:

- **Scroll-velocity observer** — needs a passive scroll listener
  with idle-CPU discipline; deferred to a later observation-window
  decision.
- **Dwell-time observer** — needs a visibility + page-close
  beacon; the dwell-time bucket allow-list exists but no
  producer.
- **Section-engagement observer** — needs IntersectionObserver
  for in-viewport sections; deferred.
- **Tab-visibility observer** — same `visibilitychange` event
  the pacing engine already subscribes to, but bucketed
  differently. Could land alongside or after the pacing
  observer.
- **Reveal.tsx pacing retrofit** — the natural first consumer
  of `usePacing()`. Deferred from 6.3 to keep scope discipline.
- **Pages-index observer** — the cross-surface coupling between
  the Lumina session id and the navigation observer isn't yet
  justified; deferred to Phase 10 Lumina V5 wiring.
- **`opt-out` adoption counter instrumentation** — the chat
  route's existing opt-out branch doesn't yet increment the
  reserved field; deferred to a future memory sub-PR.

These deferrals are honest infrastructure debt. The 60-90 day
observation window may identify some as ship-worthy, some as
permanent rejections. Both outcomes are valid V5 posture.

---

## 14. Next sub-PR

**60-90 day observation window.** No code ships against the
Phase 6 perception layer during this period. If the observation
window's triggers go green, Phase 7 (Temporal Architecture)
begins with Sub-PR 7.1 — Architecture Snapshot Manifest Format.

Per V5 § 0.4:

> "V5'i dondur" → V4 maintenance moduna geri dönülür, V5'in
> geri kalanı kalıcı olarak deferred

If the observation window surfaces a privacy backlash signal,
or if founder energy goes red, V5 may freeze indefinitely.
This is the disciplined-product-evolution posture and not a
failure mode.

Awaiting explicit approval per the V5 operating constitution.
The observation window starts now.

---

## 15. Closing — the transparency surface is the brand

Sub-PR 6.5 closes Phase 6 by completing the page that explains
Phase 6 itself. The visitor who arrives at `/v5/perception`
now sees, end-to-end:

- The opt-in toggle (Section 01) — the only interactive surface
- The closed schema of eight categories (Section 02) — what
  the layer is allowed to collect
- The full algorithm with three gates + ASCII flow diagram +
  two inference layers (Section 03) — how the collection
  actually works
- The negative-space list (Section 04) — what is never
  collected
- The privacy invariants (Section 05) — the structural
  guarantees
- The retention + aggregation model (Section 06) — the data
  lifecycle
- The live aggregate snapshot (Section 07) — the current state
- The reason any of this exists (Section 08) — the operating
  why
- The related transparency surfaces (Section 09) — the
  ecosystem cross-links
- Every source file documented above (Section 10) — proof in
  code

V5 § 2.3 demands that "public transparency BRAND'in kendisi
haline gelir" — public transparency becomes the brand itself.
This page is that brand-as-page: the privacy contract is not a
legal document hidden behind a footer link, it's the canonical
explanation of how the site treats the visitor.

A visitor who reads this page learns more about how this
portfolio works than they could learn about how most production
SaaS products work from their privacy docs. That asymmetry is
the V5 wedge. The 60-90 day observation window now tests
whether it earns the slot.

Phase 6 closes here. The observation window opens.
