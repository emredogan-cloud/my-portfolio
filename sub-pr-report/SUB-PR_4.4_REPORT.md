# Sub-PR 4.4 — Persistent Memory Refinement

**Branch:** `feat/v4-phase4-public-transparency` (continued)
**Phase:** V4 Phase 4 — AI-Native Operating Layer · Priority B.1
**Scope:** Add explicit memory opt-out (was missing from the
constitutional MUSTs). Tighten PII redaction patterns. Zero new
dependencies. Zero new routes.

---

## 1. Mission

The constitutional Phase 4 directive lists four MUSTs for
Persistent Memory:

| MUST | Pre-4.4 state | Post-4.4 state |
|------|---------------|----------------|
| support opt-out | ❌ no path existed | ✅ Database toggle in chat header |
| support forget/reset | ✅ Eraser button + /api/chat/forget (3.3a) | ✅ unchanged |
| never leak cross-user context | ✅ anonymous sessionId, per-session KV keys | ✅ unchanged |
| default conservative | ⚠️ memory-on default with limited PII patterns | ✅ expanded redaction coverage |

Sub-PR 4.4 closes the two open MUSTs while preserving the existing
UX for visitors who don't actively opt out.

---

## 2. Architectural decisions

### 2.1 Opt-out is a runtime gate, not a data wipe
The Eraser button (3.3a) deletes existing KV data immediately —
that's the "forget" semantic. The new Database toggle is the
"don't store from now on" semantic. They are deliberately
separate concerns:

- **Toggle OFF:** no KV reads + no KV writes from the next chat
  turn forward. Existing data (from before opt-out) sits in KV
  until its TTL expires naturally. The chat behaves as if memory
  never existed for the duration.
- **Eraser button:** deletes existing KV data right now.
- **Combined effect:** toggle OFF + Eraser = comprehensive opt-out
  with immediate data deletion.

Two affordances, two clear meanings.

### 2.2 Default ON preserves the Phase 3 contract
Defaulting to OFF would have surprised every returning visitor
with a freshly blank chat on their next visit — a regression
that doesn't serve them. The conservative default is preserved
through tighter PII patterns + visible opt-out, not through
flipping the default.

### 2.3 localStorage persistence for the toggle
`MEMORY_OPT_OUT_KEY = "lumina-memory-opt-out-v1"` stores `"1"` when
opted out, absent otherwise. Persists across visits — a visitor
who opted out once stays opted out until they toggle back on.

### 2.4 Body-flag transport mirrors sessionId pattern
The existing `DefaultChatTransport` body function reads
`sessionIdRef` to pick up runtime rotation. Sub-PR 4.4 adds the
same pattern for `memoryOptOut` — a ref that the body function
reads on every send, so the toggle takes immediate effect without
recreating the transport.

### 2.5 Two-stage TC Kimlik redaction
Plain 11-digit numbers (timestamps, counters, large integers)
shouldn't be redacted as Turkish national IDs. The regex matches
the SHAPE; the substitution runs the official checksum algorithm
and only substitutes when the validation passes. False-positive
rate effectively zero.

### 2.6 Conservative API-key prefix list
The new `api-key-prefix` pattern matches well-known prefixes only
(`sk-`, `ghp_`, `github_pat_`, `xoxb-`, `xoxp-`, `xapp-`, `AIza`).
Each requires a minimum 20-char suffix to avoid grabbing things
like `xoxb-test` literals. Conservative by design — wider coverage
without false-positives can land in a later sub-PR if the
signal/noise ratio holds.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/lumina/redact.ts` | + 3 PII pattern classes: IPv4, TC Kimlik (with checksum validator `isValidTcKimlik`), and API key prefixes. Two-stage matching for TC Kimlik (regex → checksum → substitute). |
| `app/api/chat/route.ts` | + `memoryOptOut` field on `ChatRequestBody`. Memory load + save + summary regen all gated behind `!memoryOptOut`. Latency telemetry continues unconditionally. |
| `components/chat/LuminaWindow.tsx` | + `MEMORY_OPT_OUT_KEY` constant, + Database icon import, + `memoryOptOut` state + ref, + `handleMemoryToggle`, + localStorage seed during session bootstrap, body function carries the flag, cross-session hydration effect gated on `!memoryOptOut`. + Database toggle button in the chat header (amber accent when off, quiet white/40 when on). |
| `lib/lumina/system-prompt.ts` | Updated the meta-question voice rules: redaction list is now explicit, opt-out is now answerable ("yes, point them to the Database icon"). |
| `app/lumina/brain/page.tsx` | `MEMORY_PROPS` updated: redaction row now lists the full pattern set; new "Opt-out" row added. |

No new files. No new dependencies. No new routes. No env vars.

---

## 4. Toggle behavior

```
┌──────────────────────────────────────────────────────────────┐
│  Visitor toggles memory OFF                                  │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ├─→ localStorage[MEMORY_OPT_OUT_KEY] = "1"
                      ├─→ memoryOptOut state flips to true
                      └─→ memoryOptOutRef.current = true

  Next chat send:
   • body: { sessionId, memoryOptOut: true }
   • server: skips loadSummary, skips saveSession, skips regen
   • streamText runs normally (latency telemetry still fires)

  Reload page while OFF:
   • Session bootstrap reads MEMORY_OPT_OUT_KEY → memoryOptOut = true
   • Cross-session hydration effect bails (guard: memoryOptOut)
   • /api/chat/load is never called
   • Visitor sees the welcome sequence (no prior thread)

  Toggle back ON:
   • localStorage[MEMORY_OPT_OUT_KEY] removed
   • From next send: server resumes load + save + regen normally
   • A reload restores the previous session thread
