/**
 * V5 Phase 7 Sub-PR 7.1 — temporal architecture schema.
 *
 * Phase 7 turns the ecosystem into something that REMEMBERS itself.
 * Not a changelog (that surface lives at /changelog and reads the
 * raw commit firehose). Not a personal diary. Not a marketing
 * roadmap. This is the **engineering memory** layer — versioned,
 * typed, declarative — that subsequent Phase 7+ surfaces (timeline
 * playback, topology scrubber, operational twin) will read from
 * without ever re-deriving the why.
 *
 * The contract this module ships:
 *
 *   1. A closed allow-list of evolution event CATEGORIES. Anything
 *      outside the list cannot enter the registry. Categories are
 *      the load-bearing axis Phase 7+ consumers filter on.
 *
 *   2. An evolution event STATUS taxonomy — `current` for the
 *      latest expression of an architectural decision, `superseded`
 *      for entries that have been replaced by a subsequent event.
 *      The superseded flag is forward-looking; the registry is
 *      append-only, so a superseded entry stays in place and the
 *      newer entry references it through `supersedes`.
 *
 *   3. A PROVENANCE taxonomy — every event declares whether it
 *      comes from a commit, a sub-PR report, an external reference,
 *      or a synthesis pass. The provenance is the audit trail
 *      Phase 7+ surfaces (and visitors) use to trust the memory.
 *
 *   4. The `EvolutionEvent` interface itself. Stable kebab-case
 *      `id`. ISO-8601 `date`. One-paragraph `summary`. Optional
 *      `rationale` (the WHY — the engineering memory bit). Optional
 *      `commitSha`. Optional `refs` (commit/doc/external links the
 *      detail UI can render verbatim). Optional `version` (semver-
 *      style or phase identifier). Optional `system` (project /
 *      subsystem slug).
 *
 * What this module is NOT:
 *   - It is NOT a renderer. UI lives in `app/evolution/*`.
 *   - It is NOT a fetcher. There is no I/O on this path; the
 *     registry is a typed static array imported at build time from
 *     `data/temporal/events.ts`.
 *   - It is NOT a telemetry hook. KV writes live in
 *     `lib/v5/temporal/telemetry.ts`.
 *
 * Edge-safety: pure data + pure functions, no module-scope side
 * effects, no imports beyond TypeScript types. Safe to load from
 * any runtime.
 */

/**
 * The closed allow-list of evolution event categories. Each
 * category is a single architectural axis the registry indexes on.
 * The list is deliberately small — the memory layer ranks events
 * by their architectural weight, not by content type.
 *
 *   architecture    — major architectural decisions, system
 *                     redesigns, the moments where the topology
 *                     itself shifted.
 *   infrastructure  — the platform underneath: edge runtime
 *                     migrations, KV cache layers, build pipelines,
 *                     CI/CD, deploy posture.
 *   ai-system       — Lumina + sub-agents + lab experiments +
 *                     evals — the AI-native subsystems.
 *   topology        — the visible architecture surface itself —
 *                     the 3D hero scene, the architecture pages,
 *                     the cinematic topology shipping in Phase 8.
 *   release         — package publishes, version cuts, OSS
 *                     milestones. The events that put a number on
 *                     a system.
 *   milestone       — meta moments — V1/V2/V3/V4/V5 transitions,
 *                     phase closures, observation windows.
 *   evolution       — the catch-all for cross-cutting changes
 *                     that don't fit one axis but matter as
 *                     ecosystem evolution.
 *
 * Order matters: this is the canonical display order Phase 7
 * surfaces use when grouping by category.
 */
export const EVOLUTION_EVENT_CATEGORIES = [
  "architecture",
  "infrastructure",
  "ai-system",
  "topology",
  "release",
  "milestone",
  "evolution",
] as const;

export type EvolutionEventCategory =
  (typeof EVOLUTION_EVENT_CATEGORIES)[number];

const CATEGORY_SET: ReadonlySet<string> = new Set(
  EVOLUTION_EVENT_CATEGORIES,
);

/** Return true when `value` is a registered category. Used at the
 *  registry boundary + at the edge endpoint. */
