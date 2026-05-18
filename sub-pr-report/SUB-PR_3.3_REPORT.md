# Sub-PR 3.3 — Lumina V3: Persistent Memory

**Branch:** `feat/v4-phase3-operator-systems`
**Phase:** V4 Phase 3 — AI-Native Operator Systems (user-reframed)
**Scope:** Server-side memory contract. PII redaction, 14-day TTL,
8-turn verbatim cap with Haiku-generated session summary.
Zero new dependencies. Zero client-bundle delta. No UI change.

---

## 1. Mission

Sub-PR 3.1 taught Lumina to *read* the platform. 3.2 taught her to
*operate* it. 3.3 teaches her to *remember* — but in a strictly
operator-grade way:

- The visitor's conversation persists across visits.
- Personally-identifying material (emails, phone numbers, AWS access
  keys) is redacted before storage, so KV never holds raw PII.
- Long threads don't bleed cost: only the last 8 turns are fed to
  the model verbatim. Older turns are folded into a 2-3 sentence
  factual recap that sits in the system prompt as "Earlier in this
  session" context.

The visitor sees no UI difference. There is no "I remember you"
greeting, no profile card, no settings page, no memory-inspection
modal. Memory is invisible plumbing that makes long conversations
cheaper and prior-context references cleaner.

Operator console memory, not personality product.

---

## 2. Pre-3.3 baseline

The chat already had session persistence (lib/lumina/memory.ts):
- Anonymous sessionId minted client-side, kept in localStorage.
- KV-backed thread, 7-day TTL, 100-message cap.
- Full UIMessage[] stored verbatim including any PII.
- `/api/chat/load` rehydrates on cold mount.

3.3 keeps this contract but tightens three corners and adds one
new layer.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/lumina/redact.ts` (new) | Regex-based PII sweep. Email, Turkish mobile, international phone, AWS access keys (AKIA / ASIA). Exported `redactPii(string)` and `redactMessages(UIMessage[])`. Pure functions, no I/O. |
| `lib/lumina/memory.ts` | TTL 7→14 days. `saveSession` runs `redactMessages` before KV write. Added `loadSummary` / `saveSummary` for the parallel summary cache. Added `SessionSummary` type and `VERBATIM_CONTEXT_MESSAGES = 8` export. |
| `lib/lumina/summarize.ts` (new) | `maybeRegenerateSummary(sessionId, messages)`. Reads existing summary, decides via `shouldRegenerate` (first hit: thread > 8; subsequent: gap ≥ 4 turns), serializes older turns to plain text (cap 6 KB), calls Haiku 4.5 with a strict 2-3 sentence system prompt, persists via `saveSummary`. Fire-and-forget — every error path swallows silently. |
| `lib/lumina/system-prompt.ts` | New `## Session memory` block with voice rules for memory-related queries and prior-context integration. New `buildSessionMemoryNote(summary)` helper composes the "Earlier in this session" prefix. `buildLuminaSystemPrompt` now takes an optional summary parameter. |
| `app/api/chat/route.ts` | On request: if `messages.length > 8`, load summary and trim verbatim block. Build prompt with summary injection. On `onFinish`: persist (already there, now redacts via memory.ts) and fire-and-forget `maybeRegenerateSummary`. |

**Not touched:** `app/api/chat/load/route.ts` keeps returning the
full thread (UI shows everything). `components/chat/LuminaWindow.tsx`
unchanged. Tools registry unchanged.

---

## 4. Architecture

```
                        ┌──────────────────────────────────────┐
                        │  Visitor message → /api/chat (POST)  │
                        └────────────────┬─────────────────────┘
                                         │
                              ┌──────────▼──────────────────────────┐
                              │ Trim: messages.slice(-8) if > 8     │
                              │ Load summary if > 8                 │
                              │ Build system prompt with recap      │
                              └──────────┬──────────────────────────┘
                                         │
                              ┌──────────▼──────────────────┐
                              │ streamText(model, system,   │
                              │   messages, tools)          │
                              └──────────┬──────────────────┘
                                         │  stream response
                              ┌──────────▼──────────────────┐
                              │ onFinish:                   │
                              │   1. record latency         │
                              │   2. saveSession (redacts)  │
                              │   3. maybeRegenerateSummary │
                              │      (fire-and-forget)      │
                              └─────────────────────────────┘
```

