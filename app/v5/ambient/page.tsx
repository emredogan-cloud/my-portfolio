import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteUrl } from "@/lib/site-url";
import {
  CONTEXT_DOMAIN_REGISTRY,
  listContextDomains,
} from "@/lib/v5/ambient/domains";
import { isAmbientEnabled } from "@/lib/v5/ambient/flags";
import { composeAmbientContext } from "@/lib/v5/ambient/registry";
import {
  AMBIENT_ADOPTION_EVENTS,
  readAmbientAdoption,
} from "@/lib/v5/ambient/telemetry";
import {
  CONTEXT_DOMAINS,
  SIGNAL_INTENSITIES,
  type ContextDomain,
} from "@/lib/v5/ambient/schema";
import {
  LUMINA_AMBIENT_EVENTS,
  readLuminaAmbientAdoption,
} from "@/lib/lumina/ambient-context";

/**
 * V5 Phase 10 Sub-PR 10.3 — public ambient transparency page.
 *
 * The Identity-Native Intelligence Law's (V5 § 2.15) final
 * manifestation: a public page that explains the ambient
 * layer + renders the live aggregate snapshot + documents
 * the structural prohibitions Lumina is held to.
 *
 * Symmetric with /v5/perception (Sub-PR 6.5): a transparency
 * surface for a delicate subsystem. Visitors can read this
 * page without ever interacting with Lumina; the page is the
 * contract.
 *
 * Voice (V5 doc explicit):
 *   - calm
 *   - honest
 *   - technical
 *   - restrained
 *   NOT legalistic, corporate, or manipulative.
 *
 * Page layout (operator-console rhythm; numbered sections):
 *   01 what the ambient layer is
 *   02 the closed domain registry (7 domains)
 *   03 the ordinal intensity scale (3 values)
 *   04 KIRMIZI ÇİZGİ — what the layer NEVER does
 *   05 live aggregate snapshot (the JSON the foundation
 *      composes right now)
 *   06 how it works (foundation + consumer architecture)
 *   07 telemetry — what counts get recorded
 *   08 why this exists (V5 § 2.3 transparency law manifestation)
 *   09 related transparency — cross-links
 *   10 source files — every claim grounded in code
 *
 * Flag gate
 *   `isAmbientEnabled()` reads V5_AMBIENT_ENABLED. When OFF,
 *   the page returns 404 — same dark-launch pattern as the
 *   rest of Phase 10. The foundation registry exists
 *   regardless of the flag; the public-facing transparency
 *   is the gated surface.
 *
 * Caching
 *   `revalidate = 3600` (1h). The live snapshot section will
 *   surface fresh aggregate state per ISR regeneration; the
 *   editorial body is build-time static.
 *
 * Telemetry
 *   - VisitPing surface="ambient" fires the V4 visit counter
 *     (v5:telemetry:ambient-page:visits).
 *   - The composer the page runs fires the existing
 *     v5:ambient:adoption events (context_composed +
 *     per-domain).
 *
 * Privacy posture
 *   Every datum on the page is operator-side aggregate. The
 *   page itself adds no new privacy surface area.
 *
 * Performance posture
 *   - Page is `○ Static` (no flag check before page-body
 *     render; the page top branches on the flag and returns
 *     404 server-side when off).
 *   - ISR 1h regenerates the aggregate snapshot section.
 *   - Composer cost on regeneration: ~150-300ms when
 *     V5_OPERATING_TWIN_ENABLED is also ON; ~5-20ms otherwise.
 */

export const revalidate = 3600;

const PAGE_TITLE =
  "Ambient — the ecosystem's typed nervous system | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public transparency surface for the V5 ambient intelligence layer. The closed domain registry, the ordinal intensity scale, the structural prohibitions, the live aggregate snapshot, and the reason any of this exists.";

