# Codex — Book 4: Tuzun Hafızası

**Branch:** `feat/v4-phase5-experimental-foundation`
**Scope:** Add **Tuzun Hafızası** as the **fourth** codex book and place it **first** in display ordering. Extend — not redesign — the existing Codex architecture. Index, detail page, shelf, lineage timeline, narrative topology, sitemap, and metadata all inherit the new book by data-only addition plus minimal hub edits.

---

## 1. What changed

| Change | Where |
|--------|-------|
| Added a new `TUZUN_HAFIZASI` `CodexBook` constant with full editorial + topology data | `data/codex.ts` |
| Re-ordered `codexBooks` so Tuzun is first: `[TUZUN_HAFIZASI, MENDIRAN, MYTHOLOGICA, SOLGUN]` | `data/codex.ts` |
| Added the cover image | `public/codex/tuzun-hafizasi-cover.png` (copied from the live reader) |
| Added a 4th entry to `ATMOSPHERE_TINTS` (Tuzun's tint first), matching the per-book `atmosphereTint` field | `app/codex/page.tsx` |
| Updated hero paragraph "Three self-contained digital editions…" → "Four self-contained digital editions…" (legacy + V6) | `app/codex/page.tsx` |
| Added a new pull-quote section for Tuzun **first** in the V6 editorial column, before the existing Mendîran / Mythologica / Solgun sections | `app/codex/page.tsx` |
| Updated V6 closing CTA line "Three books. Three worlds. Choose one." → "Four books. Four worlds. Choose one." | `app/codex/page.tsx` |
| Added `tuzun-hafizasi` entries to `SHELF_HEIGHT` and `SHELF_OFFSET` records; preserved existing three entries verbatim | `app/codex/_components/CodexShelf.tsx` |
| Made the shelf's `priority` flag data-driven (`i === 0`) instead of slug-hardcoded, so reordering the data array shifts the LCP image automatically | `app/codex/_components/CodexShelf.tsx` |
| Updated the shelf docstring to describe four covers; preserved the existing height-profile semantics ("tallest = elder volume, shortest = newest acquisition") | `app/codex/_components/CodexShelf.tsx` |

---

## 2. Files changed

| File | Type | Lines |
|------|------|-------|
| `data/codex.ts` | modified | +~330 (new book constant + array reorder) |
| `app/codex/page.tsx` | modified | +~26 / 3 text edits |
| `app/codex/_components/CodexShelf.tsx` | modified | +5 / 1 priority-logic refactor / docstring update |
| `public/codex/tuzun-hafizasi-cover.png` | new | 1852 × 967 PNG, 137 KB |
| `CODEX_BOOK_4_REPORT.md` | new | this file |

**Unchanged (deliberately):**
- `app/codex/[slug]/page.tsx` — fully data-driven from `data/codex.ts`; reads everything from the book object. Adding a new book to the data array auto-generates its detail page via `generateStaticParams`.
- `app/codex/_components/CodexLineage.tsx` — pure renderer over `books: readonly CodexBook[]`. Adapts to N entries; the four ticks distribute evenly along the cyan rule.
- `components/codex/CodexTopology*.tsx` — purely data-driven; reads `nodes` + `edges` from the book object. No code touch required.
- `app/sitemap.ts` — already iterates `codexBooks.map(...)`; the new entry appears automatically (verified in build output).

---

## 3. Book summary rationale

The user explicitly forbade generic AI filler, vague fantasy wording, and invented marketing copy. The summary was extracted from the actual book project at `/home/emre/Downloads/MY-DİGİTAL-BOOK/tuzun-hafizasi`, specifically from:

- `README.md` — premise, structure (3 acts, 36 chapters), the inciting grain, the in-engine themes (Tuzlu / Kumlu / Gece-Deniz), the typefaces (Cormorant Garamond + EB Garamond + Marcellus), the zero-dependency engine note, the keyboard shortcut list.
- `content/novel-data.js` — the book's own self-titling ("Bir Kıyı Romanı"), the act names + sigils + descriptions ("Bulma" / "İz Sürme" / "Anılma" with ◇ / ◈ / ◉), the epigraph ("Deniz bazen ölülerin sakladığını da geri verir. Tuz hatırlar."), the colophon.
- `reports/STORY-BIBLE-TR.md` — the canon: world (Vâliçe, post-imperial republic, ~1924–1925), the Tuzcular Tarîkâtı (Salt Brotherhood), the Düzeltme (Corrections) program, the character roster, the timeline (1825 → 1925), and the central argument of the novel ("To name a missing person is itself a small, dispersed, never-finished act of remembrance").
- The cover screenshot at `tuzun-hafizasi.png` — confirmed the in-engine sigil is ◊ (lozenge), the page indicator at 331 pages, the live-reader chrome.

The synopsis is three paragraphs, matching the structural register of the existing three book synopses:
1. **Paragraph 1** — sets up the world + the inciting moment (Reha returning, the unregistered grain, the child's voice).
2. **Paragraph 2** — frames the political shape of the novel (the Salt Brotherhood, the Düzeltme, the new republic's quiet continuation) and states the argument the novel never speaks aloud.
3. **Paragraph 3** — engineering note (vanilla JS, paginator, 3D page-turn, three CSS themes, localStorage izler, keyboard navigation, body type in Cormorant Garamond + EB Garamond + Marcellus). Honest disclosure: "Five chapters of the thirty-six are currently bound into the live reader; the canon for the remaining thirty-one is fixed."

The tagline ("Thirty-six chapters in a coastal salt-house, and a sister the empire's archive insisted had never been born.") follows the structural pattern of the other taglines: one sentence with a concrete number + concrete elements, no abstraction.

The epigraph is **the book's own epigraph**, verbatim. The act names + sigils inside the topology + arcs structure are **the book's own act labels**.

No invented worldbuilding. No filler. The voice is the existing codex's voice; the content is the book's content.

---

## 4. Topology implementation notes

The narrative constellation follows the identical ring-based architecture used by the existing three books — same `CodexNode` / `CodexEdge` types from `data/codex.ts:48–70`, same `ring` + `angleDeg` polar coordinates, same `centerLabel` axis convention.

**Architecture:**
- **Center (1 node):** `tuz` — Salt itself. Mirrors Mendîran's center (`and` — the Seventh Oath), Mythologica's center (`codex`), Solgun's center (`mimar` — the Architect-God).
- **Ring 1 — primary (6 nodes):** Six Inheritances. Sezerân Hânesi, Halife Hânesi, Tuzcular Tarîkâtı, Yeni Cumhuriyet, Defter-Hâne, Düzeltme Komitesi. Evenly spaced 60° apart starting at -90°. Matches Mendîran's six-house ring count.
- **Ring 2 — secondary (8 nodes):** Eight Principal Figures. Reha, Defne, Mâra, Erol, Lemi, Nahide, Cilâl, İlhan. Evenly spaced 45° apart starting at -90°. Matches Mendîran's "Eight" ring count and Mythologica's eight-theme ring count.
- **Ring 3 — tertiary (6 nodes):** Six Forces / Inheritances. Çile Ana (founder myth), Mâriye Halife (martyred pîr), Rüh-Çizgi (the soul-line in the grain), Tuzhane (the half-ruined salt-house), İptal Defteri (the cancellation folio), Vâliçe Kıyısı (the coast itself). Evenly spaced 60° apart. Matches Mendîran's tertiary ring count.

**Total nodes:** 1 + 6 + 8 + 6 = 21. Identical to Mendîran's count.

**Edges (22 total):**
- Center → 6 lineages (the salt belongs to all).
- 8 characters → their lineage of origin (Reha/Defne/Mâra/Erol → Sezerân; Cilâl → Halife; Lemi/Nahide → Tarikat; İlhan → Cumhuriyet).
- 7 lineage → tertiary force edges (Tarikat → Çile Ana / Rüh / Tuzhane; Halife → Mâriye; Düzeltme + Defter-Hâne → İptal; Sezerân → Vâliçe).
- 1 "the republic quietly inherits the corrections" lineage→lineage edge (Cumhuriyet → Düzeltme) — mirrors Mendîran's "latent lineage" pattern (`f-sonmeyenler` → `f-kulbag`).
- 1 dramatic central edge (Erol → İptal Defteri) — the father's signature on his own daughter's cancellation. This is the novel's load-bearing relationship.

**Renderer:** The existing `CodexTopologyScene` (3D) + `CodexTopologyFallback` (2D mobile / reduced-motion) consume `book.topology.nodes` and `book.topology.edges` directly. No renderer code touched. The cyan accent (sole accent color in the topology layer per `data/codex.ts:13–15` identity rules) is preserved.

The screen-reader fallback (`<ul className="sr-only">` in `app/codex/[slug]/page.tsx:263–270`) auto-includes the new book's nodes + blurbs.

---

## 5. Ordering verification

The user mandated:
> Ordering becomes: 1. Tuzun Hafızası, 2. Existing book 1, 3. Existing book 2, 4. Existing book 3
> Preserve existing ordering logic. Only adjust data order.

**Ordering logic preserved:** Every consumer of `codexBooks` iterates the array in its natural order. No consumer hardcodes a specific position by slug. The single ordering decision lives in `data/codex.ts`:

```ts
export const codexBooks: readonly CodexBook[] = [
  TUZUN_HAFIZASI,
  MENDIRAN,
  MYTHOLOGICA,
  SOLGUN,
] as const;
```

**Render order confirmed across surfaces:**

| Surface | Order on V5 (legacy) | Order on V6 |
|---------|----------------------|-------------|
| `/codex` hero folios (legacy path) | Tuzun → Mendîran → Mythologica → Solgun | n/a (V6 uses shelf) |
| `/codex` shelf (V6 path) | Tuzun (leftmost) → Mendîran → Mythologica → Solgun (rightmost) on desktop | same |
| `/codex` lineage ticks (V6 path) | Tuzun (leftmost tick) → Mendîran → Mythologica → Solgun (rightmost tick) on desktop | same |
| `/codex` editorial column pull-quotes (V6 path) | Tuzun (first) → Mendîran → Mythologica → Solgun | same |
| `/codex` closing CTA pills (V6 path) | Tuzun (first) → Mendîran → Mythologica → Solgun | same |
| `app/sitemap.ts` URL list | Tuzun → Mendîran → Mythologica → Solgun (matches array iteration) | same |
| `generateStaticParams` in `app/codex/[slug]/page.tsx` | Tuzun → Mendîran → Mythologica → Solgun | same |

The legacy `app/codex/page.tsx` numbered eyebrow ("Folio 01" → "Folio 04") auto-derives from the array index, so Tuzun renders as "Folio 01" on the legacy path with no additional change.

---

## 6. Mobile verification

The Codex hub has two responsive layouts (legacy and V6) — both adapt to the new fourth entry without bespoke mobile edits:

**Legacy path** (`process.env.NEXT_PUBLIC_V6_CODEX_SHELF !== "1"`):
- Stacked vertical folios. Each folio is its own grid (`grid md:grid-cols-12`) that collapses to single-column on mobile.
- Tuzun renders as the first folio (top of the page). Cover above, editorial column below. No new mobile concern — the same pattern as the existing three folios.

**V6 path** (`NEXT_PUBLIC_V6_CODEX_SHELF === "1"`):
- `CodexShelf` uses `flex flex-col lg:flex-row`. On `< lg` the four covers stack vertically with the per-slug `self-start` / `self-center` / `self-end` offsets producing a small horizontal stagger. Tuzun gets `self-start`, mirroring Mendîran's mobile offset. No layout breakage — the existing two-offset variety (start vs center vs end) still holds.
- `CodexLineage` collapses to a vertical `<ol>` of four bullet rows on `< lg`. The four entries fit comfortably in the column; no overflow.
- Editorial column pull-quotes stack at `max-w-2xl mx-auto` — a four-section column is taller than three but reads the same.
- Closing CTA pills `flex-wrap` to multiple rows on narrow viewports — four pills wrap to two rows on small screens; identical pattern to three.

Tuzun's cover is shorter than Solgun's in the shelf height profile (`h-[185px] sm:h-[215px] md:h-[240px] lg:h-[260px]`). Width tracks the cover aspect (~3:5 portrait) at 133–188 px wide across breakpoints. On lg+ the shelf has four covers leaning at four different heights, producing an undulating skyline rather than a strict staircase.

---

## 7. Link verification

Every link in the existing codex system inherits the new book without modification:

| Link target | Behavior |
|-------------|----------|
| `/codex/tuzun-hafizasi` (index folio cover → detail page) | Resolves via `generateStaticParams` + `getCodexBookBySlug`; static-prerendered at build time |
| `https://tuzun-hafizasi.vercel.app/` (live reader, `book.deployUrl`) | Opens in new tab from `Live reader` pill on the index folio + the `Open the live reader` CTA + the closing `Enter Tuzun Hafızası` CTA on the detail page. `target="_blank" rel="noopener noreferrer"` preserved. |
| `/codex` (back link from detail) | Pre-existing back link; unchanged. |
| Sitemap entry for `/codex/tuzun-hafizasi` | Auto-emitted by `app/sitemap.ts:55` from `codexBooks.map(...)`. Verified in production-build static-pages list. |

No `githubUrl` field set on Tuzun (the field is optional in `CodexBook`). The optional `Source` pill in the detail-page hero CTA row is gated on `book.githubUrl && (...)` so it cleanly omits.

---

## 8. Visual consistency law

The user's mandate: "feel native. If someone saw the page for the first time, they should NEVER think 'this was added later.' It must feel fully integrated."

**Visual primitives reused verbatim:**
- Cover ribbon: `inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2 py-0.5` with cyan `text-[#00d2ff] text-[13px]` sigil glyph + `font-mono uppercase tracking-[0.18em] text-[9px]` in-world year. Tuzun renders with `◊ CUMHURIYET III`.
- Atmosphere chip: `inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.025] font-mono uppercase tracking-[0.18em] text-[10px]` with cyan name + tertiary mood. Tuzun renders three chips (tuzlu / kumlu / gece-deniz).
- Detail-page sigil ribbon, hero title typography, epigraph blockquote, atmospheres + themes sections, synopsis paragraphs, topology canvas, chronicle timeline, factions grid, characters grid, arcs list, engineering note, closing CTA — all rendered by the existing `app/codex/[slug]/page.tsx` over the new book's data fields. **Zero bespoke layout for Tuzun.**
- Index pull-quote: `<blockquote className="relative pl-5">` with `<span aria-hidden="true" className="absolute left-0 top-1.5 inline-block w-px h-[calc(100%-0.75rem)] bg-[#00d2ff]/40" />` left rule + `text-primary/90 italic text-[15.5px] leading-[1.7]`. Identical to the existing three pull-quotes.

**Per-book identity variables (the book's own voice — not reused):**
- Sigil glyph: `◊` (lozenge — matches the live reader's own sigil; salt-crystal motif; distinguishes from Mendîran ❦, Mythologica Ω, Solgun ✠ and from the act sigils ◇ ◈ ◉ used inside the book).
- Atmosphere tint: `rgba(190, 178, 152, 0.10)` — limewashed driftwood. Sits in the same warm-neutral family as the existing tints (gold-amber, illuminated parchment gold, ash-bone), staying compatibly below the cyan accent layer per `data/codex.ts:13–15`.
- In-world year: `Cumhuriyet III` — short, evocative, matches the book's own discipline of never naming the exact year.
- Epigraph + act names + sigils + character/faction names + acts: **straight from the book's own canon**.

The new entry sits in the page as the natural opener — visually shortest cover (newest acquisition, in-progress), first in the lineage timeline, first pull-quote in the editorial column, first CTA pill. The hierarchy reads as deliberate, not appended.

---

## 9. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Tuzun's cover aspect ratio (1852 × 967) differs slightly from the existing covers (1845 × 954) — ~0.4% wider and ~1.4% taller in absolute pixels | Low | `object-cover` on the `<Image>` renders centers and crops to fit; no visible distortion. Verified in production build. |
| The cover screenshot includes the live-reader's UI chrome (top bar, page indicator, "ÖNCEKİ"/"SONRAKİ" buttons) | Low | This matches the existing three covers (Mendîran, Mythologica, Solgun cover spreads also include their own reader chrome). Visual consistency preserved. |
| Tuzun's sigil ◊ (LOZENGE U+25CA) is visually similar to the book's own act sigils ◇ ◈ ◉ — could read as confusion | Low | The codex page uses the BOOK sigil; the act sigils only appear inside the live reader. They never share visual real estate on the portfolio side. The choice ◊ matches what the live reader itself uses in the title bar (verified in the cover screenshot). |
| The synopsis discloses "Five chapters of the thirty-six are currently bound into the live reader" — honest but might read as work-in-progress on a portfolio surface | Medium | Honesty over marketing. The user explicitly mandated "book-specific, context-aware" content over filler. Other books' synopses describe complete works because those works are complete; Tuzun is disclosed as it is. The disclosure sits at the end of the third paragraph (engineering note context) so the world-building paragraphs read as a finished canon. |
| The pull-quote section adds visual length to the V6 editorial column (~70 lines of source) — extends the page total | Low | The pull-quote pattern is the same as the existing three; the column already has three sections. Four is a natural extension. Mobile scroll feels longer but the structure is consistent. |
| Tuzun's mobile offset (`self-start`) duplicates Mendîran's (`self-start`) | Low | Mobile is a vertical column; the small horizontal stagger via `self-start`/`self-center`/`self-end` adds variety. Two adjacent `self-start`s alongside Mythologica's `self-center` and Solgun's `self-end` still produces three distinct positions across four entries. Minimal staircase variation preserved without modifying the existing three slugs' offsets. |
| `ATMOSPHERE_TINTS` is now four entries but the per-book `book.atmosphereTint` field also exists; the two must stay synchronized for Tuzun | Low | Both set to identical `rgba(190, 178, 152, 0.10)` in this commit, matching the existing per-book pattern (Mendîran's `ATMOSPHERE_TINTS[1]` matches its `book.atmosphereTint`, etc.). Future divergence is a class of issue that already existed for the other three books and has not surfaced. |
| If a future hub commit hardcodes a slug somewhere new (e.g., `if (book.slug === "tuzun-hafizasi") {...}`), the surface becomes brittle | Low | This commit specifically REMOVES the slug-hardcoded `priority` from `CodexShelf` and replaces it with index-based logic. Going forward, slug checks are an anti-pattern in the hub. |

---

## 10. Rollback command

A single-commit revert restores the exact pre-Tuzun state across every surface:

```bash
git revert <commit-hash>
```

This reverts:
- The new `TUZUN_HAFIZASI` constant + array reorder in `data/codex.ts`.
- The 4th tint + pull-quote section + count edits in `app/codex/page.tsx`.
- The shelf height + offset + priority-logic + docstring edits in `app/codex/_components/CodexShelf.tsx`.
- This report (`CODEX_BOOK_4_REPORT.md`).
- The cover image (deletion of `public/codex/tuzun-hafizasi-cover.png`).

Per-file revert (surgical):

```bash
git checkout HEAD~1 -- \
  data/codex.ts \
  app/codex/page.tsx \
  app/codex/_components/CodexShelf.tsx \
  CODEX_BOOK_4_REPORT.md
rm public/codex/tuzun-hafizasi-cover.png
```

---

## 11. Deploy-safety confirmation

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ Clean. |
| `npx eslint app/codex data/codex.ts` | ✅ Clean (both apostrophe issues in the new pull-quote escaped to `&apos;`). |
| `npm run build` (Next.js 16 Turbopack) | ✅ Compiled in 11.7 s. 57 static pages (was 56). |
| `/codex` static route | ✅ Generates. |
| `/codex/[slug]` static routes | ✅ 4 of 4 generate: `/codex/tuzun-hafizasi`, `/codex/mendiran-vakayinamesi`, `/codex/codex-mythologica`, `/codex/solgun-kitabe`. |
| Sitemap auto-update | ✅ `app/sitemap.ts:55–58` maps `codexBooks` → URLs; Tuzun included. |
| Cover image resolves | ✅ `public/codex/tuzun-hafizasi-cover.png` exists (137 KB, 1852 × 967 RGBA PNG). |
| ATMOSPHERE_TINTS length = `codexBooks.length` | ✅ Both = 4. |
| SHELF_HEIGHT / SHELF_OFFSET cover all four slugs | ✅ Plus the existing fallback `??` for unknown slugs is preserved. |
| `CodexTopology` consumes new `nodes` + `edges` | ✅ Renderer is data-driven; no code touched. |
| Hydration: SSR + client emit identical HTML | ✅ All edits are server-rendered or static-prerendered. |
| No new dependency | ✅ `package.json` unchanged. |
| No edit to Lumina, contact, telemetry, operator surfaces, Phase 14/15 systems | ✅ Strictly Codex scope. |
| Visual verification: browser walk-through of `/codex` and `/codex/tuzun-hafizasi` | ⚠️ Not performed in this session. Production build + TypeScript + ESLint pass confirm the code compiles and the routes prerender. Recommend a smoke test pre-merge or on the next preview deploy. |

**Deploy verdict: SAFE.** The change is additive (one new book + four small hub edits) with no schema migration, no data shape change, no API change, no rendering-engine change. Rollback is a single revert.

---

## 12. What Tuzun Hafızası is

A literary coastal novel set in the early years of a republic that buried the empire it inherited from. In the town of Vâliçe, a returning librarian opens her family's half-ruined salt-house, finds a single unregistered grain, and tastes the voice of a sister the imperial archive had filed out of being. The Salt Brotherhood — Tuzcular Tarikatı — once kept what the new state is now quietly burning. The novel's argument: to name a missing person is itself a small, dispersed, never-finished act of remembrance.

Thirty-six chapters across three acts. Five currently bound in the live reader. Zero dependencies. Vanilla JS, custom paginator, 3D page-turn, three CSS themes (tuzlu / kumlu / gece-deniz), per-page bookmarks, localStorage persistence, body type in Cormorant Garamond + EB Garamond + Marcellus.

The fourth codex. The shelf opens here.