### KV namespace

```
lumina:session:<id>   →  UIMessage[]                  (14-day TTL, redacted)
lumina:summary:<id>   →  { summary, threadLength,     (14-day TTL)
                            generatedAt }
```

Two parallel keys per session — they refresh independently. A
session that grows past 12 turns gets a summary; a session that
abandons before 8 turns never spends a Haiku token on summarization.

### Redaction patterns

| Pattern | Token | Notes |
|---------|-------|-------|
| Email | `[email]` | Conservative match: local-part + `@` + domain + TLD |
| Turkish mobile | `[phone]` | `+90`, `0090`, or `0` prefix; runs FIRST so more-specific wins |
| International phone | `[phone]` | `+CC` + 6-14 digits; runs after Turkish |
| AWS access key | `[aws-key]` | `AKIA…` or `ASIA…` + 16 alphanumerics |

Intentionally NOT redacted:
- AWS secret keys (40-char base64 — too easy to false-positive on hashes)
- Credit cards (fragile Luhn detection, low real-world rate)
- Names (probabilistic, would corrupt normal conversation)
- URLs (GitHub URLs needed for the Commit Narrator tool)

### Summarization cadence

- **First summary:** thread reaches 12 messages (8 verbatim + 4 older).
- **Subsequent regens:** older-turn count grows by ≥ 4 since the
  cached summary. So a chatty 60-turn session triggers ~13 Haiku
  calls over its lifetime, each ≈ $0.0001.
- **Net cost effect:** positive. Cutting 60 → 8 verbatim turns
  saves vastly more than the summarization spend on every
  subsequent chat turn.

---

## 5. Invariants verified

| Invariant                                                                       | Status |
|---------------------------------------------------------------------------------|--------|
| `tsc --noEmit` clean across the project                                         | ✓ exit 0 |
| `eslint` clean on touched files                                                 | ✓ exit 0 |
| Production build green — all routes intact                                      | ✓ exit 0 |
| Zero new npm dependencies                                                       | ✓      |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` absent from client chunks       | ✓ (0 matches) |
| Operator + lab server symbols absent from client chunks                         | ✓ (0 matches) |
| Memory + redact server symbols (`redactMessages`, `redactPii`, `maybeRegenerateSummary`, `loadSummary`, `saveSummary`, `VERBATIM_CONTEXT_MESSAGES`) absent from client chunks | ✓ (0 matches) |
| `@xyflow/react` still single dynamic chunk                                      | ✓      |
| `@emredogan/lumina-chat` tarball: 29 files / 23.7 kB                            | ✓ unchanged |
| `@emredogan/cli` tarball: 15 files / 13.5 kB                                    | ✓ unchanged |
| Cinematic identity: `#00d2ff`, Geist, `bg-black`                                | ✓ no visual changes |
| Chat route runtime still `edge`                                                 | ✓      |

### Pre-existing carry-over (NOT introduced by 3.3)

`components/chat/LuminaWindow.tsx` 4 pre-existing `react-hooks/set-state-in-effect`
lint warnings survive unchanged. Out of scope here.

---

## 6. Cost + latency posture

### Per-request memory cost

- **Short conversations (≤ 8 turns):** zero memory overhead beyond
  what was already paid in Phase 2. No summary read, no summarization.
- **Long conversations (> 8 turns):** one KV read (~10-30 ms warm) to
  fetch the cached summary, prepended to the system prompt
  (negligible token bump).
- **Save-side:** redaction is regex-only, ~1 ms for typical message
  sizes. Summary regen fires fire-and-forget — never blocks the
  response close.

### Per-turn token savings

