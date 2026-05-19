# Sub-PR 9.4 — Operational Portrait OG Card (Phase 9 closer)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 9 — Operational Digital Twin · Sub-PR 9.4
(Tier B · shareable surface) · **Phase 9 closer**
**Scope:** New edge route `/api/og/operating` composes a
1200×675 PNG portrait of the current operational state from
the Phase 9.1 snapshot composer. Optional narrative overlay
reads the latest journal entry (Sub-PR 9.3). `og_rendered`
event added to the v5:operating:adoption hash. Operating +
Journal pages now declare openGraph + twitter image metadata
pointing at the card.

---

## 1. Mission

V5 § 5.4 names sub-PR 9.4 as the Phase 9 closer:

> 9.4 — Operational Portrait OG Card

What ships here turns the Phase 9 ecosystem into a SHAREABLE
artifact: the snapshot composer (9.1) + the editorial
portrait page (9.2) + the frozen weekly archive (9.3) now
have a face that travels — every Slack / Twitter / LinkedIn
share of `/v5/operating` (or `/v5/journal`) surfaces a card
rendered from the same data the portrait page reads.

Three sources feed the card:

1. `composeOperationalSnapshot()` from Sub-PR 9.1 — provides
   the four primary numbers (this-week commits, active
   infrastructure, running experiments, planned items in
   motion).
2. `listRecentJournalEntries(1)` from Sub-PR 9.3 — provides
   the latest week's templated narrative as the overlay
   sentence.
3. Static fallback narrative when no journal entry exists
   yet — composed from primitives in the snapshot via
   deterministic string assembly.

Per V5 § 2.4 Anti-Generic-AI Law, the narrative path is
LLM-free at every branch.

V5 § 5.4 9.4 scaffold criteria, satisfied:
- [x] Edge runtime via `next/og`
- [x] 1200×675 PNG, identity-preserved (black canvas, cyan
  accent, system-sans, dual ambient glow)
- [x] Flag-gated by V5_OPERATING_TWIN_ENABLED
- [x] No PII in composition or telemetry
- [x] Reads from same snapshot the page renders (no source
  divergence)
- [x] Optional narrative overlay from the latest journal
  entry

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A shareable PNG that's auto-composed
from the operator's REAL ecosystem data (weekly commits,
active production systems, running experiments, planned
state), uses the latest auto-generated journal narrative as
its overlay text, and stays LLM-free is uncommon. Most
"social card" implementations either ship static images
(no data) or use LLM-generated copy (no constraint). The
9.4 card composes from data through fixed templates only.
**PASS by extension.**

**Q2 — Emergence:** Zero standalone value. Without the 9.1
composer, the card has nothing to render. Without the 9.3
journal, the card falls back to template strings (still
honest, but less editorial). With the operating page (9.2)
and journal pages (9.3) declaring it in their openGraph
metadata, the card becomes the default share preview for the
whole Phase 9 surface family. **Pure emergence within Phase
9.**

**Q3 — Sustainability:** ~0.5 hr/month per V5 § 4.4 for the
OG card lane. The route is data-driven; visual updates happen
once a quarter at most when typography refines. Well within
Phase 9's 5.5 hr/mo envelope. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the card's tiles read THIS portfolio's
  snapshot. ✓
- Ekosistem-fed: no external calls beyond the existing
  composer's GitHub + KV reads. ✓
- Ekosistem-emergent: meaningless without Phase 9.1's
  composer. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- Narrative source #1: latest journal entry's `narrative`
  field — templated string assembly from `composeNarrative`
  in Sub-PR 9.3's generator. No LLM. ✓
- Narrative source #2: templated fallback assembled from
  primitive counts in the snapshot. Every output sentence
  is grep-auditable in `pickNarrative`. ✓
- Narrative source #3: static "operational twin is live"
  fallback when no signal exists. Pre-authored constant. ✓

---

## 3. Architectural decisions

### 3.1 Identity continuity with `/api/og/standup`

The standup OG card from Phase 1 established the
portfolio's social-share visual vocabulary: pure black
canvas, `#00d2ff` cyan accent, top-right radial glow,
system-sans + mono typography, eyebrow with bullet + spaced
caps, footer with tagline + URL.

The operating card reuses the same vocabulary exactly:
- Same dimensions (1200×675).
- Same primary glow position + size.
- Same eyebrow pattern: bullet + uppercase letterspaced
  text.
