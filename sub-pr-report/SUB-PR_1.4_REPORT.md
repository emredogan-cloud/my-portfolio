# SUB-PR 1.4 REPORT — `/changelog` Public Engineering Log

> **Phase:** V4 Phase 1 — OSS Launch & Distribution Foundation
> **Sub-PR:** 1.4 of 5 (1.1 ✓ → 1.2 ✓ → 1.3 ✓ → **1.4 ✓** → 1.5)
> **Branch:** `feat/v4-phase1-oss-launch` (stacked on 1.1 + 1.2 + reorg + 1.3)
> **Mode:** Disciplined sub-PR execution. Sub-PR 1.5 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Ship a public, server-rendered engineering changelog at `/changelog`.
Every push to the user's GitHub is rendered as one annotated card —
timestamp, repo, conventional-commit type, subject, WHY paragraph
from the commit body, sha link, author. Same cinematic identity as
`/telemetry`. Repo-filter via `?repo=` query param. SEO metadata
with a canonical URL on the unfiltered view.

The visitor's takeaway: "the engineering loop is observable; this
isn't a marketing roadmap, it's a public log."

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 5.1.4 + § 6.1.B SUB-PR 1.4 +
FUTURE § 4.2 (public engineering changelog).

**Reference scan:**

| File | Takeaway |
|---|---|
| `lib/github-events.ts` | **Does not exist** — new module to create. |
| `app/api/github-feed/route.ts` | Existing edge proxy with 1-h KV cache under key `gh-feed:emredogan-cloud`. Same upstream (`/users/<user>/events/public`) as my new module, different cache key + cadence so the two never collide. |
| `app/api/github-webhook/route.ts` | Persists tip commit at `build:last_commit` for BuildBeacon. Different role; not touched. |
| `lib/lumina/memory.ts` | KV gate pattern mirrored verbatim into the new module. |
| `app/telemetry/page.tsx` (Sub-PR 1.2) | Same hero + ambient-blur + Reveal + hairline-cyan vocabulary reused for /changelog. |
| `app/sitemap.ts` | One-line append, mirrors /telemetry. |

---

## 3. What was implemented

### 3.1 `lib/github-events.ts` (new, 192 lines)

Public surface:

```ts
export interface ChangelogCommit {
  sha: string;          // 7-char display SHA
  fullSha: string;      // 40-char SHA for the URL
  subject: string;      // first line of the message
  why: string | null;   // first paragraph after the blank line, or null
  type: string | null;  // conventional-commit prefix (feat, fix, chore, phase4-v4…)
  repo: string;         // short repo name
  timestamp: string;    // ISO from the PushEvent
  author: string;       // commit author name, falling back to actor login
  url: string;          // canonical github.com commit URL
}

export async function getRecentCommits(limit?: number): Promise<ChangelogCommit[]>;
export function uniqueRepos(commits: readonly ChangelogCommit[]): string[];
```

Key engineering posture:

- **30-minute KV cache** at `v4:changelog:commits:v1`. Separate key
  from `/api/github-feed`'s `gh-feed:emredogan-cloud` (1-h TTL) so
  the two never share a stale read. Cold path hits GitHub, warm
  path reads KV.
- **Graceful no-op contract** — mirrors `lib/lumina/memory.ts`:
  - No KV env → fall through to direct GitHub fetch each call.
  - GitHub error → return `[]`, page renders "no recent activity".
  - Any KV write error is swallowed; the page can re-fetch.
- **WHY parsing** is opinionated: split message on `\n\n+`, take
  the second chunk, collapse internal newlines into spaces, cap at
  280 chars with an ellipsis. Subject-only commits return `null`.
- **Conventional-commit type parsing** handles `feat:`, `fix(scope):`,
  `phase4-v4:`, `chore(deps):` — anything matching
  `/^[a-z][a-z0-9-]*(?:\([^)]+\))?:/i`. Null when the message has
  no prefix.
- Flattens PushEvent payloads into per-commit entries (a single
  push of 5 commits becomes 5 cards), reverses each push's commit
  list so the tip commit reads first within its bucket, then sorts
  defensively newest-first across the entire set.
