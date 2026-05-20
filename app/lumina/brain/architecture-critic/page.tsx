import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteUrl } from "@/lib/site-url";
import { readRoutingDecisions } from "@/lib/telemetry/metrics";
import { ARCHITECTURE_CRITIC_NAME } from "@/lib/lumina/agents/architecture-critic";

/**
 * V4 Phase 4 Sub-PR 4.5 — public transparency surface for the
 * architecture-critic sub-agent.
 *
 * Per V4 § 5.4 Sub-PR 4.3 validation criteria: "Public system
 * prompt (`/lumina/brain/architecture-critic`)". This page IS
 * that surface — it documents the agent's purpose, the routing
 * heuristic that selects it, the orchestration trace, the
 * critique discipline, and reveals the verbatim system prompt
 * via a deep link into the public source.
 *
 * Caching: 1h ISR, same posture as /lumina/brain.
 * Performance: server-rendered, one KV hash read at regen time.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Architecture Critic — Lumina sub-agent | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public transparency surface for the architecture-critic sub-agent. Routing heuristic, orchestration trace, critique discipline, deep links into the public source.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lumina/brain/architecture-critic`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lumina/brain/architecture-critic`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/blob/main";

const ROUTING_TRIGGERS: readonly { label: string; example: string }[] = [
  {
    label: "Explicit prefix",
    example: "@architecture-critic should I store secrets in Lambda env vars?",
  },
  {
    label: "Bracket marker",
    example: "[critic] review my cross-account scanner design",
  },
  {
    label: "Critique verb + architecture noun",
    example:
      "what are the tradeoffs of this dataflow pattern? — verb 'tradeoffs' + noun 'pattern'",
  },
  {
    label: "Question-form critique",
    example: "is this a good approach to multi-region failover?",
  },
];

const CRITIQUE_DISCIPLINE: readonly { step: string; body: string }[] = [
  {
    step: "1. Strongest concern first",
    body: "Open with the highest-impact observation. What's most likely to break, scale poorly, or cost a fortune. Don't soften. No filler preamble.",
  },
  {
    step: "2. Subtler concern second",
    body: "The issue that bites in production months later — maintainability, observability, incident response, edge cases.",
  },
  {
    step: "3. Alternatives placed, not pitched",
    body: "Briefly name 1-2 patterns with a different tradeoff profile so the visitor can pick.",
  },
  {
    step: "4. One specific recommendation",
    body: "The single change that would most improve the design as proposed. Not a list. Not a 'depends on your priorities' cop-out.",
  },
];

const SOURCE_LINKS: readonly { label: string; path: string; note: string }[] = [
  {
    label: "Agent definition",
    path: "lib/lumina/agents/architecture-critic.ts",
    note: "Full system prompt, init tool, and exported identity constants.",
  },
  {
    label: "Router",
    path: "lib/lumina/router.ts",
    note: "Heuristic classifier (no LLM call). Critique verbs + architecture nouns. Always falls back to default Lumina on ambiguity.",
  },
  {
    label: "Chat route dispatch",
    path: "app/api/chat/route.ts",
    note: "Where routeRequest() runs and the sub-agent prompt + synthetic init tool get composed.",
  },
];

export default async function ArchitectureCriticBrainPage() {
  /* Sub-agent invocation counts — same KV-read pattern the main
   * /lumina/brain page uses for tool counts. Graceful empty
   * object on KV miss. */
  const routing = await readRoutingDecisions();
  const luminaCalls = routing["lumina"] ?? 0;
  const criticCalls = routing["architecture-critic"] ?? 0;
  const totalRouted = luminaCalls + criticCalls;
  const criticShare =
    totalRouted > 0 ? Math.round((criticCalls / totalRouted) * 100) : 0;

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* HERO */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <Link
              href="/lumina/brain"
              className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              Lumina
            </Link>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">
              /
            </span>
            <Link
              href="/lumina/brain"
              className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              Brain
            </Link>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              {ARCHITECTURE_CRITIC_NAME}
            </span>
          </div>
        </Reveal>

        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">{ARCHITECTURE_CRITIC_NAME}.</span>
            <span className="block text-tertiary">
              The first Lumina sub-agent.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            A critique-discipline overlay routed onto Lumina when the
            visitor asks for an architectural review. Same Lumina
            voice, different shape of answer. Routing is
            deterministic and falls back to the default chat for
            anything ambiguous.
          </p>
        </Reveal>

        {/* WHEN IT FIRES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · When the router picks it
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            <code className="font-mono text-[13px] text-primary">
              routeRequest(messages)
            </code>{" "}
            inspects the most recent user message and returns either{" "}
            <code className="font-mono text-[13px] text-primary">lumina</code>{" "}
            (default) or{" "}
            <code className="font-mono text-[13px] text-primary">
              architecture-critic
            </code>
            . Trigger cases:
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {ROUTING_TRIGGERS.map((t) => (
              <li
                key={t.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {t.label}
                </span>
                <span className="text-secondary text-[13px] leading-relaxed font-mono">
                  {t.example}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-tertiary text-[13px] leading-relaxed mt-5 max-w-2xl">
            Everything else falls to the default Lumina path — the
            router&apos;s bias is deliberately toward single-agent
            mode (constitutional MUST: &ldquo;fail back to
            single-agent mode&rdquo;).
          </p>
        </Reveal>

        {/* CRITIQUE DISCIPLINE */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Critique discipline
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The system prompt shapes every response into the same
            four-step structure. Not because templates are good, but
            because a senior-engineer code review reads this way
            consistently and the visitor benefits from predictable
            shape.
          </p>
          <ol className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {CRITIQUE_DISCIPLINE.map((s) => (
              <li
                key={s.step}
                className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 py-4"
              >
                <span className="font-mono text-[13px] text-[#00d2ff]/90">
                  {s.step}
                </span>
                <span className="text-secondary text-[13px] leading-relaxed">
                  {s.body}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ORCHESTRATION TRACE */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · Orchestration trace
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The architecture-critic&apos;s system prompt mandates a
            single call to the synthetic{" "}
            <code className="font-mono text-[13px] text-primary">
              selectArchitectureCritic
            </code>{" "}
            tool before any text response. The chat UI&apos;s
            existing tool-status spinner renders this as the{" "}
            <code className="font-mono text-[13px] text-primary">
              engaging architecture-critic
            </code>{" "}
            pill — the constitutional &ldquo;visible orchestration
            tracing&rdquo; requirement satisfied through the
            primitive that&apos;s already there. The tool itself
            does no real work; it exists only to surface the trace.
          </p>
        </Reveal>

        {/* USAGE COUNTS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Routing decisions to date
          </h2>
          {totalRouted > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                      Agent
                    </th>
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal text-right">
                      Decisions
                    </th>
                    <th className="py-2 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal text-right">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-primary">
                      lumina
                    </td>
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-[#00d2ff]/90 text-right">
                      {luminaCalls.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 font-mono text-[12.5px] text-tertiary text-right">
                      {100 - criticShare}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-primary">
                      architecture-critic
                    </td>
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-[#00d2ff]/90 text-right">
                      {criticCalls.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 font-mono text-[12.5px] text-tertiary text-right">
                      {criticShare}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-tertiary text-sm italic">
              No routing decisions recorded yet. Counts land here
              the moment a chat turn passes through the router.
            </p>
          )}
        </Reveal>

        {/* SOURCE LINKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Source files
          </h2>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {SOURCE_LINKS.map((s) => (
              <li key={s.path}>
                <Link
                  href={`${REPO_BASE}/${s.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
                >
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                    {s.label}
                  </span>
                  <span>
                    <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                      {s.path}
                    </span>
                    <span className="text-secondary text-[13px] mt-1 block">
                      {s.note}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* FOOTER */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
              />
              <span>Sub-agent transparency</span>
              <span className="text-faint">·</span>
              <span>V4 § 4.4 Sub-PR 4.3</span>
              <span className="text-faint">·</span>
              <Link
                href="/lumina/brain"
                className="text-tertiary hover:text-[#00d2ff] transition-colors"
              >
                ← Brain
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
