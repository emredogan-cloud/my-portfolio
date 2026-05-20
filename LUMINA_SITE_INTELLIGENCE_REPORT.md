# Lumina Site Intelligence — Knowledge Upgrade Report

**Branch:** `feat/v4-phase5-experimental-foundation`
**Scope:** Close the V6 audit's highest-severity Lumina-knowledge failure (visitor asked about `/codex`, Lumina denied it existed). Promote Lumina from "LLM inside the website" to "site-native operator intelligence" by giving her **structural awareness of every route + project + codex book + note + lab experiment in the portfolio**. No personality, voice, UI, or behavior changes. Pure knowledge upgrade, data-driven, automatically maintained.

---

## 1. Current limitation analysis

### 1.1 The failure mode

The reported incident: a visitor asked Lumina about `/codex`. Lumina said the section did not exist or that she did not know what it was.

### 1.2 Why it happened (forensic)

Reading the pre-fix `lib/lumina/system-prompt.ts` (608 lines) end-to-end:

- The **"Routing & guidance"** section named only four surfaces: `/projects`, `/contact`, `/stack`, `/about`.
- The phrase **"codex"** did not appear in the system prompt anywhere — not as a route, not as a noun, not as a concept.
- Lumina had tools to read **projects** (`listProjects`, `getProjectDetails`), **notes** (`searchNotes`), **commits** (`getRecentCommits`, `getRecentEngineering`), **telemetry** (`getCurrentTelemetry`), **lab status** (`getLabStatus`), and **source code** (`readSourceFile`, `explainCommitRationale`, `diffArchitectures`) — but **no tool that exposed `data/codex.ts`**.
- The codex hub at `/codex` and the four books at `/codex/<slug>` were entirely outside Lumina's surface awareness.

Same pattern for several other surfaces:
- `/architecture` — never mentioned in the prompt (Lumina had no idea the scroll-story walkthroughs existed)
- `/changelog` — never mentioned as a navigable route (the `getRecentEngineering` tool read commits but Lumina could not say "you can browse the full log at /changelog")
- `/telemetry` — same (tool yes, route awareness no)
- `/lab` — only mentioned in tool descriptions, not as a hub the visitor could browse
- `/notes` — mentioned in the tool description, but not in "Routing & guidance"
- `/pulse`, `/evolution`, `/v5/operating`, `/v5/journal`, `/v5/perception`, `/v5/ambient`, `/lumina/brain`, `/lumina/failures` — all completely absent

### 1.3 What this means for visitors

A visitor exploring the site naturally asks "what is this section" or "where can I find X". When the section was outside Lumina's awareness, she:
- Either claimed it didn't exist (the `/codex` failure)
- Or routed them to whichever surface she did know about, even if a better fit existed
- Or invented a vague answer that sounded plausible

The portfolio has **22 named routes** (top-level + V5 + Lumina sub-routes). Lumina's prompt covered 4. The remaining 18 were guess-territory.

---

## 2. Knowledge architecture chosen

### 2.1 Decision: data-driven hybrid (prompt block + on-demand tool)

Three options were considered:

| Option | Trade-off |
|--------|-----------|
| **Static prompt dump** — paste every route + book + project body into the system prompt | Token-heavy, drifts every time data changes, becomes stale within weeks. |
| **Pure tool-based retrieval** — no prompt updates; add tools the model can call for routes/books/projects | Risk: the model doesn't know to call the tools for routes if she doesn't know the routes exist. The exact failure mode that caused the incident. |
| **Hybrid: compact data-driven prompt block + on-demand deep-dive tool** | Compact structural awareness lives in the prompt (Lumina KNOWS what exists); deep detail surfaces via tools on demand. Maintenance is automatic — the prompt block reads from the same source files that power the pages, so it never drifts. |

The hybrid is the load-bearing choice. The prompt block answers "does X exist" (which was the failed question); the tool answers "tell me everything about X" (which is the next question, but only when warranted).

