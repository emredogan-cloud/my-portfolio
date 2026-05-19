# Sub-PR 8.5 — Adaptive Recruiter Intelligence (PHASE 8 CLOSE)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 8 — Spectacle Systems & Topology Intelligence · Sub-PR 8.5 (Tier B · phase-closing foundation)
**Scope:** Pure-foundation pass for the adaptive recruiter
interface. 4-pattern classifier (default / senior-engineer /
casual / recruiter) + client-side signal readers (cognition,
referrer, visited-prefixes) + telemetry hash + edge endpoint +
flag + would-be Provider component. **Provider NOT mounted;
`/contact` unchanged.** Phase 8 closes with this commit; 90-day
observation window opens before Phase 9 (Operational Digital
Twin) begins.

---

## 0. Phase 8 closes

Five sub-PRs landed Phase 8 in disciplined sequence, one atomic
commit each:

| Sub-PR | Title | Commit |
|--------|-------|--------|
| 8.1 | Topology Intelligence Foundation (brain) | `28b2af6` |
| 8.2 | Topology Renderer Foundation (engine) | `eaf76a3` |
| 8.3 | Production Project Mount (the spectacle) | `143f8e2` |
| 8.4 | Engineering Aura Foundation (perceptual fingerprint) | `6cca4f3` |
| 8.5 | Adaptive Recruiter Intelligence Foundation (this PR) | TBD |

Per V5 § 0.2:

> Phase 8 (Cinematic Topology)       → ship → 90 gün observation

The 90-day observation window opens with this commit. No
further topology / aura / contact surface ships during that
window. Phase 9 (Operational Digital Twin) begins only when
observation triggers go green per V5 § 4.5.

---

## 1. Mission

V5 future § 4.1 specifies the adaptive recruiter interface:
the /contact page reorders its sections based on the
visitor's site-internal pacing pattern. Same content, different
weight distribution — V5 future calls this **compositional
reordering**, not personalisation.

Three named patterns + a default fallback:

- **senior-engineer** — long dwell + engineering-page
  engagement. Layout leads with direct engagement (email +
  Calendly).
- **casual** — short dwell + many pages, early in the session.
  Layout leads with elevator pitch + case studies.
- **recruiter** — LinkedIn referrer or /projects engagement.
  Layout leads with "what I'd build for you" + rate /
  availability.
- **default** — no clear signal. Universal SSR fallback.

The KIRMIZI ÇİZGİ from V5 future § 4.1 is the load-bearing
constraint:

> **Ne olmaz:** "We know you're a recruiter!" notification yok.
> Pattern detection asla mention edilmez.

Sub-PR 8.5 ships the foundation that obeys this rule
structurally:
- Patterns are internal labels (no display string).
- Patterns carry no visitor identifier.
- All signals are session-scoped + client-only (sessionStorage,
  document.referrer). No cookie, no fingerprint, no cross-
  session persistence.
- The classifier returns `default` whenever signals are
  ambiguous — uncertainty produces the universal layout.

Sub-PR 8.5 ships the foundation ONLY. The would-be Provider
exists at `components/v5/AdaptivePatternProvider.tsx` but is
NOT mounted on `/contact`. The contact page stays unchanged.
A future sub-PR (after the 90-day observation) decides whether
to mount + which sections to add.

---

## 2. What 8.5 ships

- **`lib/v5/contact/schema.ts`** — Closed allow-list of 4
  `ContactPattern` labels + 7 `ContactSectionId` slots +
  `ContactSignals` shape + `NEUTRAL_SIGNALS` baseline.
- **`lib/v5/contact/signals.ts`** — Client-side signal
  readers. `readClientSignals()` aggregates cognition signal
  (Phase 6.2 sessionStorage), document.referrer, visited-
  prefixes set. `recordVisitedPrefix()` is the future
  observer's session-storage write helper. Closed allow-list
  of 8 tracked prefixes (`/architecture`, `/lumina/brain`,
  `/v5/topology`, `/v5/perception`, `/projects`,
  `/evolution`, `/lab`, `/notes`).
