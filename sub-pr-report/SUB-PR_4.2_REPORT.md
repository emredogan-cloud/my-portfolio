# Sub-PR 4.2 — Repo-Aware Lumina Tools

**Branch:** `feat/v4-phase4-public-transparency` (continued)
**Phase:** V4 Phase 4 — AI-Native Operating Layer · Priority A.2
**Scope:** Three new server-side tools on the Lumina registry,
edge-safe, single new helper module. Zero new dependencies. Zero
new server routes.

---

## 1. Mission

The V4 doc § 5.4 Sub-PR 4.2 specifies three new tools for Lumina
that let her answer technical questions from THIS repo's actual
source rather than her trained-time approximation:

- `readSourceFile(path)`
- `explainCommitRationale(sha)`
- `diffArchitectures(idA, idB)`

The mission under the user's Phase 4 priority directive: ship the
SAFE FOUNDATION (Priority A) before any new AI surface. 4.1 made
Lumina's architecture public; 4.2 makes it inspectable through the
chat itself.

---

## 2. Architectural decisions

### 2.1 Direct fetch, NOT Octokit
The chat route runs edge (`runtime = "edge"`). Octokit pulls
Node-specific deps and would force a runtime change that affects
*every* chat — not just the new tools. Precedent already
established in `lib/github-events.ts` (the existing edge-safe
GitHub fetch used by `getRecentCommits`). Sub-PR 4.2 follows that
posture verbatim.

### 2.2 Hardcoded `owner/repo` for source reads
The V4 doc requires "public-only repos (private hariç tutulur)".
The strongest possible enforcement is no input surface that
accepts an arbitrary `owner/repo` in the first place. The new
tools are scoped exclusively to `emredogan-cloud/my-portfolio`.
If a future sub-PR wants cross-repo support, that's a separate
threat-model conversation.

### 2.3 Path & SHA validation at the tool boundary
- `validateRepoPath`: rejects empty, > 300 chars, leading `/`,
  leading `.`, any `..` segment, any byte outside
  `[a-zA-Z0-9_./-]`. The repo doesn't contain anything wilder.
- `validateCommitSha`: 7-40 hex characters, case-insensitive.

A malicious or model-hallucinated input bounces at the validation
layer with `{ error: "invalid-path" | "invalid-sha" }` — never
hits GitHub.

### 2.4 KV cache per resource type
- **File contents:** 1-hour TTL. Files change at every push;
  one hour is the freshness/cost sweet spot.
- **Commit details:** 7-day TTL. Commits are immutable once
  pushed — the TTL just exists to expire the KV slot.
- Cache miss falls through to direct fetch; KV write is best-
  effort (swallowed on error). KV-unavailable environments
  (local dev) work normally with cold fetches every time.

### 2.5 Authenticated GitHub quota when available
Optional env var `GITHUB_PAT_PUBLIC_REPOS` unlocks the 5000-req/hr
authenticated quota when present. Falls back to anonymous 60-req/
hr otherwise. Same pattern `lib/lab/github.ts` already uses for
the commit-narrator route.

### 2.6 In-memory diff for project comparison
`diffArchitectures` reads from `data/projects.ts` (already in
memory). No GitHub call, no cache. Computes `sharedTech`,
`uniqueToA`, `uniqueToB` via Set arithmetic on `techStack[]`.

### 2.7 Size cap on file reads
50 KB raw byte cap. Larger files are truncated; response returns
`truncated: true` so the model can mention the partial read in
its answer. Keeps the chat-turn token budget bounded even if a
visitor (or the model) asks for the largest file in the repo.

### 2.8 Brain page updated in-PR per V4 § 2.3
The transparency surface is the V4 brand contract. New tools land
in the brain page in the same sub-PR they ship — never a separate
PR. The tools count moved 10 → 13; the prose updated; the tool
groups grew from 3 to 4.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/lumina/repo-aware.ts` (new) | Edge-safe fetch helpers: `fetchPublicFile`, `fetchCommitDetail`. Path + SHA validators. KV cache per resource type. Optional GitHub PAT support. Hand-rolled base64 decode + WHY-paragraph parser (portable `[\s\S]` cross-newline match to stay within the project's TS target). |
| `lib/lumina/tools.ts` | + 3 tools in `STATIC_TOOLS`: `readSourceFile`, `explainCommitRationale`, `diffArchitectures`. Doc-block updated with the new "Repo-aware reads" group. |
| `lib/lumina/system-prompt.ts` | + `## Repo-aware reads` block. Voice rules: quote 5-15 lines verbatim in code blocks, never paste whole files; ask for specific path/SHA/slug rather than guessing; do not chain all three in one turn; graceful pivots on every error code. |
| `components/chat/LuminaWindow.tsx` | + 3 `TOOL_LABEL` entries (`reading source`, `reading commit`, `diffing projects`). |
| `app/lumina/brain/page.tsx` | Tool manifest expanded (10 → 13), tool groups expanded (3 → 4). Source files section adds `lib/lumina/repo-aware.ts` and the count in the prose. |

No new dependencies. No new env vars (the optional
`GITHUB_PAT_PUBLIC_REPOS` already exists from Phase 2). No new
server routes. No new client surfaces.

---

## 4. Telemetry impact

No new metric keys in this PR. Per-tool invocation counters and a
broader eval pipeline land in Priority A.3 (Eval + Telemetry
Expansion). For 4.2, the existing `LUMINA_P95_LATENCY` continues
to capture end-to-end chat latency including the new tools'
contribution.

---

## 5. Performance posture

