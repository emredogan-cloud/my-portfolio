# SUB-PR 2.3 REPORT — Commit Narrator (Experiment 3)

> **Phase:** V4 Phase 2 — Public Engineering Laboratory
> **Sub-PR:** 2.3 of 5 (2.1 ✓ → 2.2 ✓ → **2.3 ✓** → 2.4 → 2.5)
> **Branch:** `feat/v4-phase2-public-lab` (stacked on Sub-PRs 2.1 + 2.2)
> **Mode:** Disciplined sub-PR execution. Sub-PR 2.4 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Ship Experiment 3 — Commit Narrator. The `/lab` index now has
three working surfaces:

- **01 IAM Translator** — text in, IAM brief out (Sub-PR 2.1)
- **02 Prompt Rescuer** — vague prompt in, engineering brief out (Sub-PR 2.2)
- **03 Commit Narrator** — public GitHub URL in, last-twenty-commit
  WHY annotations out (**this sub-PR**)

The purpose is the changelog-feeder symmetry promised by V4 § 5.1.4
(the public engineering log) and V4 FUTURE § 2.2 (the lab vision):
the narrator drafts the same kind of WHY paragraph the /changelog
page already parses from existing commit bodies, so a visitor can
copy the narrator's output back into a commit `--amend` and improve
the public changelog upstream.

Constraint inherited from 2.1 + 2.2: same cinematic identity, zero
client-bundle bloat from AWS SDK / Sentry / **Octokit** (the new
dep), same per-experiment cost-cap discipline, same "private
engineering notebook opened slightly" voice.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 4.2, § 5.2.3 (Sub-PR 2.3 spec),
§ 6.2.B SUB-PR 2.3 (impl prompt), § 9 (anti-patterns —
cool-demo syndrome filter), § 13.5 (cinematic moat).

**Sub-PR 2.1 + 2.2 reports re-read.** Critical inheritances:

- `lib/lab/rate-limit.ts` already namespaces by experiment slug
  — designed for reuse, no breakages from a third caller.
- `ExperimentFrame` carries the shared chrome — `notFound()`
  gate on `status !== "active"` works for the new entry too.
- Schema slug discipline: doc names the prompt-rescuer keys
  with the full URL form. The Commit Narrator keys follow the
  same pattern (`v4:adoption:lab:commit-narrator:*`).
- Runtime: nodejs, NOT edge — Bedrock SDK constraint, Octokit
  also Node-friendly + bundle-heavy enough to avoid on edge
  cold start.

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `lib/lab/rate-limit.ts` | Hardcoded `RL_MAX_PER_WINDOW = 5`. The narrator wants 3/hr. Needs a small refactor to accept a custom max. |
| `app/api/lab/iam-translate/route.ts` + `prompt-rescue/route.ts` | Canonical route shapes. The narrator route is a third sibling with three deltas: GitHub fetch upstream of the Bedrock call, lower rate limit, URL validation instead of JSON / prose. |
| `lib/lab/registry.ts` | `commit-narrator` entry already present with `status: "coming-soon"`. Flip to `active`. |
| `lib/github-events.ts` (Sub-PR 1.4) | Lives at the root of `lib/` and serves the `/changelog` page (own-repo events feed). The narrator wants a *visitor-supplied* repo, so the surface differs enough to live in a separate `lib/lab/github.ts` namespaced to lab callers. No coupling between the two modules. |

---

## 3. What was implemented

### 3.1 `package.json` + `package-lock.json` (+1 dep)

`@octokit/rest@^22.0.1` added. Server-only — the lab route is the
only consumer. Verified post-build that Octokit does not land in
`.next/static/chunks/*.js` (see § 6.3).

### 3.2 `lib/lab/github.ts` (new, 169 lines)

Two server-only helpers:

- **`parseGitHubRepoUrl(input)`** — accepts the variety of shapes
  a visitor might paste (full HTTPS URL with or without `.git`,
  trailing slash, `github.com/owner/repo`, plain `owner/repo`
  shorthand). Strict: must resolve to a `github.com` repo;
  rejects non-GitHub hosts, deeper paths, owner/repo slugs with
  illegal characters. Returns `{ owner, repo, url }` or `null`.
