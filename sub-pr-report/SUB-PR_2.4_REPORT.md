# SUB-PR 2.4 REPORT — `@emredogan/cli` v0.1 npm package

> **Phase:** V4 Phase 2 — Public Engineering Laboratory
> **Sub-PR:** 2.4 of 5 (2.1 ✓ → 2.2 ✓ → 2.3 ✓ → **2.4 ✓** → 2.5)
> **Branch:** `feat/v4-phase2-public-lab` (stacked on Sub-PRs 2.1 + 2.2 + 2.3)
> **Mode:** Disciplined sub-PR execution. Sub-PR 2.5 deliberately not started.
> **Date:** 2026-05-18

---

## 1. Mission

Ship a tiny terminal companion for `emredogan.com` as the V4
Phase 2 surface that lives *outside* the website. Four commands,
zero dependencies, POSIX-only. Mirrors the Sub-PR 1.1 publish
discipline for `@emredogan/lumina-chat` — sigstore provenance,
typed-version-confirmation gate workflow, separate-bag tarball.

The user-facing promise:

```bash
npx emredogan ask "How is /telemetry cached?"
```

…lands you a streaming Lumina reply in the terminal without
opening a browser. Same Claude Haiku 4.5 model + system prompt
as the chat widget on the live site.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 4.2 (Phase 2 architecture), § 5.2.4
(Sub-PR 2.4 spec), § 6.2.B SUB-PR 2.4 (impl prompt), § 9
(anti-patterns).

**Sub-PR 1.1 + 2.1-2.3 reports re-read.** Critical inheritances:

- `packages/lumina-chat/` shape is the canonical npm-package
  pattern for this repo. Mirror it: `bin`/`files`/`type: module`/
  `publishConfig.provenance: true`/MIT LICENSE/Keep-a-Changelog
  format/sigstore workflow.
- `lib/lab/rate-limit.ts` is already namespaced by slug + has
  a custom `maxPerWindow` parameter (Sub-PR 2.3 refactor) — the
  CLI's `/api/cli/ask` route can reuse it with the `cli-ask`
  slug, no library change needed.
- The website's `/api/chat` uses Anthropic direct via AI SDK 6;
  the CLI surface mirrors this rather than going through Bedrock
  so visitors who compare browser-Lumina with CLI-Lumina see the
  identical voice.

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `packages/lumina-chat/package.json` | Canonical shape. Five key fields to mirror: `name`, `bin` (CLI specific, absent on lumina-chat), `files`, `publishConfig.provenance`, `engines.node`. |
| `packages/lumina-chat/tsconfig.json` | Bundler resolution + per-file ESM emission. CLI doesn't need declarations (it's a binary, not a library), so `"declaration": false`. |
| `scripts/lumina-chat/copy-assets.mjs` | Post-tsc CSS copy script. Equivalent for CLI is a post-tsc shebang/chmod guard (different concern, same script pattern). |
| `.github/workflows/publish-lumina-chat.yml` | Typed-version-confirmation gate + sigstore. Cloned + slug-flipped. |
| `lib/lumina/system-prompt.ts` | `buildLuminaSystemPrompt()` is the canonical Lumina voice. CLI ask route reuses it as-is. |
| `lib/lab/rate-limit.ts` (Sub-PR 2.3 refactor) | `consumeRateLimit(slug, ip, maxPerWindow)` accepts custom max. CLI passes `10` (higher than `/lab` experiments — CLI usage is more bursty). |

---

## 3. What was implemented

### 3.1 `packages/emredogan-cli/` — new workspace

Eight files in the package:

- `package.json` — name `@emredogan/cli`, version `0.1.0`,
  `bin.emredogan = "./dist/cli.js"`, `type: module`, **zero
  runtime deps**, `engines.node >= 20`, `os: ["darwin", "linux"]`
  (npm blocks Windows install with a clear platform mismatch),
  `publishConfig.{ access, provenance }`.
- `tsconfig.json` — ES2022 target, Bundler resolution, no
  declarations (this is a binary, not a library).
