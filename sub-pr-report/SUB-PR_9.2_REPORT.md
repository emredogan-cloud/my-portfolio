# Sub-PR 9.2 — Operational Twin Portrait (visible mount)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 9 — Operational Digital Twin · Sub-PR 9.2 (Tier B · visible portrait)
**Scope:** Mount the Phase 9.1 data layer on `/v5/operating`.
Server Component, 1h ISR, gated on `V5_OPERATING_TWIN_ENABLED`.
Renders 5 editorial sections (this week shipped / active
infrastructure / running experiments / planned next / recent
corrections) + source files. Five per-section
IntersectionObserver pings fire `section_*_inspected`
adoption events. New `OPERATING_PAGE_VISITS` scalar wires
into the V4 visit counter. The portrait that V5 future § 3.1
named: "Bu sayfa 'dashboard' değil. **Portrait**".

---

## 1. Mission

Phase 9.1 shipped the data layer; visitors saw nothing
visible. Phase 9.2 ships the canvas — the visible
`/v5/operating` route that reads
`composeOperationalSnapshot()` and renders the five
typed surfaces in editorial layout.

The voice mandate is the load-bearing constraint. V5
future § 3.1 + the user's Phase 9 brief converge:

> Bu sayfa "dashboard" değil. **Portrait**. Visitor okuduğunda
> "bu hafta neler oldu" değil; **"bu kişi ne yapıyor"**
> hissini alır.

> Operational Twin is NOT:
> * dashboards
> * fake telemetry
> * enterprise monitoring cosplay
> * realtime spectacle
> * analytics theater

What 9.2 ships:

- **`app/v5/operating/page.tsx`** — Server Component, `ƒ
  Dynamic` with `revalidate = 3600` (1h ISR). Gates on
  `isOperatingTwinEnabled()` → returns 404 when flag is
  off. Reads `composeOperationalSnapshot()` directly + 
  renders 5 editorial sections + source files + Phase 9
  footer.
- **`app/v5/operating/_components/OperatingSectionPing.tsx`** —
  Tiny `"use client"` IntersectionObserver wrapper. Fires
  one of the 5 `section_*_inspected` events when its host
  element enters the viewport. Session-deduped via
  sessionStorage. ~900 B gzipped including session-storage
  + fetch overhead.
- **`lib/telemetry/metrics.ts`** — `OPERATING_PAGE_VISITS`
  metric key added.
- **`app/api/telemetry/visit/route.ts`** — `operating`
  surface mapping added to the V4 visit dispatch.
- **`components/telemetry/VisitPing.tsx`** — `operating`
  added to surface union.

V5 § 5.4 + V5 future § 3.1 validation criteria, satisfied:
- [x] /v5/operating page mounts behind flag
- [x] ISR 1h cadence (no real-time polling)
- [x] Portrait reading order: shipped → active → running →
  planned → corrections
- [x] 5 per-section inspection adoption events fire
- [x] V4-style visit counter wired
- [x] Operator vocabulary; no dashboard / gauge / chart UI
- [x] Editorial flow (intro → 5 sections → source links →
  Phase 9 closure note)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A single page that reads as an
engineer's operating notebook — last week's commits with
their WHY paragraphs, which production systems are alive
(derived from telemetry), which experiments are running
(lab + playground composition), what's planned next (hand-
curated, no deadlines), recent corrections (sliced from
the public failures log) — rendered without ONE dashboard
gauge, ONE real-time indicator, ONE chart. Rare in the
portfolio category. **PASS.**

**Q2 — Emergence:** The page reads ALL existing data
sources — github commits, KV metric snapshots, playground
registry, lumina-failures log, planned-next data. Its value
emerges only when the surrounding ecosystem has been built
out (and it has). The page is the first VISIBLE place
those five sources compose into one portrait. **Perfect
emergence with the ecosystem; standalone the page renders
nothing meaningful.**

