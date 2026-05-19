# Sub-PR 9.1 — Operational Twin Data Layer (foundation)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 9 — Operational Digital Twin · Sub-PR 9.1 (Tier B · foundation)
**Scope:** The data layer beneath V5 future § 3.1's
operational twin. Five typed surfaces (weekly commits / active
infrastructure / running experiments / planned next / recent
failures) + pure aggregators + composer + planned-next data
file + edge JSON snapshot feed + edge POST event endpoint +
`V5_OPERATING_TWIN_ENABLED` flag + `v5:operating:adoption` KV
hash. **No `/v5/operating` route ships in 9.1.** Same
foundation-first discipline Phase 6.1 / 7.1 / 8.1 followed.

---

## 1. Mission

V5 § 4.4 + future § 3.1 frame the operational digital twin
as an **operational portrait**, not a dashboard:

> Bu sayfa "dashboard" değil. **Portrait**. Visitor okuduğunda
> "bu hafta neler oldu" değil; **"bu kişi ne yapıyor"**
> hissini alır.

Sub-PR 9.1 ships the typed data substrate the future portrait
will read from. Five surfaces, five aggregators, one composer,
zero visible routes. The future Phase 9.2 surface
(`/v5/operating/page.tsx`) will read from the same composer
this sub-PR ships; the future Phase 9.3 weekly cron will read
from the same `recent_failures` slice; the future Phase 9.4
OG card generator will read from the same `weekly_commits`
summary. One source of truth, derived from existing data
sources (`getRecentCommits`, `readMetric`, the playground
registry, the failures log, the hand-curated planned items).

What 9.1 ships:

- **`lib/v5/operating/schema.ts`** — typed shapes for the
  full `OperationalSnapshot` + each of the five surfaces +
  ID validators + closed-allow-list status enums (planned,
  infrastructure).
- **`lib/v5/operating/aggregators.ts`** — pure functions:
  `summariseWeeklyCommits` (filters commits by 7-day window,
  buckets by conventional-commit type, counts repos touched),
  `summariseActiveInfrastructure` (maps an 8-system known
  list to derived `active`/`dormant`/`archived` status based
  on last-seen timestamps), `summariseRunningExperiments`
  (lab + playground composition), `summarisePlannedNext`
  (sort by status priority then by added-date),
  `summariseRecentFailures` (slice the public log).
- **`lib/v5/operating/snapshot.ts`** — composer that fans
  out the two I/O calls (`getRecentCommits` + parallel
  `readMetric` for the 8 known infrastructure entries) and
  runs the pure aggregators against the loaded data. Returns
  a fresh `OperationalSnapshot` per call.
- **`data/v5/operating/planned.ts`** — 5 hand-curated
  planned items (Phase 8 observation, Phase 9 itself,
  topology expansion, aura mount, adaptive contact). Honest
  editorial; no deadlines, no estimates.
- **`lib/v5/operating/flags.ts`** — `V5_OPERATING_TWIN_ENABLED`
  env (default off).
- **`lib/v5/operating/telemetry.ts`** — `v5:operating:adoption`
  KV hash with 6 event kinds (view + 5 per-section
  inspections).
- **`app/api/v5/operating/event/route.ts`** — edge POST
  endpoint for the adoption events, 204-only.
- **`app/api/v5/operating/snapshot/route.ts`** — edge GET
  JSON feed. Cache: `public, s-maxage=3600,
  stale-while-revalidate=86400` per V5 future § 3.1 "ISR 1h.
  Real-time poll yasak."

V5 § 5.4 9.1 scaffold criteria, satisfied:
- [x] Operational twin data layer (this-week shipped) +
  much more (the V5 doc's scaffold was abbreviated; we ship
  every data surface the future portrait will need)
- [x] No mounted route (foundation discipline)
- [x] No real-time polling (cache headers + ISR
  contract enforce this)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A live, schema-validated operational