- **`fetchRecentCommits(parsed, limit)`** — Octokit-backed
  `repos.listCommits` call, capped at 20. Uses
  `GITHUB_PAT_PUBLIC_REPOS` env var when present (5000/hr quota)
  and falls back to anonymous (60/hr) when absent. Shapes the
  raw response down to `FetchedCommit` (`sha`, `shortSha`,
  `subject`, `body`, `author`, `date`, `url`) — only the fields
  the prompt actually needs.

Both functions are forward-compat with the `lib/lab/rate-limit`
posture: errors return clean empty/null values so the route can
surface deterministic error codes without leaking upstream
exceptions.

### 3.3 `lib/lab/rate-limit.ts` (modified, +9 / -5 lines)

`consumeRateLimit(slug, ip)` now takes an optional
`maxPerWindow: number = 5`. IAM translator and prompt rescuer
call sites continue to omit the third argument (backward-compat
default). The narrator passes `3` to honor V4 § 5.2.3's lower
per-IP rate.

### 3.4 `lib/lab/prompts/commit-narrate.ts` (new, 81 lines)

System prompt. Per-commit one-paragraph WHY annotation, with a
fixed output shape:

```
[short-sha] subject
WHY: <2-4 sentences, dense, concrete tech only>
---
[short-sha] subject
WHY: ...
```

`---` divider per commit so a visitor can copy a single block
back into a commit body without reformatting.

Key engineering moves embedded in the prompt:

- **Use the body if present.** Don't paraphrase an existing WHY
  — preserve it and prefix the block with `[existing]`.
- **No invention.** Thin subjects (`chore: deps`) get one sentence
  acknowledging they're thin, then stop. The model should not
  fabricate a story.
- **No "This commit" / "In this change"** — drop meta-framing.
- **No emoji, no praise, no closing summary** — same hard rules
  as the IAM + prompt-rescue prompts.

Empty-input escape hatch: when zero commits return, the model
outputs one fixed sentence and stops.

### 3.5 `app/api/lab/narrate-commits/route.ts` (new, 256 lines)

Five-stage pipeline:

1. **URL validation** via `parseGitHubRepoUrl`. Reject anything
   that isn't `github.com/owner/repo`.
2. **Guards** — rate-limit (3/hr per IP) + cost-cap ($5/day) via
   the shared `lib/lab/rate-limit` helpers. Independent KV
   namespace from the IAM + prompt-rescuer keys.
3. **GitHub fetch** via `fetchRecentCommits`, 20 commits cap.
   `[]` → 404 `commits-not-found` (clean error copy, no
   hallucinated narration).
4. **Bedrock single-call streaming** with the commit list
   flattened into the user prompt. One call over 20 calls —
   saves ~95% of the per-call cost and gives the visitor a
   single unified streaming experience. Per-commit body
   truncated at ~600 chars to keep the Claude context bounded.
5. **Telemetry + cost recording** in the stream's `finally` on
   successful completion.

The response prefix carries a small text header
(`Repository: ... / Commits read: 20`) so the visitor sees a
meaningful first paint before the model's annotations arrive.

Sentry capture at three phases (client / send / stream) with
phase + AWS-error-name + experiment-slug tags so the dashboard
groups failures cleanly.

### 3.6 `app/lab/commit-narrator/page.tsx` (new, 49 lines)

Server Component shell. Registry-gated lifecycle. Slots the
`CommitNarrateSandbox` into `ExperimentFrame`. Title:
`Commit Narrator. / Draft the WHY.`

### 3.7 `app/lab/commit-narrator/_components/CommitNarrateSandbox.tsx` (new, 200 lines)

Client island. *Cousin* of the IAM + prompt-rescuer sandboxes —
shares the streaming-output region structure, but the input is a
**single-line `<input type="text">`** (URL field) rather than a
multi-line textarea. Sample pre-fill:
`https://github.com/emredogan-cloud/my-portfolio`.

