import type { ContactPattern, ContactSignals } from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive contact pattern classifier.
 *
 * Pure function from `ContactSignals` to one of four
 * `ContactPattern` labels. The classifier is the heart of
 * the adaptive-recruiter system; it decides which layout
 * variant the /contact page should compose into.
 *
 * Decision tree (priority order — earlier matches win):
 *
 *   1. RECRUITER
 *      - Referrer matches a LinkedIn host pattern, OR
 *      - The visitor has touched /projects AND has at least
 *        one other engineering surface in their visited set.
 *      Recruiter is the MOST SPECIFIC pattern; it requires
 *      explicit evidence (LinkedIn referrer is unambiguous;
 *      multi-surface engagement on /projects + something
 *      else is the engagement signature recruiters typically
 *      show).
 *
 *   2. SENIOR-ENGINEER
 *      - Cognition signal is "engaged" (5+ pages) AND
 *      - The visitor has touched at least one engineering-
 *        depth surface (/architecture, /lumina/brain,
 *        /v5/topology, /evolution).
 *      The signal: this visitor spent time reading the
 *      structural surfaces, not just the front matter.
 *
 *   3. CASUAL
 *      - Cognition signal is "exploring" (2-4 pages) AND
 *      - No engineering-depth surface has been touched.
 *      The signal: the visitor moved between surfaces but
 *      hasn't dwelt on the engineering content. Casual
 *      browser — the layout's elevator pitch + case
 *      studies are what they need.
 *
 *   4. DEFAULT
 *      - Anything else. Including arrival (page count = 1),
 *      - no cognition signal, no referrer, no visited
 *        prefixes. The SSR fallback.
 *
 * Conservative defaulting
 *   When signals are ambiguous, the classifier returns
 *   `default`. Per V5 future § 4.1 KIRMIZI ÇİZGİ, pattern
 *   detection must NEVER mention itself; the default
 *   pattern is the universal layout the visitor sees when
 *   the system isn't confident.
 *
 * Determinism
 *   Pure function. Same signals always produce the same
 *   pattern. The order of decisions is fixed; no clock
 *   reads, no random.
 *
 * Edge-safety: pure function, no I/O, no DOM, no
 * `process.env`. Safe to call from any runtime.
 */

/** Hostnames the classifier treats as recruiter-source
 *  referrers. The list is conservative — only well-known
 *  recruiter-traffic origins. */
const RECRUITER_REFERRER_HOSTS = [
  "linkedin.com",
  "lnkd.in",
] as const;

/** Engineering-depth surfaces. Visiting any of these is a
 *  strong signal of senior-engineer intent. */
const ENGINEERING_DEPTH_PREFIXES = [
  "/architecture",
  "/lumina/brain",
  "/v5/topology",
  "/evolution",
] as const;

/** Surfaces that lean toward recruiter pattern when combined
 *  with engineering-depth engagement. */
const RECRUITER_INDICATOR_PREFIXES = [
  "/projects",
] as const;

function referrerLooksLikeRecruiter(referrer: string | null): boolean {
  if (typeof referrer !== "string" || !referrer) return false;
  /* Parse the referrer URL; tolerate malformed. */
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (!host) return false;
  for (const rh of RECRUITER_REFERRER_HOSTS) {
    if (host === rh || host.endsWith("." + rh)) return true;
  }
  return false;
}

function hasEngineeringDepthVisit(
  visited: ReadonlySet<string>,
): boolean {
  for (const prefix of ENGINEERING_DEPTH_PREFIXES) {
    if (visited.has(prefix)) return true;
  }
  return false;
}

function hasRecruiterIndicatorVisit(
  visited: ReadonlySet<string>,
): boolean {
  for (const prefix of RECRUITER_INDICATOR_PREFIXES) {
    if (visited.has(prefix)) return true;
  }
  return false;
}

/**
 * Classify the visitor's pattern from their signals.
 * Returns one of four `ContactPattern` labels. Pure;
 * deterministic; conservative.
 */
export function classifyContactPattern(
  signals: ContactSignals,
): ContactPattern {
  /* Decision 1: recruiter. */
  if (referrerLooksLikeRecruiter(signals.referrer)) {
    return "recruiter";
  }
  if (
    hasRecruiterIndicatorVisit(signals.visitedPrefixes) &&
    hasEngineeringDepthVisit(signals.visitedPrefixes)
  ) {
    return "recruiter";
  }

  /* Decision 2: senior-engineer. */
  if (
    signals.cognitionSignal === "engaged" &&
    hasEngineeringDepthVisit(signals.visitedPrefixes)
  ) {
    return "senior-engineer";
  }

  /* Decision 3: casual. */
  if (
    signals.cognitionSignal === "exploring" &&
    !hasEngineeringDepthVisit(signals.visitedPrefixes)
  ) {
    return "casual";
  }

  /* Decision 4: default. */
  return "default";
}