- **`lib/v5/contact/classifier.ts`** — Pure function from
  signals to pattern label. Priority-ordered decision tree:
  recruiter → senior-engineer → casual → default. Conservative
  defaulting (uncertain → default).
- **`lib/v5/contact/telemetry.ts`** — `v5:contact:adoption`
  KV hash with 4 fields (`pattern_default`,
  `pattern_senior_engineer`, `pattern_casual`,
  `pattern_recruiter`). Record + read helpers.
- **`lib/v5/contact/flags.ts`** — `V5_CONTACT_ADAPTIVE_ENABLED`
  env (default off).
- **`app/api/v5/contact/event/route.ts`** — Edge POST
  endpoint. Body `{ pattern }`, 204-only, 4-pattern allow-list.
- **`components/v5/AdaptivePatternProvider.tsx`** —
  `"use client"` Provider that records visited prefixes,
  classifies, applies `data-pattern` attribute to a host
  element, fires session-deduped telemetry. NOT MOUNTED in
  `app/layout.tsx` or `app/contact/page.tsx`.

V5 § 5.3 8.5 (Adaptive Recruiter Intelligence) validation
criteria, satisfied by foundation discipline:
- [x] No "we know you're a recruiter!" surface (Provider is
  not mounted; the schema + helpers carry NO display string;
  classifier output is an internal label only)
- [x] Risks: "creep into personalization theater" → mitigated
  by foundation-only ship: the visitor sees zero adaptive
  surface in 8.5, eliminating the theater risk entirely
  (theater requires a stage; we ship the actor without a
  stage)

---

## 3. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A contact page that reorders by visitor
session pattern — same content, different weight distribution
— with the classifier reading SESSION-SCOPED client-only
signals (no cookies, no fingerprinting), framed editorially
as "compositional reordering" rather than "personalisation",
is rare. Most portfolio sites either (a) ship one contact
page for everyone, or (b) personalise via tracked cookies
(privacy-hostile). The 8.5 approach is the third path —
adaptive AND privacy-safe. **PASS by extension** — the
foundation enables the third path; the visible mount is the
future sub-PR's editorial decision.

**Q2 — Emergence:** Zero standalone value. The classifier
runs against signals that no observer populates in 8.5; the
Provider doesn't mount; the contact page is unchanged. The
value crystallises when (a) a future sub-PR mounts the
Provider globally (to track visited prefixes across the
session) + (b) the same sub-PR opts the /contact layout into
reading the `data-pattern` attribute via CSS `order` rules.
The two halves emerge together; either alone is dormant.
**Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month per V5 § 4.3 once the
mount lands. The classifier itself is a 10-branch decision
tree; the signals layer reads 4 client-only fields; the
telemetry is a single hash. Maintenance pressure is near-
zero. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the classifier reads THIS portfolio's
  session signals (the Phase 6.2 cognition observer's page
  counter, the tracked-prefix allow-list of THIS site's
  surfaces). Copying the system to another portfolio without
  the perception layer + the matching surfaces would
  classify every visitor as "default". ✓
- Ekosistem-fed: pure client-side state + the standard
  browser referrer header. No external calls, no LLM, no
  fingerprint vendor. ✓
- Ekosistem-emergent: meaningless without the Phase 6.2
  cognition signal source + the future observer + the future
  mount. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The classifier is a
  10-branch deterministic decision tree. ✓

---

## 4. Architectural decisions

### 4.1 Conservative defaulting (uncertain → default)

The classifier returns `default` when signals are ambiguous:
- No cognition signal (page counter missing) → default
- No referrer + no engineering-depth visits → default
- Cognition is "exploring" BUT visitor touched engineering
  surfaces (mixed signal) → default

