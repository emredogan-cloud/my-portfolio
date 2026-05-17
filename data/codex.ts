/**
 * Codex — three handcrafted digital editions, each a self-contained
 * cinematic world. The portfolio's narrative layer.
 *
 * Single source of truth for /codex (index) and /codex/[slug]
 * (detail). The narrative-topology renderer at
 * components/codex/CodexTopologyScene.tsx reads `topology.nodes`
 * and `topology.edges` directly off this dataset, so adding a new
 * book — or a new node within one — needs no other touch.
 *
 * Identity rules that apply to every book regardless of its own
 * internal palette:
 *   - Cyan (#00d2ff) is still the only accent on the portfolio side.
 *     Each book's own atmospheric tint shows up only behind the
 *     canvas, never in node colour.
 *   - Geist remains the sole typeface; the books' Cinzel / Cormorant
 *     hand-typesetting stays inside their own deployments.
 *   - Per-book sigil is a single Unicode glyph, rendered in Geist,
 *     not a custom font file.
 */

export interface CodexTimelineEntry {
  era: string;
  label: string;
  blurb: string;
}

export interface CodexFaction {
  id: string;
  name: string;
  sigil?: string;
  oneLine: string;
}

export interface CodexCharacter {
  id: string;
  name: string;
  role: string;
  blurb: string;
}

export interface CodexArc {
  id: string;
  name: string;
  beats: readonly string[];
}

/* ── Topology types ─────────────────────────────────────────────
 *
 * Deliberately the same shape family as
 * components/home/hero-topology-data.ts — RingId, polar `angleDeg`,
 * optional blurb. The CodexTopologyScene engine re-uses the hero's
 * place-then-orbit math verbatim. */

export type CodexRing = "center" | "primary" | "secondary" | "tertiary";

export interface CodexNode {
  id: string;
  label: string;
  ring: CodexRing;
  /** Polar angle in degrees, 0° = +X. Ignored for the center node. */
  angleDeg: number;
  /** Tooltip / SR caption — must be specific to the book's lore. */
  blurb?: string;
}

export interface CodexEdge {
  from: string;
  to: string;
}

/* ── Book ────────────────────────────────────────────────────── */

export interface CodexBook {
  id: string;
  /** Used in nav and as the route slug. */
  slug: string;
  /** Title shown in the codex chrome. */
  title: string;
  /** Subtitle / world tag — italic eyebrow in detail hero. */
  subtitle: string;
  /** A single Unicode glyph that lives in the book's own world. */
  sigil: string;
  /** Year of the in-world chronicle, not of publication. */
  inWorldYear: string;
  /** Year of the public deploy (real-world). */
  shippedYear: string;
  /** Two-letter language code as displayed; books may be bilingual. */
  language: string;
  /** The book's deployed URL — opens in a new tab. */
  deployUrl: string;
  /** Optional GitHub source. */
  githubUrl?: string;
  /** /public/codex/<...>.png — already optimised at runtime by next/image. */
  cover: string;
  /** Three short atmospheric mode names from the book's own engine —
   *  rendered as chips on the detail page. */
  atmospheres: readonly { name: string; mood: string }[];
  /** ~70-char teaser used on the index page. */
  tagline: string;
  /** 2-3 paragraph cinematic synopsis. */
  synopsis: string;
  /** A single quote pulled from the book — uses Geist, italic. */
  epigraph: string;
  /** 5-7 theme labels. */
  themes: readonly string[];
  /** Atmospheric tint used behind the topology canvas only. Rgba
   *  string consumed by inline `background: radial-gradient(...)`. */
  atmosphereTint: string;
  /** Editorial timeline — eras + labels. */
  timeline: readonly CodexTimelineEntry[];
  /** Houses, factions, civilizations, orders — depending on book. */
  factionsLabel: string;
  factions: readonly CodexFaction[];
  /** Characters, creatures, or principals — depending on book. */
  charactersLabel: string;
  characters: readonly CodexCharacter[];
  /** Arcs / chapters / canon path. */
  arcsLabel: string;
  arcs: readonly CodexArc[];
  /** Narrative constellation data. */
  topology: {
    centerLabel: string;
    nodes: readonly CodexNode[];
    edges: readonly CodexEdge[];
  };
  /** Engineering note — proof this is a real software artifact. */
  engineeringNote: string;
}

/* ──────────────────────────────────────────────────────────────
 * BOOK I — Mendîran Vakayinâmesi
 * ────────────────────────────────────────────────────────────── */

