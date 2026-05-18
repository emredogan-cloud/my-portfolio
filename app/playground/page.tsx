import type { Metadata } from "next";
import VisitPing from "@/components/telemetry/VisitPing";
import PlaygroundShell from "@/app/playground/_components/PlaygroundShell";
import { getSiteUrl } from "@/lib/site-url";
import { getEnabledExperiments } from "@/lib/playground/registry";

/**
 * V4 Phase 5 Sub-PR 5.1 — Experimental playground index.
 *
 * The playground is intentionally HIDDEN from the global navbar.
 * Visitors who navigate here directly see either:
 *   - the empty-state placeholder (when no experiment is enabled
 *     via its env-var feature flag), or
 *   - a list of currently-enabled experiments.
 *
 * The index never advertises disabled experiments. The whole point
 * of the foundation is that experimental surfaces are INVISIBLE
 * until they earn their slot.
 *
 * Caching: 1h ISR. Adding experiments requires an env flip + redeploy
 * anyway, so the page rebuilds at the right cadence.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Playground — experimental research | Emre Doğan";
const PAGE_DESCRIPTION =
  "Experimental research surface, feature-flag-gated. Conditional Phase 5 work — disabled by default.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${getSiteUrl()}/playground` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/playground`,
    type: "website",
  },
  /* Don't index the playground — it's experimental research,
   * not a marketing surface. */
  robots: { index: false, follow: false },
};

export default function PlaygroundIndexPage() {
  const enabled = getEnabledExperiments();
  const isEmpty = enabled.length === 0;

  return (
    <>
      <VisitPing surface="playground" />
      <PlaygroundShell
        title="Playground"
        tagline="Experimental research, not production."
        framing="A separate surface from /lab. The lab ships sandboxes that are public, rate-limited, and cost-capped. The playground ships research that may stutter, burn CPU, require WebGPU, or otherwise be honestly imperfect. Every experiment is feature-flag-gated; this index only lists the ones currently enabled."
      >
        {isEmpty ? (
          <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
            <p className="mb-3">
              <span className="text-[#00d2ff]/80">$</span> playground.status
            </p>
            <p className="text-secondary mb-1">
              No experiments are currently enabled.
            </p>
            <p className="text-tertiary">
              Future experiments land in subsequent Phase 5 sub-PRs and
              ship behind <code className="text-primary">PLAYGROUND_FLAG_*</code>{" "}
              env vars. When a flag flips on, the experiment appears here
              the next time the page revalidates (1 hour cadence).
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {enabled.map((e) => (
              <li
                key={e.slug}
                className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
              >
                <a
                  href={`/playground/${e.slug}`}
                  className="block group"
                >
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <h2 className="text-lg font-medium text-primary tracking-tight group-hover:text-[#00d2ff] transition-colors">
                      {e.name}
                    </h2>
                    <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
                      /playground/{e.slug}
                    </span>
                  </div>
                  <p className="text-secondary text-sm leading-relaxed">
                    {e.purpose}
                  </p>
                  <p className="font-mono uppercase tracking-[0.16em] text-[9px] text-amber-300/70 mt-3">
                    {e.risk}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </PlaygroundShell>
    </>
  );
}