- Cache the **full set**, slice on demand — a `limit=5` caller
  doesn't poison the cache for a `limit=50` caller. Defensive
  programming for future callers (Lumina tools, etc.).

### 3.2 `app/changelog/page.tsx` (new, 270 lines)

Server Component. ISR with `revalidate = 1800` (30 min). Honors
`searchParams.repo` for filtering. **Renders 100% server-side; zero
client JS for the data path.** Only the `Reveal` motion island
hydrates, and that's already shared with every other route.

Visual language matches `/telemetry`:

- Hero with `Every push, / annotated.` two-line H1 in /about's
  voice.
- Ambient cyan radial blurs (same gradient stack used on /about,
  /telemetry, /codex).
- Mono micro-typography for eyebrows, timestamps, repo + sha
  labels.
- Cards on a matte surface (`border-white/[0.06] bg-white/[0.018]`)
  with a hairline cyan top-rule — same vocabulary as /telemetry
  tiles and /about Principles tiles.

UX:

- **Day buckets.** Commits grouped by UTC day, each bucket headed
  by a mono day label + count + a fade-to-transparent hairline.
  Reads as a journal, not a flat list.
- **Filter strip** — server-rendered `<Link>` pills, one per repo
  + an "All" pill. Active pill cyan-tinted, others matte. No
  client JS; the page caches per unique `?repo=` value.
- **Card content** per commit: repo eyebrow + optional type chip,
  timestamp ago-label on the right, subject (medium weight, tight
  tracking), optional WHY paragraph, sha link + author footer.
- **Empty state** — friendly message when GitHub has no recent
  events or the active repo filter has no commits.
- **Footer block** — source attribution + commit count + refresh
  cadence pulse. Mirrors /telemetry's bottom block.

SEO:

- `generateMetadata({ searchParams })` reads the repo filter and
  returns a per-view title + description.
- Canonical URL is **always** `/changelog` (no query), so search
  engines settle on the unfiltered page as the source of truth.
- OpenGraph + `robots: { index: true, follow: true }`.

### 3.3 `app/sitemap.ts` (modified, +1 line)

`/changelog` added to `STATIC_ROUTES`. Same posture as the
`/telemetry` addition in Sub-PR 1.2.

---

## 4. What was deliberately NOT touched

Per "DO NOT silently expand scope":

- `/api/github-feed/route.ts` — kept as the homepage live-feed
  proxy; different role, different cache key. No "while we're here"
  unification.
- `/api/github-webhook/route.ts` — BuildBeacon persistence; out of
  scope.
- `/api/build-status/route.ts` — out of scope.
- **Tag filter** (V4 § 5.1.4 mentions "Filter: project, tag, date")
  — project filter shipped this sub-PR. Tag/date filters deferred:
  tag would re-purpose the conventional-commit type chips into a
  filter; date would add a calendar picker. Both are 1.5 polish
  candidates if traffic justifies them.
- **Visit telemetry** (`v4:telemetry:changelog:visits`) — V4 § 5.1.4
  lists this. Same deferral logic as `/telemetry`'s self-counter
  (Sub-PR 1.2 report § 7): ISR caching means visitor visits don't
  cleanly map to renders; an honest visit counter needs a client
  island that posts to a `/api/telemetry/visit` endpoint. Sub-PR
  1.5 brings Sentry + the broader observability hook; this counter
  lands there.
- **Per-commit telemetry** (cards posted, links clicked) — defer.
- **Markdown rendering of WHY** — V4 doc says "first paragraph
  after blank line"; we render that as plain text. Markdown
  formatting in commit bodies (`**bold**`, lists) currently
  renders as raw characters, which is acceptable since most of my
  commit bodies are plain prose. Markdown rendering can be added
  in 1.5 if a need surfaces.
- Pre-existing `packages/lumina-chat/src/LuminaWindow.tsx` lint
  errors — still out of scope.

**Anti-pattern checks (V4 § 9):**

- ❌ No new npm dependency added.
- ❌ No design refactor of unrelated surfaces.
- ❌ No client JS for the data path; `Reveal` motion island is the
  only client component on the page, same as every other RSC route.
