import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { projectsData, type Project } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import Pill, { type PillKind } from "@/components/ui/Pill";
import { secondaryButton } from "@/lib/v6/glass";
import { HoverScaleAnchor } from "./_components/HoverScaleAnchor";
import { GalleryItem } from "./_components/GalleryItem";
import ProductionMetrics from "./_components/ProductionMetrics";
import AWSTopologyClient from "./_components/AWSTopologyClient";
import CWHSandbox from "./_components/CWHSandbox";
import CwhProCta from "@/components/cwh/CwhProCta";
import { TOPOLOGY_NODES } from "./_components/topology-data";
import StackByCategory from "./_components/StackByCategory";
import GallerySequence from "./_components/GallerySequence";

const STATUS_LABEL: Record<string, string> = {
  shipped: "Live",
  building: "Building",
  planning: "Planning",
};

/* V6 11.2 — typed Pill kind per project status.
   Emerald/blue/white-50 chip palette retired wholesale; the V6_PILL_VOCABULARY
   off-state falls back to the palette-neutral generic chip in Pill.tsx
   so no emerald/blue/purple literals remain in source. */
const STATUS_KIND: Record<string, PillKind> = {
  shipped: "state-live",
  building: "state-building",
  planning: "state-planning",
};

const TECH_CHIP_LEGACY =
  "px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-secondary";

/* Inline GitHub mark — server-renderable (no client state). lucide v1.14
   does not ship a Github icon, so we provide our own. */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/* ── Static-generation enablement ─────────────────────────── */

export async function generateStaticParams() {
  return projectsData.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectsData.find((p) => p.id === slug);
  if (!project) return {};
  return {
    title: `${project.title} — Emre Doğan`,
    description: project.shortDescription,
  };
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projectsData.find((p) => p.id === slug);

  if (!project) notFound();

  if (process.env.NEXT_PUBLIC_V6_PROJECT_DETAIL === "1") {
    return <V6ProjectDetailPage project={project} slug={slug} />;
  }
  return <LegacyProjectDetailPage project={project} slug={slug} />;
}

/* ──────────────────────────────────────────────────────────────
 *  V6 detail layout (Sub-PR 14.2)
 *
 *  Spec § Sub-PR 14.2 — per-project bespoke compositional moves
 *  while keeping the page structure parametric:
 *
 *    - Hero: title + status + paragraph + CTAs + cyan-tick'd
 *      pull-quote (single line from `project.pullQuote`).
 *    - Tech stack: 2-col category layout via StackByCategory
 *      (falls back to flat chips when stackByCategory absent).
 *    - Production Metrics (CWH only): kept verbatim — already in
 *      V6 11.2 pill vocabulary post-ProductionMetrics edit.
 *    - AWS Topology / CWHSandbox / CwhProCta (CWH only): kept
 *      verbatim. Strong assets per audit § 5.3.
 *    - Overview: margin-tick'd Q&A via `project.overviewSections`
 *      (falls back to flowing paragraphs when absent).
 *    - Gallery: stacked editorial sequence via GallerySequence
 *      (replaces uniform 2-col grid).
 *
 *  CWH retains its visually-identical position for the topology +
 *  sandbox surfaces per spec validation #1.
 * ────────────────────────────────────────────────────────────── */

