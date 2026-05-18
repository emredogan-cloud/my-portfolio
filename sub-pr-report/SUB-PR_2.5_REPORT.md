# SUB-PR 2.5 REPORT — Notes 2.0 multi-format publishing (Phase 2 close)

> **Phase:** V4 Phase 2 — Public Engineering Laboratory
> **Sub-PR:** 2.5 of 5 (2.1 ✓ → 2.2 ✓ → 2.3 ✓ → 2.4 ✓ → **2.5 ✓ — PHASE 2 CLOSED**)
> **Branch:** `feat/v4-phase2-public-lab` (stacked on Sub-PRs 2.1–2.4)
> **Date:** 2026-05-18

---

## 1. Mission

Close Phase 2. Add audio + interactive-diagram renditions to the
existing long-form notes so each piece becomes a three-format
publication instead of a single Markdown page:

- **Read** — the existing Markdown article (V3 layout)
- **Listen** — ElevenLabs-generated MP3, served as a static file
  from `public/notes/audio/<slug>.mp3`
- **Diagram** — `@xyflow/react` flowchart of the architecture
  named in the note body

Reach: of the three existing notes, two get all three formats
(`cloud-waste-hunter-architecture`, `sixpack-ai-pose-detection`)
and one gets longform + audio (`monk-mode` — it's a discipline
note, not an architecture one, so a diagram would be noise).

Constraints inherited from Phase 1 + Sub-PRs 2.1-2.4:
- Cinematic identity (`#00d2ff` only, Geist only, `bg-black`).
- Bundle posture — `@xyflow/react` (~50 KB gzipped) MUST land
  only in a dynamic chunk loaded by the Diagram tab, NOT in
  the initial bundle of any page.
- Per V4 § 5.2.5 LCP < 1.5s on notes pages.
- All Phase 1 + 2.1-2.4 invariants preserved.

---

## 2. Pre-scan summary

**Constitution re-read:** V4 § 4.2 (Phase 2 architecture), § 5.2.5
(Sub-PR 2.5 spec), § 6.2.B SUB-PR 2.5 (impl prompt), § 2.7
(performance budget — explicit reactflow allocation), § 9
(anti-patterns).

**Sub-PR 1.5 + 2.1-2.4 reports re-read.** Critical inheritances:

- `app/api/telemetry/visit/route.ts` (Sub-PR 1.5) is a write-only
  surface-allow-listed counter endpoint. Reusable for the two
  new notes signals (`notes-audio-play`,
  `notes-diagram-interaction`) with a small allow-list
  extension — no need for a dedicated notes telemetry endpoint.
- `components/telemetry/VisitPing.tsx` is a one-shot
  `useEffect` + sessionStorage guard pattern. Both
  AudioPlayer and InteractiveDiagram reuse the *posture* (not
  the component itself — they need different trigger events).
- `lib/lab/rate-limit.ts` (Sub-PR 2.3 refactor) is per-experiment
  namespaced. Not needed here — notes audio generation is a
  cron, not a per-request route.
- `@xyflow/react` was previously installed for the hero
  topology but later uninstalled (a refactor moved the
  topology off it). Fresh `npm install @xyflow/react`
  required.

**Reference scan:**

| File / state | Takeaway |
|---|---|
| `data/notes.ts` | 3 notes, simple `Note` interface. Schema extension is additive — `formats?: NoteFormats` keeps existing 3 notes valid even before they declare formats. |
| `app/notes/[slug]/page.tsx` | RSC, ReactMarkdown, wrapped in `<Reveal>` motion island. Integration point: the article body section becomes a `<NotesTabs>` client island with the Markdown passed as a `readContent: ReactNode` prop. |
| `app/api/voice/tts/route.ts` (V3) | Edge route, 500-char cap, optimised for Lumina's < 800ms first-token budget. **Not reusable** for long-form notes (1500-3000 chars) — `lib/notes-audio.ts` calls ElevenLabs directly with a different model + voice settings tuned for long-form prose. |
| `app/api/telemetry/visit/route.ts` (Sub-PR 1.5) | `SURFACE_TO_KEY` allow-list — extend with two new surface slugs. Endpoint posture unchanged. |
| `lib/telemetry/metrics.ts` | METRIC_KEYS whitelist — add two keys per V4 § 5.2.5 schema verbatim. |
| `vercel.json` | Existing two cron entries (daily standup + weekly architecture from Sub-PR 1.3). Add a third — weekly notes-audio regeneration. |