export function isEvolutionEventCategory(
  value: unknown,
): value is EvolutionEventCategory {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

/**
 * Status taxonomy. Append-only is the registry's storage contract;
 * `superseded` is the editorial flag a later entry sets on an
 * earlier one via the newer entry's `supersedes` field.
 *
 *   current     — the latest expression of an architectural
 *                 decision. The default for every fresh entry.
 *   superseded  — a previous entry that a later one has replaced.
 *                 The pair stays in the registry; the superseded
 *                 entry continues to render so the audit trail
 *                 remains intact.
 */
export const EVOLUTION_EVENT_STATUSES = [
  "current",
  "superseded",
] as const;

export type EvolutionEventStatus =
  (typeof EVOLUTION_EVENT_STATUSES)[number];

const STATUS_SET: ReadonlySet<string> = new Set(EVOLUTION_EVENT_STATUSES);

export function isEvolutionEventStatus(
  value: unknown,
): value is EvolutionEventStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

/**
 * Provenance taxonomy. Every event declares where its memory
 * comes from. This is the audit trail for the registry; a future
 * sub-PR may surface the provenance as a small inline pill so
 * the visitor reads not just WHAT happened, but how the system
 * knows.
 *
 *   commit     — a real commit SHA is the source of record.
 *                The `commitSha` field carries it.
 *   report     — a sub-PR report under `sub-pr-report/` is the
 *                source of record. The `refs` array can carry
 *                the path.
 *   external   — an external resource (npm package, GitHub
 *                release, documentation) is the source of record.
 *                The `refs` array carries the URL.
 *   synthesis  — the event aggregates multiple commits / reports
 *                into a single declarative statement. The
 *                operator authored the summary as a memory pass;
 *                the underlying commits remain individually
 *                available via /changelog.
 */
export const EVOLUTION_EVENT_PROVENANCES = [
  "commit",
  "report",
  "external",
  "synthesis",
] as const;

export type EvolutionEventProvenance =
  (typeof EVOLUTION_EVENT_PROVENANCES)[number];

const PROVENANCE_SET: ReadonlySet<string> = new Set(
  EVOLUTION_EVENT_PROVENANCES,
);

export function isEvolutionEventProvenance(
  value: unknown,
): value is EvolutionEventProvenance {
  return typeof value === "string" && PROVENANCE_SET.has(value);
}

/**
 * A single reference an event can carry. The detail UI renders
 * these inline as small monospace pills — readers can audit the
 * memory without leaving the page.
 *
 *   kind === "commit"  → `sha` is required; `url` is derived
 *                        from the repo URL + sha at render time.
 *   kind === "report"  → `path` is the repo-relative path
 *                        (e.g. `sub-pr-report/SUB-PR_6.4_REPORT.md`).
 *   kind === "doc"     → `path` is the repo-relative path of the
 *                        document.
 *   kind === "external"→ `url` is required.
 */
export type EvolutionEventRefKind =
  | "commit"
  | "report"
  | "doc"
  | "external";

export interface EvolutionEventRef {
  kind: EvolutionEventRefKind;
  /** Short editorial label (e.g. "Sub-PR 6.4 report",
   *  "@vercel/kv docs"). Required so the inline pill is
   *  self-describing. */
  label: string;
  /** Commit SHA for `kind === "commit"`. Short or full SHA both
   *  acceptable; the renderer normalises to the first 7 chars. */
  sha?: string;
  /** Repo-relative path for `kind === "report"` / `kind === "doc"`. */
  path?: string;
  /** External URL for `kind === "external"`. Required for that
   *  variant; ignored otherwise. */
  url?: string;
}

/**
 * The canonical evolution event shape. Every entry in the
 * registry conforms to this interface. The fields are designed
 * to support:
 *
 *   - Phase 7.1 (this sub-PR): a quietly archival editorial
 *     surface that reads as engineering memory.
 *   - Phase 7.2-7.4: timeline scrubber + architecture playback
 *     by reading `date`, `version`, `system`, `supersedes`.
 *   - Phase 8: cinematic topology can match events to their
 *     topology snapshots via `system` + `version`.
 *   - Phase 9: operational twin can read the registry as the
 *     editorial layer above the raw commit firehose.
 *   - External reuse (RSS / JSON feed / sitemap) by serialising
 *     the registry as JSON via the temporal API.
 *
 * All fields are typed strictly. Optional fields are explicitly
 * `?` so the consumer reads the editorial intent of "this field
 * may or may not exist for this event".
 */
export interface EvolutionEvent {
  /** Stable kebab-case slug. Used as the anchor hash on the
   *  evolution page (`/evolution#<id>`), as the React key in
   *  list renders, and as the persistent identifier across
   *  schema changes. Must be unique across the registry. */
  id: string;
  /** ISO-8601 calendar date (YYYY-MM-DD). The event date is the
   *  date the architectural shift LANDED — not the date the work
   *  began. Sorted descending across the registry; the most
   *  recent event renders first by default. */
  date: string;
  /** One-line editorial headline. The kind a senior engineer
   *  reads at the top of a decision memo and immediately
   *  understands. */
  title: string;
  /** The architectural axis this event sits on. Drives filtering
   *  + categorical grouping on the evolution page. */
  category: EvolutionEventCategory;
  /** Optional version identifier. Free-form to accommodate both
   *  semver (`0.1.0`) and phase identifiers (`V4 Phase 4`,
   *  `Sub-PR 6.1`). Phase 7.2's timeline scrubber will sort
   *  events with the same `system` lexicographically by version
   *  when present. */
  version?: string;
  /** Optional system slug. Aligns with project ids in
   *  `data/projects.ts` (`cloud-waste-hunter`,
   *  `vibing-coder-ai`, `sixpack-ai`) plus subsystem slugs
   *  (`lumina`, `lab`, `playground`, `perception`,
   *  `memory`, `pacing`, `cli`, `lumina-chat`, `portfolio`).
   *  Phase 7+ surfaces can filter events to a single system. */
  system?: string;
  /** The current/superseded flag. Defaults to "current" for
   *  every fresh entry; a later entry sets a previous entry's
   *  status to "superseded" via the newer entry's `supersedes`
   *  field. The registry itself is append-only — superseded
   *  entries stay rendered so the audit trail remains intact. */
  status: EvolutionEventStatus;
  /** Optional reference to the entry this event replaces. When
   *  present, the referenced entry's status flips to "superseded"
   *  on the next registry derive pass. */
  supersedes?: string;
  /** One declarative paragraph. The architecture-mattering part
   *  of what happened. Plain language, no marketing voice. The
   *  voice the existing /lumina/failures + sub-PR reports use. */
  summary: string;
  /** Optional second paragraph carrying the WHY — the engineering
   *  memory bit. Why the decision was made, what tradeoff it
   *  resolved, what constraint it accepted. Optional because
   *  some events (a package publish, a renumber) don't have a
   *  load-bearing why. */
  rationale?: string;
  /** Optional commit SHA the event landed under. Short (7-char)
   *  or full SHA both acceptable; the renderer normalises to
   *  the first 7 chars. */
  commitSha?: string;
  /** Optional inline references. The detail UI renders these
   *  as small monospace pills below the rationale. */
  refs?: readonly EvolutionEventRef[];
  /** Where this memory comes from. Drives the small provenance
   *  pill some future UI iteration may surface. */
  provenance: EvolutionEventProvenance;
}

/* ── Type guards + light validators ──────────────────────────── */

/** True when `value` looks like a syntactic kebab-case id of
 *  reasonable length. The registry id is the single most
 *  load-bearing string in the schema — bad ids break URLs,
 *  React keys, and the future timeline scrubber. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

export function isValidEvolutionEventId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/** True when `value` is a YYYY-MM-DD date string with a valid
 *  calendar reading. */
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidEvolutionEventDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = DATE_PATTERN.exec(value);
  if (m === null) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 2024 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  /* round-trip parse to weed out 2026-02-30 */
  const dt = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(dt.getTime()) &&
    dt.toISOString().slice(0, 10) === value
  );
}

