import type { UIMessage } from "ai";
import { ARCHITECTURE_CRITIC_ID } from "@/lib/lumina/agents/architecture-critic";

/**
 * Lumina request router — V4 Phase 4 Sub-PR 4.5.
 *
 * Decides which agent handles a given turn:
 *   - "lumina"             — the default chat. Every request that
 *                            doesn't unambiguously look like a
 *                            critique falls here.
 *   - "architecture-critic" — routed when the visitor's most-
 *                            recent message asks for a critique,
 *                            review, or design evaluation.
 *
 * Heuristic, NOT LLM-based, on purpose:
 *   - A second inference call would double cold-start latency.
 *   - Heuristics are deterministic, debuggable, and free.
 *   - "Wrong" routing always falls back to single-agent mode
 *     (the constitutional MUST), so a misroute degrades to
 *     normal chat — not a broken response.
 *
 * The score-based gate intentionally biases toward LUMINA (the
 * default). A short ambiguous message routes to Lumina; only
 * messages with BOTH a critique verb AND an architecture noun
 * — or an explicit @architecture-critic prefix — flip the agent.
 */

export type AgentId = "lumina" | "architecture-critic";

export interface RoutingDecision {
  agent: AgentId;
  /** Short human-readable explanation. Surfaced in logs +
   *  /lumina/brain/architecture-critic page. */
  reason: string;
  /** Optional trigger text that matched, for the routing log. */
  matched?: string;
}

/* Explicit-invocation prefix. A visitor (or the model from an
 * earlier turn) can force the architecture-critic by leading
 * their message with `@architecture-critic` or `[critic]`. */
const EXPLICIT_PREFIXES = [
  /^@architecture-critic\b/i,
  /^\[critic\]/i,
];

/* Critique verbs — words that strongly suggest the visitor wants
 * an evaluation, not a generic answer. Boundary-anchored so
 * "review" doesn't fire on "previewed". */
const CRITIQUE_VERBS = [
  /\breview(?:ing|ed|s)?\b/i,
  /\bcritique(?:s|d)?\b/i,
  /\bcritic(?:al|ize|izes|ized)?\b/i,
  /\bevaluate(?:s|d)?\b/i,
  /\bassess(?:ing|ed|es|ment)?\b/i,
  /\baudit(?:ing|ed|s)?\b/i,
  /\bjudge(?:s|d|ment)?\b/i,
  /\bteardown\b/i,
  /\bany concerns?\b/i,
  /\bwhat'?s wrong\b/i,
  /\bshould i\b/i,
  /\bis this (?:a )?(?:good|bad|right|wrong)\b/i,
];

/* Architecture / design nouns. A critique verb alone isn't
 * enough — "review my essay" shouldn't route here. We require an
 * architecture-flavoured noun in the same message. */
const ARCHITECTURE_NOUNS = [
  /\barchitecture\b/i,
  /\bsystem design\b/i,
  /\bdesign\b/i,
  /\bapproach\b/i,
  /\bpattern\b/i,
  /\btradeoffs?\b/i,
  /\btrade-?offs?\b/i,
  /\binfra(?:structure)?\b/i,
  /\bschema\b/i,
  /\bpipeline\b/i,
  /\bdataflow\b/i,
  /\bdata flow\b/i,
  /\btopology\b/i,
];

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = (m as unknown as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    const text = parts
      .map((p) => {
        const part = p as { type?: unknown; text?: unknown };
        return part?.type === "text" && typeof part.text === "string"
          ? part.text
          : "";
      })
      .join(" ")
      .trim();
    if (text.length === 0) continue;
    return text;
  }
  return "";
}

function findFirstMatch(
  patterns: ReadonlyArray<RegExp>,
  text: string,
): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * Route a chat request to an agent. Pure function over the
 * visitor's most recent user message. The router NEVER throws —
 * the worst it can do is return the default Lumina decision.
 */
export function routeRequest(messages: UIMessage[]): RoutingDecision {
  const text = extractLastUserText(messages);
  if (!text) {
    return {
      agent: "lumina",
      reason: "no recent user text",
    };
  }

  /* 1. Explicit prefix wins immediately. The visitor (or a
   *    follow-up step) gets exactly what they asked for. */
  const explicit = findFirstMatch(EXPLICIT_PREFIXES, text);
  if (explicit) {
    return {
      agent: ARCHITECTURE_CRITIC_ID,
      reason: "explicit prefix",
      matched: explicit,
    };
  }

  /* 2. Critique verb AND architecture noun → architecture-critic.
   *    Either alone is too permissive (every "review" routes here,
   *    or every mention of "architecture" does). */
  const verbMatch = findFirstMatch(CRITIQUE_VERBS, text);
  const nounMatch = findFirstMatch(ARCHITECTURE_NOUNS, text);
  if (verbMatch && nounMatch) {
    return {
      agent: ARCHITECTURE_CRITIC_ID,
      reason: "critique verb + architecture noun",
      matched: `${verbMatch} + ${nounMatch}`,
    };
  }

  /* 3. Default. The bias toward Lumina is deliberate — a
   *    miscategorized "review my CV" routing to architecture-
   *    critic would feel weirder than a missed routing where
   *    Lumina answers in default mode. */
  return {
    agent: "lumina",
    reason: "no critique signal",
  };
}
