/**
 * Public corrections log for Lumina.
 *
 * Surfaced by `/lumina/failures` per V4 § 2.3 (Public Transparency
 * Disiplini): every system on the platform keeps a public log of
 * where it went wrong and what was changed. The log is one of the
 * brand-trust artifacts the V4 doc anchors the public Lumina
 * surface against — a portfolio that documents its own corrections
 * reads as honest infrastructure, not a marketing surface.
 *
 * Entry editorial rules
 *   - One paragraph for `what` (the mistake or the bad output)
 *   - One paragraph for `why` (the root cause, in plain terms)
 *   - One paragraph for `fix` (the correction, with the commit SHA
 *     when one exists)
 *   - `date` is ISO-8601 (YYYY-MM-DD)
 *   - `category` keeps the failure semantically classified — the
 *     /lumina/failures page can filter by category in a later
 *     sub-PR if the log grows large enough to warrant it
 *
 * Entries are append-only by convention — corrections to a prior
 * entry land as a new entry that references the old one, not as
 * an edit. This keeps the log honest about its own history.
 *
 * Adding a new entry
 *   1. Add a new object at the TOP of the array (newest first)
 *   2. Give it a stable kebab-case `id` (not just an index — entries
 *      may get permalinks later)
 *   3. Write the three sections in the editorial voice already
 *      established below; the page renders them verbatim
 */

export type FailureCategory =
  | "scope-judgment"
  | "voice-drift"
  | "tool-output"
  | "hallucination"
  | "ux-misread"
  | "infrastructure";

export interface FailureEntry {
  /** Stable kebab-case id. */
  id: string;
  /** ISO-8601 date the correction landed (not the date the mistake
   *  was first made — corrections are dated by their fix). */
  date: string;
  /** One-line headline — the kind a senior engineer reads at the
   *  top of an incident summary and immediately understands. */
  title: string;
  /** Failure classification. */
  category: FailureCategory;
  /** What happened. One paragraph, declarative voice. */
  what: string;
  /** Root cause. One paragraph, technically honest. */
  why: string;
  /** Correction. One paragraph + optional commit SHA. */
  fix: string;
  /** Optional commit SHA the fix landed under. Rendered as a
   *  monospace pill on the page. */
  commitSha?: string;
}

export const LUMINA_FAILURES: readonly FailureEntry[] = [
  {
    id: "forget-me-control-mis-scoped",
    date: "2026-05-18",
    title:
      "Forget-Me control was initially scoped out as “memory theatrics”",
    category: "scope-judgment",
    what: "Phase 3 Sub-PR 3.3 shipped the persistent-memory layer (KV-backed 14-day session thread, PII redaction, Haiku-generated session recap). The accompanying report explicitly chose NOT to ship a visible memory-clear control, classifying it as one of the “memory theatrics” the Phase 3 brief had warned against.",
    why: "The Phase 3 brief used the phrase “memory theatrics” to mean ambient UI that announces a fake memory persona (welcome-back banners, profile cards, personality framing). A user-facing privacy control is the opposite of that — it is the trust mechanism that makes operator-grade memory acceptable in the first place. Conflating the two collapsed two separate concerns into one rejection.",
    fix: "Same-day hotfix added the Eraser-icon Forget-Me button to the chat window header, plus the `/api/chat/forget` endpoint and `forgetSession` helper in `lib/lumina/memory.ts`. The button deletes both the `lumina:session:<id>` and `lumina:summary:<id>` KV buckets server-side and clears every client-side trace synchronously. No confirmation dialog, no localStorage write for the toggle state — operator-grade quiet.",
    commitSha: "a99af07",
  },
] as const;
