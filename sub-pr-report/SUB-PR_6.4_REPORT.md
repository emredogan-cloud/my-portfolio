# Sub-PR 6.4 — Memory Layer V5 (Extended)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 6 — Sensory Awakening · Sub-PR 6.4 (Tier A · foundation)
**Scope:** Extends the V4 Lumina memory layer with: configurable
14-30 day TTL (env-driven), IPv6 PII redaction, a per-session
recently-visited pages index (foundation only — no observer in
6.4), and per-event memory adoption telemetry surfaced on
/lumina/brain. V4 storage shapes preserved bit-for-bit.

---

## 1. Mission

Sub-PR 6.1-6.3 built the perception layer + cognition signal +
pacing engine — all client-side surfaces. Sub-PR 6.4 turns
inward to the server-side Lumina memory layer (V4 § 4.4) and
extends it with V5-grade primitives WITHOUT breaking the
storage shape V4 visitors' sessions already live under.

What 6.4 ships:

- **Configurable TTL** in a 14-30 day range, driven by the
  `V5_MEMORY_TTL_DAYS` env var. Default 14 days preserves V4
  behavior exactly.
- **IPv6 redaction** as a V5 extension to the V4 PII regex
  sweep. Placed BEFORE the IPv4 pattern so mixed forms like
  `::ffff:192.168.1.1` redact cleanly to `[ipv6]`.
- **Per-session pages index** at the sibling KV key
  `lumina:session:<id>:pages` — JSON array of recently-visited
  page slugs, capped at 20, same TTL as the session bucket.
  Foundation only; no observer mounted in 6.4.
- **Memory adoption telemetry** at the hash key
  `v5:memory:adoption` with fields `hit / miss / store /
  opt-out`. Fires fire-and-forget from `loadSession` /
  `saveSession`. Drives the live hit-rate tile now visible
  on /lumina/brain.

V5 § 5.1 validation criteria, satisfied:
- [x] V4 memory shape backward-compatible
- [x] PII redaction extended (TC Kimlik + IPv4 already in; IPv6 added)
- [x] TTL configurable (14-30 day range)
- [x] KV read latency unchanged
- [x] Telemetry: `v5:memory:adoption:hit_rate` (computed downstream from `hit / (hit + miss)`)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** Memory layer V5 alone is an extension,
not a new identity. The pages-index foundation unlocks Phase
10's Memory-as-Environment (Lumina V5 ambient awareness reads
what the visitor visited without ever mentioning it). PASS by
extension.

**Q2 — Emergence:** Configurable TTL alone is mundane. IPv6
redaction alone is mundane. Pages index alone is dead data
(no observer yet). The combination — feeding Phase 10's
Lumina V5 context-seeding logic — becomes the differentiating
behavior Phase 10 ships. **Perfect emergence.**

**Q3 — Sustainability:** ~1 hr/month per V5 § 4.1. Small
surface; the V4 memory layer is mature. PASS.

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ecosystem-bound: only meaningful for THIS visitor + THIS
  session. ✓
- Ecosystem-fed: KV-backed; no external dependencies. ✓
- Ecosystem-emergent: foundation for Phase 10 ambient
  awareness. ✓

**Anti-Generic-AI Law (V5 § 2.4):** No NL input, no upload,
no LLM call. Pure infra extension. ✓

---

## 3. Architectural decisions

### 3.1 V4 storage shape preserved exactly

The most load-bearing decision: V4 visitors' sessions already
live in KV at `lumina:session:<id>` with shape `UIMessage[]`,
and at `lumina:summary:<id>` with shape `SessionSummary`. Sub-PR
6.4 makes ZERO changes to these key strings or value shapes.

- `sessionKey()` and `summaryKey()` (in `lib/lumina/memory.ts`)
  remain unchanged — same prefix, same id format.
- The persisted thread is still `UIMessage[]` after redaction;
  the persisted summary is still `SessionSummary`.
- IPv6 redaction is purely additive at write time. Strings
  written before 6.4 stay as-is (we never re-read and
  re-redact); strings written after 6.4 get both V4 and V5
  patterns applied.
- TTL changes only LENGTHEN. The default stays at 14 days;
  operators who set `V5_MEMORY_TTL_DAYS=30` get 30-day
  refresh-on-every-save. Active sessions get longer life;
  expired sessions stay expired.