| Path | Cold (no cache) | Warm (cache hit) |
|------|-----------------|-------------------|
| `readSourceFile` | ~200-400 ms (GitHub fetch + decode) | ~30-50 ms (KV GET) |
| `explainCommitRationale` | ~200-400 ms | ~30-50 ms |
| `diffArchitectures` | < 1 ms (in-memory) | n/a |

The model is instructed not to chain all three repo-aware tools
in a single turn. Typical operator chat that uses one of these
adds at most ~400 ms cold or ~50 ms warm to the chat-turn
latency.

V4 § 5.4 Sub-PR 4.2 performance target: "< 1s tool execution".
Hit comfortably in both cold and warm cases.

---

## 6. Privacy + security posture

- **Public repo only.** Hardcoded `emredogan-cloud/my-portfolio`.
  No input surface accepts arbitrary `owner/repo`.
- **Path validation.** Rejects traversal (`..`), leading slash,
  leading dot, > 300 chars, and any byte outside the conservative
  `[a-zA-Z0-9_./-]` alphabet. A model-hallucinated path bounces
  with `{ error: "invalid-path" }` before reaching GitHub.
- **SHA validation.** 7-40 hex characters. Garbage input bounces
  at the boundary.
- **No visitor PII in the new path.** Every input comes from the
  model's tool-call arguments; no headers parsed, no visitor IP
  forwarded (GitHub doesn't need it for unauthenticated calls).
- **Cache-key safety.** Cache keys are prefixed
  (`v4:lumina:repo:file:`, `v4:lumina:repo:commit:`) and contain
  only validated path/SHA values. No injection vector.
- **Source content boundary.** The repo is fully public — every
  byte readable here is already readable on github.com. No
  internal-only files exist in the public repo by construction.

---

## 7. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 (after replacing the `s` regex flag with the portable `[\s\S]` pattern — the project's TS target is < ES2018) |
| `eslint` on touched files | ✓ exit 0 |
| Production build | ✓ exit 0 |
| `/lumina/brain` re-renders with 13-tool manifest | ✓ static prerender |
| Bundle posture: `fetchPublicFile` / `fetchCommitDetail` / `validateRepoPath` / `validateCommitSha` / `FILE_CACHE_PREFIX` / `GITHUB_PAT_PUBLIC_REPOS` absent from client chunks | ✓ (0 matches) |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` still 0 client chunks | ✓ |
| Existing operator + memory + lab + redaction server symbols still 0 in client | ✓ |
| `@xyflow/react` still single dynamic chunk | ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |
| Pre-existing `LuminaWindow.tsx` set-state-in-effect warnings | unchanged (out of scope) |

---

## 8. Rollback plan

Single-commit revert removes:
- `lib/lumina/repo-aware.ts` — clean delete
- 3 tool entries from `STATIC_TOOLS`
- The `## Repo-aware reads` block from the system prompt
- 3 `TOOL_LABEL` entries
- The brain page manifest reverts to 10 tools / 3 groups
- KV cache entries (`v4:lumina:repo:file:*`, `v4:lumina:repo:commit:*`)
  remain harmlessly until their TTLs expire — no migration needed

No schema break. No env var to undo.

---

## 9. Failure modes considered

- **GitHub 404 (path or SHA doesn't exist):** typed
  `{ error: "not-found" }` response. The system prompt instructs
  Lumina to state plainly that the path/SHA doesn't exist.
- **GitHub 403 / rate limit:** typed `{ error: "rate-limited" }`.
  Lumina pivots to "I can't reach GitHub right now — file is at
  github.com/.../<path>" per the system prompt.
- **Fetch timeout (4.5 s):** typed `{ error: "fetch-failed" }`.
  Same graceful pivot.
- **Base64 decode failure:** falls back to the raw string. The
  `TextDecoder` is `fatal: false` so partial UTF-8 sequences
  don't crash the path.
- **KV unavailable:** cache reads fail silently, fetch goes
  direct, write best-effort. The page never errors.
- **Model hallucinates a file path or SHA:** validators reject at
  the boundary; the model receives a typed error and re-asks the
  visitor.
- **Diff over unknown project ids:** returns
  `{ error: "not-found", missing: string[] }` so the model can
  enumerate the bad inputs.
- **Hourly ISR drift on the brain page:** the new tools take up
  to an hour to appear in the brain page after deploy.
  Acceptable — V4 § 2.3 transparency discipline updates the
  manifest in the same sub-PR, so the page IS up to date in
  source the moment 4.2 merges.

---

## 10. Deferred items (NOT in this PR)

Per the constitutional Phase 4 priority directive:

| Item | Status |
|------|--------|
| Per-tool invocation counters | Priority A.3 — next sub-PR |
| Eval pipeline scripts | Priority A.3 |
| Persistent memory refinement | Priority B.1 |
| Sub-agent infrastructure / architecture-critic | Priority B.2 |
| Voice persistence improvements | Priority C.1, conditional |
| Cloud-lab scan extension | Priority C.2, conditional |

Hard-forbidden Phase 4 surfaces (still untouched):
- Wake-word voice / always-on mic
- Emotional adaptation / visitor-type detection
- Multimodal screen sharing
- WebGPU systems
- Distributed agent bus
- Autonomous remediation
- 5+ sub-agents
- Subdomain federation
- Real-time SSE dashboards

---

## 11. Next sub-PR

Sub-PR 4.3 — Eval + Telemetry Expansion. Adds per-tool invocation
counters + the eval-pipeline scaffolding for the V4 § 5.4
"tool eval accuracy > 90%" validation criterion.

Awaiting approval per the constitutional directive.
