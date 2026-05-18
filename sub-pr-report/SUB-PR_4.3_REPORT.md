# Sub-PR 4.3 — Eval + Telemetry Expansion

**Branch:** `feat/v4-phase4-public-transparency` (continued)
**Phase:** V4 Phase 4 — AI-Native Operating Layer · Priority A.3
**Scope:** Per-tool telemetry collection across all 13 Lumina
tools, a runnable consistency-eval script, two new public
surfaces on `/lumina/brain` (eval status + live tool usage).
Zero new dependencies. Zero new server routes.

---

## 1. Mission

Priority A.3 closes the safe-foundation tier of Phase 4. The
preceding two sub-PRs gave Lumina inspectable architecture (4.1)
and source-code awareness (4.2). 4.3 adds the observability
layer: every tool invocation is counted, every error is counted,
the eval pipeline that guards cross-file consistency is public
and runnable, and the brain page surfaces both — closing the
transparency loop V4 § 2.3 mandates.

---

## 2. Architectural decisions

### 2.1 Hash key per metric class, NOT 26 new METRIC_KEYS
The 13-tool registry would need 26 entries (one invocation + one
error per tool) if we followed the existing METRIC_KEYS pattern.
Two KV hashes — one for invocations, one for errors — collapse
that into two stable keys. Atomic increments via Upstash's
`HINCRBY`, single-round-trip read via `HGETALL`.

```
v4:adoption:lumina-tools:invocations  → { toolName: count, ... }
v4:adoption:lumina-tools:errors       → { toolName: count, ... }
```

Adding a new tool requires no METRIC_KEYS edit — the hash field
appears automatically on first invocation.

### 2.2 `withTelemetry` higher-order wrapper
Each tool's `execute` body is wrapped at definition time:

```ts
execute: withTelemetry("listProjects", async () => { ... })
```

The wrapper:
- fires `recordToolInvocation(name)` on entry (fire-and-forget)
- catches thrown exceptions → records an error AND rethrows
- detects `{ error: ... }` return shape → records an error AND
  passes the value through unchanged

A single-line refactor per tool; preserves the AI SDK's
type-inference contract (generic over `TArgs, TResult`).

### 2.3 Consistency eval, not behavioral eval
The V4 doc § 5.4 Sub-PR 4.2 named "tool eval accuracy > 90%" as
a validation criterion. Behavioral eval requires running model
inference and grading output — heavy, expensive, and brittle at
this phase. Sub-PR 4.3 ships **deterministic consistency** eval
instead: every tool must surface in tools.ts, TOOL_LABEL,
brain-page manifest, AND be wrapped in `withTelemetry`. Drift
on any of those four surfaces is a transparency regression and
the script catches it.

Behavioral eval can layer on top of this foundation in a future
sub-PR if it earns the maintenance cost. For now, this is the
actionable surface a script can deliver without a running server.

### 2.4 Pure-ESM script, no `tsx` dependency
`scripts/eval-lumina-tools.mjs` reads the relevant TS source
files as text and uses regex to extract tool names. Avoids
pulling `tsx` / `ts-node` / Node-22+-experimental flags into the
dev surface. Runs as `node scripts/eval-lumina-tools.mjs` or
`npm run eval:lumina`. Exit 0 on pass, 1 on any regression
(suitable for CI when ready).

### 2.5 Brain page becomes async
Adding the live-usage table required `readToolInvocationCounts`
+ `readToolErrorCounts` at render time. The brain page is now
`async function LuminaBrainPage()` — Next.js handles the await
on RSC render. ISR cadence stays at 1h; first invocation count
appears within an hour of a tool call.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/telemetry/metrics.ts` | + 2 hash key constants, + `recordToolInvocation` / `recordToolError` (fire-and-forget), + `readToolInvocationCounts` / `readToolErrorCounts` (graceful empty objects on KV miss), + `normaliseHashNumbers` helper for Upstash REST's string/number quirk. |
| `lib/lumina/tools.ts` | + `withTelemetry<TArgs, TResult>` HOF, all 13 tool `execute` bodies wrapped (10 static + 3 lab-invocation factory tools). Preserves AI SDK type inference. |
| `scripts/eval-lumina-tools.mjs` (new) | Runnable consistency checker. Reads source files as text, regex-extracts tool names from 4 surfaces, reports per-tool pass/fail, detects orphan entries, exits 1 on any failure. Executable bit set. |
| `package.json` | + `"eval:lumina": "node scripts/eval-lumina-tools.mjs"` |
| `app/lumina/brain/page.tsx` | Component becomes `async`. + Section "07 · Tool consistency eval" (prose + command + repo link). + Section "08 · Live tool usage" (sorted table with KV-read counters, graceful "no data yet" empty state). |

---

## 4. Eval script output

```
$ npm run eval:lumina