**Q3 — Sustainability:** ~2 hr/month per V5 § 4.4 (editorial
maintenance: planned-next list edits, occasional infra
list adjustments). The Server Component itself is stateless
and pure between renders. Within Phase 9's 5.5 hr/mo
envelope. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: every surface reads THIS portfolio's
  data sources. Copying the page would render an empty
  portrait (no commits to display, no infra to track, no
  experiments to list). ✓
- Ekosistem-fed: zero external calls; everything reads
  in-process from the composer. ✓
- Ekosistem-emergent: the portrait IS the ecosystem
  describing itself. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The page is a
  pure-data Server Component reading typed shapes. ✓

---

## 3. Architectural decisions

### 3.1 Server Component reads composer directly (no API round-trip)

The page imports `composeOperationalSnapshot` from
`lib/v5/operating/snapshot` + calls it during render. NO
fetch to `/api/v5/operating/snapshot`. Reasons:

- Same JS process → zero network overhead.
- Same Node module → tree-shaking + cache sharing work
  as expected.
- The JSON endpoint exists for EXTERNAL consumers (CLI,
  Raycast, future Slack bot); the page is internal.
- ISR caches the rendered HTML at 1h; the composer runs
  once per regeneration regardless of how the data flows
  in.

### 3.2 Single gate

V5 § 5.4 9.2 implicitly carries one flag (the operator's
opt-in switch). Sub-PR 9.2 uses ONLY
`isOperatingTwinEnabled()` — no slug whitelist (unlike
Phase 8.3's topology route, this surface is operator-wide,
not project-scoped). Closed gate → `notFound()` → 404.

The flag defaults to OFF. Production builds without the
env var render the route as a static 404. Operator
flips + redeploys to activate.

### 3.3 ISR 1h matches the composer's cache cadence

`export const revalidate = 3600;` aligns the Server
Component's regeneration with the underlying composer's
`s-maxage=3600` cache headers (from Phase 9.1's snapshot
endpoint).

V5 future § 3.1: "ISR 1h. Real-time poll yasak." Both
layers honor this; the visitor's experience is consistent
whether they read the page or hit the JSON endpoint.

### 3.4 Editorial section order

Sections follow the reading flow a visitor would naturally
trace:

1. **This week shipped** — current activity, the freshest
   signal.
2. **Active infrastructure** — what's running underneath
   (the systems that received the commits).
3. **Running experiments** — what's being prototyped on
   top (lab + playground).
4. **Planned next** — what direction the operator is
   pointing.
5. **Recent corrections** — the honest tail: what broke +
   what changed.

Reading order matches the engineer's daily mental model:
"what did I do this week, what's deployed, what am I
experimenting with, what's next, what blew up."

### 3.5 Status pills, not gauges

The active-infrastructure section uses small pill badges
(`active` / `dormant` / `archived`) — colored by status.
No gauges, no sparklines, no charts. Same restraint as the
existing `/lumina/brain` + `/v5/perception` aesthetic.

The status itself is DERIVED from each system's last-seen
timestamp (computed by the Phase 9.1 aggregator). The page
doesn't compute anything visual on the client.

### 3.6 IntersectionObserver per section, session-deduped

Each of the 5 sections embeds an `<OperatingSectionPing
kind="section_*_inspected" />` island. The observer fires
when the section's anchor enters the viewport (≥ 25%).
sessionStorage gates each kind so a visitor scrolling up +
back down fires once per session per section.

This gives the operator a real attention signal: which
sections does the visitor actually scroll into vs which
get scrolled past without reading?

### 3.7 No mobile gauge / chart / sparkline

The mobile experience is the same as desktop. Sections
stack vertically; pills + dates + descriptions render
identically. No "lite mobile dashboard" — V5 future § 3.1's
portrait posture is responsive by being TEXT-FIRST.

### 3.8 Source-files section follows the V5 transparency convention

Section 06 mirrors the pattern from `/lumina/brain`,
`/v5/perception`, `/evolution`, `/v5/topology/<slug>` — six
source-file links + one-sentence notes. Every claim
above is grep-able from the linked source code.

