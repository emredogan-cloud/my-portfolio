import { flagEnvName, isExperimentEnabled } from "@/lib/playground/feature-flags";
import type { ExperimentRequirements } from "@/lib/playground/capabilities";

/**
 * Playground experiment registry — V4 Phase 5 Sub-PR 5.1.
 *
 * The playground is the experimental cousin of /lab. /lab ships
 * production-grade sandboxes (rate-limited, cost-capped, public).
 * /playground ships RISKY experiments (heavy graphics, WebGPU,
 * local-first inference, multimodal surfaces) gated behind
 * feature flags so they never reach a visitor accidentally.
 *
 * Sub-PR 5.1 ships an EMPTY registry on purpose. The foundation
 * is the deliverable; experiments land in 5.2+ when they earn
 * the runtime cost. The shape below is the contract every future
 * experiment must implement.
 *
 * Editorial discipline:
 *   - Each entry stays in the "experimental, conditional" voice.
 *     Marketing copy is forbidden — these are research surfaces.
 *   - `purpose` is one sentence describing what the experiment
 *     studies. Not what it "delivers".
 *   - `status: "shell"` means a placeholder route exists but no
 *     real experiment runs yet. `"active"` means the experiment
 *     body ships and runs when the flag is on.
 *   - `risk` is a one-line caveat shown to the visitor on the
 *     experiment page header — useful for honest expectation
 *     setting.
 */

export type ExperimentStatus = "shell" | "active" | "archived";

export interface PlaygroundExperiment {
  /** URL slug — `/playground/<slug>`. */
  slug: string;
  /** Display name on the index page. */
  name: string;
  /** One-sentence research framing. */
  purpose: string;
  /** Honest caveat shown to the visitor (e.g., "may stutter on
   *  mobile", "requires WebGPU", "burns CPU"). */
  risk: string;
  /** Lifecycle state. */
  status: ExperimentStatus;
  /** Sub-PR 5.2: optional environment requirements. The
   *  ExperimentMount component checks these on the client and
   *  renders a fallback instead of the body when any aren't met.
   *  Omit for experiments that work everywhere. */
  requirements?: ExperimentRequirements;
}

export const PLAYGROUND_EXPERIMENTS: readonly PlaygroundExperiment[] = [
  /* Sub-PR 5.3 — the FIRST shell. Demonstrates the full
   * registry-body-switch-flag contract end-to-end. Default state
   * is OFF (no PLAYGROUND_FLAG_HELLO_PLAYGROUND=1 in any env);
   * the operator can enable it locally for verification or in a
   * deploy env when ready to surface the diagnostic page. The
   * body itself is purely diagnostic — it renders the visitor's
   * capability snapshot so future experiments can use this shell
   * to verify their requirement gates. No animation, no
   * interactivity, no network. */
  {
    slug: "hello-playground",
    name: "Hello, playground",
    purpose:
      "Diagnostic shell — renders the visitor's capability snapshot to verify the experiment-mount contract end-to-end.",
    risk: "no risk — diagnostic page",
    status: "active",
    /* No requirements declared. The shell renders on every viewport,
     * with or without WebGPU, in any motion preference. */
  },
];

/** Look up an experiment by slug. Returns undefined when the slug
 *  doesn't match any registered entry. */
export function getExperiment(slug: string): PlaygroundExperiment | undefined {
  return PLAYGROUND_EXPERIMENTS.find((e) => e.slug === slug);
}

/** Return only the experiments that are BOTH registered AND
 *  enabled by their feature flag. The index page reads this to
 *  decide what to render — disabled experiments are invisible
 *  (no "coming soon" cards advertising disabled work). */
export function getEnabledExperiments(): PlaygroundExperiment[] {
  return PLAYGROUND_EXPERIMENTS.filter(
    (e) => e.status === "active" && isExperimentEnabled(e.slug),
  );
}

/** Re-export so consumers reading the registry don't need a
 *  second import to learn which env var to set. */
export { flagEnvName, isExperimentEnabled };
