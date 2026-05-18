# Sub-PR 3.2 — Lumina V3: Lab Invocation

**Branch:** `feat/v4-phase3-operator-systems`
**Phase:** V4 Phase 3 — AI-Native Operator Systems (user-reframed)
**Scope:** Server-side tool registry expansion + per-request factory.
Zero new dependencies. Zero client-bundle delta. HTTP loopback from the
edge chat route to the existing nodejs lab routes.

---

## 1. Mission

Sub-PR 3.1 taught Lumina to *read* the platform (telemetry, recent
engineering, lab registry). 3.2 teaches her to *operate* it — she can
now run the three /lab experiments on behalf of the visitor:

- **IAM Policy Translator** — paste an AWS IAM JSON, get a structured
  plain-English translation.
- **Prompt Rescuer** — paste a thin prose prompt, get a six-section
  engineering rewrite.
- **Commit Narrator** — paste a github.com/owner/repo URL, get a
  per-commit "why" narration for the latest 20 commits.

Same backend the lab pages already use. Same rate-limit, same daily
cost cap, same telemetry counters. The only thing that changes is
the surface — the visitor can stay inside the Lumina pane instead of
navigating to /lab/iam-translator and pasting again.

Operator co-pilot. Not AI playground.

---

## 2. Architectural decision: HTTP loopback

The chat route runs on Vercel's edge runtime. The lab routes run on
nodejs (Bedrock's SigV4 signer + EventStream codec crash on edge —
precedent established in `app/api/cwh-demo/route.ts` lines 24-33 and
followed by all `/api/lab/*`).

That left two options:

| Option | Approach | Verdict |
|--------|----------|---------|
| **A — Direct lib import** | Have Lumina's tools import the Bedrock client and call it. | ❌ would force `runtime = "nodejs"` on the chat route, breaking the latency contract for every chat (not just lab invocations). |
| **B — HTTP loopback** | Tool's `execute()` POSTs to the existing nodejs lab route. | ✅ Chosen. |

Loopback details:

- Tool calls `fetch(${origin}/api/lab/iam-translate, ...)` where
  `origin` comes from `new URL(req.url).origin`. Works in dev, preview,
  and prod without env-var coupling.
- The tool **forwards the visitor's IP headers** (`x-real-ip` and
  `x-forwarded-for`). This means the lab route's `getClientIp` resolves
  to the same IP whether the request came through Lumina or directly
  from the lab page — rate-limit and cost-cap budgets stay coherent.
- Response is consumed via `response.text()` (the lab routes stream
  text/plain, which `.text()` buffers in full). Output capped at 7 000
  chars before being handed to the model, so a runaway lab response
  can't blow the chat turn's token budget.

---

## 3. Factory refactor: `createLuminaTools(req)`

The existing static `LUMINA_TOOLS` export had no need for the
originating `Request`. The new lab tools do — they need IP headers
and the base URL.

The cleanest cut was to expose a per-request factory:

```ts
// lib/lumina/tools.ts
const STATIC_TOOLS = { /* 7 existing data-accessor tools */ };

export const LUMINA_TOOLS = STATIC_TOOLS;  // backwards-compat
export function createLuminaTools(req: Request) {
  return { ...STATIC_TOOLS, ...createLabInvocationTools(req) };
}
```

```ts
// app/api/chat/route.ts
- import { LUMINA_TOOLS } from "@/lib/lumina/tools";
+ import { createLuminaTools } from "@/lib/lumina/tools";
  ...
- tools: LUMINA_TOOLS,
+ tools: createLuminaTools(req),
```

The legacy `LUMINA_TOOLS` symbol remains exported — any future consumer
that doesn't need lab invocation (testing harnesses, etc.) can still
import the static 7-tool subset.

---

## 4. What changed