### 3.9 No sitemap entry

`app/sitemap.ts` is unchanged. Same posture as
`/v5/topology/cloud-waste-hunter` from Phase 8.3 — the
operator can add the entry when the surface is permanently
public. While the flag may be on for testing, the sitemap
entry is a deliberate editorial decision deferred.

### 3.10 Snapshot timestamp surfaced in the hero

The page header shows "Snapshot generated 2026-05-19
13:48:15 UTC" — the visitor sees the data's freshness
explicitly. No misleading "live!" language; the timestamp
is honest about the ISR cadence.

Cross-link to `/api/v5/operating/snapshot` lets the
visitor read the raw JSON for the same snapshot the page
rendered.

### 3.11 Date.now() purity rule honored

The ESLint rule `react-hooks/purity` flags `Date.now()` in
render. The page uses `snapshot.generated_at` (a string
the composer writes) as the reference point for "X ago"
calculations. Since the composer's `generated_at` is
always set, the fallback path is unreachable + the
function stays pure.

This ensures Server Component renders are deterministic
for any given ISR regeneration: the same snapshot data
always produces the same HTML, regardless of when the
specific request lands within the cache window.

---

## 4. KIRMIZI ÇİZGİ + Phase 9 philosophy enforcement

The user's Phase 9 brief:

> Operational Twin is NOT:
> * dashboards
> * fake telemetry
> * enterprise monitoring cosplay
> * realtime spectacle
> * analytics theater
>
> It IS: a calm, truthful, operational model of the
> ecosystem.

| Failure mode | Mitigation in 9.2 |
|--------------|---------------------|
| Dashboard cosplay | No gauges, no progress bars, no metric tiles with big numbers. Status is expressed via small pills + dates. The page reads as prose-with-data, not as a control panel. |
| Fake telemetry | Every data point traces to a real source: real commits from GitHub, real KV timestamps for "last seen", real playground registry, real failures log. Nothing simulated. |
| Realtime spectacle | ISR 1h cadence; explicit "Snapshot generated X UTC" timestamp in the hero. No "Live now!" indicators. No streaming, no SSE, no setInterval. |
| Analytics theater | No charts. No sparklines. No 7-day trend lines. No comparisons to "last week". Just the current snapshot. |
| Enterprise monitoring vibe | Restrained palette (same `#00d2ff` family as the rest of V5). Editorial language ("what shipped", "what's running") not enterprise language ("KPIs", "uptime SLAs"). |
| Operator-marketing roadmap | Planned-next has no deadlines, no estimates, no Gantt. Status is honest: "considering" / "next-up" / "in-progress" — not "Q3 2026 commitment". |

V5 future § 3.1 standard satisfied: visitor reading the
page should feel "this person is currently doing X, here
are the surfaces they maintain, here's where they're
pointing next". Not "I am watching a dashboard."

---

## 5. What changed

| Action | File |
|--------|------|
| New | `app/v5/operating/page.tsx` — Server Component, gated, ISR 1h, 6 sections |
| New | `app/v5/operating/_components/OperatingSectionPing.tsx` — IntersectionObserver client island |
| Edit | `lib/telemetry/metrics.ts` — added `OPERATING_PAGE_VISITS` |
| Edit | `app/api/telemetry/visit/route.ts` — added `operating` surface mapping |
| Edit | `components/telemetry/VisitPing.tsx` — added `operating` to surface union |
| New | `sub-pr-report/SUB-PR_9.2_REPORT.md` (this report) |

No new dependencies. No new env vars REQUIRED (only the
existing `V5_OPERATING_TWIN_ENABLED` flag from Phase 9.1).

---

## 6. Telemetry schema

Sub-PR 9.2 wires existing infrastructure:
- **V4 visit counter** (`v5:telemetry:operating-page:visits`,
  new metric key) — VisitPing surface=`operating` fires.
