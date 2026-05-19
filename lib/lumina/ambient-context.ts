import { kv } from "@vercel/kv";

import type {
  AmbientContext,
  AttentionDomainView,
  NavigationDomainView,
  OperationalDomainView,
} from "@/lib/v5/ambient/schema";

/**
 * V5 Phase 10 Sub-PR 10.2 — Lumina-side ambient consumer.
 *
 * The bridge between Phase 10.1's typed `AmbientContext`
 * registry and Lumina's system-prompt composition.
 *
 * Responsibilities (and ONLY these):
 *
 *   1. Render an `AmbientContext` into a compact
 *      system-prompt block Lumina's chat turn reads as
 *      INTERNAL operator anchoring data.
 *   2. Record Lumina-side adoption telemetry — counts only,
 *      no per-visitor field.
 *
 * Non-responsibilities (deliberately deferred):
 *
 *   - Per-visitor session signals (deferred — Phase 10.3 or
 *     never).
 *   - Visible UI surfacing of ambient state (forbidden —
 *     KIRMIZI ÇİZGİ).
 *   - Adaptive routing logic (Lumina's existing router is
 *     unchanged; ambient context only affects the prompt
 *     anchoring, not the routing decision).
 *
 * Anti-Generic-AI Law compliance
 *   The prompt block is composed via deterministic string
 *   assembly. No LLM call. The block's prohibitions are
 *   load-bearing — they tell Lumina to USE the ambient
 *   context as an internal anchoring signal but NEVER
 *   surface it to the visitor.
 *
 * KIRMIZI ÇİZGİ (Phase 10)
 *   The prompt block contains explicit hard rules:
 *     - "DO NOT say 'I see / I notice / Looking at...'"
 *     - "DO NOT recite numerical values"
 *     - "DO NOT mention the ambient context surface"
 *   These rules carry the visitor-trust covenant from V5
 *   § 4.5 into the model's behavior.
 *
 * Telemetry
 *   `v5:lumina-v5:ambient` hash with 3 event kinds. Counts
 *   only. No per-visitor field, no User-Agent capture, no
 *   session id.
 *
 * Edge-safety: edge-safe @vercel/kv usage.
 */

/* ── Telemetry foundation ─────────────────────────────── */

export const LUMINA_AMBIENT_HASH_KEY = "v5:lumina-v5:ambient";

export const LUMINA_AMBIENT_EVENTS = [
  /** Chat turn ran with ambient flag ON + compose
   *  succeeded + prompt block was added. */
  "context_consumed",
  /** Chat turn ran with ambient flag ON but compose
   *  failed (returned null or threw). The chat still ran;
   *  the prompt block was omitted. */
  "context_unavailable",
  /** Chat turn ran with ambient flag OFF — no compose
   *  attempted. This is the production default. */
  "context_skipped",
] as const;

export type LuminaAmbientEvent = (typeof LUMINA_AMBIENT_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<LuminaAmbientEvent> = new Set(
  LUMINA_AMBIENT_EVENTS,
);

export function isLuminaAmbientEvent(
  value: unknown,
): value is LuminaAmbientEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as LuminaAmbientEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/**
 * Increment one Lumina-side ambient counter. Fire-and-forget;
 * swallows every error path.
 *
 * Unlike `recordAmbientEvent` (Phase 10.1), this helper
 * does NOT gate on `V5_AMBIENT_ENABLED` — it records all
 * three event kinds including `context_skipped` (which is
 * the steady-state when the flag is OFF). This gives the
 * operator visibility into "how often did Lumina ever even
 * try to compose ambient context" from inside the chat
 * route.
 */
export async function recordLuminaAmbientEvent(
  kind: LuminaAmbientEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!isLuminaAmbientEvent(kind)) return;
  try {
    await kv.hincrby(LUMINA_AMBIENT_HASH_KEY, kind, 1);
  } catch {
    /* swallow — lumina ambient telemetry is decorative */
  }
}

/**
 * Read the entire Lumina ambient adoption hash. Returns an
 * empty object on KV unavailable / hash never written /
 * read error. Operator-facing read.
 */
export async function readLuminaAmbientAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      LUMINA_AMBIENT_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(stored)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

/* ── Prompt note renderer ────────────────────────────── */

/**
 * Render the ambient context as a system-prompt block.
 * Returns the empty string when the context is null or
 * when its `flag_enabled` is false (honest absence — no
 * fake block).
 *
 * Block contains:
 *   1. The block boundary + explicit instructions to Lumina.
 *   2. Hard prohibitions (DO NOT surface the data).
 *   3. Permitted uses (anchor references, not recite values).
 *   4. Compact rendered state (only sub-domains with signal).
 *
 * The block is plain text, ~50-80 lines. The prohibitions
 * are repeated explicitly because LLM attention to the
 * "don't do X" framing has been historically weaker than
 * the "do Y" framing — repetition + scoping reduces the
 * risk of surfacing.
 */