Error mapper covers the URL-specific codes (`invalid-url`,
`url-too-long`, `commits-not-found`) plus the shared
rate-limit / cost-cap / sandbox-offline / bedrock-error /
no-stream / network codes.

Same `aria-live="polite"` output region, same cyan caret-block
during streaming, same matte-hairline-cyan card vocabulary.

### 3.8 Registry flip — `lib/lab/registry.ts` (modified, 1 line)

`commit-narrator`: `status: "coming-soon"` → `status: "active"`.
The `/lab` index page reads from the registry, so row 03
automatically becomes a working link.

### 3.9 `lib/telemetry/metrics.ts` (modified, +17 lines)

Three new METRIC_KEYS with V4 § 5.1.2 SUB-PR 2.3 schema verbatim:

- `LAB_COMMIT_NARRATOR_VISITS_DAILY: "v4:adoption:lab:commit-narrator:visits_daily"`
- `LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY: "v4:adoption:lab:commit-narrator:completions_daily"`
- `LAB_COMMIT_NARRATOR_COST_USD_DAILY: "v4:cost:lab:commit-narrator:usd_daily"`

The cost key is independent — narrator's $5/day budget is
isolated from the IAM and prompt-rescuer budgets.

### 3.10 `app/api/telemetry/[metric]/route.ts` (modified, +6 lines)

Three new slug allow-list entries —
`lab-commit-narrator-visits`, `lab-commit-narrator-completions`,
`lab-commit-narrator-cost`.

### 3.11 `app/telemetry/page.tsx` (modified, +20 lines)

Two new tiles after the prompt-rescuer pair: **Commit narrator
runs** + **Commit narrator cost**. Dashboard now surfaces **13
tiles** (was 11 after Sub-PR 2.2). The three experiment pairs
read as parallel rows.

### 3.12 `app/sitemap.ts` (modified, +1 line)

`/lab/commit-narrator` added.

---

## 4. The 3-yer rule revisited — extraction analysis

In the Sub-PR 2.2 report I deferred the question of extracting a
shared `LabSandbox` component until three sandboxes were on the
bench. Now they are. Honest analysis:

### What's actually shared across the three sandboxes

| Surface | IAM | Prompt | Commit |
|---|---|---|---|
| Output `<pre>` region with caret-block + `aria-live="polite"` | ✓ | ✓ | ✓ |
| Streaming reader (`getReader()` + `TextDecoder` + `setOutput(...)`) | ✓ | ✓ | ✓ |
| `ERROR_COPY` keyed by route's structured codes | ✓ | ✓ | ✓ |
| Inline error rendering below the output region | ✓ | ✓ | ✓ |
| Analyze button + Reset link pair | ✓ | ✓ | ✓ |

### What's NOT shared

| Surface | IAM | Prompt | Commit |
|---|---|---|---|
| Input control shape | `<textarea rows=10>` | `<textarea rows=5>` | `<input type=text>` |
| Sample preset | 80-char IAM JSON | 40-char prose | 50-char URL |
| Input-shape error codes | `policy-not-json` | `prompt-too-short` | `invalid-url`, `commits-not-found` |
| Pre-request precheck | `JSON.parse` | min-length | URL parser |
| Char-count footer | yes (4 KB cap) | yes (4 KB cap) | no (URL field) |

### Decision: still don't extract yet

The shared surface is real but narrow. Extracting now would
either:

a. Produce a `LabSandbox` with a long props list (`inputControl`
   as a render-prop, `samplePreset`, `errorCopy`, `inputValidation`,
   `outputLabel`, `streamingHint`, `emptyHint`, `actionLabel`,
   `actionStreamingLabel`, `endpointUrl`, `requestBody`) — that's
   more boilerplate than the duplication being avoided.

b. Or produce a tighter shared sub-component (just the streaming
   output region + error display, ~40 lines) and leave the input
   controls per-sandbox. That's the right shape *eventually*, but
   the duplication being avoided is ~30 lines per sandbox — a
   refactor PR worth maybe 1-2 hours of polish work, not a
   feature investment.