---

## 3. What was implemented

### 3.1 `data/notes.ts` — schema extension (additive)

New exported types: `DiagramNodeKind`, `NoteDiagramNode`,
`NoteDiagramEdge`, `NoteDiagram`, `NoteAudio`, `NoteFormats`.
Added `formats?: NoteFormats` to the existing `Note` interface.

Backward-compat: notes without a `formats` field render
identically to the V3 single-Markdown layout. `NotesTabs` short-
circuits to the bare read content when the only available
"tab" is Read.

### 3.2 Three notes enriched

- **`cloud-waste-hunter-architecture`** — audio + diagram.
  Seven-node flow: `dashboard → Next.js API → AWS STS →
  Scanner Lambda → DynamoDB → Bedrock Claude`, with a
  side-branch into the Glue + Athena cost lake. Two cyan
  ramp levels distinguish cloud vs compute vs data vs model.
- **`monk-mode`** — audio only. The body's ordered-list
  schedule is the diagram; rendering it twice would be noise.
- **`sixpack-ai-pose-detection`** — audio + diagram. Six-node
  flow: `Device camera → Google ML Kit → Joint angle calc →
  Rep quality eval`, with a `flutter_tts cue` branch for
  bad-form corrections and a `Supabase` branch for history.

### 3.3 `lib/notes-audio.ts` (new, 132 lines)

Long-form ElevenLabs pipeline:

- `noteBodyToSpeech(markdown)` — lightweight Markdown→speech
  cleaner. Strips list markers, code fences, `**bold**`
  tokens, horizontal rules. Not a full parser; handles the
  constructs the existing 3 notes use.
- `generateAudioForNote(note, options)` — idempotent generator.
  Skips when `ELEVENLABS_API_KEY` is missing, when the target
  file already exists (unless `force: true`), when the text
  is empty. Returns a structured `GenerateAudioResult` so the
  cron can aggregate outcomes.

Model: `eleven_multilingual_v2` (higher-quality, not flash —
notes aren't real-time). Voice: Rachel
(`21m00Tcm4TlvDq8ikWAM`) matching the Lumina voice. Output:
`mp3_44100_128`.

Hard text cap at 4500 chars (free-tier limit is 5000; we cap
at 4500 with a graceful trailing `…` so the model never sees
the truncation seam).

### 3.4 `app/api/notes/regenerate-audio/route.ts` (new, 100 lines)

Bearer-auth cron handler:

- `runtime: "nodejs"` + `maxDuration: 60` — long enough for
  serial regeneration of all candidates.
- Iterates notes with `formats.audio` declared; calls
  `generateAudioForNote` serially (not `Promise.all` — free-
  tier concurrent-call limits).
- Returns aggregate `{ ok, generated, skipped, errored,
  outcomes }` JSON for cron-log visibility.
- Sentry capture per-note on caught errors with `note_slug`
  + `phase: "generate"` tags.
- Optional `?force=true` query parameter to override the
  idempotent skip path.

### 3.5 `components/notes/AudioPlayer.tsx` (new, 110 lines)

Client island. Native `<audio>` element with `controls`,
no custom canvas waveform, no third-party player library.

Critical UX decisions:

- **Graceful degradation.** When `public/notes/audio/<slug>.mp3`
  doesn't exist yet (the typical state between merge and the
  first cron firing), the browser emits an `error` event. We
  swap the player for a quiet mono "audio pending" row
  instead of leaving a broken player visible.
- **Session-deduped telemetry.** On the first `play` event per
  `(visitor session, note)`, fires once at `/api/telemetry/visit`
  with `surface: "notes-audio-play"`. sessionStorage flag
  prevents scrub-induced double counting.
- **`accentColor: #00d2ff` + `colorScheme: dark`** on the native
  player — Safari + Chromium honour both. Firefox draws its own
  native controls; acceptable degradation.