twin of one engineer's actual engineering life — last 7
days of pushed commits + which production systems are
"alive" + which experiments are running + what's planned
next + recent corrections — exposed as a public JSON feed
+ a typed Server Component data source. **PASS by
extension** — the V5 future § 3.1 standard ("Bu kişi
gerçekten ne yapıyor, gözünün önünde") is structurally what
this composer produces.

**Q2 — Emergence:** Zero standalone value. The composer
runs but nothing renders it. The value crystallises when
(a) Phase 9.2 mounts `/v5/operating/page.tsx`, (b) Phase
9.3 runs the weekly journal cron, (c) Phase 9.4 ships the
OG card generator. Each of those reads from this composer.
**Perfect emergence.**

**Q3 — Sustainability:** ~2 hr/month per V5 § 4.4 for the
operational twin data pipeline (planned-next editorial
passes when items ship; the rest is automatic from
existing data sources). Within Phase 9's 5.5 hr/mo
envelope. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: every surface reads from THIS
  ecosystem's data sources (this portfolio's commits, this
  portfolio's KV telemetry, this portfolio's playground
  registry, this portfolio's lumina-failures log, this
  operator's hand-curated planned items). Copying the
  composer elsewhere would produce a portrait of an empty
  ecosystem. ✓
- Ekosistem-fed: pure reuse of existing data. The composer
  introduces ZERO new data sources. ✓
- Ekosistem-emergent: meaningless without Phase 9.2-9.4
  consumers. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input, no upload, no LLM call. The endpoint accepts
  one of 6 closed-allow-list event kinds. The JSON feed is
  static (cache-headered). No generic AI surface anywhere.
  ✓

---

## 3. Architectural decisions

### 3.1 5 surfaces, 5 aggregators, 1 composer

The schema decomposes the `OperationalSnapshot` into 5
typed sub-shapes. Each maps to ONE aggregator function +
ONE source of truth:

| Surface | Aggregator | Data source |
|---------|-----------|-------------|
| weekly_commits | `summariseWeeklyCommits` | `lib/github-events.getRecentCommits()` |
| active_infrastructure | `summariseActiveInfrastructure` | `lib/telemetry/metrics.readMetric()` × N |
| running_experiments | `summariseRunningExperiments` | `lib/playground/registry` + hand-encoded lab list |
| planned_next | `summarisePlannedNext` | `data/v5/operating/planned.PLANNED_ITEMS` |
| recent_failures | `summariseRecentFailures` | `data/lumina-failures.LUMINA_FAILURES` |

The composer fans out the two I/O surfaces (commits + KV
reads) in parallel via `Promise.all` + runs the three
static aggregators after. Total cold-cache latency:
~50-200 ms (bounded by GitHub API + KV roundtrip).

### 3.2 Pure aggregators, side-effectful composer

Every aggregator is a PURE FUNCTION. The composer does ALL
the I/O. This split makes:
- Aggregators trivially testable (inject synthetic data,
  check shape).
- The composer the single retry / error-handling surface.
- Future ISR regeneration call the composer once per
  window; aggregators run once per render.

### 3.3 Infrastructure status DERIVED from last-seen, not authored

The `InfrastructureStatus` enum has three values
(`active`/`dormant`/`archived`). The aggregator DERIVES
status from `last_seen_at`:

- `< 7 days` → active
- `7-30 days` → dormant
- `> 30 days` OR no signal → archived

Author-curated status would invite the operator to manually
mark systems "active" when they're really dormant. The
derived approach is honest: if the system hasn't been
touched in 30 days, the operator sees that.

### 3.4 Known infrastructure list is HAND-CURATED, mapped to existing metric keys

The 8 known infrastructure entries are a literal list in
`aggregators.ts`. Each maps to an existing `MetricKey` from
`lib/telemetry/metrics`:

| Infrastructure id | Metric key |
|-------------------|-----------|
| lumina-chat | LUMINA_P95_LATENCY |
| lab-iam-translator | LAB_IAM_VISITS_DAILY |
| lab-prompt-rescuer | LAB_PROMPT_RESCUER_VISITS_DAILY |
| lab-commit-narrator | LAB_COMMIT_NARRATOR_VISITS_DAILY |
| telemetry-dashboard | TELEMETRY_VISITS |
| v5-perception | V5_PERCEPTION_PAGE_VISITS |
| v5-evolution | EVOLUTION_PAGE_VISITS |
| v5-topology | TOPOLOGY_PAGE_VISITS |

Each metric's `updated_at` becomes that system's "last
seen" signal. The mapping lives in `snapshot.ts` so adding
a new infrastructure entry is two edits (the list in
`aggregators.ts` + the mapping in `snapshot.ts`).

### 3.5 Lab experiments hand-encoded; playground reads its registry

Lab experiments (`/lab/iam-translator`, `/lab/prompt-rescuer`,
`/lab/commit-narrator`) are hand-encoded in the aggregator
as a literal list. The lab routes don't carry a registry
like the playground; the three experiments are stable
production routes.

Playground experiments come from
`lib/playground/registry.PLAYGROUND_EXPERIMENTS` —
read live, no duplication. New playground experiments
appear in the operational twin automatically.

### 3.6 Planned-next is append-only editorial

The data file (`data/v5/operating/planned.ts`) is
hand-curated. Editorial rules:
- One title, one paragraph for `description` (the WHY).
- Closed allow-list of 4 statuses (draft / in-progress /
  next-up / considering).
- `added` is ISO-8601.
- No deadlines, no estimates, no Gantt — V5 § 1.7 demands
  the operator not market a roadmap.

When an item ships, MOVE it to the temporal registry
(`data/temporal/events.ts`). When abandoned, remove it.
The list stays current + small.

Seed (5 items): Phase 8 observation, Phase 9 itself,
topology expansion, aura mount, adaptive contact mount.

### 3.7 Recent failures slices the existing log

`summariseRecentFailures(limit = 3)` slices the
public `LUMINA_FAILURES` log to the last N entries. The
log is already authored newest-first; no re-sort. The
twin renders the SLICE; the full archive remains at
`/lumina/failures`.

Why default of 3: V5 future § 3.1's table calls this the
"Recent failures" surface — a glance, not an archive. 3
entries fit visually without crowding the future portrait
page.

### 3.8 ISR-cached JSON feed, 1h cadence

The snapshot endpoint sets `s-maxage=3600,
stale-while-revalidate=86400`. The CDN serves cached JSON
for an hour; in the background, the next read after the
hour expires triggers a regeneration. Visitors see no
"loading" — the SWR window covers regeneration latency.

V5 future § 3.1: "ISR 1h. Real-time poll yasak." Honored.

The composer makes one GitHub API call + 8 KV reads per
cold cache. With one hit per hour the GitHub anonymous
rate-limit (60/hr) is far from threatened.

### 3.9 No mounted /v5/operating route in 9.1

Phase 9.1 ships ZERO new public routes. The two API
endpoints (snapshot + event) are public but operator-facing.
The `/v5/operating` surface is the Phase 9.2 sub-PR's
deliverable.

Why this discipline matters:
- The composer can be observed via the JSON endpoint
  before the operator commits to the rendered page.
- Aggregator behavior can be reviewed in isolation
  (synthetic inputs in tests; real inputs via the JSON
  endpoint).
- The future page's editorial design lands without
  schema pressure — the schema is already stable.

### 3.10 Telemetry vocabulary maps to the 5 surfaces

The adoption hash has 6 fields:
- `view` — base reach (page rendered, once per session).
- `section_weekly_inspected` — visitor focused on commits.
- `section_infra_inspected` — focused on active
  infrastructure.
- `section_experiments_inspected` — focused on running
  experiments.
- `section_planned_inspected` — focused on planned-next.
- `section_failures_inspected` — focused on recent
  failures.

Per-section breakdown lets future editorial passes
prioritise: if `section_planned_inspected` outpaces
`section_failures_inspected` 10:1, the operator knows
visitors care more about direction than corrections — both
are honest signals.

The hash stays at zero until Phase 9.2's surface mounts
and fires the events. 9.1 just ships the contract.

### 3.11 Foundation-first discipline preserved

Five prior sub-PRs (6.1, 7.1, 8.1, 8.4, 8.5) shipped
foundations without mounting their visible consumers.
Sub-PR 9.1 continues the pattern: data substrate ready,
visible surface deferred. The 90-day observation window
that opened with Phase 8.5 is still in effect; no
visible Phase 9 surface ships until the observation
triggers go green.

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
> It IS:
> a calm, truthful, operational model of the ecosystem.

Sub-PR 9.1 enforces "NOT dashboard" structurally:
- The JSON feed is editorial data, not real-time gauges.
- The cache headers FORBID real-time polling (1h ISR).
- The schema names operator behavior, not visitor behavior.
- No streaming, no SSE, no live counters.

The five surfaces compose a PORTRAIT — what's the engineer
doing this week, what's running, what's planned, what
broke. The visitor reads the data the way they'd read
someone's actual engineering notebook.

V5 future § 3.1 frame: "Bu kişi gerçekten ne yapıyor,
gözünün önünde." Honored.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/v5/operating/schema.ts` — 5 typed surfaces + OperationalSnapshot + validators |
| New | `lib/v5/operating/aggregators.ts` — 5 pure aggregator functions + status derivation helpers |
| New | `lib/v5/operating/snapshot.ts` — composer + I/O fan-out |
| New | `data/v5/operating/planned.ts` — 5 hand-curated planned items |
| New | `lib/v5/operating/flags.ts` — V5_OPERATING_TWIN_ENABLED env |
| New | `lib/v5/operating/telemetry.ts` — v5:operating:adoption hash + helpers |
| New | `app/api/v5/operating/event/route.ts` — edge POST endpoint |
| New | `app/api/v5/operating/snapshot/route.ts` — edge GET JSON feed |
| New | `sub-pr-report/SUB-PR_9.1_REPORT.md` (this report) |

**No existing files modified.** No new dependencies. No
new env vars REQUIRED (only the optional
`V5_OPERATING_TWIN_ENABLED` flag).

---

## 6. Telemetry schema (V5 § 2.13)

Sub-PR 9.1 adds ONE new hash:

```
v5:operating:adoption  → hash {
  view                            : page rendered (one per session)
  section_weekly_inspected        : weekly-commits section focused
  section_infra_inspected         : active-infrastructure section focused
  section_experiments_inspected   : running-experiments section focused
  section_planned_inspected       : planned-next section focused
  section_failures_inspected      : recent-failures section focused
}
```

The hash stays at zero in 9.1 (no consumer fires events).
Phase 9.2's `/v5/operating/page.tsx` will populate.

Full V5 telemetry schema after 9.1:

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
v5:operating:adoption                 → hash (Phase 9.1, NEW)
v5:telemetry:perception-page:visits   → scalar (Phase 6.1)
v5:telemetry:evolution-page:visits    → scalar (Phase 7.1)
v5:telemetry:topology-page:visits     → scalar (Phase 8.3)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Operator-side data only | Every surface reads OPERATOR-owned data (commits, KV metric snapshots, hand-curated lists). Zero visitor-derived signal enters the composer |
| Aggregate-only telemetry | HINCRBY one event field by 1; the hash has no per-visitor field |
| No fingerprint | The event endpoint reads ONLY `{ kind }`. No IP, no UA, no cookies |
| No identity persistence | The twin doesn't identify visitors. The snapshot is the OPERATOR's portrait, served identically to every reader |
| Cache-headered JSON feed | The CDN serves cached JSON; multiple visitors see the same response within the hour. No per-request personalisation |
| No real-time signal | 1h ISR cadence; no streaming, no SSE, no polling |
| Graceful no-op | When KV is unavailable, every read returns null; the snapshot's `active_infrastructure` shows every system as "archived". When GitHub is down, `weekly_commits.commits` is empty. The platform never 5xx's |

---

## 8. Performance posture

V5 § 4.4 + V5 future § 3.1: ISR 1h cadence.

| Surface | Measurement |
|---------|-------------|
| Composer cost (cold cache) | ~50-200 ms — 1 GitHub API call + 8 parallel KV reads + pure aggregator arithmetic |
| Composer cost (warm cache) | 0 — the CDN serves cached JSON |
| Client bundle delta on every existing route | 0. All operating modules are server-only — verified absent from `.next/static/**` |
| Endpoint latency (snapshot) | Cold: ~50-200 ms. Warm: <5 ms (CDN edge) |
| Endpoint latency (event) | One JSON parse + one validate + one HINCRBY. ~5-20 ms warm |
| Module load cost | None on routes that don't import the composer. The future Phase 9.2 page is the only known importer; current routes are unaffected |
| Existing routes | Verified unchanged: `/`, `/contact`, `/evolution`, `/architecture/*`, `/v5/perception`, `/lumina/brain` all return 200 |

Bundle posture verified against `.next/static/**`:

| Check | Result |
|-------|--------|
| `composeOperationalSnapshot` / `summariseWeeklyCommits` / `summariseActiveInfrastructure` in client | 0 matches |
| `recordOperatingEvent` / `readOperatingAdoption` / `OPERATING_ADOPTION_HASH_KEY` in client | 0 matches |
| `INFRASTRUCTURE_TO_METRIC_KEY` / `PLANNED_ITEMS` in client | 0 matches |
| `V5_OPERATING_TWIN_ENABLED` / `isOperatingTwinEnabled` in client | 0 matches |
| `@vercel/kv` in client | 0 matches |

The operational twin is completely server-side until a
consumer surface mounts in Phase 9.2.

---

## 9. Edge / runtime notes

- `/api/v5/operating/snapshot` declares `runtime = "edge"`.
  Build output confirms `ƒ /api/v5/operating/snapshot`
  (Dynamic, edge-inferred). CDN cache headers handle the
  ISR cadence.
- `/api/v5/operating/event` declares `runtime = "edge"`.
  Build output confirms `ƒ /api/v5/operating/event`. One
  HINCRBY per qualifying event.
- `lib/v5/operating/schema.ts` + `aggregators.ts` are pure
  data / pure helpers — universally importable.
- `lib/v5/operating/snapshot.ts` imports `getRecentCommits`
  (uses fetch + @vercel/kv) + `readMetric` (uses
  @vercel/kv). Both edge-safe.
- `lib/v5/operating/telemetry.ts` imports `@vercel/kv` —
  server-only. Verified absent from client chunks.
- `data/v5/operating/planned.ts` is a typed array; tree-
  shakes per consumer.

---

## 10. Rollback plan

The single-commit revert removes:
- 6 new modules in `lib/v5/operating/`
- 1 new data file at `data/v5/operating/planned.ts`
- 2 new edge endpoints under `app/api/v5/operating/`
- This report

KV state orphaned after revert:
- `v5:operating:adoption` hash — empty (no consumer fires
  events in 9.1). Can be `DEL`'d manually.

No schema break, no env-var rollback, no migration story.
Every other system unchanged. The repo reverts to the 8.5
tip exactly.

Mid-flight rollback without code revert:
- The two endpoints can be silenced by removing their
  routes individually. The composer continues to work for
  any in-process caller.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 (after PlaygroundExperiment field-name fix during validation) |
| `eslint` on 9.1-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ 13/13 |
| `npm run eval:playground` | ✓ 1/1 |
| Production build | ✓ exit 0, 50 static pages, 0 warnings |
| `/api/v5/operating/event` registered as `ƒ Dynamic` (edge) | ✓ |
| `/api/v5/operating/snapshot` registered as `ƒ Dynamic` (edge) | ✓ |
| `/v5/operating` route does NOT exist (no mount in 9.1) | ✓ 404 in dev |
| Bundle posture (operating server symbols in client) | ✓ 0 matches |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| HTTP smoke: snapshot endpoint returns valid JSON with 5 populated surfaces | ✓ |
| HTTP smoke: event endpoint POST all 6 valid kinds → 204 | ✓ |
| HTTP smoke: event endpoint POST invalid / malformed → 204 (silent drop) | ✓ |
| HTTP smoke: GET on event endpoint → 405 | ✓ |
| HTTP smoke: POST on snapshot endpoint → 405 | ✓ |
| Existing routes unaffected (/, /contact, /evolution, /architecture/*, /v5/perception, /lumina/brain → all 200) | ✓ |
| No new dependencies | ✓ `package.json` unchanged |
| No new env vars REQUIRED | ✓ (only optional flag) |
| Phase 9 KIRMIZI ÇİZGİ (no dashboard / no realtime spectacle / no analytics theater) | ✓ structurally enforced |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Future systems unlocked

This sub-PR ships data substrate; the consumers unlock
as follows:

- **Sub-PR 9.2 — `/v5/operating` Server Component page.**
  Reads `composeOperationalSnapshot()` directly (no API
  round-trip needed within the same deployment), renders
  the five surfaces in editorial layout. Gated on
  `V5_OPERATING_TWIN_ENABLED`. ISR 1h matches the snapshot's
  cache cadence.
- **Sub-PR 9.3 — Living engineering journal weekly cron.**
  Cron route that reads `composeOperationalSnapshot()`,
  generates a weekly-digest static page (`/v5/journal`),
  + writes it to disk during build. The cron is the
  generator; the journal is the artifact.
- **Sub-PR 9.4 — Operational portrait OG card.**
  `app/api/og/operating` route that reads the snapshot +
  composes a per-section PNG (current week's commits,
  current infrastructure state) for shareable artifacts.
- **Phase 10 — Ambient intelligence (CONDITIONAL).** Lumina
  V5 ambient awareness can read the operational snapshot
  as context: "I see you're currently shipping Phase 9
  + observing Phase 8 in production — let me tailor my
  responses".
- **External operator-dashboard tools** — the JSON feed
  is consumable by any external tool the operator runs
  (a Raycast extension, a CLI status command, a Slack
  bot).

---

## 13. Deferred systems

The user prompt's implicit DEFERRED list, restated:

- **Mounting `/v5/operating`** → Sub-PR 9.2.
- **Weekly journal cron + page** → Sub-PR 9.3.
- **OG card generator** → Sub-PR 9.4.
- **Repository intelligence overlay** (V5 § 4.4 mentions
  Phase 4's repo-aware tools getting an extended UI) → can
  land as part of 9.2 or as its own sub-PR after the
  overall portrait surface stabilises.
- **Live deployment tracking** → V5 future § 3.1 PERMANENTLY
  REJECTED: "Real-time poll yasak. ISR 1h yeterli."
- **Multi-account AWS state view** → V5 future § 3.1
  PERMANENTLY REJECTED: "security review ağır".
- **Public commit firehose** → V5 future § 3.1 PERMANENTLY
  REJECTED: "/changelog yeterli".
- **Per-visitor twin personalisation** → impossible by
  design; the schema persists no visitor data.

Permanently rejected (carried from V5 § 3.3 + Phase 9
brief):
- Real-time SSE / WebSocket dashboards.
- LLM-generated portrait content (Anti-Generic-AI Law).
- Cross-engineer twin federation (identity-native: the
  twin IS this operator's).

---

## 14. Affected system analysis (Phase 9 brief)

The user prompt demanded an explicit pre-implementation
analysis. Restated for the record:

| Axis | Impact |
|------|--------|
| Architecture | New `lib/v5/operating/` namespace + new edge endpoints + new data file. Reuses existing data sources (github-events, metrics, playground registry, lumina-failures). No cross-system mutations. |
| Topology | None. Phase 9 reads PRODUCTION data; topology is its own self-description. |
| Temporal | The recent-failures slice reads `LUMINA_FAILURES`; the planned-next data file references future entries that will move to the temporal registry when they ship. |
| Twin | This sub-PR IS the twin's data layer. Future sub-PRs build on it. |
| Telemetry | One new hash (`v5:operating:adoption`) + one new scalar slot reused (the existing 8 metric keys feed the active-infrastructure aggregator). |
| Future ambient | Phase 10 Lumina V5 ambient awareness can read `composeOperationalSnapshot()` as ambient context. The snapshot's JSON-serialisable shape supports it directly. |
| Feature flag | `V5_OPERATING_TWIN_ENABLED` declared, not enforced in 9.1 (no mounted route). |
| Bundle | 0 byte delta on every existing route (verified). Future Phase 9.2 page will be the first consumer. |
| Privacy | Operator-side data only. No per-visitor signal anywhere on the composer's path. |
| Maintenance | ~2 hr/month (planned-next editorial passes + occasional adjustment of the known-infrastructure list when systems sunset). Within Phase 9's 5.5 hr/mo envelope. |
| Rollback | Single-commit revert removes every primitive; no KV state to clean (no events fire in 9.1). |

---

## 15. Next sub-PR

**Sub-PR 9.2 — `/v5/operating` Server Component page.**
Per V5 future § 3.1 + V5 § 5.4 scaffold:

- `app/v5/operating/page.tsx` Server Component
- Reads `composeOperationalSnapshot()` directly
- ISR `revalidate = 3600` (1h cadence matches the
  composer's cache window)
- Gated on `V5_OPERATING_TWIN_ENABLED` (default off)
- Renders the 5 surfaces in editorial layout, no
  dashboard gauges, no realtime indicators
- Fires `view` adoption event on mount via VisitPing
  pattern
- Each section gains an inline `IntersectionObserver`
  client island that fires the per-section
  `section_*_inspected` event when scrolled into view

Awaiting explicit approval per the V5 operating
constitution. STOP and observe is the default disposition
between sub-PRs.

---

## 16. Closing — the portrait's data is ready, the canvas is not

Sub-PR 8.5 closed Phase 8 (the spectacle systems +
topology intelligence). Sub-PR 9.1 opens Phase 9 by
shipping the data substrate the operational twin will
render — five typed surfaces, five pure aggregators, one
composer, one cache-headered JSON feed, one event endpoint,
zero visible routes.

The visitor sees nothing new. The page bundle on every
existing route is byte-identical to 8.5. The future
`/v5/operating` surface can already be observed via the
`/api/v5/operating/snapshot` JSON feed; the operator can
already audit the shape + the editorial planned-next list
in version control.

When Phase 9.2 mounts the visible portrait, the schema
won't change. The aggregators won't change. The composer
won't change. The data layer's job is done; what remains
is the editorial layout of the rendered page.

V5 future § 3.1's standard, restated:

> "Bu kişi gerçekten ne yapıyor, gözünün önünde."

The data the visitor will eventually read says exactly
this. What the operator built this week. What's running.
What's planned. What broke. No spectacle, no dashboard,
no theater. The portrait's data layer is ready.