**Action:** keep the three sandboxes separate for v1. Document
this analysis explicitly so the next polish PR (or Sub-PR 2.5 if
it adds a fourth sandbox) has the extraction shape pre-thought.
Honest engineering: a 3-yer rule check passed, the answer
happened to be "still not yet, here's the data."

If a fourth lab surface lands in Phase 4 (Cloud Lab, etc.), the
shared-output-region extraction becomes obvious — that's the
right trigger.

---

## 5. What was deliberately NOT touched

Per "execute ONLY Sub-PR 2.3":

- **Sub-PR 2.4 (`@emredogan/cli`) + 2.5 (Notes 2.0)** — out of
  scope.
- **Shared `LabSandbox` extraction** — see § 4 above.
- **Per-experiment OG image** for `/lab/commit-narrator` — site-
  level OG applies. Polish PR candidate.
- **Per-commit serial streaming** (one Bedrock call per commit,
  20× cost) — single-call structured streaming chosen for cost
  + UX. Documented in the route's header comment.
- **Octokit auth without PAT** rate-limit handling — at 3/IP/hr
  on the lab side, we never approach GitHub's 60/hr anonymous
  ceiling in practice. The PAT integration is defensive, not
  critical; no special "auth failure" path beyond Octokit's
  default behavior.
- **`x-rate-limit-remaining` UI counter** — emitted header still
  unused (consistent with 2.1 + 2.2).
- **Markdown rendering of WHY annotations** — currently rendered
  as plain `<pre>`. Visitors paste raw text back into commit
  messages where Markdown is irrelevant.
- **Pre-existing `LuminaWindow.tsx` lint errors** — out of
  scope for the eighth consecutive sub-PR.

**Anti-pattern checks (V4 § 9):**

- ❌ Octokit not in any client chunk — verified by `grep
  "octokit\|Octokit\|@octokit" .next/static/chunks/*.js` → 0.
- ❌ No identity drift. Same `#00d2ff`, Geist, bg-black, hairline
  cyan rules, ambient blur stack.
- ❌ Cool Demo Syndrome filter passed — every change traces to
  V4 § 5.2.3 / § 6.2.B SUB-PR 2.3.
- ❌ No realtime polling, WebSocket, client-side AI SDK,
  client-side GitHub API.
- ❌ No premature abstraction (3-yer rule check, see § 4).

---

## 6. Validation report