export function buildAmbientContextNote(
  context: AmbientContext | null,
): string {
  if (!context) return "";
  if (!context.flag_enabled) return "";

  const lines: string[] = [];

  lines.push(`
============================================================
# AMBIENT OPERATOR CONTEXT — INTERNAL READ ONLY
# READ FOR ANCHORING. NEVER QUOTE. NEVER REFERENCE.
============================================================

This block carries the current AGGREGATE state of Emre's
ecosystem — derived from the same operator-side data that
/v5/operating renders publicly. It is internal anchoring
material, NOT subject matter. The visitor must NEVER feel
that you have read this block.

**ABSOLUTE PROHIBITIONS:**

- DO NOT say "I see that…", "I notice…", "Looking at the
  data…", "Based on the latest…", "It looks like…".
- DO NOT mention the ambient context, the operational twin,
  the JSON feed, the journal, or any platform telemetry
  surface UNLESS the visitor has explicitly asked about
  these surfaces by name.
- DO NOT recite numerical values from this block. Quote
  numerical values only when the visitor has explicitly
  asked about commits / infrastructure / experiments AND
  the operator-awareness tools described earlier in this
  prompt would have surfaced the same data via their own
  invocation. The ambient block is NOT a tool result.
- DO NOT use "currently", "right now", "lately", "today"
  in a way that implies live ecosystem awareness. The
  "RIGHT NOW" block (separate, time-of-day only) is the
  only source for temporal claims; the ambient block is
  internal anchoring, not a quotable timestamp.
- DO NOT adapt to the visitor based on this context. The
  block describes the OPERATOR's ecosystem state, not the
  visitor's session. No personalisation, no "for someone
  like you…" framing.

**PERMITTED USES (anchoring only):**

- WHEN choosing which project / experiment / system to
  mention first in an open-ended answer, prefer items the
  ambient block lists as currently active over generic
  recall from your prompt.
- WHEN the visitor's question has multiple valid
  framings, prefer the framing aligned with the
  operator's current focus per the ambient block.
- WHEN the ambient block is absent or contains nulls
  (the production default), behave EXACTLY as you would
  without this block. Do not invent state to fill gaps.

============================================================
**Current ecosystem state** (read for anchoring; do not quote):
============================================================
`);

  /* Render only the sub-domains with signal. Each sub-
   * domain's rendering is a fixed template + the ordinal /
   * count fields. */

  lines.push(...renderSystemBlock(context));
  lines.push(...renderTemporalBlock(context));
  lines.push(...renderTopologyBlock(context));
  lines.push(...renderOperationalBlock(context));
  lines.push(...renderPerceptionBlock(context));

  lines.push(
    "\n============================================================",
  );

  return lines.join("");
}

function renderSystemBlock(context: AmbientContext): string[] {
  const { system, environment } = context.domains;
  const activeFlags = Object.entries(system.flags)
    .filter(([, on]) => on)
    .map(([k]) => k);
  return [
    `\n- System flags active: ${
      activeFlags.length === 0 ? "none" : activeFlags.join(", ")
    }`,
    `\n- Topology validator: ${system.validators.topology === null ? "ok" : "failed"}`,
    `\n- Runtime: ${environment.runtime ?? "unknown"} · env: ${environment.node_env}`,
  ];
}

function renderTemporalBlock(context: AmbientContext): string[] {
  const { temporal } = context.domains;
  return [
    `\n- ISO week: ${temporal.iso_week} (${temporal.day_of_week})`,
    `\n- Evolution registry: ${temporal.evolution_events_total} events${
      temporal.evolution_latest
        ? ` (latest ${temporal.evolution_latest})`
        : ""
    }`,
  ];
}

function renderTopologyBlock(context: AmbientContext): string[] {
  const { topology } = context.domains;
  return [
    `\n- Topology graph: ${topology.node_count} nodes / ${topology.relationship_count} relationships (validation: ${topology.validation})`,
  ];
}

function renderOperationalBlock(context: AmbientContext): string[] {
  const op = context.domains.operational;
  if (!op) {
    return [
      "\n- Operational twin: disabled (no current snapshot)",
    ];
  }
  return renderOperationalDetail(op);
}

function renderOperationalDetail(
  op: OperationalDomainView,
): string[] {
  const out = [
    `\n- This week's commit volume (ordinal): ${op.weekly_commits}`,
    `\n- Active production systems: ${op.active_infrastructure_count}`,
    `\n- Experiments running: ${op.experiments_running}`,
    `\n- Planned items in motion: ${op.planned_in_motion}`,
  ];
  if (op.latest_narrative) {
    out.push(
      `\n- Latest weekly narrative (templated, do NOT quote): "${op.latest_narrative}"`,
    );
  }
  return out;
}

function renderPerceptionBlock(context: AmbientContext): string[] {
  const nav = context.domains.navigation;
  const att = context.domains.attention;
  if (!nav && !att) {
    return [
      "\n- Perception aggregates: unavailable (perception flag off or no signal)",
    ];
  }
  const out: string[] = [];
  if (nav) out.push(...renderNavigationDetail(nav));
  if (att) out.push(...renderAttentionDetail(att));
  return out;
}

function renderNavigationDetail(nav: NavigationDomainView): string[] {
  return [
    `\n- Navigation signal (aggregate, ordinal): ${nav.intensity}`,
    `\n- Active perception categories: ${nav.active_categories.length === 0 ? "none" : nav.active_categories.join(", ")}`,
  ];
}

function renderAttentionDetail(att: AttentionDomainView): string[] {
  return [
    `\n- Attention signal (aggregate, ordinal): dwell=${att.dwell_intensity}, scroll=${att.scroll_intensity}`,
  ];
}
