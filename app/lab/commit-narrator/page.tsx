import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExperimentFrame from "@/app/lab/_components/ExperimentFrame";
import CommitNarrateSandbox from "./_components/CommitNarrateSandbox";
import { getExperiment } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `/lab/commit-narrator` — Experiment 3 of V4 Phase 2.
 *
 * Server Component shell. Same structural pattern as
 * `/lab/iam-translator` (Sub-PR 2.1) and `/lab/prompt-rescuer`
 * (Sub-PR 2.2): registry-gated lifecycle, `ExperimentFrame`
 * carries the shared chrome, the `CommitNarrateSandbox` client
 * island handles the interaction.
 *
 * Different from the two siblings: the input shape is a URL,
 * not a multi-line textarea. That difference is what made
 * extracting a shared `LabSandbox` premature in 2.2; with three
 * sandboxes on the bench, see the Sub-PR 2.3 report for the
 * extraction analysis.
 */

const PAGE_TITLE = "Commit Narrator · Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "Paste a public GitHub repo URL. Get a WHY annotation drafted for each of the last twenty commits — the paragraph an engineer would write under the subject line to explain the change.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab/commit-narrator`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab/commit-narrator`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function CommitNarratorPage() {
  const experiment = getExperiment("commit-narrator");
  if (!experiment || experiment.status !== "active") {
    notFound();
  }

  return (
    <ExperimentFrame
      experiment={experiment}
      tagline="Draft the WHY."
      framing="Paste a public GitHub repository URL. The narrator fetches the last twenty commits, then drafts a one-paragraph WHY annotation for each — the motivation, constraint, or context the subject line couldn't carry on its own. Output streams in live; nothing is stored."
    >
      <CommitNarrateSandbox />
    </ExperimentFrame>
  );
}
