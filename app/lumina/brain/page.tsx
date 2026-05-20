import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import VisitPing from "@/components/telemetry/VisitPing";
import { getSiteUrl } from "@/lib/site-url";
import {
  readToolInvocationCounts,
  readToolErrorCounts,
} from "@/lib/telemetry/metrics";
import {
  computeHitRate,
  readMemoryAdoption,
} from "@/lib/v5/memory/telemetry";
import {
  MAX_TTL_DAYS,
  MIN_TTL_DAYS,
  resolveTtlDays,
} from "@/lib/v5/memory/ttl";

/**
 * V4 Phase 4 — Sub-PR 4.1: Public Lumina transparency surface.
 *
 * Mission (V4 § 2.3 "Public Transparency Disiplini"): every piece
 * of Lumina's operating layer is visible to the visitor — the
 * system prompt, the tool registry, the memory contract, the
 * runtime topology, the privacy boundaries. The brain page reads
 * as a calm operator console showing "this is how the chat
 * actually works" with deep links into the public source files
 * for anyone who wants the verbatim text.
 *
 * Caching contract:
 *   - `revalidate = 3600` → hourly ISR. The content is intentionally
 *     near-static (the only frequently-changing piece is the tool
 *     count, and even that only shifts at sub-PR cadence). One
 *     re-render per hour is plenty.
 *
 * Performance budget (V4 § 2.7):
 *   - LCP < 1.5s. Static HTML, no data dependency, one tiny client
 *     island for the visit ping. Hit easily.
 *   - Bundle delta: 0 KB new code on the client beyond the
 *     reused VisitPing component.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Brain — Lumina's operating layer | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public transparency surface for Lumina, the chat embedded across emredogan.com. The model, the tool registry, the memory contract, the runtime topology, the privacy guarantees — every operating detail, with deep links into the public source.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${getSiteUrl()}/lumina/brain` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lumina/brain`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/blob/main";

/* ── Inline manifest of the current Lumina tool registry ─────────
 *
 * Kept as a hand-rolled list rather than imported from
 * `lib/lumina/tools` so the brain page stays decoupled from the
 * tool module's runtime graph (AI SDK + zod + KV imports). Source
 * of truth for the actual implementations is the linked file; this
 * manifest is editorial — it's the description the visitor reads.
 * When the tools registry changes, this list updates in the same
 * sub-PR per V4 § 2.3 transparency discipline. */

interface ToolRow {
  name: string;
  group:
    | "Portfolio reads"
    | "Operator reads"
    | "Lab invocation"
    | "Repo-aware reads";
  purpose: string;
}

const TOOLS: readonly ToolRow[] = [
  {
    name: "listProjects",
    group: "Portfolio reads",
    purpose: "Returns every project on the portfolio with its id, title, status, and short description.",
  },
  {
    name: "getProjectDetails",
    group: "Portfolio reads",
    purpose: "Full case-study record for one project — description, tech stack, status, live + GitHub URLs.",
  },
  {
    name: "searchNotes",
    group: "Portfolio reads",
    purpose: "Substring match across the long-form notes; returns the top five hits.",
  },
  {
    name: "getRecentCommits",
    group: "Portfolio reads",
    purpose: "The single most-recent commit Emre pushed. KV-cached from the GitHub Events feed.",
  },
  {
    name: "getCurrentTelemetry",
    group: "Operator reads",
    purpose: "Six-metric snapshot — Lumina p95, auto-tweet successes, lab runs, npm weekly downloads, notes audio plays.",
  },
  {
    name: "getRecentEngineering",
    group: "Operator reads",
    purpose: "Last five commits with the WHY paragraph parsed from each commit body.",
  },
  {
    name: "getLabStatus",
    group: "Operator reads",
    purpose: "Current /lab experiment registry — each entry's name, purpose, status, and URL.",
  },
  {
    name: "translateIamPolicy",
    group: "Lab invocation",
    purpose: "Loopback to /api/lab/iam-translate — runs the IAM Policy Translator with the visitor's IP forwarded.",
  },
  {
    name: "rescuePrompt",
    group: "Lab invocation",
    purpose: "Loopback to /api/lab/prompt-rescue — runs the Prompt Rescuer.",
  },
  {
    name: "narrateCommits",
    group: "Lab invocation",
    purpose: "Loopback to /api/lab/narrate-commits — runs the Commit Narrator on a public GitHub URL.",
  },
  {
    name: "readSourceFile",
    group: "Repo-aware reads",
    purpose: "Verbatim file contents from the public portfolio repo. Path-validated, 50 KB cap, KV-cached 1h.",
  },
  {
    name: "explainCommitRationale",
    group: "Repo-aware reads",
    purpose: "Subject + WHY paragraph + diff stats for a specific commit SHA. KV-cached 7d (immutable).",
  },
  {
    name: "diffArchitectures",
    group: "Repo-aware reads",
    purpose: "Structural diff of two projects' tech stacks. In-memory off data/projects.ts; no network.",
  },
] as const;

