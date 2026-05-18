import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VisitPing from "@/components/telemetry/VisitPing";
import PlaygroundShell from "@/app/playground/_components/PlaygroundShell";
import BodyMount from "@/app/playground/[slug]/BodyMount";
import {
  getExperiment,
  isExperimentEnabled,
} from "@/lib/playground/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * V4 Phase 5 Sub-PR 5.3 — Dynamic experiment route, NOW wired.
 *
 * 5.1 shipped this route with an empty registry and a documented
 * dispatch pattern. 5.2 shipped the runtime guards
 * (ExperimentMount, lazy-load helper, capability probes). 5.3
 * wires the FIRST shell end-to-end and moves the dynamic dispatch
 * into a client boundary (see ./BodyMount.tsx).
 *
 * Routing posture (unchanged from 5.1):
 *   - Slug NOT in registry → notFound() (Next.js 404)
 *   - Slug in registry but status !== "active" → notFound()
 *   - Slug active but flag OFF → notFound() (no decoy)
 *   - Slug active AND flag ON → server-render the shell, mount
 *     the body via the client BodyMount dispatcher
 *
 * Why dispatch lives in a separate client component:
 *   Next.js refuses `next/dynamic({ ssr: false })` calls reached
 *   transitively from Server Components. The triple-gate logic
 *   stays server-side (this file); the actual body lazy-load
 *   lives in `./BodyMount.tsx` ("use client").
 *
 * Adding a new experiment:
 *   1. Add an entry to `lib/playground/registry`
 *   2. Create a `Body.tsx` under
 *      `app/playground/_experiments/<slug>/Body.tsx`
 *   3. Wire a `createExperimentBody` call + switch case in
 *      `./BodyMount.tsx`
 *   4. Run `npm run eval:playground` to verify alignment
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
        <BodyMount experiment={experiment} />
      </PlaygroundShell>
    </>
  );
}
