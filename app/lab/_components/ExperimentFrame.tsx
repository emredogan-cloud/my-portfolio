import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import type { ExperimentEntry } from "@/lib/lab/registry";

/**
 * Shared chrome for any `/lab/<slug>` route.
 *
 * V4 Phase 2 — Sub-PR 2.1.
 *
 * Provides:
 *   - Breadcrumb eyebrow (`LAB / <NAME>`) with a quiet link back to
 *     the lab index
 *   - Two-line statement title in the /about voice, derived from
 *     the experiment's `name` + a caller-supplied tagline
 *   - One framing paragraph the page owns the copy for
 *   - A status pill that reflects the registry's lifecycle state
 *   - A `children` slot for the experiment-specific UI (the
 *     sandbox client island on iam-translator, etc.)
 *   - A quiet sandbox-notice footer so visitors know what they're
 *     interacting with
 *
 * Visual posture: same vocabulary as /telemetry, /changelog,
 * /about. Reveal motion island + the existing ambient-blur stack.
 * No new motion primitives; reduced-motion already handled by the
 * global CSS guard.
 */

interface ExperimentFrameProps {
  experiment: ExperimentEntry;
  /** Second line of the headline. Pairs with `experiment.name` to
   *  form the two-line statement title. */
  tagline: string;
  /** Single framing paragraph — set by each experiment page so it
   *  can read in its own voice. */
  framing: string;
  children: ReactNode;
  /** Optional override for the page's bottom mono row. When the
   *  experiment is a sandbox (IAM Translator, Prompt Rescuer,
   *  Commit Narrator), leave this unset and the default
   *  "Per-IP 5/hr · Daily budget $5 · Streaming via Bedrock"
   *  notice renders. Non-sandbox experiments (e.g. /lab/cli,
   *  which is documentation + a looping animation, no backend)
   *  pass their own footer node to replace the default. Pass
   *  `null` to omit the footer entirely. */
  customFooter?: ReactNode | null;
}

const STATUS_LABEL: Record<ExperimentEntry["status"], string> = {
  active: "active",
  "coming-soon": "coming soon",
  archived: "archived",
};

const STATUS_PILL: Record<ExperimentEntry["status"], string> = {
  active:
    "border-[#00d2ff]/40 bg-[#00d2ff]/[0.05] text-[#00d2ff]/90",
  "coming-soon":
    "border-white/[0.08] bg-white/[0.02] text-tertiary",
  archived: "border-white/[0.08] bg-white/[0.02] text-quiet",
};

export default function ExperimentFrame({
  experiment,
  tagline,
  framing,
  children,
  customFooter,
}: ExperimentFrameProps) {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Lab: shared atmosphere across all /lab/[slug] experiment
          frames. Same vocabulary as the /lab hub. */}
      <PageAtmosphere variant="lab" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* BREADCRUMB EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <Link
              href="/lab"
              className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              Lab
            </Link>
            <span
              aria-hidden="true"
              className="font-mono text-[10px] text-faint"
            >
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              {experiment.name}
            </span>
            <span
              className={`ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] ${
                STATUS_PILL[experiment.status]
              }`}
            >
              {STATUS_LABEL[experiment.status]}
            </span>
          </div>
        </Reveal>

        {/* HERO — two-line statement in /about's voice */}
        <Reveal mode="mount" duration={0.8} className="mb-10">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">{experiment.name}.</span>
            <span className="block text-tertiary">{tagline}</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            {framing}
          </p>
        </Reveal>

        {/* EXPERIMENT BODY */}
        <Reveal duration={0.7} className="mb-12">
          {children}
        </Reveal>

        {/* FOOTER — sandbox notice by default; replaced by
            `customFooter` when the caller supplies one (e.g.
            /lab/cli, which is documentation, not a sandbox).
            Pass `customFooter={null}` to omit the footer
            block entirely. */}
        {customFooter === null ? null : (
          <Reveal duration={0.7}>
            <div className="border-t border-white/[0.05] pt-6 mt-12">
              {customFooter ?? (
                <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    aria-hidden="true"
                    className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
                  />
                  <span>Sandbox</span>
                  <span className="text-faint">·</span>
                  <span>Per-IP 5/hr</span>
                  <span className="text-faint">·</span>
                  <span>Daily budget $5</span>
                  <span className="text-faint">·</span>
                  <span>Streaming via Bedrock</span>
                </p>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}
