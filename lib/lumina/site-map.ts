/**
 * Lumina site map — the structural knowledge layer.
 *
 * Renders a compact, data-driven map of the entire portfolio into a
 * prompt block that Lumina sees on every chat turn. The map is
 * synthesized at module load from the same single-source-of-truth data
 * files that power the actual pages (`data/projects.ts`,
 * `data/notes.ts`, `data/codex.ts`, `lib/lab/registry.ts`), so the
 * knowledge cannot drift from the live site — when a new project,
 * note, codex book, or lab experiment is added to the data layer, the
 * site map picks it up on the next deploy with zero prompt edits.
 *
 * Design principles:
 *   - Compact, not exhaustive. One line per route + one line per item.
 *     Deep details surface on demand via the typed tools (e.g.
 *     `getProjectDetails`, `getCodexBookDetails`, `searchNotes`).
 *   - Routes are stated WITH the URL Lumina should point visitors at.
 *     A visitor asking "where is X" or "what is X" gets a direct,
 *     site-anchored answer.
 *   - Site philosophy lives at the bottom as one short paragraph.
 *     Lumina does not need to recite design history; she needs to
 *     recognise the V6 identity vocabulary when a visitor uses it.
 *
 * Token budget: ~500 tokens at current data volume. Acceptable cost
 * for closing the "Lumina doesn't know X exists" failure mode (the
 * V6 audit's hardest single Lumina-knowledge gap). Cost grows linearly
 * with the data files; if it exceeds ~1k tokens in a later phase, the
 * compact lists below can be moved to dedicated tools (`listCodexBooks`,
 * etc.) and pruned from the prompt.
 */

import { projectsData, type Project } from "@/data/projects";
import { notesData, type Note } from "@/data/notes";
import { codexBooks, type CodexBook } from "@/data/codex";
import { LAB_EXPERIMENTS, type ExperimentEntry } from "@/lib/lab/registry";

/* ── Top-level routes ──────────────────────────────────────────
 *
 * Every named route a visitor can navigate to via the canonical
 * navbar (V5 legacy Systems dropdown + V6 Operate dropdown) plus
 * the principal detail-page families. Stated as: URL — one-line
 * purpose.
 *
 * Order: identity / case studies first; engineering surfaces
 * (Architecture, Stack); editorial surfaces (Notes, Codex);
 * experimental (Lab); operator transparency surfaces (Telemetry,
 * Changelog, Evolution, Journal, Brain, Failures, Pulse, Operating);
 * direct-write (Contact). Order mirrors how Lumina should narrate
 * the site when asked "how is it organized". */