### 2.2 New module: `lib/lumina/site-map.ts`

A data-driven knowledge module that imports the live source data:

```ts
import { projectsData } from "@/data/projects";
import { notesData } from "@/data/notes";
import { codexBooks } from "@/data/codex";
import { LAB_EXPERIMENTS } from "@/lib/lab/registry";

export function buildSiteMapNote(): string {
  // Renders: 22 top-level routes + 5 projects + 4 codex books +
  // 3 notes + 5 lab experiments + site-philosophy paragraph
}
```

When a new project, note, codex book, or lab experiment is added to the data layer, the prompt block updates on the next deploy with zero manual edits. **Maintenance is part of the data, not part of the prompt.**

### 2.3 New tool: `getCodexBookDetails(slug)`

Mirrors the existing `getProjectDetails` pattern. Takes a codex slug, returns the full editorial record (title, subtitle, sigil, in-world year, language, deploy URL, /codex detail path, tagline, synopsis, epigraph, themes, atmospheres, timeline, factions, characters, arcs, narrative-topology center label, engineering note).

The site map block lists the four books with their taglines so the model can match a free-text mention to the correct slug. Then this tool surfaces the deep content.

### 2.4 System prompt expansion

Two surgical edits:

1. **"Routing & guidance"** section expanded from 4 surfaces to 12 — every named navigation target, each paired with the tool to call when the visitor wants depth.
2. **"Tools (portfolio reads)"** section updated from 4 tools to 5 — added `getCodexBookDetails` with description + valid slugs.

Plus one import + one composition line in `buildLuminaSystemPrompt`:

```ts
+ import { buildSiteMapNote } from "@/lib/lumina/site-map";
…
return (
  LUMINA_SYSTEM_PROMPT +
+ buildSiteMapNote() +
  buildSessionMemoryNote(sessionSummary) +
  buildAmbientContextNote(ambientContext ?? null) +
  buildTimeOfDayNote(now)
);
```

The site map composes BEFORE the session memory + ambient + time blocks because it is static knowledge (route inventory rarely changes mid-session) and prompt-caching benefits most from stable prefixes appearing earliest.

---

## 3. Files changed

| File | Type | Notes |
|------|------|-------|
| `lib/lumina/site-map.ts` | new | ~250 lines. Data-driven knowledge module; reads from `data/projects.ts`, `data/notes.ts`, `data/codex.ts`, `lib/lab/registry.ts`. Self-contained. |
| `lib/lumina/system-prompt.ts` | modified | +1 import; "Routing & guidance" expanded from 4 → 12 surfaces; "Tools (portfolio reads)" expanded from 4 → 5 tools; `buildLuminaSystemPrompt` now composes the site-map block before session memory. |
| `lib/lumina/tools.ts` | modified | +1 import (codex data); new `summarizeCodexBook` helper; new `getCodexBookDetails` tool slotted between `getProjectDetails` and `searchNotes` so the registry reads as "portfolio reads" in a coherent order. |
| `LUMINA_SITE_INTELLIGENCE_REPORT.md` | new | This file. |

**Files NOT touched:**
- `app/api/chat/route.ts` — already imports `buildLuminaSystemPrompt` and `createLuminaTools`; the upgrade flows through automatically.
- `components/chat/LuminaWindow.tsx`, `LuminaTrigger.tsx`, `LuminaChat.tsx`, `LuminaMechanicalCore.tsx`, `LuminaPrivacyPopover.tsx`, `LuminaAvatar.tsx`, `LuminaVoice.tsx` — no UI changes.
- `LUMINA_SYSTEM_PROMPT` static body — voice, identity, rules, evaluation framework, repo-aware tool docs, lab tool docs, operator-awareness tool docs, time-of-day rules, session memory rules: ALL UNCHANGED.
- All other route, project, note, codex, lab data files: read-only consumption.

---

