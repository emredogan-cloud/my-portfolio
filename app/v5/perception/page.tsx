import type { Metadata } from "next";
import Link from "next/link";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { getSiteUrl } from "@/lib/site-url";
import {
  ADOPTION_BUCKETS,
  COGNITION_SIGNAL_BUCKETS,
  DWELL_TIME_BUCKETS,
  PACING_TRANSITION_BUCKETS,
  SCROLL_VELOCITY_BUCKETS,
  TAB_VISIBILITY_BUCKETS,
} from "@/lib/v5/perception/buckets";
import {
  PERCEPTION_CONSENT_COOKIE,
  PERCEPTION_CONSENT_TTL_DAYS,
  PERCEPTION_ENABLED_ENV,
} from "@/lib/v5/perception/consent";
import { readPerceptionSnapshot } from "@/lib/v5/perception/telemetry";

import OptInToggle from "@/app/v5/perception/_components/OptInToggle";

/**
 * V5 Phase 6 — public transparency page for perception.
 *
 * Sub-PR 6.1 shipped the foundation version of this page
 * (consent toggle + schema + privacy invariants + live
 * snapshot). Sub-PR 6.5 expands it with the public algorithm
 * description that V5 § 2.3 ("Public Transparency Disiplini")
 * demands of every V5 surface — visitors should see not just
 * WHAT is collected, but HOW the collection algorithm works,
 * gate by gate.
 *
 * Voice (V5 doc explicit):
 *   - calm
 *   - honest
 *   - technical
 *   - restrained
 *   NOT legalistic, corporate, or manipulative.
 *
 * The page reads as an operator console for the perception
 * subsystem:
 *   01 opt-in toggle (the only interactive surface)
 *   02 closed schema — what categories + buckets exist
 *   03 how it works — the algorithm, three gates, the flow
 *   04 negative space — what is never collected
 *   05 privacy invariants — the structural guarantees
 *   06 retention & aggregation — the data lifecycle
 *   07 live aggregate snapshot — the current state
 *   08 why — the operating reason
 *   09 related transparency — cross-link to /lumina/brain
 *   10 source files — every claim grounded in code
 *
 * Caching: 1h ISR — the page is near-static (the only changing
 * piece is the aggregate snapshot, and it doesn't need to be
 * second-fresh). Same cadence as /lumina/brain.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Perception — ambient context layer | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public transparency surface for the V5 perception layer. The full algorithm, the closed schema, the three gates, the privacy invariants, the live aggregate snapshot, and the reason any of this exists.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${getSiteUrl()}/v5/perception` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/v5/perception`,
    type: "website",
  },
  /* Indexable — the page IS the contract. Search visibility is
   * how the document earns its purpose. */
  robots: { index: true, follow: true },
};

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/blob/main";

interface CategoryRow {
  category: string;
  signal: string;
  buckets: readonly string[];
  detail: string;
}