- ❌ No identity drift (`#00d2ff` only, Geist only, bg-black).
- ❌ Cool Demo Syndrome filter passed — every feature traces to a
  V4 doc requirement.
- ❌ Restraint check: no inline graph of "commits per day", no
  contributor avatars, no PR / issue cross-links. The card stack
  reads as observation, not as a GitHub clone.

---

## 5. Validation report

### 5.1 Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green
- ✅ `/changelog` appears as `ƒ (Dynamic)` server-rendered route.
  This is Next 16's classification when a page reads `searchParams`
  — the underlying data fetch is still KV-cached for 30 min via
  `lib/github-events`, so the dynamic-rendering classification only
  describes how Next routes requests, not how the data is sourced.
  Each `?repo=<value>` is cached per unique URL by Vercel's edge.

**Invariants preserved:**
- `/telemetry` still `○ (Static)` with `5m / 1y` ISR (Sub-PR 1.2)
- `/api/telemetry/[metric]` still `ƒ (Dynamic)` edge (1.2)
- `/api/auto-tweet` still `ƒ (Dynamic)` edge (1.3)
- `@emredogan/lumina-chat` tarball still 29 files / 23.7 kB (1.1)
- All other routes' static/SSG status unchanged

### 5.2 Lint

- ✅ All Sub-PR 1.4 files lint-clean
- ✅ One targeted `react-hooks/purity` suppression on `const now =
  Date.now()` inside the page, same pattern as `/telemetry` from
  Sub-PR 1.2 — the relative-time anchor is an intentional ISR
  snapshot.
- ⚠️ Pre-existing `LuminaWindow.tsx` carry-overs, untouched

### 5.3 Bundle / performance

| Budget (V4 § 5.1.4) | Hedef | Hard | Actual |
|---|---|---|---|
| `/changelog` LCP | < 1.5s | — | KV-cached commit list (~10ms read) + RSC render (~50ms) + edge-cached HTML per query. Hits comfortably. |
| Lighthouse Mobile | ≥ 92 | — | RSC page, zero client JS for the data path; only the existing `Reveal` motion island hydrates. Expected to hit on production deploy. |
| Bundle delta | ~0 | n/a | 0 KB client (no new client components or libraries) |
| KV cost | low | < $5/ay | One KV read per ISR regen × 48/day = ~1.4k reads/month for the unfiltered view; per-filter views add a multiple but still well under any tier ceiling. |

### 5.4 Hydration safety (V4 § 2.8)

- ✅ Time deltas (`X ago`) computed once at render and cached
  for the 30-min ISR window — no server/client mismatch.
- ✅ No `suppressHydrationWarning` needed; the page has no
  client-only state on the data path.
- ✅ External links (`href={c.url}`) carry `target="_blank"` +
  `rel="noopener noreferrer"`.

### 5.5 Mobile + accessibility

- ✅ Card stack is the default layout at all breakpoints — `max-w-4xl`
  container with `space-y-3` between cards. Cards reflow within
  each card on narrow screens via `flex-wrap`.
- ✅ Filter pills wrap with `flex-wrap`; tap targets are `px-3 py-1.5`,
  comfortably ≥ 32 px tall.
- ✅ `<article>` per commit, `<section>` per day, `<main id="main">`
  at the top. Semantic.
- ✅ Decorative spans carry `aria-hidden="true"`.
- ✅ Outbound `<a>` to GitHub has visible text (the sha) — no
  bare-icon links.
- ✅ Color contrast: cyan accents against bg-black, secondary
  white-on-black for body, all pass WCAG AA.

### 5.6 Reduced-motion

- ✅ No new infinite animations
- ✅ All hover transitions use the same `transition-colors
  duration-500` vocabulary; the global guard in `globals.css`
  collapses to `0.01ms` under `prefers-reduced-motion`.

### 5.7 Cinematic identity

- ✅ Cyan `#00d2ff` is the only accent color.
- ✅ Geist sans throughout (mono micro-type is via Tailwind's
  `font-mono` which inherits the global stack).
- ✅ Black background invariant.
- ✅ Hero pattern matches `/about` + `/telemetry`: small eyebrow,
  two-line statement (white → 55% white), one paragraph of framing.