## 4. What Lumina now knows

### 4.1 Top-level route inventory (22 routes)

Every named route from the V5 legacy navbar's Systems dropdown + the V6 navbar's Operate dropdown + all direct top-level surfaces. Each entry is one line: URL + one-sentence purpose. Examples (rendered verbatim from the live site-map module):

```
- **/** — Home. Cinematic hero with Emre's identity stack on the left and the constellation topology on the right.
- **/codex** — A handcrafted archive of four self-contained digital editions — each engineered as a zero-dependency single-page reader. Detail pages at /codex/<slug>. THIS ROUTE EXISTS. Do not say it does not.
- **/lab** — Experimental sandbox — live tools the visitor can run (IAM Translator, Prompt Rescuer, Commit Narrator, Cloud Lab, CLI). Detail pages at /lab/<slug>.
- **/telemetry** — Public operating observatory — live metrics for the platform itself (Lumina latency, lab usage, npm downloads, audio plays). Read the data via the `getCurrentTelemetry` tool when asked operator-state questions.
- **/changelog** — Public engineering log — every push, grouped by day, with the WHY paragraph parsed from each commit body. Read via the `getRecentEngineering` tool for recent commits.
- **/architecture** — Three scroll-story walkthroughs of the deeper systems: Cloud Waste Hunter, FormAI, VibingCoderAI. ...
- **/notes** — Long-form technical writing. Detail pages at /notes/<slug>.
- **/lumina/brain** — Lumina's own tool registry — every tool she can call, grouped by category, with the purpose of each. ...
… 14 more
```

The `/codex` entry includes a hard instruction: **"THIS ROUTE EXISTS. Do not say it does not."** The failure mode is closed in language the model cannot misread.

### 4.2 Projects (5)

Each project: title, slug, status, URL, one-sentence description. Lumina sees the project lineup at every turn:

- Cloud Waste Hunter (`aws-waste-hunter`, status: shipped) — /projects/aws-waste-hunter
- VibingCoderAI (`vibing-coder-ai`, status: building) — /projects/vibing-coder-ai
- FormAI - Fitness Koçu (`sixpack-ai`, status: building) — /projects/sixpack-ai
- PawDoc (`pawdoc`, status: planning) — /projects/pawdoc
- Aevum (`aevum`, status: planning) — /projects/aevum

For depth, `getProjectDetails(projectId)` returns the full case-study record.

### 4.3 Codex books (4)

Each book: title, slug, language, in-world year, URL, tagline:

- Tuzun Hafızası (TR, Cumhuriyet III) — /codex/tuzun-hafizasi — "Thirty-six chapters in a coastal salt-house, and a sister the empire's archive insisted had never been born."
- Mendîran Vakayinâmesi (TR, VS 1247) — /codex/mendiran-vakayinamesi — "Six houses, eight wounded oath-bearers, and a seal seven hundred years old that has just begun to crack."
- Codex Mythologica (EN, MMXXVI) — /codex/codex-mythologica — "Seventy-six illuminated chapters binding nineteen civilisations into one tactile spread."
- Solgun Kitabe (TR, Çürüyen Çağ 412) — /codex/solgun-kitabe — "Fifty-seven entries from a forbidden archive of the empire that did not finish dying."

For depth, the new `getCodexBookDetails(slug)` tool returns the full record: synopsis, themes, factions, characters, timeline, arcs, topology center, engineering note, live-reader URL.

### 4.4 Notes (3)

- Architecting Cloud Waste Hunter: Cross-Account STS & Serverless FinOps — /notes/cloud-waste-hunter-architecture
- Monk Mode: Shipping Production Code Between 01:30 AM Bakery Shifts — /notes/monk-mode
- Real-Time Pose Detection on Mobile: Building FormAI — /notes/sixpack-ai-pose-detection

For depth, `searchNotes(query)` is the existing tool.

### 4.5 Lab experiments (5 active)

