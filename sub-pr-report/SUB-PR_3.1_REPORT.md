# Sub-PR 3.1 — Lumina V3: Operator Awareness

**Branch:** `feat/v4-phase3-operator-systems`
**Phase:** V4 Phase 3 — AI-Native Operator Systems (user-reframed)
**Scope:** Server-side tool registry expansion. Zero new dependencies. Zero
client-bundle delta. Server-only execution.

---

## 1. Mission

Lumina is the portfolio's resident chat. Until this sub-PR she could read
projects, notes, and the single head commit. She could not see the
platform she lives on.

This sub-PR teaches her to read three first-party data surfaces that
already ship to the public: the `/telemetry` dashboard, the `/changelog`
feed, and the `/lab` experiment registry. Same KV namespace. Same caching
semantics. Same data the human visitor would see — but available to her
as structured tool output instead of pixel rendering.

The model itself is unchanged. The conversation API is unchanged. The
voice contract is unchanged. What changes is the *aperture* — she can
now answer operator-shaped questions like "how is the platform doing"
or "what shipped this week" by reading reality instead of confabulating
from training-time data.

---

## 2. The V4-doc → user-framing pivot

The V4 execution doc (§ 4.3) frames Phase 3 as **Monetization & Community
Layer** — paid tiers, sponsor wall, OSS bounty board. The user
explicitly rejected that framing for this site and reframed Phase 3 as
**AI-Native Operator Systems**.

Mission statement (user, verbatim):

> "a focused operational co-pilot designed for real engineering
> workflows" — NOT a ChatGPT clone, AI gimmick, flashy autonomous
> system, or fake agentic theater. Lumina must feel "sharp, calm,
> embedded, infrastructure-native, systems-aware".

Things Lumina V3 is **not**:

- not humanized, not given a personality product
- not a Jarvis aesthetic, not a cyberpunk dashboard
- not autonomous, not multi-agent, not running on its own schedule
- not a glowing AI surface — no new visual chrome, no new page

Things Lumina V3 *is*: the same chat window, the same voice, with three
new things it can look up before answering.

Operator console intelligence, not AI girlfriend startup.

---

## 3. What changed

### 3.1 `lib/lumina/tools.ts` — 3 new tools

All three tools are pure data accessors that hit the same KV + lib
primitives the public surfaces already consume. No new infrastructure.
No new failure modes.

**`getCurrentTelemetry`** — six-metric snapshot, identical to what
`/api/cli/telemetry` and the CLI's `emredogan telemetry` already return:

| Metric                                  | Source key                         |
|-----------------------------------------|------------------------------------|
| Lumina p95 latency (ms)                 | `LUMINA_P95_LATENCY`               |
| Auto-tweet successes (lifetime)         | `AUTOTWEET_SUCCESS_30D`            |
| IAM translator runs                     | `LAB_IAM_COMPLETIONS_DAILY`        |
| `@emredogan/lumina-chat` weekly DLs     | `LUMINA_CHAT_NPM_WEEKLY`           |
| `@emredogan/cli` weekly DLs             | `EMREDOGAN_CLI_NPM_WEEKLY`         |
| Notes audio plays                       | `NOTES_AUDIO_PLAYS`                |

Reads all six in parallel via `Promise.all`. Null metrics (no data
recorded yet) are passed through; the system prompt instructs the
model to omit nulls rather than report them.

**`getRecentEngineering`** — last 5 commits with the WHY paragraph
parsed out of each commit body. Calls `getRecentCommits(5)` from
`lib/github-events`. Backed by the same 30-min KV cache (`v4:changelog:commits:v1`)
that `/changelog` uses, so the marginal cost is one cache hit per warm
conversation.

**`getLabStatus`** — current `/lab` experiment registry (4 entries:
iam-translator, prompt-rescuer, commit-narrator, cli — all `active`).
Pure in-memory read from `lib/lab/registry`.

### 3.2 `lib/lumina/system-prompt.ts` — `## Operator awareness` section

Added between `## Terminal access — @emredogan/cli` and `## Evaluation
framework`. Tells the model:

- when to invoke each tool (telemetry questions / engineering work /
  lab status)
- voice contract: "Read it like a senior operator narrating their own
  console — short clauses, specific values, no celebration."
- hard rules: no chaining all three in one turn; null metrics omitted;
  SHAs/URLs/raw timestamps hidden unless asked

### 3.3 `components/chat/LuminaWindow.tsx` — `TOOL_LABEL` extension

The spinner strip already shows "Lumina is checking projects" etc.
when a tool is mid-call. Added three labels:

```ts
getCurrentTelemetry: "reading telemetry",
getRecentEngineering: "reading recent commits",
getLabStatus: "checking lab",
```

No other UI changes. No new components. No new state.

---

## 4. Why this is the smallest possible change

The user's Phase 3 brief explicitly warned against "AI playground" and
"autonomous gimmicks". The smallest change that delivers operator
awareness is: extend the tool registry, extend the prompt, extend the
spinner labels. Three files. Zero new routes, zero new components,
zero new infrastructure.

Things explicitly **not** done in 3.1:

- No persistent memory layer (V4 § 4.4 Sub-PR 4.1 — proposed for 3.3)
- No lab invocation (calling tools inside `/lab/iam-translate` etc.
  from inside Lumina) — proposed for 3.2
- No voice persistent button — proposed for 3.4
- No cloud lab MVP — proposed for 3.5
- No new tools beyond the three operator reads (V4 § 4.4 Sub-PR 4.2
  lists 3 repo-aware tools; deferred)

---

## 5. Invariants verified