const CATEGORY_ROWS: readonly CategoryRow[] = [
  {
    category: "scroll-velocity",
    signal: "How fast the page scrolls",
    buckets: SCROLL_VELOCITY_BUCKETS,
    detail:
      "Average pixels per second over a sampling window. Bucketed into four coarse states — idle, browsing, scanning, skimming. The raw px/s number is never persisted.",
  },
  {
    category: "dwell-time",
    signal: "How long a page is kept open",
    buckets: DWELL_TIME_BUCKETS,
    detail:
      "Wall-clock milliseconds between page open and page close, bucketed into six progressively wider slots. Granularity widens with time because a 12s vs 14s difference is meaningless and a 12s vs 4min difference is.",
  },
  {
    category: "tab-visibility",
    signal: "How long the tab spent backgrounded",
    buckets: TAB_VISIBILITY_BUCKETS,
    detail:
      "Time the visitor had this tab in the background between focus events. Three slots — short, medium, long. No record is kept of when the focus event fired.",
  },
  {
    category: "section-engagement",
    signal: "Which on-page section drew attention",
    buckets: ["(kebab-case section slug)"],
    detail:
      "Section identifiers as they appear in the page source (e.g. hero, projects, contact). The bucket IS the section name; no scroll position, no time spent in section, no order.",
  },
  {
    category: "navigation-flow",
    signal: "Which page-to-page transition fired",
    buckets: ["(from-slug>to-slug)"],
    detail:
      "Ordered pair of route slugs (e.g. home>about). Records the transition itself, not the visitor making it. Counts compose with one another into a Markov-shaped graph the operator can read; no individual visitor's path is reconstructible.",
  },
  {
    category: "cognition-signal",
    signal: "Inferred attention state at the moment of a navigation",
    buckets: COGNITION_SIGNAL_BUCKETS,
    detail:
      "A three-state qualitative bucket derived from the per-session page counter — arrival on first navigation, exploring through 2-4 routes, engaged from 5 onward. The state never regresses within a session and is computed entirely client-side; only the bucket label reaches the endpoint.",
  },
  {
    category: "pacing-transition",
    signal: "How many navigations the session reached before backgrounding",
    buckets: PACING_TRANSITION_BUCKETS,
    detail:
      "Fired exactly once per session via sendBeacon when the tab is first backgrounded — captures the visitor's departure-time depth. Four progressively widening buckets (first / few / many / deep) match the cognition taxonomy's boundaries. No raw count is persisted; the bucket label is the level of detail.",
  },
  {
    category: "adoption",
    signal: "Opt-in / revoke / deny events",
    buckets: ADOPTION_BUCKETS,
    detail:
      "The three states the consent decision can take. Recorded WITHOUT a prior consent gate because the decision IS the consent. The only events the layer is allowed to record before consent.",
  },
];

interface InvariantRow {
  label: string;
  detail: string;
}

const PRIVACY_INVARIANTS: readonly InvariantRow[] = [
  {
    label: "Aggregate-only",
    detail:
      "Every recorded event lands in a count keyed by a bucket label. The bucket is the level of detail the storage holds — nothing else. There is no per-visitor record, no session-scoped aggregate, no time-of-event field.",
  },
  {
    label: "No fingerprint",
    detail:
      "The endpoint reads no IP, no User-Agent, no Accept-Language, no Referer beyond what Vercel logs at the platform layer. The only header consulted is Cookie, and only the perception consent token within it.",
  },
  {
    label: "No identity persistence",
    detail:
      "No cross-session identifier is minted. The consent cookie expires after " +
      String(PERCEPTION_CONSENT_TTL_DAYS) +
      " days of inactivity. There is no linkage between this layer and the Lumina session memory (which is separately documented at /lumina/brain).",
  },
  {
    label: "Opt-in default-off",
    detail:
      "The subsystem is dark unless the operator has flipped " +
      PERCEPTION_ENABLED_ENV +
      "=1 AND the visitor has opted in via the toggle below. Either gate closed means no event records.",
  },
  {
    label: "No surfacing",
    detail:
      "Nothing about the visitor's perception data is ever shown back to that visitor. The layer is invisible by construction — its output is a public aggregate snapshot that anyone can read, not a personalised message the visitor receives.",
  },
  {
    label: "Graceful no-op",
    detail:
      "When KV is unavailable, every record helper returns silently and every read helper returns an empty object. The layer never blocks a page render or chat turn.",
  },
];

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "Schema + buckets",
    path: "lib/v5/perception/buckets.ts",
    note: "Category allow-list, bucket allow-lists, and the raw → bucket helpers observers call. Eight categories live here as of Sub-PR 6.4.",
  },
  {
    label: "Consent resolution",
    path: "lib/v5/perception/consent.ts",
    note: "Env master switch + cookie + localStorage helpers. The single source of truth for whether the layer is allowed to record.",
  },
  {
    label: "KV record + read",
    path: "lib/v5/perception/telemetry.ts",
    note: "HINCRBY one bucket; HGETALL all eight categories. Graceful no-op when KV is unavailable.",
  },
  {
    label: "Edge event endpoint",
    path: "app/api/v5/perception/event/route.ts",
    note: "POST { category, bucket }. Edge runtime, three gates (env / allow-list / consent), always 204.",
  },
  {
    label: "Cognition observer",
    path: "components/v5/CognitionAwareNavigationObserver.tsx",
    note: "Sub-PR 6.2. Mounted in the root layout. Watches usePathname() and fires cognition-signal + navigation-flow events on transitions, gated on consent.",
  },
  {
    label: "Cognition inference",
    path: "lib/v5/navigation/cognition.ts",
    note: "Sub-PR 6.2. The three-state inference (arrival / exploring / engaged) derived from the per-session page counter.",
  },
  {
    label: "Pacing provider",
    path: "components/v5/PacingProvider.tsx",
    note: "Sub-PR 6.3. React Context exposing the duration multiplier. Owns the visibility:hidden beacon that fires the pacing-transition event once per session via sendBeacon.",
  },
  {
    label: "Pacing inference",
    path: "lib/v5/pacing/inference.ts",
    note: "Sub-PR 6.3. The cognition + reduced-motion → multiplier resolver. Spring physics is type-system banned.",
  },
  {
    label: "Memory TTL",
    path: "lib/v5/memory/ttl.ts",
    note: "Sub-PR 6.4. Operator-configurable Lumina session memory TTL (14-30 day range; default 14 = V4 parity).",
  },
  {
    label: "Memory adoption",
    path: "lib/v5/memory/telemetry.ts",
    note: "Sub-PR 6.4. The hit / miss / store / opt-out counters that drive the hit-rate tile visible on /lumina/brain.",
  },
  {
    label: "This page",
    path: "app/v5/perception/page.tsx",
    note: "The transparency surface itself. The verbatim text above lives in this file; the snapshot in section 07 is read from KV at ISR time.",
  },
];