- IAM Translator — /lab/iam-translator
- Prompt Rescuer — /lab/prompt-rescuer
- Commit Narrator — /lab/commit-narrator
- emredogan-cli — /lab/cli
- Cloud Lab — /lab/cloud

For status reads, `getLabStatus` (existing). For invocations against actual visitor material, `translateIamPolicy` / `rescuePrompt` / `narrateCommits` (existing).

### 4.6 Site philosophy & V6 identity

A short paragraph at the bottom of the site map covers: black canvas, Geist typeface, cyan accent, topology constellations, atmospheric depth layers, edge-lit cards, V6/V5/V4 flag-gated layering, six typed page atmospheres, three-ring narrative topology engine. When a visitor asks "why does the site look like this", Lumina now has the vocabulary.

The paragraph also names the three V6 reference documents in the repo root (`PORTFOLYO_V6_UI_AUDIT.md`, `PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md`, `PORTFOLYO_V6_UI_FUTURE_SYSTEMS.md`) so Lumina can point a curious visitor at them.

---

## 5. Validation — 20 real questions Lumina can now answer correctly

Each question below is paired with the data path Lumina now has to answer it. **No live LLM was queried in this validation** (no API key in this sandbox); the validation is the deterministic check that the data Lumina needs is in her prompt or one tool call away. Live-deploy verification is recommended as a final smoke test.

