import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VisitPing from "@/components/telemetry/VisitPing";
import PlaygroundShell from "@/app/playground/_components/PlaygroundShell";
import {
  getExperiment,
  isExperimentEnabled,
} from "@/lib/playground/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * V4 Phase 5 Sub-PR 5.1 — Dynamic experiment route.
 *
 * Sub-PR 5.1 ships the foundation: this route exists, the chrome
 * renders, the feature-flag gate is wired — but the registry is
 * empty by construction. Every request to /playground/<slug>
 * currently returns 404.
 *
 * Future sub-PRs (5.2+) add real experiments. Each adds an entry
 * to `lib/playground/registry`, optionally a body component
 * loaded via `next/dynamic({ ssr: false })`, and the body slot
 * below switches on `experiment.slug` to render it.
 *
 * Routing posture:
 *   - Slug NOT in registry → notFound() (Next.js 404)
 *   - Slug in registry but status !== "active" → notFound()
 *   - Slug active but flag OFF → notFound() (no "coming soon"
 *     decoy that would advertise disabled work)
 *   - Slug active AND flag ON → render the body via the shell
 *
 * The triple gate (registry + status + flag) prevents accidental
 * exposure during transit between "shell exists" and "experiment
 * ready to ship".
 */

export const dynamicParams = true;
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment || experiment.status !== "active") {
    return {
      title: "Not found — Emre Doğan",
      robots: { index: false, follow: false },
    };
  }
  const title = `${experiment.name} · Playground — Emre Doğan`;
  return {
    title,
    description: experiment.purpose,
    alternates: { canonical: `${getSiteUrl()}/playground/${slug}` },
    /* Don't index any experiment — they're research surfaces. */
    robots: { index: false, follow: false },
  };
}

export default async function PlaygroundExperimentPage({ params }: PageProps) {
  const { slug } = await params;

  /* Triple gate. Order matters: registry first (cheapest check),
   * status second (registry contract), env flag last (runtime). */
  const experiment = getExperiment(slug);
  if (!experiment) notFound();
  if (experiment.status !== "active") notFound();
  if (!isExperimentEnabled(slug)) notFound();

  /* Body rendering is intentionally absent in 5.1 — the registry
   * is empty so this line is unreachable for now. Future sub-PRs
   * will add a switch:
   *
   *   switch (experiment.slug) {
   *     case "...":
   *       return <ShellWithDynamicBody experiment={experiment} />;
   *   }
   *
   * Each `case` will use `next/dynamic({ ssr: false })` to
   * lazy-load the body component so its bundle stays out of the
   * initial JS until the visitor specifically navigates here. */

  return (
    <>
      <VisitPing surface="playground" />
      <PlaygroundShell
        crumb={experiment.name}
        title={experiment.name}
        tagline="Experiment shell."
        framing={experiment.purpose}
        risk={experiment.risk}
      >
        <p className="text-secondary text-sm leading-relaxed">
          This experiment&apos;s body lands in a later sub-PR. The
          shell is reachable because its feature flag is on — see{" "}
          <code className="font-mono text-[13px] text-primary">
            lib/playground/registry.ts
          </code>{" "}
          for the wiring.
        </p>
      </PlaygroundShell>
    </>
  );
}