Lumina tool consistency eval
────────────────────────────────────────────────────────────
name                    label  manifest  wrapped  status
────────────────────────────────────────────────────────────
listProjects              ✓     ✓       ✓    pass
getProjectDetails         ✓     ✓       ✓    pass
searchNotes               ✓     ✓       ✓    pass
getRecentCommits          ✓     ✓       ✓    pass
getCurrentTelemetry       ✓     ✓       ✓    pass
getRecentEngineering      ✓     ✓       ✓    pass
getLabStatus              ✓     ✓       ✓    pass
readSourceFile            ✓     ✓       ✓    pass
explainCommitRationale    ✓     ✓       ✓    pass
diffArchitectures         ✓     ✓       ✓    pass
translateIamPolicy        ✓     ✓       ✓    pass
rescuePrompt              ✓     ✓       ✓    pass
narrateCommits            ✓     ✓       ✓    pass
────────────────────────────────────────────────────────────
total 13   pass 13   fail 0
```

13/13 pass on the current branch.

---

## 5. Telemetry write path

```
chat turn → tool execute() called
              ↓
       withTelemetry wrapper
              ↓
       recordToolInvocation(name) — fire-and-forget HINCRBY
              ↓ (in parallel with the underlying execute)
       result returned
              ↓ if result has `error` key OR threw:
       recordToolError(name) — fire-and-forget HINCRBY
              ↓
       result passes through to AI SDK
```

Overhead: ~1-5 ms per tool call. Fire-and-forget so the chat-
turn latency contract is preserved.

---

## 6. Performance posture

| Path | Impact |
|------|--------|
| Per-tool wrapper overhead | ~1-5 ms (1 KV HINCRBY, fire-and-forget) |
| Chat-turn latency | unchanged (`LUMINA_P95_LATENCY` still captures end-to-end; wrapper writes don't block stream close) |
| Brain page render | + 2 KV reads (`HGETALL` × 2). Hourly ISR amortizes the cost |
| Eval script runtime | ~30-50 ms (reads three source files, runs regex, prints) |
| Bundle delta | 0 KB on the client; all new code server-only |

---

## 7. Privacy posture

- **Aggregate-only counters.** The KV hashes hold tool name →
  count mappings. No visitor identifier, no input payload, no
  output payload. A counter increment carries zero information
  about who triggered it.
- **Eval script reads only public source files.** No env vars
  required to run, no KV touched, no network call.
- **Brain page reads only the aggregates.** The "Live tool
  usage" table is intentionally surfaced as a transparency
  signal — anyone visiting the page sees the same counts
  Emre does.

---

## 8. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13 pass) |
| Production build | ✓ exit 0 |
| Bundle posture: telemetry-write symbols (`recordToolInvocation`, `recordToolError`, `withTelemetry`, `LUMINA_TOOL_INVOCATIONS_HASH_KEY`, etc.) absent from client chunks | ✓ (0 matches) |
| Existing server-only symbols still 0 client chunks | ✓ |
| `@xyflow/react` still single dynamic chunk | ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |
| `/lumina/brain` re-renders as `○ Static` with 1h ISR | ✓ |

---

## 9. Rollback plan

Single-commit revert removes:
- `withTelemetry` wrapper from 13 tools (mechanical unwrap)
- 2 hash key constants + 4 telemetry helpers
- `scripts/eval-lumina-tools.mjs`
- `package.json` script entry
- Brain page sections 07 + 08 + the async function signature

KV hashes left orphaned without TTL would harmlessly accumulate
zero bytes per tool name (Upstash hash entries cost only the
size of the field name + counter). Acceptable; can be cleared
manually with `DEL` if desired.

No schema break.

---

## 10. Failure modes considered

- **KV unavailable:** all recorders / readers are graceful
  no-ops. Brain page shows the "no data yet" branch; tools
  continue working normally.
- **Wrapper throws in fire-and-forget side path:** the `void`
  qualifier swallows any rejection; the wrapped `fn(args)`
  call is fully isolated.
- **Tool registry mutated without updating brain manifest /
  TOOL_LABEL / `withTelemetry`:** the eval script catches it
  with exit 1 and a per-surface column showing the failure.
- **Orphan entries** (label or manifest row pointing at a
  removed tool): eval script reports them in the warning
  section after the main table.
- **Brain page renders before any tool fires:** "Live tool
  usage" shows the empty-state branch.
- **Upstash returns mixed string/number hash values:**
  `normaliseHashNumbers` coerces with `Number()` and drops
  anything that doesn't parse.

---

## 11. Deferred items (NOT in this PR)

Per Phase 4 priority directive, these remain explicitly
deferred and were NOT touched:

| Item | Status |
|------|--------|
| Behavioral / accuracy eval (running model inference and grading) | Future PR if maintenance cost earns it |
| /telemetry dashboard tile for top-N tools | Could land trivially; deferred to keep 4.3 surgical |
| Per-tool p95 latency histogram | Not justified by current usage |
| Per-tool cost tracking | Tool cost is captured at the lab-route level already; aggregation deferred |
| Sub-agent infrastructure | Priority B — next phase |
| Voice persistence improvements | Priority C, conditional |
| Cloud-lab scan extension | Priority C, conditional |

Hard-forbidden Phase 4 surfaces (untouched):
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

## 12. Phase 4 Priority A — COMPLETE

| Sub-PR | Title | Status |
|--------|-------|--------|
| 4.1 | Public Lumina Transparency Layer | ✅ shipped |
| 4.2 | Repo-Aware Lumina Tools | ✅ shipped |
| 4.3 | Eval + Telemetry Expansion | ✅ this PR |

Priority A delivered a coherent SAFE FOUNDATION: the
architecture is public (4.1), the source is queryable through
the chat (4.2), and the operational surface is observable +
consistency-guarded (4.3). The remaining Phase 4 work moves into
Priority B (controlled AI layer) — sub-agent infrastructure
gated on this foundation.

Awaiting approval before opening Sub-PR 4.4 (Priority B.1 —
persistent memory refinement) or Sub-PR 4.5 (Priority B.2 —
single sub-agent / architecture-critic).