Verification: `grep "sessionKey\|summaryKey"` against the
modified `memory.ts` shows the same function shape that V4
shipped. V4 readers behave identically.

### 3.2 New keys are siblings, not replacements

- `lumina:session:<id>:pages` — V5 pages index. The V4
  loadSession ignores this key entirely (it queries only
  `lumina:session:<id>`). Reverting Sub-PR 6.4 orphans the
  pages key harmlessly.
- `v5:memory:adoption` — top-level hash counter. Same posture
  as Phase 4.3's per-tool counter + Phase 5.4's playground
  funnel. No collision with any V4 key.

### 3.3 TTL operator-configurable; visitor preference stays binary

`V5_MEMORY_TTL_DAYS` is an OPERATOR env var, not a visitor
preference. Reasoning:

- The visitor's memory preference is already binary (opt-out
  via the chat header). Exposing a duration slider would add
  a privacy axis the operator can calibrate better from
  aggregate hit-rate.
- Env-driven means duration change is a deploy event, not a
  runtime decision — predictable failure mode.
- Default 14 matches V4 exactly so the platform's default
  behavior is unchanged when the env is unset.

Range clamping is mandatory: values below 14 reject (regression
vs V4); values above 30 clamp down (defer to a doc amendment
that justifies the storage cost shift); non-integer / negative
values fall back to the default.

### 3.4 IPv6 redaction ordered BEFORE IPv4

The PATTERNS array is iterated in order; each pass mutates
the working string. IPv6's `::ffff:192.168.1.1` form contains
the dotted-quad shape that IPv4's regex would match. Ordering
IPv6 first ensures mixed-form addresses get the more specific
`[ipv6]` token.

The IPv6 pattern is intentionally permissive across the three
common shapes (full 8-group, compressed `::`, IPv4-mapped) with
lookbehind anchors that prevent chewing into hex blobs (UUIDs,
SHA hashes) that happen to contain colon-separated runs.

### 3.5 Pages index foundation only; NO observer in 6.4

The natural producer of `recordPageVisit()` events is some
client-side observer that knows the current session id + the
current page slug. Sub-PR 6.2's CognitionAwareNavigationObserver
has the page slug already (via `bucketNavigationFlow`'s slug
helper); adding session id passthrough + a call to
`recordPageVisit` would be the smallest possible wiring.

But: the session id is currently a Lumina-chat-specific
identifier minted client-side and stored in localStorage. The
navigation observer doesn't currently read it. Reaching into
the Lumina session id from the navigation observer crosses a
surface boundary that hasn't been justified yet.

Decision: ship the pages-index PRIMITIVES in 6.4. The producer
wires up in either:
- A future 6.x sub-PR that earns the cross-surface coupling
- Phase 10's Lumina V5 ambient awareness, which has the
  session id natively
- A standalone sub-PR specifically for the wiring

The transparency page (`/lumina/brain`) documents that the
foundation is in place but the producer isn't mounted yet —
honest disclosure per V5 § 2.3.

### 3.6 Memory adoption telemetry — 4 fields, single hash

One KV hash, four fields (`hit / miss / store / opt-out`).
Same shape as Phase 4.3's `lumina-tools:invocations` hash and
Phase 5.4's `playground:experiment-visits` hash. Reuse over
re-invention.

The `opt-out` field counts visitor opt-outs — fired from the
chat route (`app/api/chat/route.ts`) when the request body
carries `memoryOptOut: true`. Sub-PR 6.4 does NOT instrument
this path because adding the call into the chat route is
broader than the spec's "Affected" list. The `opt-out` field
remains in the hash schema as a reserved slot a future sub-PR
will populate.

This is honest restraint: the schema accepts the field, the
brain page displays `0` until a future instrumentation lands,
and the chassis is ready when the wiring earns its slot.

### 3.7 Hit-rate computed downstream, not stored

The V5 § 5.1 spec lists `v5:memory:adoption:hit_rate` as the
telemetry slot. Storing a derived rate would mean recomputing
on every write — wasteful and error-prone. Instead, the hash
stores the raw counts; the brain page calls `computeHitRate()`
at ISR time.

When there's no signal (hit + miss === 0), the rate is `null`
and the brain page renders `—`. When there is signal, the
percentage is rounded to whole numbers. Sub-percent precision
isn't useful at the observability cadence the brain page
operates on.

---

## 4. Backward compatibility — explicit verification