| Invariant                                                    | Status |
|--------------------------------------------------------------|--------|
| `tsc` clean on touched files                                 | ✓      |
| `eslint` clean on touched files (`tools.ts`, `system-prompt.ts`) | ✓   |
| Production build green — all routes intact                   | ✓      |
| Zero new npm dependencies                                    | ✓      |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` absent from client chunks | ✓ |
| Server-only symbols (`readMetric`, `LAB_EXPERIMENTS`, etc.) absent from client chunks | ✓ |
| `@xyflow/react` still single dynamic chunk                   | ✓      |
| `@emredogan/lumina-chat` tarball: 29 files / 23.7 kB         | ✓ (unchanged) |
| `@emredogan/cli` tarball: 15 files / 13.5 kB                 | ✓ (unchanged) |
| Cinematic identity: `#00d2ff`, Geist, `bg-black`             | ✓ (no visual changes) |

### Bundle posture grep

```
$ grep -l "BedrockRuntimeClient\|@aws-sdk\|sentry/nextjs\|@octokit/rest" \
    .next/static/chunks/*.js | wc -l
0

$ grep -l "readMetric\|LUMINA_P95_LATENCY\|LAB_EXPERIMENTS\b" \
    .next/static/chunks/*.js | wc -l
0

$ grep -l "getCurrentTelemetry" .next/static/chunks/*.js | wc -l
1   # LuminaWindow.tsx TOOL_LABEL map string — UI label only
```

### Pre-existing carry-over (NOT introduced by 3.1)

`components/chat/LuminaWindow.tsx` has 4 pre-existing
`react-hooks/set-state-in-effect` lint warnings from before Phase 1.
They survive this sub-PR unchanged. Fixing them is out of scope here
and would distort the diff.

---

## 6. Performance posture

Tools are server-side and run inside the chat route's edge runtime
(same as v2). The three new reads cost roughly:

- `getCurrentTelemetry`: 6 parallel KV `GET`s, ~50-100 ms warm
- `getRecentEngineering`: 1 KV `GET` warm (30-min cache); 200-400 ms
  cold (GitHub Public Events API hit)
- `getLabStatus`: in-memory array map, ~0 ms

Worst-case end-to-end: cold-cache `getRecentEngineering` adds ~300 ms
to the first conversation turn that asks about engineering. Subsequent
calls within 30 min are warm. The model is instructed not to chain all
three in a single turn, so the typical added latency per question is
one tool call ≤ 100 ms warm.

---

## 7. Rollback

This sub-PR is a single commit on `feat/v4-phase3-operator-systems`.
Revert paths:

1. **Trivial:** `git revert <commit>` — restores tools.ts /
   system-prompt.ts / LuminaWindow.tsx to their pre-3.1 state.
2. **Surgical:** delete the three tool definitions from `lib/lumina/tools.ts`,
   delete the `## Operator awareness` section from `lib/lumina/system-prompt.ts`,
   delete the three new `TOOL_LABEL` entries. The model gracefully
   stops invoking tools it can't find in the registry; no users see an
   error.

No KV state to clean up — these tools are read-only.

---

## 8. Proposed Phase 3 sub-PR plan (under the new framing)

Sub-PR 3.1 is the foundation: Lumina can *read* the platform. The
remaining sub-PRs build upward in the same operator-console-not-AI-
playground register.

| Sub-PR | Title                        | What it adds                              |
|--------|------------------------------|-------------------------------------------|
| 3.2    | Lab invocation               | Lumina can run the `/lab/*` endpoints (IAM translate, prompt rescue, commit narrate) as tools. "Translate this AWS policy" routes through her instead of requiring the visitor to navigate. |
| 3.3    | Persistent memory            | Server-side conversation memory keyed by visitor cookie. V4 § 4.4 Sub-PR 4.1. Three rules: 14-day TTL, ≤ 8 turns recalled, redacted of PII. |
| 3.4    | Voice persistent button      | The chat input grows a microphone affordance that streams to ElevenLabs STT, then back through Lumina, then back as audio via the existing TTS layer. V4 § 4.4 Sub-PR 4.4. |
| 3.5    | Cloud Lab MVP                | An authenticated endpoint where signed-in visitors can run small Bedrock prompts against their own AWS account. V4 § 4.4 Sub-PR 4.5. This is the most invasive sub-PR — IAM role assumption, per-user cost cap, audit log. Last in the phase by design. |

Each proceeds only on human approval, one at a time. Sub-PR 3.5 may
get further split if the IAM surface grows.

---

## 9. Risks

- **Latency drift:** if a visitor asks an operator-shaped question
  every turn, three cache hits add up. Mitigation: the system prompt
  forbids invoking these for small-talk and forbids chaining all three.
- **Null-metric drift:** `getCurrentTelemetry` returns `null` when
  metrics aren't in KV yet. The prompt instructs omission, but a model
  drift in newer Haiku snapshots could regress this. Mitigation:
  pinned snapshot `claude-haiku-4-5-20251001`.
- **GitHub Public Events rate limit:** if the 30-min cache expires
  during a traffic spike, `getRecentEngineering` could hit GitHub's
  unauthenticated 60-rph ceiling. Mitigation: the cache lives in
  `lib/github-events` and already handles 403/429 gracefully — Lumina
  receives `{error: "changelog-unavailable"}` and the prompt instructs
  her to acknowledge the gap without inventing data.

---

## 10. Out-of-scope acknowledgements

- V4 § 4.4 Sub-PR 4.2 (repo-aware file-read tools) — deferred.
- V4 § 4.4 Sub-PR 4.3 (per-tool cost tracking inside the model loop) —
  the existing per-IP rate-limit shim covers the user-protection part;
  observability into Lumina's own tool spend lives in `/telemetry`
  already.
- LuminaWindow.tsx lint cleanup — separate PR.
