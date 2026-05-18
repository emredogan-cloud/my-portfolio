"use client";

import type { ComponentType } from "react";
import {
  useCapabilities,
  checkRequirements,
  type RequirementMiss,
} from "@/lib/playground/capabilities";
import type { PlaygroundExperiment } from "@/lib/playground/registry";

/**
 * Experiment mount — V4 Phase 5 Sub-PR 5.2.
 *
 * Combines the capability probe with the experiment's declared
 * requirements and decides one of three outcomes:
 *
 *   1. Capabilities not yet ready (first render before useEffect
 *      fires) → show a quiet "Checking environment…" placeholder.
 *      Prevents the visitor from briefly seeing the body before
 *      the requirement check completes.
 *
 *   2. Capabilities ready, one or more requirements unmet →
 *      render the inline fallback explaining what's missing.
 *      No body load, no chunk fetch, no CPU spend.
 *
 *   3. Capabilities ready, all requirements met → render the
 *      lazy-loaded body. The body's chunk fetches on demand;
 *      see `lib/playground/lazy` for the bundle-isolation
 *      contract.
 *
 * Every experiment page in /playground/[slug] passes through
 * this component. It's the single mount-time guard the audit
 * gives us.
 */

interface ExperimentMountProps {
  experiment: PlaygroundExperiment;
  /** The lazy-loaded body component. Pass the result of
   *  `createExperimentBody(() => import('./Body'))` from
   *  `lib/playground/lazy`. */
  BodyComponent: ComponentType;
}

export default function ExperimentMount({
  experiment,
  BodyComponent,
}: ExperimentMountProps) {
  const caps = useCapabilities();

  /* SSR + first client render: caps.ready === false. Show the
   * neutral placeholder rather than letting the body render with
   * default values. The flicker would be brief but confusing for
   * experiments that gate on motion / viewport / WebGPU. */
  if (!caps.ready) {
    return <Checking />;
  }

  const misses = checkRequirements(experiment.requirements, caps);
  if (misses.length > 0) {
    return <Fallback experiment={experiment} misses={misses} />;
  }

  return <BodyComponent />;
}

/* ── Internal UI ──────────────────────────────────────────── */

function Checking() {
  return (
    <div
      className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]"
      aria-live="polite"
    >
      <p>
        <span className="text-[#00d2ff]/80">$</span> checking environment…
      </p>
    </div>
  );
}

function Fallback({
  experiment,
  misses,
}: {
  experiment: PlaygroundExperiment;
  misses: ReadonlyArray<RequirementMiss>;
}) {
  return (
    <div
      className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-6 text-sm text-secondary leading-relaxed"
      aria-live="polite"
    >
      <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-amber-300/80 mb-3">
        Environment can&apos;t run this experiment
      </p>
      <p className="mb-4">
        {experiment.name} declares requirements your current
        browser or viewport doesn&apos;t meet. The experiment body
        is intentionally NOT loaded — the visit costs you no CPU
        or bundle.
      </p>
      <ul className="space-y-2">
        {misses.map((m) => (
          <li key={m.requirement} className="flex gap-3 items-start">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-amber-300/80 mt-1 min-w-[80px]">
              {m.requirement}
            </span>
            <span className="text-secondary text-[13px]">{m.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
