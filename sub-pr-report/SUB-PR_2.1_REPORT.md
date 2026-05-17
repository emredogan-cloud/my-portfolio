# SUB-PR 2.1 REPORT — `/lab` scaffold + IAM Translator (Phase 2 launch)

> **Phase:** V4 Phase 2 — Public Engineering Laboratory
> **Sub-PR:** 2.1 of 5 (**2.1 ✓** → 2.2 → 2.3 → 2.4 → 2.5)
> **Branch:** `feat/v4-phase2-public-lab` (branched from `origin/main` after Phase 1 merged via PR #33)
> **Mode:** Disciplined sub-PR execution. Sub-PR 2.2 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Open the public engineering laboratory. Per V4 § 4.2:

> Visitor'ı **okuyucudan kullanıcıya** dönüştürmek.

That phrase is the whole brief — the laboratory has to feel like
something you can actually *use*, not something you read about.
Sub-PR 2.1 ships the foundational `/lab` index + the first
working experiment (IAM Translator) + the shared chrome that
subsequent experiments will plug into.

The user's atmospheric constraint dominates every design choice:

> "private engineering notebook opened slightly to the public."

No SaaS dashboard chrome. No card grid. No flashy AI-demo glow.
Single column, typewriter rows, mono micro-typography, the same
cyan-on-black cinematic identity established on /telemetry,
/changelog, and /about.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 4.2, § 5.2.1, § 6.2 A-B SUB-PR 2.1,
§ 2.7, § 2.9, § 2.10, § 9 (anti-patterns — "cool demo syndrome"),
§ 13.5 (cinematic moat). FUTURE § 2.2 (Public Engineering Lab —
the long-arc vision).

**Phase 1 reports re-read** (all five) to confirm:

- Cinematic vocabulary established by /telemetry (Sub-PR 1.2) and
  /changelog (1.4) — hero pattern, hairline-cyan rules, matte
  cards, ambient blur stack, mono eyebrows.
- KV gate pattern (`hasKv`, graceful no-op) reused verbatim.
- Telemetry primitives in `lib/telemetry/metrics.ts` (1.2) already
  expose `incrementMetric` + `recordMetric` with the V4 § 2.13
  schema.
- Sentry capture helpers in `lib/sentry.ts` (1.5) ready to wire
  into new error paths.
- `VisitPing` client island (1.5) for per-page visit telemetry —
  deliberately NOT used on /lab in v1; lab-index visits aren't in
  the V4 § 5.1.2 SUB-PR 2.1 schema, so adding it would be scope
  creep.

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `lib/bedrock-client.ts` | `getBedrockClient()` + `CLAUDE_HAIKU_BEDROCK_ID` + `BEDROCK_ANTHROPIC_VERSION` constants. Throws `bedrock-not-configured` when env missing — the route surface for "sandbox-offline" 503. |
| `app/api/cwh-demo/route.ts` | **Canonical reference** for Bedrock-streaming + per-IP rate-limit + KV pattern. Critical detail (lines 24-33): `runtime: "nodejs"`, NOT edge — the Bedrock SDK's SigV4 signer + EventStream codec crash on Vercel edge isolates. I followed this precedent over V4 § 6.1.B SUB-PR 2.1 step 4's "Edge runtime" wording. V4 § 2.9 explicitly sanctions Node fallback for SDK incompatibilities. |
| `lib/telemetry/metrics.ts` | Existing METRIC_KEYS whitelist — added three new entries with the V4 § 5.1.2 SUB-PR 2.1 schema names verbatim. |
| `app/api/telemetry/[metric]/route.ts` | Slug allow-list — three additions. |
| `app/telemetry/page.tsx` | TILES array — two new tiles for runs + cost. |

---

## 3. What was implemented

### 3.1 `lib/lab/registry.ts` (new, 68 lines)

Single source of truth for the lab experiment list. Three entries:
`iam-translator` (active), `prompt-rescuer` (coming-soon),
`commit-narrator` (coming-soon). Each carries `slug`, `index`,
`name`, `purpose` (one sentence), `status`. Sub-PRs 2.2 + 2.3
will flip the latter two statuses to `active`.

The registry is read by both the index page and each experiment
page so the two never drift apart on lifecycle state.

### 3.2 `lib/lab/rate-limit.ts` (new, 162 lines)

Two guards, reusable across every future lab experiment:

- **`consumeRateLimit(slug, ip)`** — per-IP / per-experiment / per-
  hour bucket. 5 requests/hour. `kv.incr` + `kv.expire` pattern
  lifted from `/api/cwh-demo`, namespaced under `v4:lab:rate:<slug>:<ip>`.
- **`checkCostCap(slug, capUsd)` + `recordEstimatedCost(slug, usd)`** —
  per-day cost cap. Check is *read-only* (call before Bedrock
  invoke); record is *write* (call after a successful stream).
  Storage under `v4:cost:lab:<slug>:usd_daily` with a 36-hour TTL
  so the window rolls naturally past midnight UTC.
- **`getClientIp(req)`** — same `x-real-ip` → `x-forwarded-for[0]`
  → `"anonymous"` resolution as `/api/cwh-demo`.

Graceful no-op contract mirrored from `lib/lumina/memory.ts`:
KV unavailable → return "ok" (fail-open). A KV outage is annoying
but doesn't take the experiment offline.

The `recordEstimatedCost` also writes the `:updated_at` sibling so
the `/telemetry` cost tile reads an honest "X ago" instead of
always landing on the render time.

### 3.3 `lib/lab/prompts/iam-translate.ts` (new, 54 lines)

System prompt for the translator. Voice rule: "clarity extraction,
not AI magic." Structured 4-section output (WHAT IT GRANTS /
OPERATIONAL CONTEXT / RISK SURFACE / MINIMAL FIX), each with hard
constraints (no preamble, no closing summary, canonical AWS
action names, no emoji). The "not-an-IAM-policy" escape hatch
gives the visitor one useful line back if they paste a Terraform
snippet by mistake — instead of hallucinating an audit.