This is the foundation-stage stance. The user's V5 future
§ 4.1 KIRMIZI ÇİZGİ — pattern detection asla mention edilmez —
applies STRUCTURALLY: defaulting means the visitor sees the
neutral layout when the system isn't confident. There is no
"low-confidence recruiter" or "maybe-engineer" — the
classifier either matches a pattern with evidence, or it
returns the universal layout.

### 4.2 Closed allow-lists at every boundary

- 4 pattern labels — exactly the four V5 future § 4.1 names.
- 8 tracked prefixes in `TRACKED_VISIT_PREFIXES` — only the
  surfaces whose visits contribute to classification.
- 2 recruiter-referrer hosts (`linkedin.com`, `lnkd.in`) —
  conservative; the classifier rejects free-form host
  matching.
- 4 engineering-depth prefixes for the senior-engineer
  signal.
- 1 recruiter-indicator prefix (`/projects`) — combined with
  engineering-depth visits to detect engaged recruiters.

Every input boundary rejects anything outside the closed set.
A misbehaving client can't poison the classifier with crafted
session storage values — the closed allow-lists ignore
unrecognised entries.

### 4.3 Session-scoped client-only signals

ALL signals live in sessionStorage + document.referrer.
- sessionStorage drops on tab close → no cross-session
  linking.
- document.referrer is browser-standard + privacy-respected
  by every major browser (referrer policies + browser
  modes redact appropriately).
- The classifier reads ZERO server-side state (no cookies,
  no IP, no UA) and ZERO cross-session state.

This is the cleanest privacy posture short of pure-server
classification (which would require ANONYMOUS-but-cross-
session identity → cookies → tracking risk). The session-
only design eliminates that risk entirely.

### 4.4 Provider mounts OPTIONAL host element

The Provider accepts an optional `applyTo` prop:
- Passed: applies `data-pattern` to that element. Useful for
  scoping the attribute to the `/contact` page's wrapper —
  only that subtree's CSS rules read it.
- Omitted: applies `data-pattern` to `document.documentElement`.
  Useful when the Provider mounts globally — every page's
  CSS rules can read it.

This dual-mount capability lets a future sub-PR decide
between:
- Page-scoped mount (just /contact reads the pattern)
- Global mount (every page potentially reads, but only
  /contact actually styles based on it)

8.5 ships the flexibility; future sub-PR picks.

### 4.5 Pattern fire is per-classification, not per-mount

The Provider fires telemetry when the classification
CHANGES, not when it mounts. A visitor whose session starts
as `default` but evolves into `senior-engineer` after they
engage with the architecture surface fires TWICE — once for
`default`, once for `senior-engineer`. Up to 4 fires per
session in the pathological case.

This captures the SESSION TRAJECTORY rather than the
arrival snapshot. The operator can see "what fraction of
sessions evolved into a recognised pattern" vs "what
fraction stayed at default".

### 4.6 No `/contact` modifications in 8.5

The contact page stays at its current 57 lines. The same
restraint discipline 8.4 (aura Provider unmounted) followed.
Reasons:
- "ONE SPECTACLE ONLY" — Phase 8.3's topology mount IS the
  spectacle. Adding adaptive sections to /contact would
  compound the visible Phase 8 surface area.
- Compositional reordering is meaningful only when there
  ARE multiple sections to reorder. The current /contact
  has 2 elements (header + form). 8.5 ships the chassis;
  the future "add adaptive sections + mount Provider"
  sub-PR is a deliberate editorial pass that the operator
  can defer indefinitely.
- The 90-day observation window can test the classifier's
  distribution against KV (operator-side) without exposing
  any visible adaptive layout. If the distribution looks
  off, the mount sub-PR never ships.

### 4.7 Telemetry surfaces aggregate-only

The hash holds 4 cumulative counters by pattern label. The
operator reads:
- `pattern_default` / `pattern_senior_engineer` /
  `pattern_casual` / `pattern_recruiter`