const MENDIRAN: CodexBook = {
  id: "mendiran-vakayinamesi",
  slug: "mendiran-vakayinamesi",
  title: "Mendîran Vakayinâmesi",
  subtitle: "Yedinci And'ın Çatladığı Diyar — Volumen I",
  sigil: "❦",
  inWorldYear: "VS 1247",
  shippedYear: "2026",
  language: "TR",
  deployUrl: "https://mendiran-vakayinamesi.vercel.app/",
  cover: "/codex/mendiran-vakayinamesi-cover.png",
  atmospheres: [
    { name: "gece", mood: "candlelit umber" },
    { name: "parsomen", mood: "daylight vellum" },
    { name: "kul", mood: "cold ash" },
  ],
  tagline:
    "Six houses, eight wounded oath-bearers, and a seal seven hundred years old that has just begun to crack.",
  synopsis:
    "Mendîran is a continent whose history is not a line but stacked layers of ash. Eight centuries ago, seven mages buried six of the Unextinguished — the Sönmeyenler — inside six anchor castles, sealing them with the Seventh Oath. The seventh and strongest entity was never bound; it was declared lost. The mages all died inside a century. The Oath has held since.\n\nIt is now VS 1247, and the easternmost castle has cracked. The eight people best positioned to feel the rupture — an exiled ash-binder, a monastery-raised possibly-last emperor, a Bey who refuses to forget his dead children, a princess used as a hostage, a commander who carries seventeen hundred names in his sleep, a patriarch who has not spoken in twenty-three years, a Sahesh memory-bearer who is half her dead sister, and an underground king who has not yet decided to climb — are pulled toward Hisn-i Sevra. Each carries their own broken oath; none of them is the protagonist.\n\nThe work is delivered as a zero-dependency single-page reader: a custom paginator (exponential probe + binary search), an inline-SVG illuminated atlas, three themes (gece / parsomen / kul), a Web Audio drone synthesised from four low oscillators, and full offline persistence. Thirty-eight thousand words across twenty-two chapters and twenty interstitial documents.",
  epigraph:
    "İyileşmemek, bir biçim gerektirir. — Vellan ehl-i Naerath, And-Taşıyıcı, VS 1250",
  themes: [
    "Broken oath",
    "Inherited memory",
    "Layered ash",
    "Wounded sovereignty",
    "Magic as binding",
    "Six houses, one rupture",
  ],
  atmosphereTint: "rgba(168, 132, 44, 0.10)",
  timeline: [
    {
      era: "Sözsüz Çağ",
      label: "First Stratum — before VS 0",
      blurb:
        "The Sönmeyenler walk a single continent. Seven entities of unspeakable name; the eighth has not yet thought of itself. The Vasrim flee underground and carve seven cities into rock.",
    },
    {
      era: "VS 0",
      label: "The Seventh Oath is signed",
      blurb:
        "Seven mages bury six of the Sönmeyenler into six anchor castles. The seventh, the strongest, is declared lost. All seven And-Söyleyiciler die within a century.",
    },
    {
      era: "VS 102 – 884",
      label: "Naerath Imperium",
      blurb:
        "The Empire of the Silent One-God. The Külbağcı are purged twice and driven underground. The Empire ends in a wedding poisoning that erases the legitimate bloodline.",
    },
    {
      era: "VS 920",
      label: "Kanlı Düğün — The Bloody Wedding",
      blurb:
        "Resvan Naerath is poisoned; the royal line is severed. A clandestine project to grow a new heir from cousin-cousin couplings begins in the shadow palace.",
    },
    {
      era: "VS 1142",
      label: "Susuz Çayır — The Thirsty Meadow",
      blurb:
        "Two Iramen children return from the forest with absences in their eyes. They die without diagnosis. Their father refuses the rite of name-erasure.",
    },
    {
      era: "VS 1224",
      label: "Suskun Vasıl falls silent",
      blurb:
        "After seven days of unbroken prayer, the patriarch hears a voice from his own mouth that is not his own. He never speaks aloud again.",
    },
    {
      era: "VS 1239",
      label: "First crack in Hisn-i Sevra",
      blurb:
        "The eastern anchor castle reports an audible fissure. Suskun Vasıl's couriers carry the news to one person in each of the six houses.",
    },
    {
      era: "VS 1247",
      label: "Now",
      blurb:
        "Eighth stratum begins to fracture. The Eight are summoned toward Vâris and then Hisn-i Sevra. The Seventh Oath either holds or is re-signed in blood.",
    },
  ],
  factionsLabel: "Six Houses",
  factions: [
    {
      id: "naerath",
      name: "Hâne Naerath",
      sigil: "★",
      oneLine:
        "Söylenmemiş İmparatorların Hânesi — a fallen imperium kept upright by ritual silence and three competing cliques.",
    },
    {
      id: "asmeyra",
      name: "Hâne Asmeyra",
      sigil: "❦",
      oneLine:
        "Yeşil Andlıların Hânesi — Iramen carvers of a thirty-thousand-year-old kavak city; they tax every cut tree in names.",
    },
    {
      id: "korsend",
      name: "Hâne Korsend",
      sigil: "✶",
      oneLine:
        "Külbağcıların Hânesi — desert houses where ash and memory are the same substance; rulers are also ash-binders.",
    },
    {
      id: "brennvar",
      name: "Hâne Brennvar",
      sigil: "✠",
      oneLine:
        "Demirin Ağzı'nın Hânesi — twenty-seven iron clans whose Bey carries seventeen hundred unspoken war dead in his sleep.",
    },
    {
      id: "velivar",
      name: "Hâne Velivar",
      sigil: "𖠿",
      oneLine:
        "Tuzlu Tahtların Hânesi — coral-throne sea queens; their dynastic transitions are also drowning rituals.",
    },
    {
      id: "vehdarin",
      name: "Hâne Vehdârin",
      sigil: "◆",
      oneLine:
        "Çıplak Kapıların Hânesi — underground kings who never touch the surface; one of them is rethinking the rule.",
    },
  ],
  charactersLabel: "The Eight",
  characters: [
    {
      id: "ardenya",
      name: "Ardenya Korsend",
      role: "Exiled Külbağcı, carrier of the seventh memory glass.",
      blurb:
        "Twenty-seven, half-Sahesh by her mother, exiled three years for inscribing her mother's ash-name into a temple rite she was not authorised to perform.",
    },
    {
      id: "vellan",
      name: "Vellan ehl-i Naerath",
      role: "Monastery vâris, possibly the last emperor.",
      blurb:
        "Nineteen. Has not heard his own voice in two years. Suskun Vasıl told him, once, in a single sentence, who he is — and then never again.",
    },
    {
      id: "brennar",
      name: "Brennar Asmeyra",
      role: "Iramen Bey who refuses the rite of forgetting.",
      blurb:
        "Fifty-one. His two children came back from the forest, three months later they stopped breathing in their sleep. He never carved their names off the city.",
    },
    {
      id: "imira",
      name: "Imira Velivar",
      role: "Hostage princess, sister to a queen, secretly herself.",
      blurb:
        "Twenty-three. Has been editing her own letters home for a year now without yet understanding why.",
    },
    {
      id: "hossen",
      name: "Hossen Brennvar",
      role: "Iron-clans' Bey, keeper of 1,700 names.",
      blurb:
        "Forty-four. Lost his entire raid to a map a Velivar spy altered; the house declared the number 'seven hundred.' He counts the truth every night.",
    },
    {
      id: "suskun-vasil",
      name: "Suskun Vasıl",
      role: "Silent Patriarch, the man who stopped speaking.",
      blurb:
        "Sixty-seven. Heard a voice come out of his own mouth in VS 1224 and has spoken only through proxies since. Knows where Vellan is. Knows Ardenya exists.",
    },
    {
      id: "lethe",
      name: "Lethe",
      role: "Sahesh memory-bearer with no surname.",
      blurb:
        "Thirty. Carries her dead sister's first seven years as if her own. Walks from caravan to caravan because every house in Korsend has refused her.",
    },
    {
      id: "khovan",
      name: "Khovan ehl-i Vehdârin",
      role: "Underground king, gatekeeper of the Naked Doors.",
      blurb:
        "Fifty-eight. Heard a voice through the sealed door of Çıplak Kapılar thirty years ago: 'Have I been forgotten?' He still has not told anyone.",
    },
  ],
  arcsLabel: "Three Acts",
  arcs: [
    {
      id: "act-i",
      name: "I. Perde · Çağrı",
      beats: [
        "Saraab-ı Vehd opens with a death she did not choose to inherit.",
        "Sâkin Vadi sits in silence around a name no monk will say.",
        "Asmeyra's grief and an iron Bey both refuse the same rite.",
        "An ice-lake under Brennvar-Hân moves. A letter is sent that should not have been written.",
      ],
    },
    {
      id: "act-ii",
      name: "II. Perde · Buluşma ve Kırılma",
      beats: [
        "Vâris Şehri, the Hall of Seven Candles. Six houses, no emperor.",
        "Two strangers recognise something in each other across a garden bench.",
        "The fourth crack in Hisn-i Sevra is felt before it is reported.",
        "Brennar tells a truth that costs him his last green ally.",
      ],
    },
    {
      id: "act-iii",
      name: "III. Perde · Yedinci And'ın Yeniden İmzalanması",
      beats: [
        "The walk from Vâris to Hisn-i Sevra is not the longest part.",
        "What stands before the castle is older than the language of the oath.",
        "The cost is paid by the person nobody picked to pay it.",
        "Sonsöz I-VI: six different epilogues, six different shapes of survival.",
      ],
    },
  ],
  topology: {
    centerLabel: "Yedinci And",
    nodes: [
      {
        id: "and",
        label: "Yedinci And",
        ring: "center",
        angleDeg: 0,
        blurb:
          "The Seventh Oath — VS 0. Six of the Sönmeyenler bound, one declared lost. The crack is in Hisn-i Sevra. Drag to rotate · scroll to zoom.",
      },
      // Ring 1 — Six houses, evenly spaced from -90°
      {
        id: "h-naerath",
        label: "Hâne Naerath",
        ring: "primary",
        angleDeg: -90,
        blurb:
          "Söylenmemiş İmparatorların Hânesi. Three cliques, no living emperor, one hidden vâris in a monastery.",
      },
      {
        id: "h-asmeyra",
        label: "Hâne Asmeyra",
        ring: "primary",
        angleDeg: -30,
        blurb:
          "Yeşil Andlıların Hânesi. The kavak-city of Asmeyra-Vehd; every tree-felling is a tax in named names.",
      },
      {
        id: "h-korsend",
        label: "Hâne Korsend",
        ring: "primary",
        angleDeg: 30,
        blurb:
          "Külbağcıların Hânesi. Desert houses where ash IS memory; rulers are simultaneously ash-binders.",
      },
      {
        id: "h-brennvar",
        label: "Hâne Brennvar",
        ring: "primary",
        angleDeg: 90,
        blurb:
          "Demirin Ağzı. Twenty-seven iron clans. Their Bey carries 1,700 sleepless names from a raid the house lied about.",
      },
      {
        id: "h-velivar",
        label: "Hâne Velivar",
        ring: "primary",
        angleDeg: 150,
        blurb:
          "Tuzlu Tahtlar Hânesi. Coral-throne queens of Velemâr; succession ceremonies are also drowning ceremonies.",
      },
      {
        id: "h-vehdarin",
        label: "Hâne Vehdârin",
        ring: "primary",
        angleDeg: 210,
        blurb:
          "Çıplak Kapıların Bekçisi. Underground kings who have never surfaced; one is now reconsidering the rule.",
      },
      // Ring 2 — The Eight, evenly spaced from -90°
      {
        id: "c-ardenya",
        label: "Ardenya",
        ring: "secondary",
        angleDeg: -90,
        blurb:
          "Exiled Külbağcı carrying the seventh memory-glass. Her wrist has seven scars; the seventh hasn't scabbed yet.",
      },
      {
        id: "c-vellan",
        label: "Vellan",
        ring: "secondary",
        angleDeg: -45,
        blurb:
          "Monastery-raised possible last emperor. Has not heard his own voice in two years.",
      },
      {
        id: "c-suskun",
        label: "Suskun Vasıl",
        ring: "secondary",
        angleDeg: 0,
        blurb:
          "The Silent Patriarch. Stopped speaking in VS 1224; the voice he heard then was not his own.",
      },
      {
        id: "c-brennar",
        label: "Brennar",
        ring: "secondary",
        angleDeg: 45,
        blurb:
          "Iramen Bey who never let his two dead children's names be carved off the city.",
      },
      {
        id: "c-imira",
        label: "Imira",
        ring: "secondary",
        angleDeg: 90,
        blurb:
          "Hostage princess of Velivar. Has been editing her own reports for a year without yet knowing why.",
      },
      {
        id: "c-hossen",
        label: "Hossen",
        ring: "secondary",
        angleDeg: 135,
        blurb:
          "Iron-clans' Bey. Counts 1,700 names every night because the house declared seven hundred.",
      },
      {
        id: "c-lethe",
        label: "Lethe",
        ring: "secondary",
        angleDeg: 180,
        blurb:
          "Sahesh memory-bearer with no surname. Half her childhood is her dead sister's.",
      },
      {
        id: "c-khovan",
        label: "Khovan",
        ring: "secondary",
        angleDeg: 225,
        blurb:
          "Underground king of Vehdârin. Heard 'Have I been forgotten?' through a sealed door thirty years ago.",
      },
      // Ring 3 — Forces / sources of harm
      {
        id: "f-sonmeyenler",
        label: "Sönmeyenler",
        ring: "tertiary",
        angleDeg: -90,
        blurb:
          "The Unextinguished. Six bound, one lost, one still without a self. Their names are not said.",
      },
      {
        id: "f-kulbag",
        label: "Külbağ",
        ring: "tertiary",
        angleDeg: -18,
        blurb:
          "Ash-binding magic — born VS 298 in Saraab-ı Vehd. Memory is bound to ash; ash is bound to ash-binders.",
      },
      {
        id: "f-sakin",
        label: "Sâkin-i Vâhid",
        ring: "tertiary",
        angleDeg: 54,
        blurb:
          "The Silent One-God. Worship is silence. The Sâkin Vasıl order is its most severe inheritor.",
      },
      {
        id: "f-yesil-and",
        label: "Yeşil And",
        ring: "tertiary",
        angleDeg: 126,
        blurb:
          "The Green Oath. Iramen do not worship gods; they keep contracts with the forest and carve every breach in stone.",
      },
      {
        id: "f-hafiza",
        label: "Hâfıza Camı",
        ring: "tertiary",
        angleDeg: 198,
        blurb:
          "Memory glass — amber-cast sevr-salt that whispers when touched. A single piece costs a house its annual revenue.",
      },
      {
        id: "f-iron-tongue",
        label: "Demirin Ağzı",
        ring: "tertiary",
        angleDeg: 270,
        blurb:
          "Mouth of Iron. Only iron is real; words, memory, gods are shapes iron is given. Brennvar funeral rite.",
      },
    ],
    edges: [
      // Center → six houses (the oath is carried by all)
      { from: "and", to: "h-naerath" },
      { from: "and", to: "h-asmeyra" },
      { from: "and", to: "h-korsend" },
      { from: "and", to: "h-brennvar" },
      { from: "and", to: "h-velivar" },
      { from: "and", to: "h-vehdarin" },
      // Characters → their house of origin
      { from: "h-naerath", to: "c-vellan" },
      { from: "h-naerath", to: "c-suskun" },
      { from: "h-asmeyra", to: "c-brennar" },
      { from: "h-korsend", to: "c-ardenya" },
      { from: "h-korsend", to: "c-lethe" },
      { from: "h-brennvar", to: "c-hossen" },
      { from: "h-velivar", to: "c-imira" },
      { from: "h-vehdarin", to: "c-khovan" },
      // Houses → forces / inheritances
      { from: "h-naerath", to: "f-sakin" },
      { from: "h-asmeyra", to: "f-yesil-and" },
      { from: "h-korsend", to: "f-kulbag" },
      { from: "h-korsend", to: "f-hafiza" },
      { from: "h-brennvar", to: "f-iron-tongue" },
      { from: "h-vehdarin", to: "f-sonmeyenler" },
      // Latent lineage — the lost entity touches the buried doors
      { from: "f-sonmeyenler", to: "f-kulbag" },
    ],
  },
  engineeringNote:
    "Vanilla ES2018, zero runtime deps. Custom paginator (exponential probe + binary search), inline SVG illuminated atlas, Web Audio drone (49 / 65 / 98 / 196 Hz + 0.13 Hz LFO), versioned localStorage persistence, browser-native PDF export. ~610 KB total payload.",
};