| Thread size | Pre-3.3 model context | Post-3.3 model context | Saving |
|-------------|-----------------------|------------------------|--------|
| 10 turns    | 10 × ~300 tok = 3 KB  | 8 × ~300 tok + summary ~200 tok = 2.6 KB | ~15% |
| 30 turns    | 30 × ~300 tok = 9 KB  | 8 × ~300 tok + summary ~200 tok = 2.6 KB | ~70% |
| 100 turns   | 100 × ~300 tok = 30 KB | 8 × ~300 tok + summary ~200 tok = 2.6 KB | ~91% |

The savings compound across every subsequent turn — a 30-turn
conversation that continues to turn 50 saves ~70% of input tokens
on every one of those next 20 turns.

### Summarization cost

- Haiku 4.5 input ≈ 6 KB max, output capped at 200 tokens.
- ≈ $0.0001 per regen call.
- ≈ $0.001-0.002 total over a ~60-turn conversation.
- Net cost: negative (savings dominate).

---

## 7. Voice + framing guardrails

The new `## Session memory` block in the system prompt is strict
because memory is the surface where Lumina is most likely to drift
into AI-girlfriend energy. Hard rules verbatim:

- "Do not announce 'I remember our prior conversation' or any other
  memory theatrics."
- "Do NOT reach into the recap for unprompted callbacks ('by the way,
  you mentioned…')."
- "Never quote the recap verbatim back at the visitor. Speak from
  it; don't read from it."
- Meta-questions ("what do you store about me?", "forget what I told
  you") get plain factual answers. No marketing, no privacy-policy
  copy.

These rules apply to the model. The underlying infrastructure is
already non-theatrical by construction — no UI changes, no banners,
no toasts.

---

## 8. Rollback

Single-commit revert restores prior state.

- New files (`redact.ts`, `summarize.ts`) are clean deletes.
- `memory.ts` reverts to 7-day TTL and a `saveSession` without
  redaction. The KV namespace tolerates either: old saves are
  redacted-clean by construction, and the `lumina:summary:*` keys
  are independent and would just sit unused (expiring naturally in
  14 days).
- System prompt reverts: the `## Session memory` section, the
  `buildSessionMemoryNote` helper, and the optional `sessionSummary`
  parameter on `buildLuminaSystemPrompt` all delete cleanly.
- Chat route: revert the load-summary / trim-verbatim / regen-tail
  block, plus the import additions.

No data migration needed. Existing 7-day sessions in production
will continue to be readable; the new code path treats their
`threadLength` mismatch as "regenerate" on the next save.

---

## 9. Out-of-scope acknowledgements

- **Vector recall**: not added. Threads are still chronological-only.
  V4 § 4.4 contemplated vector upgrade as a future option (Upstash
  Vector); not justified by current usage.
- **Memory inspection UI**: explicitly chosen NOT to ship. The user's
  Phase 3 brief warns against memory theatrics; a "view stored data"
  modal would cross that line. Visitors who want explicit deletion
  can use /contact (system prompt directs them there).
- **Cross-device recall**: not added. Session ids are localStorage-bound;
  switching devices yields a new session. Adding cross-device would
  require auth — out of scope for an anonymous chat surface.
- **Per-conversation cost / token metrics**: not split out. The
  existing telemetry (`LUMINA_P95_LATENCY`) captures end-to-end
  latency which will improve as the verbatim-cap kicks in on long
  threads; that's the visible upside without needing a new metric.

---

## 10. Remaining Phase 3 plan

| Sub-PR | Title                        | Status      |
|--------|------------------------------|-------------|
| 3.1    | Operator Awareness           | ✅ shipped   |
| 3.2    | Lab Invocation               | ✅ shipped   |
| 3.3    | Persistent Memory            | ✅ this PR   |
| 3.4    | Voice Persistent Button      | next (V4 § 4.4 Sub-PR 4.4 — ElevenLabs STT round-trip in the chat input) |
| 3.5    | Cloud Lab MVP                | (V4 § 4.4 Sub-PR 4.5 — authenticated Bedrock-against-visitor's-own-AWS surface) |

Each remaining sub-PR is human-gated. No code on 3.4 until approval.