No per-visitor field exists. The reverse-mapping from a
pattern label back to a visitor is information-theoretically
impossible — a label is 1-of-4, with ~25% probability per
class assuming uniform distribution. No identity
reconstruction is possible from any single field or any
combination.

### 4.8 Foundation-only ship for Phase 8 closure

Phase 8.5 is the FIFTH sub-PR in Phase 8. The user's
sequence has alternated visible / invisible:
- 8.1 (brain) — invisible
- 8.2 (engine) — invisible
- 8.3 (spectacle) — visible, ONE project mount
- 8.4 (aura) — invisible foundation
- 8.5 (recruiter) — invisible foundation (THIS PR)

The "ONE SPECTACLE ONLY" rule was satisfied at 8.3. 8.4 and
8.5 are invisible foundations that future sub-PRs can opt
into. This closing sequence respects the user's restraint
mandate exactly.

---

## 5. KIRMIZI ÇİZGİ + Phase 8 philosophy enforcement

The user's Phase 8 standard + V5 future § 4.1 dual mandate:

> Visitors should NEVER eventually think:
> "nice animation."

> **Ne olmaz:** "We know you're a recruiter!" notification yok.
> Pattern detection asla mention edilmez.

Sub-PR 8.5 ships nothing visible — the Provider is unmounted,
the contact page stays minimal. But the schema's design
guarantees that when a future sub-PR mounts the Provider +
adds adaptive sections, the visitor doesn't see "they
detected me":

| Failure mode | Mitigation in 8.5 |
|--------------|---------------------|
| "We know you're a recruiter" message | The schema has no display string for patterns. The Provider applies a `data-pattern` HTML attribute that CSS reads; nothing user-visible. |
| Visible classifier mention | The Provider's only output is the data attribute + a fire-and-forget telemetry event. Zero rendered DOM beyond `null`. |
| Per-visitor saved profile | Session-scoped (sessionStorage); drops on tab close. No cookie, no localStorage, no server-side identity. |
| Layout shift on classification | Future mount uses CSS `order` rules (changeable in ONE frame; no DOM mutation). |
| Personalisation theatre | The classifier returns `default` when uncertain. The default layout serves every visitor whose session shape doesn't clearly indicate a pattern. |
| Cross-session tracking | sessionStorage drops on tab close. There is NO storage of any visitor signal beyond the lifetime of the tab. |

The 4-pattern + closed-allow-list design forces composition
over personalisation: the same content reorders for
EVERYONE whose session shape matches the pattern — not for
THIS visitor in particular. Compositional, not personal.

---

## 6. What changed

| Action | File |
|--------|------|
| New | `lib/v5/contact/schema.ts` — patterns, sections, signals shape |
| New | `lib/v5/contact/signals.ts` — client-side readers + visited-prefix recorder |
| New | `lib/v5/contact/classifier.ts` — pure pattern classifier (10 branches) |
| New | `lib/v5/contact/telemetry.ts` — KV adoption hash + helpers |
| New | `lib/v5/contact/flags.ts` — V5_CONTACT_ADAPTIVE_ENABLED env |
| New | `app/api/v5/contact/event/route.ts` — edge POST endpoint |
| New | `components/v5/AdaptivePatternProvider.tsx` — client Provider (NOT mounted) |
| New | `sub-pr-report/SUB-PR_8.5_REPORT.md` (this report) |

**No existing files modified.** `app/contact/page.tsx`,
`app/contact/ContactForm.tsx`, `app/contact/actions.ts`,
`app/layout.tsx` — all unchanged.

No new dependencies. No new env vars REQUIRED (only the
optional flag).

---

## 7. Telemetry schema (V5 § 2.13)

Sub-PR 8.5 adds ONE new hash:

```
v5:contact:adoption  → hash {
  pattern_default          : visitor fell through to default
  pattern_senior_engineer  : senior-engineer classification
  pattern_casual           : casual-browser classification
  pattern_recruiter        : recruiter classification
}
```