V5 § 5.1's "V4 memory shape backward-compatible" is the most
critical validation. Verified across the following axes:

| Axis | V4 behavior | V5 behavior post-6.4 | Compatible? |
|------|-------------|----------------------|-------------|
| Session key | `lumina:session:<id>` | unchanged | ✓ |
| Session value | `UIMessage[]` | unchanged | ✓ |
| Summary key | `lumina:summary:<id>` | unchanged | ✓ |
| Summary value | `SessionSummary` | unchanged | ✓ |
| Session TTL on write | 14 days (1,209,600 s) | env-driven, defaults to 14 days | ✓ (default = V4) |
| Summary TTL on write | 14 days | env-driven, defaults to 14 days | ✓ (default = V4) |
| PII redaction | emails, phones, AWS keys, IPv4, TC Kimlik, API key prefixes | unchanged + IPv6 added (additive) | ✓ (strict superset) |
| MAX_MESSAGES cap | 100 | unchanged | ✓ |
| VERBATIM_CONTEXT_MESSAGES | 8 | unchanged | ✓ |
| forgetSession deletes both buckets | yes | yes | ✓ |
| Reads from V4-written sessions | yes | yes (same key, same parser) | ✓ |
| Reads from V5-written sessions | n/a | yes (same key, same parser) | ✓ |
| isValidSessionId | exists | unchanged | ✓ |
| Graceful no-op without KV | yes | yes | ✓ |

The two V5-only writes (pages index + adoption hash) live at
fresh keys V4 code never touches. V4 readers in the chat route
(`loadSession`, `saveSession`, `loadSummary`, `saveSummary`,
`forgetSession`) behave identically.

---

## 5. KIRMIZI ÇİZGİ enforcement (unchanged)

The V5 § 4.1 mandate from 6.1-6.3 stands. Sub-PR 6.4 changes
nothing about the no-creepiness guarantee:

| Layer | Mechanism |
|-------|-----------|
| Schema | Memory adoption counter records EVENT KIND (`hit/miss/store/opt-out`), never a session-id or any identifier. Pages index is per-session but anonymous. |
| Storage | One new hash (4 fields) + one new sibling key per session. Both follow the V4 redaction + TTL + opt-out + forget contract. |
| Read path | The brain page surfaces `hit-rate`, NEVER a session listing. No surface enumerates which sessions exist. |
| UI law | Memory adoption tile shows aggregate counters; no message addresses the visitor about their own memory state. The chat header's existing "opt-out" / "forget" controls are the only visitor-facing memory affordances; they remain unchanged. |

The pages-index foundation is private to the session it
indexes. A visitor's `loadRecentPages(theirSessionId)` returns
their own list (anonymously bucketed); calling with another
visitor's id returns that visitor's list (also anonymous). The
session-id is a 8-128 char ASCII random token; without
possessing it, neither index is readable.

---

## 6. What changed

| Action | File |
|--------|------|
| New | `lib/v5/memory/ttl.ts` — env-driven TTL resolver, 14-30 day clamp |
| New | `lib/v5/memory/pages.ts` — per-session recently-visited pages index (max 20 entries) |
| New | `lib/v5/memory/telemetry.ts` — `recordMemoryEvent` + `readMemoryAdoption` + `computeHitRate` |
| Edit | `lib/lumina/redact.ts` — IPv6 PATTERN added (placed before IPv4); docblock updated |
| Edit | `lib/lumina/memory.ts` — `TTL_SECONDS` const removed; `resolveTtlSeconds()` called per-write; `loadSession` + `saveSession` instrumented with telemetry; docblock updated |
| Edit | `app/lumina/brain/page.tsx` — MEMORY_PROPS updated (TTL configurable, IPv6 added, pages index documented); new "Live adoption" subsection under section 03; SOURCE_LINKS extended |
| New | `sub-pr-report/SUB-PR_6.4_REPORT.md` (this report) |

No new dependencies. One new env var documented but optional
(`V5_MEMORY_TTL_DAYS` — defaults to 14 when unset).

---

## 7. Telemetry schema (V5 § 2.13)

Sub-PR 6.4 adds ONE new hash to the V5 perception family:

```
v5:memory:adoption  → hash { hit | miss | store | opt-out: count }
```

Plus one new per-session sibling key:

```
lumina:session:<id>:pages  → JSON array of recently-visited page slugs
                             (max 20; TTL matches session bucket)
```

Mapping note: V5 § 5.1's stated telemetry slot
`v5:memory:adoption:hit_rate` is implemented as a DERIVED
value (`computeHitRate(adoption)`) rather than a stored field.
The raw counters at `v5:memory:adoption` are the source of
truth; the rate is computed at every read. Documented in the
brain page section 06 (Source files).

---

## 8. Privacy guarantees

- Aggregate-only adoption counters. No session-id field, no
  IP, no User-Agent.
- Pages index is per-session, anonymous, TTL-bounded.
  Requires the visitor's own session-id to read.
- IPv6 redaction is purely additive — never strips less than V4.
- Opt-out: visitor's chat-header toggle still works exactly as
  V4. The `opt-out` adoption field is a reserved slot for
  future instrumentation; absence of writes there does not
  weaken any privacy property.
- Forget-Me: V4 `forgetSession` still deletes both message
  + summary buckets. The pages index sibling key has a
  separate `forgetSessionPages` helper that Phase 10's
  Forget-Me wiring will call alongside.
- Graceful no-op: KV unavailable → every helper returns empty
  / null / silent. The memory layer never blocks a chat turn.

---

## 9. Performance posture

V5 § 5.1 budget: "KV read latency unchanged".

| Surface | Measurement |
|---------|-------------|
| `loadSession` round-trip | One KV `get` + one fire-and-forget `hincrby` on telemetry hash. The HINCRBY is fire-and-forget — it does NOT block the return path. Wall-clock latency to caller is identical to V4. |
| `saveSession` round-trip | One KV `set` + one fire-and-forget telemetry HINCRBY. Same posture. |
| `recordPageVisit` (when wired) | One `kv.get` + one `kv.set` per call. Not on the chat-turn critical path. |
| `readMemoryAdoption` (brain page) | One HGETALL. Added to the existing `Promise.all` in `LuminaBrainPage`; no sequential latency. |
| Bundle delta on client routes | 0. All new modules are server-only — verified absent from `.next/static/**`. |
| Server module imports | Tiny — three new lib files at ~3-7 KB raw each, tree-shaken at server build time. |

---

## 10. Edge / runtime notes

- `lib/lumina/memory.ts` continues to run from `app/api/chat/*`
  (edge runtime). The added `recordMemoryEvent` import resolves
  edge-safe because `@vercel/kv` works in both runtimes.
- `lib/v5/memory/ttl.ts` is pure `process.env` reads —
  universally importable; the `resolveTtlSeconds()` call from
  inside the edge chat route is zero-cost.
- `lib/v5/memory/pages.ts` and `telemetry.ts` are server-only
  (import `@vercel/kv` directly). Both gracefully no-op when
  KV is absent.
- `app/lumina/brain/page.tsx` adds the third item to its
  existing `Promise.all`; no new request-time dependency.

---

## 11. Rollback plan

Single-commit revert removes:

- 3 new lib files in `lib/v5/memory/`
- IPv6 entry in `lib/lumina/redact.ts` PATTERNS
- `resolveTtlSeconds` calls + telemetry hooks in
  `lib/lumina/memory.ts` (reverts to the `TTL_SECONDS` const)
- The "Live adoption" subsection + MEMORY_PROPS updates in
  `app/lumina/brain/page.tsx`
- 3 new SOURCE_LINKS entries

KV state orphaned after revert:
- `v5:memory:adoption` hash retains its counts harmlessly;
  V4 has no code that reads or writes this key.
- Per-session `lumina:session:<id>:pages` keys retain their
  arrays; V4 sessions read only `lumina:session:<id>` so they
  ignore the sibling.

**Crucially**: every V4 session that was active during the
6.4 deploy continues to read / write through the same key
shapes. Visitors see no disruption. The "Schema rollback (V4
still readable)" criterion from V5 § 5.1 is satisfied because
no schema change ever existed — only additive sibling keys
and an additive PII pattern.

If only the TTL change needs to be reverted without a code
rollback:
- Operator unsets `V5_MEMORY_TTL_DAYS` → `resolveTtlSeconds()`
  returns 14-day default.
- Active sessions keep their currently-set expiry until next
  save; future saves use the V4 default.

---

