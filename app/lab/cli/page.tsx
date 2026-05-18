import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExperimentFrame from "@/app/lab/_components/ExperimentFrame";
import AnimatedTerminal from "./_components/AnimatedTerminal";
import { getExperiment } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `/lab/cli` — terminal-access discovery surface for the
 * `@emredogan/cli` npm package. Phase 2 polish (CLI discovery).
 *
 * Unlike `/lab/iam-translator`, `/lab/prompt-rescuer`, and
 * `/lab/commit-narrator` (which are interactive sandboxes), this
 * page is **documentation + a looping animation**. There is no
 * backend route — install steps + command reference + an
 * `AnimatedTerminal` showcase that loops through a developer's
 * shell session.
 *
 * Server Component shell. The terminal animation lives in a
 * single client island; everything else (sections, copy, headings)
 * is server-rendered.
 */

const PAGE_TITLE = "emredogan-cli · Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "The entire portfolio, accessible via your terminal. Install @emredogan/cli, ask Lumina without leaving the shell, list projects, open a /lab experiment.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab/cli`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab/cli`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

interface CommandRow {
  command: string;
  purpose: string;
  group: "Core" | "Read" | "Build";
}

const COMMANDS: readonly CommandRow[] = [
  {
    group: "Core",
    command: "emredogan browse",
    purpose: "Open emredogan.com in the default browser.",
  },
  {
    group: "Core",
    command: 'emredogan ask "<question>"',
    purpose:
      "Stream a Lumina reply to stdout — same model + system prompt as the chat widget on the live site.",
  },
  {
    group: "Core",
    command: "emredogan project list",
    purpose:
      "Print the live projects: title, status, blurb, live and GitHub URLs.",
  },
  {
    group: "Core",
    command: "emredogan demo <slug>",
    purpose:
      "Open a /lab experiment in the default browser. Known slugs: iam-translator, prompt-rescuer, commit-narrator, cli.",
  },
  {
    group: "Read",
    command: "emredogan changelog",
    purpose:
      "Fetch the last 5 commits from the public engineering log and print each with its WHY paragraph (wrapped at 76 columns).",
  },
  {
    group: "Read",
    command: "emredogan telemetry",
    purpose:
      "Print a curated 6-metric snapshot of the platform as a 3-column ASCII table — Lumina p95, auto-tweet successes, npm downloads, lab adoption.",
  },
  {
    group: "Read",
    command: "emredogan hire",
    purpose:
      "Print Emre's contact card as a bordered Unicode box. Static — no network call, renders identically offline.",
  },
  {
    group: "Build",
    command: 'emredogan lab <experiment> "<input>"',
    purpose:
      "POST to a /lab experiment and stream the reply to stdout. Aliases: iam | prompt | commit. Backend rate-limit + cost-cap apply transparently.",
  },
];

const COMMAND_GROUPS: ReadonlyArray<CommandRow["group"]> = [
  "Core",
  "Read",
  "Build",
];

export default function CliLabPage() {
  const experiment = getExperiment("cli");
  if (!experiment || experiment.status !== "active") {
    notFound();
  }

  return (
    <ExperimentFrame
      experiment={experiment}
      tagline="Terminal access."
      framing="The entire portfolio, exposed to your terminal. Four commands, zero dependencies, POSIX-only. Same Lumina voice; no browser tab. Install once and reach the live site from anywhere your shell already runs."
      customFooter={
        <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            aria-hidden="true"
            className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
          />
          <span>Open source · MIT</span>
          <span className="text-faint">·</span>
          <span>Zero runtime deps</span>
          <span className="text-faint">·</span>
          <span>POSIX-only (v0.1)</span>
          <span className="text-faint">·</span>
          <a
            href="https://www.npmjs.com/package/@emredogan/cli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tertiary hover:text-[#00d2ff]/90 transition-colors"
          >
            npm
          </a>
          <span className="text-faint">·</span>
          <a
            href="https://github.com/emredogan-cloud/my-portfolio/tree/main/packages/emredogan-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tertiary hover:text-[#00d2ff]/90 transition-colors"
          >
            source
          </a>
        </p>
      }
    >
      {/* SHOWCASE — looping animated terminal */}
      <div className="mb-12">
        <AnimatedTerminal />
      </div>

      {/* INSTALL */}
      <section className="mb-12">
        <h2 className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-4">
          Install
        </h2>
        <p className="text-secondary text-[15px] leading-[1.75] mb-5 max-w-2xl">
          One install line. The package is publicly available on npm
          under the <code className="font-mono text-primary/90">@emredogan</code>{" "}
          scope.
        </p>
        <div className="rounded-2xl border border-white/[0.08] bg-black px-5 py-4 mb-5">
          <code className="font-mono text-[13.5px] text-primary/90 leading-snug whitespace-pre">
            <span className="text-[#00d2ff]/70 select-none">$ </span>
            npm install -g @emredogan/cli
          </code>
        </div>
        <p className="text-tertiary text-[13.5px] leading-[1.75] max-w-2xl">
          Prefer{" "}
          <code className="font-mono text-primary/85">npx</code>? Skip the
          global install:
        </p>
        <div className="rounded-2xl border border-white/[0.08] bg-black px-5 py-4 mt-2 mb-5">
          <code className="font-mono text-[13.5px] text-primary/90 leading-snug whitespace-pre">
            <span className="text-[#00d2ff]/70 select-none">$ </span>
            npx emredogan ask &quot;How is /telemetry cached?&quot;
          </code>
        </div>
        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Node 20+</span>
          <span className="text-faint">·</span>
          <span>macOS or Linux</span>
          <span className="text-faint">·</span>
          <span>Windows: v0.2 (deferred)</span>
        </p>
      </section>

      {/* COMMANDS — grouped into Core / Read / Build so eight rows
          read as one cohesive set rather than a flat dump. */}
      <section className="mb-4">
        <h2 className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-4">
          Commands
        </h2>
        {COMMAND_GROUPS.map((group) => {
          const rows = COMMANDS.filter((c) => c.group === group);
          if (rows.length === 0) return null;
          return (
            <div key={group} className="mb-7 last:mb-0">
              <h3 className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet mb-2">
                {group}
              </h3>
              <dl className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
                {rows.map((c) => (
                  <div
                    key={c.command}
                    className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 md:gap-6 py-4"
                  >
                    <dt className="font-mono text-[13px] text-primary/90 leading-snug">
                      <span className="text-[#00d2ff]/70 select-none">
                        ${" "}
                      </span>
                      {c.command}
                    </dt>
                    <dd className="text-tertiary text-[13.5px] leading-[1.75]">
                      {c.purpose}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>--help, -h</span>
          <span className="text-faint">·</span>
          <span>--version, -V</span>
          <span className="text-faint">·</span>
          <span>EMREDOGAN_API_URL override (staging / local dev)</span>
        </p>
      </section>
    </ExperimentFrame>
  );
}