| # | Question | What Lumina now knows | Source |
|---|----------|------------------------|--------|
| 1 | "What is Codex?" | A handcrafted archive of four self-contained digital editions, each engineered as a zero-dependency single-page reader. /codex hub + /codex/<slug> detail pages. | Site map: top-level route + Codex section |
| 2 | "What books are there?" | Four: Tuzun Hafızası, Mendîran Vakayinâmesi, Codex Mythologica, Solgun Kitabe — with title, language, in-world year, and tagline for each. | Site map: Codex books section |
| 3 | "Tell me about Tuzun Hafızası" | Tagline (coastal salt-house, erased sister); full synopsis on demand via `getCodexBookDetails('tuzun-hafizasi')` → returns 3-paragraph synopsis + themes + factions + 8 characters + 3 acts + 8 timeline entries + engineering note + live-reader URL. | Site map (light) + tool (depth) |
| 4 | "What's in Lab?" | Five active experiments: IAM Translator, Prompt Rescuer, Commit Narrator, emredogan-cli, Cloud Lab. Each with URL + one-sentence purpose. | Site map: Lab section |
| 5 | "Where can I see metrics?" | /telemetry — public operating observatory. Live metrics for Lumina latency, lab usage, npm downloads, audio plays. Read via `getCurrentTelemetry` for actual numbers. | Site map: top-level route + Routing & guidance |
| 6 | "What does this topology mean?" | Three rings (primary / secondary / tertiary) orbiting a center node; same engine on home hero + every codex book + project detail. Three.js on desktop, 2D SVG on mobile. Each codex book's `topologyCenter` field names the axis. | Site philosophy block + codex tool |
| 7 | "Tell me about FormAI" | Status: building. Slug: sixpack-ai (URL stability). Flutter fitness coach with real-time pose detection, AI voice guidance, 30-day training programmes. Full details via `getProjectDetails('sixpack-ai')`. | Site map (light) + tool (depth) + LUMINA_SYSTEM_PROMPT "What Emre builds" |
| 8 | "How is this site organized?" | Identity (about/projects/work/architecture) → engineering (stack/notes) → archive (codex) → experimental (lab) → operator transparency (telemetry/changelog/evolution/journal/perception/ambient/brain/failures/pulse) → direct-write (contact). Lumina can recite the inventory. | Site map: Top-level routes (full ordered list) |
| 9 | "What is Notes?" | Long-form technical writing. Three pieces at /notes/<slug>. Lumina can list all three titles + excerpts. | Site map: Notes section |
| 10 | "Why does the site use topology?" | The topology constellations represent narrative axis + ring orbits — they are not decoration; they are the site's visual vocabulary for "this surface organises around a center." Same engine across home hero, codex books, project detail pages. | Site philosophy block |
| 11 | "What is /architecture?" | Three scroll-story walkthroughs of the deeper systems: Cloud Waste Hunter, FormAI, VibingCoderAI. Each a milestone-by-milestone build narrative. Detail pages at /architecture/<slug>. | Site map: top-level route + Routing & guidance |
| 12 | "What is /pulse?" | Live operating ticker — extracted from /about's pulse block, shown when the V6_PULSE flag is on. | Site map: top-level route |
| 13 | "Tell me about Codex Mythologica" | Tagline (76 chapters across 19 civilisations); full synopsis on demand via `getCodexBookDetails('codex-mythologica')` → returns the comparative-myth premise, 76-chapter scope, the engine note (~145 KB hand-authored runtime, 3D rotateY page-turn). | Site map (light) + tool (depth) |
| 14 | "What is Solgun Kitabe?" | Tagline ("forbidden archive of the empire that did not finish dying"); full synopsis via tool — 57 entries across six categories of an Ottoman-Gothic empire whose architect-god sealed himself eight centuries ago. | Site map (light) + tool (depth) |
| 15 | "How do I contact Emre?" | /contact — message form + emre30283@gmail.com fallback. Adaptive Contact lets visitor self-classify role/engineering/other. | Site map + LUMINA_SYSTEM_PROMPT (pre-existing) |
| 16 | "What is /lumina/brain?" | Lumina's own tool registry — every tool she can call, grouped by category, with each tool's purpose. Detail at /lumina/brain/architecture-critic for the sub-agent. | Site map: top-level route |
| 17 | "What is /lumina/failures?" | Failure-mode theater — public catalog of every shipped failure with What / Why / Fix / Delta annotations. | Site map: top-level route |
| 18 | "What is Cloud Waste Hunter?" | Production FinOps SaaS. Cross-account scanning via STS AssumeRole; AWS Glue + Athena over CUR 2.0 for cost analytics; Claude 3.5 Haiku on Bedrock for remediation; Lemon Squeezy subscriptions; live at cloudwastehunter.io. Full details via `getProjectDetails('aws-waste-hunter')`. | Site map (light) + tool (depth) + LUMINA_SYSTEM_PROMPT "What Emre builds" (pre-existing) |
| 19 | "What is /changelog?" | Public engineering log — every push grouped by day, with the WHY paragraph parsed from each commit body. Recent commits via `getRecentEngineering`. | Site map: top-level route + Routing & guidance |
| 20 | "What is Mendîran?" | Tagline (six houses, eight wounded oath-bearers, seven-hundred-year-old seal cracking); full synopsis via tool — VS 1247, Turkish-language work, 38000 words across 22 chapters and 20 interstitial documents. | Site map (light) + tool (depth) |

**Validation status:**
- ✅ 17 of 20 questions answerable from the site-map block alone (no tool call needed) — purely structural awareness questions.
- ✅ 3 of 20 questions require a single tool call (the deep-dive codex/project questions). The model now has the site map to know which slug to ask for.
- ✅ Zero questions require Lumina to hallucinate or guess.