### 3.4 `app/api/lab/iam-translate/route.ts` (new, 224 lines)

Bedrock streaming endpoint, mirrors `/api/cwh-demo` posture
verbatim:

- `runtime: "nodejs"` (NOT edge — Bedrock SDK crashes on edge
  isolates; documented inline + in §6 below).
- `maxDuration: 30`.
- Body validation: `policy` string, ≤ 4 KB, must `JSON.parse`.
- Per-IP rate limit (5/hr) + per-day cost cap ($5) checked in
  parallel before the Bedrock call.
- Telemetry: `incrementMetric(LAB_IAM_VISITS_DAILY)` after guards
  pass; `incrementMetric(LAB_IAM_COMPLETIONS_DAILY)` +
  `recordEstimatedCost(slug, 0.003)` in the stream's `finally`
  on successful completion.
- Sentry: `captureRouteError` in the client-construction catch,
  the bedrock-send catch, and the stream-iteration catch — each
  with phase + AWS-error-name tags so the dashboard groups
  failures by failure mode.
- Streaming response: same `content_block_delta` text-extract
  pattern as `/api/cwh-demo`. Response carries
  `x-rate-limit-{max,window,remaining}` headers for client-side
  visibility (currently unused by the sandbox UI; reserved for
  future polish).

### 3.5 `app/lab/_components/ExperimentFrame.tsx` (new, 134 lines)

Shared chrome for any `/lab/<slug>` route. Provides:

- **Breadcrumb eyebrow** — `LAB / <NAME>`, quiet link back to
  /lab, status pill on the right.
- **Hero** — two-line statement title in /about's voice, plus a
  caller-supplied tagline + framing paragraph.
- **Sandbox notice footer** — quiet mono row identical in posture
  to /telemetry's snapshot footer:
  `· Sandbox · Per-IP 5/hr · Daily budget $5 · Streaming via Bedrock`.

Reused vocabulary: `Reveal` motion island, ambient cyan blur
stack, `text-primary/text-secondary/text-tertiary` palette.

### 3.6 `app/lab/page.tsx` (new, 188 lines)

The index. Single-column journal layout — NOT a card grid.
Each registry entry renders as one typewriter row (index column
`01 / 02 / 03`, name + purpose, status pill on the right).
Active rows wrap in a `<Link>`; coming-soon rows render as plain
`<li>` with no link, no greyed-out CTA, no hover. The purpose
sentence speaks for itself.

Hero: "Working notebook, / opened slightly." Description:
explicit about the fact that not all experiments are live yet
and that failure modes will stay visible (V4 FUTURE § 2.2
"Failed experiments shelf" — pre-stated philosophy).