- Same footer pattern: tagline left, URL right.
- Same typography stack: `system-ui, -apple-system, ...`
  for prose; `ui-monospace, 'SF Mono', ...` for metadata.

What's new in 9.4:
- Secondary glow bottom-left for visual balance.
- 4-tile stat row (vs the standup's repo pills + central
  constellation).
- One-line narrative overlay between the tiles and the
  footer.

The reader scanning a feed sees the operating card and
immediately knows it's the same portfolio — same atmosphere,
different content.

### 3.2 The four stat tiles

V5 § 4.4 + the Phase 9 brief frame the operational portrait
around four "what's happening right now" questions:

| Tile | What it answers | Source |
|------|----------------|--------|
| Shipped | "what shipped this week?" | `weekly_commits.total_commits` |
| Running | "what's actually alive?" | `active_infrastructure.by_status.active` |
| Experiments | "what's being tried?" | `running_experiments.active_count` |
| Planned | "what's coming?" | `planned_next.by_status.in-progress + .next-up` |

Each tile carries a primary number + a one-line hint with
context (`5 repos`, `2 dormant`, `lab + playground`,
`2 now · 1 next`). The hint stays small + cyan-tinted to
mark it as metadata, not the headline.

Four was the right number — fewer would leave the card
sparse; more would push into dashboard cosplay territory.

### 3.3 Narrative priority — journal first, template fallback

The narrative overlay sits between the tiles and the
footer:

```
priority 1 → latest journal entry's `narrative` field
            (truncated to 180 chars if longer)
priority 2 → templated assembly: "X commits this week ·
            Y active systems · Z in progress."
            (assembled only from primitives present in the
            snapshot)
priority 3 → static fallback: "The operational twin is
            live. Read what's actually shipping at
            /v5/operating."
```

The journal narrative is the BEST overlay — it's the
operator's running engineering voice, frozen weekly by the
cron. The templated fallback is the second-best — same data
constraint, fixed format. The static fallback ships only
when the snapshot has zero commits AND zero in-progress
items (a genuinely quiet state).

Crucially, NONE of these paths invoke an LLM. The "looks AI-
generated" feel is achieved purely through deterministic
data-shaped templating.

### 3.4 Server-side `og_rendered` telemetry

The route fires `recordOperatingEvent("og_rendered")` after
composition succeeds, before the `ImageResponse` builds.
Every social-card scrape bumps the counter — Slack
unfurling a link, Twitter rebuilding a preview, LinkedIn
generating a thumbnail, search-engine crawlers, RSS
readers.

The signal is the operator's "is this card being
requested?" feedback loop. Aggregate-only (HINCRBY by 1);
no per-scraper field, no User-Agent capture, no IP capture.

The event is added to the existing
`OPERATING_ADOPTION_EVENTS` allow-list (now 7 kinds: view,
5× section_*_inspected, og_rendered). The endpoint
validator (`isOperatingAdoptionEvent`) gates new kinds at
the allow-list — accepting `og_rendered` doesn't open the
hash to arbitrary keys.

### 3.5 Cache header: 5-minute s-maxage + 1h SWR

Cache-Control: `public, s-maxage=300, stale-while-revalidate=3600`

- 5 minutes: short enough for share previews to refresh
  within minutes of a commit push or cron run.
- 1h SWR: scrapers hitting the route during the SWR window
  receive the cached PNG while the edge revalidates in
  background. Prevents thundering-herd composition on
  every social card refresh.
