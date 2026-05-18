import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExperimentFrame from "@/app/lab/_components/ExperimentFrame";
import CloudTemplateGenerator from "./_components/CloudTemplateGenerator";
import { getExperiment } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `/lab/cloud` — Cross-account STS pattern as content. V4 Phase 3,
 * Sub-PR 3.5.
 *
 * Unlike the IAM Translator / Prompt Rescuer / Commit Narrator
 * (which spin up sandboxed Bedrock calls), this page makes ZERO
 * server-side AWS calls. The visitor reads the architecture, plugs
 * their parent-account id into the form, and downloads ready-to-
 * deploy CloudFormation / Terraform — the exact cross-account STS
 * pattern Cloud Waste Hunter uses for production cross-account
 * scanning, generated for their account.
 *
 * Why content-only:
 *   - The full V4 § 4.4 spec would have wired up STS AssumeRole +
 *     audit log + per-visitor cost cap. That ships real liability
 *     and real maintenance for a portfolio surface. Sub-PR 3.5
 *     deliberately ships the educational layer instead — the
 *     architecture in deployable form. If real cross-account
 *     invocation ever earns its place, a future sub-PR can layer
 *     it on top of this foundation.
 *   - Visitors verify the role from THEIR side via the CLI snippet
 *     the page emits. Cleaner trust boundary, zero credentials
 *     anywhere on our infrastructure.
 */

const PAGE_TITLE = "Cloud Lab · Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "The cross-account STS pattern Cloud Waste Hunter uses in production, generated for your AWS account as deployable CloudFormation and Terraform. No credentials shared, no server-side calls.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab/cloud`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab/cloud`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function CloudLabPage() {
  const experiment = getExperiment("cloud");
  if (!experiment || experiment.status !== "active") {
    notFound();
  }

  return (
    <ExperimentFrame
      experiment={experiment}
      tagline="The pattern, deployable."
      framing="Cross-account access through STS AssumeRole is how Cloud Waste Hunter scans AWS accounts without ever holding visitor credentials. This page emits the same pattern as ready-to-deploy infrastructure — paste your parent-account id below, copy the CloudFormation or Terraform, and verify the trust policy from your terminal. Nothing leaves your shell."
      customFooter={
        <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            aria-hidden="true"
            className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
          />
          <span>Content-only</span>
          <span className="text-faint">·</span>
          <span>No server-side AWS calls</span>
          <span className="text-faint">·</span>
          <span>Inputs stay in your browser</span>
        </p>
      }
    >
      {/* Architecture brief — server-rendered prose. The three
          numbered steps map 1:1 to what the visitor will do after
          they've copied the template. */}
      <section className="mb-10 space-y-5 text-secondary text-sm md:text-[15px] leading-relaxed">
        <p>
          The architecture has three actors. <strong className="text-primary">Your
          AWS account</strong> holds the resources you want to expose. The
          <strong className="text-primary"> parent account</strong> is
          whatever account needs scoped access — could be Cloud Waste
          Hunter, could be your CI, could be a partner platform. The
          <strong className="text-primary"> external id</strong> is a
          shared secret that both sides know, used to mitigate the
          confused-deputy problem.
        </p>
        <ol className="space-y-3 text-secondary list-decimal list-inside marker:text-tertiary">
          <li>
            You deploy a role in <em>your</em> account. Its trust
            policy says only the parent account can assume it, and
            only when it presents the external id.
          </li>
          <li>
            You hand the parent two values: the role&apos;s ARN and
            the external id.
          </li>
          <li>
            The parent calls <code className="font-mono text-[13px] text-primary">sts:AssumeRole</code> with both, receives
            temporary credentials scoped to whatever permissions
            your role policy grants, and acts on your behalf.
          </li>
        </ol>
        <p className="text-tertiary">
          The visitor (parent account) never sees your long-term
          credentials. Your role policy controls exactly what they
          can do. Revocation is a single AWS console click.
        </p>
      </section>

      {/* CLIENT ISLAND — pasted inputs, generated templates, copy/
          download affordances. The component itself imports the
          template builders from lib/lab/cloud/templates and runs
          entirely client-side. */}
      <CloudTemplateGenerator />
    </ExperimentFrame>
  );
}