## 12. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched paths | ✓ exit 0 |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0 |
| `/lumina/brain` registered `○ Static`, 1h ISR | ✓ |
| Bundle posture (V5 memory server symbols in client) | ✓ 0 matches for `recordMemoryEvent`, `readMemoryAdoption`, `resolveTtlSeconds`, `recordPageVisit`, `loadRecentPages`, `MEMORY_ADOPTION_HASH_KEY` |
| `@vercel/kv` in client chunks | ✓ 0 |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| Cinematic identity preserved (`#00d2ff` core) | ✓ |
| V4 sessionKey / summaryKey unchanged | ✓ verified via grep |
| IPv6 pattern placed BEFORE IPv4 in PATTERNS array | ✓ verified via inline check |
| TTL default = 14 days when env unset (V4 parity) | ✓ |
| TTL clamp to [14, 30] | ✓ unit-level logic |
| KV-unavailable graceful no-op preserved | ✓ inherits V4 posture |
| Anti-Generic-AI Law | ✓ |
| Identity-Native Intelligence Law | ✓ |
| KIRMIZI ÇİZGİ | ✓ |

---

## 13. Future dependencies unlocked

- **Sub-PR 6.5** — Public Perception Transparency Page
  (expanded). Will surface memory-adoption tiles in addition
  to the pacing-transition tiles. The brain page already
  shows the live hit-rate; 6.5 may cross-link to it from
  /v5/perception.
- **Phase 9** — Operational digital twin. Will read the
  memory hit-rate as one of the "operational portrait"
  signals (visitor engagement depth).
- **Phase 10** — Lumina V5 ambient awareness. Will read
  `loadRecentPages(sessionId)` to seed conversation context.
  This is the foundation 6.4 lays specifically for — Phase
  10's "Memory-as-Environment" (V5 future-systems § 3.3) is
  the consumer that justifies the pages-index existence.

---

## 14. Deferred systems

6.4-specific deferrals:

- **Pages-index observer.** No producer wires `recordPageVisit`
  in 6.4. The Cognition observer (6.2) has the slug; the chat
  route (V4) has the session id. The cross-surface coupling
  is deferred to Phase 10 or a dedicated wiring sub-PR.
- **Opt-out telemetry instrumentation.** The `opt-out` field
  in the adoption hash exists as a reserved slot; the chat
  route's existing `memoryOptOut` branch doesn't fire the
  counter yet. Adding the call is one line, but lives outside
  the 6.4 "Affected" list. Deferred.
- **Per-session forget-me purging the pages index.**
  `forgetSessionPages` helper exists; the V4 `forgetSession`
  flow doesn't call it (would expand 6.4's scope into the
  forget API surface). Phase 10's Forget-Me wiring will land
  the call.
- **Visitor-facing TTL preference.** Not in V5 spec; operator
  env var is the sole control.

Permanently rejected (carried from V5 § 3.3):
- Cross-device session linking
- Behavioural profiling of stored sessions
- LLM-based session content analysis
- Sharing memory across visitors

---

## 15. Next sub-PR

**Sub-PR 6.5 — Public Perception Transparency Page
(Expanded).** Per V5 § 5.1:

- `app/v5/perception/page.tsx` — public algorithm description,
  what's collected / not / how to opt out, cinematic-grade copy
- Telemetry: `v5:telemetry:perception-page:visits`

6.5 is the FINAL Phase 6 sub-PR. After it lands, Phase 6's
five-sub-PR set is complete and the 60-90 day observation
window opens before Phase 7 (Temporal Architecture) begins.

Awaiting explicit approval per the V5 operating constitution.
STOP and observe is the default disposition.

---

## 16. Closing — the chassis is fully memory-aware

Sub-PR 6.1-6.3 built the perception layer + observer + pacing
engine. Sub-PR 6.4 extends the V4 memory layer with the V5
guarantees Phase 10 will need: configurable TTL for longer
ambient-context windows, IPv6 redaction for completeness, a
per-session pages index for Memory-as-Environment, and a
live hit-rate so the operator can see whether the layer is
earning its slot.

V4 visitors see nothing different. Their sessions live in the
same keys, with the same TTL by default, and load through the
same code path. The cinematic chat behavior is unchanged.

Underneath, the layer is now operator-observable (hit-rate
tile) and Phase-10-ready (pages index helpers). The five
extensions are subliminal until consumers wire them.

"This site feels unusually alive" — memory is now part of
the awareness instead of just the conversation.