- `LICENSE` — MIT (cloned from `packages/lumina-chat`).
- `CHANGELOG.md` — Keep-a-Changelog 1.1.0 format documenting
  the 0.1.0 surface.
- `README.md` — install + commands + flags + env + engineering
  posture. Cyan-tinted shields.io badges matching the
  `@emredogan/lumina-chat` README vocabulary.
- `.gitignore`.
- `src/api-base.ts` — `getApiBase()` resolver. Reads
  `EMREDOGAN_API_URL`, defaults to `https://emredogan.com`,
  trims trailing slashes.
- `src/cli.ts` — entry. Shebang on line 1 (TypeScript 5+
  preserves it; the post-build script defends against
  compiler regression). Hand-rolled argv parser. Help text
  + version flag + unknown-command path.
- `src/commands/browse.ts` — opens portfolio via `open`
  (macOS) or `xdg-open` (Linux). `child_process.spawn` with
  `detached: true` + `unref()` so the CLI returns immediately.
- `src/commands/ask.ts` — POSTs question to `/api/cli/ask`,
  drains the `ReadableStream` chunk-by-chunk to stdout.
  Deterministic exit codes (0 clean, 1 usage, 2 network, 3
  rate-limited, 4 cost-cap/offline, 5 unexpected upstream).
- `src/commands/project.ts` — fetches `/api/projects` JSON,
  prints a tight four-line block per project (title + status,
  blurb, live URL, GitHub URL).
- `src/commands/demo.ts` — slug validation + opener pattern
  shared with `browse`. Known slugs documented in help text
  but not gated — unknown slugs land on the `/lab` 404, which
  is honest behaviour.

### 3.2 `scripts/emredogan-cli/build.mjs` (new, 64 lines)

Post-tsc finalisation:

1. **Shebang assertion.** TypeScript 5+ preserves shebangs by
   default, but a stray `removeComments: true` would silently
   drop it. The script idempotently asserts `#!/usr/bin/env node`
   on `dist/cli.js`, prepending only when missing.
2. **`chmod 755`.** tsc emits 0644; npm's `bin` symlink
   requires executable. Script chmods the file post-emit.

### 3.3 Root `package.json` — convenience scripts

Two new scripts mirroring the existing `lumina-chat:*` pair:

```json
"emredogan-cli:build": "npm run build --workspace=@emredogan/cli",
"emredogan-cli:clean": "npm run clean --workspace=@emredogan/cli"
```

The publish workflow uses `npm run emredogan-cli:build` —
symmetric with the existing lumina-chat workflow.

### 3.4 `app/api/projects/route.ts` (new, 54 lines)

Edge runtime. Returns `{ projects: PublicProject[] }` where
each entry carries `id`, `title`, `blurb` (from
`shortDescription`), `status`, `liveUrl`, `githubUrl`.

Cache: `Cache-Control: s-maxage=3600, stale-while-revalidate=60`.
The projects manifest changes ~quarterly at most; aggressive
edge caching is fine.

Server-side projection only — we drop `detailedDescription`
(multi-paragraph), `techStack` array, `images` array because
the CLI surfaces a single stdout line per project.

### 3.5 `app/api/cli/ask/route.ts` (new, 153 lines)

Plain-text streaming chat for the CLI. Five-stage pipeline:

1. **Body validation** — `question` string, ≤ 2000 chars.
2. **Guards** — `consumeRateLimit("cli-ask", ip, 10)` +
   `checkCostCap("cli-ask", 5)`. Independent KV namespace from
   the `/lab` experiments.
3. **Model invocation** — `streamText` via `@ai-sdk/anthropic`,
   `buildLuminaSystemPrompt()` as the system, 800 max tokens.
   Same model + voice as the website chat.
4. **Stream projection** — iterate `result.textStream` (plain
   string deltas) and enqueue each as UTF-8 bytes. No
   UIMessage protocol — the CLI consumer drains the body
   verbatim.
5. **Telemetry + cost recording** in the `finally` on
   successful completion.

Runtime: `nodejs` to match `/api/chat`'s posture. Sentry capture
on stream-init + stream-iteration with `phase` tags.