The hash stays at zero in 8.5 — the Provider is unmounted,
nothing fires. The slots are reserved; a future mount
populates them.

Full V5 telemetry schema after Phase 8 closure:

```
v5:perception:<category>              → hash (Phase 6.1+)
v5:memory:adoption                    → hash (Phase 6.4)
v5:temporal:adoption                  → hash (Phase 7.1)
v5:topology:playback                  → hash (Phase 7.2)
v5:topology:timeline                  → hash (Phase 7.3)
v5:topology:architecture-page         → hash (Phase 7.4)
v5:topology:graph                     → hash (Phase 8.1)
v5:aura:adoption                      → hash (Phase 8.4)
v5:contact:adoption                   → hash (Phase 8.5, NEW)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
v5:telemetry:topology-page:visits     → scalar (Phase 8.3)
```

---

## 8. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Aggregate-only | HINCRBY one pattern field by 1; the hash has no per-visitor field |
| Session-scoped signals | All signals (cognition counter, visited prefixes, referrer) live in sessionStorage / document.referrer. Tab close drops everything |
| No cookie, no localStorage, no cross-session identity | The classifier never reads / writes persistent storage |
| No fingerprint | No UA, no IP, no Accept-Language, no screen dimensions, no canvas fingerprint, no timing analysis |
| Closed allow-list at every input | Pattern labels, tracked prefixes, recruiter referrer hosts — all closed |
| Conservative defaulting | Uncertain signals → `default` pattern. The system never guesses |
| No visitor-visible surface | The Provider applies a `data-pattern` attribute; nothing rendered. The classifier label never appears in the DOM |
| KIRMIZI ÇİZGİ structural | The schema has no display string for patterns. The Provider has no children. Pattern detection cannot be mentioned because the codebase doesn't carry the text to mention it |

---

## 9. Performance posture

| Surface | Measurement |
|---------|-------------|
| Classifier compute cost | ~5 µs of pure JS arithmetic (10 branches max, all O(1) set lookups). 4 orders of magnitude below any meaningful budget |
| Signal-reader cost | 3 sessionStorage reads + 1 document.referrer read = ~1 ms wall-clock |
| Provider mount overhead (when eventually mounted) | One useEffect on pathname change. Same shape as the Phase 6.2 cognition observer |
| Client bundle delta on every existing route | 0. The Provider is not mounted; all aura modules tree-shake from every chunk |
| Endpoint latency | One JSON parse + one validate + one HINCRBY. ~5-20 ms warm. Fire-and-forget |
| Existing `/contact` page | Static, unchanged from before 8.5 |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `recordContactPattern` / `readContactAdoption` / `CONTACT_ADOPTION_HASH_KEY` in client | 0 matches |
| `classifyContactPattern` / `readClientSignals` / `recordVisitedPrefix` in client | 0 matches |
| `AdaptivePatternProvider` symbol in client | 0 matches |
| `VISITED_PREFIXES_STORAGE_KEY` / `PATTERN_FIRED_STORAGE_KEY` in client | 0 matches |
| `V5_CONTACT_ADAPTIVE_ENABLED` / `isContactAdaptiveEnabled` in client | 0 matches |
| `@vercel/kv` in client | 0 matches |

The adaptive recruiter system is completely server-side
until a future sub-PR mounts the Provider.

---

## 10. Edge / runtime notes

- `/api/v5/contact/event` declares `export const runtime = "edge"`.
  Build output confirms `ƒ /api/v5/contact/event` (Dynamic,
  edge-inferred). One HINCRBY per qualifying event.
- `lib/v5/contact/schema.ts` + `classifier.ts` + `flags.ts`
  are pure data + pure functions — universally importable.
- `lib/v5/contact/signals.ts` is pure helpers (sessionStorage
  reads are guarded by `typeof window`) — importable from
  any runtime, returns neutral defaults on server.
