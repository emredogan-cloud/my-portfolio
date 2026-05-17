import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExperimentFrame from "@/app/lab/_components/ExperimentFrame";
import PromptRescueSandbox from "./_components/PromptRescueSandbox";
import { getExperiment } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `/lab/prompt-rescuer` — Experiment 2 of V4 Phase 2.
 *
 * Server Component shell. Same shape as `/lab/iam-translator`
 * (Sub-PR 2.1): registry lookup gates the lifecycle state,
 * `ExperimentFrame` carries the shared chrome, the
 * `PromptRescueSandbox` client island runs the interaction.
 *
 * The framing copy is set in this file so the experiment's voice
 * can drift away from the IAM translator's voice if it wants to;
 * the shared frame doesn't enforce a single editorial line. For
 * v1 they're calibrated to read as siblings.
 */

const PAGE_TITLE = "Prompt Rescuer · Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "Paste a vague developer ask. Get a structured engineering brief — goal, scope, stack, structure, edge cases, acceptance — ready to hand to Claude Code, Cursor, or Windsurf.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab/prompt-rescuer`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab/prompt-rescuer`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function PromptRescuerPage() {
  const experiment = getExperiment("prompt-rescuer");
  if (!experiment || experiment.status !== "active") {
    notFound();
  }

  return (
    <ExperimentFrame
      experiment={experiment}
      tagline="Draft the brief."
      framing="Paste a vague developer ask — anything from one line to a paragraph. The rescuer returns a six-section engineering brief in Markdown: goal, scope (with explicit non-goals), stack, structure, edge cases, acceptance. The output streams in live; nothing is stored."
    >
      <PromptRescueSandbox />
    </ExperimentFrame>
  );
}
