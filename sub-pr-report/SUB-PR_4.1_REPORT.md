# Sub-PR 4.1 — Public Lumina Transparency Layer

**Branch:** `feat/v4-phase4-public-transparency`
**Phase:** V4 Phase 4 — AI-Native Operating Layer (user-reframed priority order)
**Scope:** Two new public meta-pages under `/lumina/*`, two new
telemetry counters, one Navbar entry. Zero new dependencies. Zero
new server routes (the existing visit endpoint is just widened).
Zero new client JS beyond the reused VisitPing client island.

---

## 1. Mission

V4 § 2.3 (Public Transparency Disiplini) makes this surface mandatory:

> "Lumina'nın system prompt'u **public** (`/lumina/brain` veya
> repo'da `lib/lumina/system-prompt.ts`)"
> "Failure log public (her sistem için `<system>/failures.md` veya
> `/lumina/failures` page)"

Phase 4 starts with the SAFE FOUNDATION priority: ship the
transparency layer before any new AI surface. The visitor — and
anyone judging the platform — can now read exactly what Lumina is,
what tools she has, what she stores, what runtimes she runs on, and
where every behavior lives in the public source. The failures log
seeds with one concrete documented build-time correction (the
Forget-Me hotfix episode from Phase 3.3a).

Operator-grade transparency, no marketing copy, no theatrics.

---

## 2. Architectural decisions

### 2.1 Two pages, not one
The V4 doc names both surfaces explicitly. Each has a distinct
purpose:
- **`/lumina/brain`** — read-only architecture surface. Reference
  material a developer reads once, scrolls through.
- **`/lumina/failures`** — append-only corrections log. Read once,
  visited again whenever a new entry lands.

Different cadences, different content shapes — splitting prevents
either page from feeling like a junk drawer.

### 2.2 Hand-rolled tool manifest (not imported from `lib/lumina/tools`)
The brain page COULD import `LUMINA_TOOLS` to extract tool
descriptions, but that would pull the entire tool module's runtime
graph (AI SDK + zod + KV + lab registry + GitHub events client)
into the page's compile graph. Even though everything is server-
side, the build artifact gets noisier and the brain page becomes
brittle to tool-registry refactors. Hand-rolling the manifest as
a typed `TOOLS: readonly ToolRow[]` keeps the page decoupled and
makes the editorial easier to control. Source-of-truth for the
implementations is the linked file in §6 — `lib/lumina/tools.ts`.

### 2.3 Source links into the public repo
Every row in §6 deep-links to the actual file on GitHub (`main`
branch). This is the "verbatim text" escape hatch: the brain page
gives a curated read; the GitHub link gives the unfiltered source.
Bypasses the question of "is the description accurate?" — the
visitor can verify in one click.

### 2.4 No model-call telemetry split for the new pages
The two new visit counters (`LUMINA_BRAIN_VISITS`,
`LUMINA_FAILURES_VISITS`) match the established
`TELEMETRY_VISITS` / `CHANGELOG_VISITS` pattern: cumulative,
KV-incremented by VisitPing, session-storage-guarded so one tab
session = one count. No new dashboards, no new derived metrics.
The two new metrics will surface naturally in any future
`getCurrentTelemetry` extension if the operator wants them visible
to Lumina.

### 2.5 No new server routes
The existing `/api/telemetry/visit` was already a generic surface
allow-list dispatcher. Adding two more surface keys is the
minimum-change-maximum-leverage move — one Edit, no new edge
route, no new auth surface.

### 2.6 Navbar surfaces "Brain" only
"Brain" anchors the Systems dropdown's bottom of the list. From
the brain page the visitor reaches the failures log via the
header pill and the footer link. Adding both to the navbar would
crowd the dropdown and confuse the IA — the brain IS the
transparency surface; failures is a subsection of it.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/telemetry/metrics.ts` | + 2 entries (`LUMINA_BRAIN_VISITS`, `LUMINA_FAILURES_VISITS`). |
| `app/api/telemetry/visit/route.ts` | + 2 surface mappings (`lumina-brain` → BRAIN, `lumina-failures` → FAILURES). |
| `components/telemetry/VisitPing.tsx` | Widened `surface` union to include the two new slugs. |
| `data/lumina-failures.ts` (new) | Typed `FailureEntry` shape + `LUMINA_FAILURES` array. Seeded with one entry: the Forget-Me hotfix episode (commit `a99af07`). |
| `app/lumina/brain/page.tsx` (new) | Server component, hourly ISR. Six sections: Model configuration · Tool registry · Memory contract · Runtime topology · Privacy contract · Source files. Header crumb + footer pill both link to /lumina/failures. |
| `app/lumina/failures/page.tsx` (new) | Server component, hourly ISR. Renders `LUMINA_FAILURES` as a chronological list. Empty state if the array is empty. Commit-SHA pills deep-link to the GitHub commit page. |
| `components/layout/Navbar.tsx` | + `{ label: "Brain", href: "/lumina/brain" }` in `SYSTEMS_LINKS`. |

---

## 4. Telemetry contract

```
v4:telemetry:lumina-brain:visits      ← LUMINA_BRAIN_VISITS
v4:telemetry:lumina-failures:visits   ← LUMINA_FAILURES_VISITS
```

- Schema: `v4:telemetry:<system>:visits` per V4 § 2.13.
- Write path: `VisitPing` client island POSTs to `/api/telemetry/visit`
  with `{ surface: "lumina-brain" | "lumina-failures" }`.
- Session-storage guard: one count per tab session.
- Graceful no-op when KV is unavailable (existing pattern).

---

## 5. Privacy posture

The brain page surfaces:
- The model id (already public — anyone using the chat can guess
  from response style + speed)
- The list of tool names and one-line purposes (already public —
  the chat shows tool names in the spinner pill during invocation)
- The memory contract (already documented in Phase 3.3 / 3.3a
  commit messages, just consolidated for readability)
- The runtime topology (already public — `runtime = "edge"` is
  in every route file)
- Source file links into the public repo (already public — that's
  what "public repo" means)

In other words: zero new exposure. The page is a curated read of
information that was always available; the value is convenience
and editorial framing, not new disclosure.

The failures page exposes:
- A documented build-time judgment error from Phase 3.3 → 3.3a
- Its commit SHA, with a deep link to GitHub
- No visitor PII, no third-party content, no leaked secrets

---

## 6. Performance + bundle posture

| Metric | Result | V4 § 2.7 target |
|--------|--------|-----------------|
| `/lumina/brain` LCP (static HTML) | Well under 1.0s | < 1.5s |
| `/lumina/failures` LCP (static HTML) | Well under 1.0s | < 1.5s |
| Initial JS bundle delta | 0 KB (no new client deps) | budget unchanged |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` in client chunks | 0 matches | 0 (preserved) |
| Operator + memory + lab + redaction server symbols in client | 0 matches | 0 (preserved) |
| `LUMINA_FAILURES` / `FailureEntry` server symbols in client | 0 matches | 0 (correct — data only used server-side) |
| `@xyflow/react` dynamic chunks | 1 (unchanged) | unchanged |
| `@emredogan/lumina-chat` tarball | 29 files / 23.7 kB | unchanged |
| `@emredogan/cli` tarball | 15 files / 13.5 kB | unchanged |