const TOOL_GROUPS = [
  "Portfolio reads",
  "Operator reads",
  "Lab invocation",
  "Repo-aware reads",
] as const;

interface ConfigRow {
  label: string;
  value: string;
  detail?: string;
}

const MODEL_CONFIG: readonly ConfigRow[] = [
  {
    label: "Model",
    value: "claude-haiku-4-5-20251001",
    detail: "Pinned snapshot of Anthropic's Haiku 4.5. No alias.",
  },
  {
    label: "Temperature",
    value: "0.6",
    detail: "Default for visitor chat — middle of warm and deterministic.",
  },
  {
    label: "Step cap",
    value: "stepCountIs(5)",
    detail: "Claude may chain up to four tool calls before being forced to answer.",
  },
  {
    label: "Runtime",
    value: "edge",
    detail: "Web Fetch + KV only. Lab routes run nodejs for the AWS SDK; voice STT runs nodejs for Whisper.",
  },
  {
    label: "Streaming",
    value: "ai-sdk/anthropic streamText",
    detail: "Response streams as UIMessageStreamResponse; client renders deltas as they arrive.",
  },
];

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "System prompt",
    path: "lib/lumina/system-prompt.ts",
    note: "The full voice + identity + tool-use rules.",
  },
  {
    label: "Tool registry",
    path: "lib/lumina/tools.ts",
    note: "The thirteen tools, their input schemas, their execute() bodies.",
  },
  {
    label: "Repo-aware helpers",
    path: "lib/lumina/repo-aware.ts",
    note: "Edge-safe direct fetch to GitHub's REST API. Path / SHA validation. KV cache per resource type.",
  },
  {
    label: "Memory layer",
    path: "lib/lumina/memory.ts",
    note: "KV save/load, configurable 14-30 day TTL (V5 Sub-PR 6.4), MAX_MESSAGES cap, VERBATIM_CONTEXT_MESSAGES = 8.",
  },
  {
    label: "Memory TTL (V5)",
    path: "lib/v5/memory/ttl.ts",
    note: "Operator-configurable TTL resolution via V5_MEMORY_TTL_DAYS env var; clamps to 14-30 day range, defaults to 14.",
  },
  {
    label: "Memory pages index (V5)",
    path: "lib/v5/memory/pages.ts",
    note: "Per-session recently-visited page slugs in a sibling KV key. Foundation only — no observer in 6.4; Phase 10 ambient awareness will wire the producer.",
  },
  {
    label: "Memory adoption telemetry (V5)",
    path: "lib/v5/memory/telemetry.ts",
    note: "Per-event counter (hit/miss/store/opt-out). Drives the hit-rate surfaced above; fire-and-forget at every loadSession/saveSession call.",
  },
  {
    label: "PII redaction",
    path: "lib/lumina/redact.ts",
    note: "Email + phone + AWS access key regex sweep applied pre-storage.",
  },
  {
    label: "Session summarization",
    path: "lib/lumina/summarize.ts",
    note: "Fire-and-forget Haiku call when older-turn block grows past threshold.",
  },
  {
    label: "Chat route",
    path: "app/api/chat/route.ts",
    note: "POST entry point. Loads summary, trims to last 8 turns, calls streamText.",
  },
  {
    label: "Forget-Me endpoint",
    path: "app/api/chat/forget/route.ts",
    note: "POST. Deletes both lumina:session:<id> and lumina:summary:<id> KV buckets.",
  },
];