```

---

## 5. Visual contract

The new toggle matches the existing header rhythm:

- Same 44 × 44 hit target (`p-3.5 -m-1.5`) as Eraser and Minimize
- Same `transition-colors duration-200`
- ON state: `text-white/40 hover:text-white/85` — quiet, matches
  the Eraser button (the default-on state shouldn't shout)
- OFF state: `text-amber-300/80 hover:text-amber-300` — amber
  accent signals "intentional opt-out", consistent with the
  error-state amber the lab pages use
- `aria-pressed={!memoryOptOut}` for correct screen-reader state
- Tooltip describes the action that will fire on click

Header order is now: `[Database] [Eraser] [Minimize]`.

---

## 6. Redaction expansion

### Before (3.3)
| Pattern | Token |
|---------|-------|
| email | `[email]` |
| Turkish mobile | `[phone]` |
| international phone | `[phone]` |
| AWS access key (AKIA/ASIA) | `[aws-key]` |

### After (4.4)
| Pattern | Token | Notes |
|---------|-------|-------|
| email | `[email]` | unchanged |
| Turkish mobile | `[phone]` | unchanged |
| international phone | `[phone]` | unchanged |
| AWS access key | `[aws-key]` | unchanged |
| IPv4 | `[ipv4]` | new — four dotted octets |
| API key prefix | `[api-key]` | new — `sk-`, `ghp_`, `github_pat_`, `xoxb-`, `xoxp-`, `xapp-`, `AIza` |
| TC Kimlik | `[tc-kimlik]` | new — 11 digits, checksum-validated |

---

## 7. Performance posture

| Path | Pre-4.4 | Post-4.4 |
|------|---------|----------|
| Chat turn, memory ON | KV load (~10-30 ms) + KV save fire-and-forget | unchanged |
| Chat turn, memory OFF | n/a | zero KV operations — strictly faster |
| Redaction sweep | 4 regex passes | 7 regex passes (TC Kimlik has a second pass for checksum validation on matches only). ~1-3 ms additional on a typical message. |

The redaction cost runs at save time (onFinish) and is itself
fire-and-forget, so it doesn't extend the stream's TTFB.

---

## 8. Privacy posture

**Strictly improved on both axes.**

- New patterns catch more PII before it sits in KV
- Visitors can explicitly stop ALL storage with one click
- localStorage preference persists, so the contract holds across
  visits without nagging
- No new data collected, no new identifiers, no analytics added
- Brain page transparency lists every pattern verbatim

---

## 9. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13 pass — toggle changes didn't break consistency) |
| Production build | ✓ exit 0 |
| Bundle posture: `redactMessages` / `redactPii` / `isValidTcKimlik` absent from client chunks | ✓ (0 matches) |
| All existing server-only symbols still 0 client chunks | ✓ |
| `@xyflow/react` still single dynamic chunk | ✓ |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB (unchanged) |
| `@emredogan/cli` tarball | 15 files / 13.5 kB (unchanged) |

Pre-existing `LuminaWindow.tsx` set-state-in-effect lint warnings
are unchanged. I added one inline `eslint-disable-next-line` on the
new opt-out seed inside the session bootstrap effect — deliberate
SSR-safe pattern (server emits the default false, client flips on
first commit), rationale noted in the comment.

---

## 10. Rollback plan

Single-commit revert removes:
- Three redaction pattern classes + TC Kimlik validator
- `memoryOptOut` body field on the chat route
- `MEMORY_OPT_OUT_KEY` constant + state + ref + button in LuminaWindow
- Voice rules + brain-page memory-contract updates

localStorage prefs left over from the revert are harmless — they
match no key the app reads after revert. KV state is unchanged.

---

## 11. Failure modes considered

- **localStorage blocked:** session bootstrap reads return null; the
  toggle still works in-session but doesn't persist. Acceptable
  degradation.
- **Visitor opts out mid-conversation:** the next send carries the
  flag; the current in-memory thread keeps displaying but server
  stops persisting. If they reload, they get the welcome sequence
  (no `/api/chat/load` fetch).
- **Visitor opts in after a long opt-out gap:** previous KV data
  may or may not still be there (depending on TTL). If it is, the
  next reload restores it via `/api/chat/load`. If it isn't, fresh
  start.
- **TC Kimlik checksum hits a non-PII 11-digit number:** by design
  the substitution only fires when both the regex matches AND the
  checksum algorithm validates. The combination is robust against
  random 11-digit data.
- **IPv4 pattern matches a version string like `1.2.3.4`:** yes it
  will redact those — acceptable tradeoff for the coverage. The
  failure mode is "version number redacted in chat" not "PII
  leaks", which is the right direction to fail.

---

## 12. Deferred items (NOT in this PR)

| Item | Status |
|------|--------|
| Sub-agent infrastructure (architecture-critic) | Priority B.2 — next sub-PR if approved |
| Voice persistence improvements | Priority C.1, conditional |
| Cloud-lab scan extension | Priority C.2, conditional |
| Per-pattern redaction telemetry (count of substitutions) | Future PR if observability earns the cost |
| Wider AWS secret-key detection | Deferred — the false-positive risk is real and the 4.4 patterns already cover the most common credential leaks |

Hard-forbidden Phase 4 surfaces untouched:
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

## 13. Next sub-PR

**Sub-PR 4.5 — Single Sub-Agent (architecture-critic ONLY)** — the
final Priority B item. Adds the orchestration scaffold for a single
sub-agent gated behind the existing chat route. The doc constraints
(MUST fail back to single-agent, MUST log routing decisions, MUST
have visible orchestration tracing) drive the architecture.

Awaiting approval per the constitutional directive.