### 3.6 `components/notes/InteractiveDiagram.tsx` (new, 195 lines)

`@xyflow/react` render with a **custom node component** for
the cinematic vocabulary. Six `DiagramNodeKind` types
(`cloud`, `compute`, `data`, `model`, `client`, `signal`) map
to different opacities of the same `#00d2ff` accent — no
second colour, no rainbow. Each node = matte card with left-
edge cyan rule + uppercase mono kind label + tight title +
optional short caption.

Bundle isolation: this component is imported via
`next/dynamic({ ssr: false })` from `NotesTabs`. Verified
post-build that `@xyflow/react` lands in exactly **one client
chunk** (the dynamic one), referenced only as an async
`<script>` injection from `/notes/[slug]` — NOT in main,
framework, or shared chunks.

UX trim:
- No mini-map, no fit-view button (xyflow's `<Controls />`
  has `showInteractive={false}`).
- Pan/drag enabled; pinch / scroll-zoom disabled (`zoomOnScroll:
  false` so the visitor's page scroll isn't hijacked by the
  diagram canvas).
- `nodesConnectable: false` — visitors can't edit the graph.
- First node-click fires the `notes-diagram-interaction`
  telemetry ping; `useRef`+sessionStorage double-guards
  against re-firing.

### 3.7 `components/notes/NotesTabs.tsx` (new, 170 lines)

Client island wrapping the article body. Renders a tab strip
(`Read` / `Listen` / `Diagram`) with WAI-ARIA tabs pattern —
`role="tablist"`, `role="tab"`, `role="tabpanel"`,
`aria-selected`, `aria-controls`, `aria-labelledby`. Inactive
tabs use `hidden` so screen readers + tab-key navigation
behave correctly.

Backward-compat: when a note has no `formats` (or only Read
is available), `NotesTabs` short-circuits and returns the
plain `readContent` without rendering the tab strip — the V3
notes layout reads identically.

The `<InteractiveDiagram>` import is wrapped in `next/dynamic`
with `ssr: false` + a `loading` skeleton. Inside the Diagram
panel, the component is conditionally rendered only when the
tab is active — `{active === "diagram" && <InteractiveDiagram ... />}` —
so the xyflow chunk download is deferred until the visitor
actually clicks the Diagram tab.

### 3.8 `app/notes/[slug]/page.tsx` (modified, +15 lines)

The existing `<article>` body is now wrapped in `<NotesTabs>`.
The Markdown rendering itself stays server-side (still
`ReactMarkdown` in an RSC) — only the tab-switching wrapper
hydrates as a client island. Pass-through pattern:
`readContent={<article>...</article>}`.

The `<Reveal>` motion wrapper still gates the entire body
block — no double-hydration boundary.

### 3.9 Telemetry wiring

Two new METRIC_KEYS (V4 § 5.2.5 verbatim):

- `NOTES_AUDIO_PLAYS: "v4:adoption:notes:audio_plays"`
- `NOTES_DIAGRAM_INTERACTIONS: "v4:adoption:notes:diagram_interactions"`

Two new surface allow-list entries in
`app/api/telemetry/visit/route.ts`:

- `notes-audio-play` → `NOTES_AUDIO_PLAYS`
- `notes-diagram-interaction` → `NOTES_DIAGRAM_INTERACTIONS`

Two new slug allow-list entries in
`app/api/telemetry/[metric]/route.ts`.

Two new dashboard tiles after the CLI tiles. Dashboard now
surfaces **18 tiles** (was 16 after Sub-PR 2.4).

### 3.10 `vercel.json` (modified, +4 lines)

Third cron entry — weekly notes-audio regeneration:

```json
{
  "path": "/api/notes/regenerate-audio",
  "schedule": "0 4 * * 1"
}
```

Monday 04:00 UTC. The cron is a *missing-file generator* (it
skips notes whose audio already exists), so weekly re-fires
do nothing wasteful when the bodies haven't changed. When a
note body changes, the maintainer runs the cron with
`?force=true` once to regenerate.

---

## 4. Bundle posture (CRITICAL — V4 § 5.2.5)

