# SUB-PR 1.3 REPORT — Auto-Tweet 2.0 Multi-Format Engine

> **Phase:** V4 Phase 1 — OSS Launch & Distribution Foundation
> **Sub-PR:** 1.3 of 5 (1.1 ✓ → 1.2 ✓ → **1.3 ✓** → 1.4 → 1.5)
> **Branch:** `feat/v4-phase1-oss-launch` (stacked on 1.1 + 1.2 + reorg)
> **Mode:** Disciplined sub-PR execution. Sub-PR 1.4 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Evolve the V3-era single-format daily-standup auto-tweet into a
four-format engine: `daily_standup` (existing), `weekly_architecture`
(new), `incident_response` (new, scaffolded for Sentry in 1.5),
`lumina_clip` (new, text-only per V4 § 6.1.B step 5). Add KV-tracked
content history with a 14-day rolling dedupe window. Refactor the
466-line monolith into a thin dispatcher + per-mode handler files.

The behaviour-preservation constraint dominates: **the existing
Vercel cron must continue producing identical daily standup tweets**
with the same prompt, OG image, fallback paths, KV record, and
response shape it did before this sub-PR.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 5.1.3, § 6.1.B SUB-PR 1.3, § 2.13
(telemetry schema), § 9 (anti-patterns — feature addiction + scope
creep gates).

**Reference scan:**

| File | Takeaway |
|---|---|
| `app/api/auto-tweet/route.ts` (pre-refactor, 466 lines) | One file, one mode. Inline system prompt, GitHub event fetch, context builder, draft generator, OG fetch, Twitter post, KV record write, telemetry increment (added by 1.2). |
| `app/api/og/standup/route.tsx` | `GET /api/og/standup?date=YYYY-MM-DD&repos=a,b,c` — daily standup OG card. Tightly coupled to standup framing; reused as-is by `daily_standup` handler, NOT used by the new modes. |
| `lib/twitter-client.ts` | `postTweet(text, { mediaIds? })`, `uploadMedia(buf, mime)`, `TWEET_MAX_LENGTH = 280`. All four modes use `postTweet`; only `daily_standup` uses `uploadMedia`. |
| `lib/lumina/memory.ts` | `lumina:session:<id>` KV prefix. Lumina-clip scans this. |
| `lib/telemetry/metrics.ts` (Sub-PR 1.2) | `incrementMetric(METRIC_KEYS.AUTOTWEET_SUCCESS_30D)` — already wired into the route. Refactor needs to keep this firing on success. |
| `vercel.json` | One cron entry: `/api/auto-tweet @ 0 6 * * *`. Adding one more for weekly_architecture. |

---

## 3. What was implemented

### 3.1 `lib/auto-tweet/modes.ts` (new, 75 lines)