/* V5 Sub-PR 6.4: the memory layer extensions are surfaced here
 * because /lumina/brain is the canonical transparency page for
 * the chat memory contract. The TTL row is computed at ISR
 * time so changes to the env override show up on the next
 * regeneration. */
const RESOLVED_TTL_DAYS = resolveTtlDays();
const TTL_VALUE =
  RESOLVED_TTL_DAYS === MIN_TTL_DAYS
    ? `${MIN_TTL_DAYS} days (refreshes on every save; operator can extend up to ${MAX_TTL_DAYS} days via V5_MEMORY_TTL_DAYS)`
    : `${RESOLVED_TTL_DAYS} days (operator-configured via V5_MEMORY_TTL_DAYS; range ${MIN_TTL_DAYS}-${MAX_TTL_DAYS} days; refreshes on every save)`;

const MEMORY_PROPS: readonly { label: string; value: string }[] = [
  { label: "Persistence", value: "anonymous sessionId minted client-side, kept in localStorage" },
  { label: "TTL", value: TTL_VALUE },
  { label: "Verbatim context cap", value: "last 8 turns sent to the model" },
  { label: "Older turns", value: "Haiku-generated 2-3 sentence recap, cached in a sibling KV key" },
  { label: "Storage cap", value: "100 messages per session (oldest dropped)" },
  {
    label: "Redaction",
    value:
      "emails, Turkish/international phones, AWS access keys, IPv6 + IPv4 addresses, Turkish national IDs (TC Kimlik, checksum-validated), and common API-key prefixes (sk-, ghp_, xoxb-, AIza…) — applied on write",
  },
  {
    label: "Pages index (V5)",
    value:
      "optional per-session list of recently-visited page slugs in a sibling KV key (lumina:session:<id>:pages, max 20 entries, same TTL). Foundation only in Sub-PR 6.4 — no observer mounted; Phase 10 ambient awareness will read this without ever mentioning it",
  },
  { label: "Opt-out", value: "Database icon in the chat header — when off, no KV reads or writes for the duration; preference persists across visits" },
  { label: "Forget control", value: "eraser icon in the chat header — deletes both KV buckets server-side" },
];

const TOPOLOGY_ROWS: readonly { surface: string; runtime: string; depends: string }[] = [
  { surface: "/api/chat (POST)", runtime: "edge", depends: "Anthropic API, KV (optional)" },
  { surface: "/api/chat/load (GET)", runtime: "edge", depends: "KV (graceful no-op without)" },
  { surface: "/api/chat/forget (POST)", runtime: "edge", depends: "KV (graceful no-op without)" },
  { surface: "/api/voice/transcribe (POST)", runtime: "edge", depends: "OpenAI Whisper, KV rate limit" },
  { surface: "/api/voice/tts (POST)", runtime: "edge", depends: "ElevenLabs" },
  { surface: "/api/lab/iam-translate (POST)", runtime: "nodejs", depends: "AWS Bedrock (SigV4 needs Node)" },
  { surface: "/api/lab/prompt-rescue (POST)", runtime: "nodejs", depends: "AWS Bedrock" },
  { surface: "/api/lab/narrate-commits (POST)", runtime: "nodejs", depends: "AWS Bedrock + GitHub Octokit" },
];