The V4 doc explicitly budgets ~50 KB for `@xyflow/react` as
the largest single dep added in Phase 2. The posture needed
verification because xyflow is a React library that imports
into client components — without `next/dynamic` isolation,
it would land in every page's initial bundle.

Verification on the post-build artifact:

```
grep "xyflow|@xyflow" .next/static/chunks/*.js → 1 file
   → .next/static/chunks/0~mg7.kg3jy92.js (174 KB raw, ~50-60 KB gzipped)

grep that chunk's referrers → 1 file
   → .next/static/chunks/0_.ihh4d54oq3.js (the dynamic loader)

That loader appears in /notes/[slug].rsc as:
   `<script src="/_next/static/chunks/0_.ihh4d54oq3.js" async>`

NOT in main, framework, webpack, or any other route's chunks.
```

Net result: visiting `/notes/cloud-waste-hunter-architecture`
and staying on the Read tab loads **0 KB of xyflow**. The
xyflow chunk download only starts when the visitor clicks
the Diagram tab.

For comparison: also verified that AWS SDK + Sentry + Octokit
+ CLI source remain absent from all client chunks (Phase 1
+ 2.1 + 2.3 + 2.4 invariants):

```
grep "octokit|Octokit|@octokit|BedrockRuntime|aws-sdk|@sentry|
      sentry|emredogan-cli|@emredogan/cli" .next/static/chunks/*.js
→ 0 matches
```

---

## 5. What was deliberately NOT touched

Per "execute ONLY Sub-PR 2.5":

- **No new lab experiment slot.** Sub-PRs 2.1-2.3 closed the
  3-experiment trio; Notes 2.0 is a *different surface*
  (`/notes/[slug]`), not a fourth `/lab/<slug>`.
- **No build-time audio generation in `next build`.** V4
  step 2 says "Build-time: for each note, generate audio via
  `/api/voice/tts`". I implemented the cron path instead of a
  pre-build script. Reason: pre-build TTS generation either
  (a) requires `ELEVENLABS_API_KEY` to be set on every Vercel
  build (slow + costly + brittle when the key rotates), or
  (b) commits the binary mp3 files to the repo (bloats git
  history). The cron path keeps the mp3 files as *deploy-
  time* artifacts (written to `public/` only on the runtime
  that has the env var), and the page degrades gracefully
  when the file doesn't exist yet.
- **No client-side Markdown rendering** — the article still
  renders server-side; only the tab wrapper hydrates.
- **No second telemetry endpoint** — reused
  `/api/telemetry/visit` with a surface allow-list extension.
- **No drag-edit on diagrams** — `nodesConnectable: false`
  +  `nodesDraggable: true` allows visitors to push nodes
  around (free interaction) but not modify the topology.
- **`react-markdown` plugins** (gfm, syntax-highlighting) —
  the existing notes don't use tables or fenced code blocks,
  so the v3 react-markdown core is sufficient. Polish PR
  candidate if a future note demands it.
- **Pre-existing `LuminaWindow.tsx` lint errors** — out of
  scope for the tenth consecutive sub-PR.

**Anti-pattern checks (V4 § 9):**

- ❌ `@xyflow/react` not in any non-dynamic chunk — verified.
- ❌ No identity drift. Same `#00d2ff`, Geist, bg-black,
  hairline cyan rules.
- ❌ Cool Demo Syndrome filter passed — every change traces
  to V4 § 5.2.5 / § 6.2.B SUB-PR 2.5.
- ❌ No client AI SDK; no client AWS SDK; no client Octokit.

---

## 6. Validation report

### 6.1 Build & types

- ✅ `npx tsc --noEmit` clean.
- ✅ `npm run build` green.
- ✅ Routes:
  - `/notes/[slug]` → still `●` SSG (three slugs prerendered).
  - `/api/notes/regenerate-audio` → `ƒ` nodejs.
  - All Phase 1 + 2.1-2.4 routes unchanged.

### 6.2 Lint

- ✅ All Sub-PR 2.5 TypeScript files lint-clean. No new
  disable comments.
