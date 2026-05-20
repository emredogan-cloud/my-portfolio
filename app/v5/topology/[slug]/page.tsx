import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteUrl } from "@/lib/site-url";
import { isTopologyRenderEnabled } from "@/lib/v5/topology/flags";
import {
  getEvolutionEventsForNode,
} from "@/lib/v5/topology/temporal-link";
import {
  getNeighbors,
  getProjectSubgraph,
  getTopologyNodeById,
} from "@/lib/v5/topology/registry";
import { toRenderable } from "@/lib/v5/topology/render-abstraction";

import TopologyMount from "@/app/v5/topology/_components/TopologyMount";

/**
 * V5 Phase 8 Sub-PR 8.3 — /v5/topology/[slug] route.
 *
 * The spectacle moment. ONE production project mount per Phase
 * 8's "ONE SPECTACLE ONLY" rule. Cloud Waste Hunter is the
 * sole enabled slug; every other route under this segment
 * returns 404 (including when the operator flag is off).
 *
 * Why CWH first
 *   - The registry already carries 3 architectural events for
 *     CWH (the 3D topology scene, the hero transplant, the
 *     Pro monetization launch). The subgraph the topology
 *     mount renders has enough density to read as a real
 *     project picture, not an empty proof-of-concept.
 *   - CWH is the portfolio's strongest single project case
 *     study. The topology page is its case study's structural
 *     companion — the architecture page tells the story
 *     linearly; the topology page shows the system in space.
 *
 * Gate hierarchy
 *   1. `V5_TOPOLOGY_RENDER_ENABLED === "1"` — operator flag.
 *      Default OFF; the operator flips when the surface is
 *      ready to ship publicly.
 *   2. `slug ∈ ENABLED_SLUGS` — only "cloud-waste-hunter" in
 *      8.3. Future sub-PRs add other projects explicitly.
 *   3. The slug must resolve to a real project node in the
 *      topology registry. Defensive — the validator already
 *      catches inconsistency.
 *
 * Both gates closed → `notFound()` → 404. No partial render,
 * no flag-status disclosure, no operator surface. The page
 * is either visible-and-complete or absent.
 *
 * SEO posture
 *   - When the flag is on, the page is indexable. The SVG
 *     renderer's server-rendered output gives crawlers the
 *     full topology as semantic SVG with `<title>` per node.
 *   - When the flag is off, the route returns 404; no
 *     content leaks. The sitemap intentionally does NOT
 *     list /v5/topology/* — the operator can add the entry
 *     once the surface is publicly stable.
 *
 * Performance
 *   - Server Component. The page itself is static; no KV
 *     reads on the page render path (the topology graph is
 *     in-memory at build time).
 *   - The SVG renderer is part of the SSR HTML. LCP is the
 *     hero `h1` or the first paint of the SVG, whichever
 *     comes earlier — both are server-rendered.
 *   - The Three.js dynamic chunk loads only after hydration
 *     for visitors who qualify (desktop + no reduced-motion).
 *     LCP-bound content is already on screen by then.
 *
 * Phase 8 voice
 *   The page is editorial. The topology renderer is centred,
 *   surrounded by prose that explains what the visitor is
 *   seeing in OPERATOR vocabulary, not marketing vocabulary.
 *   Visitors should NEVER think "nice animation"; they
 *   should think "this system seems to understand itself".
 */

/* Sub-PR 8.3 ships ONE project mount. Future sub-PRs add
 * other slugs explicitly. */
const ENABLED_SLUGS = ["cloud-waste-hunter"] as const;
type EnabledSlug = (typeof ENABLED_SLUGS)[number];

function isEnabledSlug(value: string): value is EnabledSlug {
  return (ENABLED_SLUGS as readonly string[]).includes(value);
}

interface TopologyPageProps {
  params: Promise<{ slug: string }>;
}

/* Prebuild only the enabled slugs at build time. Unknown
 * slugs hit the runtime path and `notFound()`. */