export default async function LuminaBrainPage() {
  /* Per-tool counters (Sub-PR 4.3). Both reads are KV hashes; a
   * KV-less environment returns empty objects and the section
   * below shows the "no data yet" placeholder.
   *
   * Sub-PR 6.4 adds the memory adoption hash to the parallel
   * batch — same posture, returns {} when KV is unavailable
   * or the layer hasn't recorded any hits yet. */
  const [invocations, errors, memoryAdoption] = await Promise.all([
    readToolInvocationCounts(),
    readToolErrorCounts(),
    readMemoryAdoption(),
  ]);
  const memoryHits = memoryAdoption.hit ?? 0;
  const memoryMisses = memoryAdoption.miss ?? 0;
  const memoryStores = memoryAdoption.store ?? 0;
  const memoryHitRate = computeHitRate(memoryAdoption);
  const hasMemoryAdoptionData =
    memoryHits + memoryMisses + memoryStores > 0;
  const usageRows = TOOLS.map((t) => ({
    name: t.name,
    group: t.group,
    invocations: invocations[t.name] ?? 0,
    errors: errors[t.name] ?? 0,
  }));
  const hasUsageData = usageRows.some((r) => r.invocations > 0);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant. Operator family. */}
      <PageAtmosphere variant="operator" />

      <VisitPing surface="lumina-brain" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* HERO */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
              Lumina
            </span>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">/</span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Brain
            </span>
            <Link
              href="/lumina/failures"
              className="ml-auto font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              Failures →
            </Link>
          </div>
        </Reveal>

        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Brain.</span>
            <span className="block text-white/55">The system behind the chat.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            Lumina is the AI embedded across this portfolio. Everything she
            does — every tool she calls, every byte she stores, every model
            decision — is visible on this page or one click away in the
            public source. Operator-grade transparency is the brand contract.
          </p>
        </Reveal>

        {/* MODEL CONFIG */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · Model configuration
          </h2>
          <dl className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {MODEL_CONFIG.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4"
              >
                <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {row.label}
                </dt>
                <dd className="text-sm text-primary">
                  <span className="font-mono text-[13px] text-[#00d2ff]/90">
                    {row.value}
                  </span>
                  {row.detail && (
                    <span className="block text-secondary text-[13px] mt-1">
                      {row.detail}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* TOOL REGISTRY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Tool registry
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Thirteen tools across four groups. Every <code className="font-mono text-[13px] text-primary">execute()</code> body
            is server-side; nothing runs in the visitor&apos;s browser. The lab-
            invocation tools loopback to the existing /api/lab routes with
            the visitor&apos;s IP forwarded so rate limits and cost caps stay
            attributed to them. The repo-aware tools read this very repo
            via direct fetch to GitHub&apos;s public REST API — KV-cached so
            the same file isn&apos;t fetched twice per hour.
          </p>
          <div className="space-y-7">
            {TOOL_GROUPS.map((group) => (
              <div key={group}>
                <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/70 mb-3">
                  {group}
                </h3>
                <ul className="space-y-3">
                  {TOOLS.filter((t) => t.group === group).map((t) => (
                    <li key={t.name} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 md:gap-5">
                      <span className="font-mono text-[13px] text-primary">{t.name}</span>
                      <span className="text-sm text-secondary leading-relaxed">{t.purpose}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        {/* MEMORY CONTRACT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · Memory contract
          </h2>
          <dl className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {MEMORY_PROPS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4"
              >
                <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {row.label}
                </dt>
                <dd className="text-sm text-secondary leading-relaxed">{row.value}</dd>
              </div>
            ))}
          </dl>

          {/* V5 Sub-PR 6.4 — live memory adoption snapshot. Fires
              from loadSession/saveSession in lib/lumina/memory.ts on
              every KV round-trip. The hit-rate = hit / (hit + miss);
              null when there's no signal yet. */}
          <div className="mt-6">
            <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-3">
              Live adoption
            </h3>
            {hasMemoryAdoptionData ? (
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]">
                  <dt className="font-mono uppercase tracking-[0.16em] text-[9px] text-tertiary">
                    hits
                  </dt>
                  <dd className="font-mono text-[12px] text-[#00d2ff]/90">
                    {memoryHits.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]">
                  <dt className="font-mono uppercase tracking-[0.16em] text-[9px] text-tertiary">
                    misses
                  </dt>
                  <dd className="font-mono text-[12px] text-primary">
                    {memoryMisses.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]">
                  <dt className="font-mono uppercase tracking-[0.16em] text-[9px] text-tertiary">
                    stores
                  </dt>
                  <dd className="font-mono text-[12px] text-primary">
                    {memoryStores.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-[#00d2ff]/[0.04] border border-[#00d2ff]/20">
                  <dt className="font-mono uppercase tracking-[0.16em] text-[9px] text-tertiary">
                    hit-rate
                  </dt>
                  <dd className="font-mono text-[12px] text-[#00d2ff]/90">
                    {memoryHitRate === null
                      ? "—"
                      : `${Math.round(memoryHitRate * 100)}%`}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="font-mono text-[12.5px] text-tertiary border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
                <span className="text-[#00d2ff]/80">$</span>{" "}
                memory.adoption.snapshot
                <span className="block text-secondary mt-1">
                  No adoption data yet — counters fire on the next
                  chat turn with KV available.
                </span>
              </p>
            )}
          </div>
        </Reveal>

        {/* RUNTIME TOPOLOGY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Runtime topology
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Edge wherever possible; Node only where the dependency forces it
            (AWS Bedrock SDK + Whisper transcribe binary upload).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                    Surface
                  </th>
                  <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                    Runtime
                  </th>
                  <th className="py-2 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                    Depends on
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {TOPOLOGY_ROWS.map((row) => (
                  <tr key={row.surface}>
                    <td className="py-2.5 pr-4 font-mono text-[12.5px] text-primary">
                      {row.surface}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12.5px]">
                      <span
                        className={
                          row.runtime === "edge"
                            ? "text-[#00d2ff]/90"
                            : "text-amber-300/80"
                        }
                      >
                        {row.runtime}
                      </span>
                    </td>
                    <td className="py-2.5 text-secondary">{row.depends}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* PRIVACY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Privacy contract
          </h2>
          <ul className="space-y-3 text-secondary text-sm leading-relaxed list-disc list-inside marker:text-tertiary">
            <li>
              Anonymous sessionId only — no account, no fingerprint, no
              cross-device link.
            </li>
            <li>
              PII (emails, phone numbers, AWS access keys) is redacted
              before storage. The KV bucket never holds raw values.
            </li>
            <li>
              The eraser icon in the chat header deletes both KV buckets
              server-side and wipes local state. One click, no
              confirmation dialog, no toast.
            </li>
            <li>
              Lab tool invocations carry your IP via the standard
              forwarded headers so per-IP rate limits and the $5/day
              per-experiment cost caps stay attributed to you across
              surfaces.
            </li>
            <li>
              No conversation is ever shared across visitors. No
              fingerprinting, no third-party trackers.
            </li>
          </ul>
        </Reveal>

        {/* SOURCE LINKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The verbatim text for every behavior on this page lives in
            the public repo. Click any row to read the file on GitHub.
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
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary group-hover:text-secondary">
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

        {/* CONSISTENCY EVAL (Sub-PR 4.3) */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            07 · Tool consistency eval
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            A deterministic consistency check runs over every tool
            in the registry: it verifies the tool exists in{" "}
            <code className="font-mono text-[13px] text-primary">
              lib/lumina/tools.ts
            </code>
            , has a matching spinner label in{" "}
            <code className="font-mono text-[13px] text-primary">
              TOOL_LABEL
            </code>
            , has a row in the manifest above, and that its{" "}
            <code className="font-mono text-[13px] text-primary">
              execute()
            </code>{" "}
            body is wrapped in{" "}
            <code className="font-mono text-[13px] text-primary">
              withTelemetry
            </code>{" "}
            so its invocation count fires. The script is the public,
            runnable surface — invoke it locally and the result is
            yours to read directly.
          </p>
          <div className="font-mono text-[12.5px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-secondary">
            <div className="text-[#00d2ff]/80">$ npm run eval:lumina</div>
            <div className="text-tertiary">
              (or:{" "}
              <code className="text-primary">
                node scripts/eval-lumina-tools.mjs
              </code>
              )
            </div>
          </div>
          <p className="text-secondary text-[13px] leading-relaxed mt-4 max-w-2xl">
            Exit 0 means every tool surfaces consistently across the
            four files; exit 1 flags the regression. Source at{" "}
            <Link
              href={`${REPO_BASE}/scripts/eval-lumina-tools.mjs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00d2ff]/90 hover:text-[#00d2ff] transition-colors"
            >
              scripts/eval-lumina-tools.mjs
            </Link>
            .
          </p>
        </Reveal>

        {/* SUB-AGENTS (Sub-PR 4.5) */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            09 · Sub-agents
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            One sub-agent runs alongside the default Lumina chat,
            routed deterministically by a heuristic classifier (no
            second LLM call). Ambiguous or unrelated turns always
            land on the default — the constitutional MUST &ldquo;fail
            back to single-agent mode&rdquo; is satisfied at the
            router boundary.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4 border-t border-b border-white/[0.06]">
            <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
              architecture-critic
            </div>
            <div className="text-secondary text-sm leading-relaxed">
              Routed when the visitor&apos;s most recent message
              contains a critique verb (review, evaluate, audit,
              etc.) AND an architecture noun (system design,
              tradeoff, pipeline, etc.) — or explicitly opens with
              <code className="font-mono text-[12px] text-primary">
                {" "}
                @architecture-critic
              </code>
              .
              {" "}
              <Link
                href="/lumina/brain/architecture-critic"
                className="text-[#00d2ff]/90 hover:text-[#00d2ff] transition-colors"
              >
                Read the full agent transparency →
              </Link>
            </div>
          </div>
          <p className="text-tertiary text-[13px] leading-relaxed mt-5 max-w-2xl">
            Visible orchestration trace: when the sub-agent fires
            you&apos;ll see an <code className="font-mono text-[12px] text-primary">engaging architecture-critic</code>{" "}
            pill in the chat-status strip before the response
            streams. That pill is the trace surface the V4 § 4.4
            directive mandates.
          </p>
        </Reveal>

        {/* LIVE TOOL USAGE (Sub-PR 4.3) */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            08 · Live tool usage
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Per-tool invocation counters fire on every chat turn —
            one fire-and-forget KV{" "}
            <code className="font-mono text-[13px] text-primary">
              HINCRBY
            </code>{" "}
            per call. Refreshed at the brain page&apos;s hourly ISR
            cadence; latency contributed to the chat is &lt; 5 ms.
          </p>
          {hasUsageData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                      Tool
                    </th>
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal">
                      Group
                    </th>
                    <th className="py-2 pr-4 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal text-right">
                      Calls
                    </th>
                    <th className="py-2 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary font-normal text-right">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {usageRows
                    .slice()
                    .sort((a, b) => b.invocations - a.invocations)
                    .map((row) => (
                      <tr key={row.name}>
                        <td className="py-2 pr-4 font-mono text-[12.5px] text-primary">
                          {row.name}
                        </td>
                        <td className="py-2 pr-4 text-secondary text-[12.5px]">
                          {row.group}
                        </td>
                        <td className="py-2 pr-4 font-mono text-[12.5px] text-[#00d2ff]/90 text-right">
                          {row.invocations.toLocaleString("en-US")}
                        </td>
                        <td
                          className={`py-2 font-mono text-[12.5px] text-right ${row.errors > 0 ? "text-amber-300/80" : "text-tertiary"}`}
                        >
                          {row.errors.toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-tertiary text-sm italic">
              No tool invocations recorded yet. Counters land here
              the moment a chat turn calls a tool.
            </p>
          )}
        </Reveal>

        {/* FOOTER */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
              />
              <span>Public transparency</span>
              <span className="text-faint">·</span>
              <span>V4 § 2.3</span>
              <span className="text-faint">·</span>
              <Link
                href="/lumina/failures"
                className="text-tertiary hover:text-[#00d2ff] transition-colors"
              >
                Corrections log →
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