### 3.6 `.github/workflows/publish-emredogan-cli.yml` (new, 124 lines)

Clone of `publish-lumina-chat.yml` with three path/name swaps:
`@emredogan/lumina-chat` → `@emredogan/cli`,
`packages/lumina-chat/package.json` → `packages/emredogan-cli/package.json`,
`npm run lumina-chat:build` → `npm run emredogan-cli:build`,
concurrency group renamed. Everything else identical:
typed-version confirmation gate, sigstore provenance,
`npm pack --dry-run` inspection step, summary echo.

### 3.7 `lib/telemetry/metrics.ts` (modified, +18 lines)

Four new `METRIC_KEYS`:

- `CLI_ASK_VISITS_DAILY: "v4:adoption:cli:ask:visits_daily"`
- `CLI_ASK_COMPLETIONS_DAILY: "v4:adoption:cli:ask:completions_daily"`
- `CLI_ASK_COST_USD_DAILY: "v4:cost:cli:ask:usd_daily"`
- `EMREDOGAN_CLI_NPM_WEEKLY: "v4:adoption:emredogan-cli:downloads_weekly"`
  (per V4 § 5.2.4 — populated by an external npm-API poll cron
  in a later sub-PR, same pattern as `LUMINA_CHAT_NPM_WEEKLY`
  from Sub-PR 1.2)

### 3.8 `app/api/telemetry/[metric]/route.ts` (modified, +4 lines)

Four new slug allow-list entries.

### 3.9 `app/telemetry/page.tsx` (modified, +30 lines)

Three new tiles after the commit-narrator pair:
**CLI ask runs**, **CLI ask cost**, **`@emredogan/cli` / week**.
Dashboard now surfaces **16 tiles** (was 13 after Sub-PR 2.3).

### 3.10 `README.md` (portfolio root) — Open source section update

Promoted from "one extracted open-source package" → "two
extracted open-source packages". New subsection
`@emredogan/cli` with four shields.io badges, install snippet,
and a cross-link to `packages/emredogan-cli/README.md`.

---

## 4. Architecture decisions

### 4.1 Zero runtime dependencies

The V4 § 5.2.4 cap is 100 KB bundle. Even commander (`~30 KB
gzipped`) or yargs (`~30-40 KB`) would alone consume a third of
that budget. Hand-rolled argv parsing across four commands fits
in ~50 lines.

The CLI uses three native Node primitives:

- `fetch` (Node 18+) — `ask` + `project list`.
- `child_process.spawn` — `browse` + `demo`.
- `process.argv` — argv parsing.

No `commander`, no `axios`, no `chalk`, no `ora`, no
`@ai-sdk/*`. Tarball lands at **7.6 kB / 21.2 kB unpacked**.

### 4.2 Streaming-as-plain-text endpoint