export default async function V5PerceptionPage() {
  /* Read every category in parallel. KV-less environments resolve
   * to a fully-empty record; the snapshot section shows the
   * zero-state branch in that case. */
  const snapshot = await readPerceptionSnapshot();
  const snapshotIsEmpty = Object.values(snapshot).every(
    (cat) => Object.keys(cat).length === 0,
  );

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant. Operator family. */}
      <PageAtmosphere variant="operator" />

      <VisitPing surface="v5-perception" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
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
              Perception
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 6 foundation complete — observation window opens after Sub-PR 6.5."
            >
              Phase 6 · transparency
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Perception.</span>
            <span className="block text-tertiary">
              Ambient context, never identity.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            This page describes the perception layer end-to-end:
            the closed schema, the three gates between a visitor
            action and a stored count, the privacy invariants the
            architecture enforces, and the live aggregate the layer
            is currently producing. Opt-in default-off, aggregate-
            only, revocable in one click. Phase 6 lands its
            observers across five sub-PRs; this page is the single
            place every one of them is audit-able.
          </p>
        </Reveal>

        {/* OPT-IN */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · Your consent
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The toggle below sets a same-origin cookie named{" "}
            <code className="font-mono text-[13px] text-primary">
              {PERCEPTION_CONSENT_COOKIE}
            </code>{" "}
            with a {PERCEPTION_CONSENT_TTL_DAYS}-day lifetime and a
            paired localStorage flag. The cookie is the single gate
            the edge endpoint checks; without it, any incoming event
            in any category other than &ldquo;adoption&rdquo; is
            dropped at the door without a KV write. Revoking clears
            both the cookie and the flag immediately.
          </p>
          <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
            <OptInToggle />
          </div>
        </Reveal>

        {/* WHAT IS COLLECTED */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · What can be collected
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Six categories. Each one carries a closed set of bucket
            labels — the bucket is the level of detail the storage
            holds. Raw measurements (px/s, ms, scroll positions) are
            never persisted; the bucketization happens client-side
            before the event ever reaches the endpoint.
          </p>
          <ul className="space-y-5">
            {CATEGORY_ROWS.map((row) => (
              <li
                key={row.category}
                className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <code className="font-mono text-[13px] text-[#00d2ff]/90">
                    {row.category}
                  </code>
                  <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary text-right">
                    {row.signal}
                  </span>
                </div>
                <p className="text-secondary text-[13px] leading-relaxed mb-3">
                  {row.detail}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {row.buckets.map((b) => (
                    <code
                      key={b}
                      className="font-mono text-[11px] text-primary border border-white/[0.06] bg-black/40 rounded px-2 py-1"
                    >
                      {b}
                    </code>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* HOW IT WORKS — Sub-PR 6.5 expansion. The algorithm
            described gate by gate. The visitor reads the
            collection mechanics in the same depth the operator
            does. */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · How it works
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Every recorded count passes through three gates in a
            fixed order. The endpoint short-circuits at the first
            gate that fails — a request that crosses none of them
            still resolves with the same{" "}
            <code className="font-mono text-[13px] text-primary">
              204 No Content
            </code>{" "}
            as a request that crosses all three, so the
            presence-or-absence of telemetry is never an attack
            surface a network observer can probe.
          </p>

          {/* THE THREE GATES — ordered, named, each one
              explained in operator-grade detail. */}
          <ol className="space-y-4 mb-7 list-none">
            <li className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                  Gate 1 · operator master switch
                </span>
                <code className="font-mono text-[11px] text-tertiary">
                  process.env[{PERCEPTION_ENABLED_ENV}] === &quot;1&quot;
                </code>
              </div>
              <p className="text-secondary text-[13px] leading-relaxed">
                Cheapest check. Without this env set on the
                deployment, the endpoint silently no-ops every
                event before reading the body. The operator can
                dark-launch the entire perception subsystem by
                leaving the variable unset, which is the default
                in production right now.
              </p>
            </li>
            <li className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                  Gate 2 · closed schema
                </span>
                <code className="font-mono text-[11px] text-tertiary">
                  isPerceptionCategory ∧ isValidBucket
                </code>
              </div>
              <p className="text-secondary text-[13px] leading-relaxed">
                The inbound{" "}
                <code className="font-mono text-[12px] text-primary">
                  category
                </code>{" "}
                must be one of the eight allow-listed values in
                section 02. The inbound{" "}
                <code className="font-mono text-[12px] text-primary">
                  bucket
                </code>{" "}
                must be either a member of that category&apos;s closed
                list (for fixed categories) or pass the kebab-case
                shape check (for dynamic categories like
                navigation-flow). Anything else drops at the door.
              </p>
            </li>
            <li className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                  Gate 3 · visitor consent
                </span>
                <code className="font-mono text-[11px] text-tertiary">
                  Cookie: {PERCEPTION_CONSENT_COOKIE}=granted
                </code>
              </div>
              <p className="text-secondary text-[13px] leading-relaxed">
                The endpoint reads the perception consent cookie
                from the inbound{" "}
                <code className="font-mono text-[12px] text-primary">
                  Cookie
                </code>{" "}
                header. Without{" "}
                <code className="font-mono text-[12px] text-primary">
                  granted
                </code>{" "}
                the event drops — except for the{" "}
                <code className="font-mono text-[12px] text-primary">
                  adoption
                </code>{" "}
                category, which bypasses this gate because
                recording the consent decision cannot itself
                require prior consent. The bypass is the only
                exception architecturally, and it&apos;s explicit
                in the endpoint source.
              </p>
            </li>
          </ol>

          {/* THE FLOW — ASCII-style diagram of how a single
              event traverses the system.

              V6 Sub-PR 15.2 signature: when NEXT_PUBLIC_V6_OPERATOR_PERCEPTION
              is on, the ASCII flow diagram is promoted to a
              first-class anchor element — cyan-tinted frame, larger
              padding, a "FLOW" eyebrow at the elevated mono size
              of a primary section indicator. Audit § 13.3 named this
              block as having "more identity per pixel" than the
              surrounding 9 sections; the V6 treatment lets the page
              lean on that block as the visual centrepiece of "how
              the system works." The DOM position stays inside
              section 03 (no renumbering); only the visual weight
              changes. */}
          {process.env.NEXT_PUBLIC_V6_OPERATOR_PERCEPTION === "1" ? (
            <div className="my-10 -mx-2 sm:-mx-4 md:-mx-6">
              <div className="flex items-center gap-3 mb-4 px-2 sm:px-4 md:px-6">
                <span
                  aria-hidden="true"
                  className="inline-block w-2 h-2 rounded-full bg-[#00d2ff]"
                />
                <span className="font-mono uppercase tracking-[0.22em] text-[11px] text-[#00d2ff]/85">
                  Flow · the operating loop
                </span>
                <span
                  aria-hidden="true"
                  className="flex-1 h-px bg-gradient-to-r from-[#00d2ff]/25 via-white/[0.05] to-transparent"
                />
              </div>
              <div
                className="font-mono text-[12.5px] text-secondary border border-[#00d2ff]/20 rounded-2xl bg-gradient-to-br from-black/60 to-[#00d2ff]/[0.025] p-6 md:p-8 overflow-x-auto whitespace-pre leading-[1.85]"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.02), 0 24px 60px -28px rgba(0,210,255,0.20)",
                }}
              >
{`opt-in toggled  ─►  cookie + localStorage written
                     │
                     ▼
client observer  ──►  POST  { category, bucket }
                     │
                     ▼
edge endpoint    ──►  gate 1: env switch on?
                  ─►  gate 2: category + bucket valid?
                  ─►  gate 3: consent cookie present? (or category = adoption)
                     │
                     ▼
KV HINCRBY       ──►  v5:perception:<category>  →  { <bucket>: count + 1 }
                     │
                     ▼
this page (ISR)  ──►  HGETALL × 8  →  section 07 below`}
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3">
                The flow
              </h3>
              <div className="font-mono text-[12px] text-secondary border border-white/[0.06] rounded-xl bg-black/40 p-4 overflow-x-auto whitespace-pre leading-relaxed">
{`opt-in toggled  ─►  cookie + localStorage written
                     │
                     ▼
client observer  ──►  POST  { category, bucket }
                     │
                     ▼
edge endpoint    ──►  gate 1: env switch on?
                  ─►  gate 2: category + bucket valid?
                  ─►  gate 3: consent cookie present? (or category = adoption)
                     │
                     ▼
KV HINCRBY       ──►  v5:perception:<category>  →  { <bucket>: count + 1 }
                     │
                     ▼
this page (ISR)  ──►  HGETALL × 8  →  section 07 below`}
              </div>
            </>
          )}
          <p className="text-secondary text-[13px] leading-relaxed mt-4 max-w-2xl">
            Every byte that lands in storage is one of the closed
            bucket labels documented in section 02. The HINCRBY
            primitive is atomic and stateless — there is no
            session reference, no timestamp, no identifier
            anywhere on the persistence path.
          </p>

          {/* INFERENCE LAYERS — cognition and pacing don't add
              new stored data; they compute over what's already
              counted. Worth surfacing here. */}
          <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3 mt-7">
            Two inference layers above storage
          </h3>
          <dl className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4">
              <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                Cognition signal
              </dt>
              <dd className="text-secondary text-sm leading-relaxed">
                A per-session counter in sessionStorage advances
                by one on every route mount the client observer
                sees. The counter maps to one of three states —{" "}
                <code className="font-mono text-[12px] text-primary">
                  arrival
                </code>{" "}
                (1),{" "}
                <code className="font-mono text-[12px] text-primary">
                  exploring
                </code>{" "}
                (2-4),{" "}
                <code className="font-mono text-[12px] text-primary">
                  engaged
                </code>{" "}
                (5+) — and fires one cognition-signal event per
                transition. The state never regresses within a
                session.
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4">
              <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                Pacing multiplier
              </dt>
              <dd className="text-secondary text-sm leading-relaxed">
                The cognition state plus the OS reduced-motion
                preference resolve to one of four duration
                multipliers —{" "}
                <code className="font-mono text-[12px] text-primary">
                  FULL
                </code>{" "}
                (1.0),{" "}
                <code className="font-mono text-[12px] text-primary">
                  MID
                </code>{" "}
                (0.85),{" "}
                <code className="font-mono text-[12px] text-primary">
                  SNAPPY
                </code>{" "}
                (0.65),{" "}
                <code className="font-mono text-[12px] text-primary">
                  STILL
                </code>{" "}
                (0.0). Reduced-motion is an unconditional
                override. Animation consumers read the
                multiplier through a React Context; the layer
                ships no spring physics by type-system enforcement.
              </dd>
            </div>
          </dl>
        </Reveal>

        {/* WHAT IS NOT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · What is never collected
          </h2>
          <ul className="space-y-3 text-secondary text-sm leading-relaxed list-disc list-inside marker:text-tertiary">
            <li>
              No IP address, no User-Agent, no Accept-Language, no
              Referer beyond what the platform logs at the edge.
            </li>
            <li>
              No mouse trails, no keystroke timings, no biometric-
              shaped signals. No session replay tooling.
            </li>
            <li>
              No identifier — anonymous or otherwise — minted by this
              layer. The Lumina session memory (separately documented
              at{" "}
              <Link
                href="/lumina/brain"
                className="text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
              >
                /lumina/brain
              </Link>
              ) is the only place visitor state persists, and even
              that is anonymous + opt-out + a 14-day TTL (operator-
              configurable to 30 days; see the brain page for the
              live value).
            </li>
            <li>
              No timestamp on individual events. The aggregate hash
              holds a count, not a sequence.
            </li>
            <li>
              No cross-device linking. No third-party trackers. No
              analytics SDK beyond Vercel Analytics, which itself is
              cookieless and IP-anonymised at the platform layer.
            </li>
          </ul>
        </Reveal>

        {/* PRIVACY INVARIANTS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Privacy invariants
          </h2>
          <dl className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {PRIVACY_INVARIANTS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4"
              >
                <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {row.label}
                </dt>
                <dd className="text-secondary text-sm leading-relaxed">
                  {row.detail}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* RETENTION + AGGREGATION */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · Retention &amp; aggregation
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Aggregated counts live in six Vercel KV hashes — one per
            category. Each hash maps a bucket label to a count. There
            is no TTL on the hashes themselves; the counts are
            cumulative across the lifetime of the layer. The data
            persisted is, end-to-end, the count itself — nothing
            else.
          </p>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Aggregation is monotonically additive. The endpoint
            increments a single field by 1 per qualifying event;
            no other write shape exists. There is no decrement, no
            re-attribution, no per-visitor bucketing. Removing a
            visitor&apos;s contribution to the aggregate is
            mathematically impossible — but the aggregate also
            contains no reference to which contributions came from
            whom, which is the point.
          </p>
          <p className="text-secondary text-sm leading-relaxed max-w-2xl">
            The consent cookie expires after{" "}
            {PERCEPTION_CONSENT_TTL_DAYS} days of inactivity, at
            which point the visitor returns to the default-OFF state
            without action.
          </p>
        </Reveal>

        {/* SNAPSHOT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            07 · Live aggregate snapshot
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Read from KV at this page&apos;s hourly ISR cadence. The
            number against each bucket is the cumulative count since
            the perception layer was first enabled. Empty categories
            below mean no event of that kind has been recorded yet —
            which, at 6.1 foundation time, is every category that
            isn&apos;t the consent decision itself.
          </p>
          {snapshotIsEmpty ? (
            <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
              <p className="mb-2">
                <span className="text-[#00d2ff]/80">$</span> perception.snapshot
              </p>
              <p className="text-secondary">
                No events recorded yet.
              </p>
              <p className="text-tertiary mt-2">
                The subsystem is either dark ({PERCEPTION_ENABLED_ENV}{" "}
                unset), or no visitor has opted in since the layer
                began recording. Both are valid steady states for
                Phase 6.1.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(snapshot).map(([category, buckets]) => {
                const entries = Object.entries(buckets);
                if (entries.length === 0) return null;
                const total = entries.reduce((acc, [, n]) => acc + n, 0);
                return (
                  <div
                    key={category}
                    className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <code className="font-mono text-[13px] text-[#00d2ff]/90">
                        {category}
                      </code>
                      <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
                        total {total.toLocaleString("en-US")}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {entries
                        .sort((a, b) => b[1] - a[1])
                        .map(([bucket, n]) => (
                          <div
                            key={bucket}
                            className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]"
                          >
                            <dt className="font-mono text-[10px] text-tertiary truncate">
                              {bucket}
                            </dt>
                            <dd className="font-mono text-[12px] text-primary">
                              {n.toLocaleString("en-US")}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>

        {/* WHY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            08 · Why this exists
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Subsequent V5 phases — temporal architecture playback,
            cinematic topology, operational digital twin — share a
            need to know the SHAPE of how visitors engage, not the
            identity of any one visitor. A page that loads fast for
            someone skimming should still feel cinematic for someone
            reading; the layer that distinguishes those modes is
            this one.
          </p>
          <p className="text-secondary text-sm leading-relaxed max-w-2xl">
            The site will never address the visitor about their
            perception data. There is no &ldquo;we noticed you spent
            8 minutes on architecture&rdquo; greeting, no &ldquo;your
            usual section&rdquo; section, no implicit profile. The
            opt-in is a contribution to the aggregate — nothing more.
          </p>
        </Reveal>

        {/* RELATED TRANSPARENCY — Sub-PR 6.5 addition. The
            perception layer and the Lumina memory layer share
            the same V5 transparency contract but live at
            separate URLs because they target different audiences
            (perception = ambient ecosystem context; memory =
            chat-specific). Cross-link so a privacy-minded reader
            of one finds the other. */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            09 · Related transparency
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The perception layer is one of two V5 surfaces that
            persist any visitor state. The other is the Lumina
            session memory — the conversation history that the
            chat embedded across this portfolio uses to maintain
            context across turns. Each has its own transparency
            page; together they describe every byte the platform
            stores about a visit.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            <li>
              <Link
                href="/lumina/brain"
                className="block py-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  /lumina/brain
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    Lumina&apos;s operating layer
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block">
                    System prompt, tool registry, memory contract,
                    runtime topology, live memory adoption hit-rate.
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/telemetry"
                className="block py-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  /telemetry
                </span>
                <span>
                  <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                    Platform telemetry dashboard
                  </span>
                  <span className="text-secondary text-[13px] mt-1 block">
                    The aggregate dashboard for every measurable
                    surface — Lumina latency, lab adoption, npm
                    downloads, sponsor counts.
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </Reveal>

        {/* SOURCE LINKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            10 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Every claim above is grounded in code. Click any row to
            read the file on GitHub.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {SOURCE_LINKS.map((s) => (
              <li key={s.path}>
                <Link
                  href={`${REPO_BASE}/${s.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
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
          <div className="border-t border-white/[0.05] pt-6 mt-12 space-y-3">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 6 · Sensory Awakening</span>
              <span className="text-faint">·</span>
              <span>Opt-in default-off</span>
              <span className="text-faint">·</span>
              <span>Aggregate-only</span>
              <span className="text-faint">·</span>
              <span>Revocable in one click</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              Phase 6 closes with this page. Five sub-PRs landed
              the foundation: perception endpoint + schema (6.1),
              cognition observer (6.2), pacing engine (6.3),
              memory layer extensions (6.4), and this transparency
              page (6.5). A 60-90 day observation window now opens
              before Phase 7 (Temporal Architecture) begins; no
              further perception surface ships during that window.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
