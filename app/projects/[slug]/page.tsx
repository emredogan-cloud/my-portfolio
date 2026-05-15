import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { projectsData } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";
import { HoverScaleAnchor } from "./_components/HoverScaleAnchor";
import { GalleryItem } from "./_components/GalleryItem";
import ProductionMetrics from "./_components/ProductionMetrics";

const STATUS_LABEL: Record<string, string> = {
  shipped: "Live",
  building: "Building",
  planning: "Planning",
};

const STATUS_STYLE: Record<string, string> = {
  shipped: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  building: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  planning: "bg-white/5 text-white/50 border border-white/10",
};

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

  const paragraphs = project.detailedDescription
    .split("\n\n")
    .filter(Boolean);

  return (
    <main id="main" className="min-h-screen bg-black">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-150px] right-[-150px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">
        {/* Back link */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors duration-200 mb-16 group"
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
            <span className="text-white/20">·</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[project.status]}`}
            >
              {STATUS_LABEL[project.status]}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[0.95] text-white">
            {project.title}
          </h1>

          {/* Short description */}
          <p className="text-white/55 text-lg leading-relaxed max-w-2xl">
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
                className="glass-panel rounded-full inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white/75 hover:text-white transition-colors duration-200"
              >
                <GitHubIcon className="w-3.5 h-3.5" />
                GitHub
              </HoverScaleAnchor>
            )}
          </div>
        </Reveal>

        {/* ── Tech stack ── */}
        <Reveal mode="mount" duration={0.65} delay={0.3} className="mt-14 pt-10 border-t border-white/[0.08]">
          <p className="text-xs font-medium text-white/30 tracking-widest uppercase mb-4">
            Tech Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        {/* ── Production Metrics (Cloud Waste Hunter only) ── */}
        {slug === "aws-waste-hunter" && <ProductionMetrics />}

        {/* ── Detailed description ── */}
        <Reveal mode="mount" duration={0.65} delay={0.4} className="mt-14 pt-10 border-t border-white/[0.08] space-y-6">
          <p className="text-xs font-medium text-white/30 tracking-widest uppercase mb-6">
            Overview
          </p>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-white/70 text-base leading-[1.85] max-w-2xl"
            >
              {para}
            </p>
          ))}
        </Reveal>

        {/* ── Image gallery ── */}
        {project.images.length > 0 && (
          <Reveal mode="mount" duration={0.65} delay={0.55} className="mt-14 pt-10 border-t border-white/[0.08]">
            <p className="text-xs font-medium text-white/30 tracking-widest uppercase mb-8">
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