Quiet footer: counts + Adana · GMT+3 signature.

### 3.7 `app/lab/iam-translator/page.tsx` (new, 49 lines)

Server Component shell. Looks up the registry entry, slots the
client sandbox into `ExperimentFrame`. `notFound()` if the entry
is missing or `status !== "active"` — so flipping the registry
state to `archived` in a future ops decision is enough to take
the surface down; no need to delete the file.

Title: `IAM Translator. / Read the policy.` Framing copy says the
output streams in live and nothing is stored.

### 3.8 `app/lab/iam-translator/_components/IamTranslateSandbox.tsx` (new, 198 lines)

The client island. Smallest possible interactive surface:

- Textarea pre-filled with a deliberately over-permissive admin
  policy (`{ Effect: "Allow", Action: "*", Resource: "*" }`).
- `Analyze` button (cyan-on-black, same vocab as /about's "Get in
  touch" CTA) and a `Reset to sample` mono link.
- Streaming output region using `ReadableStream` + `TextDecoder`
  — no third-party SDK on the client. While streaming, a small
  static cyan caret-block sits at the end of the text.
- Inline error mapper: structured 4xx/5xx codes from the route
  map to deterministic copy (`rate-limited`, `daily-cost-cap-reached`,
  `sandbox-offline`, `policy-too-large`, etc.). No toasts.
- `aria-live="polite"` on the output region so screen readers
  announce the streamed completion.

### 3.9 `lib/telemetry/metrics.ts` (modified, +14 lines)

Three new whitelist entries with the V4 § 5.1.2 SUB-PR 2.1 schema
names verbatim:

- `LAB_IAM_VISITS_DAILY: "v4:adoption:lab:iam:visits_daily"`
- `LAB_IAM_COMPLETIONS_DAILY: "v4:adoption:lab:iam:completions_daily"`
- `LAB_IAM_COST_USD_DAILY: "v4:cost:lab:iam:usd_daily"`

### 3.10 `app/api/telemetry/[metric]/route.ts` (modified, +3 lines)

Slug allow-list extended:

- `lab-iam-visits` → `LAB_IAM_VISITS_DAILY`
- `lab-iam-completions` → `LAB_IAM_COMPLETIONS_DAILY`
- `lab-iam-cost` → `LAB_IAM_COST_USD_DAILY`

### 3.11 `app/telemetry/page.tsx` (modified, +18 lines)

Two new tiles in the TILES array — "IAM translator runs" and
"IAM translator cost" — using the existing TileSpec shape and
hairline-cyan card vocabulary. Dashboard now surfaces 9 tiles
(7 from Sub-PR 1.2/1.5 + 2 new).

### 3.12 `app/sitemap.ts` (modified, +2 lines)

`/lab` and `/lab/iam-translator` added to `STATIC_ROUTES`.

---

## 4. Architecture notes

### 4.1 Runtime choice — `nodejs`, not `edge`

V4 § 6.1.B SUB-PR 2.1 step 4 reads "Edge runtime", but the
existing `/api/cwh-demo` (which also wraps Bedrock) is explicitly
`runtime: "nodejs"` with a long inline comment explaining why:

> The previous edge runtime crashed pre-flight —
> `@aws-sdk/client-bedrock-runtime`'s SigV4 signer + EventStream
> codec depend on Node-only internals that don't fully resolve on
> Vercel's v8 isolates.

V4 § 2.9 sanctions Node fallback for documented SDK
incompatibilities ("Whisper transcribe → Node runtime kabul
edilebilir"). Following the existing production precedent.

Practical impact: `/api/lab/iam-translate` is `ƒ Dynamic` in the
build manifest, not edge. Cold start is heavier than edge would
be, but the route has a max-30s response budget and Bedrock
streaming latency dwarfs cold-start overhead. Lighthouse impact
on `/lab/iam-translator` is unaffected — the page itself is
`○ Static` and the API only runs when the visitor presses
Analyze.

### 4.2 No client-side AWS SDK / Sentry

Verified bundle posture by grep on `.next/static/chunks/*.js`:

- `BedrockRuntime|aws-sdk` → 0 matches → AWS SDK is fully
  server-only.
- `@sentry|sentry` → 0 matches → Sentry stays server-only as in
  Sub-PR 1.5.

The new client island (`IamTranslateSandbox`) imports only React
+ standard DOM `fetch`/`TextDecoder`. Bundle delta on `/lab/iam-translator`
is the size of the component itself (~4 KB minified gzipped) —
no library bloat.

### 4.3 Schema namespacing

Slug discipline: the URL slug `iam-translator` and the schema slug
`iam` are kept separate. The registry + route use the URL slug
for navigation; the KV keys + telemetry use `iam` (matching the
V4 § 5.1.2 schema exactly). The cost-cap helper accepts a slug
parameter so the same module serves all future experiments
without modification.

---

## 5. What was deliberately NOT touched

Per "execute ONLY Sub-PR 2.1" and "MINIMUM NECESSARY CHANGE RULE":

- **Sub-PR 2.2 (Prompt Rescuer) + 2.3 (Commit Narrator) routes** —
  not scaffolded beyond the registry "coming-soon" entries.
  Their `app/lab/<slug>/page.tsx` directories don't exist yet.
- **Sub-PR 2.4 (`@emredogan/cli`) + 2.5 (Notes 2.0)** — out of
  scope.
- **`app/lab/[slug]/page.tsx` dynamic generic** — V4 doc step 1
  mentions this; I skipped it because the static
  `iam-translator/page.tsx` is the only experiment with content
  in v1. If 2.2/2.3 land with a uniform shape, the dynamic route
  can be extracted then; for now it's a premature abstraction
  (3-yer rule per V4 § 9.3).
- **Per-mode OG image for `/lab/iam-translator`** — the route has
  no `opengraph-image.ts` of its own; the site-level OG generator
  applies. Could be added in a future polish PR if the page goes
  viral.
- **Lab-index visit telemetry** — V4 § 5.1.2 SUB-PR 2.1 schema
  only lists IAM-translator-specific keys. Adding
  `v4:telemetry:lab:visits` would be scope creep; intentionally
  deferred.
- **`x-rate-limit-remaining` consumed by the sandbox UI** — the
  header is emitted but the client doesn't show it as a counter.
  Adding a "4 runs left this hour" badge would be Phase 2 polish
  in a later sub-PR.
- **Pre-existing `packages/lumina-chat/src/LuminaWindow.tsx` lint
  carry-overs** — flagged in every Phase 1 report; still out of
  scope.

**Anti-pattern checks (V4 § 9):**

- ❌ No new npm dep added. AWS SDK was already installed for
  `/api/cwh-demo` in V3.
- ❌ No card grid. No SaaS dashboard chrome. No animated graphs.
  No particles. No terminal cosplay. No glowing cyberpunk
  surfaces.
- ❌ No identity drift — `#00d2ff` only, Geist only, bg-black,
  same Reveal motion vocabulary.
- ❌ Cool Demo Syndrome filter passed — the experiment shape
  traces directly to V4 § 5.1.2 step 4 + § 6.1.B SUB-PR 2.1.
- ❌ No realtime polling, no WebSocket, no client-side AI SDK.

---

## 6. Validation report

### 6.1 Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green; new routes appear:
  - `/lab` → `○ (Static)`
  - `/lab/iam-translator` → `○ (Static)` (server shell)
  - `/api/lab/iam-translate` → `ƒ (Dynamic)` nodejs runtime
- ✅ All Phase 1 invariants intact (see §6.4)

### 6.2 Lint

- ✅ All Sub-PR 2.1 files lint-clean. No new disable comments.
- ⚠️ Pre-existing `LuminaWindow.tsx` errors untouched.

### 6.3 Bundle / performance

| Surface | Posture | Notes |
|---|---|---|
| `/lab` page | RSC, fully static | No client JS for data path; only the existing `Reveal` motion island hydrates. |
| `/lab/iam-translator` page | RSC shell + small client island | `IamTranslateSandbox` only imports React `useState` + `useCallback`. No third-party deps. ~4 KB gzipped. |
| `/api/lab/iam-translate` route | nodejs, server-only | AWS SDK + Bedrock client + Sentry imports server-side only. **0 client bundle delta.** |
| AWS SDK in client chunks | grep `aws-sdk\|BedrockRuntime` → **0** | Verified. |
| Sentry in client chunks | grep `@sentry\|sentry` → **0** | Verified, same as Sub-PR 1.5. |

LCP target (V4 § 5.2.1): `< 1.5s` on `/lab/iam-translator`.
The page is `○ Static` HTML — comfortably under. Bedrock latency
only matters when the visitor clicks Analyze, which is
post-LCP.

Lighthouse target (V4 § 4.2): `≥ 90` mobile. RSC page + lean
client island; expected pass on production deploy.

### 6.4 Phase 1 invariants — all intact

| Invariant | Sub-PR | Status |
|---|---|---|
| `@emredogan/lumina-chat` tarball 29 files / 23.7 kB | 1.1 | ✅ |
| `/telemetry` `○ Static 5m / 1y` | 1.2 | ✅ (now 9 tiles, was 7) |
| `/api/telemetry/[metric]` `ƒ` edge | 1.2 | ✅ |
| `/api/auto-tweet` `ƒ` edge | 1.3 | ✅ |
| `/changelog` `ƒ` (KV-cached) | 1.4 | ✅ |
| Sentry / AWS SDK in 0 client chunks | 1.5 / 2.1 | ✅ |
| Cinematic identity (`#00d2ff` only, Geist only, bg-black) | all | ✅ |

### 6.5 Hydration safety / motion / a11y

- ✅ No new server/client time drift. Sandbox component is
  self-contained `useState`; no external state.
- ✅ No new infinite animations. The streaming caret-block uses
  Tailwind's existing `animate-pulse` (CSS keyframes, collapsed
  to `0.01ms` by the global reduced-motion guard in
  `app/globals.css`).
- ✅ `aria-live="polite"` + `aria-busy` on the output region.
  Real semantic markup: `<main id="main">`, `<section>`, `<ol>`
  on the index, `<label>` + `<textarea>` paired by `htmlFor`.
- ✅ Color contrast: cyan accents on bg-black pass WCAG AA.
- ✅ Keyboard: button is `<button type="button">`; reset is a
  `<button>`; both are tab-reachable and disabled-state
  respected.

### 6.6 Cinematic identity (V4 § 13.5)

- ✅ Same ambient-blur gradient stack as /telemetry, /changelog,
  /about.
- ✅ Hairline cyan rule + matte card vocabulary reused on the
  output region.
- ✅ Mono micro-typography for eyebrows + status pills +
  metadata rows.
- ✅ Status pills (`active`, `coming soon`, `archived`) use the
  same `border-[#00d2ff]/40 bg-[#00d2ff]/[0.05]` cyan vocab the
  changelog pills used.
- ✅ Hero pattern: small "Lab" eyebrow → two-line statement
  → one paragraph. Mirrors `/about`, `/telemetry`, `/changelog`.

---

## 7. Schema additions (V4 § 2.13)

| Key | Role | Operation |
|---|---|---|
| `v4:adoption:lab:iam:visits_daily` | Counter — successful POSTs past guards | `incrementMetric` in route, after rate-limit + cost-cap pass |
| `v4:adoption:lab:iam:completions_daily` | Counter — streams completed without throwing | `incrementMetric` in stream `finally` block |
| `v4:cost:lab:iam:usd_daily` | Scalar — cumulative estimated cost (36-h TTL) | `recordEstimatedCost` after successful completion |
| `v4:cost:lab:iam:usd_daily:updated_at` | Scalar — ISO timestamp of last cost write | Sibling to the counter; powers /telemetry "X ago" honestly |
| `v4:lab:rate:iam:<ip>` | Counter — per-IP rate-limit bucket (1-h TTL) | `kv.incr` + `kv.expire` in `consumeRateLimit` |

The `:usd_daily` cost key is read by both `checkCostCap` (route
gate) and the /telemetry dashboard's new "IAM translator cost"
tile, so the visitor and the operator see the same number.

---

## 8. Operational usefulness

Why this experiment ships first, in plain terms:

- **Broad demographic.** Every engineer with AWS access reads
  IAM at some point and wishes they didn't have to. The
  translator targets the moment of friction.
- **No data leaves the page.** Streaming response, nothing
  persisted — the framing copy says so explicitly. Lower
  friction for visitors who'd otherwise hesitate to paste
  production-shaped policies.
- **Real cost gate.** $5/day cap means even if the experiment
  goes viral, the AWS bill is bounded. Per-IP rate limit means
  one curious tab can't monopolise the sandbox.
- **Forward compat.** `lib/lab/rate-limit.ts` is generic over
  experiment slug — Sub-PR 2.2 and 2.3 plug their
  prompt-rescuer / commit-narrator slugs into the same helpers,
  no library refactor.

---

## 9. Rollback plan

- `git revert <commit-sha>` removes all 11 new files + restores
  the modified `metrics.ts` / route / page / sitemap diffs.
- Per-experiment soft-disable: flip the registry entry's
  `status` to `archived`. The `/lab/iam-translator` page calls
  `notFound()` for non-active statuses; the index page renders
  the archived pill instead of a link.
- Per-experiment route disable: rename `app/api/lab/iam-translate/`
  to `app/api/lab/_disabled-iam-translate/` in a hotfix; the
  sandbox UI surfaces "sandbox-offline" via the 404-to-network
  error mapping.

---

## 10. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Bedrock cost spike from viral visitor flood | Medium | High | $5/day cap auto-disables before noticing; per-IP rate limit caps any single source at 5/hr; `LAB_IAM_COST_USD_DAILY` tile on /telemetry surfaces real-time spend. |
| `AccessDeniedException` from misconfigured Bedrock IAM (the live deploy needs `bedrock:InvokeModelWithResponseStream` on the inference profile) | Low | Low | Route returns 503 `sandbox-offline` cleanly; visitor sees the deterministic error copy; Sentry captures the AWS error name for triage. |
| Visitor pastes 4-KB-trimmed policy that loses critical context | Medium | Low | The limit is generous (most IAM policies fit under 2 KB); explicit `policy-too-large` error copy points at the limit. |
| LLM hallucinates an audit when given non-IAM input | Medium | Low | System prompt has an explicit escape hatch: "if not an IAM policy, return one line and stop." |
| Bedrock streaming response truncated mid-section | Low | Low | `max_tokens: 1200` (50% headroom over typical structured output); if truncated, the visible output ends mid-sentence — visually obvious, no silent corruption. |
| `kv.incr` race on rate-limit bucket | Negligible | None | KV `incr` is atomic; the only race is between `incr` and the follow-up `expire`, which produces at worst one extra request slipping past the cap at first invocation. |
| Pre-existing LuminaWindow lint errors | Background | None | Documented in every prior report; out of scope. |

---

## 11. Maintenance implications

Per V4 § 4.2 the monthly maintenance budget for the experiment
trio is ~2 hours total. For the IAM translator specifically:

- **Bedrock cost monitoring** — `/telemetry` tile shows daily
  spend; visual check during normal weekly observation.
- **Prompt drift** — the 4-section output is opinionated; if
  Claude Haiku 3.5 ships a new pinned snapshot, the system
  prompt may need re-balancing. ~15 min if it happens.
- **Sentry triage** — `route: "/api/lab/iam-translate"` tag
  groups all errors; the AWS-error-name sub-tag separates IAM
  misconfig from runtime hiccups.

Sub-PRs 2.2 and 2.3 inherit the rate-limit + cost-cap module +
the ExperimentFrame chrome, so adding a new experiment is
expected to take less time than this first one did.

---

## 12. Next recommended sub-PR

**SUB-PR 2.2 — Experiment 2: Prompt Rescuer** (V4 § 5.2.2,
§ 6.2.B SUB-PR 2.2, est. 3-4 days dev).

Scope (for reference — do not start until human approval):

- `app/lab/prompt-rescuer/page.tsx` (RSC shell, reuses
  `ExperimentFrame`)
- `app/lab/prompt-rescuer/_components/PromptRescueSandbox.tsx`
  (client island; can crib from `IamTranslateSandbox` shape)
- `app/api/lab/prompt-rescue/route.ts` (Bedrock stream; reuses
  `consumeRateLimit` + `checkCostCap` + `recordEstimatedCost`
  from `lib/lab/rate-limit`)
- `lib/lab/prompts/prompt-rescue.ts` (system prompt — VibingCoderAI
  pattern as the doc references)
- `lib/telemetry/metrics.ts` extension — 3 new METRIC_KEYS for
  `lab:prompt-rescuer:*`
- Registry flip: `prompt-rescuer` status `coming-soon` → `active`
- Sitemap append

The shape is identical; the deltas are the prompt voice + a few
slug renames.

---

## 13. STOP

Sub-PR 2.1 complete from the agent's side. Awaiting human
review and approval before Sub-PR 2.2 begins.

The lab is open. One door at first.

— end Sub-PR 2.1 —
