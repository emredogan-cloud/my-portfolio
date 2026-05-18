import type { UIMessage } from "ai";

/**
 * Lumina memory redaction layer — Sub-PR 3.3.
 *
 * Applied just before a UIMessage[] thread is persisted to KV, and
 * again before the summarization model sees the older turns. The
 * goal is operator-grade privacy: no email, no phone, no AWS keys
 * sitting in KV under a visitor's anonymous sessionId.
 *
 * Design constraints:
 *  - Deterministic regex sweep. No model call, no probabilistic
 *    PII detector. Cheap, predictable, no extra latency in the
 *    save-side onFinish path.
 *  - Patterns are conservative: better to miss an edge case than
 *    to false-positive on a token that resembles PII (e.g. random
 *    40-char base64 strings — many AWS secret-key matches would
 *    also catch normal hashes; we deliberately skip that pattern).
 *  - Replacement tokens are short, human-readable, model-friendly.
 *    "[email]" not "█████" so the model can still reason about the
 *    SHAPE of the prior conversation.
 *  - Pure functions. No state, no I/O. Easy to unit-test in
 *    isolation and easy to reason about.
 *
 * What is redacted:
 *  - Email addresses
 *  - Turkish mobile numbers (with or without country code / prefix)
 *  - International phone numbers (+CC followed by 6-14 digits)
 *  - AWS access key IDs (the AKIA / ASIA prefix variants)
 *
 * What is intentionally NOT redacted:
 *  - AWS secret access keys (40-char base64 — too easy to match any
 *    base64 blob, would corrupt the IAM Translator transcripts).
 *  - Credit card numbers (Luhn + format is fragile; visitors rarely
 *    paste real CC numbers to a portfolio chatbot anyway).
 *  - Names. Detecting "I'm Emre" patterns is probabilistic and
 *    breaks normal conversation. Names aren't PII in the same
 *    sense as account credentials.
 *  - URLs (visitors paste GitHub URLs for Commit Narrator — those
 *    are public and required for the tool to work).
 */

const PATTERNS: Array<{ name: string; pattern: RegExp; token: string }> = [
  {
    name: "email",
    /* Conservative email match: local-part chars + @ + domain + TLD.
     * Allows + and . in the local part (gmail aliases) and dots in
     * the domain (subdomains). Won't match exotic but valid RFC
     * 5322 addresses — that's acceptable here. */
    pattern: /\b[\w][\w.+-]*@[\w-]+(?:\.[\w-]+)+\b/g,
    token: "[email]",
  },
  {
    name: "phone-tr",
    /* Turkish mobile number patterns:
     *   +90 5XX XXX XX XX
     *   0090 5XX XXX XX XX
     *   05XX XXX XX XX
     *   5XX XXX XX XX
     * Separators: space, hyphen, or nothing. The captured digit
     * count after the optional country code + leading 0 is exactly
     * 10 (5 + 9 more), so this match doesn't accidentally collapse
     * a 10-digit invoice number.
     *
     * Anchor: word boundary on each side, so "user5301234567" or
     * a URL fragment ending in digits won't trip it. */
    pattern: /\b(?:\+?90[\s-]?|0090[\s-]?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g,
    token: "[phone]",
  },
  {
    name: "phone-intl",
    /* Generic international: literal +, country code 1-3 digits,
     * separator, then 6-14 more digits with optional separators.
     * Runs AFTER phone-tr so Turkish numbers get the more specific
     * token first. */
    pattern: /\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{2,6}\b/g,
    token: "[phone]",
  },
  {
    name: "aws-access-key",
    /* AKIA = long-term IAM user key, ASIA = STS temporary key.
     * Both are 20 chars total: prefix + 16 alphanumeric. The token
     * is uppercase A-Z 2-7 in practice but we allow the full set
     * to stay forgiving. */
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    token: "[aws-key]",
  },
];

/** Run all patterns against a string and return the redacted form.
 *  Returns the input verbatim if no patterns match — avoids
 *  allocating a new string for the common case. */
export function redactPii(input: string): string {
  if (!input) return input;
  let output = input;
  for (const { pattern, token } of PATTERNS) {
    /* Reset lastIndex defensively: g-flag regexes carry state if
     * reused, and these are module-level constants. */
    pattern.lastIndex = 0;
    if (pattern.test(output)) {
      pattern.lastIndex = 0;
      output = output.replace(pattern, token);
    }
  }
  return output;
}

/** Walk a UIMessage[] thread and return a new thread with the text
 *  in every text-part redacted. Non-text parts (tool calls, tool
 *  results, etc.) pass through verbatim — they're already
 *  structured and don't contain visitor-typed PII. */
export function redactMessages(messages: UIMessage[]): UIMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  return messages.map((m) => {
    const partsAny = (m as unknown as { parts?: unknown }).parts;
    if (!Array.isArray(partsAny)) return m;
    const newParts = partsAny.map((p) => {
      const part = p as { type?: unknown; text?: unknown };
      if (part?.type === "text" && typeof part.text === "string") {
        const redacted = redactPii(part.text);
        if (redacted === part.text) return p;
        return { ...part, text: redacted };
      }
      return p;
    });
    return { ...m, parts: newParts } as UIMessage;
  });
}
