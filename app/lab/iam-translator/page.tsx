import type { Metadata } from "next";
import ExperimentFrame from "@/app/lab/_components/ExperimentFrame";
import IamTranslateSandbox from "./_components/IamTranslateSandbox";
import { getExperiment } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";
import { notFound } from "next/navigation";

/**
 * `/lab/iam-translator` — Experiment 1 of V4 Phase 2.
 *
 * Server Component shell. Owns the page metadata, looks up the
 * registry entry, and slots the `IamTranslateSandbox` client island
 * into the shared `ExperimentFrame`. Zero client JS reaches the
 * page beyond the sandbox itself.
 *
 * Per V4 § 6.1.B SUB-PR 2.1 step 3: pre-filled with an over-
 * permissive admin IAM policy (handled inside the sandbox), with a
 * "try with your own policy" CTA naturally implied by the editable
 * textarea.
 */

const PAGE_TITLE = "IAM Translator · Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "Paste an AWS IAM policy. Get the operational meaning, the implicit risks, and the minimal fix path — streamed live from a sandboxed Bedrock Claude call.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab/iam-translator`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab/iam-translator`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function IamTranslatorPage() {
  const experiment = getExperiment("iam-translator");
  /* Registry lookup acts as the source of truth for the lifecycle
   * state. If a future ops decision flips the entry to `archived`,
   * the registry change is enough — the page below stops rendering
   * the sandbox and the index page reflects the new status. */
  if (!experiment || experiment.status !== "active") {
    notFound();
  }

  return (
    <ExperimentFrame
      experiment={experiment}
      tagline="Read the policy."
      framing="Paste an AWS IAM policy, a trust statement, or an AssumeRole block below. The translator returns a structured engineering brief: what it grants, the operational context, the risk surface, and the minimal fix. The output streams in live; nothing is stored."
    >
      <IamTranslateSandbox />
    </ExperimentFrame>
  );
}