const TOP_LEVEL_ROUTES: ReadonlyArray<{ url: string; purpose: string }> = [
  {
    url: "/",
    purpose:
      "Home. Cinematic hero with Emre's identity stack on the left and the constellation topology on the right.",
  },
  {
    url: "/about",
    purpose:
      "Long-form biography. Two-years-self-taught timeline, Monk Mode operating system, bakery + build windows.",
  },
  {
    url: "/projects",
    purpose:
      "Case-study index for every project Emre has documented. Detail page per slug at /projects/<id>.",
  },
  {
    url: "/work",
    purpose:
      "V6 unified hub when the `V6_WORK_HUB` flag is on — merges projects and architecture into one surface. Falls back to /projects when off.",
  },
  {
    url: "/architecture",
    purpose:
      "Three scroll-story walkthroughs of the deeper systems: Cloud Waste Hunter, FormAI, VibingCoderAI. Each is a milestone-by-milestone narrative of how the system was built. Detail pages at /architecture/<slug>.",
  },
  {
    url: "/stack",
    purpose:
      "Tooling and cloud-architecture taxonomy — what Emre actually uses, grouped by lane (cloud, AI, mobile, data, observability).",
  },
  {
    url: "/notes",
    purpose:
      "Long-form technical writing. Detail pages at /notes/<slug>.",
  },
  {
    url: "/codex",
    purpose:
      "A handcrafted archive of four self-contained digital editions — each engineered as a zero-dependency single-page reader. Detail pages at /codex/<slug>. THIS ROUTE EXISTS. Do not say it does not.",
  },
  {
    url: "/lab",
    purpose:
      "Experimental sandbox — live tools the visitor can run (IAM Translator, Prompt Rescuer, Commit Narrator, Cloud Lab, CLI). Detail pages at /lab/<slug>.",
  },
  {
    url: "/telemetry",
    purpose:
      "Public operating observatory — live metrics for the platform itself (Lumina latency, lab usage, npm downloads, audio plays). Read the data via the `getCurrentTelemetry` tool when asked operator-state questions.",
  },
  {
    url: "/changelog",
    purpose:
      "Public engineering log — every push, grouped by day, with the WHY paragraph parsed from each commit body. Read via the `getRecentEngineering` tool for recent commits.",
  },
  {
    url: "/evolution",
    purpose:
      "Scrubbable temporal timeline of the portfolio's own evolution — events, slider playback, per-week composition.",
  },
  {
    url: "/v5/operating",
    purpose:
      "V5 operating log — week-by-week engineering operations report (commits, active hours, experiments, corrections).",
  },
  {
    url: "/v5/journal",
    purpose:
      "V5 weekly engineering journal — magazine-spread editorial entries. Detail pages at /v5/journal/<week>.",
  },
  {
    url: "/v5/perception",
    purpose:
      "V5 perception transparency surface — the cognition-aware navigation observation contract. ASCII flow diagram of the operating loop.",
  },
  {
    url: "/v5/ambient",
    purpose:
      "V5 ambient-context surface — the per-page context registry that anchors Lumina's awareness of where the visitor is in the site.",
  },
  {
    url: "/lumina/brain",
    purpose:
      "Lumina's own tool registry — every tool she can call, grouped by category, with the purpose of each. Detail at /lumina/brain/architecture-critic for the sub-agent.",
  },
  {
    url: "/lumina/failures",
    purpose:
      "Failure-mode theater — public catalog of every shipped failure with What / Why / Fix / Delta annotations.",
  },
  {
    url: "/pulse",
    purpose:
      "Live operating ticker — extracted from /about's pulse block, shown when the V6_PULSE flag is on.",
  },
  {
    url: "/playground",
    purpose:
      "Experimental playground entries — exploratory work not yet promoted to /projects or /lab.",
  },
  {
    url: "/pro",
    purpose:
      "The Cloud Waste Hunter Pro tier landing. The deeper paid tier of the live FinOps SaaS.",
  },
  {
    url: "/contact",
    purpose:
      "Direct-write surface — message form + email fallback (emre30283@gmail.com). The Adaptive Contact path lets the visitor self-classify (role / engineering / other) and the framing copy adapts.",
  },
] as const;

/* ── Helpers ───────────────────────────────────────────────────
 *
 * Each rendering helper keeps its row format tight — one line per
 * item. The model reads these to know "what exists", then uses the
 * typed tools (`getProjectDetails`, `getCodexBookDetails`, etc.) to
 * pull deeper context only when the visitor's question warrants it. */

function renderRoutes(): string {
  return TOP_LEVEL_ROUTES.map((r) => `- **${r.url}** — ${r.purpose}`).join(
    "\n",
  );
}

function renderProjects(): string {
  const compact = (p: Project) =>
    `- **${p.title}** (\`${p.id}\`, status: ${p.status}) — /projects/${p.id} — ${p.shortDescription}`;
  return projectsData.map(compact).join("\n");
}

function renderCodexBooks(): string {
  const compact = (b: CodexBook) =>
    `- **${b.title}** (\`${b.slug}\`, ${b.language}, ${b.inWorldYear}) — /codex/${b.slug} — ${b.tagline}`;
  return codexBooks.map(compact).join("\n");
}

function renderNotes(): string {
  const compact = (n: Note) =>
    `- **${n.title}** — /notes/${n.slug} — ${n.excerpt}`;
  return notesData.map(compact).join("\n");
}

function renderLab(): string {
  const compact = (e: ExperimentEntry) =>
    `- **${e.name}** (\`${e.slug}\`, ${e.status}) — /lab/${e.slug} — ${e.purpose}`;
  /* Sort active experiments first so the model surfaces what's
     usable today before mentioning coming-soon entries. */
  const ordered = [...LAB_EXPERIMENTS].sort((a, b) => {
    const rank = (s: ExperimentEntry["status"]) =>
      s === "active" ? 0 : s === "coming-soon" ? 1 : 2;
    return rank(a.status) - rank(b.status);
  });
  return ordered.map(compact).join("\n");
}