/* ──────────────────────────────────────────────────────────────
 * BOOK II — Codex Mythologica
 * ────────────────────────────────────────────────────────────── */

const MYTHOLOGICA: CodexBook = {
  id: "codex-mythologica",
  slug: "codex-mythologica",
  title: "Codex Mythologica",
  subtitle: "An Illuminated Archive of the Ancient World — Volumen Primum",
  sigil: "Ω",
  inWorldYear: "MMXXVI",
  shippedYear: "2026",
  language: "EN",
  deployUrl: "https://mythology-digital-book.vercel.app/",
  cover: "/codex/codex-mythologica-cover.png",
  atmospheres: [
    { name: "midnight", mood: "deep cobalt vellum" },
    { name: "parchment", mood: "daylight illumination" },
    { name: "obsidian", mood: "polished volcanic" },
  ],
  tagline:
    "Seventy-six illuminated chapters binding nineteen civilisations into one tactile spread.",
  synopsis:
    "Codex Mythologica is a browser-native illuminated codex: seventy-six long-form literary retellings drawn from nineteen mythological traditions — Hellenic, Kemet, Norðr, Yamato, Bharatiya, Ériu, Sumer, Mēxihcah, Romana, Zhōnghuá, Hangug, Maya, Slovjan, Yorùbá / Ashanti / Nyanga, Pārs, Mā'ohi, Inuit, Türk, ʿArab. Eighty-eight thousand words paginated at runtime into hardcover spreads.\n\nIt is built on the conviction that comparative mythology is not an academic taxonomy; it is a single, very old conversation between cultures who never met. Sekhmet's wrath, Inanna's descent, Ragnarök's wolf, Asena guiding a wounded boy out of a valley, the spider Anansi buying every story from the Sky-God — the codex lets these stand next to each other, sigil by sigil, palette by palette, without pretending they are the same thing.\n\nThe engine is the most engineering-dense of the three: ~145 KB of hand-authored runtime, exactly two `.page` elements live in the DOM at any moment, measurement-driven pagination (~7 layout reads per page), 3D `rotateY` page-turns rendered with compositor-safe transform + opacity only, pre-paint Performance Mode classification, browser-native PDF export. Built across ~500 ms cold for the full 446-page document.",
  epigraph:
    "The gods are not extinguished — they have only put on the costumes of stories, and wait for new mouths to speak them again.",
  themes: [
    "Comparative myth",
    "Trickster",
    "Underworld descent",
    "Founding",
    "Cosmic order",
    "Transformation",
    "Hero / monster",
  ],
  atmosphereTint: "rgba(201, 161, 74, 0.10)",
  timeline: [
    {
      era: "c. 3000 BCE",
      label: "Kemet — the silt and the scarab",
      blurb:
        "Pyramid Texts and Coffin Texts. The barque of Ra rolls morning into being; Sekhmet, made of wrath, has to be tricked out of finishing humanity.",
    },
    {
      era: "c. 2100 BCE",
      label: "Sumer — the first written stories",
      blurb:
        "Gilgamesh refuses to die. Inanna walks past seven gates and gives up a garment at each one. Clay tablets remember what kingdoms forget.",
    },
    {
      era: "c. 1500 BCE",
      label: "Bharatiya, Maya, Zhōnghuá",
      blurb:
        "Three civilisations on three continents agree that the cosmos is older than any single creator. Vishnu dreams, Hero Twins descend into Xibalba, a stone monkey learns to break ten thousand laws.",
    },
    {
      era: "c. 1000 BCE",
      label: "Pārs — Simurgh in the healing tree",
      blurb:
        "A bird older than memory keeps a nest of medicine. A king's cup shows the seven climes. A champion kills his son before learning his name.",
    },
    {
      era: "c. 800 BCE – 500 BCE",
      label: "Hellenic, Ériu",
      blurb:
        "Theogony, Iliad, Odyssey. The Otherworld is a mist away. Cú Chulainn cools his battle-frenzy in three vats of water.",
    },
    {
      era: "c. 500 CE",
      label: "Türk — Tengri, Erlik, and Asena",
      blurb:
        "Sky-Father and the dark below. A she-wolf carries a wounded boy out of an inhuman valley and the nation begins there.",
    },
    {
      era: "c. 1300 CE",
      label: "Mēxihcah — five suns",
      blurb:
        "Each previous sun ended in a particular ruin. The fifth requires a covenant of blood to keep turning. Feathered serpents bracket the dawn.",
    },
    {
      era: "2026",
      label: "Folio Edition",
      blurb:
        "All seventy-six chapters bound into one paginated codex. Three themes, five type-scales, browser-native PDF, zero dependencies.",
    },
  ],
  factionsLabel: "Nineteen Civilisations",
  factions: [
    { id: "greek", name: "Hellenic", sigil: "Ω", oneLine: "Capricious gods on Olympus; mortals testing the abyss between order and chaos." },
    { id: "egyptian", name: "Kemet", sigil: "𓂀", oneLine: "Sun-barques, scarab-rolled mornings, the heart weighed in the Hall of Two Truths." },
    { id: "norse", name: "Norðr", sigil: "ᚦ", oneLine: "A doomed pantheon nailed to the World-Tree, waiting for the wolf at the end of winters." },
    { id: "japanese", name: "Yamato", sigil: "神", oneLine: "Kami in every river-stone; sun-sister and storm-brother fighting across rice-fields." },
    { id: "hindu", name: "Bharatiya", sigil: "ॐ", oneLine: "Cosmic ages without count; oceans churned for the nectar of deathlessness." },
    { id: "celtic", name: "Ériu", sigil: "☘", oneLine: "Mist-bound Otherworld islands, salmon of wisdom, battle-frenzy quenched in three vats." },
    { id: "mesopotamian", name: "Sumer", sigil: "𒀭", oneLine: "First written stories on earth; queens who passed seven gates into the dark." },
    { id: "aztec", name: "Mēxihcah", sigil: "☼", oneLine: "Five suns made and unmade; a blood covenant kept so the world might turn." },
    { id: "roman", name: "Romana", sigil: "SPQR", oneLine: "Wolf-suckled twins, household gods at every threshold, an empire of duty." },
    { id: "chinese", name: "Zhōnghuá", sigil: "龍", oneLine: "Five elements under a Jade Court; a stone monkey learning ten thousand changes." },
    { id: "korean", name: "Hangug", sigil: "단", oneLine: "A bear who fasted to become a woman; a princess walking into the underworld for medicine." },
    { id: "mayan", name: "Maya", sigil: "𝋠", oneLine: "Hero Twins descending into Xibalba to play ball against the lords of death." },
    { id: "slavic", name: "Slovjan", sigil: "⚡", oneLine: "Forest crones in chicken-legged huts; a thunder-god still hammering the snake at the root." },
    { id: "african", name: "Yorùbá · Ashanti · Nyanga", sigil: "✺", oneLine: "Anansi bargains for every story; a hero small enough to be kept in his mother's belt." },
    { id: "persian", name: "Pārs", sigil: "𐎩", oneLine: "Simurgh in the tree of medicine; a king's cup showing the seven climes." },
    { id: "polynesian", name: "Mā'ohi", sigil: "ᴥ", oneLine: "Māui fishes islands from the sea on a hook of his grandmother's jaw." },
    { id: "inuit", name: "Inuit", sigil: "ᐃ", oneLine: "Sedna thrown from a kayak becomes the mother of every seal; the raven steals the sun." },
    { id: "turkish", name: "Türk", sigil: "☾", oneLine: "Tengri above, Erlik below, and Asena guiding a wounded boy out of an inhuman valley." },
    { id: "arabian", name: "ʿArab", sigil: "☪", oneLine: "Snake-queens beneath orchards; lovers gone mad in the desert, named for moon and night." },
  ],
  charactersLabel: "Iconic Principals",
  characters: [
    { id: "sekhmet", name: "Sekhmet", role: "Lion-headed daughter of Ra (Kemet).", blurb: "Made of wrath, stopped at the last hour by a flood of red beer." },
    { id: "inanna", name: "Inanna", role: "Queen of the Above and the Below (Sumer).", blurb: "Surrenders one garment at each of seven gates, then hangs as meat for three days." },
    { id: "icarus", name: "Icarus", role: "Boy of wax and warning (Hellenic).", blurb: "Could not bear to look away from the sun." },
    { id: "asena", name: "Asena", role: "She-wolf of the valley (Türk).", blurb: "Carries a wounded boy out of the place no language has names for; a people is founded there." },
    { id: "anansi", name: "Anansi", role: "Spider who bought every story (Yorùbá / Akan).", blurb: "Bargained the Sky-God down to a leopard, a hornets' nest, and a fairy bound in a yam." },
    { id: "amaterasu", name: "Amaterasu", role: "Sun-kami of Yamato.", blurb: "Withdraws into a cave; only laughter outside coaxes the world back into light." },
    { id: "quetzalcoatl", name: "Quetzalcoatl", role: "Feathered Serpent (Mēxihcah).", blurb: "Brackets the dawn; descends and returns; the covenant turns." },
    { id: "fenrir", name: "Fenrir", role: "Bound wolf of Norðr.", blurb: "Will swallow Odin and a moon at the end. Strange that the binding cord was made of impossible things." },
  ],
  arcsLabel: "Recurring Patterns",
  arcs: [
    {
      id: "underworld",
      name: "The Descent",
      beats: [
        "Inanna passes seven gates and gives up a garment at each.",
        "Hero Twins go down into Xibalba to play a deadly ballgame.",
        "Aeneas walks the long parade of unborn Romans.",
        "Bari-gongju walks into the underworld for medicine and returns a shaman.",
      ],
    },
    {
      id: "founding",
      name: "The Founding",
      beats: [
        "Romulus and Remus at a river; one brother does not survive the wall.",
        "Asena guides a wounded boy out of the inhuman valley; a nation begins where they stop.",
        "Dangun is born of a bear who fasted forty days in a cave to become a woman.",
        "Tepeyollotl, jaguar of the heart of the mountain, marks the place where the new sun will rise.",
      ],
    },
    {
      id: "trick",
      name: "The Trick That Saves",
      beats: [
        "Thoth coaxes the Distant Goddess back from the Nubian desert with music.",
        "Anansi reduces the Sky-God's price for every story to three small impossible things.",
        "Loki cuts Sif's hair and pays for it in seven artefacts that hold the world together.",
        "Māui slows the sun by lassoing it to make the day long enough for the people.",
      ],
    },
  ],
  topology: {
    centerLabel: "Codex",
    nodes: [
      {
        id: "codex",
        label: "Codex",
        ring: "center",
        angleDeg: 0,
        blurb:
          "The codex itself — 76 chapters across 19 traditions. The gods have only put on the costumes of stories.",
      },
      // Ring 1 — 8 cardinal civilizations
      { id: "civ-greek",       label: "Hellenic",  ring: "primary", angleDeg: -90, blurb: "Olympus and the abyss between order and chaos." },
      { id: "civ-egyptian",    label: "Kemet",     ring: "primary", angleDeg: -45, blurb: "Sun-barques and the weighing of hearts." },
      { id: "civ-mesopotamian",label: "Sumer",     ring: "primary", angleDeg:   0, blurb: "First written stories. Queens past seven gates." },
      { id: "civ-hindu",       label: "Bharatiya", ring: "primary", angleDeg:  45, blurb: "Cosmic ages without count; oceans churned for amrit." },
      { id: "civ-norse",       label: "Norðr",     ring: "primary", angleDeg:  90, blurb: "The doomed pantheon waiting for Ragnarök's wolf." },
      { id: "civ-aztec",       label: "Mēxihcah",  ring: "primary", angleDeg: 135, blurb: "Five suns. A covenant of blood that keeps the world turning." },
      { id: "civ-japanese",    label: "Yamato",    ring: "primary", angleDeg: 180, blurb: "Kami in every river-stone; sun-sister and storm-brother." },
      { id: "civ-turkish",     label: "Türk",      ring: "primary", angleDeg: 225, blurb: "Tengri above, Erlik below, Asena guiding a wounded boy." },
      // Ring 2 — 8 recurring themes
      { id: "th-descent",     label: "Descent",      ring: "secondary", angleDeg: -90, blurb: "The underworld journey: Inanna, Aeneas, Bari-gongju, Hero Twins." },
      { id: "th-founding",    label: "Founding",     ring: "secondary", angleDeg: -45, blurb: "Romulus & Remus, Dangun & the bear, Asena & the wounded boy." },
      { id: "th-trick",       label: "Trick",        ring: "secondary", angleDeg:   0, blurb: "Anansi, Loki, Māui — saviors who do not look like saviors." },
      { id: "th-transform",   label: "Transformation",ring: "secondary",angleDeg:  45, blurb: "Arachne to spider; the bear to a woman; the monkey to a Buddha." },
      { id: "th-cosmos",      label: "Cosmos",       ring: "secondary", angleDeg:  90, blurb: "Egg-births and World-Trees; five suns and seven climes." },
      { id: "th-hero-monster",label: "Hero/Monster", ring: "secondary", angleDeg: 135, blurb: "Each civilisation makes a hero only to write its monster afterwards." },
      { id: "th-love",        label: "Love",         ring: "secondary", angleDeg: 180, blurb: "Cupid & Psyche; Layla & Majnun; Orpheus turning back." },
      { id: "th-flood",       label: "Flood",        ring: "secondary", angleDeg: 225, blurb: "The water that ended a sun; the ark that floated a covenant." },
      // Ring 3 — 8 iconic stories
      { id: "st-sekhmet",      label: "Sekhmet's Rage", ring: "tertiary", angleDeg: -90, blurb: "Stopped at the last hour by a flood of red beer." },
      { id: "st-inanna",       label: "Inanna's Descent", ring: "tertiary", angleDeg: -45, blurb: "Seven gates, seven garments, three days hanging as meat." },
      { id: "st-icarus",       label: "Icarus", ring: "tertiary", angleDeg: 0, blurb: "Wax wings, a warning, a sun he could not look away from." },
      { id: "st-ragnarok",     label: "Ragnarök", ring: "tertiary", angleDeg: 45, blurb: "Fenrir at last unbound; the gods know who they fight." },
      { id: "st-twins",        label: "Hero Twins", ring: "tertiary", angleDeg: 90, blurb: "Hunahpu and Xbalanque descend to play ball with the lords of Xibalba." },
      { id: "st-asena",        label: "Asena", ring: "tertiary", angleDeg: 135, blurb: "The she-wolf in the valley with no human language." },
      { id: "st-anansi",       label: "Anansi & the Stories", ring: "tertiary", angleDeg: 180, blurb: "A spider buys every story in the world for three impossible things." },
      { id: "st-amaterasu",    label: "Amaterasu in the Cave", ring: "tertiary", angleDeg: 225, blurb: "Only laughter coaxes the sun back out of the dark." },
    ],
    edges: [
      // Center → cardinal civilizations
      { from: "codex", to: "civ-greek" },
      { from: "codex", to: "civ-egyptian" },
      { from: "codex", to: "civ-mesopotamian" },
      { from: "codex", to: "civ-hindu" },
      { from: "codex", to: "civ-norse" },
      { from: "codex", to: "civ-aztec" },
      { from: "codex", to: "civ-japanese" },
      { from: "codex", to: "civ-turkish" },
      // Civilization → primary theme it most carries
      { from: "civ-greek",        to: "th-hero-monster" },
      { from: "civ-egyptian",     to: "th-cosmos" },
      { from: "civ-mesopotamian", to: "th-descent" },
      { from: "civ-mesopotamian", to: "th-flood" },
      { from: "civ-hindu",        to: "th-transform" },
      { from: "civ-norse",        to: "th-cosmos" },
      { from: "civ-aztec",        to: "th-founding" },
      { from: "civ-japanese",     to: "th-transform" },
      { from: "civ-turkish",      to: "th-founding" },
      // Theme → iconic story instances
      { from: "th-hero-monster", to: "st-icarus" },
      { from: "th-hero-monster", to: "st-ragnarok" },
      { from: "th-descent",      to: "st-inanna" },
      { from: "th-descent",      to: "st-twins" },
      { from: "th-cosmos",       to: "st-sekhmet" },
      { from: "th-cosmos",       to: "st-amaterasu" },
      { from: "th-founding",     to: "st-asena" },
      { from: "th-trick",        to: "st-anansi" },
      { from: "th-transform",    to: "st-amaterasu" },
    ],
  },
  engineeringNote:
    "~145 KB hand-authored runtime. Exactly two `.page` elements in the DOM at any time. Measurement-driven pagination (~7 layout reads/page). 3D rotateY page-turn rendered with compositor-safe transform/opacity only. Pre-paint Performance Mode (cores · memory · pointer · reduced-motion). Browser-native PDF. Zero dependencies.",
};