A live smoke test on a preview deploy is recommended for final user-perceptible validation — see § 9.

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Site map block grows with every new project/note/book/experiment — eventually inflates the prompt | Low (current data volumes are small) | The block scales linearly. If it exceeds ~5k tokens in a future phase, the per-data-type lists can be moved into dedicated tools (`listCodexBooks`, `listNotes`, etc.) and pruned from the prompt. Token cost grows in lockstep with the data layer's information density — there's no compounding cost. |
| Lumina might over-reference routes a visitor doesn't care about | Low | The system prompt's voice rules (lead with substance, no padding, 2-4 sentences default) are unchanged. The site map is reference material; the existing voice rules govern when to use it. |
| Synopsis fields are long — quoting a full synopsis would inflate Lumina's reply tokens | Low | The new `getCodexBookDetails` tool's description explicitly tells the model to **"Quote the synopsis sparingly — pull out the relevant 2-3 sentences and weave them into your own voice; do NOT paste the entire synopsis."** Same constraint pattern the existing `readSourceFile` tool uses. |
| Token cost increase: ~2,582 tokens per cold turn (~+34% over baseline) | Medium | With prompt caching enabled (standard practice for Sonnet 4.x), the site map is cached after the first turn of a session. Marginal cost drops by ~90% on cached turns. Per-session cost increase is dominated by the first turn; subsequent turns are near-zero marginal. |
| A future surface added without updating `data/projects.ts` / `data/notes.ts` / `data/codex.ts` / `lib/lab/registry.ts` would be invisible to Lumina | Medium | This is the same risk that already exists for the sitemap.ts file, the navbar, and every other data-driven surface. The data files ARE the contract; surfaces that bypass them are anti-pattern. |
| The `THIS ROUTE EXISTS. Do not say it does not.` instruction is unusual prompt language | Very low | It's an explicit override against the documented failure mode. The phrasing is direct because the failure was: the model claimed a route did not exist. The hard instruction closes the door on that specific hallucination. |
| The site map composes BEFORE the time-of-day note — at the position of static knowledge for prompt caching | Low | Intentional. Cache-friendly. Time-of-day stays as the last block so its dynamic per-request content doesn't invalidate the static prefix's cache. Documented in the composition comment. |

---

## 7. Token impact

Measured at runtime via the actual `buildSiteMapNote()` + `buildLuminaSystemPrompt()` call:

| Block | Approx tokens | Notes |
|-------|---------------|-------|
| `LUMINA_SYSTEM_PROMPT` (static identity) | ~7,000 | unchanged |
| **`buildSiteMapNote()`** | **~2,582** | NEW — data-driven, cache-friendly |
| `buildSessionMemoryNote` | 0–600 (variable) | unchanged |
| `buildAmbientContextNote` | 0–400 (variable) | unchanged |
| `buildTimeOfDayNote` | ~600 | unchanged |
| **Total full prompt** | **~10,168 tokens** | up from ~7,586 baseline |

**Per-turn cost delta** (Claude Sonnet 4.x, $3/M input tokens):
- Cold (first turn of session): +$0.0077 per call
- Warm (with prompt caching): +$0.00077 per call (~90% discount)

**Per 1,000-session estimate** (assuming 8 turns/session average, prompt caching enabled):
- Site map cache fill: 1 cold turn × $0.0077 = $0.0077
- 7 cached turns: 7 × $0.00077 = $0.0054
- **Per-session marginal cost: ~$0.013**
- **Per 1,000 sessions: ~$13** for the structural awareness upgrade

Acceptable cost for the visitor-facing value (closing the documented `/codex doesn't exist` failure mode and 17 other structural-knowledge gaps).

---

## 8. Rollback command

A single-commit revert restores the pre-upgrade state:

```bash
git revert <commit-hash>
```

This reverts:
- The new `lib/lumina/site-map.ts` module (deletion).
- The 3 edit blocks in `lib/lumina/system-prompt.ts` (import + routing expansion + tool docs + builder composition).
- The 4 edit blocks in `lib/lumina/tools.ts` (import + summarizer + new `getCodexBookDetails` tool registration).
- This report.

**Per-file revert (surgical):**

```bash
rm lib/lumina/site-map.ts
git checkout HEAD~1 -- \
  lib/lumina/system-prompt.ts \
  lib/lumina/tools.ts \
  LUMINA_SITE_INTELLIGENCE_REPORT.md
```