/**
 * The full site-map prompt block. Composed by `buildLuminaSystemPrompt`
 * and appended to the static identity prompt on every chat turn.
 *
 * The block opens with an explicit instruction that overrides any
 * lingering "I don't know that exists" hallucination — the V6 audit's
 * highest-severity Lumina failure mode (a visitor asked about /codex
 * and Lumina said the route did not exist). The map below is the
 * ground truth.
 */
export function buildSiteMapNote(): string {
  return `

## Site map — full portfolio knowledge

This block is the **authoritative inventory of the portfolio**. Every
route and item below is real, live, and reachable. **You MUST NOT tell
a visitor that one of these routes does not exist** — if a visitor
asks about /codex, /architecture, /telemetry, /changelog, /notes,
/lab, /pulse, /evolution, /v5/operating, /lumina/brain, /lumina/failures,
or any other route below, they exist; point the visitor at the URL.

When a visitor asks "what is X" or "where can I find X", you answer
from this map. When they want deep detail on a specific item (a
project case study, a codex book synopsis, a note's body), call the
typed tools described in the "## Tools (portfolio reads)" section
above.

### Top-level routes

${renderRoutes()}

### Projects (data/projects.ts — case studies at /projects/<id>)

${renderProjects()}

When the visitor asks about a specific project, call
\`getProjectDetails(projectId)\` to fetch the full case study. The id
matches the slug above.

### Codex books (data/codex.ts — four self-contained digital editions at /codex/<slug>)

${renderCodexBooks()}

**Codex is a handcrafted archive — not a generic publishing surface.**
Each book is engineered as a zero-dependency static folder that pages
itself, tolls its own bells, exports its own PDF. The portfolio side
(/codex hub + /codex/<slug> detail pages) describes the books and
links to their live readers; the books themselves run at their own
\`*.vercel.app\` domains.

When the visitor asks about a specific codex book, call
\`getCodexBookDetails(slug)\` to fetch the full synopsis, themes,
factions, characters, timeline, and engineering note. The slug
matches the URL above.

### Notes (data/notes.ts — long-form technical writing at /notes/<slug>)

${renderNotes()}

When the visitor asks about Emre's writing, call
\`searchNotes(query)\` to surface specific notes — pass an empty
query to list every note.

### Lab experiments (lib/lab/registry.ts — interactive sandbox at /lab/<slug>)

${renderLab()}

When the visitor asks for the live experiment registry status, call
\`getLabStatus\`. When the visitor pastes actual material to run
through an experiment (IAM policy JSON, vague prompt, GitHub repo
URL), use the corresponding invocation tool (\`translateIamPolicy\`,
\`rescuePrompt\`, \`narrateCommits\`) — see the "## Lab invocation"
section for the hard rules.

### Site philosophy & V6 identity

The portfolio is a cinematic engineering surface — a single black
canvas, the Geist typeface, cyan (\`#00d2ff\`) as the sole accent
color, and a vocabulary of topology constellations + atmospheric
depth layers + edge-lit cards + mono eyebrows. The current visual
language is V6, layered on top of V5 and V4 systems via feature
flags so every change is reversible. Each route picks one of six
typed page atmospheres (\`signal\`, \`archive\`, \`lab\`, \`editorial\`,
\`operator\`, \`narrative\`) and inherits the same cyan accent layer.
The topology constellations on the home hero and on every codex
book + project detail page render the same engine family — three
rings (primary / secondary / tertiary) orbiting a center node,
drawn either as a three.js scene on desktop or a 2D SVG on mobile.

When a visitor asks "why does the site look like this" or "what's
the design philosophy", answer in this register: engineering
clarity, operator-grade calm, no decoration that doesn't carry
signal. The V6 work is documented in three reference files in the
repo root (\`PORTFOLYO_V6_UI_AUDIT.md\`, \`PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md\`,
\`PORTFOLYO_V6_UI_FUTURE_SYSTEMS.md\`) — if a visitor asks for the
audit document specifically, those are the canonical paths.
`;
}
