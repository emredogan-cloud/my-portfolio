# Sub-PR 10.2 — Ambient Operator Awareness (silent context injection)

**Branch:** `feat/v4-phase5-experimental-foundation`
**Phase:** V5 Phase 10 — Ambient Intelligence Layer ·
Sub-PR 10.2 (Consumer tier · first visible consumer of
the 10.1 foundation)
**Scope:** Lumina's chat route consumes the Phase 10.1
`AmbientContext` registry as an internal anchoring signal
in its system prompt. **Lumina is structurally instructed
to USE the context but NEVER surface it.** Default behavior
(flag OFF) is byte-identical to V4. Flag-ON adds a
self-contained ambient block with hard prohibitions.

---

## 1. Mission

V5 § 4.5 framed the eventual Phase 10 manifestation:

> Lumina V5: visitor'ın mevcut session pacing'ini (Phase 6
> perception) kullanarak conversation context'i seed eder.
> Visitor 8 dakika /architecture'da kaldıktan sonra
> Lumina'ya yazdığında, Lumina'nın internal context'i bunu
> "biliyor" ama **asla mention etmiyor**.

The user's revised Phase 10 brief (10.1 entry brief)
tightens this:

> Visitors should eventually feel:
> "This ecosystem somehow adapts to context naturally."
> NOT:
> "This site is analyzing me."

Sub-PR 10.2 ships the FIRST visible consumer of the
Phase 10.1 foundation:

1. **Operator awareness only** — Lumina reads aggregate
   ECOSYSTEM context (commits, infrastructure, experiments,
   planned items, topology, week, day). It does NOT read
   per-visitor session signals (those would be 10.3
   territory or never).
2. **Silent injection** — the ambient context appears in
   Lumina's system prompt as an INTERNAL anchoring block
   with explicit hard rules: "USE for anchoring; NEVER
   surface, quote, reference, or recite".
3. **Flag-gated** — V5_AMBIENT_ENABLED (declared in 10.1)
   gates the injection. Flag OFF (production default) →
   byte-identical V4 chat behavior.
4. **Telemetry** — new `v5:lumina-v5:ambient` hash with 3
   event kinds covering all chat-turn paths.

Aligned to V5 § 2.11 Lumina invariants:

> ✅ Lumina V5 ambient awareness: visitor session pacing'i
> okur ama ASLA bir greeting'de mention etmez ("noticed
> you spent 8 minutes on architecture..." YASAK; "fastest
> way to see X work is..." OK)

---

## 2. The Three-Question Test (V5 § 1.1)