- `public`: lets shared CDN caches (Vercel edge, Cloudflare,
  social-card scrapers' own caches) hold the response.

Composition cost: one snapshot composer call (1 GitHub +
8 parallel KV) + one listRecentJournalEntries call (2 KV) +
the next/og PNG rasterisation (~80-150ms wall-clock for
this layout complexity). Cached for 5 min = at most 12
generations/hour.

### 3.6 Flag-gated, single env

Same flag as the page + JSON feed: `V5_OPERATING_TWIN_ENABLED`.
Operator flips one env, the whole Phase 9 surface family
goes live together. The 404-on-flag-off pattern matches
the rest of V5 — no metadata leak before launch.

### 3.7 Page metadata updates — operating + journal index

Both `app/v5/operating/page.tsx` and `app/v5/journal/page.tsx`
now declare:
- `openGraph.images` with the absolute card URL + 1200×675
  dimensions + descriptive alt text.
- `twitter.card = "summary_large_image"` with same URL.

The per-week journal detail pages (`/v5/journal/[week]`)
deliberately DO NOT point at this card — they're frozen
archive surfaces, and the card reflects CURRENT state.
Pointing them at the card would create a freshness mismatch
where the share preview shows newer data than the page
contents. Per-week pages fall back to the site-wide default
OG image, which stays consistent with their archive
character.

### 3.8 Edge-safety + graceful degradation

The route declares `runtime = "edge"` (next/og requires
it). Both data sources are edge-safe:
- `composeOperationalSnapshot()` uses fetch + @vercel/kv —
  edge-verified across 9.1, 9.2.
- `listRecentJournalEntries()` uses @vercel/kv — edge-
  verified in 9.3.

Failure paths:
- Composer throws (GitHub down + KV down) → not caught
  here; the route returns 500. Acceptable because the
  composer's own graceful degradation already returns
  empty arrays on partial failure — the only path to a
  thrown error is total infrastructure failure.
- Journal read throws → caught locally; narrative falls
  through to template assembly.
- KV unavailable for adoption write → recordOperatingEvent
  already swallows.

### 3.9 What 9.4 deliberately does NOT do

- **No per-week OG card route.** A `/api/og/journal/[week]`
  could render a frozen card for each archived week, but
  that's separate scope (the journal entries are
  archive surfaces, the OG card is a current-state
  portrait). Defer.
- **No URL parameters for filtering.** The route is
  parameterless. No `?surface=infra-only` or `?theme=dark`.
  One canonical card per current snapshot.
- **No font loading.** Satori can't pull from `next/font`,
  so we use the system stack (same constraint as
  `/api/og/standup` from Phase 1). Identity preserved
  through letterspacing + size discipline.
- **No emoji.** The user's directive applies — emojis in
  the card would clash with the cinematic identity.
- **No animated/SVG-loop output.** PNG only. Social card
  scrapers don't render motion.
- **No chart/sparkline rendering.** Phase 9 KIRMIZI ÇİZGİ:
  no dashboard cosplay. Counts only.

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

V5 § 2.4 Anti-Generic-AI Law (extends to ALL V5 surfaces
including share artifacts):

> Hiçbir V5 yüzeyi şu özelliklerden birine sahip olamaz:
> - Generic "summarize this" buton
> - Generic LLM completion request

Sub-PR 9.4's safeguards:

| Risk | Mitigation |
|------|------------|
| LLM-generated card copy | `pickNarrative` is a 30-line pure function with three deterministic branches: latest journal narrative (Sub-PR 9.3 template), assembled template, static fallback. No Claude / Bedrock / OpenAI in the path |
| Dashboard chart leakage | 4 stat tiles with NUMBERS only — no bars, no sparklines, no trend indicators. Hints carry text (`5 repos`, `2 now · 1 next`), not graphics |
| Marketing roadmap exposure | Planned tile shows COUNT (`in_progress + next_up`) only. Item titles + descriptions stay on `/v5/operating` |
| Realtime feel | 5-minute s-maxage. The card is a static portrait of the most-recent snapshot, not a live gauge |
| Visitor identifier leak | `og_rendered` event has no per-scraper field. The composer reads operator-side data only |
| Card leak before launch | Flag-gated 404. Same gate as the page; same dark-launch pattern |
| Source divergence | Reads the SAME `composeOperationalSnapshot()` the page reads. No parallel snapshot path |
| Per-week card sprawl | Deliberately one canonical card; no parameterised variants |

---

## 5. What changed

| Action | File |
|--------|------|
| New | `app/api/og/operating/route.tsx` — edge OG route |
| Edit | `lib/v5/operating/telemetry.ts` — adds `og_rendered` event kind |
| Edit | `app/v5/operating/page.tsx` — openGraph + twitter image metadata |
| Edit | `app/v5/journal/page.tsx` — openGraph + twitter image metadata |
| New | `sub-pr-report/SUB-PR_9.4_REPORT.md` (this report) |

No new dependencies. `next/og` already in tree via the
standup card.

---

## 6. Telemetry schema

Sub-PR 9.4 extends:

