/**
 * Lab experiment registry — V4 Phase 2.
 *
 * One source of truth for the `/lab` surface. Both the index page and
 * each individual experiment page read from this list so the index's
 * "what exists" picture and each experiment's "what am I" framing
 * never drift apart.
 *
 * Sub-PR 2.1 ships ONE active experiment (`iam-translator`); the
 * other two slots are declared here so the index renders them as
 * "coming-soon" entries without false-promising clickable links.
 * Sub-PRs 2.2 and 2.3 will flip their statuses to `active` and add
 * the corresponding `app/lab/<slug>/page.tsx` routes.
 *
 * Identity discipline:
 *   - Each entry stays in the editorial "private engineering
 *     notebook" voice. No marketing copy, no exclamation marks, no
 *     "🚀". Specific tech only.
 *   - The `purpose` line is one sentence — the index page lays
 *     these out as a typewriter list, so two sentences breaks the
 *     visual rhythm.
 */

export type ExperimentStatus = "active" | "coming-soon" | "archived";

export interface ExperimentEntry {
  /** URL slug — `/lab/<slug>` and the various telemetry/cost keys. */
  slug: string;
  /** Display number on the index page (ordinal in the list, not a
   *  semver). Kept zero-padded to two digits to read as a mono
   *  index column. */
  index: string;
  /** Display name in the index list + the experiment-page eyebrow. */
  name: string;
  /** One-sentence purpose. */
  purpose: string;
  /** Lifecycle state. `coming-soon` entries render in the index
   *  without a link; `archived` entries render with a quiet
   *  "archived" pill (V4 FUTURE § 2.2 "Failed experiments shelf"). */
  status: ExperimentStatus;
}

export const LAB_EXPERIMENTS: readonly ExperimentEntry[] = [
  {
    slug: "iam-translator",
    index: "01",
    name: "IAM Translator",
    purpose:
      "Paste an AWS policy. Get the operational meaning, the implicit risks, and the minimal fix path — in plain English.",
    status: "active",
  },
  {
    slug: "prompt-rescuer",
    index: "02",
    name: "Prompt Rescuer",
    purpose:
      "A vague prompt arrives. A senior-grade engineering brief comes back, structured for the next agent to act on.",
    status: "active",
  },
  {
    slug: "commit-narrator",
    index: "03",
    name: "Commit Narrator",
    purpose:
      "Point it at a public GitHub repo. The last twenty commits get drafted WHY annotations, ready for the changelog.",
    status: "active",
  },
] as const;

export function getExperiment(slug: string): ExperimentEntry | undefined {
  return LAB_EXPERIMENTS.find((e) => e.slug === slug);
}