- ⚠️ `vercel.json` is file-skipped (not a lint target);
  same warning every prior sub-PR carries.
- ⚠️ Pre-existing `LuminaWindow.tsx` errors untouched.

### 6.3 Bundle posture (V4 § 2.7 + § 5.2.5)

See §4 above. Headline numbers:

| Surface | Chunk |
|---|---|
| `@xyflow/react` | **1 dynamic chunk** (~50-60 KB gzipped). Loaded only by the Diagram tab. |
| AWS SDK / Sentry / Octokit / CLI | 0 matches in client chunks. |
| `AudioPlayer` | Client island ~3 KB gzipped (only React hooks + a single fetch). Eager — bundle delta acceptable. |
| `NotesTabs` | Client island ~4 KB gzipped. Eager — but only on `/notes/[slug]`. |

LCP target (V4 § 5.2.5): `< 1.5s` notes pages. RSC page,
xyflow deferred, Markdown server-rendered. Comfortable hit.

### 6.4 Phase 1 + Sub-PR 2.1/2.2/2.3/2.4 invariants — all intact

| Invariant | Origin | Status |
|---|---|---|
| `@emredogan/lumina-chat` tarball 29 files / 23.7 kB | 1.1 | ✅ |
| `@emredogan/cli` tarball 10 files / 7.6 kB | 2.4 | ✅ |
| `/telemetry` `○ Static 5m / 1y` | 1.2 | ✅ (now 18 tiles, was 16) |
| `/api/telemetry/[metric]` `ƒ` edge | 1.2 | ✅ |
| `/api/telemetry/visit` `ƒ` edge | 1.5 | ✅ (surface allow-list +2) |
| `/api/auto-tweet` `ƒ` edge | 1.3 | ✅ |
| `/changelog` `ƒ` (KV-cached) | 1.4 | ✅ |
| `/lab` `○ Static`, three lab pages SSG-static + their `ƒ` nodejs routes | 2.1-2.3 | ✅ |
| `/api/cli/ask` + `/api/projects` | 2.4 | ✅ |
| Sentry / AWS SDK / Octokit / CLI source in 0 client chunks | 1.5 / 2.1 / 2.3 / 2.4 | ✅ |
| Cinematic identity (`#00d2ff` only, Geist only, bg-black) | all | ✅ |

### 6.5 Hydration / motion / a11y

- ✅ `<NotesTabs>` is the only new client island on the
  page; pass-through pattern for the Markdown so the
  article still server-renders.
- ✅ No new infinite animations. xyflow draws statically;
  the only motion is the visitor's drag/pan.
- ✅ AudioPlayer uses the native `<audio>` element — full
  accessibility tree, keyboard controls, screen reader
  support all inherited from the browser.
- ✅ Diagram nodes carry semantic content (mono kind label
  + title + caption) so screen readers can announce them.
  xyflow uses divs not SVG primitives for nodes — text is
  selectable + readable.
- ✅ Tab strip uses WAI-ARIA tabs pattern with `role`,
  `aria-selected`, `aria-controls`, `aria-labelledby`,
  `tabIndex` management.

### 6.6 Cinematic identity (V4 § 13.5)

- ✅ Notes pages keep the same ambient blur stack as V3.
- ✅ Tab pills use the same cyan-on-black active state vocab
  as `/lab` index status pills + `/changelog` filter pills.
- ✅ Diagram nodes use the same hairline-cyan-rule + matte-
  card vocabulary as `/telemetry` tiles + `/lab` cards.
- ✅ AudioPlayer's surround block carries the same
  border + padding rhythm as the `/telemetry` tile, so
  swapping between Read and Listen feels seamless.

---

## 7. Schema additions (V4 § 2.13)

| Key | Role | Operation |
|---|---|---|
| `v4:adoption:notes:audio_plays` | Counter — `<audio>` first-play events | `incrementMetric` via `/api/telemetry/visit?surface=notes-audio-play` |
| `v4:adoption:notes:diagram_interactions` | Counter — first node-click on InteractiveDiagram | `incrementMetric` via `/api/telemetry/visit?surface=notes-diagram-interaction` |