```
v5:operating:adoption  → hash {
  view                          : page render (Phase 9.2)
  section_weekly_inspected      : (Phase 9.2)
  section_infra_inspected       : (Phase 9.2)
  section_experiments_inspected : (Phase 9.2)
  section_planned_inspected     : (Phase 9.2)
  section_failures_inspected    : (Phase 9.2)
  og_rendered                   : OG card composed + returned (NEW)
}
```

No new KV keys. The OG route doesn't write any persistent
state beyond the existing adoption hash.

---

## 7. Privacy guarantees

| Invariant | Mechanism |
|-----------|-----------|
| Operator-side data only | Reads operator-owned snapshot (commits, KV metric snapshots, planned items) + operator-owned journal entries. No visitor signal in composition |
| Aggregate-only adoption | `og_rendered` HINCRBY by 1; no per-scraper field; no User-Agent or IP capture |
| No LLM call | Narrative templating is grep-auditable. `pickNarrative` is a 3-branch pure function |
| Flag-off → 404 | Cards stay invisible before operator launches the family |
| No PII in image | Card carries numbers + a templated sentence. Nothing visitor-derived |
| No tracking pixel | The PNG is just the PNG. No analytics beacon, no tracking SVG |
| Single source of truth | Reads same composer the page reads — no source divergence |

---

## 8. Performance posture

| Surface | Measurement |
|---------|-------------|
| Card composition | 1 composer call (~150ms typical) + 1 journal read (~20ms) + Satori rasterisation (~100-150ms) → total ~250-350ms cold, ~50ms hot via SWR |
| Cache | `public, s-maxage=300, stale-while-revalidate=3600` |
| Page metadata cost | 2 absolute URL strings in HTML head → ~140 bytes per page |
| PNG payload | ~125 KB (1200×675 RGBA, system-sans, restrained chrome) |
| Client JS shipped | 0 bytes. Edge route renders server-side; no client island |
| Existing routes | Verified unaffected: full smoke pass, 51 pages built |

Bundle posture verified against `.next/static/**`:

| Symbol | Count in client static |
|--------|------------------------|
| `composeOperationalSnapshot` | 0 |
| `listRecentJournalEntries` | 0 |
| `recordOperatingEvent` | 0 |
| `isOperatingTwinEnabled` | 0 |
| `OPERATING_ADOPTION_HASH_KEY` | 0 |
| `writeJournalEntry` | 0 |
| `@vercel/kv` | 0 |
| `og_rendered` | 0 |
| `ImageResponse` | 0 |

---

## 9. Edge / runtime notes

- `/api/og/operating` declares `runtime = "edge"`. Build
  registers as `ƒ Dynamic`. Composes snapshot + journal +
  PNG per request (cached 5min).
- The route is the third OG image source in the tree:
  - `app/opengraph-image.tsx` — site-wide default
  - `app/api/og/standup/route.tsx` — daily standup card
  - `app/api/og/operating/route.tsx` — operational portrait (NEW)
- vercel.json unchanged. The route is a regular edge
  function, no schedule.
- `lib/v5/operating/telemetry.ts` already had `next` /
  `node` compatible code — adding one allow-list entry +
  one docstring line doesn't change runtime posture.

---

## 10. Rollback plan

The single-commit revert removes:

- `app/api/og/operating/route.tsx`
- `og_rendered` from `OPERATING_ADOPTION_EVENTS`
- `openGraph.images` + `twitter` blocks from operating +
  journal page metadata
- The 9.4 report

KV state orphaned after revert:
- `v5:operating:adoption.og_rendered` field — may have a
  count if cards were rendered before revert. Harmless;
  the hash accepts arbitrary integer fields.

No schema break, no env-var rollback (uses the existing
V5_OPERATING_TWIN_ENABLED). The repo reverts to the 9.3 tip
exactly.

Mid-flight rollback without code revert:
- Unsetting `V5_OPERATING_TWIN_ENABLED` → OG route 404s;
  page metadata branches to the "Not found" path;
  share previews fall back to the site default OG.
- Replacing the route file with a simple 404 response →
  share previews fall back to site default while keeping
  the metadata path intact.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on 9.4-touched files | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build (flag off) | ✓ exit 0, 51 pages, 0 warnings, `/api/og/operating` registered as `ƒ Dynamic` |
