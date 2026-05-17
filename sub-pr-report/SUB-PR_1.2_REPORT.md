# SUB-PR 1.2 REPORT — `/telemetry` v1 Public Dashboard

> **Phase:** V4 Phase 1 — OSS Launch & Distribution Foundation
> **Sub-PR:** 1.2 of 5 (1.1 ✓ → **1.2 ✓** → 1.3 → 1.4 → 1.5)
> **Branch:** `feat/v4-phase1-oss-launch` (already shipped Sub-PR 1.1)
> **Mode:** Disciplined sub-PR execution. Sub-PR 1.3 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Ship the public engineering observability dashboard described in V4
§ 5.1.2 / § 6.1.B SUB-PR 1.2 / FUTURE § 2.5: `/telemetry` reads Lumina
latency, auto-tweet adoption, Bedrock cost, npm downloads, and MRR
from KV — five hand-curated tiles, server-rendered, 5-minute ISR,
cinematic identity preserved. The visitor's takeaway: "this platform
is observed in production and nothing is hidden."

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 2.7 (perf budget), § 2.8 (hydration),
§ 2.9 (edge runtime), § 2.13 (telemetry schema), § 5.1.2 (Sub-PR
spec), § 6.1.B SUB-PR 1.2 (impl steps), § 10.1 (sunset thresholds).
FUTURE § 2.5 (engineering observability dashboard).

**Reference scan:**

| File | Takeaway |
|---|---|
| `lib/lumina/memory.ts` | KV gate pattern: `hasKv = Boolean(KV_REST_API_URL && KV_REST_API_TOKEN)`. Try/catch swallow; no-op when KV missing. Mirrored verbatim for telemetry. |
| `app/api/cwh/live-metrics/route.ts` | Edge runtime; `kv.scard` pattern; `Cache-Control: no-store`; graceful 0 fallback on KV blip. Same posture for telemetry edge route. |
| `app/api/chat/route.ts` | Edge; `streamText` → `toUIMessageStreamResponse({ onFinish })` already used for session save. Latency stopwatch piggybacks on existing onFinish. |
| `app/api/auto-tweet/route.ts` | Edge; success path is `if (postResult.ok)` writing the record with `posted_at`. Counter increment slots in immediately before the success Response. |
| `app/sitemap.ts` | Static-routes array — `/telemetry` added one entry. |

---

## 3. Schema (V4 § 2.13)

Five KV keys, verbatim from V4 § 6.1.B SUB-PR 1.2 step 1:

| Key | Operation | Wired by Sub-PR 1.2? |
|---|---|---|
| `v4:telemetry:lumina:p95_latency:hourly` | rolling 100-sample window, p95 computed on each write | ✅ chat route → `recordLatencySample` |
| `v4:cost:bedrock:daily:USD` | scalar, USD/day | ⏳ reserved — production chat uses Anthropic direct today, not Bedrock |
| `v4:adoption:autotweet:success:30d` | counter, `kv.incrby` | ✅ auto-tweet route → `incrementMetric` on `postResult.ok` |
| `v4:adoption:lumina-chat-npm:weekly` | scalar, set by external poll | ⏳ poll cron lands in Sub-PR 1.5 batch |
| `v4:monetization:mrr:current` | scalar, $0 until Lemon Squeezy webhook | ⏳ wires in Phase 3 |