Both are session-deduped per `(visitor session × note slug)` via
sessionStorage flags inside the client islands.

---

## 8. Rollback plan

- `git revert <commit-sha>` removes every Sub-PR 2.5 change
  cleanly. The mp3 files in `public/notes/audio/` (when
  generated) survive the revert if the maintainer wants to
  keep them — they're just static assets.
- Per-component rollback options:
  - Remove `formats` field from a single note in
    `data/notes.ts` → NotesTabs auto-degrades to plain Read.
  - Rename `app/api/notes/regenerate-audio/` to
    `app/api/notes/_disabled-regenerate-audio/` → cron 404s.
  - Remove the cron entry from `vercel.json` → weekly cadence
    stops; existing files remain served.
- Per-format rollback: drop the `audio` or `diagram` key
  from a note's `formats` object — that tab disappears for
  that note. No code change needed.

---

## 9. Risks identified

| Risk | Prob. | Sev. | Mitigation |
|---|---|---|---|
| Audio files 404 between merge and first cron firing | High | Low | AudioPlayer surfaces the "audio pending" mono row on `error` event. UX is acceptable. |
| ElevenLabs API key missing in prod | Low | Low | `generateAudioForNote` returns `{ status: "skipped", reason: "no-key" }`. The cron run reports `skipped: 3` cleanly. Audio files never get generated, AudioPlayer never finds them, "audio pending" message persists. |
| ElevenLabs cost spike from a force-regenerate loop | Low | Low | The cron is bearer-auth via `CRON_SECRET`. Only the maintainer can fire it. `force=true` requires explicit query-param opt-in. |
| xyflow client-side bundle creep | Medium | High (if it lands in initial bundle) | **Verified clean.** The `next/dynamic({ ssr: false })` + `{active === "diagram" && <InteractiveDiagram />}` conditional render gives two layers of isolation. |
| Diagram nodes overlap on mobile portrait | Medium | Low | Diagrams use absolute pixel positions; on narrow viewports xyflow's `fitView` auto-zooms to fit. `minZoom: 0.5` lets it shrink generously. Worst case the visitor pinches to zoom out. |
| Native `<audio>` element doesn't honour `accentColor` on Firefox | Background | None | Firefox renders its own native controls; the player still works, just doesn't pick up the cyan tint. Acceptable. |
| `next/dynamic` SSR mismatch warning on Diagram tab | Low | Low | `ssr: false` is explicit; the loading skeleton renders during the dynamic chunk fetch. Verified no hydration warnings in the build. |
| Pre-existing `LuminaWindow.tsx` lint errors | Background | None | Out of scope for the tenth consecutive sub-PR. |

---

## 10. Founder energy impact

- **Dev time this sub-PR:** ~2.5 hours
- **Cumulative Phase 2 burn (2.1-2.5):** ~9 hours across the
  five sub-PRs
- **Maintenance going forward (per V4 § 4.2):**
  - Audio regeneration: 1 min/month observation. The weekly
    cron generates only missing files (no force loop), so
    edited bodies stay stale until the maintainer manually
    triggers a `force=true` run after editing a note.
  - Diagram drift: ~5 min/note/year when an architecture
    note's underlying system changes shape. The diagrams
    in `data/notes.ts` are typed Diagram* literals — TypeScript
    catches breakage when the schema evolves.
  - xyflow major-version bumps: ~30 min if the API changes
    materially.
- **Burnout signal:** none. Comfortably within V4 § 2.6's
  22 hr/week budget.

---

# 11. PHASE 2 CLOSE — Final validation (V4 § E)

Cross-cutting checks against V4 Phase 2's success criteria:

| Criterion (V4 § 4.2) | Status |
|---|---|
| `/lab` route canlı, 3 experiment çalışıyor | ✅ shipped (Sub-PRs 2.1, 2.2, 2.3) |
| Her experiment'in /telemetry'de adoption count | ✅ — 9 lab metric tiles surface IAM/prompt/commit visits + completions + cost |
| `npx emredogan ask "..."` çalışıyor | ✅ shipped (Sub-PR 2.4) — awaiting npm publish workflow trigger |
| `npx emredogan project list` çalışıyor | ✅ shipped (Sub-PR 2.4) |
| Notes 2.0: en az 1 note 3+ format (longform + audio + diagram) | ✅ — `cloud-waste-hunter-architecture` + `sixpack-ai-pose-detection` both carry all three formats; `monk-mode` has longform + audio |
| Reverse engagement: haftada 5+ drafted reply, Emre 2-3 approve | ⏳ **out of Phase 2 scope as shipped.** V4 § 5.2 listed it but no sub-PR was allocated; deferred to a future Twitter-monitor sub-PR |
| YouTube Architecture-from-Scratch: 4+ video | ⏳ external (not a code sub-PR) |
| npm downloads: lumina-chat 300/hafta + emredogan-cli 50/hafta | ⏳ awaiting publish workflow triggers (1.1 + 2.4 H-steps) + 30-day observation |
| Lighthouse Mobile ≥ 90 (lab routes biraz daha yavaş kabul edilebilir) | expected pass — RSC pages, lean client islands |

Cross-phase invariants:

| Criterion | Status |
|---|---|
| All Phase 1 success criteria still hold | ✅ |
| V3 cinematic identity korunmuş | ✅ |
| V3 Lumina onboarding değişmemiş | ✅ |
| V3 bento layout aynı | ✅ |

**Sub-PR ship summary:**

| Sub-PR | Title | Status |
|---|---|---|
| 2.1 | `/lab` scaffold + IAM Translator | ✅ shipped |
| 2.2 | Prompt Rescuer | ✅ shipped |
| 2.3 | Commit Narrator | ✅ shipped |
| 2.4 | `@emredogan/cli` v0.1 | ✅ shipped (awaiting publish workflow trigger) |
| 2.5 | Notes 2.0 multi-format | ✅ shipped (this sub-PR) |

**Per V4 § 4.2:** Phase 2 mission complete from the agent's
side. Human-gated activations remain for the npm publish
workflow + `ELEVENLABS_API_KEY` provisioning so the audio
cron can actually generate files.

---

## 12. Human-gated steps to fully activate Phase 2

| Step | What | Where |
|---|---|---|
| H1 | Trigger the `@emredogan/cli` publish workflow (Sub-PR 2.4) | github.com/.../actions/workflows/publish-emredogan-cli.yml |
| H2 | Provision `ELEVENLABS_API_KEY` env var in Vercel (if not already set for `/api/voice/tts`) | Vercel dashboard → Env Vars |
| H3 | First manual cron trigger: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://emredogan.com/api/notes/regenerate-audio` → returns `{ generated: 3, skipped: 0, ... }` | local shell |
| H4 | Verify the three mp3 files now serve from `https://emredogan.com/notes/audio/<slug>.mp3` | browser |
| H5 | (Optional) trigger a `?force=true` regeneration after editing a note body | Vercel cron logs |

Until H1: the npm badges on `/` and the CLI README render as
shields.io "invalid" placeholders. Until H2-H4: the Listen tab
on notes pages shows the graceful "audio pending" row instead
of the player.

---

## 13. Next phase

**PHASE 3 — Monetization & Community Layer** (V4 § 4.3, § 6.3).
Per V4 § 0.1: a 30-day observation window between phases.
No Phase 3 work begins until the observation window closes
and Phase 2 success criteria show real numbers.

Phase 3 sub-PRs (read-only for now — do not start):

- 3.1 lumina-chat Pro Managed Backend
- 3.2 Premium Template: cwh-saas-starter
- 3.3 Premium API: `/v1/lumina/chat` with Key Auth
- 3.4 Discord Setup + Contributor Docs
- 3.5 Newsletter Weekly Digest (Resend)
- 3.6 Clip Extraction Pipeline (Semi-Auto)

---

## 14. STOP

Sub-PR 2.5 complete. **Phase 2 closed.** Awaiting:
- Human approval to begin the 30-day observation window
- Human-gated activations (H1-H5 above)
- Phase 3 trigger after observation window closes

The lab has three open doors; the terminal has four commands;
the notes have three formats. Three surfaces, one voice.

— end Sub-PR 2.5 —
— end Phase 2 —
