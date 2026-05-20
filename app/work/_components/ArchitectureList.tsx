/* ──────────────────────────────────────────────────────────────
 *  ArchitectureList — V6 Sub-PR 14.1
 *
 *  The Architecture composition of /work's mid block. Each of the
 *  five projects renders as a constellation strip (ProjectStrip)
 *  + walkthrough link. PawDoc + Aevum, which do not yet have
 *  shipped scroll-throughs, render with a "drafting" marker
 *  instead of an active walkthrough link — same posture as
 *  ArchitectureHubGrid's drafting modal in 6.1.
 *
 *  Server Component. No client JS. SVG strips are pre-rendered
 *  at build time (zero three.js, zero canvas).
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1
 *            ("Architecture mode: each project as a horizontal
 *             'constellation strip' … with a 'Read the walkthrough
 *             →' link into /architecture/<slug>").
 * ────────────────────────────────────────────────────────────── */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Pill from "@/components/ui/Pill";
import ProjectStrip from "./ProjectStrip";
import {
  WORK_ENTRIES,
  STATE_PILL,
  STATE_LABEL,
} from "@/app/work/_data/work-entries";

export default function ArchitectureList() {
  return (
    <ol
      id="architecture"
      aria-label="Project architectures"
      className="space-y-14 list-none"
    >
      {WORK_ENTRIES.map((entry) => (
        <li key={entry.projectSlug}>
          <article className="relative grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 pt-10 border-t border-white/[0.06]">
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 w-16 h-px bg-[#00d2ff]/30"
            />

            {/* Left rail — index, title, status pill. */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/85">
                  {entry.index}
                </span>
                <Pill
                  kind={STATE_PILL[entry.state]}
                  pulse={entry.state === "live"}
                >
                  {STATE_LABEL[entry.state]}
                </Pill>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] leading-tight text-primary">
                {entry.title}
              </h3>
              <p className="text-tertiary text-sm leading-relaxed max-w-md">
                {entry.oneLine}
              </p>
              {entry.architectureSlug ? (
                <Link
                  href={`/architecture/${entry.architectureSlug}`}
                  className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85 hover:text-[#00d2ff] transition-colors group pt-1"
                >
                  Read the walkthrough
                  <ArrowRight
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet pt-1">
                  Walkthrough drafting
                </p>
              )}
            </div>

            {/* Constellation strip — server-rendered SVG, derived from
                HeroTopologyData for each project. */}
            <div className="md:col-span-8 flex items-center md:justify-end">
              <ProjectStrip topologyId={entry.topologyId} />
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