| Production build (flag on) | ✓ exit 0, 51 pages, `/v5/operating` flips to `ƒ Dynamic` (correct — the flag check forces dynamic rendering when env is set) |
| Flag OFF: `/api/og/operating` → 404 | ✓ |
| Flag ON: `/api/og/operating` → 200 image/png 125 KB | ✓ |
| PNG dimensions | ✓ 1200×675 RGBA |
| Cache-Control header | ✓ `public, s-maxage=300, stale-while-revalidate=3600` |
| Flag ON: `/v5/operating` HTML head includes `og:image=http://localhost:3000/api/og/operating` | ✓ |
| Flag ON: `/v5/operating` HTML head includes `twitter:image=http://localhost:3000/api/og/operating` | ✓ |
| Flag ON: `/v5/journal` HTML head includes `og:image=http://localhost:3000/api/og/operating` | ✓ |
| Flag ON: `/v5/journal/[week]` keeps site default (no per-week OG card by design) | ✓ |
| Visual identity preserved (black canvas, cyan accent, dual ambient glow, restrained typography) | ✓ verified by direct PNG render |
| Narrative composition: template fallback triggers when KV has no journal entries | ✓ rendered card shows assembled "2 in progress." line |
| Server-only symbols absent from `.next/static` | ✓ 0 matches across 9 distinct symbols |
| `og_rendered` constant absent from client static bundle | ✓ |
| `@vercel/kv` absent from client static bundle | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Existing routes unaffected | ✓ |
| No new dependencies | ✓ `package.json` unchanged |
| Phase 9 KIRMIZI ÇİZGİ (no dashboard / no realtime / no LLM narrative) | ✓ structurally enforced |
| Anti-Generic-AI Law (narrative is grep-auditable template assembly) | ✓ |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Phase 9 closure

Sub-PR 9.4 closes Phase 9 — Operational Digital Twin. The
four sub-PRs compose:

| Sub-PR | What it shipped | Where it lives |
|--------|----------------|----------------|
| 9.1 | Data layer — schema, 5 aggregators, composer, JSON feed | `lib/v5/operating/` + `/api/v5/operating/snapshot` |
| 9.2 | Editorial portrait page — 6 sections, ISR 1h, IntersectionObserver pings | `app/v5/operating/` |
| 9.3 | Living engineering journal — weekly cron, frozen archive, index + detail pages | `lib/v5/journal/` + `app/v5/journal/` + cron |
| 9.4 | Operational portrait OG card — shareable PNG composed from 9.1 + 9.3 data | `app/api/og/operating/` |

Total Phase 9 footprint:
- 1 schema, 5 aggregators, 1 composer (9.1)
- 1 Server Component page + 1 section ping island (9.2)
- 1 schema, 1 generator, 1 storage, 1 cron handler, 2 pages,
  1 ping island (9.3)
- 1 edge OG route (9.4)

Phase 9 maintenance projection per V5 § 4.4:
- 9.1 data layer: 1 hr/mo
- 9.2 portrait page: 1.5 hr/mo (editorial reviews)
- 9.3 journal cron: 2 hr/mo (template polish, cron health)
- 9.4 OG card: 0.5 hr/mo (visual polish)
- **Total: 5 hr/mo** — at the upper bound of Phase 9's
  envelope.

The 90-day observation window applies to the whole phase
including the OG card cadence. The operator now waits +
observes adoption signals before scoping Phase 10 (which
remains conditional per V5 § 5.5).

---

## 13. Future systems unlocked

- **Slack / Twitter / LinkedIn share preview** — every share
  of `/v5/operating` or `/v5/journal` URLs now surfaces the
  card. The card itself doesn't change link-share behavior;
  it changes what visitors see BEFORE clicking through.
- **Per-week OG card variant** — `/api/og/journal/[week]`
  rendering the frozen-at-that-week portrait. Deferred —
  the current portrait card stays current-state.
- **RSS thumbnails** — the operator's eventual RSS feed for
  /v5/journal can use the card as a per-entry thumbnail.
  Deferred until RSS scope.
- **Phase 10 — Ambient intelligence (CONDITIONAL).** Lumina
  V5 reading the card's underlying data is the same path as
  reading the journal entry from 9.3. No new dependency
  here.
- **External operator-side card tools** — the route is just
  HTTP; an operator-side dashboard or notification system
  can fetch the PNG for embedding.

