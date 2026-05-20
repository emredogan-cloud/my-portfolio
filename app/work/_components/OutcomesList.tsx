/* ──────────────────────────────────────────────────────────────
 *  OutcomesList — V6 Sub-PR 14.1
 *
 *  The Outcomes composition of /work's mid block. Each of the
 *  five projects renders as a wide editorial row: index + status,
 *  title, blurb, the representative metric, and the visit / GitHub
 *  CTAs when present.
 *
 *  Server Component. No client JS. Wide-screen reading rhythm,
 *  not a grid — one row per project, separated by margin-tick'd
 *  hairlines (V6 § 11.5 vocabulary).
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1
 *            ("Outcomes mode: each project as a wide editorial
 *             row with blurb + visit/github links + a single
 *             representative metric").
 * ────────────────────────────────────────────────────────────── */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Pill from "@/components/ui/Pill";
import {
  WORK_ENTRIES,
  STATE_PILL,
  STATE_LABEL,
} from "@/app/work/_data/work-entries";

/* Inline GitHub mark — lucide v1.14 does not ship a Github icon, so
   we provide our own. Same SVG path as the project detail page. */
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

export default function OutcomesList() {
  return (
    <ol
      id="outcomes"
      aria-label="Project outcomes"
      className="space-y-14 list-none"
    >
      {WORK_ENTRIES.map((entry) => (
        <li key={entry.projectSlug}>
          <article className="relative grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 pt-10 border-t border-white/[0.06]">
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 w-16 h-px bg-[#00d2ff]/30"
            />

            {/* Left rail — index + status pill. */}
            <div className="md:col-span-3 flex md:flex-col items-baseline md:items-start gap-3 md:gap-2.5">
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

            {/* Body — title, outcome paragraph, metric line, CTAs. */}
            <div className="md:col-span-9 space-y-4">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] leading-tight text-primary">
                {entry.title}
              </h3>
              <p className="text-secondary text-[15px] leading-[1.85] max-w-3xl">
                {entry.outcome}
              </p>
              <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
                {entry.metric}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <Link
                  href={`/projects/${entry.projectSlug}`}
                  className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85 hover:text-[#00d2ff] transition-colors group"
                >
                  Case study
                  <ArrowRight
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                {entry.liveUrl ? (
                  <a
                    href={entry.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors group"
                  >
                    Visit
                    <ArrowRight
                      className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ transform: "rotate(-45deg)" }}
                      aria-hidden="true"
                    />
                  </a>
                ) : null}
                {entry.githubUrl ? (
                  <a
                    href={entry.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors"
                  >
                    <GitHubIcon className="w-3 h-3" />
                    GitHub
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