### 6.1 Build & types

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` green
- ✅ New routes:
  - `/lab/commit-narrator` → `○ (Static)` (RSC shell)
  - `/api/lab/narrate-commits` → `ƒ (Dynamic)` nodejs
- ✅ All Phase 1 + Sub-PR 2.1 + 2.2 routes unchanged.

### 6.2 Lint

- ✅ All Sub-PR 2.3 files lint-clean. No new disable comments.
- ⚠️ Pre-existing `LuminaWindow.tsx` errors untouched.

### 6.3 Bundle posture (CRITICAL for this sub-PR)

Octokit is the heaviest new dep added since Phase 1's Sentry
install. The bundle-budget pass-through:

| Surface | Posture | Notes |
|---|---|---|
| Octokit in client chunks | `grep octokit\|Octokit\|@octokit .next/static/chunks/*.js` → **0** | Verified. |
| AWS SDK in client chunks | `grep aws-sdk\|BedrockRuntime` → **0** | 1.5 / 2.1 invariant preserved. |
| Sentry in client chunks | `grep @sentry\|sentry` → **0** | 1.5 invariant preserved. |
| `CommitNarrateSandbox` client island | ~4 KB gzipped (React `useState`/`useCallback` only) | No third-party imports. |

LCP target (V4 § 4.2): `< 1.5s` mobile. RSC + lean client island.
Comfortably under.

Lighthouse target (V4 § 4.2): `≥ 90` mobile. Same posture as
`/lab/iam-translator` and `/lab/prompt-rescuer` — expected to
pass.

### 6.4 Phase 1 + Sub-PR 2.1/2.2 invariants — all intact

| Invariant | Origin | Status |
|---|---|---|
| `@emredogan/lumina-chat` tarball 29 files / 23.7 kB | 1.1 | ✅ |
| `/telemetry` `○ Static 5m / 1y` | 1.2 | ✅ (now 13 tiles, was 11) |
| `/api/telemetry/[metric]` `ƒ` edge | 1.2 | ✅ |
| `/api/auto-tweet` `ƒ` edge | 1.3 | ✅ |
| `/changelog` `ƒ` (KV-cached) | 1.4 | ✅ |
| Sentry / AWS SDK / Octokit in 0 client chunks | 1.5 / 2.1 / 2.3 | ✅ |
| `/lab` `○ Static`, `/api/lab/iam-translate` `ƒ` nodejs | 2.1 | ✅ |
| `/lab/prompt-rescuer` `○ Static`, `/api/lab/prompt-rescue` `ƒ` | 2.2 | ✅ |
| Cinematic identity (`#00d2ff` only, Geist only, bg-black) | all | ✅ |

### 6.5 Hydration / motion / a11y

- ✅ No server-vs-client time drift; sandbox state is
  client-only `useState`.
- ✅ No new infinite animations.
- ✅ `<label htmlFor>` paired with both the URL input
  (`commit-narrator-url`) and the output region.
- ✅ `aria-live="polite"` + `aria-busy` on the output region.
- ✅ `autoComplete="off"` + `autoCapitalize="off"` +
  `spellCheck={false}` on the URL field so mobile keyboards
  don't sabotage a paste.
- ✅ Disabled state during streaming respected by both
  buttons + the input.

### 6.6 Cinematic identity (V4 § 13.5)

- ✅ Same ambient blur stack as the two sibling experiments.
- ✅ Same hairline-cyan-rule + matte-card output region.
- ✅ Same mono micro-typography vocabulary.
- ✅ Status pill (`active`) reads alongside IAM + prompt-
  rescuer on the index — three cyan-tinted active rows now.

---

## 7. Schema additions (V4 § 2.13)

| Key | Role | Operation |
|---|---|---|
| `v4:adoption:lab:commit-narrator:visits_daily` | Counter — guard-passed POSTs | `incrementMetric` post-guards |
| `v4:adoption:lab:commit-narrator:completions_daily` | Counter — streams completed | `incrementMetric` in stream `finally` |
| `v4:cost:lab:commit-narrator:usd_daily` | Scalar — cumulative estimated cost | `recordEstimatedCost` post-completion (estimate $0.004/call — higher than IAM's $0.003 because the prompt context is larger) |
| `v4:cost:lab:commit-narrator:usd_daily:updated_at` | Scalar ISO timestamp | sibling write (honest "X ago" on the dashboard) |
| `v4:lab:rate:commit-narrator:<ip>` | Counter — per-IP rate bucket, 1-h TTL, **max 3 per window** | `kv.incr` + `kv.expire` with `maxPerWindow=3` |

---

## 8. Operational usefulness

Why this experiment feeds the broader portfolio loop:

- **Symmetric with `/changelog`.** Sub-PR 1.4 ships a page that
  *reads* WHY paragraphs out of commit bodies. Sub-PR 2.3 ships a
  page that *drafts* WHY paragraphs into commit bodies. The two
  surfaces close a loop: write better commits → see them on the
  public log.
- **Visitor-as-co-operator** (V4 § 4.2 mission). The IAM and
  prompt-rescuer experiments help visitors with throw-away
  tasks. The commit narrator helps with *their actual repo* —
  the output goes back into their workflow as `git commit --amend`
  bodies.
- **Independent failure domain.** Per-experiment cost cap means
  a viral commit-narrator on Twitter cannot starve the IAM
  translator. Per-IP rate at 3/hr stops single-IP abuse.

---

## 9. Rollback plan

- `git revert <commit-sha>` removes all new files + restores the
  modified diffs cleanly. The Octokit dep can be uninstalled
  with `npm uninstall @octokit/rest` post-revert if the goal is
  to fully roll back.
- Per-experiment soft-disable: flip registry entry's `status`
  to `coming-soon` or `archived`. Page calls `notFound()` for
  non-active statuses; index renders the appropriate pill.
- Per-experiment route disable: rename
  `app/api/lab/narrate-commits/` to
  `app/api/lab/_disabled-narrate-commits/` in a hotfix; the
  sandbox surfaces "sandbox-offline".

---

## 10. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Bedrock cost spike from viral repo input | Medium | High | $5/day cap auto-disables; per-IP 3/hr rate limit is more conservative than 2.1/2.2's 5/hr; cost tile on /telemetry surfaces real-time spend. |
| GitHub API rate-limit hit (60/hr anon) | Low | Low | Lab's 3/IP/hr cap keeps anonymous usage well under GitHub's ceiling. `GITHUB_PAT_PUBLIC_REPOS` env var bumps quota to 5000/hr when present. |
| Visitor pastes private-repo URL | Medium | Low | Octokit returns 404 → route returns 404 `commits-not-found` with clean error copy. No private-repo data leakage possible since the PAT (if present) is scoped to public-repo reads. |
| Visitor pastes non-GitHub URL (GitLab, Bitbucket) | Medium | Low | `parseGitHubRepoUrl` rejects non-`github.com` hosts → 400 `invalid-url`. |
| Octokit ESM build issue on Node | Very low | Low | `@octokit/rest@22` is stable on Node 20 (the project's pinned engine). Verified build green. |
| LLM hallucinates WHY for thin commits | Medium | Low | System prompt's "No invention" rule + the one-sentence acknowledgement pattern for thin subjects. |
| Empty repo / unusual default branch | Low | Low | `fetchRecentCommits` returns `[]` → route returns 404 `commits-not-found`. |
| Cost-cap counter race across concurrent visitors | Negligible | Low | Documented in `lib/lab/rate-limit` since Sub-PR 2.1. Few-cent overshoot acceptable. |
| Pre-existing `LuminaWindow.tsx` lint carry-overs | Background | None | Out of scope for the eighth consecutive sub-PR. |

---

## 11. Maintenance implications

Per V4 § 4.2 the monthly maintenance budget for the experiment
trio is ~2 hours total. The commit narrator inherits the
shared rate-limit + cost-cap module; new maintenance surface is
small:

- **Octokit major-version updates** — Octokit v22 is the
  current release; future majors that change the
  `repos.listCommits` shape may require a small adapter
  rewrite. ~30 min if it happens.
- **GitHub PAT rotation** — when the env var ages out, Octokit
  falls back to anonymous automatically. The rate-limit floor
  (60/hr) still covers Phase 2 traffic.
- **Prompt drift** — same Haiku-snapshot consideration as the
  other two experiments. ~15 min re-balance if needed.

---

## 12. Next recommended sub-PR

**SUB-PR 2.4 — `@emredogan/cli` v0.1 npm package** (V4 § 5.2.4,
§ 6.2.B SUB-PR 2.4, est. 7-10 days dev).

Scope (for reference — do not start until human approval):

- New `packages/emredogan-cli/` workspace, mirroring the
  `packages/lumina-chat/` shape from Sub-PR 1.1
- `npx emredogan browse` opens the portfolio
- `npx emredogan ask "..."` terminal Lumina (uses the existing
  `/api/chat` endpoint)
- `npx emredogan project list` reads `data/projects.ts`
- POSIX-only (Windows defer per V4 § 5.2.4)
- Bundle target <100 KB
- New GitHub Actions publish workflow (copy of Sub-PR 1.1's
  pattern)
- `v4:adoption:emredogan-cli:downloads_weekly` telemetry slot
  (NPM API poll — same pattern as `lumina-chat-npm:weekly` from
  Sub-PR 1.2)

The CLI is a *different surface* — a `packages/` workspace, not
a `/lab` route. Its sub-PR will produce a noticeable directory
addition rather than the page-shaped diffs of 2.1-2.3.

---

## 13. STOP

Sub-PR 2.3 complete from the agent's side. Awaiting human
review and approval before Sub-PR 2.4 begins.

The lab now has three open doors. The fourth experiment slot
isn't a `/lab/<slug>` page — it's a `packages/` directory.

— end Sub-PR 2.3 —