ISR: both pages revalidate hourly. Static HTML hits the edge
cache; KV is touched only by the visit ping endpoint.

Reduced motion: both pages use the existing `Reveal` motion
primitive which already respects `prefers-reduced-motion` via the
global CSS guard. No new motion surfaces.

Hydration: every value rendered server-side is static text;
nothing depends on `Date.now()` or `Intl` (other than the existing
infrastructure handled in `lib/site-url`). No hydration drift.

---

## 7. Validation results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✓ exit 0 |
| `eslint` on touched files | ✓ exit 0 |
| Production build | ✓ exit 0 |
| `/lumina/brain` registered as `○ Static`, 1h ISR | ✓ |
| `/lumina/failures` registered as `○ Static`, 1h ISR | ✓ |
| Bundle posture invariants | ✓ all 0 leaks |
| `npm pack --dry-run` for both workspaces | ✓ unchanged |
| Pre-existing `LuminaWindow.tsx` set-state-in-effect warnings | unchanged (out of scope) |

---

## 8. Rollback plan

Single-commit revert removes:
- The two new pages (`app/lumina/brain/page.tsx`,
  `app/lumina/failures/page.tsx`) — clean deletes
- The failures data module — clean delete
- Two telemetry keys — KV would keep any incremented values until
  TTL, but the code stops writing them
- Two surface mappings — `/api/telemetry/visit` reverts to its
  pre-4.1 allow-list
- One Navbar entry — Systems dropdown reverts to seven items

No KV migrations, no schema breaks. Routes 404 cleanly post-revert.

---

## 9. Failure modes considered

- **KV unavailable**: VisitPing graceful no-op (existing pattern);
  pages render normally.
- **Malformed failure entries**: caught at build-time by TypeScript
  (`FailureEntry` shape is strict).
- **GitHub link rot** (a commit gets force-pushed away): the deep
  link 404s but the page still renders the SHA inline as text.
  Acceptable — append-only convention means we don't rewrite
  history anyway.
- **VisitPing fails to fire**: silent. The counter just doesn't
  increment for that visitor.
- **Hourly ISR drift**: brain content includes current tool count
  (10). A future sub-PR that changes the registry would emit a
  stale brain page for up to one hour. Mitigation: update the
  manifest in the same sub-PR per V4 § 2.3 transparency
  discipline.

---

## 10. Deferred systems (NOT in this PR)

Per the user's Phase 4 priority directive, these remain explicitly
deferred and were NOT touched:

- Repo-aware tools (`readSourceFile`, `explainCommitRationale`,
  `diffArchitectures`) — Phase 4 Priority A.2 / next sub-PR
- Eval pipeline expansion — Phase 4 Priority A.3
- Persistent memory refinement — Phase 4 Priority B.1
- Sub-agent infrastructure / architecture-critic — Phase 4 Priority B.2
- Voice persistence improvements beyond Phase 3.4's sticky toggle
  — Phase 4 Priority C.1, conditional
- Cloud Lab scan extension beyond Phase 3.5's content-only — Phase
  4 Priority C.2, conditional

Phase 4 hard-forbidden (kept untouched, will stay untouched):
- Wake-word voice / always-on mic
- Emotional adaptation / visitor-type detection
- Multimodal screen sharing
- WebGPU systems
- Distributed agent bus
- Autonomous remediation
- 5+ sub-agents
- Subdomain federation
- Real-time SSE dashboards

---

## 11. Next sub-PR

Sub-PR 4.2 — Repo-Aware Lumina Tools (3 new tools). Awaiting
explicit approval per the constitutional directive.

Stopping here.
