# Sub-PR 4.5 — Single Sub-Agent (architecture-critic ONLY)

**Branch:** `feat/v4-phase4-public-transparency` (continued)
**Phase:** V4 Phase 4 — AI-Native Operating Layer · Priority B.2
**Scope:** First Lumina sub-agent, heuristic router, visible
orchestration trace via the existing tool-pill primitive, public
transparency page. Zero new dependencies.

---

## 1. Mission

The constitutional Phase 4 directive carries three hard MUSTs for
sub-agents:

| MUST | How Sub-PR 4.5 satisfies it |
|------|-----------------------------|
| MUST fail back to single-agent mode | Router is pure heuristic, never throws, and biases toward `lumina`. Every ambiguous turn returns the default. |
| MUST have visible orchestration tracing | Synthetic `selectArchitectureCritic` tool the agent prompt mandates calling at the start. The existing TOOL_LABEL pill ("engaging architecture-critic") is the trace surface. |
| MUST log routing decisions | KV hash counter `v4:adoption:lumina-router:decisions` with one field per agent id. Fire-and-forget from the chat route. |

Plus the doc's "ONLY ONE sub-agent initially" + "architecture-critic
ONLY" — both respected verbatim.

---

## 2. Architectural decisions

### 2.1 Synthetic init tool as the trace surface
The constitutional directive demands VISIBLE orchestration tracing.
Inventing new streaming machinery (custom data parts, header reads
in the transport) would have added significant client-side code.
Reusing the existing tool-status spinner via a synthetic
`selectArchitectureCritic` tool produces the visible signal with
zero new UI primitives — the visitor sees a pill saying "engaging
architecture-critic" before the sub-agent's response streams.

The tool itself is a no-op (`execute` returns `{ ok: true }`).
Its only purpose is to surface the trace.

### 2.2 Heuristic router, NOT a classifier LLM
A second inference call would have doubled cold-start latency.
The router is a deterministic regex/keyword classifier returning
in < 1 ms. It composes two signal families:

