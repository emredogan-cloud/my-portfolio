/**
 * Pulse — lifestyle / operating-adjacent entries shared between the
 * `/pulse` route (V6 Sub-PR 13.5) and the legacy `/about` page's
 * "Outside The Terminal" section (still rendered when V6
 * V6_ABOUT_RESTRUCTURE is off).
 *
 * Single source of truth so the two surfaces never drift. The data
 * shape is intentionally minimal — eyebrow + body + optional href —
 * because the editorial frame around the entries is the work, not
 * the entries themselves.
 *
 * Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.5.
 * Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 4.2 (Outside The Terminal
 * interrupts engineering pacing on /about).
 */

export interface PulseEntry {
  /** Short mono-eyebrow label that opens the tile. */
  readonly eyebrow: string;
  /** Single-paragraph body. Short, observed, specific. */
  readonly body: string;
  /** Optional internal route the eyebrow links to. */
  readonly href?: string;
}

export const pulseEntries: readonly PulseEntry[] = [
  {
    eyebrow: "Training",
    body: "Five sessions a week, an iron-only programme built around the squat, deadlift, and press. Strength as a tax on time, not a sport. The discipline transfers.",
  },
  {
    eyebrow: "The motorcycle",
    body: "Naked sport on the Adana coast roads. The first hour after rain is the cleanest signal a screen will not give back. Helmets clear what monitors do not.",
  },
  {
    eyebrow: "Reading",
    body: "Long-arc texts — Kleppmann, Hennessy & Patterson, distributed-systems papers a generation old. The books that change which problem you ship, not which framework you reach for.",
  },
  {
    eyebrow: "The codex",
    body: "Three handcrafted digital editions — Mendîran, Mythologica, Solgun — each shipped as a zero-dependency reader. Worldbuilding as engineering on a different substrate.",
    href: "/codex",
  },
];