Mode enum + `parseMode(raw)` that defaults to `daily_standup` when
the query is missing (so the existing cron path keeps working) and
returns `null` for unknown values (the dispatcher 400's). Also
exposes `modeMetricSlug(mode)` as forward-compat documentation for
per-mode telemetry keys landing in Sub-PR 1.5.

### 3.2 `lib/auto-tweet/dedupe.ts` (new, 173 lines)

V4 § 6.1.B SUB-PR 1.3 step 1: 14-day rolling duplicate prevention.

Storage:

- `v4:autotweet:history:<YYYY-MM-DD>` — daily list of
  `{ hash, text, posted_at }` entries, 15-day TTL.
- `v4:autotweet:format:<mode>:last_post` — ISO timestamp.

Operations:

- `isDuplicate(text)` — SHA-256 hash (16 hex chars), scan the last
  14 daily buckets, return true on any hash match. **Fail-open** on
  KV error: a KV blip lets the post through rather than silently
  blocking all auto-tweets.
- `recordPost(mode, text)` — append to today's bucket, bump
  `:last_post`, refresh TTL.
- `readLastPost(mode)` — for prompts that want "last ran" awareness.

Hash normalisation: lowercase, collapse whitespace, strip
punctuation noise. Catches Claude's near-duplicate-with-slightly-
different-punctuation case.

### 3.3 `lib/auto-tweet/prompts/<mode>.ts` (4 new files)

- `daily-standup.ts` — extracted **verbatim** from the V3-era inline
  `SYSTEM_PROMPT`. Includes the calibrated voice, structure, hard
  constraints, and sparse-data pivots that survived Phase 1 (V3)
  observation. Behaviour-preservation rule documented in the
  file header.
- `weekly-architecture.ts` — new. Voice: senior engineer thinking
  out loud. Structure: noticing + 1-2 lines of evidence + 1 closing
  stance. Explicitly forbids the daily-standup `⚡🏗️☁️` three-bullet
  format so the two modes never collide.
- `incident-response.ts` — new. Calm operator voice. Names the
  surface + cause + mitigation in 3 short lines. Forbids
  performative crisis vocabulary, generic apologies, "we" voice.
  Returns empty string when payload is too thin — the handler
  treats that as skip-without-post.
- `lumina-clip.ts` — new. Lumina's own voice. Quote-and-frame format
  (one curly-quoted assistant line + one framing line). Forbids
  "look what our AI can do" tone. Returns empty string when context
  is insufficient.

### 3.4 `lib/auto-tweet/handlers/daily-standup.ts` (new, 407 lines)

The V3 daily-standup logic, lifted into a handler file with
**zero behaviour change**:

- Same `loadLastCommit`, `loadRecentEvents`, `buildContext`,
  `deriveRepos`, `fetchOgImage`, `generateDraft` helpers
- Same `STANDUP_KEY_PREFIX = "cwh:daily-standup:"` KV record key
- Same `STANDUP_TTL_SECONDS = 90 days`
- Same `/api/og/standup` reuse for the OG image
- Same media-pipeline fallback (OG fetch fails → text-only;
  uploadMedia fails → text-only)
- Same JSON response shape (`{ ok, date, draft, tweet_id,
  with_media, media_error, media_error_detail }`)
- Same console log lines (so historical grep patterns keep working)

Two additions, both surgically minimal:

1. **14-day dedupe guard** — between draft generation and the Twitter
   post. On duplicate, persists `skipped: "duplicate"` in the KV
   record and returns `{ ok: true, skipped: "duplicate", ... }`.
   Telemetry counter is NOT incremented (no real post happened).
2. **`recordPost(...)` on success** — fire-and-forget, feeds the
   dedupe ledger for future runs.

### 3.5 `lib/auto-tweet/handlers/weekly-architecture.ts` (new, 259 lines)

Tuesday cron entry. Different context source: filters PushEvents to
the last 7 UTC days. Different KV record prefix
(`v4:autotweet:weekly_architecture:`) so historical analytics can
separate by mode. **Text-only** — no OG fetch (per V4 § 6.1.B step
5: "Phase 1'de just text post"). Calls `readLastPost(...)` to inject
"do not recycle last week" awareness into the prompt context.

Same response shape vocabulary as `daily_standup` — `{ ok, date,
draft, tweet_id, mode }` — for consistent cron logs.

### 3.6 `lib/auto-tweet/handlers/incident-response.ts` (new, 226 lines)

**Drafts only — never auto-posts.** Reads a Sentry-shaped payload
from the request body (`{ id, level, title, message, surface,
exception_type, environment }`). Validates `level === "critical" |
"fatal"`. Returns early with `status: "skipped-non-critical"` or
`"skipped-empty-context"` for low-signal payloads.

When the draft generates, persists to KV at
`v4:autotweet:incident:<id>` (30-day TTL) with a
`status: "drafted"` field. Returns the draft in the response body.
The actual Twitter POST is the responsibility of the Sub-PR 1.5
approval surface — wiring it is a single config change there.

### 3.7 `lib/auto-tweet/handlers/lumina-clip.ts` (new, 298 lines)

Selection signal in v1: `kv.scan` over the `lumina:session:*`
prefix (from `lib/lumina/memory`), pick the longest assistant turn
≥ 200 chars across up to 25 recent sessions. The richer "copy-
pressed + follow-up positive" signal V4 § 6.1.B describes needs
telemetry that lands in Sub-PR 1.5 — until then the length+recency
heuristic is the stand-in.

Privacy: only the assistant turn ever surfaces to the LLM or the
tweet. Visitor messages are skipped. Visitor session IDs are
anonymous UUIDs by design (lib/lumina/memory), so even the scan
path doesn't expose identity. Text-only — no OG.

### 3.8 `app/api/auto-tweet/route.ts` (refactored, 466 → 107 lines)

Thin dispatcher:

```ts
const mode = parseMode(searchParams.get("mode"));
if (!mode) return unknownMode();
const res = await dispatch(mode, req);
return maybeRecordSuccessAndPassThrough(res);
```

Plus:

- The `isAuthorized` / `unauthorized` helpers (CRON_SECRET bearer
  auth) preserved at top-level — same auth posture as V3.
- The `incrementMetric` call from Sub-PR 1.2 now lives in a
  `maybeRecordSuccessAndPassThrough` wrapper that inspects each
  handler's JSON response, increments the counter only when the
  body contains a real `tweet_id` (not on `skipped: "duplicate"`,
  not on `status: "drafted"`), and returns the response unchanged
  to the caller. The body is buffered via `res.clone().text()` so
  the upstream caller still gets the full payload.
- TypeScript exhaustiveness check (`const _exhaustive: never = mode`)
  in the switch — a future fifth mode added to `AUTOTWEET_MODES`
  without updating the dispatcher will fail at compile time.

### 3.9 `vercel.json` (modified, +4 lines)

Added the weekly architecture cron:

```json
{
  "path": "/api/auto-tweet?mode=weekly_architecture",
  "schedule": "0 5 * * 2"
}
```

Tuesday 05:00 UTC = 08:00 GMT+3, matching V4 § 6.1.B step 3's
example schedule.

The existing daily entry (`/api/auto-tweet @ 0 6 * * *`) is
unchanged — it dispatches to `daily_standup` via the
`parseMode(null) → daily_standup` default.

---

## 4. What was deliberately NOT touched

Per "DO NOT silently expand scope" and V4 § 9:

- `app/api/og/standup/route.tsx` — daily-standup OG, reused as-is
- **Per-mode OG image templates** for the new modes — V4 § 6.1.B
  SUB-PR 1.3 lists "per-format dedicated OG image template" but
  step 5 acknowledges text-only is the v1 shape for new modes.
  Daily-standup keeps its OG; weekly/incident/clip are text-only.
  Per-mode OGs can land in 1.5 if they earn it.
- **Sentry webhook → /api/auto-tweet?mode=incident_response** wiring —
  Sub-PR 1.5
- **Admin approval UI** for incident-response drafts — Sub-PR 1.5
- **`lumina_clip` weekly cron entry** — deferred. The selection
  heuristic (longest assistant turn ≥ 200 chars) is good enough to
  draft on demand but probably too thin to schedule blindly. Sub-PR
  1.5 will add a richer "best answer" signal and then the cron.
- **Per-mode telemetry counters** (`v4:adoption:autotweet:<mode>:success:30d`) —
  Sub-PR 1.5. The slug helper exists in modes.ts as documentation.
- **`lib/auto-tweet/context.ts` shared github events helper** — could
  factor `loadLastCommit` + `loadRecentEvents` out of daily-standup
  and weekly-architecture, but the two handlers have meaningfully
  different filter behaviour (last 24 h vs. last 7 d). Keeping
  them as private helpers in each handler avoids a premature
  abstraction. 3-yer rule (V4 § 9.3 architecture perfectionism)
  satisfied.
- Pre-existing lint errors in `packages/lumina-chat/src/LuminaWindow.tsx` —
  out of scope as before.

**Anti-pattern checks (V4 § 9):**

- ❌ No new npm dependency added (same `@ai-sdk/anthropic`,
  `@vercel/kv`, `ai` imports as before)
- ❌ No "while we're here" refactor of `lib/twitter-client.ts`,
  `lib/lumina/memory.ts`, or `lib/site-url.ts`
- ❌ No identity drift; no Lumina DNA touched (chat route untouched)
- ❌ Cool Demo Syndrome filter — every mode traces to a doc requirement
- ❌ No infinite roadmap; the existing daily-standup keeps its V3
  posture exactly

---

## 5. Validation report

### 5.1 Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green
- ✅ `/api/auto-tweet` still appears as `ƒ (Dynamic)` edge route
- ✅ `/telemetry` still `○ (Static)` with 5m/1y ISR (Sub-PR 1.2 invariant)
- ✅ `@emredogan/lumina-chat` tarball still 29 files / 23.7 kB
  (Sub-PR 1.1 invariant)
- ✅ No other route's static/SSG status changed

### 5.2 Lint

- ✅ All Sub-PR 1.3 files lint-clean (no new disable comments)
- ⚠️ Pre-existing `packages/lumina-chat/src/LuminaWindow.tsx`
  carry-over from before Phase 1, untouched

### 5.3 Behaviour preservation — daily_standup

Critical invariant. Verified by line-by-line diff between the
pre-refactor inline implementation and the new handler:

| Aspect | Status |
|---|---|
| `SYSTEM_PROMPT` text | ✅ identical (extracted to `prompts/daily-standup.ts`) |
| `loadLastCommit` / `loadRecentEvents` logic | ✅ identical |
| `buildContext` output format | ✅ identical |
| `deriveRepos` order + cap | ✅ identical (last_commit first, then events, dedup, max 6) |
| `fetchOgImage` URL + behaviour | ✅ identical |
| `generateDraft` params (model, temp 0.6, maxTokens 200) | ✅ identical |
| Quote-strip + 280-char truncate | ✅ identical |
| Media pipeline (og fetch → upload → text-only fallback) | ✅ identical |
| `STANDUP_KEY_PREFIX` + 90-day TTL | ✅ identical |
| `DailyStandupRecord` shape | ✅ identical (one optional field added: `skipped: "duplicate"`) |
| Status codes (200/502) | ✅ identical |
| Console log lines | ✅ identical |
| Response JSON body | ✅ identical |
| Telemetry counter increment | ✅ preserved (moved into `maybeRecordSuccessAndPassThrough` wrapper) |

Two intentional additions, both off the critical path:

1. **14-day dedupe** between draft and post. If the freshly drafted
   tweet matches any of the last 14 days' tweets, the run short-
   circuits with `skipped: "duplicate"` instead of double-posting.
   On any KV error, dedupe fails open — the post still goes out.
   This is a Phase 1 _hardening_ addition required by V4 § 6.1.B
   step 1, not a behaviour drift.
2. **`recordPost`** on the success branch. Feeds the dedupe ledger
   so tomorrow's run can see today's tweet. Fire-and-forget, no
   impact on response.

### 5.4 Bundle / performance

- 0 KB client bundle delta (handlers are server-only, no client
  islands)
- Edge route bundle delta: small (4 handler imports, all
  tree-shakeable; only the dispatched mode's logic runs per request)
- Cold start: each handler imports `@ai-sdk/anthropic` + `ai` +
  `@vercel/kv`, same as the pre-refactor route — no new heavy deps

### 5.5 Mobile / accessibility / hydration

N/A — Sub-PR 1.3 touches no UI surfaces.

### 5.6 Reduced-motion

N/A — no animations, no client components.

### 5.7 Cinematic identity

- ✅ No UI changes
- ✅ Tweet voices (in the prompts) preserve calm-operator vocabulary
- ✅ No "we", no "team", no SaaS-marketing phrasing in any new prompt
- ✅ Brand discipline: weekly + clip prompts explicitly forbid the
  daily-standup `⚡🏗️☁️` emoji pattern so the three voices stay
  distinct on the timeline

---

## 6. Schema additions (V4 § 2.13)

| Key | Role | Operation |
|---|---|---|
| `v4:autotweet:history:<YYYY-MM-DD>` | daily dedupe bucket | list append, 15-day TTL |
| `v4:autotweet:format:<mode>:last_post` | per-mode last-fire timestamp | overwrite |
| `v4:autotweet:weekly_architecture:<YYYY-MM-DD>` | weekly record | overwrite, 120-day TTL |
| `v4:autotweet:incident:<id>` | drafted incident record | overwrite, 30-day TTL |
| `v4:autotweet:lumina_clip:<YYYY-MM-DD>` | weekly clip record | overwrite, 120-day TTL |

Existing telemetry counter unchanged:
`v4:adoption:autotweet:success:30d` continues to receive
`incrementMetric` calls for any successful POST (any mode).
The /telemetry dashboard tile from Sub-PR 1.2 keeps working
without changes.

---

## 7. Rollback plan

### Pre-cron-trigger (this commit)

- `git revert <commit-sha>` removes all 11 new files and restores
  the V3-era route. No external state. Fully reversible.

### Per-mode rollback

If a specific mode misbehaves in production, the surgical rollback
is:

1. Remove the matching cron from `vercel.json` (the weekly one) —
   takes effect at the next deploy.
2. For modes triggered manually (incident_response, lumina_clip
   curl), the handler can be short-circuited by returning early
   from the dispatcher case in `app/api/auto-tweet/route.ts`.

### Full rollback (revert to V3 single-mode)

- Revert this commit and the previous telemetry-wiring commit
  (Sub-PR 1.2 added the `incrementMetric` call to the inline route)
- Tarball remains intact; KV history entries are inert if reads
  are removed

---

## 8. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Daily-standup behaviour drift from refactor | Low | High | Line-by-line diff above; prompt extracted verbatim; same model/temp/tokens |
| Dedupe false-positive (legitimate near-duplicate blocked) | Low | Low | Returns `{ ok: true, skipped: "duplicate" }` not 5xx; daily logs flag for review; window is 14d not infinite |
| Dedupe false-negative (real duplicate sneaks through) | Low | Low | Normalisation strips punctuation noise; 8-byte SHA-256 prefix has ~10^18 collision space for ~140 tweets in window |
| Weekly cron generates content too similar to daily | Medium | Low | Prompt explicitly forbids the daily three-bullet format + `readLastPost` injects "do not recycle" into context |
| Incident-response handler called with non-Sentry payload | Medium | Low | Validates `level === "critical"|"fatal"` + title/message/surface presence; 200 with `skipped: "..."` body |
| Lumina-clip handler picks a low-quality assistant turn | Medium | Low | Length floor (200 chars) + privacy filter; failure mode is a thin post, not a wrong post; full "best answer" signal lands in 1.5 |
| `kv.scan` over `lumina:session:*` exposes private data | Very low | Medium | Only the assistant turn is read; visitor messages and session IDs are anonymous UUIDs by design |
| Edge cold start budget creep | Low | Low | Same set of imports as before; tree-shaking removes unused handler logic per dispatch |

---

## 9. Founder energy impact

- **Dev time this sub-PR:** ~2 hours
- **Cumulative Phase 1 burn (1.1+1.2+1.3+reorg):** ~5 hours
- **Maintenance** (V4 § 4.1): 1 hr/month auto-tweet observation
  budget. Adding three modes doesn't 3× the maintenance — each new
  format runs at most once per week, so observation overhead is
  marginal.
- **Burnout signal:** none. Well within the 22 hr/week budget.

---

## 10. Next recommended sub-PR

**SUB-PR 1.4 — `/changelog` Public Engineering Log** (V4 § 5.1.4,
§ 6.1.B SUB-PR 1.4, est. 2-3 days dev).

Scope (for reference — do not start until human approval):

- Extend `lib/github-events.ts` (or create it) with `getRecentCommits`
  + WHY annotation parsing (first paragraph after commit subject)
- `app/changelog/page.tsx` Server Component
- GitHub Events API + KV cache (30-min)
- Last 50 commits, filter by project, reverse chronological
- Lighthouse Mobile ≥ 92
- Mobile card stack layout
- Add `/changelog` to sitemap (mirrors `/telemetry` from 1.2)

Sub-PR 1.4 has **no dependency** on this sub-PR. The reverse is also
true — the auto-tweet weekly cron doesn't need /changelog to fire.

---

## 11. STOP

Sub-PR 1.3 complete from the agent's side. Awaiting human review
and approval before Sub-PR 1.4 begins.

— end Sub-PR 1.3 —