`/api/chat` (the website's chat) uses AI SDK 6's UIMessage
protocol — the chat widget on the live site speaks that
protocol via `@ai-sdk/react`. Bringing the same protocol to
the CLI would require either:

- The CLI imports `@ai-sdk/*` to parse → bundle bloat.
- Or hand-rolling a UIMessage protocol parser in the CLI →
  fragile and version-coupled.

Instead, `/api/cli/ask` ships its own server-side projection
of the model stream to plain text. The CLI consumer drains
the body byte-by-byte with `getReader()` + `TextDecoder`. No
protocol on the wire; the CLI is a 3.5 KB file.

The trade: two endpoints (`/api/chat` for the widget,
`/api/cli/ask` for the CLI) instead of one. The duplication
is small (different prompt shape, different rate-limit
strategy, same model + system prompt) and the bundle/
simplicity payoff is large.

### 4.3 Shebang preservation strategy

TypeScript 5+ preserves shebangs by default. The post-build
script in `scripts/emredogan-cli/build.mjs` is **defensive**,
not load-bearing — it re-asserts the shebang line idempotently
and chmods +x. If a future tsconfig change drops the shebang,
the script catches it before publish; if tsc still preserves
it, the script no-ops.

The script ran cleanly during local verification:

```
[emredogan-cli] shebang already present on dist/cli.js
[emredogan-cli] chmod 755 on dist/cli.js
```

### 4.4 POSIX-only / `os` field

V4 § 5.2.4 explicitly defers Windows to v0.2. We honour this at
two layers:

- **npm install gate** — `package.json` sets
  `"os": ["darwin", "linux"]`. Running `npm install` on Windows
  surfaces a clear platform mismatch ("@emredogan/cli isn't
  available for win32"). Better than a confusing runtime error
  inside the CLI.
- **Runtime check** — `browse.ts` and `demo.ts` check
  `process.platform`. If somehow Windows reaches that code
  (e.g. forced `--force` install), the CLI prints a clear
  message and exits with code 2 rather than throwing.

### 4.5 Independent budget — CLI ask separate from /lab

The CLI's `/api/cli/ask` route uses the same rate-limit module
as the /lab experiments but namespaces the slug as `cli-ask`.
Result: per-IP and per-day budgets are independent. A viral
`/lab/iam-translator` thread cannot starve `npx emredogan ask`
and vice versa. Same isolation discipline applied across
Phase 2.

Higher rate limit for CLI (10/hr vs lab's 3-5/hr) — terminal
usage is more bursty (engineer pastes a few questions in
quick succession), and per-call cost is lower
(`max_tokens: 800` vs lab's 1200-2400).

---

## 5. Validation report

### 5.1 Build & types

- ✅ `npx tsc --noEmit` clean (portfolio app).
- ✅ `npm run emredogan-cli:build` clean — TypeScript compile
  + post-build shebang/chmod script both ran without errors.
- ✅ `npm run build` (full repo) green. New routes appear:
  - `/api/cli/ask` → `ƒ (Dynamic)` nodejs.
  - `/api/projects` → `ƒ (Dynamic)` edge.
- ✅ All Phase 1 + 2.1-2.3 routes unchanged.

### 5.2 Lint

- ✅ All Sub-PR 2.4 TypeScript files lint-clean (both portfolio
  and package source). No new disable comments.
- ⚠️ Pre-existing `LuminaWindow.tsx` errors untouched.

### 5.3 Local CLI smoke test

Built `dist/cli.js` and invoked it directly with `node`:

| Invocation | Result |
|---|---|
| `node dist/cli.js --version` | `emredogan v0.1.0` (exit 0) |
| `node dist/cli.js --help` | Full help text + exit 0 |
| `node dist/cli.js bogus-command` | `[emredogan] unknown command: bogus-command` to stderr + exit 1 |

Network commands (`ask`, `project list`) and opener commands
(`browse`, `demo`) require a live `EMREDOGAN_API_URL` or an OS
opener — verified during local development against
`http://localhost:3000`.

### 5.4 Tarball (V4 § 5.2.4 <100 KB cap)

`npm pack --dry-run --workspace=@emredogan/cli`:

- **Package size: 7.6 kB** (gzipped tarball)
- **Unpacked size: 21.2 kB**
- **Total files: 10** (LICENSE + README + CHANGELOG +
  package.json + 6 dist files)

Well under the 100 KB hard cap.

### 5.5 Bundle posture (CRITICAL)

Verified that no server-side or CLI-side modules reach the
client portfolio bundle:

```
grep -l "octokit|Octokit|@octokit|BedrockRuntime|aws-sdk|@sentry|sentry|
         emredogan-cli|@emredogan/cli" .next/static/chunks/*.js
→ 0 matches
```

The portfolio's client bundle is unaffected by Sub-PR 2.4.

### 5.6 Phase 1 + Sub-PR 2.1/2.2/2.3 invariants — all intact

| Invariant | Origin | Status |
|---|---|---|
| `@emredogan/lumina-chat` tarball 29 files / 23.7 kB | 1.1 | ✅ |
| `/telemetry` `○ Static 5m / 1y` | 1.2 | ✅ (now 16 tiles, was 13) |
| `/api/telemetry/[metric]` `ƒ` edge | 1.2 | ✅ |
| `/api/auto-tweet` `ƒ` edge | 1.3 | ✅ |
| `/changelog` `ƒ` (KV-cached) | 1.4 | ✅ |
| Sentry / AWS SDK / Octokit / CLI in 0 client chunks | 1.5 / 2.1 / 2.3 / 2.4 | ✅ |
| `/lab` `○ Static`, all three lab pages + routes | 2.1-2.3 | ✅ |
| Cinematic identity (`#00d2ff` only, Geist only, bg-black) | all | ✅ |

---

## 6. Human-gated steps to fully activate this sub-PR

Same shape as Sub-PR 1.1's H1-H8. The actual `npm publish` is
a workflow-dispatch action, not something the agent can trigger
directly.

| Step | What | Where |
|---|---|---|
| H1 | Confirm `NPM_TOKEN` secret already in repo (provisioned for Sub-PR 1.1) | github.com/emredogan-cloud/my-portfolio/settings/secrets/actions |
| H2 | The npm scope `@emredogan` already exists from Sub-PR 1.1's first publish; no scope-creation action needed | n/a |
| H3 | Trigger the **Publish @emredogan/cli** workflow with `confirm_version=0.1.0`, `tag=latest` | github.com/.../actions/workflows/publish-emredogan-cli.yml |
| H4 | Wait for workflow completion; inspect the "Inspect package contents (dry-run)" step matches the local 10 files / 7.6 kB tarball | Workflow run summary |
| H5 | `npm view @emredogan/cli` → expect `0.1.0` from this minute | local shell |
| H6 | Fresh-project smoke test: `npx -y @emredogan/cli --version` → `emredogan v0.1.0` | local shell |
| H7 | Confirm provenance badge on the npm package page | npmjs.com/package/@emredogan/cli |

Until H3, the npm badges in the root README + the CLI's own
README will render as shields.io "invalid" placeholders. Same
behaviour as Sub-PR 1.1 between commit and workflow trigger.

---

## 7. Schema additions (V4 § 2.13)

| Key | Role | Operation |
|---|---|---|
| `v4:adoption:cli:ask:visits_daily` | Counter — guard-passed POSTs | `incrementMetric` post-guards |
| `v4:adoption:cli:ask:completions_daily` | Counter — streams completed | `incrementMetric` in stream `finally` |
| `v4:cost:cli:ask:usd_daily` | Scalar — cumulative estimated cost | `recordEstimatedCost("cli-ask", 0.002)` (cheaper than lab — smaller max_tokens) |
| `v4:cost:cli:ask:usd_daily:updated_at` | Scalar ISO timestamp | sibling write (honest "X ago" on the dashboard) |
| `v4:lab:rate:cli-ask:<ip>` | Counter — per-IP rate bucket, 1-h TTL, max 10/hr | `kv.incr` + `kv.expire` with `maxPerWindow=10` |
| `v4:adoption:emredogan-cli:downloads_weekly` | Scalar — npm weekly downloads | external poll (deferred); placeholder for now |

The CLI's rate-limit key reuses the `v4:lab:rate:` prefix
because the underlying module (`lib/lab/rate-limit.ts`) wasn't
renamed when it grew beyond `/lab`-only callers. That's a
~5-minute polish item if the prefix matters for future
analytics; for now the slug-level namespace (`cli-ask`) is
unique enough.

---

## 8. Operational usefulness

- **Different demographic again.** `/lab` experiments target
  visitors who explore the portfolio. The CLI targets
  visitors who *return* — engineers who keep a terminal open
  all day and want a thin wrapper around Lumina that doesn't
  require opening a browser tab.
- **Streaming experience on the most-trafficked surface.**
  `npx emredogan ask` runs as a single subprocess. The
  conversation is throwaway (no session memory) — closer to
  `dig` than to `chatgpt-cli`. Visitors who try `ask` once and
  like the model can install with `npm i -g @emredogan/cli`
  for the muscle-memory short form.
- **Distribution funnel closure.** Each `npx emredogan` invocation
  is a npm download in the public download counter. That
  number feeds back into the `/telemetry` `@emredogan/cli /
  week` tile, which closes the V4 § 4.2 distribution loop.

---

## 9. Rollback plan

- `git revert <commit-sha>` removes the package + endpoints +
  workflow + telemetry diffs cleanly.
- Per-component soft disable:
  - Remove the `os` allow-list from `package.json` (no, that
    *expands* the platform list, not contracts it — wrong
    direction).
  - Disable the publish workflow by renaming `.github/workflows/
    publish-emredogan-cli.yml` to `.disabled-publish-emredogan-cli.yml`.
  - Disable `/api/cli/ask` by renaming the directory to
    `app/api/cli/_disabled-ask/`; the CLI's `ask` command
    then returns a clean upstream-error message.
- **Post-publish rollback** (after H3) — npm publish is
  irreversible within 72 hours then locked. `npm deprecate
  @emredogan/cli@0.1.0 "Critical bug — use 0.1.1"` is the
  soft signal; a 0.1.1 patch publish supersedes it.

---

## 10. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| `dist/cli.js` shipped without shebang | Very low | Medium | Post-build script defends against tsc regression; verified locally that the shebang is present + chmod 755. Workflow `npm pack --dry-run` step shows the file list pre-publish. |
| Windows user forces install + reaches `browse`/`demo` | Low | Low | `package.json` `os` field gates `npm install`. Runtime check in browse/demo prints a clear message + exits 2. |
| `EMREDOGAN_API_URL` set to a non-https endpoint | Low | Low | We don't enforce https — that's the caller's choice (local dev wants http). Visible in the printed `Opening <url>` line. |
| Bedrock cost spike from CLI floods | Medium | Medium | Per-IP 10/hr cap + per-day $5 cost cap; same posture as `/lab`. |
| npm scope publish permission missing | Low | Blocking | H2 — same NPM_TOKEN that published lumina-chat. Verified scope `@emredogan` exists. |
| Tarball lands with unexpected files | Low | Low | `files` allow-list in `package.json` + `npm pack --dry-run` workflow step. Local verification: 10 files, all expected. |
| Pre-existing `LuminaWindow.tsx` lint carry-overs | Background | None | Out of scope for the ninth consecutive sub-PR. |

---

## 11. Maintenance implications

- **Node version drift.** The CLI declares `engines.node >= 20`.
  As Node deprecates 20 (October 2027), the CLI's `engines`
  bumps to 22. ~5 min when it happens.
- **TypeScript major versions.** v5 → v6 may change shebang
  preservation behaviour. The post-build script is the
  insurance.
- **Lumina prompt drift.** The CLI shares `buildLuminaSystemPrompt`
  with the website. No CLI-specific maintenance — prompt
  changes flow through automatically.
- **Bundle creep.** The "zero deps" rule is the load-bearing
  contract. Adding `chalk` for colour output or `ora` for
  spinners would each blow the budget. Resist.

---

## 12. Next recommended sub-PR

**SUB-PR 2.5 — Notes 2.0 audio + interactive diagrams** (V4
§ 5.2.5, § 6.2.B SUB-PR 2.5, est. 5-7 days dev).

Scope (for reference — do not start until human approval):

- `data/notes.ts` schema extension — `audioUrl`, `diagram`
- `lib/notes-audio.ts` — build-time TTS generation pipeline
- `components/notes/AudioPlayer.tsx` — minimal player
- `components/notes/InteractiveDiagram.tsx` — diagram renderer
  (probably `react-flow`, ~50 KB — needs explicit budget
  acknowledgement)
- Tabbed UI on note pages: Read / Listen / Diagram
- At least 1 note (probably `monk-mode` or `cloud-waste-hunter-architecture`)
  flipped to all three formats

The dep cost of `react-flow` is the main architecture decision
2.5 has to make — the V4 doc § 5.2.5 budgets for it explicitly,
but it's the biggest delta-add since Sentry. Bundle posture
verification will need to confirm it lands only on
`/notes/[slug]` (not on every page).

2.5 closes Phase 2.

---

## 13. STOP

Sub-PR 2.4 complete from the agent's side. Awaiting human
review + approval before Sub-PR 2.5 begins.

The lab has three open doors; the terminal has four commands.
Two surfaces, one voice.

— end Sub-PR 2.4 —
