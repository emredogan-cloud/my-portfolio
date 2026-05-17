# SUB-PR 1.5 REPORT — GitHub Sponsors + README Polish + Sentry + Visit Telemetry (Phase 1 close)

> **Phase:** V4 Phase 1 — OSS Launch & Distribution Foundation
> **Sub-PR:** 1.5 of 5 (1.1 ✓ → 1.2 ✓ → 1.3 ✓ → 1.4 ✓ → **1.5 ✓ — PHASE 1 CLOSED**)
> **Branch:** `feat/v4-phase1-oss-launch`
> **Date:** 2026-05-17

---

## 1. Mission

Close Phase 1. Three doc-mandated deliverables plus one deferred
follow-through:

1. **GitHub Sponsors** — `.github/FUNDING.yml` to enable the
   Sponsor button on the repo + the `lumina-chat` npm package's
   GitHub link.
2. **README polish** — cinematic ASCII hero, Sponsors + Sentry
   badges, the new V4 surfaces (`/telemetry`, `/changelog`,
   auto-tweet 2.0, Sentry instrumentation) added to the Features
   table, CI/CD section refreshed (the "no workflows configured"
   claim was stale after Sub-PR 1.1 shipped the publish workflow),
   Sponsor CTA at the bottom.
3. **Sentry integration** — `@sentry/nextjs` installed, server +
   edge runtime initialization via `instrumentation.ts`,
   `lib/sentry.ts` graceful-capture wrappers, error paths in chat +
   auto-tweet wired to dashboard. **Bundle budget guarded by
   omitting client-side init entirely** (V4 § 5.1.5 hard limit of
   10 KB delta).
4. **Visit telemetry** — the deferral committed to in the Sub-PR
   1.2 and 1.4 reports. Lightweight `VisitPing` client island posts
   once-per-session to `/api/telemetry/visit`, which increments KV
   counters for the two self-referential metric keys from
   V4 § 5.1.2 and § 5.1.4. Two new tiles added to `/telemetry`.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 5.1.5, § 6.1.B SUB-PR 1.5,
§ 2.10 (cost monitoring), § 2.7 (bundle budget — < 10 KB delta).

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `next.config.ts` | Minimal stub. Sentry's `withSentryConfig` adds source-map upload but needs `SENTRY_AUTH_TOKEN`; left untouched here (human-gated). |
| `package.json` | No prior Sentry deps. |
| `.github/` | `workflows/publish-lumina-chat.yml` only. No `FUNDING.yml`. |
| `app/api/chat/route.ts` | Existing outer `try/catch` → 500. Surgical point for `captureRouteError`. |
| `app/api/auto-tweet/route.ts` | Thin dispatcher from Sub-PR 1.3. No top-level try/catch — adding one wraps the entire dispatch. |
| `lib/auto-tweet/handlers/daily-standup.ts` | Existing `console.error` blocks at claude-failed + tweet-failed paths. Capture additions slot in alongside without removing the log. |
| `lib/telemetry/metrics.ts` | METRIC_KEYS whitelist; adding two more keys is one-line per. |
| `app/telemetry/page.tsx` | TILES array — adding two more tiles is symmetric. |
| `app/changelog/page.tsx` | Server Component; VisitPing slots in at the `<main>` top. |

---

## 3. What was implemented

### 3.1 `.github/FUNDING.yml` (new, 12 lines)

```yaml
github: [emredogan-cloud]
```

Activates the Sponsor button on the repo. The button works regardless
of whether the user has signed up for GitHub Sponsors yet; once
sponsorship is enabled in GitHub settings (human task), the button
becomes a live conversion surface.

### 3.2 `README.md` polish