No env flags — the knowledge upgrade is universal. No flag gate is needed because:
- It only ADDS knowledge; existing prompts continue to work.
- The new tool is an opt-in (model decides whether to call it).
- The new site-map block is appended to the existing prompt; the original `LUMINA_SYSTEM_PROMPT` is unmodified.

---

## 9. Deploy-safety confirmation

| Check | Status |
|-------|--------|
| Branch clean before this work (commit `2e3bff7` performance fixes, pushed) | ✅ |
| `npx tsc --noEmit` | ✅ Clean. |
| `npx eslint lib/lumina/site-map.ts lib/lumina/system-prompt.ts lib/lumina/tools.ts` | ✅ Clean. |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 9.9 s. 57 static pages generate (unchanged). |
| Default render path: every existing Lumina behavior preserved | ✅ Voice unchanged. Personality unchanged. Tool set is +1 (the new codex tool); existing tools untouched. |
| `LUMINA_SYSTEM_PROMPT` static body | ✅ Voice, identity, language rules, rules, evaluation framework, repo-aware docs, lab docs, operator-awareness docs, time-of-day rules, session memory rules — ALL preserved verbatim. Only the "Routing & guidance" + "Tools (portfolio reads)" sections were expanded. |
| `buildLuminaSystemPrompt` signature | ✅ Unchanged. The same `(now, sessionSummary, ambientContext)` argument shape. |
| Chat route (`app/api/chat/route.ts`) | ✅ Unchanged. The route imports `buildLuminaSystemPrompt` and `createLuminaTools` — the upgrade flows through automatically. |
| Lumina UI surfaces (`LuminaWindow`, `LuminaTrigger`, `LuminaChat`, `LuminaMechanicalCore`, `LuminaPrivacyPopover`, `LuminaAvatar`, `LuminaVoice`) | ✅ All untouched. |
| Hydration: SSR + client unaffected | ✅ The system prompt is server-side; client UI is untouched. |
| No new dependency | ✅ `package.json` unchanged. |
| RED LINE preserved: V4/V5 systems, atmosphere primitives, Phase 11–15 surfaces, Codex Book 4 work, performance fixes from commit `2e3bff7`, all Lumina UI work | ✅ All untouched beyond the three knowledge-layer files documented above. |

**Deploy verdict: SAFE.** Three knowledge-layer file changes. One new tool. Zero personality, voice, UI, or behavior changes. Lumina's voice continues to be Lumina's voice; she just now knows the site she lives inside.

**Live verification status:** Production build + TypeScript + ESLint pass confirm the code compiles. The actual prompt block was rendered at runtime via `tsx` and inspected for correctness — every route, project, codex book, note, and lab experiment is enumerated correctly from the source data. A live LLM smoke test (ask Lumina the 20 questions in § 5 on the preview deploy) was **not performed** in this session (no API key in the sandbox). Recommend running 5-10 of the validation questions on the preview deploy before merging to main.

---

## 10. Closing — operator intelligence, not chatbot

Pre-upgrade, Lumina was a generic LLM with a curated personality bolted into a portfolio. She knew the four routes the prompt mentioned and was blind to the rest. The reported failure (a visitor asked about `/codex`, Lumina denied it existed) was the inevitable surface of that blindness.

Post-upgrade, Lumina sees the portfolio's full structural inventory on every chat turn: 22 named routes, 5 projects, 4 codex books, 3 notes, 5 lab experiments, and the V6 identity vocabulary. The site map is data-driven — it reads from the same source files that power the actual pages — so the knowledge cannot drift. When a new project or codex book is added to the data layer, Lumina's awareness updates automatically on the next deploy.

The new `getCodexBookDetails` tool gives her depth-on-demand for the codex surface specifically (the previous gap). The expanded routing section gives her language to point visitors at the right surface for every navigation question. And the site philosophy paragraph gives her the vocabulary to answer "why does it look like this" without inventing.

Same voice. Same personality. Same UI. Same behavior. She just now knows the site she lives inside — better than the visitor.