- **V5 per-section hash** (`v5:operating:adoption`, from
  Phase 9.1) — five OperatingSectionPing islands fire
  `section_*_inspected`.

The two signals answer different operator questions:
- V4 scalar: "how many sessions reach the page?"
- V5 hash: "which sections get attention vs scrolled past?"

Full V5 telemetry schema after 9.2:

```
v5:perception:<category>              → hash (Phase 6.1+)
v5:memory:adoption                    → hash (Phase 6.4)
v5:temporal:adoption                  → hash (Phase 7.1)
v5:topology:playback                  → hash (Phase 7.2)
v5:topology:timeline                  → hash (Phase 7.3)
v5:topology:architecture-page         → hash (Phase 7.4)
v5:topology:graph                     → hash (Phase 8.1)
v5:aura:adoption                      → hash (Phase 8.4)
v5:contact:adoption                   → hash (Phase 8.5)
v5:operating:adoption                 → hash (Phase 9.1)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
v5:telemetry:topology-page:visits     → scalar (Phase 8.3)
v5:telemetry:operating-page:visits    → scalar (Phase 9.2, NEW)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Operator-side data only | Every rendered surface reads operator-owned data. No visitor signal enters the page's render path |
| Session-scoped client signals | OperatingSectionPing's sessionStorage dedupe drops on tab close. No cookie, no persistent identifier |
| No fingerprint | The page's client islands (VisitPing + 5 OperatingSectionPing) read no UA / IP / Accept-Language |
| Aggregate-only telemetry | V4 scalar + V5 hash both count events, not visitors |
| Cache-friendly | ISR caches HTML at the regional level; the page is identical for every visitor in the cache window |
| Flag-off → 404 | When the flag is off, the route returns 404; no operator-state disclosure |
| Graceful no-op | When KV / GitHub are unavailable, the composer returns empty data; the page renders the empty states honestly (no fake numbers) |

---

## 8. Performance posture

V5 § 4.4 budget: ISR 1h cadence + < 2.5s LCP for the V5
surface family per V5 § 2.7.

| Surface | Measurement |
|---------|-------------|
| Page LCP | Cold cache: ~50-200 ms composer + Next.js render → < 500 ms total. Warm cache: served from ISR (~5 ms). |
| Page HTML size (flag ON) | 117 KB (verified). All HTML is server-rendered; no client-side data fetching. |
| Page HTML size (flag OFF) | ~20 KB (404 page). |
| Client JS shipped on the page | OperatingSectionPing (~1.9 KB minified / ~0.9 KB gzipped per chunk) + VisitPing (already in the bundle). |
| Existing routes | Verified unchanged: /, /contact, /evolution, /v5/perception, /lumina/brain all return 200. |
| ISR regeneration cost | 1 GitHub API call + 8 parallel KV reads per hour per region. Well below the GitHub anonymous rate-limit (60/hr). |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `composeOperationalSnapshot` / `summariseWeeklyCommits` / `recordOperatingEvent` in client | 0 matches |
| `OPERATING_ADOPTION_HASH_KEY` / `PLANNED_ITEMS` / `INFRASTRUCTURE_TO_METRIC_KEY` in client | 0 matches |
| `V5_OPERATING_TWIN_ENABLED` / `isOperatingTwinEnabled` in client | 0 matches |
| `OperatingSectionPing` chunk shipped (1878 B / 907 B gz) | 1 chunk ✓ |
| `@vercel/kv` in client | 0 matches |

All server-side helpers stay server-side. Only the
IntersectionObserver wrapper ships to the client.

---

## 9. Edge / runtime notes

- The page is a Server Component. Build registers it as
  `ƒ Dynamic` with `revalidate = 3600` when the flag is on
  (the composer's underlying fetch is what makes it
  Dynamic). When flag-off, the page is `○ Static` (404 page
  prebuilt).
- `OperatingSectionPing` is `"use client"`. Renders an
  empty `<span>`; the IntersectionObserver attaches +
  detaches per mount.
- Both `/api/v5/operating/event` + `/api/v5/operating/snapshot`
  from Phase 9.1 continue unchanged.
- The V4 visit endpoint at `/api/telemetry/visit` accepts
  the new `operating` surface.

---

## 10. Rollback plan

The single-commit revert removes:

- `app/v5/operating/page.tsx`
- `app/v5/operating/_components/OperatingSectionPing.tsx`
- The `OPERATING_PAGE_VISITS` metric key
- The `operating` surface mapping in the visit endpoint
- The `operating` union member in VisitPing

KV state orphaned after revert:
- `v5:telemetry:operating-page:visits` scalar — sits
  harmlessly. Can be `DEL`'d manually.
- `v5:operating:adoption` hash counts from 9.1 stay
  intact (no events fire post-revert since no consumer
  exists).

No schema break, no env-var rollback. The Phase 9.1 data
layer + endpoints continue to work; the visible surface
just disappears.

Mid-flight rollback without code revert:
- Unsetting `V5_OPERATING_TWIN_ENABLED` + redeploying →
  the page returns 404. The other Phase 9 systems
  continue unchanged.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 (after `Date.now()` purity fix during validation) |
| `eslint` on 9.2-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build (flag off) | ✓ `/v5/operating` as `○ Static` (404 page) |
| Production build (flag on) | ✓ `/v5/operating` as `ƒ Dynamic` (composer-driven, 1h revalidate) |
| Flag OFF: `/v5/operating` → 404 | ✓ |
| Flag ON: `/v5/operating` → 200 with 117 KB content | ✓ |
| All 6 sections render (01-06) | ✓ verified via HTTP smoke |
| Phase 9 portrait pill rendered | ✓ |
| `POST /api/telemetry/visit { surface: "operating" }` → 204 | ✓ |
| Server-only operating symbols absent from `.next/static` | ✓ 0 matches |
| OperatingSectionPing chunk: 1878 B / 907 B gzipped | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Existing routes unaffected (/, /contact, /evolution, /v5/perception, /lumina/brain → all 200) | ✓ |
| No new dependencies | ✓ `package.json` unchanged |
| Phase 9 KIRMIZI ÇİZGİ (no dashboard / no realtime / no analytics theater) | ✓ structurally enforced |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Future systems unlocked

This sub-PR is the visible portrait; future Phase 9
sub-PRs build on top:

- **Sub-PR 9.3 — Living engineering journal weekly cron.**
  Vercel cron route that reads
  `composeOperationalSnapshot()` once per week, generates
  a weekly digest markdown page (`/v5/journal/<week>`),
  + writes it to disk. The cron is the generator; the
  journal pages are the artifact.
- **Sub-PR 9.4 — Operational portrait OG card.** New OG
  image route at `app/api/og/operating` that composes a
  per-section PNG (current commits + current
  infrastructure state) for shareable artifacts.
- **Phase 10 — Ambient intelligence (CONDITIONAL).** Lumina
  V5 ambient awareness can read the snapshot as visitor-
  facing context: when a visitor opens Lumina from
  `/v5/operating`, Lumina knows the operator's current
  shipping focus + can reference it natural-language-
  fluently.
- **Operator dashboard (private)** — a separate operator-
  only route (`/admin/operating`) could read the full
  snapshot + add more detail (per-system error rates,
  cost projections) without exposing the operator side
  to the public.
- **Slack / CLI integration** — the existing JSON feed
  at `/api/v5/operating/snapshot` lets any external tool
  read the same data the page renders.

---

## 13. Deferred systems

The user prompt's implicit DEFERRED list, restated:

- **Sitemap entry** for `/v5/operating` → deferred until
  the operator commits to permanent public visibility.
- **Per-section "expand for detail"** affordances → not in
  9.2; the portrait reads top-to-bottom without
  navigational state.
- **Weekly digest cron** → Sub-PR 9.3.
- **OG card generation** → Sub-PR 9.4.
- **Per-experiment activity history** → out of scope;
  the running-experiments section shows current state,
  not history.
- **Cost telemetry on infrastructure entries** → V5 §
  2.10's `/admin/cost` is private operator surface;
  doesn't belong on the public twin.
- **Multi-week comparison ("this week vs last week")** →
  V5 future § 3.1 explicit reject of trend-line gauges.

Permanently rejected (Phase 9 brief):
- Real-time SSE / WebSocket polling.
- LLM-generated narrative ("This week, Emre shipped...") —
  Anti-Generic-AI Law.
- Per-visitor portrait personalisation.
- Cross-engineer twin federation.

---

## 14. Affected system analysis (Phase 9 brief)

| Axis | Impact |
|------|--------|
| Architecture | One new Server Component route + one client island. No cross-system mutations beyond the visit-counter wiring. |
| Topology | None. Phase 9 reads data; topology is its own self-description. |
| Temporal | The recent-corrections section reads `LUMINA_FAILURES`; the planned-next data file references future entries that will move to the evolution registry when they ship. |
| Twin | This sub-PR IS the visible twin surface. Future sub-PRs (9.3 + 9.4) build on the same composer. |
| Telemetry | One new V4 scalar metric key + one new surface mapping. The V5 hash (`v5:operating:adoption` from Phase 9.1) gets its first writers via the section pings. |
| Future ambient | Phase 10 Lumina V5 can read `composeOperationalSnapshot()` as ambient context. The snapshot is server-side accessible from any future surface. |
| Feature flag | `V5_OPERATING_TWIN_ENABLED` declared in Phase 9.1; 9.2 is the first consumer. Default OFF. |
| Bundle | 1878 B minified (907 B gzipped) for OperatingSectionPing — the only new client island. Other 5 client islands (VisitPing) already in the bundle. |
| Privacy | Operator-side data only. No per-visitor signal anywhere. |
| Maintenance | ~2 hr/month (editorial passes on planned-next + occasional section copy polish). Within Phase 9's 5.5 hr/mo envelope. |
| Rollback | Single-commit revert removes the page + the section ping + the visit counter wiring. |

---

## 15. Next sub-PR

**Sub-PR 9.3 — Living Engineering Journal Weekly Cron.**
Per V5 § 4.4:

- Vercel cron route (probably `app/api/cron/v5-journal/`)
  that reads `composeOperationalSnapshot()` once per week
- Generates a weekly digest markdown page
  (`/v5/journal/<YYYY-Www>`) — server-rendered, static
- Editorial cadence: weekly summary of the week's
  commits + infrastructure changes + experiment activity
- ISR appropriate to journal cadence (monthly revalidate
  is plenty since each page is a frozen weekly artifact)
- Optional cron schedule: weekly UTC Sunday at 00:00

Awaiting explicit approval per the V5 operating
constitution. STOP and observe is the default disposition
between sub-PRs.

---

## 16. Closing — the portrait is mounted, restraint preserved

Sub-PR 9.1 shipped the typed data substrate. Sub-PR 9.2
mounts the editorial portrait. The visitor who flips the
flag + opens `/v5/operating` sees:

- A hero that names the page honestly: "Operating.
  What's actually happening underneath."
- Five sections reading top-to-bottom as an engineer's
  notebook: this week shipped → active infrastructure →
  running experiments → planned next → recent corrections.
- Real data from real sources: commits from GitHub,
  status derived from KV timestamps, hand-curated planned
  items, real failures from the public log.
- Zero gauges. Zero charts. Zero "Live!" indicators.
  ISR 1h cadence + a visible "Snapshot generated UTC" line.
- Source-files section linking the rendered surfaces back
  to the implementation files.

What the visitor reads: "this person is currently
shipping Phase 9, observing Phase 8, thinking about aura
mount + adaptive contact, has corrected one failure
recently". Not "I am watching a dashboard."

V5 future § 3.1's standard satisfied: portrait, not
dashboard. The chassis lands here; future Phase 9.3-9.4
add the weekly journal + OG portrait card on top.