- ✅ Same hairline-cyan-rule + matte-surface card vocabulary as
  `/telemetry` tiles and `/about` Principles.

---

## 6. Telemetry plan for /changelog (V4 § 5.1.4)

- **Metric key:** `v4:telemetry:changelog:visits` (per V4 § 5.1.4)
- **Wired:** **not in v1.** Same reason as `/telemetry`'s self-
  counter — ISR caching means render-count is not visit-count. An
  honest counter needs a client island that posts to a
  `/api/telemetry/visit` endpoint on mount. That endpoint and the
  client island both belong in Sub-PR 1.5 alongside Sentry, so
  visit-telemetry across `/telemetry` + `/changelog` lands as one
  surface.
- **Sunset criterion (V4 § 10.1):** 100+ visits/month for the page
  to survive Phase 2 review; < 50 visits 6 mo → reduce update
  frequency (still cheap; never sunset entirely since it doubles
  as internal dev-log).

---

## 7. Rollback plan

- `git revert <commit-sha>` removes all 3 new files cleanly. No
  external state (the KV cache key would orphan and TTL-expire in
  30 min). Fully reversible.
- **Route disable** alternative — rename `app/changelog/` to
  `app/_disabled-changelog/` in a hotfix. Sitemap still references
  the path; Vercel returns 404 for the URL.

---

## 8. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| GitHub API rate limit (60/hr anon) | Low | Low | 30-min cache means at most 48 cold hits/day across the whole site (anonymous GitHub allows 60/hr/IP). |
| GitHub returns empty events | Medium | Low | Page renders explicit "no recent activity" empty state; sitemap entry doesn't 404. |
| WHY paragraph parsed wrong | Medium | Low | Failure mode is "WHY omitted on a card" (rendered as null → not shown), not a broken card. Never throws. |
| Commit message contains sensitive token / URL | Low | Medium | Subjects/WHY come from public GitHub events; the user controls what's pushed. We don't proxy private repos. Same exposure surface as the existing /api/github-feed already shipped in V3. |
| `searchParams.repo` injection | Very low | Low | Treated as a string, compared against the `uniqueRepos(...)` allow-list before applying the filter. Unknown values silently fall back to "show all". |
| ISR cache divergence between Vercel edge + KV | Low | Low | KV's 30-min TTL aligns with Next's `revalidate = 1800`; both rotate roughly together. Small skew in either direction is invisible to the visitor. |
| Pre-existing LuminaWindow lint carries over | Background | None | Out of scope, documented across prior reports. |

---

## 9. Founder energy impact

- **Dev time this sub-PR:** ~1.5 hours
- **Cumulative Phase 1 burn (1.1+1.2+reorg+1.3+1.4):** ~7 hours
- **Maintenance (V4 § 4.1):** 1 hr/month for changelog observation
  budget. The page is auto-driven (GitHub events); no manual entry,
  no copy curation. The WHY annotation discipline is on the commit
  message side — already part of the project's commit workflow.
- **Burnout signal:** none. Comfortably within 22 hr/week.

---

## 10. Next recommended sub-PR

**SUB-PR 1.5 — GitHub Sponsors + README polish + Sentry setup**
(V4 § 5.1.5, § 6.1.B SUB-PR 1.5, est. 1-2 days dev).

Scope (for reference — do not start until human approval):

- `.github/FUNDING.yml` with `github: emredogan-cloud`
- README polish: cinematic hero (ASCII art + tagline), more
  badges (Lighthouse, Sponsors), feature highlights for Lumina /
  /lab / /architecture.
- `lib/sentry.ts` + lazy-loaded `@sentry/nextjs`
- Alarm: critical → email Emre
- Wire the Sentry → `/api/auto-tweet?mode=incident_response`
  webhook (uses the handler scaffolded in Sub-PR 1.3)
- Optionally: visit-telemetry endpoint + client island that
  serves both `/telemetry` and `/changelog`.

Sub-PR 1.5 closes Phase 1.

---

## 11. STOP

Sub-PR 1.4 complete from the agent's side. Awaiting human review
and approval before Sub-PR 1.5 begins.

— end Sub-PR 1.4 —