---

## 14. Deferred systems

- **Per-week OG card variant** — see above.
- **Custom font loading via Satori** — would let us swap to
  Geist or similar to match the in-page typography
  exactly. Current system-sans is good enough; cost/benefit
  not yet there.
- **Twitter `summary` card variant** — Twitter supports a
  smaller card type with different aspect ratio. The
  `summary_large_image` choice maximises visibility, which
  is the right default. Defer the smaller variant.
- **Pre-rendered PNG snapshots in sitemap** — the OG card
  could be linked from sitemap.xml as a regenerable
  thumbnail. Defer; sitemap stays clean for now.
- **A/B test of card layouts** — would require traffic
  split + measurement infrastructure that doesn't exist.
  Defer.

Permanently rejected (Phase 9 brief + V5 § 2.4):
- LLM-generated card copy (Anti-Generic-AI Law).
- Realtime updating "live counter" cards (the 5min cache
  is the floor; faster would breach Phase 9's "no realtime
  spectacle").
- Per-visitor personalised cards (privacy posture +
  share-card semantics — every scraper should see the
  same card).
- Charts / sparklines / trend graphics on the card
  (dashboard cosplay).

---

## 15. Affected system analysis

| Axis | Impact |
|------|--------|
| Architecture | New edge route in `app/api/og/operating/`. Reuses Phase 9.1 composer + Phase 9.3 storage unchanged |
| Operational twin | Card consumes the SAME snapshot the portrait page renders — no source divergence |
| Telemetry | One new event kind in the existing v5:operating:adoption hash. No new KV keys |
| Future ambient | Lumina V5 can fetch the card or read the underlying snapshot directly |
| Feature flag | Reuses V5_OPERATING_TWIN_ENABLED. One flag, full Phase 9 surface family |
| Bundle | 0 bytes client. Server route only |
| Privacy | Operator-side data only. No per-scraper field in adoption. No PII in PNG |
| Maintenance | ~0.5 hr/mo. Lowest-overhead sub-PR in Phase 9 |
| Rollback | Single-commit revert clean. KV state orphans harmlessly |
| Identity | Cinematic identity preserved: black canvas, cyan accent, dual ambient glow, restrained 4-tile composition |

---

## 16. Next phase (post-9.4 disposition)

**Phase 9 is now closed.** Per V5 § 5.5 the 90-day
observation window begins for the whole operational twin
family. The next move is OBSERVATION, not implementation:

- Watch `v5:operating:adoption` for view + section
  inspection ratios.
- Watch `v5:journal:adoption` for cron health (cron_error
  spikes vs cron_generated) + index/entry view distribution.
- Watch the new `og_rendered` counter for share-scrape
  signal.
- Watch `JOURNAL_PAGE_VISITS` + `OPERATING_PAGE_VISITS`
  scalars for raw reach.

Phase 10 — Ambient Intelligence Layer — remains CONDITIONAL
per V5 § 5.5. The operator may choose to scope it after the
observation window, or close V5 at Phase 9 if the data
layer alone fulfills the V5 mission.

Awaiting explicit approval / disposition per the V5
operating constitution. STOP and observe is the default.

---

## 17. Closing — the twin now has a face that travels

Sub-PR 9.1 made the data legible. Sub-PR 9.2 made it
readable. Sub-PR 9.3 made it archivable. Sub-PR 9.4 makes
it SHAREABLE — every link to `/v5/operating` or `/v5/journal`
that flows through Slack, Twitter, LinkedIn, email, RSS
now carries a portrait of the operational state with it.

The visitor who eventually sees the card in their feed
reads:
- Eyebrow: V5 · Operating · Portrait + today's date.
- Headline: "Operating. What's actually happening."
- 4 stat tiles: numbers only, hint metadata in cyan.
- A one-line narrative (templated from the latest journal
  entry, or from primitives in the snapshot, or a static
  fallback).
- Footer: "Portrait · Not dashboard" + the URL.

What they DO NOT see:
- Charts, sparklines, trend lines.
- LLM-generated copy.
- Per-visitor personalisation.
- Marketing language.

The Phase 9 brief's covenant is preserved at the share-
surface layer: portrait, not dashboard. Calm, truthful,
operational.

**Phase 9 closes here. The 90-day observation window
begins.**