| File | Change |
|------|--------|
| `lib/lumina/tools.ts` | + 3 lab-invocation tools, + factory `createLuminaTools(req)`, + helpers `invokeLab` / `buildLoopbackHeaders` / `capLabOutput` / `getBaseUrl`. The existing 7 tools moved into a `STATIC_TOOLS` const; `LUMINA_TOOLS` becomes a re-export of that. |
| `lib/lumina/system-prompt.ts` | + `## Lab invocation` section. Voice contract: "name what you just ran, then the output. No chatty preamble." Explicit error pivots for each lab error code (rate-limited / cost-cap / sandbox-offline / input-validation / etc.). Hard rules: no chaining, no double-invocation to "compare", no faked tool calls. Also updated the bottom-of-prompt "## Tools" header to "## Tools (portfolio reads)" since operator + lab tools have their own sections. |
| `app/api/chat/route.ts` | swapped static import for factory; updated doc-block. |
| `components/chat/LuminaWindow.tsx` | + 3 `TOOL_LABEL` entries (`translateIamPolicy: "translating IAM policy"`, `rescuePrompt: "rescuing prompt"`, `narrateCommits: "narrating commits"`). |

No new components. No new routes. No new env vars. No new package
dependencies.

---

## 5. Invariants verified

| Invariant                                                                   | Status |
|-----------------------------------------------------------------------------|--------|
| `tsc --noEmit` clean across the project                                     | ✓ exit 0 |
| `eslint` clean on touched files (`tools.ts`, `system-prompt.ts`, `route.ts`)| ✓      |
| Production build green — all routes intact                                  | ✓ exit 0 |
| Zero new npm dependencies                                                   | ✓      |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` absent from client chunks   | ✓ (0 matches) |
| Server-only symbols (`readMetric`, `LAB_EXPERIMENTS`, etc.) absent          | ✓ (0 matches) |
| Lab-loopback helpers (`invokeLab`, `buildLoopbackHeaders`, `capLabOutput`) absent from client | ✓ (0 matches) |
| `@xyflow/react` still single dynamic chunk                                  | ✓ (1 chunk) |
| `@emredogan/lumina-chat` tarball: 29 files / 23.7 kB                        | ✓ unchanged |
| `@emredogan/cli` tarball: 15 files / 13.5 kB                                | ✓ unchanged |
| Cinematic identity: `#00d2ff`, Geist, `bg-black`                            | ✓ no visual changes |
| Chat route runtime still `edge`                                             | ✓      |

### Bundle posture grep

```
$ grep -l "BedrockRuntimeClient\|@aws-sdk\|sentry/nextjs\|@octokit/rest" \
    .next/static/chunks/*.js | wc -l
0

$ grep -l "invokeLab\|buildLoopbackHeaders\|capLabOutput\|createLuminaTools" \
    .next/static/chunks/*.js | wc -l
0

$ grep -l "translateIamPolicy\|rescuePrompt\|narrateCommits" \
    .next/static/chunks/*.js | wc -l
1   # LuminaWindow.tsx TOOL_LABEL map string — UI label only
```

### Pre-existing carry-over (NOT introduced by 3.2)

The 4 `react-hooks/set-state-in-effect` lint errors in
`components/chat/LuminaWindow.tsx` (lines 172, 242, 284, …) were
flagged in Sub-PR 3.1's report and survive this sub-PR unchanged.
Out of scope here.

---

## 6. Cost + latency posture

### Per-invocation cost
The lab routes already have a **$5/day cost cap per experiment**. A
Lumina-driven invocation hits the same KV-tracked daily budget that
direct-visitor invocations do. So the worst case is: visitors burn
$15/day across the three experiments, just like before — but now they
can do it via chat too.

Sub-PR 3.1 already pinned per-visitor rate limits at 10/hr for
`iam-translate` + `prompt-rescue` and 3/hr for `commit-narrator`
(heavier call). IP forwarding means those budgets are unified across
Lumina vs lab-page surfaces — there's no escape hatch.

### Per-turn latency
Adding to the chat turn latency:

| Tool                   | Cold latency | Warm latency |
|------------------------|--------------|--------------|
| `translateIamPolicy`   | ~3-5 s       | ~2-4 s       |
| `rescuePrompt`         | ~3-6 s       | ~2-5 s       |
| `narrateCommits`       | ~5-9 s       | ~4-8 s       |