- `lib/v5/contact/telemetry.ts` imports `@vercel/kv` and is
  server-only. Verified absent from client chunks.
- `components/v5/AdaptivePatternProvider.tsx` declares
  `"use client"`. Not currently importable from any rendered
  route; tree-shakes out of every chunk.

---

## 11. Rollback plan

The single-commit revert removes all 7 modules + the report.

KV state orphaned after revert: `v5:contact:adoption` hash —
empty (Provider unmounted = no events fired). Can be `DEL`'d
manually if desired.

No schema break, no env-var rollback, no migration story.
Every other system unchanged. The repo reverts to the 8.4
tip exactly.

Mid-flight rollback without code revert:
- Leaving `V5_CONTACT_ADAPTIVE_ENABLED` unset (default) →
  flag-off; the future mount sub-PR's check short-circuits
  to no-op.
- Removing the `<AdaptivePatternProvider />` mount line
  (when the future sub-PR adds it) silences the system; the
  helpers + endpoints stay available.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 8.5-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ 13/13 |
| `npm run eval:playground` | ✓ 1/1 |
| Production build | ✓ 50 pages, 0 warnings |
| `/api/v5/contact/event` registered as `ƒ Dynamic` (edge) | ✓ |
| `/contact` remains `○ Static` (unchanged) | ✓ |
| Bundle posture (contact server symbols in client) | ✓ 0 matches across 10+ symbols |
| Provider symbols absent (not mounted) | ✓ 0 matches |
| Flag check absent from client | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| HTTP smoke: POST all 4 valid patterns → 204 | ✓ |
| HTTP smoke: POST invalid pattern / malformed → 204 (silent drop) | ✓ |
| HTTP smoke: GET → 405 Allow: POST | ✓ |
| `/contact` HTML carries no `data-pattern` or Provider symbol | ✓ |
| Existing routes unaffected (/, /contact, /evolution, /architecture/*) | ✓ |
| No new dependencies | ✓ `package.json` unchanged |
| No new env vars REQUIRED | ✓ (only optional flag) |
| Phase 8 KIRMIZI ÇİZGİ (no GPU vanity / no cyberpunk / no creep into personalization theater) | ✓ |
| V5 future § 4.1 KIRMIZI ÇİZGİ (no "we know you're a recruiter!") | ✓ structurally enforced |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 13. Phase 8 — what happens next

Per V5 § 0.2:

> Her observation süresi mecburi. Skipping = burnout +
> maintenance debt.

The 90-day observation window opens with this commit. During
that window:

- **No further topology / aura / contact surface ships.**
  Phase 9 (Operational Digital Twin) begins only when
  observation triggers go green:
  - Cinematic topology load failure rate < 1% over 90 days
    (V5 § 4.5 Phase 10 prereq, applies here too)
  - Privacy backlash count = 0 (V5 § 4.1)
  - Founder energy yeşil (V5 § 1.3)

- **The classifier's distribution can mature.** Even
  unmounted, a future operator-side review can wire the
  classifier against historical session data + decide
  whether the 4 patterns are well-balanced. If the
  distribution clusters heavily in `default` (the
  expected outcome with no observer mounted), the future
  mount sub-PR can address it.

- **Editorial expansion of the registry** (8.1 topology,
  8.4 aura) is welcome during observation. Adding new
  evolution events, new aura entries, new topology nodes
  — these are append-only data passes that don't violate
  the no-further-surface rule.

- **No new V5 surface ships during observation.** Visible
  changes are paused; the operator audits what's deployed.

Phase 9 (Operational Digital Twin) begins only when all
triggers go green. If any trigger stays red, Phase 9 defers
and Phase 8 systems get polish + tuning. This is the
disciplined-product-evolution posture V5 § 0.2 mandates.

---

## 14. Future systems unlocked

This sub-PR closes Phase 8 and unlocks:

- **Provider Mount Sub-PR (8.x).** Mounts
  `<AdaptivePatternProvider />` in `app/layout.tsx` behind
  `V5_CONTACT_ADAPTIVE_ENABLED`. Records visited prefixes
  globally. Future visitors to /contact carry signal.
- **Adaptive /contact Sections Sub-PR.** Adds the V5
  future § 4.1 sections (direct, elevator, engineering,
  what-id-build, rate-availability) to the contact page.
  CSS `order` rules per `data-pattern` reorder by pattern.
- **Phase 9.1 — Operational Twin Data Layer.** Reads the
  classifier's session-scoped state alongside the temporal
  registry's recent events to render the
  "this-week-engagement" summary on /v5/operating.
- **Phase 9.4 — Operational Portrait OG Card.** Composes a
  per-pattern OG card showing the right "what I'd build"
  case study for the visitor's classified pattern.
- **Lumina sub-agent.** Architecture-critic can read the
  current visitor's pattern + their session signals as
  ambient context. "You're on a recruiter trajectory; let
  me match that tone" (without the visitor ever knowing).

---

## 15. Deferred systems

The user prompt's implicit DEFERRED list, restated:

- **Mounting the Provider** → future sub-PR after the
  observation window.
- **Adding adaptive sections to /contact** → future sub-PR;
  requires editorial pass for each section's content.
- **CSS `order` rules per pattern** → bundled with the
  adaptive sections sub-PR.
- **Cross-system telemetry tile on /evolution** → defer;
  /evolution is the engineering memory archive, not a
  telemetry dashboard.
- **Aura mount (8.4 → mounted)** → defer; the user's
  pattern is foundation-first, mount-later for invisible
  systems.
- **Spatial audio (V5 § 5.3 8.5)** → Phase 8 closes here
  per the user's sequence; spatial audio was V5 doc's
  Phase 8.5, but the user re-sequenced. The audio layer
  stays deferred indefinitely — V5 § 1.2 + § 2.4 rejects
  decorative audio as risk against cinematic restraint.

Permanently rejected (carried from V5 § 3.3 + Phase 8
brief):
- LLM-generated case studies in /contact (Anti-Generic-AI
  Law).
- Per-visitor saved profiles (would require cross-session
  identity; the schema rejects this structurally).
- "Hello recruiter!" / "Welcome senior engineer!" greetings
  (KIRMIZI ÇİZGİ).
- Cross-device recruiter detection (would require user
  identity).
- Fingerprint-based classification (no UA / no canvas / no
  timing analysis — the closed signal set rejects this).

---

## 16. Affected system analysis (Phase 8 brief)

The user prompt demanded an explicit pre-implementation
analysis for every Phase 8 sub-PR. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/contact/` namespace + new edge endpoint + new client Provider. Reuses Phase 6.2 cognition signal accessor. No cross-system mutations. |
| Temporal | None. The classifier reads session-scoped client state only. |
| Perception | The signals reader imports `inferCognitionSignal` from `lib/v5/navigation/cognition.ts` — pure helper reuse. The Phase 6 layer is unaware of the contact system. |
| Topology | None. The classifier doesn't read topology state in 8.5. |
| Aura | None. The classifier is independent of the aura system. |
| Future renderer | The Provider applies a `data-pattern` attribute readable by any CSS layer (SVG / Three.js / DOM / future WebGPU). |
| Bundle | 0 byte delta on every existing route (verified). Future mount adds ~2-3 KB minified. |
| Feature flag | `V5_CONTACT_ADAPTIVE_ENABLED` declared, not enforced in 8.5 (no Provider mount). |
| Reduced-motion | The Provider doesn't introduce motion. Future adaptive sections use CSS `order` (instant reorder, no transition). |
| Mobile | Same classifier behaviour on mobile + desktop. No viewport gating. |
| Hydration integrity | The Provider renders `null`. CSS rules read the `data-pattern` attribute post-commit. No SSR mismatch. |
| Edge consistency | The endpoint is edge runtime. Cache headers (no-store on 204) mirror existing Phase 7-8 endpoints. |
| Maintenance burden | ~1 hr/month once mounted (occasional classifier tuning + new pattern review). Within Phase 8's 6 hr/mo envelope. |
| Rollback | Single-commit revert removes every primitive; no KV state to clean (no events fire in 8.5). |

---

## 17. Next sub-PR

**90-day observation window opens.** No code ships against
the Phase 8 systems during this period.

If the observation window's triggers go green, **Phase 9
begins with Sub-PR 9.1** — Operational Twin Data Layer.
Per V5 § 5.4 (scaffold):

- this-week shipped commits + GitHub WHY paragraphs
- Active infrastructure + last-seen timestamps
- Running experiments registry
- Planned next + recent failures
- ISR 1h; real-time poll forbidden

The Phase 8 → Phase 9 transition has no mandatory off-block
per V5 § 1.3 (only Phase 7 → 8 and Phase 9 → 10 carry forced
breaks).

Per V5 § 0.4:

> "V5'i dondur" → V4 maintenance moduna geri dönülür, V5'in
> geri kalanı kalıcı olarak deferred

If founder energy goes red during the observation window,
V5 may freeze indefinitely. This is the disciplined-product-
evolution posture and not a failure mode.

Awaiting explicit approval per the V5 operating constitution.
The observation window starts now.

---

## 18. Closing — the chassis is complete, the cognition is whole

Phase 6 (Sensory Awakening) gave the system its perception
— it began to feel scroll velocity, dwell time, navigation
flow, cognition signal, pacing transition.

Phase 7 (Temporal Architecture) gave the system its memory
— it began to know what it WAS, with a hand-curated registry
of architectural events + a scrubable cursor through them.

Phase 8 (Spectacle Systems & Topology Intelligence) gave
the system its self-image:
- The brain (8.1) that knows what it IS — every system,
  project, phase, architecture, tool, memory, telemetry,
  lab, and evolution event in one typed graph.
- The engine (8.2) that can paint that self-image at three
  fidelities — SVG for crawlers + reduced-motion, Three.js
  for desktop motion, WebGPU slot reserved.
- The spectacle (8.3) that mounted the engine on one
  production project — Cloud Waste Hunter. ONE spectacle
  only, restrained, honest.
- The aura (8.4) that gives each surface its perceptual
  fingerprint — 4 parameters that future consumers will
  opt into reading.
- The classifier (8.5) that reads the visitor's session
  shape + (when mounted) reorders the conversion surface
  to match.

Sub-PR 8.5 closes Phase 8 the way the user's discipline
required: ONE spectacle visible, the rest as foundation
ready for editorial activation. The 90-day observation
window now opens.

What the visitor experiences today:
- The portfolio they saw at the end of Phase 7, plus
- ONE topology surface at `/v5/topology/cloud-waste-hunter`
  when the operator flips the flag.

What the visitor will eventually feel, when the future mount
sub-PRs land:
- Each page slightly warmer in the evening, cooler in the
  morning.
- The contact page leading with engineering-grade contact
  affordances when the session shape suggests it; leading
  with elevator-pitch case studies otherwise.
- The architecture pages letting them scrub through the
  topology slider scoped to that project.
- The topology page rendering the system's self-description.

None of it says "we detected you". The visitor sees a
calm, restrained, cinematic engineering portfolio that
adapts to the shape of their visit — silently, invisibly,
without ever speaking back.

That is what V5 § 1.5 named as the mission:

> Tek bir mühendisin inşa ettiğine inanılmaz bir engineering
> ekosistemi yaratmak — ekibi büyütmeden, infra'yı şişirmeden,
> identity'yi bozmadan.

Phase 8 closes here. The 90-day observation begins.