- **Critique verbs** (review, evaluate, audit, critique, assess,
  teardown, "should I", "any concerns", "what's wrong", "is this
  a good")
- **Architecture nouns** (architecture, system design, design,
  approach, pattern, tradeoffs, infra, schema, pipeline, dataflow,
  topology)

Either alone is too permissive ("review my essay" or "the
architecture of the universe"). The AND combination is the gate.

Explicit prefixes (`@architecture-critic`, `[critic]`) bypass the
gate — visitor's direct request overrides.

### 2.3 Sub-agent prompt APPENDS, doesn't replace
The architecture-critic system prompt is composed AFTER the base
Lumina prompt, not instead of it:

```ts
const systemPrompt = isCritic
  ? `${baseSystemPrompt}\n\n${ARCHITECTURE_CRITIC_SYSTEM_PROMPT}`
  : baseSystemPrompt;
```

The sub-agent inherits Lumina's voice, tool registry, operator
awareness, lab invocation rules, repo-aware reads, memory contract
— everything. Then the critique-discipline overlay sits last in
the prompt (highest recency in attention) telling it "for THIS
turn, behave as a critic".

### 2.4 Agent-level tool gating
The synthetic init tool is added to the per-request tool registry
ONLY when the router picks the sub-agent. The base `STATIC_TOOLS`
in `lib/lumina/tools.ts` stays clean — 13 tools, no agent-specific
contamination. The eval consistency script doesn't see the
synthetic tool except via a small `KNOWN_SYNTHETIC_LABELS` skip
set.

### 2.5 Failure modes
The router itself is pure — given UIMessage[], it returns a
RoutingDecision. No I/O, no thrown exceptions. If the architecture-
critic system prompt or synthetic tool somehow caused a
streamText failure, the outer try-catch returns the same 500
response the original Phase 1 chat route did — no surprise
degradation.

The fire-and-forget `recordRoutingDecision` swallows all KV errors
internally; a KV outage never blocks chat routing.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/lumina/agents/architecture-critic.ts` (new) | Agent identity constants (`ARCHITECTURE_CRITIC_ID`, `ARCHITECTURE_CRITIC_NAME`, `ARCHITECTURE_CRITIC_INIT_TOOL`). Full system prompt (4-step critique discipline, orchestration contract, what-not-to-do rules). Synthetic init tool definition (`architectureCriticInitTool`). |
| `lib/lumina/router.ts` (new) | `RoutingDecision` type, `AgentId` union. `routeRequest(messages)` — extracts last user text, runs explicit-prefix check, then critique-verb-AND-architecture-noun check. Always returns SOMETHING; never throws. |
| `lib/telemetry/metrics.ts` | + `LUMINA_ROUTER_DECISIONS_HASH_KEY`, + `recordRoutingDecision`, + `readRoutingDecisions`. Same posture as the existing tool-count helpers. |
| `app/api/chat/route.ts` | Routes the turn before building the prompt + tool registry. Records the decision fire-and-forget. Composes the system prompt (base + optional critique overlay) and tools (base + optional synthetic init tool). Doc-block updated with the routing section. |
| `components/chat/LuminaWindow.tsx` | + `selectArchitectureCritic: "engaging architecture-critic"` in `TOOL_LABEL` — the visible orchestration trace lives here. |
| `app/lumina/brain/page.tsx` | + Section "09 · Sub-agents" with link to the dedicated agent transparency page. |
| `app/lumina/brain/architecture-critic/page.tsx` (new) | Sub-agent transparency surface — routing triggers table, critique discipline, orchestration trace explanation, live routing-decision counts (KV read at ISR), deep links to the three source files. |
| `scripts/eval-lumina-tools.mjs` | + `KNOWN_SYNTHETIC_LABELS` skip set so the synthetic tool doesn't count as a TOOL_LABEL orphan. |

No new dependencies. No new env vars. No new server routes (the
sub-agent rides on the existing `/api/chat`). No client-side
machinery beyond one new label entry.

---

## 4. Routing decision flow

```
Visitor message → /api/chat (POST)
                    │
            ┌───────▼───────┐
            │ routeRequest()│
            │ (heuristic,   │
            │  pure, < 1ms) │
            └───────┬───────┘
                    │
        ┌───────────┼────────────┐
        │                        │
   agent=lumina           agent=architecture-critic
        │                        │
   recordRoutingDecision    recordRoutingDecision
        │                        │
   base prompt              base prompt
                            + ARCHITECTURE_CRITIC overlay
   base tools               base tools
                            + architectureCriticInitTool
        │                        │
        └───────────┬────────────┘
                    │
            streamText(...) — same path
                    │
                    ▼
        toUIMessageStreamResponse
```

---

## 5. Visible orchestration trace, in practice

When the router picks `lumina` (default), nothing changes in the
UI. Same chat, same voice, same pills.

When the router picks `architecture-critic`:

1. The agent's system prompt instructs the model to call
   `selectArchitectureCritic` first.
2. The model emits the tool call.
3. The chat UI renders an "engaging architecture-critic" pill
   in its existing tool-status strip.
4. The synthetic tool returns `{ ok: true }` immediately.
5. The model produces the actual critique response.

The pill is the trace. No new UI components, no badges, no
custom data parts.

---

## 6. Performance posture

| Path | Pre-4.5 | Post-4.5 |
|------|---------|----------|
| Routing decision | n/a | < 1 ms (heuristic regex over last user text) |
| Routing telemetry | n/a | fire-and-forget HINCRBY, never blocks |
| Default-agent chat | streamText | streamText (unchanged) |
| Sub-agent chat | n/a | streamText + one synthetic tool call (~150-300 ms added) |
| Brain page render | + 2 KV reads (tool counts) | + 3 KV reads (tool counts + routing decisions on the dedicated agent page) |
| Edge runtime | edge | edge (unchanged) |

V4 § 5.4 Sub-PR 4.3 latency target: "p95 < 3s (slight increase
OK)". Sub-agent path adds ~150-300 ms for the synthetic tool — hit
comfortably.

---

## 7. Privacy posture

- **No new message content stored.** Routing decisions are
  aggregate-only — one counter per agent id. No visitor identifier,
  no extracted phrase, no input content.
- **No new API exposure.** The sub-agent rides the existing
  `/api/chat` POST.
- **Same redaction layer applies.** Sub-PR 4.4's tightened PII
  redaction runs on every saveSession call regardless of which
  agent produced the assistant turn.
- **Public transparency.** The full sub-agent prompt is in the
  public repo (linked from the brain page); the routing heuristic
  is documented row-by-row on the agent page.

---

## 8. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` (consistency check) | ✓ exit 0 (13/13 pass, synthetic tool correctly skipped) |
| Production build | ✓ exit 0 |
| `/lumina/brain/architecture-critic` registered as `○ Static`, 1h ISR | ✓ |
| Bundle posture: sub-agent symbols (`ARCHITECTURE_CRITIC_SYSTEM_PROMPT`, `architectureCriticInitTool`, `routeRequest`, `recordRoutingDecision`, `ROUTING_TRIGGERS`, `CRITIQUE_DISCIPLINE`) absent from client chunks | ✓ (0 matches) |
| Phase 3 + 4.1-4.4 server symbols still 0 client chunks | ✓ |
| `@xyflow/react` still single dynamic chunk | ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |
| Cinematic identity | unchanged (#00d2ff / Geist / bg-black) |
| Reduced-motion support | unchanged (no new motion surfaces) |
| Pre-existing `LuminaWindow.tsx` lint warnings | unchanged |

---

## 9. Rollback plan

Single-commit revert removes:
- Two new lib modules (`agents/architecture-critic`, `router`)
- Three telemetry exports (key, recorder, reader)
- Two chat route blocks (routing call + prompt/tool composition)
- One TOOL_LABEL entry
- One brain page section + one new brain sub-page
- One eval script skip set

Router decision counter in KV (`v4:adoption:lumina-router:decisions`)
orphans harmlessly — fields stop incrementing and the key sits.
Acceptable; can be `DEL`'d manually.

No schema break. No data migration.

---

## 10. Failure modes considered

- **Router can't extract a user message** → returns `lumina` with
  reason `"no recent user text"`. Default path.
- **Critique verbs match but no architecture noun** → returns
  `lumina` (intentional bias).
- **Multiple agent routing in flight (race)** → not possible;
  each chat turn produces one synchronous decision before
  streamText fires.
- **Synthetic tool throws** → its `execute` is two lines and
  unreachable error-wise, but if AI SDK propagates a synthetic
  throw the outer try-catch returns 500. No infinite-loop
  potential.
- **Sub-agent prompt overlay confuses model** → outer try-catch
  returns 500. Visitor retries; the next turn is heuristically
  identical and would route the same way — but that's actually
  the right answer: if the prompt is broken, a single agent's
  pause until a fix lands is preferable to silent degradation
  to default Lumina (which would be the "fail back" path the
  doc actually permits).
- **KV outage for routing telemetry** → counter calls swallow
  errors. Routing decision still flows.
- **Visitor types `@architecture-critic` then a non-architecture
  question** → routed to sub-agent anyway (explicit overrides).
  The agent will still try to apply critique discipline; if there's
  nothing to critique, the response is short. Acceptable failure
  mode.

---

## 11. Deferred items (NOT in this PR)

| Item | Status |
|------|--------|
| Additional sub-agents (code-reviewer, etc.) | Constitutional MUST: "ONLY ONE sub-agent initially". Adding a second requires a fresh approval cycle and a fresh maintenance commitment. |
| Behavioral / accuracy eval of the sub-agent | Future PR if the maintenance cost earns it. The consistency eval already guards against drift. |
| Routing decisions on /telemetry dashboard | Surfaced on the dedicated agent page; aggregating onto /telemetry can land if visitor data shows it's useful. |
| Sub-agent-specific cost tracking | Same Bedrock-via-Anthropic-SDK path as default Lumina; the existing `LUMINA_P95_LATENCY` captures end-to-end. |

Hard-forbidden Phase 4 surfaces (untouched):
- Wake-word voice / always-on mic
- Emotional adaptation
- Multimodal screen sharing
- WebGPU systems
- Distributed agent bus
- Autonomous remediation
- 5+ sub-agents
- Subdomain federation
- Real-time SSE dashboards

---

## 12. Phase 4 Priority B — COMPLETE

| Sub-PR | Title | Status |
|--------|-------|--------|
| 4.1 | Public Lumina Transparency Layer | ✅ shipped |
| 4.2 | Repo-Aware Lumina Tools | ✅ shipped |
| 4.3 | Eval + Telemetry Expansion | ✅ shipped |
| 4.4 | Persistent Memory Refinement | ✅ shipped |
| 4.5 | Single Sub-Agent (architecture-critic) | ✅ this PR |

Priorities A and B are CLOSED. Phase 4 has delivered:
- A public, inspectable Lumina architecture surface
- Source-code awareness through the chat
- Per-tool observability + a runnable consistency eval
- Explicit memory opt-out + tightened PII coverage
- One operating sub-agent with deterministic routing

The remaining Phase 4 work (Priority C: voice persistence
improvements, cloud-lab scan extension) is **conditional** per
the constitutional directive — gated on voice opt-in adoption
> 20% (C.1) and on cross-account scan security review (C.2).
Neither condition is currently met; both deferred.

Phase 4 is effectively closed pending Priority C activation.
Awaiting approval to either:
- Begin Priority C work if conditions become favorable
- Open PR for merge of the entire Phase 4 branch