/* ──────────────────────────────────────────────────────────────
 * BOOK III — Solgun Kitabe
 * ────────────────────────────────────────────────────────────── */

const SOLGUN: CodexBook = {
  id: "solgun-kitabe",
  slug: "solgun-kitabe",
  title: "Solgun Kitabe",
  subtitle: "Çöken Varân İmparatorluğu'nun Yasak Arşivi — Cilt-i Evvel",
  sigil: "✠",
  inWorldYear: "Çürüyen Çağ 412 (Yİ. 1599)",
  shippedYear: "2026",
  language: "TR",
  deployUrl: "https://solgun-kitabe.vercel.app/",
  cover: "/codex/solgun-kitabe-cover.png",
  atmospheres: [
    { name: "hisâr", mood: "cathedral-walls" },
    { name: "külgün", mood: "ash-day" },
    { name: "karaöz", mood: "black-eye" },
  ],
  tagline:
    "Fifty-seven entries from a forbidden archive of the empire that did not finish dying.",
  synopsis:
    "Solgun Kitabe is the unpermitted archive of Varân — an Ottoman-Gothic empire whose architect-god, the Solgun Mîmâr, sealed himself inside his own temple eight centuries ago and has not yet woken up. In Yİ. 1187, on the day called the Seven-Day Darkening, the sky closed for seven days. The empire did not end; it began to decay slowly and on purpose, and four hundred years later the Council of Ash still pretends there is a Pâdişâh on the throne.\n\nThe codex collects fifty-seven entries across six categories — eight realms, seventeen creatures, eight orders, twelve relics, five chronicles, seven smuggled manuscripts. A drowned-cathedral sea where five out of six bells still toll under the water. A queen who smiles back from mirrors after they hanged her. A throat-opener who hunts for words that were almost said. A one-holed imperial crown nobody is allowed to wear.\n\nIts engine is the same craft family as the other two: zero dependencies, custom measurement-based paginator with orphan / widow guards, 3D `rotateY` page-turn on capable devices and a strict crossfade on lite mode, three CSS-token themes (hisâr, külgün, karaöz), localStorage persistence, browser-native PDF export through an A4 print-mount with drop-caps and dotted-leader TOC.",
  epigraph:
    "Mîmâr kendi mabedinin altında uyur. Onu uyandıran taşı tutmasın — taş, bir zamanlar onun aviciydi.",
  themes: [
    "Architect-god",
    "Plague & decay",
    "Masked council",
    "Drowned cathedral",
    "Forbidden archive",
    "Imperial Gothic",
    "The throne that nobody sits on",
  ],
  atmosphereTint: "rgba(118, 84, 60, 0.10)",
  timeline: [
    {
      era: "Yİ. 0",
      label: "Yangın",
      blurb:
        "Solgun Mîmâr finishes building the empire and seals himself in his own temple. The calendar begins at this fire.",
    },
    {
      era: "Yİ. 0 – 200",
      label: "Vakt-i Evvel: Doğuş",
      blurb:
        "The Architect's hand visible in every wall. Seven cathedral cities laid out around Hisâr-ı Solgun.",
    },
    {
      era: "Yİ. 200 – 1100",
      label: "Vakt-i Evvel: Kibre Yöneliş",
      blurb:
        "Nine centuries of slow decay. The throne keeps its forms, the orders multiply, the architecture begins to dream against itself.",
    },
    {
      era: "Yİ. 1187",
      label: "Yedi-Gün Kararması — Seven-Day Darkening",
      blurb:
        "The sky closes for seven days. Anyone who looks up loses a part of their mind. Some of the dead stand up. Some of the living lie down. Nobody agrees, even now, which was which.",
    },
    {
      era: "Yİ. 1187 – 1287",
      label: "Çürüyen Çağ: First Century",
      blurb:
        "The Council of Ash — Kül Dîvânı — formalises. Thirty-seven faces under one mask. The throne is never sat on; the throne is never abolished.",
    },
    {
      era: "Yİ. 1287 – 1599",
      label: "Çürüyen Çağ: Now",
      blurb:
        "Three hundred and twelve years of slow waiting. The Plague Reeds are sovereign. The Drowned Cathedrals still toll. Mîmâr has not yet woken.",
    },
  ],
  factionsLabel: "Six Categories",
  factions: [
    { id: "diyar",       name: "Diyârlar",   sigil: "✠", oneLine: "Eight realms — the cathedral cities, drowned seas, plague-marshes, and the mountain of the Cosmic Eye." },
    { id: "mahluk",      name: "Mahlûkât",   sigil: "༅", oneLine: "Seventeen creatures who were once human, saint or divine — now half-living, half-remembered." },
    { id: "tarikat",     name: "Tarîkât",    sigil: "⌖", oneLine: "Eight orders — the Council of Ash, the Seven-Iron Brotherhood, the Plague Preachers, the Silver Archivists." },
    { id: "emanet",      name: "Emânetler",  sigil: "⚸", oneLine: "Twelve relics — none of which is owned. They are carried, they are endured." },
    { id: "vakayiname",  name: "Vakâyiname", sigil: "𓊨", oneLine: "Five chronicles — birth, hubris, the Seven Days, the first ash, the long now." },
    { id: "vesika",      name: "Vesîkalar",  sigil: "✎", oneLine: "Seven manuscripts — an executioner's diary, a queen's last letter, a child's note found beside a well." },
  ],
  charactersLabel: "Principal Figures",
  characters: [
    { id: "mimar", name: "Solgun Mîmâr", role: "Architect-god of Varân.", blurb: "Built seven cathedral cities, sealed himself in his own temple on the day the calendar starts. Still under, still building in his sleep." },
    { id: "kul-divani", name: "Kül Dîvânı", role: "Council of Ash.", blurb: "Thirty-seven faces under one mask. Walk in orbit around the empty throne; never sit on it, never abolish it." },
    { id: "solgun-kardinal", name: "Solgun Kardinal", role: "Pale Cardinal.", blurb: "A bishop still conducting the mass in an abandoned cathedral, four centuries after the congregation died of plague." },
    { id: "gulen-maryam", name: "Gülen Maryam", role: "Smiling Maryam.", blurb: "An executed queen who smiles back from mirrors. She is most polite at dawn." },
    { id: "yedi-demir", name: "Yedi Demir Kardeşliği", role: "Seven-Iron Brotherhood.", blurb: "Headsmen of a sword with a single body and seven mouths. Each mouth has its own oath. Five mouths still keep theirs." },
    { id: "veba-bacilari", name: "Üç Dikenin Bacıları", role: "Sisters of the Three Thorns.", blurb: "Three women who walked into the Plague Reeds, paid for it in their names, and have ruled the marsh ever since." },
    { id: "bogaz-acan", name: "Boğaz-Açan", role: "Throat-Opener.", blurb: "A hunter who follows people for the unsaid sentence. The cut is not the punishment; the cut is the harvest." },
    { id: "gumus-arsivciler", name: "Gümüş Arşivciler", role: "Silver Archivists.", blurb: "Whispering scribes who keep what nobody is allowed to keep. They edit only by adding margins." },
  ],
  arcsLabel: "Six Strata",
  arcs: [
    {
      id: "diyarlar",
      name: "Diyârlar — Realms",
      beats: [
        "Hisâr-ı Solgun — the throne city under seven skins.",
        "Vebâ Kamışları — a plague-marsh ruled by three thorn-sisters.",
        "Karagöz Mabedi Dağı — the Cosmic Eye sleeps on a summit.",
        "Yedikule Okyanusu — drowned cathedrals tolling under the water.",
      ],
    },
    {
      id: "tarikatlar",
      name: "Tarîkât — Orders",
      beats: [
        "Kül Dîvânı walks the orbit of the empty throne.",
        "Yedi Demir Kardeşliği carries the seven-mouthed sword.",
        "Vebâlı Vâizler preach plague as blessing.",
        "Gümüş Arşivciler smuggle margin notes between centuries.",
      ],
    },
    {
      id: "vesikalar",
      name: "Vesîkalar — Fragments",
      beats: [
        "A headsman's diary from the inside of the Seven-Iron sword.",
        "Vâlide-Hâtûn Şirin's last letter, sent three days before the Pale Garden Palace fell.",
        "A child's note found by a well, in a hand nobody could date.",
        "An archivist's silver-ink note in the margin of an older silver-ink note.",
      ],
    },
  ],
  topology: {
    centerLabel: "Solgun Mîmâr",
    nodes: [
      {
        id: "mimar",
        label: "Solgun Mîmâr",
        ring: "center",
        angleDeg: 0,
        blurb:
          "The Architect-God. Built the empire, sealed himself in his temple, still under after eight centuries. The Mahzen-i Asıl is beneath his throne.",
      },
      // Ring 1 — 6 categories
      { id: "cat-diyar",      label: "Diyârlar",   ring: "primary", angleDeg: -90, blurb: "Eight realms — cathedral cities, drowned seas, plague-marshes." },
      { id: "cat-mahluk",     label: "Mahlûkât",   ring: "primary", angleDeg: -30, blurb: "Seventeen half-living creatures — none originally a monster." },
      { id: "cat-tarikat",    label: "Tarîkât",    ring: "primary", angleDeg:  30, blurb: "Eight orders — councils, brotherhoods, archivists, plague-preachers." },
      { id: "cat-emanet",     label: "Emânetler",  ring: "primary", angleDeg:  90, blurb: "Twelve relics — none is owned. They are carried, endured." },
      { id: "cat-vakayiname", label: "Vakâyiname", ring: "primary", angleDeg: 150, blurb: "Five chronicles — birth, hubris, Darkening, first ash, the long now." },
      { id: "cat-vesika",     label: "Vesîkalar",  ring: "primary", angleDeg: 210, blurb: "Seven manuscripts — executioner, queen, archivist, child by a well." },
      // Ring 2 — 8 realms / cathedral cities
      { id: "r-hisar",       label: "Hisâr-ı Solgun",    ring: "secondary", angleDeg: -90, blurb: "Throne-city under seven skins; the seventh laid itself down without hands." },
      { id: "r-veba",        label: "Vebâ Kamışları",    ring: "secondary", angleDeg: -45, blurb: "Plague-marsh under the three thorn-sisters." },
      { id: "r-karagoz",     label: "Karagöz Mabedi",    ring: "secondary", angleDeg:   0, blurb: "Mountain where the Cosmic Eye sleeps; pilgrims remove an eye to enter." },
      { id: "r-daragaci",    label: "Dar-Ağacı Ormanı",  ring: "secondary", angleDeg:  45, blurb: "Petrified forest that swallowed ten thousand noblemen." },
      { id: "r-yedikule",    label: "Yedikule Okyanusu", ring: "secondary", angleDeg:  90, blurb: "Drowned sea; five of six belltowers still toll under the water." },
      { id: "r-kulbas",      label: "Külbaş Dağları",    ring: "secondary", angleDeg: 135, blurb: "Volcanic monastery of the ash-monks; novices burn upward through ranks." },
      { id: "r-solgun-bahce",label: "Solgun-Bahçe",      ring: "secondary", angleDeg: 180, blurb: "The Pale Garden palace, fallen three days after Şirin's last letter." },
      { id: "r-dokuz-mermer",label: "Dokuz Mermer",      ring: "secondary", angleDeg: 225, blurb: "Nine-Marble necropolis where the saray bandosu plays in half-life." },
      // Ring 3 — 8 iconic figures / orders / relics
      { id: "f-divan",        label: "Kül Dîvânı",       ring: "tertiary", angleDeg: -90, blurb: "Thirty-seven faces, one mask, orbiting an empty throne." },
      { id: "f-yedi-demir",   label: "Yedi Demir",       ring: "tertiary", angleDeg: -45, blurb: "Seven-mouthed sword. Each mouth keeps its own oath." },
      { id: "f-kardinal",     label: "Solgun Kardinal",  ring: "tertiary", angleDeg:   0, blurb: "A bishop still conducting mass four centuries after his cathedral emptied." },
      { id: "f-maryam",       label: "Gülen Maryam",     ring: "tertiary", angleDeg:  45, blurb: "Executed queen smiling back from mirrors; most polite at dawn." },
      { id: "f-bogaz",        label: "Boğaz-Açan",       ring: "tertiary", angleDeg:  90, blurb: "Hunter of the sentences that were almost said." },
      { id: "f-arsivciler",   label: "Gümüş Arşivciler", ring: "tertiary", angleDeg: 135, blurb: "Whispering scribes who edit only by adding margins." },
      { id: "f-anahtar",      label: "Mîmâr Anahtarı",   ring: "tertiary", angleDeg: 180, blurb: "Architect's lost key — opens the Mahzen-i Asıl beneath the throne." },
      { id: "f-tac",          label: "Karagöz Tâcı",     ring: "tertiary", angleDeg: 225, blurb: "Imperial crown of a single hole; placed on the wrong head it answers with the hole." },
    ],
    edges: [
      // Center → categories
      { from: "mimar", to: "cat-diyar" },
      { from: "mimar", to: "cat-mahluk" },
      { from: "mimar", to: "cat-tarikat" },
      { from: "mimar", to: "cat-emanet" },
      { from: "mimar", to: "cat-vakayiname" },
      { from: "mimar", to: "cat-vesika" },
      // Realms belong to Diyârlar
      { from: "cat-diyar", to: "r-hisar" },
      { from: "cat-diyar", to: "r-veba" },
      { from: "cat-diyar", to: "r-karagoz" },
      { from: "cat-diyar", to: "r-daragaci" },
      { from: "cat-diyar", to: "r-yedikule" },
      { from: "cat-diyar", to: "r-kulbas" },
      { from: "cat-diyar", to: "r-solgun-bahce" },
      { from: "cat-diyar", to: "r-dokuz-mermer" },
      // Tarîkât → specific orders
      { from: "cat-tarikat", to: "f-divan" },
      { from: "cat-tarikat", to: "f-yedi-demir" },
      { from: "cat-tarikat", to: "f-arsivciler" },
      // Mahlûkât → specific creatures
      { from: "cat-mahluk", to: "f-kardinal" },
      { from: "cat-mahluk", to: "f-maryam" },
      { from: "cat-mahluk", to: "f-bogaz" },
      // Emânetler → specific relics
      { from: "cat-emanet", to: "f-anahtar" },
      { from: "cat-emanet", to: "f-tac" },
      // Realms touched by orders / figures
      { from: "r-hisar",        to: "f-divan" },
      { from: "r-hisar",        to: "f-anahtar" },
      { from: "r-hisar",        to: "f-tac" },
      { from: "r-veba",         to: "f-kardinal" },
      { from: "r-solgun-bahce", to: "f-maryam" },
      { from: "r-dokuz-mermer", to: "f-arsivciler" },
    ],
  },
  engineeringNote:
    "Zero runtime deps. Custom paginator (exponential probe + binary search) with orphan / widow guards. 3D `rotateY` page-turn with curl shadow on capable devices, crossfade on lite. Three CSS-token themes (hisâr / külgün / karaöz). localStorage persistence under `solgun-kitabe:v1:*`. Browser-native PDF via A4 print-mount with drop-caps and dotted-leader TOC. ~5,000 lines of disciplined hand-authored code across four files.",
};

/* ──────────────────────────────────────────────────────────────
 * Index
 * ────────────────────────────────────────────────────────────── */

export const codexBooks: readonly CodexBook[] = [MENDIRAN, MYTHOLOGICA, SOLGUN] as const;

export function getCodexBookBySlug(slug: string): CodexBook | undefined {
  return codexBooks.find((b) => b.slug === slug);
}