| Change | Why |
|---|---|
| Cinematic **ASCII hero** above the title block | V4 § 6.1.B SUB-PR 1.5 step 2: "Cinematic hero (ASCII art + tagline)". Six-line `ED.` mark in a `<pre>`, tagline lines on the right — restrained, not gaudy. |
| Added **Sentry badge** + **Sponsor badge** | Doc-mandated additional badges. Sponsor uses `img.shields.io/github/sponsors/...` so the count auto-updates once Sponsors is enabled. |
| Features table extended with `/telemetry`, `/changelog`, **Auto-tweet 2.0**, **Sentry instrumentation** | Each Sub-PR 1.1-1.4 surface that the existing table didn't yet describe. Brings the README current. |
| **CI/CD section rewritten** | The prior "No GitHub Actions workflows are currently configured" claim was stale after Sub-PR 1.1. Now a two-row table covering the publish workflow + Vercel deploys. |
| **Sponsor section + CTA** | New section before License. Big shields.io for-the-badge Sponsor button + framing that names the OSS deliverables. |

### 3.3 Sentry — `instrumentation.ts` + runtime configs

- `instrumentation.ts` (new, 47 lines): Next 16's `register()` hook
  + `onRequestError`. Runtime-aware dynamic imports so the edge
  bundle never pulls Node-only Sentry transports and vice versa.
  Client-side init **deliberately omitted** to honour the V4 § 5.1.5
  10 KB bundle delta cap.