The model is instructed not to chain multiple lab invocations in a
single turn, so a typical operator chat that uses a lab tool spends
one tool call (≤ 8 s p95) plus the normal chat round-trip.

The `TOOL_LABEL` spinner ("translating IAM policy…") gives the
visitor honest progress indication during the wait — no spinner
silence, no fake "thinking" theater.

---

## 7. Voice + framing guardrails (system prompt)

The prompt for 3.2 is deliberately strict because lab invocation is
the place where Lumina is most likely to drift into AI-playground
energy. Hard rules verbatim from the new `## Lab invocation` section:

- Invoke ONLY when the visitor has actual material to operate on (IAM
  JSON, prose prompt, github URL). Generic questions about the
  experiments → conversational answer + lab URL, NOT a tool call.
- Output the lab's text **verbatim** with at most one line of header.
  Don't summarize. Don't reformat. The lab's structure is part of the
  value.
- `narrateCommits` is heavy — hand off to `/lab/commit-narrator`
  unless the visitor explicitly asks for inline narration.
- In **voice mode** (ElevenLabs TTS): generally DO NOT invoke. A
  structured multi-section output reads poorly spoken aloud — route
  to the lab URL.
- Never chain multiple invocations. Never invoke twice to "compare".
- Pivot gracefully on every lab error code (rate-limited /
  daily-cost-cap-reached / sandbox-offline / input-validation
  errors). No apology theater.

---

## 8. Rollback

Single commit revert restores the prior state.

- Tools registry: factory deletion reverts to static `LUMINA_TOOLS`
  with the 7 Sub-PR 3.1 tools.
- Chat route: single-line import + assignment revert.
- System prompt: deletion of `## Lab invocation` block.
- LuminaWindow: deletion of 3 `TOOL_LABEL` keys.

No KV state to clean up. Tools are read-only-from-Lumina's-perspective
(they cost Bedrock invocations, but the cost surface is the lab
routes — same as before).

---

## 9. Out-of-scope acknowledgements

- **Per-call telemetry** for Lumina-driven invocations specifically
  (e.g., "what % of IAM translator calls came via Lumina vs direct"):
  not added. The lab routes already increment their `LAB_*_VISITS_DAILY`
  and `LAB_*_COMPLETIONS_DAILY` counters, and those continue to
  capture Lumina-driven calls under the same key. Splitting by
  invocation source would require a new metric key set, not justified
  by current data needs.
- **Streaming through the chat**: the AI SDK's tool-result interface
  is synchronous — `execute()` returns one value, model reads it,
  then streams its own response. Streaming the lab output through
  Lumina's stream would require a custom tool result format and
  isn't supported cleanly in AI SDK v6. The current shape (tool runs
  → spinner — text appears) is the right UX.
- **Conversation-scoped result caching**: not added. If a visitor
  invokes the same tool twice in a conversation, both fire. Adding a
  per-conversation cache would muddy the cost-cap accounting and
  isn't a real-world problem at current usage.

---

## 10. Remaining Phase 3 plan (under the user-reframed mission)

| Sub-PR | Title                        | Status      |
|--------|------------------------------|-------------|
| 3.1    | Operator Awareness           | ✅ shipped   |
| 3.2    | Lab Invocation               | ✅ this PR   |
| 3.3    | Persistent Memory            | next (V4 § 4.4 Sub-PR 4.1 — server-side conversation memory keyed by visitor cookie; 14-day TTL; ≤ 8 turns recalled; PII redacted) |
| 3.4    | Voice Persistent Button      | (V4 § 4.4 Sub-PR 4.4 — ElevenLabs STT round-trip in the chat input) |
| 3.5    | Cloud Lab MVP                | (V4 § 4.4 Sub-PR 4.5 — authenticated Bedrock-against-visitor's-own-AWS surface; most invasive of the phase) |

Each one human-gated. No code on 3.3 until approval.