export function generateStaticParams() {
  return ENABLED_SLUGS.map((slug) => ({ slug }));
}

const REPO_BASE = "https://github.com/emredogan-cloud/my-portfolio/blob/main";

export async function generateMetadata({
  params,
}: TopologyPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isTopologyRenderEnabled() || !isEnabledSlug(slug)) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  const node = getTopologyNodeById(slug);
  const title = `${node?.label ?? slug} — Topology | Emre Doğan`;
  const description =
    `The engineering-cognition topology surface for ${
      node?.label ?? slug
    }. ` +
    `One project's place in the portfolio's self-described system graph.`;
  const canonical = `${getSiteUrl()}/v5/topology/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function TopologyPage({ params }: TopologyPageProps) {
  const { slug } = await params;

  /* Gate 1: operator flag. */
  if (!isTopologyRenderEnabled()) {
    notFound();
  }

  /* Gate 2: enabled slug whitelist. */
  if (!isEnabledSlug(slug)) {
    notFound();
  }

  /* Gate 3: project node exists in the registry. */
  const projectNode = getTopologyNodeById(slug);
  if (!projectNode || projectNode.kind !== "project") {
    notFound();
  }

  /* Resolve the project subgraph (BFS 2 hops). The mount
   * receives a renderable topology slice; the SVG renderer
   * paints it server-side, the Three.js renderer (if the
   * client qualifies) paints it after hydration. */
  const subgraph = getProjectSubgraph(slug, 2);
  const renderable = toRenderable({
    nodes: subgraph.nodes,
    relationships: subgraph.relationships,
  });

  /* Surrounding context for the editorial framing — direct
   * neighbors of the project node, the project's evolution
   * events. All read in-memory; no I/O. */
  const neighbors = getNeighbors(slug);
  const evolutionEvents = getEvolutionEventsForNode(slug);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient cyan atmosphere — same gradient stack as
          /lumina/brain and /v5/perception. Visual continuity
          across V5 meta surfaces. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
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

      <VisitPing surface="topology" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">
        {/* EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
              V5
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-[10px] text-faint"
            >
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Topology · {projectNode.label}
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 8 — the engineering cognition surface. One project mount; the visible spectacle Phase 8 reserves."
            >
              Phase 8 · topology
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">{projectNode.label}.</span>
            <span className="block text-tertiary">
              The system describes itself.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            {projectNode.description}
          </p>
        </Reveal>

        {/* THE TOPOLOGY — central editorial moment. The mount
            renders the SVG path on first paint (SSR + reduced-
            motion + mobile), upgrades to Three.js after the
            client capability check resolves (desktop + motion
            allowed). */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · The graph
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-7 max-w-2xl">
            Each circle is a system, project, phase, architecture,
            tool, memory, telemetry, lab, or evolution event.
            Each line is a relationship — depends_on, evolved_into,
            powers, observes, introduced, influences, or related_to.
            The visual treatment is deliberately restrained: one
            hue, no animation theatre, no interpretation overlay.
            This is the system&apos;s own description of itself,
            not a marketing diagram.
          </p>
          <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4 md:p-6">
            <TopologyMount graph={renderable} slug={slug} />
          </div>
          <p className="text-tertiary text-[12px] leading-relaxed mt-4 max-w-2xl">
            On desktop the graph upgrades to a 3D scene after the
            capability check resolves. Reduced-motion + mobile
            viewports stay on the static SVG path — the same data,
            painted differently. The full graph (every project +
            every system) is at{" "}
            <Link
              href="/api/v5/topology/graph"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /api/v5/topology/graph
            </Link>
            .
          </p>
        </Reveal>

        {/* NEIGHBORS — what's directly connected to this
            project. The editorial accompaniment to the visual
            graph. */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Direct neighbors
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The nodes one hop away from {projectNode.label} in the
            registry — the systems that power it, the
            architectures it inherits from, the phases that
            introduced its supporting layers.
          </p>
          {neighbors.length === 0 ? (
            <p className="text-tertiary text-sm leading-relaxed">
              No direct neighbors recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
              {neighbors.map(({ node, via, direction }) => (
                <li
                  key={`${via.id}-${direction}`}
                  className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6"
                >
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                    {direction === "outgoing" ? "→" : "←"} {via.kind}
                  </span>
                  <span>
                    <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                      {node.label}
                    </span>
                    {node.description ? (
                      <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                        {node.description}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* EVOLUTION EVENTS — temporal cross-link. */}
        {evolutionEvents.length > 0 ? (
          <Reveal duration={0.7} className="mb-14">
            <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
              03 · Recorded evolution
            </h2>
            <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
              The architectural moments the engineering memory
              archive records about {projectNode.label}.
            </p>
            <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
              {evolutionEvents.map((event) => (
                <li
                  key={event.id}
                  className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6"
                >
                  <span className="font-mono text-[11px] text-tertiary tabular-nums">
                    {event.date}
                  </span>
                  <span>
                    <Link
                      href={`/evolution#${event.id}`}
                      className="font-mono text-[13px] text-[#00d2ff]/90 block hover:text-[#00d2ff] transition-colors"
                    >
                      {event.title}
                    </Link>
                    <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                      {event.summary}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {/* CROSS-LINKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Related surfaces
          </h2>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            <li>
              <Link
                href={`/architecture/${slug}`}
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  /architecture/{slug}
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    Scroll-through architecture
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    The linear narrative of how this project
                    works — milestone by milestone, in order.
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`/evolution?system=${slug}`}
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  /evolution
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    Engineering memory archive
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    Every event the registry records about this
                    project, filtered to its system slug.
                  </span>
                </span>
              </Link>
            </li>
            {projectNode.href && projectNode.href !== `/architecture/${slug}` ? (
              <li>
                <Link
                  href={projectNode.href}
                  className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
                >
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                    {projectNode.href}
                  </span>
                  <span>
                    <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                      Project case study
                    </span>
                    <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                      The detail page for this project.
                    </span>
                  </span>
                </Link>
              </li>
            ) : null}
          </ul>
        </Reveal>

        {/* SOURCE FILES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Source files
          </h2>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            <li>
              <Link
                href={`${REPO_BASE}/data/topology/graph.ts`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  Graph data
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    data/topology/graph.ts
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    The hand-curated registry — 22 nodes + 28
                    relationships. Append-only.
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`${REPO_BASE}/lib/v5/topology/renderers/svg-renderer.tsx`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  SVG renderer
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    lib/v5/topology/renderers/svg-renderer.tsx
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    Server-renderable, crawler-friendly,
                    reduced-motion fallback.
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`${REPO_BASE}/lib/v5/topology/renderers/three-renderer.tsx`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  Three.js renderer
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    lib/v5/topology/renderers/three-renderer.tsx
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    Desktop-enhanced; <code className="font-mono text-[12px] text-primary">frameloop=&quot;demand&quot;</code> collapses idle CPU to 0%.
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`${REPO_BASE}/app/v5/topology/%5Bslug%5D/page.tsx`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  This page
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    app/v5/topology/[slug]/page.tsx
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    The route + the editorial framing.
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </Reveal>

        {/* FOOTER */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12 space-y-3">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 8 · Spectacle &amp; Topology Intelligence</span>
              <span className="text-faint">·</span>
              <span>One spectacle only</span>
              <span className="text-faint">·</span>
              <span>Restraint preserved</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              The cognition foundation landed in Sub-PR 8.1 (the
              schema + the registry + the cross-system bindings).
              The renderer chassis landed in Sub-PR 8.2 (SVG +
              Three.js, capability-driven dispatch, idle frame
              0). Sub-PR 8.3 mounts the chassis on this single
              project route. The visitor reading this page should
              feel that the system understands itself — not that
              it shipped a cool graphic.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