export async function generateMetadata(): Promise<Metadata> {
  if (!isAmbientEnabled()) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${getSiteUrl()}/v5/ambient` },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${getSiteUrl()}/v5/ambient`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/blob/main";

const INTENSITY_DESCRIPTION: Record<
  (typeof SIGNAL_INTENSITIES)[number],
  string
> = {
  low: "minimal signal — present, barely above zero",
  medium: "moderate signal — clearly active",
  high: "strong signal — pronounced activity",
};

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "Ambient schema",
    path: "lib/v5/ambient/schema.ts",
    note: "AmbientContext + ContextDomain + SignalIntensity + 7 per-domain view shapes + validateAmbientContext + projectIntensity.",
  },
  {
    label: "Domain registry",
    path: "lib/v5/ambient/domains.ts",
    note: "CONTEXT_DOMAIN_REGISTRY — per-domain description, upstream sources, privacy posture, consumer guidance.",
  },
  {
    label: "Composer",
    path: "lib/v5/ambient/registry.ts",
    note: "composeAmbientContext fans out 4 integration views in parallel + builds system + environment views in-line. Pure read.",
  },
  {
    label: "Integration views",
    path: "lib/v5/ambient/integrations/",
    note: "Pure projection helpers: perception, temporal, topology, operating. Each module is its own grep-anchored threshold table.",
  },
  {
    label: "JSON feed endpoint",
    path: "app/api/v5/ambient/context/route.ts",
    note: "Edge GET. Same composed snapshot this page renders; public for external consumers + operator audit.",
  },
  {
    label: "Lumina-side consumer",
    path: "lib/lumina/ambient-context.ts",
    note: "Phase 10.2 — renderer for the silent context injection into Lumina's system prompt. Contains the 5 ABSOLUTE PROHIBITIONS Lumina is held to.",
  },
  {
    label: "This page",
    path: "app/v5/ambient/page.tsx",
    note: "Server Component, flag-gated, 1h ISR. Editorial transparency layout mirroring /v5/perception.",
  },
];

const KIRMIZI_RULES: readonly string[] = [
  "No per-visitor field anywhere in any view. The ambient layer reads OPERATOR-side state only.",
  "No identifier minted by the ambient layer. The composer + endpoints + telemetry helpers accept zero identifiers.",
  "No quantitative emotional inference. All intensity fields are ordinal — low | medium | high.",
  "No reconstructible flow paths. active_categories is a SET, not an ordered sequence.",
  "No cross-session linking. No persistence layer for visitor identity.",
  "No client-side ambient runtime. Pure server-side foundation. No polling, no global store, no inference engine in the browser.",
  "No behavioral targeting. Closed allow-lists prevent domain sprawl; new domains require new sub-PR + review.",
  "No LLM call in the composition path. Pure template assembly + typed projections.",
];

const LUMINA_PROHIBITIONS: readonly string[] = [
  "DO NOT say \"I see / I notice / Looking at the data / Based on the latest\".",
  "DO NOT mention the ambient context, operational twin, JSON feed, journal, or any platform telemetry surface UNLESS the visitor explicitly asked by name.",
  "DO NOT recite numerical values from the ambient block.",
  "DO NOT use \"currently / right now / lately / today\" to imply live ecosystem awareness.",
  "DO NOT adapt to the visitor (the block carries operator state, not personalisation primitives).",
];

const PERMITTED_USES: readonly string[] = [
  "Choose WHICH project / experiment / system to mention first when asked an open-ended question — prefer items the block lists as currently active.",
  "Pick the framing aligned with the operator's current focus.",
  "Behave identically when the block is absent — never invent state to fill gaps.",
];

function formatTimestamp(iso: string): string {
  if (!iso || typeof iso !== "string") return "—";
  return iso.slice(0, 19).replace("T", " ") + " UTC";
}

