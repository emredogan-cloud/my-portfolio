/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive contact schema.
 *
 * Phase 8.5 closes Phase 8. The user's V5 future § 4.1
 * specifies an "Adaptive Recruiter Interface" — the /contact
 * page reorders its sections based on the visitor's site-
 * internal pacing pattern. Three named patterns + a default
 * fallback:
 *
 *   senior-engineer  — long dwell + engineering-page
 *                      engagement. Layout: direct engagement
 *                      (email + Calendly) → engineering
 *                      reference → contact form.
 *   casual           — short dwell + many pages, early in
 *                      the session. Layout: elevator pitch +
 *                      case studies → "what I'd bring" → form.
 *   recruiter        — LinkedIn referrer or projects-page
 *                      engagement. Layout: "what I'd build
 *                      for you" → rate / availability →
 *                      form.
 *   default          — no clear signal. SSR fallback; every
 *                      visitor sees this initially.
 *
 * V5 future § 4.1 calls this **compositional reordering**,
 * not personalisation: same content, different weight
 * distribution. The visitor sees a coherent page; pattern
 * detection NEVER mentions itself.
 *
 * KIRMIZI ÇİZGİ (V5 future § 4.1)
 *   > **Ne olmaz:** "We know you're a recruiter!" notification
 *   > yok. Pattern detection asla mention edilmez.
 *
 * The schema enforces this STRUCTURALLY:
 *   - Patterns are internal labels. No display string.
 *   - Patterns don't carry visitor identifiers.
 *   - The classifier returns `default` when signals are
 *     ambiguous — UNCERTAIN never becomes a guess.
 *   - All signals are session-scoped (sessionStorage) +
 *     client-only. No cookie, no fingerprint, no cross-
 *     session persistence.
 *
 * Phase 8.5 ships the foundation only. The would-be Provider
 * exists but is NOT mounted on /contact. The contact page
 * stays unchanged in 8.5. The same discipline 8.4 (aura
 * unmounted) followed.
 *
 * Edge-safety: pure data + pure functions. No DOM, no I/O.
 */

/** The four pattern labels the classifier returns. Closed
 *  allow-list. Order is informational — the classifier
 *  doesn't iterate this array. */
export const CONTACT_PATTERNS = [
  "default",
  "senior-engineer",
  "casual",
  "recruiter",
] as const;

export type ContactPattern = (typeof CONTACT_PATTERNS)[number];

const PATTERN_SET: ReadonlySet<string> = new Set(CONTACT_PATTERNS);

/** Type guard. */
export function isContactPattern(value: unknown): value is ContactPattern {
  return typeof value === "string" && PATTERN_SET.has(value);
}

/**
 * The signals the classifier reads. All fields are
 * client-derived; the server-side default (during SSR)
 * carries the safest neutral values.
 *
 *   cognitionSignal   — Phase 6.2's three-state navigation
 *                       cognition (arrival / exploring /
 *                       engaged). The classifier reads this
 *                       to assess engagement depth.
 *   pageCount         — the per-session page counter the
 *                       Phase 6.2 observer maintains.
 *   referrer          — document.referrer if available.
 *                       The recruiter pattern reads this
 *                       for LinkedIn detection.
 *   visitedPrefixes   — kebab-case route prefixes the
 *                       visitor has touched during this
 *                       session. Populated by a future
 *                       observer (not mounted in 8.5).
 *
 * The fields are deliberately MINIMAL. The classifier
 * doesn't read mouse position, scroll velocity, dwell-time
 * histograms, click sequences — anything that could
 * approach fingerprinting. The four signals above are
 * what V5 future § 4.1 names as the basis for pattern
 * detection.
 */
export interface ContactSignals {
  cognitionSignal: "arrival" | "exploring" | "engaged" | null;
  pageCount: number;
  referrer: string | null;
  visitedPrefixes: ReadonlySet<string>;
}

/** Neutral signals — what the classifier sees during SSR
 *  or when sessionStorage is unavailable. Always classifies
 *  to "default". */
export const NEUTRAL_SIGNALS: ContactSignals = {
  cognitionSignal: null,
  pageCount: 0,
  referrer: null,
  visitedPrefixes: new Set(),
};

/**
 * The section identifiers the layout uses. A future
 * AdaptivePatternProvider would render these sections + set
 * a `data-pattern` attribute on the wrapping container; CSS
 * `order` rules per pattern would handle the reorder
 * without DOM mutation (no layout shift, no React re-mount).
 *
 * Sections listed in the order they appear in the DEFAULT
 * layout. Per-pattern orderings live in the CSS layer
 * (out of scope for 8.5's foundation).
 *
 *   header           — the page's h1 + intro paragraph
 *   direct           — email + Calendly + direct contact links
 *   elevator         — short pitch + case-study cards
 *   engineering      — recent commits / topology reference
 *   what-id-build    — adaptive case-study summary (recruiter)
 *   rate-availability — rate / availability / collaboration
 *                       window (recruiter)
 *   form             — the existing contact form
 */
export const CONTACT_SECTIONS = [
  "header",
  "direct",
  "elevator",
  "engineering",
  "what-id-build",
  "rate-availability",
  "form",
] as const;

export type ContactSectionId = (typeof CONTACT_SECTIONS)[number];
