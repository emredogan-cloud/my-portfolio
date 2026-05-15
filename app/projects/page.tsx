import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projectsData } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCardAnimator } from "./_components/ProjectCardAnimator";

export const metadata: Metadata = {
  title: "Projects — Emre Doğan",
  description:
    "Production-grade SaaS products, cloud infrastructure tools, and AI-native systems shipped end-to-end.",
};

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

export default function ProjectsPage() {
  return (
    <main id="main" className="min-h-screen bg-black">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.10) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">
        {/* Back link */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors duration-200 mb-12 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Home
          </Link>
        </Reveal>

        {/* Section header */}
        <Reveal mode="mount" duration={0.7} delay={0.1} className="mb-20">
          <span className="text-sm font-medium text-[#00d2ff] tracking-widest uppercase">
            Work
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mt-4 tracking-tight text-white">
            Things I&apos;ve shipped.
          </h1>
          <p className="mt-5 text-white/50 text-base md:text-lg max-w-xl leading-relaxed">
            A collection of products, infrastructure tools, and AI-native
            applications — from idea to production.
          </p>
        </Reveal>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projectsData.map((project, i) => (
            <ProjectCardAnimator key={project.id} delay={0.2 + i * 0.08}>
              <Link href={`/projects/${project.id}`} className="block h-full">
                <div className="liquid-glass rounded-2xl p-8 flex flex-col gap-6 h-full cursor-pointer transition-colors duration-300">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold text-white leading-snug">
                      {project.title}
                    </h2>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[project.status]}`}
                    >
                      {STATUS_LABEL[project.status]}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-white/55 text-sm leading-relaxed grow">
                    {project.shortDescription}
                  </p>

                  {/* Tech stack — first 4 tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/40">
                        +{project.techStack.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-xs text-white/30">
                      View case study
                    </span>
                    <ArrowRight size={14} className="text-white/30" />
                  </div>
                </div>
              </Link>
            </ProjectCardAnimator>
          ))}
        </div>
      </div>
    </main>
  );
}