**Q1 — Uniqueness:** A chat assistant whose system prompt
silently incorporates the ecosystem's aggregate operational
state — current week's commit ordinal, running experiment
names, planned-next items, topology shape — and is
explicitly instructed via hard prohibitions to USE this
context for response anchoring but NEVER surface it to the
visitor is unusual. Generic chatbots either (a) carry no
operator context, or (b) recite it visibly ("here's what's
happening"). Lumina 10.2 carries it INVISIBLY. **PASS.**

**Q2 — Emergence:** Zero standalone value. The ambient
context comes from Phase 10.1's registry, which projects
data from Phases 6-9. Lumina's prompt augmentation only
makes sense in the context of THIS portfolio's
operational twin + journal + topology + perception
ecosystem. Outside this ecosystem the augmentation has
nothing to project. **Perfect emergence.**

**Q3 — Sustainability:** ~0.5 hr/mo projected. The
augmentation surface is one new module + 3 minimal edits;
no recurring maintenance burden beyond occasional prompt
tuning. **PASS.**

**Identity-Native Intelligence Law (V5 § 2.15):**
- Ekosistem-bağımlı: the ambient context Lumina reads is
  THIS ecosystem's operating state. ✓
- Ekosistem-fed: zero external inputs into the augmentation.
  All data sourced via Phase 10.1's registry, which itself
  reads operator-side Phase 6-9 sources. ✓
- Ekosistem-emergent: meaningless without Phase 10.1
  foundation + Phases 6-9 sources. ✓

**Anti-Generic-AI Law (V5 § 2.4):**
- No NL input transformation, no upload, no generic LLM
  completion request added.
- The augmentation is templated string assembly composed
  from typed primitives. The block's prose is fixed; only
  the data values vary.
- The journal narrative (Phase 9.3) referenced in the
  block is itself templated (no LLM in its generation). ✓

**Phase 10 KIRMIZI ÇİZGİ:**
- Not personalization marketing — ✓ Lumina cannot adapt to
  the visitor based on the block; the block carries
  operator state only
- Not surveillance — ✓ no per-visitor field consumed
- Not behavioral manipulation — ✓ the block carries
  anchoring data, not manipulation primitives
- Not emotional engineering — ✓ ordinal intensities only;
  no quantitative emotional signals
- "Creepy" prevention — ✓ explicit hard rules prohibit
  Lumina from surfacing the awareness

---

## 3. Architectural decisions

### 3.1 Single integration point at the prompt boundary

Lumina's `buildLuminaSystemPrompt(now, summary)` at
`lib/lumina/system-prompt.ts:609` is the SINGLE composition
point for every chat turn. Extending its signature with
one optional third parameter is the minimal-edit way to
add ambient awareness:

```ts
export function buildLuminaSystemPrompt(
  now: Date,
  sessionSummary?: string | null,
  ambientContext?: AmbientContext | null,  // NEW
): string
```

The signature stays backward-compatible: every existing
caller that passes 1 or 2 arguments behaves identically.
Only the chat route (the one caller that has access to
the ambient context) passes the third argument.

### 3.2 Honest absence over fake state

`buildAmbientContextNote(context)` returns the empty string
when:
- `context === null` (flag OFF in route, or compose
  failed)
- `context.flag_enabled === false` (caller passed a
  context but the flag is off)

Empty string = byte-identical V4 prompt. This is
load-bearing: any consumer of the prompt builder MUST
get the same prompt whether they pass `undefined` /
`null` / `{ flag_enabled: false, ... }`. Behaviour
parity = privacy parity.

Validated via direct prompt-builder unit check:
- Baseline (no ambient): 28,016 chars, no block
- Context PASSED but flag OFF: 28,016 chars, no block,
  **byte-identical** to baseline
- Flag ON: 30,790 chars (+2,774), block present

### 3.3 Self-contained block with hard prohibitions

The ambient block is ~80 lines containing:

1. **Boundary markers**: 60-column `===` rules + header
   "AMBIENT OPERATOR CONTEXT — INTERNAL READ ONLY".
2. **Absolute prohibitions** (5 explicit rules):
   - DO NOT say "I see / I notice / Looking at / Based
     on the latest / It looks like..."
   - DO NOT mention ambient context, operational twin,
     JSON feed, journal, or any telemetry surface unless
     explicitly asked by name.
   - DO NOT recite numerical values from this block.
   - DO NOT use "currently / right now / lately / today"
     in a way that implies live ecosystem awareness.
   - DO NOT adapt to the visitor based on this context
     (no per-visitor personalisation).
3. **Permitted uses** (3 explicit rules):
   - Choose WHICH project/experiment/system to mention
     first (prefer items the block lists as active).
   - Pick framing aligned with current operator focus.
   - Behave identically when the block is absent.
4. **Rendered state** (compact, only sub-domains with
   signal):
   - System flags active
   - Topology validator status
   - Runtime + env
   - ISO week + day of week
   - Evolution registry summary
   - Topology graph counts
   - Operational state (weekly commits ordinal, infra,
     experiments, planned, latest narrative)
   - Perception signal (when present)

The prohibitions are REPEATED + scoped. LLM attention to
negative instructions has historically been weaker than to
positive instructions; the structural repetition reduces
risk of accidental surfacing.

### 3.4 The block's data is OPERATOR-side

Critical: the ambient block carries ZERO per-visitor data.
Every line in the rendered state reflects ECOSYSTEM-wide
aggregate state:

| Line | Source | Visitor specificity |
|------|--------|---------------------|
| System flags active | `process.env` | none |
| Topology validator | build-time | none |
| Runtime + env | `process.env` | none |
| ISO week + day | wall-clock | none |
| Evolution registry | build-time | none |
| Topology graph counts | build-time | none |
| Operational ordinal + counts | Phase 9.1 composer (operator-side) | none |
| Latest journal narrative | Phase 9.3 templated (operator-side) | none |
| Perception aggregates | Phase 6.1 HINCRBY hashes (aggregate) | none — sums over all visitors |

The block does NOT contain:
- Visitor IP, User-Agent, locale
- Visitor session id
- Visitor's prior message content
- Visitor's navigation path
- Visitor's dwell time
- Visitor's referrer
- Visitor's device characteristics

The strongest cross-visitor signal that enters the block is
the AGGREGATE perception count (e.g., "navigation signal:
medium, perception categories: dwell-time, scroll-velocity").
This is the same data the public `/v5/perception`
transparency page displays — already-public, already-
aggregate. The block carries no information not already
public.

### 3.5 Parallel I/O fan-out in the chat route

The chat route previously did one `loadSummary` await
sequentially. 10.2 adds `composeAmbientContext` as a
sibling await wrapped in `Promise.all`:

```ts
const [summaryRecord, ambientContext] = await Promise.all([
  /* memory load */,
  wantsAmbient ? composeAmbientContext().catch(() => null) : null,
]);
```

Wall-clock cost:
- Flag OFF (production default): summary load only
  (~20-50ms). **Zero ambient cost.**
- Flag ON, operating flag OFF: summary load + cheap
  compose. `max(~20-50ms, ~5-20ms) = ~20-50ms`. **Zero
  delta.**
- Flag ON, operating flag ON: summary load + expensive
  compose. `max(~20-50ms, ~150-300ms) = ~150-300ms`.
  **Adds ~100-250ms.**

The Phase 10.2 worst-case latency (flag ON + operating
flag ON) stays within V5 § 2.7's 500ms Lumina hard limit.
Operator can revert via flag-off without restart.

### 3.6 Catch-then-null on compose failure

```ts
wantsAmbient
  ? composeAmbientContext().catch((): AmbientContext | null => null)
  : Promise.resolve(null)
```

If the composer throws (highly unlikely; every integration
view is itself catch-wrapped), the chat path receives null
and falls through to byte-identical V4 behavior. The
chat turn NEVER fails because of ambient compose; ambient
is decorative, not load-bearing.

### 3.7 Separate Lumina-side telemetry hash

Phase 10.1 declared `v5:ambient:adoption` with 4 event
kinds focused on FOUNDATION health (`context_composed`,
`domain_view_resolved`, `domain_view_missing`,
`context_endpoint_view`). Sub-PR 10.2's consumption is a
DIFFERENT signal — "how often does the chat surface
ACTUALLY consume the ambient context".

To keep 10.1's telemetry contract closed (no new event
kinds added to the existing closed allow-list), 10.2
introduces a parallel hash:

```
v5:lumina-v5:ambient  → hash {
  context_consumed     : flag ON + compose succeeded
                          + prompt block added
  context_unavailable  : flag ON but compose failed
                          (prompt block omitted)
  context_skipped      : flag OFF — no compose attempted
                          (production default)
}
```

Per V5 § 2.13's schema convention
(`v5:lumina-v5:<dimension>:<value>`). One hash, three
event kinds, no per-visitor field. The three kinds cover
every chat-turn code path; the operator's
`context_consumed / (context_consumed + context_skipped)`
ratio is the adoption metric.

### 3.8 No prompt template duplication

The ambient block lives in `lib/lumina/ambient-context.ts`
(new module). The prompt builder imports it. Single source
of truth: the prompt block, the hard prohibitions, and
the rendering helpers all live in one ~250-line file.

The system prompt at `lib/lumina/system-prompt.ts` adds
ONE import + adds ONE parameter to the existing function
+ adds ONE line to the prompt composition. The diff is
load-bearing surgical.

### 3.9 No edits to existing telemetry, no edits to existing endpoints

Sub-PR 10.2 makes ZERO changes to:
- `/api/v5/ambient/context` or `/api/v5/ambient/event` (10.1
  endpoints unchanged)
- `v5:ambient:adoption` hash (10.1 telemetry unchanged)
- Any other V5 namespace (perception, temporal, topology,
  operating, journal, aura, contact)
- Any V4 telemetry or KV key
- Any client-side code (the prompt augmentation is
  server-side only)

The only behavioral delta to existing surfaces is:
- The chat route imports 4 new symbols.
- The system prompt builder accepts an optional 3rd arg.
- A new KV hash gets written when chat turns run.

### 3.10 What 10.2 deliberately makes IMPOSSIBLE

- **Per-visitor personalisation** — block carries operator
  state; no visitor identifier consumed.
- **Lumina surfacing the ambient awareness** — explicit
  hard rules prohibit; reinforced by 5 absolute
  prohibitions + 3 permitted-uses framings.
- **Lumina pretending the block doesn't exist when asked
  directly** — the block sits in the system prompt; if
  the visitor asks "do you have access to live ecosystem
  data", Lumina's identity prompt's existing rules apply
  (operator-awareness tool semantics — answer plainly).
- **Behavior divergence on flag toggle** — flag OFF is
  byte-identical V4 prompt; flag ON adds the block but
  prohibits surfacing. The visitor cannot detect the
  flag's state from chat behavior alone.
- **Generic LLM consumption** — every block field comes
  from typed primitives; no free-form text injected.

---

## 4. KIRMIZI ÇİZGİ enforcement

Phase 10 brief's structural prohibitions, mapped to 10.2
safeguards:

| Risk | Mitigation in 10.2 |
|------|--------------------|
| Lumina says "I noticed you..." / "I see that..." | Explicit hard rule in the block: "DO NOT say I see / I notice / Looking at the data / Based on the latest" |
| Lumina reveals telemetry awareness | Hard rule: "DO NOT mention the ambient context, the operational twin, the JSON feed, the journal, or any platform telemetry surface UNLESS asked by name" |
| Lumina recites numerical values | Hard rule: "DO NOT recite numerical values from this block. Quote values only when the operator-awareness tools elsewhere in this prompt would have surfaced the same data via their own invocation" |
| Lumina sounds like live telemetry | Hard rule: "DO NOT use 'currently / right now / lately / today' in a way that implies live ecosystem awareness" |
| Per-visitor personalisation | Hard rule: "DO NOT adapt to the visitor based on this context. No 'for someone like you' framing" |
| Visitor detects flag toggle | Byte-identical prompt when flag OFF (validated via 28,016 char baseline parity check) |
| Generic LLM call in augmentation path | Pure template assembly; no LLM in the ambient render |
| Maintenance burden | New module is self-contained; rollback is single-commit revert |
| Latency degradation | Compose parallel with memory load; <500ms hard limit preserved per V5 § 2.7 |
| Cross-version drift | Backward-compatible signature (optional 3rd param) |

The block's 5 absolute prohibitions + 3 permitted-uses
framings + boundary markers form structural defense
against the "creepy" failure mode. The block design
explicitly anticipates LLM attention's weakness on
negative instructions through repetition + scoping +
positive-framing alternatives.

---

## 5. What changed

| Action | File |
|--------|------|
| New | `lib/lumina/ambient-context.ts` (renderer + Lumina-side telemetry) |
| Edit | `lib/lumina/system-prompt.ts` (import + optional 3rd param to `buildLuminaSystemPrompt` + 1 line in composition) |
| Edit | `app/api/chat/route.ts` (4 new imports + `Promise.all` extension + 3-branch telemetry fire + 1-line prompt builder call extension) |
| New | `sub-pr-report/SUB-PR_10.2_REPORT.md` (this report) |

**No new dependencies.** Imports `@vercel/kv` (already in
tree) + Phase 10.1 symbols (just shipped).

**No new endpoints.** The chat route already exists.

**No client-side code added.** The prompt augmentation is
server-side; visitors see Lumina's responses unchanged
in structure.

---

## 6. Telemetry schema

Added by 10.2:

```
v5:lumina-v5:ambient  → hash {
  context_consumed     : chat turn ran with ambient flag ON
                          + compose succeeded + prompt
                          block was added
  context_unavailable  : chat turn ran with ambient flag ON
                          but compose returned null/failed;
                          chat still ran without the block
  context_skipped      : chat turn ran with ambient flag OFF
                          — no compose attempted (production
                          default)
}
```

The hash receives one HINCRBY per chat turn, partitioned
across the three event kinds. Aggregate-only, no
per-visitor field.

Operator audit pattern:
- `context_consumed / (context_consumed + context_skipped)`
  → ambient adoption ratio
- `context_unavailable / context_consumed` → compose
  failure ratio (high values signal infrastructure issues)

Full V5 telemetry inventory after 10.2:

```
v5:perception:adoption        (Phase 6.1)
v5:memory:adoption            (Phase 6.4)
v5:temporal:adoption          (Phase 7.1)
v5:topology:graph             (Phase 8.1)
v5:topology:playback          (Phase 7.2)
v5:topology:timeline          (Phase 7.3)
v5:topology:architecture-page (Phase 7.4)
v5:aura:adoption              (Phase 8.4)
v5:contact:adoption           (Phase 8.5)
v5:operating:adoption         (Phase 9.1+9.4)
v5:journal:adoption           (Phase 9.3)
v5:ambient:adoption           (Phase 10.1)
v5:lumina-v5:ambient          (Phase 10.2, NEW)
```

---

## 7. Privacy guarantees

| Invariant | Mechanism in 10.2 |
|-----------|-------------------|
| No per-visitor data in Lumina's system prompt | Block carries operator-side aggregate state only — no IP, no User-Agent, no session id, no message history, no navigation trace |
| No per-visitor adaptation | Hard rule in the block: "DO NOT adapt to the visitor based on this context" |
| No visitor identifier in adoption hash | HINCRBY one event kind by 1; no per-visitor field |
| No visible behavior delta when flag OFF | Byte-identical prompt (28,016 char parity verified) + byte-identical adoption hash schema (closed allow-list) |
| Honest absence | When ambient context is null OR flag_enabled is false, the prompt block is omitted entirely; no synthesised data |
| Operator-side data only | Every block line projects from operator-owned sources (`process.env`, build-time registries, operator-controlled flags, operator commits + planned items) |
| Aggregate-only public surface | The ambient context the block consumes is itself aggregate-only (Phase 10.1 contract) |
| Reversible | Single-commit revert + flag-off both restore V4 behavior |
| Explainable | The block's hard rules + permitted uses are grep-auditable; the rendering helpers are individually testable |
| Fail-safe | Compose failure → null → byte-identical V4 prompt; no chat turn fails due to ambient |

---

## 8. Performance posture

| Surface | Measurement |
|---------|-------------|
| Chat turn latency, flag OFF | Unchanged from V4 baseline |
| Chat turn latency, flag ON + operating flag OFF | +0ms wall-clock (compose runs in parallel with memory load; cheap composer dominates neither) |
| Chat turn latency, flag ON + operating flag ON | +100-250ms wall-clock (compose dominates; within V5 § 2.7's 500ms hard limit) |
| Prompt token count delta | +2,774 characters when ambient block is present (~700 tokens; ~3% increase on 28,016-char V4 prompt) |
| Client JS shipped | **0 bytes** — augmentation is server-side only |
| Bundle delta on existing routes | **0 bytes** |

Bundle posture verified against `.next/static/**`:

| Symbol | Count in client static |
|--------|------------------------|
| `buildAmbientContextNote` | 0 |
| `composeAmbientContext` | 0 |
| `recordLuminaAmbientEvent` | 0 |
| `LUMINA_AMBIENT_HASH_KEY` | 0 |
| `isAmbientEnabled` | 0 |
| `V5_AMBIENT_ENABLED` | 0 |
| `ANTHROPIC_API_KEY` | 0 |
| `@vercel/kv` | 0 |
| `buildLuminaSystemPrompt` | 0 |

Tarballs unchanged:
- `lumina-chat`: 23.7 kB
- `emredogan-cli`: 13.5 kB

---

## 9. Edge / runtime notes

- `/api/chat` declares `runtime = "edge"`. Build registers
  as `ƒ Dynamic` (unchanged from V4).
- All new imports (`isAmbientEnabled`, `composeAmbientContext`,
  `recordLuminaAmbientEvent`, `AmbientContext` type) are
  edge-safe per Phase 10.1's verification.
- The chat route's `Promise.all` is edge-safe.
- The Lumina-side telemetry helper uses `@vercel/kv`
  (edge-safe).

---

## 10. Rollback plan

Three rollback paths in increasing order of force:

1. **Flag-off rollback** — unset `V5_AMBIENT_ENABLED` in
   env, redeploy. Chat returns to byte-identical V4
   behavior; ambient block omitted; `context_skipped`
   events fire instead of `context_consumed`.
2. **Targeted code revert** — revert just the chat route's
   3-edit hunk + the `buildLuminaSystemPrompt` signature
   change. The `lib/lumina/ambient-context.ts` module stays
   harmless (no caller). Phase 10.1 foundation untouched.
3. **Full 10.2 revert** — single-commit revert. Removes
   `lib/lumina/ambient-context.ts`, restores the original
   `buildLuminaSystemPrompt` signature, restores the chat
   route to the 10.1 tip. Phase 10.1 foundation remains
   intact and dormant.

KV state orphaned after revert:
- `v5:lumina-v5:ambient` hash — may have counts if chat
  turns ran with the flag on before revert. Harmless;
  can be `DEL`'d manually if desired.

No schema break. No env-var rollback needed.

---

## 11. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on `lib/lumina/ambient-context.ts` + `lib/lumina/system-prompt.ts` + `app/api/chat/route.ts` | ✓ 0 errors / 0 warnings |
| `npm run eval:lumina` | ✓ exit 0 (13/13) |
| `npm run eval:playground` | ✓ exit 0 (1/1) |
| Production build | ✓ exit 0, 53 static pages, 0 warnings |
| `/api/chat` registered as `ƒ Dynamic` (edge) — unchanged | ✓ |
| Direct prompt-builder check, baseline (no ambient) | ✓ 28,016 chars, no AMBIENT block |
| Direct prompt-builder check, context passed but `flag_enabled === false` | ✓ 28,016 chars, no AMBIENT block, **byte-identical** to baseline |
| Direct prompt-builder check, flag ON | ✓ 30,790 chars (+2,774); block present with ABSOLUTE PROHIBITIONS, Current ecosystem state, operational/topology/temporal/system sections |
| Flag OFF: chat route streams normally (Lumina responds) | ✓ |
| Flag ON: chat route streams normally (Lumina responds) | ✓ |
| Existing routes unaffected (`/v5/perception`, `/api/v5/ambient/context`) | ✓ |
| Server-only Lumina-ambient symbols absent from `.next/static` | ✓ 0 matches across 9 distinct symbols |
| `@vercel/kv` absent from client static bundle | ✓ |
| `ANTHROPIC_API_KEY` absent from client static bundle | ✓ |
| Tarballs (lumina-chat 23.7 kB, cli 13.5 kB) | ✓ unchanged |
| No new dependencies | ✓ `package.json` unchanged |
| Phase 10.1 foundation untouched | ✓ no edits to `lib/v5/ambient/*` or `/api/v5/ambient/*` |
| Phase 10 KIRMIZI ÇİZGİ (no surfacing / no personalisation / no per-visitor data / no creepy messaging) | ✓ structurally enforced via 5 absolute prohibitions in the prompt block |
| Anti-Generic-AI Law (no LLM call in augmentation path) | ✓ pure template assembly |
| Identity-Native Intelligence Law | ✓ |

---

## 12. Phase 10 progression + next step

Phase 10 progress after 10.2:

| Sub-PR | Status | Surface |
|--------|--------|---------|
| 10.1 | ✓ shipped | Ambient context foundation (typed registry + JSON feed + adoption hash; no visible consumer) |
| 10.2 | ✓ shipped (this) | First visible consumer — Lumina silent context injection |
| 10.3 | deferred | Identity-Native Intelligence Law's final manifestation (per V5 § 5.5) |

10.2 demonstrates the 10.1 foundation works as designed:
the typed registry was importable, the integration views
projected correctly, the closed-allow-list discipline
held, and the prompt-builder integration was a 3-edit
hunk + 1 new module.

**Sub-PR 10.3 candidates (deferred pending operator
disposition):**

- **Aura modulation via ambient context** — the Phase 8.4
  aura system could read ambient context to subtly shift
  page color temperature based on the day-of-week +
  operational ordinal. Pure CSS variable update; no new
  motion; reduced-motion compliant by design.
- **Operator dashboard surface** — an admin-only
  `/admin/ambient` page that renders the JSON feed as a
  monitoring view for the operator (private, env-gated).
- **Identity-Native Intelligence Law manifestation** —
  the original V5 § 5.5 10.3 scope. May or may not ever
  ship; conditional on observation + privacy backlash
  signal.

The default disposition is STOP and observe per V5 §
0.3 + Phase 10 brief.

---

## 13. Deferred systems

Sub-PR 10.2 deliberately defers (and reserves for explicit
operator approval):

- **Per-visitor session signal injection** — the ambient
  block carries operator-side data only. A future sub-PR
  could (optionally) inject per-visitor session pacing
  (the V5 § 4.5 original 10.1 vision). Deferred —
  requires its own KIRMIZI ÇİZGİ review.
- **Caching layer for compose** — when V5_OPERATING_TWIN_ENABLED
  is ON, compose adds 100-250ms per chat turn. A KV-cached
  variant could reduce this to <10ms. Defer until the
  operator actually deploys with both flags ON in
  production.
- **Ambient-aware sub-agent routing** — the architecture-
  critic router could read ambient context. Defer — adds
  routing complexity without clear value.
- **Ambient-aware tool selection** — Lumina's tools could
  read the ambient context. Defer — current tools are
  visitor-question-driven; ambient should anchor
  responses, not select tools.
- **Adoption visualisation surface** — the
  `v5:lumina-v5:ambient` hash could be surfaced on
  `/lumina/brain`. Defer until the hash has meaningful
  counts.

Permanently rejected (Phase 10 brief + V5 § 2.4 + V5 §
2.11):

- Lumina mentioning the ambient context in any response —
  Phase 10 KIRMIZI ÇİZGİ.
- LLM-generated ambient summaries — Anti-Generic-AI Law.
- Per-visitor profile persistence — V5 § 2.11 Lumina
  memory invariants prevent.
- Real-time ambient stream to chat — V5 § 2.5 no realtime
  spectacle.
- Surfacing the block's contents on demand if asked
  ("what do you know about me?" should answer per the
  existing memory voice rules in the prompt; the ambient
  block is not subject matter).

---

## 14. Affected system analysis

| Axis | Impact |
|------|--------|
| Architecture | One new module + 2 minimal edits to Lumina's prompt path. Pure additive |
| Phase 10.1 foundation | Read-only consumer. No edits to schema, registry, integrations, endpoints, or telemetry hash |
| Lumina V4 chat path | Backward-compatible signature extension (optional 3rd param); flag OFF = byte-identical V4 prompt |
| Lumina tool surface | Unchanged. Existing 13 tools all still pass eval |
| Lumina memory | Unchanged. Session loading + summary regen paths intact |
| Lumina router | Unchanged. Routing decision remains heuristic + deterministic |
| Telemetry | One new V5 hash + 3 event kinds. No edits to existing hashes |
| Feature flag | Reuses Phase 10.1's `V5_AMBIENT_ENABLED`. No new env var |
| Bundle | 0 bytes client. Server path only |
| Privacy | Operator-side data only in the prompt; aggregate-only telemetry; no per-visitor signal |
| Maintenance | ~0.5 hr/mo. Block prose may need polish quarterly; telemetry hash needs no maintenance |
| Rollback | 3 paths (flag-off / targeted revert / full revert) — operator picks the right scope per situation |
| Identity | No visual identity change. Lumina's voice may subtly anchor to more-current systems but the change is invisible to a single observer |

---

## 15. Closing — the silent observer

The Phase 10 brief's mandate:

> Visitors should NEVER eventually think:
> "This site adapted to me."
>
> They should think:
> "This ecosystem feels unusually aware,
> yet strangely respectful."

Sub-PR 10.2 ships the FIRST consumer of the ambient
foundation in a way that, by design, the visitor cannot
detect. Lumina becomes aware of the same ecosystem
context any operator-side reader would see; Lumina is
explicitly forbidden from surfacing this awareness.

The augmentation:
- Adds ~700 tokens to a 28,000-character prompt
- Reads operator-side data only
- Adds zero client bytes
- Adds zero visible behavior
- Fires aggregate-only telemetry
- Reverts to byte-identical V4 behavior on flag toggle

What the visitor will eventually notice (if at all):
- Lumina mentions THIS week's running experiments instead
  of older ones when asked an open-ended question
- Lumina's project anchoring tracks the operator's
  current focus
- Lumina never says "I see you've been browsing..." —
  because it doesn't read visitor signals, and is
  prohibited from referencing the ambient block in any
  case

What the visitor will NOT notice:
- The system prompt's ambient block exists
- The chat path makes 1 extra `Promise.all` await per turn
- A new KV hash records adoption signal
- The flag is toggleable per deploy

This is the Phase 10 covenant: ecosystem awareness that
improves understanding WITHOUT making the visitor feel
observed. The 10.1 foundation made it possible. 10.2
demonstrates it works.

STOP. Awaiting approval before any 10.3 consideration.