/** Deep validator. Used in dev / by the temporal API as a
 *  belt-and-braces guard against a hand-edited entry slipping
 *  through `tsc`. Returns the failed field name on the first
 *  violation; `null` when the event is well-formed. */
export function validateEvolutionEvent(event: unknown): string | null {
  if (event === null || typeof event !== "object") return "event";
  const e = event as Partial<EvolutionEvent>;
  if (!isValidEvolutionEventId(e.id)) return "id";
  if (!isValidEvolutionEventDate(e.date)) return "date";
  if (typeof e.title !== "string" || !e.title) return "title";
  if (!isEvolutionEventCategory(e.category)) return "category";
  if (!isEvolutionEventStatus(e.status)) return "status";
  if (typeof e.summary !== "string" || !e.summary) return "summary";
  if (!isEvolutionEventProvenance(e.provenance)) return "provenance";
  if (
    e.version !== undefined &&
    (typeof e.version !== "string" || !e.version)
  ) {
    return "version";
  }
  if (
    e.system !== undefined &&
    (typeof e.system !== "string" || !e.system)
  ) {
    return "system";
  }
  if (
    e.supersedes !== undefined &&
    !isValidEvolutionEventId(e.supersedes)
  ) {
    return "supersedes";
  }
  if (
    e.rationale !== undefined &&
    (typeof e.rationale !== "string" || !e.rationale)
  ) {
    return "rationale";
  }
  if (
    e.commitSha !== undefined &&
    (typeof e.commitSha !== "string" ||
      !/^[a-f0-9]{7,40}$/i.test(e.commitSha))
  ) {
    return "commitSha";
  }
  if (e.refs !== undefined) {
    if (!Array.isArray(e.refs)) return "refs";
    for (const ref of e.refs) {
      if (ref === null || typeof ref !== "object") return "refs";
      const r = ref as Partial<EvolutionEventRef>;
      if (
        r.kind !== "commit" &&
        r.kind !== "report" &&
        r.kind !== "doc" &&
        r.kind !== "external"
      ) {
        return "refs.kind";
      }
      if (typeof r.label !== "string" || !r.label) return "refs.label";
      if (r.kind === "commit" && (typeof r.sha !== "string" || !r.sha)) {
        return "refs.sha";
      }
      if (
        (r.kind === "report" || r.kind === "doc") &&
        (typeof r.path !== "string" || !r.path)
      ) {
        return "refs.path";
      }
      if (
        r.kind === "external" &&
        (typeof r.url !== "string" || !r.url)
      ) {
        return "refs.url";
      }
    }
  }
  return null;
}