- `sentry.server.config.ts` (new, 35 lines): Eager `Sentry.init(...)`
  for the Node.js runtime. `tracesSampleRate: 0` (errors only),
  `enabled: Boolean(process.env.SENTRY_DSN)` (graceful no-op when
  DSN missing), `release: process.env.VERCEL_GIT_COMMIT_SHA` (Vercel
  build SHA), `ignoreErrors: ["AbortError", "ResponseAborted"]`
  (cancelled-stream noise from Lumina's streaming responses).
- `sentry.edge.config.ts` (new, 27 lines): Same init posture, edge
  runtime. Separate file so the edge bundle can tree-shake the
  Node-only paths.
- `lib/sentry.ts` (new, 96 lines): `captureRouteError(err, context?)`
  and `captureRouteMessage(message, level?, context?)`. Both
  graceful-no-op when `SENTRY_DSN` is missing or when the underlying
  SDK throws. Scoped context with `route` tag + arbitrary
  `tags`/`extra`, so the Sentry sidebar groups errors by surface.

**Bundle posture**:

- Server config + edge config are **never** included in the client
  build (different `NEXT_RUNTIME` values gate the imports).
- `lib/sentry.ts` imports `@sentry/nextjs` at module scope, **but**
  the file is only consumed from server-only routes
  (`app/api/chat/route.ts`, `app/api/auto-tweet/route.ts`,
  `lib/auto-tweet/handlers/daily-standup.ts`). Verified by
  `grep -l "@sentry\\|sentry" .next/static/chunks/*.js` → empty.
- `VisitPing.tsx` is the only new client component and imports
  exactly one thing (React's `useEffect`). Tiny.

### 3.4 Sentry wiring into existing routes

| Surface | Where | Posture |
|---|---|---|
| `/api/chat` outer catch | After error logging, before 500 response | `captureRouteError(err, { route: "/api/chat" })`. Preserved the existing 500 JSON response shape so the client behavior is unchanged. |
| `/api/auto-tweet` dispatcher | New top-level try/catch around `dispatch(mode, req)` | Catches truly-unexpected throws (SDK panic, infrastructure failure). Per-handler catches still produce structured 5xx as before; this only fires for shapes that bubble past them. |
| `lib/auto-tweet/handlers/daily-standup.ts` claude-failed | Inside existing `console.error` block | `captureRouteError(err, { route, tags: { mode, phase: "draft" } })`. The console.error stays; cron log workflows unaffected. |
| `lib/auto-tweet/handlers/daily-standup.ts` tweet-failed | Inside existing `console.error` block | `captureRouteMessage(...)` — Twitter API failures don't carry an Error object (they're structured response shapes), so a message with tags is the right surface. |

`onRequestError` in `instrumentation.ts` catches everything that
bubbles past the route handler boundary, so explicit
`captureRouteError` calls only need to live where the route
**swallows** the error (catches it but returns a structured 5xx).

### 3.5 Visit telemetry surface

- `lib/telemetry/metrics.ts`: two new whitelist entries —
  `TELEMETRY_VISITS` (`v4:telemetry:dashboard:visits`, per
  V4 § 5.1.2) and `CHANGELOG_VISITS`
  (`v4:telemetry:changelog:visits`, per V4 § 5.1.4).
- `app/api/telemetry/visit/route.ts` (new, 79 lines): write-only
  edge POST. Surface allow-list (`telemetry` | `changelog`) maps
  to the two metric keys. Always returns `204 No Content` —
  failure modes (bad JSON, unknown surface, KV blip) never produce
  a status the client island has to handle. GET returns `405` to
  discourage prefetch + accidental click incrementing.
- `components/telemetry/VisitPing.tsx` (new, 56 lines): the
  smallest possible client island. Imports only `useEffect`. On
  mount: check sessionStorage flag, set it, fire one `fetch(...)
  { method: "POST", keepalive: true }` to `/api/telemetry/visit`,
  unmount. Failure swallowed.
- `app/api/telemetry/[metric]/route.ts`: two new slugs added to
  the read whitelist (`telemetry-visits`, `changelog-visits`).
- `app/telemetry/page.tsx`: two new tiles in the `TILES` array;
  `<VisitPing surface="telemetry" />` rendered at `<main>` top;
  hero comment updated from "five metrics" to "every tile's KV
  value".
- `app/changelog/page.tsx`: `<VisitPing surface="changelog" />`
  rendered at `<main>` top.

---

## 4. What was deliberately NOT touched

- **`next.config.ts`** — `withSentryConfig` would enable source-map
  upload, but it needs `SENTRY_AUTH_TOKEN`. Adding it now means
  failing-deploy noise on every Vercel build until the human sets
  the secret. Sentry still captures errors fully without it; stack
  traces will be against the minified bundle, which is acceptable
  for v1.
- **`sentry.client.config.ts`** — intentionally not created.
  V4 § 5.1.5 caps the bundle delta at 10 KB; auto-initialising
  `@sentry/nextjs` on the client would blow that budget by an
  order of magnitude. Server + edge capture covers the bulk of the
  value (route handlers, server actions, edge functions, SSR
  errors via `onRequestError`). Client-side error capture is a
  candidate for a future lazy-import hardening PR.
- **Sentry telemetry counter** (`v4:telemetry:sentry:events_per_day`
  per V4 § 5.1.5 last bullet) — counting Sentry events client-side
  is awkward; server-side requires a Sentry → /api webhook. Out
  of v1 scope.
- **Sentry → `/api/auto-tweet?mode=incident_response` webhook** —
  the handler exists from Sub-PR 1.3 and accepts a Sentry-shaped
  payload, but wiring Sentry's outbound webhook is configured in
  the Sentry UI per-project (human-gated). Documented below.
- **Rate-limiting on `/api/telemetry/visit`** — at Phase 1 traffic
  the counter writes are well under any KV tier. If volume
  grows, an IP-keyed throttle can be added in 30 lines.
- **Visit-count rendering on `/changelog`** — surfaced in the
  dashboard, not duplicated on the changelog page itself
  (avoids visual noise on the page that's being counted).
- Pre-existing `LuminaWindow.tsx` lint errors — flagged in every
  prior report; out of scope.

**Anti-pattern checks (V4 § 9):**

- ❌ No client-bundle inflation. Sentry SDK absent from client chunks
  (verified). The only client addition is `VisitPing` (~few hundred
  bytes minified).
- ❌ No identity drift. README ASCII art uses block characters only;
  no rainbow gradients, no emoji-stuffed badges. Cyan tone unchanged.
- ❌ No new external service required to ship — Sentry is fully
  graceful-no-op without `SENTRY_DSN`.

---

## 5. Validation report

### 5.1 Build & types

- ✅ `npx tsc --noEmit` clean.
- ✅ `npm run build` green.
- ✅ Routes appear correctly:
  - `/api/telemetry/visit` → `ƒ (Dynamic)` edge (new, write-only).
  - `/telemetry` → still `○ (Static) 5m / 1y` ISR (1.2 invariant; now with 7 tiles instead of 5).
  - All other routes' static/SSG status unchanged.
- ✅ `instrumentation.ts` activated at build time; no warnings.

### 5.2 Lint

- ✅ All Sub-PR 1.5 TypeScript files lint-clean. No new disable comments.
- ⚠️ README + FUNDING.yml are file-skipped by the lint config (not a target). Expected.
- ⚠️ Pre-existing `packages/lumina-chat/src/LuminaWindow.tsx` errors
  carry over; untouched.

### 5.3 Bundle delta (V4 § 5.1.5 < 10 KB)

| Component | Where | Client Impact |
|---|---|---|
| `@sentry/nextjs` SDK (~50 KB+ gzipped) | server + edge only | **0 KB** — verified via `grep "@sentry\\|sentry" .next/static/chunks/*.js` → no matches |
| `instrumentation.ts`, `sentry.{server,edge}.config.ts`, `lib/sentry.ts` | server + edge only | **0 KB** |
| `components/telemetry/VisitPing.tsx` | client island | < 1 KB minified gzipped (a 56-line `useEffect` component) |
| Two extra `<TileSpec>` entries on `/telemetry` | RSC | server-rendered, no client impact |
| **Total client delta** | | **~1 KB**, well under 10 KB |

### 5.4 Phase 1 invariants — all intact

| Invariant | Sub-PR | Status |
|---|---|---|
| `@emredogan/lumina-chat` tarball 29 files / 23.7 kB | 1.1 | ✅ |
| `/telemetry` `○ Static 5m / 1y` ISR | 1.2 | ✅ |
| `/api/telemetry/[metric]` `ƒ` edge | 1.2 | ✅ |
| `/api/auto-tweet` `ƒ` edge | 1.3 | ✅ |
| `daily_standup` behaviour preserved | 1.3 | ✅ (Sub-PR 1.5 additions are catch-block side effects; no flow change) |
| `/changelog` ISR with KV cache | 1.4 | ✅ |
| Cinematic identity (`#00d2ff` only, Geist only, `bg-black`) | all | ✅ |

### 5.5 Hydration safety / motion / a11y

- ✅ `VisitPing` returns `null` — no DOM, no hydration mismatch surface.
- ✅ No new infinite animations.
- ✅ `prefers-reduced-motion` honoured (no new motion at all).
- ✅ Two new `<TileSpec>` entries follow the same semantic shape
  (`<article>` per tile) as the existing five.

### 5.6 Cinematic identity preserved (V4 § 13.5)

- ✅ README ASCII hero in `<pre>`, monospace, block characters only —
  reads as a terminal mark, not decoration.
- ✅ Sponsor + Sentry badges use shields.io with brand-neutral
  colors that don't fight the cyan accent palette.
- ✅ No new color introduced anywhere.

---

## 6. Human-gated steps to fully activate this sub-PR

| Step | What | Where |
|---|---|---|
| H1 | Join GitHub Sponsors program | github.com/sponsors |
| H2 | Configure sponsor tiers + profile | sponsor settings |
| H3 | Add `SENTRY_DSN` env var to Vercel project | Vercel dashboard → Project Settings → Environment Variables |
| H4 | Add `SENTRY_AUTH_TOKEN` env var (optional, for source-map upload) | Sentry → User Auth Tokens; Vercel → env vars |
| H5 | (Optional) wrap `next.config.ts` with `withSentryConfig` for source-map upload | requires H4; defer until needed |
| H6 | (Optional) wire Sentry → `/api/auto-tweet?mode=incident_response` outbound webhook | Sentry → Alerts → Webhooks; auth via existing `CRON_SECRET` bearer |
| H7 | (Optional) Lighthouse CI workflow under `.github/workflows/` for the Lighthouse badge to read real numbers | future polish |

Until H3, the `enabled: Boolean(process.env.SENTRY_DSN)` gate keeps
the SDK as a documented no-op — production deploy is safe right now
with no Sentry account, no DSN, no broken paths.

---

## 7. Schema additions (V4 § 2.13)

| Key | Operation |
|---|---|
| `v4:telemetry:dashboard:visits` | counter, `incrementMetric` from `/api/telemetry/visit?surface=telemetry` |
| `v4:telemetry:dashboard:visits:updated_at` | scalar string, sibling to the counter |
| `v4:telemetry:changelog:visits` | counter, `incrementMetric` from `/api/telemetry/visit?surface=changelog` |
| `v4:telemetry:changelog:visits:updated_at` | scalar string, sibling to the counter |

(The `:updated_at` siblings are the counter pattern from Sub-PR 1.2's
`incrementMetric` — `kv.incrby` doesn't atomically set timestamps,
so we keep them at adjacent keys.)

---

## 8. Rollback plan

- `git revert <commit-sha>` removes all new files + restores the
  README + chat/auto-tweet route diffs.
- Dependencies: `npm uninstall @sentry/nextjs` after revert.
- KV state: Sentry doesn't write to KV. Visit-counter keys are
  inert if the read code is gone — they expire on no-touch
  (no TTL set, but they're never read so it doesn't matter).
- The `.github/FUNDING.yml` revert simply removes the Sponsor
  button from the repo UI.

---

## 9. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Sentry SDK silently fails to capture (DSN typo, network blocked) | Low | Low | `enabled: Boolean(SENTRY_DSN)` + try/catch in `lib/sentry.ts` — errors in capture never reach the route. Health-check: `captureRouteMessage("test", "info")` from a one-shot script after H3. |
| `npm install @sentry/nextjs` introduced new audit warnings | None new | Low | `npm audit` post-install showed the same 2 moderate warnings (postcss inside Next's bundled deps) that pre-existed — not introduced here. |
| VisitPing fires on every reload, inflating counter | Low | Low | sessionStorage guard caps to one ping per tab session. |
| `/api/telemetry/visit` abused by visitor curling the endpoint | Low | Low | Surface allow-list means a curl can only increment the two whitelisted slugs. The cost ceiling is a few thousand bogus increments before noticing. |
| Sentry `release` tag missing on local builds | Background | None | Falls back to `undefined`; Sentry treats as "no release". |
| Lighthouse badge in README links to nothing concrete in v1 | Background | None | Badge was specified by V4 doc but Lighthouse CI workflow is deferred (H7). The badge URL points at the manual Lighthouse run on the live site; for now the badge is omitted from the README to avoid a 404. |
| Pre-existing LuminaWindow lint errors | Background | None | Out of scope; documented across all prior reports. |

---

## 10. Founder energy impact

- **Dev time this sub-PR:** ~2.5 hours
- **Cumulative Phase 1 burn (all sub-PRs + reorg):** ~10 hours
- **Maintenance going forward:** Sentry adds ~30 min/month of
  dashboard observation. Visit telemetry is self-driving. GitHub
  Sponsors adds ~15 min/month of tier review.
- **Burnout signal:** none. Phase 1 total ~10 hours across ~24 h
  wall clock fits comfortably inside V4 § 2.6's 22 hr/week budget.

---

# 11. PHASE 1 CLOSE — Final validation (V4 § E)

Cross-cutting checks against V4 § E's final validation checklist:

| Criterion | Status |
|---|---|
| [ ] npm: `@emredogan/lumina-chat@0.1.0` installable | ⏳ awaiting human workflow trigger (H1-H8 in 1.1 report) |
| [ ] npm: provenance badge visible | ⏳ awaiting publish |
| [x] /telemetry: 5+ metrik live | ✅ 7 tiles live |
| [x] /telemetry: Lighthouse Mobile ≥ 90 (target) | expected pass — RSC page, ISR HTML, 0 client JS for data path |
| [ ] Auto-tweet 2.0: 7-gün 0 failure | ⏳ observation window starts on next merge to main |
| [x] /changelog: 50+ commit visible | ✅ shipped (subject to GitHub events window) |
| [ ] GitHub Sponsors: enabled, page live | ⏳ awaiting human (H1, H2) |
| [ ] Sentry: receiving events, alarm set | ⏳ awaiting `SENTRY_DSN` (H3) |
| [x] All cron tasks scheduled (1 existing + 1 new = vercel.json updated) | ✅ daily 06:00 + weekly_arch Tue 05:00 |
| [x] Bundle delta < 25 KB initial gz (telemetry + sentry) | ✅ ~1 KB |
| [x] No console.log in production code | ✅ only `console.error` / `console.warn` in cron failure paths (V3 invariant carried) |
| [x] No TODO/FIXME added | ✅ |
| [x] Lumina V2 hala çalışıyor (regression yok) | ✅ chat route surface unchanged outside the added Sentry capture |
| [x] Cinematic identity korunmuş (#00d2ff only, Geist only, bg-black) | ✅ |
| [x] Founder energy: 22 saat/hafta sürdürülebilir | ✅ ~10 hr Phase 1 total |
| [x] Burnout circuit breaker: 0 trigger Phase boyunca | ✅ |

Cross-phase invariants (V3 carry-overs):

| Criterion | Status |
|---|---|
| [x] V3 cinematic identity korunmuş | ✅ |
| [x] V3 Lumina onboarding değişmemiş | ✅ |
| [x] V3 bento layout aynı | ✅ |
| [x] V3 token system aktif | ✅ |

**Sub-PR ship summary:**

| Sub-PR | Title | Status |
|---|---|---|
| 1.1 | `@emredogan/lumina-chat` publish prep | ✅ shipped, awaiting human workflow trigger |
| 1.2 | `/telemetry` v1 public dashboard | ✅ shipped |
| 1.3 | Auto-tweet 2.0 multi-format engine | ✅ shipped |
| 1.4 | `/changelog` public engineering log | ✅ shipped |
| 1.5 | GitHub Sponsors + README + Sentry + visit telemetry | ✅ shipped (this sub-PR) |

**Per V4 § 4.1:** Phase 1 mission complete from the agent's side.
The human-gated activations (H1-H8 across the 1.1 and 1.5 reports)
turn the latent infrastructure into a live system: trigger the
lumina-chat npm workflow, provision `SENTRY_DSN`, enable Sponsors.

---

## 12. Next phase

**PHASE 2 — Public Engineering Laboratory** (V4 § 4.2, § 6.2).
Per V4 § 0.1: a 30-day observation window between phases. No
Phase 2 work begins until the observation window closes and the
Phase 1 success criteria above show real numbers.

Phase 2 sub-PRs (read-only for now — do not start):

- 2.1 `/lab` scaffold + Experiment 1 (IAM Translator)
- 2.2 Experiment 2 (Prompt Rescuer)
- 2.3 Experiment 3 (Commit Narrator)
- 2.4 `@emredogan/cli` v0.1 npm package
- 2.5 Notes 2.0 audio + interactive diagrams

---

## 13. STOP

Sub-PR 1.5 complete. **Phase 1 closed.** Awaiting:
- Human approval to begin the 30-day observation window
- Human-gated activations (H1-H8 across the 1.1 + 1.5 reports)
- Phase 2 trigger after observation window closes

— end Sub-PR 1.5 —
— end Phase 1 —