function V6ProjectDetailPage({
  project,
  slug,
}: {
  project: Project;
  slug: string;
}) {
  const paragraphs = project.detailedDescription
    .split("\n\n")
    .filter(Boolean);

  return (
    <main id="main" className="min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Signal: cyan blob top-right + diagonal hairline cyan rule. */}
      <PageAtmosphere
        variant="signal"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.10)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(0,210,255,0.04)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">
        {/* Back link */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary text-sm transition-colors duration-200 mb-16 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            All Projects
          </Link>
        </Reveal>

        {/* ───────── HERO ─────────
            Title + status + paragraph + CTAs verbatim from V5.
            V6 14.2 adds the cyan-tick'd pull-quote line — a single
            margin-tick'd sentence drawn from `project.pullQuote`.
            When absent (V5-safe), the pull-quote block is omitted
            and the hero collapses to the V5 spacing. */}
        <Reveal mode="mount" duration={0.75} delay={0.1} y={24} className="space-y-7">
          {/* Status + eyebrow */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#00d2ff] tracking-widest uppercase">
              Project
            </span>
            <span className="text-faint">·</span>
            <Pill
              kind={STATUS_KIND[project.status]}
              pulse={project.status === "shipped"}
            >
              {STATUS_LABEL[project.status]}
            </Pill>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[0.95] text-primary">
            {project.title}
          </h1>

          {/* Short description */}
          <p className="text-tertiary text-lg leading-relaxed max-w-2xl">
            {project.shortDescription}
          </p>

          {/* V6 14.2 — cyan-tick'd pull-quote.
              Single founder-voice sentence; margin tick (V6 § 11.5
              vocabulary) anchors the line as editorial-pull. Renders
              only when the project carries a pullQuote. */}
          {project.pullQuote ? (
            <div className="relative pl-5 max-w-2xl pt-2">
              <span
                aria-hidden="true"
                className="absolute left-0 top-3 w-3 h-px bg-[#00d2ff]/60"
              />
              <p className="text-secondary text-[15.5px] leading-[1.85] italic">
                {project.pullQuote}
              </p>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {project.liveUrl && (
              <HoverScaleAnchor
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-2.5 transition-colors hover:bg-white/90"
              >
                <ExternalLink size={14} />
                Visit Website
              </HoverScaleAnchor>
            )}
            {project.githubUrl && (
              <HoverScaleAnchor
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${secondaryButton()} rounded-full inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary hover:text-primary transition-colors duration-200`}
              >
                <GitHubIcon className="w-3.5 h-3.5" />
                GitHub
              </HoverScaleAnchor>
            )}
          </div>
        </Reveal>

        {/* ───────── TECH STACK ─────────
            V6 14.2 — 2-col category layout via StackByCategory when
            the project carries `stackByCategory`. Graceful fallback
            to the V5 flat chip list otherwise (spec validation #3:
            "Tech-stack categories work without backfill in data
            file"). */}
        <Reveal mode="mount" duration={0.65} delay={0.3} className="mt-14 pt-10 border-t border-white/[0.08]">
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-6">
            Tech Stack
          </p>
          {project.stackByCategory ? (
            <StackByCategory categories={project.stackByCategory} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tag) => (
                <Pill key={tag} kind="meta" legacy={TECH_CHIP_LEGACY}>
                  {tag}
                </Pill>
              ))}
            </div>
          )}
        </Reveal>

        {/* ── Production Metrics (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && <ProductionMetrics />}

        {/* ── AWS Topology (Cloud Waste Hunter only) ──
            The visual is canvas/SVG — invisible to crawlers and
            screen readers. The <ul> below is the accessible
            equivalent: same node list, server-rendered, sr-only so
            visitors only see the interactive layer. */}
        {slug === "aws-waste-hunter" && (
          <Reveal
            mode="mount"
            duration={0.65}
            delay={0.45}
            className="mt-14 pt-10 border-t border-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <p className="text-xs font-medium text-quiet tracking-widest uppercase">
                AWS Topology
              </p>
              <span className="text-[10px] uppercase tracking-[0.18em] text-quiet">
                Drag to rotate · hover for context
              </span>
            </div>

            <ul className="sr-only">
              {TOPOLOGY_NODES.map((n) => (
                <li key={n.id}>
                  <strong>{n.label}.</strong> {n.blurb}
                </li>
              ))}
            </ul>

            <div aria-hidden="true">
              <AWSTopologyClient />
            </div>
          </Reveal>
        )}

        {/* ── Live IAM auditor sandbox (Cloud Waste Hunter only) ──
            Same model + system prompt the production SaaS uses for
            policy remediation. Rate-limited at 5 / IP / hour at the
            edge. */}
        {slug === "aws-waste-hunter" && (
          <Reveal
            mode="mount"
            duration={0.65}
            delay={0.55}
            className="mt-14 pt-10 border-t border-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <p className="text-xs font-medium text-quiet tracking-widest uppercase">
                Try the auditor
              </p>
              <Pill kind="state-live">Live · Bedrock</Pill>
            </div>
            <CWHSandbox />
          </Reveal>
        )}

        {/* ── CWH Pro CTA (Cloud Waste Hunter only) ──
            Native, inline conversion surface. /pro is intentionally
            absent from the global navbar; this card is how project-
            page visitors discover the commercial tier. */}
        {slug === "aws-waste-hunter" && (
          <Reveal mode="mount" duration={0.65} delay={0.6}>
            <CwhProCta />
          </Reveal>
        )}

        {/* ───────── OVERVIEW ─────────
            V6 14.2 — margin-tick'd Q&A structure via
            `project.overviewSections`. Each section renders with a
            one-word mono margin label adjacent to the paragraph
            body. Graceful fallback to V5 flowing paragraphs when
            overviewSections is absent. */}
        <Reveal mode="mount" duration={0.65} delay={0.4} className="mt-14 pt-10 border-t border-white/[0.08]">
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
            Overview
          </p>
          {project.overviewSections ? (
            <div className="space-y-10">
              {project.overviewSections.map((section) => (
                <div
                  key={section.label}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 relative"
                >
                  <span
                    aria-hidden="true"
                    className="hidden md:block absolute top-2 left-0 w-6 h-px bg-[#00d2ff]/45"
                  />
                  <div className="md:col-span-3">
                    <p className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/85 md:pl-9 md:pt-1">
                      {section.label}
                    </p>
                  </div>
                  <p className="md:col-span-9 text-secondary text-[15px] leading-[1.85] max-w-2xl">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-secondary text-base leading-[1.85] max-w-2xl"
                >
                  {para}
                </p>
              ))}
            </div>
          )}
        </Reveal>

        {/* ───────── GALLERY ─────────
            V6 14.2 — stacked editorial sequence (large lead + 2
            small + large final) via GallerySequence. Replaces the
            V5 uniform 2-col grid. */}
        {project.images.length > 0 && (
          <Reveal mode="mount" duration={0.65} delay={0.55} className="mt-14 pt-10 border-t border-white/[0.08]">
            <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
              Gallery
            </p>
            <GallerySequence
              images={project.images}
              title={project.title}
            />
          </Reveal>
        )}
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Legacy detail layout (V5 baseline, rollback path)
 *
 *  Preserved verbatim from the pre-14.2 page body. When
 *  NEXT_PUBLIC_V6_PROJECT_DETAIL is off (default) every project
 *  detail renders through this branch — byte-identical to the V5
 *  surface. Rollback contract: flag off → V5 detail layout per
 *  the 14.2 spec.
 * ────────────────────────────────────────────────────────────── */

function LegacyProjectDetailPage({
  project,
  slug,
}: {
  project: Project;
  slug: string;
}) {
  const paragraphs = project.detailedDescription
    .split("\n\n")
    .filter(Boolean);

  return (
    <main id="main" className="min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Signal: cyan blob top-right + diagonal hairline cyan rule. */}
      <PageAtmosphere
        variant="signal"
        legacy={{
          primary: {
            color: "rgba(14,165,233,0.12)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.10)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">
        {/* Back link */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary text-sm transition-colors duration-200 mb-16 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            All Projects
          </Link>
        </Reveal>

        {/* ── Hero ── */}
        <Reveal mode="mount" duration={0.75} delay={0.1} y={24} className="space-y-7">
          {/* Status + eyebrow */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#00d2ff] tracking-widest uppercase">
              Project
            </span>
            <span className="text-faint">·</span>
            <Pill kind={STATUS_KIND[project.status]}>
              {STATUS_LABEL[project.status]}
            </Pill>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[0.95] text-primary">
            {project.title}
          </h1>

          {/* Short description */}
          <p className="text-tertiary text-lg leading-relaxed max-w-2xl">
            {project.shortDescription}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {project.liveUrl && (
              <HoverScaleAnchor
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-2.5 transition-colors hover:bg-white/90"
              >
                <ExternalLink size={14} />
                Visit Website
              </HoverScaleAnchor>
            )}
            {project.githubUrl && (
              <HoverScaleAnchor
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${secondaryButton()} rounded-full inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary hover:text-primary transition-colors duration-200`}
              >
                <GitHubIcon className="w-3.5 h-3.5" />
                GitHub
              </HoverScaleAnchor>
            )}
          </div>
        </Reveal>

        {/* ── Tech stack ── */}
        <Reveal mode="mount" duration={0.65} delay={0.3} className="mt-14 pt-10 border-t border-white/[0.08]">
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-4">
            Tech Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tag) => (
              <Pill key={tag} kind="meta" legacy={TECH_CHIP_LEGACY}>
                {tag}
              </Pill>
            ))}
          </div>
        </Reveal>

        {/* ── Production Metrics (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && <ProductionMetrics />}

        {/* ── AWS Topology (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && (
          <Reveal
            mode="mount"
            duration={0.65}
            delay={0.45}
            className="mt-14 pt-10 border-t border-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <p className="text-xs font-medium text-quiet tracking-widest uppercase">
                AWS Topology
              </p>
              <span className="text-[10px] uppercase tracking-[0.18em] text-quiet">
                Drag to rotate · hover for context
              </span>
            </div>

            <ul className="sr-only">
              {TOPOLOGY_NODES.map((n) => (
                <li key={n.id}>
                  <strong>{n.label}.</strong> {n.blurb}
                </li>
              ))}
            </ul>

            <div aria-hidden="true">
              <AWSTopologyClient />
            </div>
          </Reveal>
        )}

        {/* ── Live IAM auditor sandbox (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && (
          <Reveal
            mode="mount"
            duration={0.65}
            delay={0.55}
            className="mt-14 pt-10 border-t border-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <p className="text-xs font-medium text-quiet tracking-widest uppercase">
                Try the auditor
              </p>
              <Pill kind="state-live">Live · Bedrock</Pill>
            </div>
            <CWHSandbox />
          </Reveal>
        )}

        {/* ── CWH Pro CTA (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && (
          <Reveal mode="mount" duration={0.65} delay={0.6}>
            <CwhProCta />
          </Reveal>
        )}

        {/* ── Detailed description ── */}
        <Reveal mode="mount" duration={0.65} delay={0.4} className="mt-14 pt-10 border-t border-white/[0.08] space-y-6">
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-6">
            Overview
          </p>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-secondary text-base leading-[1.85] max-w-2xl"
            >
              {para}
            </p>
          ))}
        </Reveal>

        {/* ── Image gallery ── */}
        {project.images.length > 0 && (
          <Reveal mode="mount" duration={0.65} delay={0.55} className="mt-14 pt-10 border-t border-white/[0.08]">
            <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
              Gallery
            </p>
            <div
              className={`grid gap-4 ${
                project.images.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {project.images.map((src, i) => (
                <GalleryItem
                  key={src}
                  src={src}
                  alt={`${project.title} screenshot ${i + 1}`}
                />
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}