export default async function AmbientPage() {
  /* Single gate: operator flag. Same dark-launch pattern as
   * the rest of Phase 10. */
  if (!isAmbientEnabled()) {
    notFound();
  }

  /* Compose the live snapshot + read both adoption hashes in
   * parallel. All three are graceful no-ops on infra failure. */
  const [snapshot, ambientAdoption, luminaAdoption] = await Promise.all([
    composeAmbientContext(),
    readAmbientAdoption(),
    readLuminaAmbientAdoption(),
  ]);

  const domains = listContextDomains();

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — same gradient stack as the other
          V5 transparency surfaces. Visual continuity. */}
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

      <VisitPing surface="ambient" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
              V5
            </span>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Ambient
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 10 — Identity-Native Intelligence Law's final manifestation."
            >
              Phase 10 · transparency
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Ambient.</span>
            <span className="block text-tertiary">
              The ecosystem&apos;s typed nervous system.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            The ambient layer composes a typed snapshot of the
            ecosystem — what flags are active, which week it is,
            what shipped, which experiments are running, what the
            topology looks like. Other systems may read this
            snapshot to anchor their behavior. The visitor never
            interacts with it directly; it sits underneath, quiet,
            aggregate, ordinal-only.
          </p>
          <p className="text-tertiary text-[13px] leading-relaxed mt-4 max-w-2xl">
            Snapshot last composed{" "}
            <time
              dateTime={snapshot.generated_at}
              className="font-mono text-tertiary tabular-nums"
            >
              {formatTimestamp(snapshot.generated_at)}
            </time>
            . Same JSON exposed at{" "}
            <Link
              href="/api/v5/ambient/context"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /api/v5/ambient/context
            </Link>
            .
          </p>
        </Reveal>

        {/* SECTION 01 — WHAT THE AMBIENT LAYER IS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · What this is
          </h2>
          <div className="space-y-4 text-secondary text-[14px] leading-relaxed max-w-2xl">
            <p>
              The ambient layer is a foundation. It produces a
              typed, aggregate snapshot of the ecosystem on demand
              — 7 closed context domains, each projecting from an
              existing V5 subsystem, none carrying per-visitor data.
            </p>
            <p>
              The foundation (Phase 10.1) shipped with zero visible
              consumers — the JSON feed + telemetry foundation
              alone. The first consumer (Phase 10.2) wired the
              snapshot into Lumina&apos;s system prompt as INTERNAL
              anchoring material; Lumina is structurally forbidden
              from surfacing it. This page (Phase 10.3) is the
              transparency closure — the public-facing contract
              for what the ambient layer is, what it does, and
              what it never does.
            </p>
            <p>
              Per V5 § 2.3: every V5 surface publishes its own
              structure. The ambient layer is no exception — the
              JSON is public, the algorithm is in source, the
              prohibitions are spelled out below.
            </p>
          </div>
        </Reveal>

        {/* SECTION 02 — CLOSED DOMAIN REGISTRY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · The closed domain registry
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Seven domains. Adding a new one requires a new sub-PR
            + Phase 10 review. The closed allow-list is structural
            defense against domain sprawl — the foundation must
            not grow past its discipline.
          </p>
          <ul className="space-y-5">
            {domains.map((domain) => {
              const meta = CONTEXT_DOMAIN_REGISTRY[domain];
              return (
                <li
                  key={domain}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
                    <h3 className="font-mono uppercase tracking-[0.18em] text-[11px] text-[#00d2ff]/80">
                      {domain}
                    </h3>
                  </div>
                  <p className="text-primary text-[14px] leading-relaxed mb-3">
                    {meta.description}
                  </p>
                  <p className="text-tertiary text-[12px] leading-relaxed mb-2">
                    <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary mr-2">
                      Privacy:
                    </span>
                    {meta.privacy_posture}
                  </p>
                  <p className="text-tertiary text-[12px] leading-relaxed">
                    <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary mr-2">
                      Guidance:
                    </span>
                    {meta.consumer_guidance}
                  </p>
                  {meta.upstream_sources.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                      {meta.upstream_sources.map((src) => (
                        <li
                          key={src}
                          className="font-mono text-[10px] text-[#00d2ff]/70"
                        >
                          {src}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* SECTION 03 — INTENSITY SCALE */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · The ordinal intensity scale
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Quantitative source data is projected to three ordinal
            values. Closed allow-list. This is load-bearing
            privacy discipline — ordinals carry RELATIVE direction
            without exposing the underlying numerical distribution.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {SIGNAL_INTENSITIES.map((intensity) => (
              <li
                key={intensity}
                className="py-4 grid grid-cols-1 md:grid-cols-[100px_1fr] gap-2 md:gap-6"
              >
                <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/90">
                  {intensity}
                </span>
                <span className="text-secondary text-[13px] leading-relaxed">
                  {INTENSITY_DESCRIPTION[intensity]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-tertiary text-[12px] leading-relaxed mt-5 max-w-2xl">
            When a source has no signal at all (count is zero or
            below), the domain returns <code className="font-mono">null</code>{" "}
            instead of an intensity. This is the &quot;honest
            absence&quot; rule — disabled-flag sources never
            synthesise fake low-intensity readings.
          </p>
        </Reveal>

        {/* SECTION 04 — KIRMIZI ÇİZGİ */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Kırmızı çizgi — what the ambient layer never does
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            The Phase 10 brief draws hard structural lines.
            Foundation-side discipline (what the registry refuses
            to compute) protects the visible consumers
            downstream:
          </p>
          <ul className="space-y-3 mb-8">
            {KIRMIZI_RULES.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-secondary text-[13px] leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="font-mono uppercase tracking-[0.18em] text-[9px] text-[#00d2ff]/70 mt-1 shrink-0"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3">
            Lumina-side prohibitions (the silent-injection contract)
          </h3>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            When the ambient block is injected into Lumina&apos;s
            system prompt (Phase 10.2), Lumina is structurally
            instructed:
          </p>
          <ul className="space-y-2 mb-6">
            {LUMINA_PROHIBITIONS.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-secondary text-[13px] leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] text-faint mt-1 shrink-0"
                >
                  ✗
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3">
            Lumina-side permitted uses (anchoring only)
          </h3>
          <ul className="space-y-2">
            {PERMITTED_USES.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-secondary text-[13px] leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] text-[#00d2ff]/80 mt-1 shrink-0"
                >
                  ✓
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* SECTION 05 — LIVE AGGREGATE SNAPSHOT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Live aggregate snapshot
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            The current composed snapshot. Regenerated hourly. The
            same JSON the foundation produces is shown below in
            its structured form — null domains indicate their
            source is disabled.
          </p>

          {/* Snapshot meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-tertiary text-[12px] mb-6">
            <span>
              <span className="font-mono text-primary tabular-nums">
                {Object.keys(snapshot.domains).length}
              </span>{" "}
              domains
            </span>
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.signals.length}
              </span>{" "}
              environmental signals
            </span>
            <span>
              flag_enabled:{" "}
              <span className="font-mono text-primary">
                {String(snapshot.flag_enabled)}
              </span>
            </span>
          </div>

          {/* Per-domain rows */}
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {CONTEXT_DOMAINS.map((domain) => {
              const view = snapshot.domains[domain];
              return (
                <li
                  key={domain}
                  className="py-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6"
                >
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                    {domain}
                  </span>
                  <DomainSnapshotCell view={view} domain={domain} />
                </li>
              );
            })}
          </ul>

          {/* Signals stream */}
          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mt-8 mb-3">
            Environmental signals
          </h3>
          <ul className="space-y-2">
            {snapshot.signals.map((signal, i) => (
              <li
                key={`${signal.domain}-${signal.kind}-${i}`}
                className="font-mono text-[12px] text-secondary"
              >
                <span className="text-[#00d2ff]/80">{signal.domain}</span>
                <span className="text-faint mx-1">·</span>
                <span className="text-primary">{signal.kind}</span>
                <span className="text-faint mx-1">·</span>
                <span className="text-tertiary">{signal.intensity}</span>
                <span className="text-faint mx-1">·</span>
                <span className="text-tertiary text-[10px]">
                  {signal.source}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* SECTION 06 — HOW IT WORKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · How it works
          </h2>
          <div className="space-y-4 text-secondary text-[14px] leading-relaxed max-w-2xl">
            <p>
              The foundation is a parallel-fan-out composer
              (Phase 10.1). It runs four async integration views
              concurrently — perception, temporal, topology,
              operating — then assembles system + environment
              views in-line. Every integration is itself a pure
              projection of an existing V5 subsystem&apos;s
              summariser; the ambient layer is read-only on every
              source.
            </p>
            <p>
              The composer never throws. Each integration catches
              its own failures and returns null; the composed
              context honestly reports the absence rather than
              synthesising data.
            </p>
            <p>
              The consumer side (Phase 10.2) wires the composed
              context into Lumina&apos;s system prompt via the
              prompt builder&apos;s optional third argument.
              Default behavior (flag OFF) is byte-identical to
              V4 — the ambient block is omitted entirely. Flag
              ON adds a ~2,700-character block carrying the
              structured state + the explicit prohibitions
              listed above.
            </p>
            <p>
              The transparency surface (this page, Phase 10.3)
              renders the same composed snapshot the foundation
              endpoint exposes. The page is informative; it
              changes no behavior. Visitors who never interact
              with Lumina still see the contract.
            </p>
          </div>
        </Reveal>

        {/* SECTION 07 — TELEMETRY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            07 · Telemetry
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Three hashes track the ambient layer&apos;s adoption.
            Every counter is aggregate — HINCRBY one event-kind
            field by 1, no per-visitor field anywhere.
          </p>

          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mt-6 mb-3">
            v5:ambient:adoption (foundation, Phase 10.1)
          </h3>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06] mb-6">
            {AMBIENT_ADOPTION_EVENTS.map((kind) => (
              <li
                key={kind}
                className="py-3 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-1 md:gap-4"
              >
                <span className="font-mono text-[12px] text-[#00d2ff]/80">
                  {kind}
                </span>
                <span className="font-mono text-[12px] text-primary tabular-nums">
                  {ambientAdoption[kind] ?? 0}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3">
            v5:lumina-v5:ambient (silent consumer, Phase 10.2)
          </h3>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {LUMINA_AMBIENT_EVENTS.map((kind) => (
              <li
                key={kind}
                className="py-3 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-1 md:gap-4"
              >
                <span className="font-mono text-[12px] text-[#00d2ff]/80">
                  {kind}
                </span>
                <span className="font-mono text-[12px] text-primary tabular-nums">
                  {luminaAdoption[kind] ?? 0}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-tertiary text-[12px] leading-relaxed mt-5 max-w-2xl">
            Plus one V4 scalar:{" "}
            <code className="font-mono text-[11px] text-[#00d2ff]/80">
              v5:telemetry:ambient-page:visits
            </code>{" "}
            — the cumulative visit count to this transparency
            page itself. Symmetric with /v5/perception,
            /v5/operating, /v5/journal scalars.
          </p>
        </Reveal>

        {/* SECTION 08 — WHY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            08 · Why this exists
          </h2>
          <div className="space-y-4 text-secondary text-[14px] leading-relaxed max-w-2xl">
            <p>
              V5 § 2.15 names the Identity-Native Intelligence
              Law: every AI system added during V5 must satisfy
              three conditions — ecosystem-bound, ecosystem-fed,
              ecosystem-emergent. The ambient layer is V5&apos;s
              clearest structural manifestation of all three.
            </p>
            <p>
              Ecosystem-bound: every domain reads THIS
              portfolio&apos;s subsystems. The same code on
              another site would project nothing meaningful.
            </p>
            <p>
              Ecosystem-fed: no external inputs anywhere in the
              composition path. Perception aggregates,
              build-time registries, operator-side snapshots,
              wall-clock — all internal.
            </p>
            <p>
              Ecosystem-emergent: the layer&apos;s value
              materialises only when Phases 6-9 are running.
              Outside that context the composed snapshot is
              meaningless metadata.
            </p>
            <p>
              And per V5 § 2.3: public transparency is V5&apos;s
              brand identity. The ambient layer&apos;s most
              delicate property — that it never surfaces visitor
              data — is the kind of guarantee only a public
              contract can hold. This page is that contract.
            </p>
          </div>
        </Reveal>

        {/* SECTION 09 — RELATED TRANSPARENCY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            09 · Related transparency
          </h2>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            <li className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6">
              <Link
                href="/v5/perception"
                className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /v5/perception
              </Link>
              <span className="text-secondary text-[13px] leading-relaxed">
                The upstream source for the navigation + attention
                domains. The perception layer&apos;s own
                transparency contract — opt-in, aggregate-only,
                closed schema.
              </span>
            </li>
            <li className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6">
              <Link
                href="/v5/operating"
                className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /v5/operating
              </Link>
              <span className="text-secondary text-[13px] leading-relaxed">
                The upstream source for the operational domain.
                The operational twin — what the operator is
                actually doing, surfaced as portrait, not
                dashboard.
              </span>
            </li>
            <li className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6">
              <Link
                href="/v5/journal"
                className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /v5/journal
              </Link>
              <span className="text-secondary text-[13px] leading-relaxed">
                The latest_narrative the ambient layer surfaces
                comes from here. Templated weekly digests of the
                operational twin, frozen at cron time.
              </span>
            </li>
            <li className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6">
              <Link
                href="/lumina/brain"
                className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /lumina/brain
              </Link>
              <span className="text-secondary text-[13px] leading-relaxed">
                The Lumina system prompt + tool registry + memory
                contract. The silent-injection consumer
                (Phase 10.2) lives in Lumina&apos;s prompt path;
                this page is its visible transparency surface.
              </span>
            </li>
            <li className="py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6">
              <Link
                href="/evolution"
                className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /evolution
              </Link>
              <span className="text-secondary text-[13px] leading-relaxed">
                Public archive of architectural decisions. The
                temporal domain&apos;s evolution-registry summary
                projects from this source.
              </span>
            </li>
          </ul>
        </Reveal>

        {/* SECTION 10 — SOURCE FILES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            10 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Every claim above is grounded in code. Click any row
            to read the file on GitHub.
          </p>
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
                    <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
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
          <div className="border-t border-white/[0.05] pt-6 mt-12 space-y-3">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 10 · Ambient Intelligence Layer</span>
              <span className="text-faint">·</span>
              <span>Transparency closure</span>
              <span className="text-faint">·</span>
              <span>ISR 1h cadence</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              Phase 10 ships across three sub-PRs: the foundation
              registry (10.1), the silent Lumina consumer (10.2),
              and this transparency page (10.3). Together they
              compose the Identity-Native Intelligence Law&apos;s
              final manifestation — ambient awareness that
              improves understanding without making the visitor
              feel observed.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

/* ── Per-domain snapshot cell ─────────────────────────── */

interface DomainSnapshotCellProps {
  view: unknown;
  domain: ContextDomain;
}

function DomainSnapshotCell({ view, domain }: DomainSnapshotCellProps) {
  if (view === null) {
    return (
      <span className="font-mono text-[12px] text-tertiary">
        null (source disabled or no signal)
      </span>
    );
  }

  /* Render a compact key/value list for each populated domain.
   * The shape varies per domain; reading the union types here
   * statically would balloon the page — a generic object dump
   * keeps the cell small + accurate. */
  if (typeof view !== "object" || view === null) {
    return (
      <span className="font-mono text-[12px] text-tertiary">
        {String(view)}
      </span>
    );
  }

  return (
    <ul className="space-y-1">
      {Object.entries(view as Record<string, unknown>).map(([key, val]) => (
        <li
          key={`${domain}-${key}`}
          className="font-mono text-[12px] text-secondary"
        >
          <span className="text-[#00d2ff]/80">{key}</span>
          <span className="text-faint mx-1">:</span>
          <span className="text-primary">{formatCellValue(val)}</span>
        </li>
      ))}
    </ul>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((v) => typeof v === "string")) {
      return `[${(value as string[]).join(", ")}]`;
    }
    return `[${value.length} entries]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{ ${entries
      .map(([k, v]) => `${k}: ${formatCellValue(v)}`)
      .join(", ")} }`;
  }
  return String(value);
}