Two of the five are wired with live writes; three are reserved
infrastructure (key + read path + tile + slug + cache header), with
the writes to follow in their respective sub-PRs. The dashboard
renders all five today — the three not-yet-wired tiles show
italic placeholders ("0.1.0 not yet on npm", "no Bedrock traffic
yet", "no paid tier yet") instead of misleading zeroes.

**Semantic simplifications (documented in `lib/telemetry/metrics.ts`):**

- `:hourly` suffix kept for forward compatibility when Sub-PR 1.5
  splits into per-hour buckets; v1 uses a single 100-sample rolling
  window under one KV key for simplicity.
- `:30d` suffix kept for forward compatibility when Sub-PR 1.3
  (auto-tweet 2.0) implements proper 30-day windowing; v1 increments
  a cumulative counter.

---

## 4. What was implemented

### 4.1 `lib/telemetry/metrics.ts` (new, 200 lines)

Five exports:

```ts
export const METRIC_KEYS = { ... } as const;     // schema whitelist
export type MetricKey = (typeof METRIC_KEYS)[keyof typeof METRIC_KEYS];
export interface MetricSnapshot { value: number; updated_at: string; }

recordMetric(key, value)                          // scalar overwrite
incrementMetric(key, delta = 1)                   // atomic counter
recordLatencySample(key, ms)                      // rolling p95
readMetric(key): Promise<MetricSnapshot | null>   // dashboard + edge route read
```

Engineering posture:

- Mirrors the graceful-no-op contract from `lib/lumina/memory.ts`:
  KV unavailable → silent no-op (writes) / `null` (reads). Telemetry
  is decorative, never blocks the caller's primary work.
- `recordLatencySample` keeps a 100-sample rolling window at
  `${key}:samples` and a pre-computed p95 snapshot at `${key}` —
  reads stay a single `kv.get`.
- Percentile computed via linear interpolation between adjacent
  indices (numpy default flavour) — stable for small N, no
  off-by-one at boundary cases.
- Per-sample cap of 60_000 ms — a single hung edge invocation can't
  poison the p95 forever.
- `readMetric` handles three storage shapes transparently:
  `MetricSnapshot` object (from recordMetric/recordLatencySample),
  raw `number` (from incrementMetric counter case, with `updated_at`
  living at a sibling key), and anything else → `null`.

### 4.2 `app/api/telemetry/[metric]/route.ts` (new, 65 lines)

Edge route. Slug → KV-key whitelist. Returns
`{ metric, value, updated_at }` JSON. `404` for unknown slugs with
the known-slug list in the body.

Cache: `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`
matching V4 § 5.1.2's "5-minute cache". Vercel edge caches the
response; revalidation happens in the background.

Uses Next 16's typed `RouteContext<"/api/telemetry/[metric]">`
helper per the in-tree docs (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`)
— forward-compatible with the project's `AGENTS.md` directive about
Next 16 breaking changes.

Slugs published in v1:
- `lumina-p95`
- `bedrock-cost`
- `autotweet-success`
- `npm-downloads`
- `mrr`

### 4.3 `app/telemetry/page.tsx` (new, 230 lines)

Server Component, ISR with `revalidate = 300`. Build output confirms
`○ /telemetry 5m 1y` (5-minute revalidate, 1-year expire) — the page
is **statically prerendered** between revalidations, so cached HTML
is served from Vercel's edge cache with no per-request KV reads.

Layout:

- **Hero** — small "Telemetry" eyebrow, `Measured, / not asserted.`
  two-line statement, single paragraph of framing. Same posture as
  /about, /codex, /notes so the new page reads as part of the site,
  not a separate tooling chunk.
- **Grid** — `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`,
  matching V4 § 5.1.2's "1-col mobile → 3-col desktop". 5 tiles
  wrap into 3+2 on desktop, 3+2 on tablet, single column on mobile.
- **Tile** — cyan-tinted value (`text-[#00d2ff]`, tabular-nums) with
  a unit badge, "updated Xm ago" mono timestamp, and a one-sentence
  description. Italic placeholder when KV has no data yet.
- **Footer** — quiet provenance block: full slug list under
  `<code>` ticks, snapshot timestamp, "revalidates every 5m" pulse.
  Visual rhythm matches the closing-transmission block on /about.

Visual primitives reused from elsewhere in the site:

- `Reveal` (already client-only motion island in `components/ui/`)
- Same ambient cyan radial-blur backgrounds as /about
- `font-mono`, `tracking-[0.20em]`, `text-[10px]` — the eyebrow
  vocabulary established in V3
- `text-primary/text-secondary/text-tertiary/text-quiet/text-faint`
  five-stop palette from `globals.css`

Zero new client-side dependencies. Zero new motion infinite loops.
`prefers-reduced-motion` honoured via the existing global guard.

### 4.4 `app/sitemap.ts` (modified, +1 line)

`/telemetry` added to `STATIC_ROUTES`. Public surface is now
crawlable.

### 4.5 `app/api/chat/route.ts` (modified, +9 / -1 lines)

One import. One stopwatch (`const start = Date.now()` at function
entry). One `recordLatencySample` call inside the existing
`toUIMessageStreamResponse({ onFinish: ... })` callback, fire-and-
forget via `void` so a KV blip can never delay the session-save
path or the response close. No behaviour change to the chat
streaming path.

### 4.6 `app/api/auto-tweet/route.ts` (modified, +9 / -0 lines)

One import. One `void incrementMetric(...)` call after the existing
KV record-set block, gated on `postResult.ok`. Fire-and-forget,
graceful no-op when KV missing, no impact on the cron response
shape.

---

## 5. What was deliberately NOT touched

Per the user directive ("DO NOT silently expand scope") and V4
§ 9 (Anti-Pattern System):

- `lib/sentry.ts` / `@sentry/nextjs` — Sub-PR 1.5
- `app/changelog/page.tsx` — Sub-PR 1.4
- `vercel.json` cron list — Sub-PR 1.3 (auto-tweet 2.0 will add)
- The Bedrock cost wiring path — production chat doesn't go through
  Bedrock today; key reserved as forward-compat
- The npm-download poll cron — Sub-PR 1.5
- The Lemon Squeezy webhook → KV path — Phase 3
- Auto-tweet multi-format refactor (V4 § 5.1.3) — Sub-PR 1.3
- Pre-existing lint errors in `packages/lumina-chat/src/LuminaWindow.tsx`
  — out of scope, flagged in Sub-PR 1.1 report
- The user's in-progress file reorganization (`docs/` and
  `sub-pr-report/` directories with moved files) — uncommitted on
  their side, **left untouched** so the user can finalize that move
  separately. This Sub-PR 1.2 commit only stages my own files; the
  user's reorganization should be its own commit when ready.

**Anti-pattern checks (V4 § 9):**

- ❌ No new npm dependency added
- ❌ No design refactor of unrelated surfaces
- ❌ No "while we're here" additions
- ❌ No identity drift (`#00d2ff` only, Geist only, bg-black)
- ❌ Cool Demo Syndrome filter — every change traces to a doc-
  mandated requirement
- ❌ No telemetry surface shipped without a sunset criterion
  (sunset thresholds defined in V4 § 10.1 — `/telemetry` itself is
  marked "never sunset" since it's internal-use-too)

---

## 6. Validation report (V4 § C)

### 6.1 Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green; new routes appear correctly:
  - `/telemetry` → `○ (Static)` with `5m 1y` ISR
  - `/api/telemetry/[metric]` → `ƒ (Dynamic)` edge
  - All existing routes unchanged
- ✅ No edge-runtime spillover into the page route
- ✅ No SSG breakage on `/codex/[slug]`, `/notes/[slug]`,
  `/projects/[slug]`

### 6.2 Lint

- ✅ All Sub-PR 1.2 files lint-clean
- ⚠️ One `react-hooks/purity` flag suppressed with a targeted
  `eslint-disable-next-line` comment on `const now = Date.now()`
  inside the page. Explanation comment alongside: render-time
  impurity is the contract of an ISR-cached observability page,
  not an accident. This is the only suppression added by
  Sub-PR 1.2.
- ⚠️ Pre-existing `packages/lumina-chat/src/LuminaWindow.tsx` errors
  carry over from Sub-PR 1.1 — not introduced here, deferred

### 6.3 Bundle / performance

| Budget (V4 § 2.7) | Hedef | Hard | Actual |
|---|---|---|---|
| `/telemetry` LCP | < 1.2s (cached) | < 2.0s | static HTML, served from edge cache between revalidations → comfortably under |
| Bundle delta | ~0 | n/a | 0 new client deps; `/telemetry` ships zero client JS for the data path; only `Reveal` motion island (already loaded sitewide) |
| KV cost projection (V4 § 5.1.2) | < $5/ay | n/a | Page: 5 reads per regeneration × 12/hr × 24h × 30d = ~43k reads/month. API: up to 1/req but Vercel edge cache absorbs most. Free-tier KV ceiling unaffected. |

### 6.4 Hydration safety (V4 § 2.8)

- ✅ No server-vs-client time mismatch — page is ISR-cached, all
  visitors receive the same HTML between regenerations
- ✅ `suppressHydrationWarning` applied only to the snapshot
  timestamp text (per V4 § 2.8: "sadece zaman/locale-dependent
  elementlerde")
- ✅ No skeleton-then-real swap — data is rendered server-side once,
  fully

### 6.5 Edge runtime (V4 § 2.9)

- ✅ `/api/telemetry/[metric]` declared `export const runtime = "edge"`
- ✅ KV reads via `@vercel/kv` are Web Fetch-backed (edge-safe)
- ✅ No Node-specific APIs touched

### 6.6 Reduced-motion (V4 § 2.11 / globals.css)

- ✅ No new infinite animations added
- ✅ All new CSS transitions use the existing `transition-*`
  utility classes which the global `prefers-reduced-motion` guard
  collapses to `0.01ms`

### 6.7 Mobile + accessibility

- ✅ Grid responds 1 → 2 → 3 columns at proper breakpoints
- ✅ Decorative spans carry `aria-hidden="true"`
- ✅ Real semantic elements: `<main id="main">`, `<section>`,
  `<article>` per tile, `<time dateTime>` for the snapshot
  timestamp, `<dl>` not used here (tiles are full articles, not
  definition pairs)
- ✅ Color contrast: cyan value text against `bg-black` passes WCAG AA

### 6.8 Cinematic identity (V4 § 13.5)

- ✅ Single brand color `#00d2ff` (no purple, no gradient bonanza)
- ✅ Geist sans only (no editorial fonts)
- ✅ Black background invariant
- ✅ `Reveal` motion island reused — same fade-up vocabulary as
  /about / /codex / /notes
- ✅ Mono micro-typography (`tracking-[0.20em]`, `text-[10px]`)
  consistent with the eyebrow vocabulary established sitewide

---

## 7. Telemetry plan for /telemetry itself (V4 § 2.13)

Per V4 § 5.1.2 validation criterion "Telemetry: `v4:telemetry:dashboard:visits`
(self-referential)":

- **Metric key:** `v4:telemetry:dashboard:visits`
- **Source:** counter incremented on every page render that hits KV
- **Wired:** **not in v1**. The ISR cache means visitor visits don't
  cleanly map to renders (12 renders/hour vs N visits/hour). The
  honest visit counter belongs in a client island that posts to a
  /api/telemetry/visit endpoint — deferred to Sub-PR 1.5 (which also
  brings Sentry for the broader observability hook).
- **Sunset criterion (V4 § 10.1):** `/telemetry` — "Never sunset
  (kendi kullanım)" (page is internal-use too)

---

## 8. Rollback plan

- `git revert <commit-sha>` removes all five Sub-PR 1.2 files cleanly.
  No npm publish involved, no external state. Fully reversible.
- KV state survives revert (keys persist in KV regardless of code) —
  if reverting is needed, the keys are inert without read paths;
  no leak.
- Alternative: route disable. Per V4 § 5.1.2 "Rollback: Route disable,
  KV keys preserved". Could be done by renaming `app/telemetry/` to
  `app/_disabled-telemetry/` in a hotfix without touching KV.

---

## 9. Risks identified

| Risk | Probability | Severity | Mitigation |
|---|---|---|---|
| ISR cache misses inflate KV reads | Low | Low | Each regen does 5 parallel reads. Even with no cache hits, 5 × 60 visitors/hr = 300 reads/hr × 730 hr/mo = 219k reads/mo — under Upstash free tier ceiling |
| KV blip during regen → empty tiles | Low | Low | `readMetric` returns `null` on error; tile renders italic placeholder cleanly |
| `recordLatencySample` overhead on chat hot path | Very low | Low | Fire-and-forget (`void`), inside onFinish (after response is closed) — never delays the visitor |
| Counter clock-skew between auto-tweet success and KV write | Very low | None | We don't claim atomicity between the tweet POST and the increment; rare partial state is acceptable |
| Pre-existing LuminaWindow lint carries over | Already there | None | Out of scope, documented |
| User's pending file moves conflict with my commits | Low | Low | I left their changes untouched; their reorganization is its own commit |

---

## 10. Founder energy impact

- **Dev time this sub-PR:** ~1.5 hours (pre-scan, lib, route, page,
  wiring, QC, report)
- **Cumulative Phase 1 budget burn:** ~2.5 hours across 1.1 + 1.2
- **Maintenance:** V4 § 4.1 budget allocates 1 hr/month for
  `/telemetry`. The dashboard has no live binding to refresh (npm
  poll is external); operationally it runs itself.
- **Burnout signal:** none. Well within the 22-hour weekly budget.

---

## 11. Next recommended sub-PR

**SUB-PR 1.3 — Auto-Tweet 2.0 Multi-Format** (V4 § 5.1.3, § 6.1.B
SUB-PR 1.3, est. 5-7 days dev).

Scope (for reference — do not start until human approval):

- KV content-history schema for dedup (no same tweet within 14 days)
- Refactor `app/api/auto-tweet/route.ts` to mode-select:
  `daily_standup` (current), `weekly_architecture` (new),
  `incident_response` (Sentry-triggered), `lumina_clip` (weekly)
- Per-mode system prompts in `lib/auto-tweet/prompts/<mode>.ts`
- Per-mode OG image templates
- New cron entries in `vercel.json`
- 30-day true-windowing for `v4:adoption:autotweet:success:30d`
  (refactor my v1 cumulative counter into a date-stamped pattern)

Sub-PR 1.3 will inherit the telemetry contract from 1.2: the
`AUTOTWEET_SUCCESS_30D` key already exists and the success-counter
write path is already wired here — 1.3 just needs to refine the
semantics to true 30-day rolling.

---

## 12. STOP

Sub-PR 1.2 complete from the agent's side. Awaiting human review
and approval before Sub-PR 1.3 begins.

**Outstanding (user-side, not blocking):**
- The user's `docs/` and `sub-pr-report/` reorganization is uncommitted
  on disk. Either commit it separately or let me bundle it on
  request.

— end Sub-PR 1.2 —
