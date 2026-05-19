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
 *  - IPv6 addresses (Sub-PR 6.4 — V5 extension; full-form,
 *    compressed `::`, and IPv4-mapped variants). Runs BEFORE
 *    the IPv4 pattern so mixed forms like `::ffff:1.2.3.4`
 *    match the IPv6 token cleanly.
 *  - IPv4 addresses (Sub-PR 4.4 — operator chats sometimes paste
 *    server IPs that shouldn't sit in KV)
 *  - Turkish national IDs / TC Kimlik (Sub-PR 4.4 — 11 digits,
 *    validated with the official checksum to avoid false-positives
 *    on plain 11-digit numbers like timestamps or counters)
 *  - API key prefixes (Sub-PR 4.4 — sk-..., ghp_..., xoxb-...)
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
  {
    name: "ipv6",
    /* V5 Sub-PR 6.4 extension. IPv6 addresses come in three
     * common shapes:
     *   - Full form: eight 1-4 hex groups separated by colons
     *     (`2001:0db8:0000:0000:0000:0000:0000:0001`)
     *   - Compressed: any run of zero groups collapsed to `::`
     *     once (`2001:db8::1`, `::1`, `fe80::abc`)
     *   - IPv4-mapped: `::ffff:192.168.1.1`
     *
     * The pattern below accepts all three. Anchored with a
     * non-hex / non-colon assertion on each side to avoid
     * chewing into hex blobs (UUIDs, SHA hashes) that happen
     * to contain colon-separated runs.
     *
     * Placed BEFORE the IPv4 pattern in the PATTERNS array so
     * `::ffff:1.2.3.4` matches as [ipv6] before the trailing
     * dotted octets get caught as [ipv4]. */
    pattern:
      /(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,7}:|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}|(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}|(?<![0-9A-Fa-f:])[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|(?<![0-9A-Fa-f:]):(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:)|(?<![0-9A-Fa-f:])::(?:ffff(?::0{1,4})?:)?(?:\d{1,3}\.){3}\d{1,3}/g,
    token: "[ipv6]",
  },
  {
    name: "ipv4",
    /* Four dotted octets, each 0-255 in practice but here we accept
     * 1-3 digit groups separated by literal dots. Word boundaries
     * on each side stop us from chewing into version strings like
     * "1.2.3.4-beta" — but they would still match "1.2.3.4" inside
     * "192.168.1.1:8080". Acceptable; the visitor probably wants
     * the port redacted too. */
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    token: "[ipv4]",
  },
  {
    name: "api-key-prefix",
    /* Common dev API-key prefixes the field actually pastes:
     *   sk-      Anthropic / OpenAI personal keys (sk-ant-..., sk-...)
     *   ghp_     GitHub personal access tokens
     *   github_pat_  GitHub fine-grained PATs
     *   xoxb-    Slack bot tokens
     *   xoxp-    Slack user tokens
     *   xapp-    Slack app-level tokens
     *   AIza     Google API keys (40 chars total)
     * Each prefix has a known minimum length; we use 20 as a
     * conservative floor across all of them. */
    pattern:
      /\b(?:sk-(?:ant-)?[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{22,}|xox[bpa]-[A-Za-z0-9-]{20,}|AIza[A-Za-z0-9_-]{30,})\b/g,
    token: "[api-key]",
  },
  {
    name: "tc-kimlik",
    /* Turkish national ID (TC Kimlik) — 11 digits. The literal
     * 11-digit shape is too permissive (timestamps, counters, etc.
     * are 11 digits too), so we ONLY redact strings that PASS the
     * official TC Kimlik checksum below. Matched in a separate
     * pass so we can validate before substituting — drop into a
     * regex-match-then-validate flow inline. */
    pattern: /\b\d{11}\b/g,
    token: "[tc-kimlik]",
  },
];

/** Validate a string against the Turkish national ID (TC Kimlik)
 *  checksum algorithm. Returns true only when the 11-digit number
 *  matches every rule the official algorithm enforces. Used as a
 *  second-stage filter so we don't false-positive on every
 *  11-digit blob (timestamps, counters, etc.). */
function isValidTcKimlik(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false;
  if (digits[0] === "0") return false;
  const d = digits.split("").map((c) => Number(c));
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth !== d[9]) return false;
  const eleventh =
    (oddSum + evenSum + d[9]) % 10;
  return eleventh === d[10];
}

/** Run all patterns against a string and return the redacted form.
 *  Returns the input verbatim if no patterns match — avoids
 *  allocating a new string for the common case. The TC Kimlik
 *  pattern uses a validate-before-substitute pass to gate on the
 *  official checksum; all other patterns substitute every match. */
export function redactPii(input: string): string {
  if (!input) return input;
  let output = input;
  for (const { name, pattern, token } of PATTERNS) {
    /* Reset lastIndex defensively: g-flag regexes carry state if
     * reused, and these are module-level constants. */
    pattern.lastIndex = 0;
    if (!pattern.test(output)) continue;
    pattern.lastIndex = 0;
    if (name === "tc-kimlik") {
      output = output.replace(pattern, (match) =>
        isValidTcKimlik(match) ? token : match,
      );
    } else {
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
