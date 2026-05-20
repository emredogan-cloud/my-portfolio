/* ──────────────────────────────────────────────────────────────
 *  V6 Sub-PR 11.3 — Glass-Panel Retirement helpers.
 *
 *  Two small functions return the right className for a card-shaped
 *  container or a rounded-full secondary CTA, branching on the
 *  `NEXT_PUBLIC_V6_GLASS_RETIREMENT` env flag:
 *
 *    Flag OFF (default) → returns the V5 `liquid-glass` /
 *      `glass-panel` className. The deprecated CSS rules in
 *      globals.css continue to render the historical glass
 *      surfaces.
 *
 *    Flag ON → returns `edge-lit-card` / `ghost-outline-button`
 *      from the V6 vocabulary added in this sub-PR.
 *
 *  Spec rollback matrix names the flag `V6_GLASS_RETIREMENT`
 *  (V6 § 8); the implementation uses `NEXT_PUBLIC_V6_GLASS_RETIREMENT`
 *  because consumers cross the server / client boundary (e.g.
 *  HeroSection is a Client Component while project pages are
 *  Server Components). Without the public prefix the server and
 *  client would disagree on the className during hydration.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 1.3.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 11.3.
 * ────────────────────────────────────────────────────────────── */

function isGlassRetirementFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_V6_GLASS_RETIREMENT === "1";
}

/**
 * Card-shaped container surface.
 *
 * - Off-flag: `liquid-glass` (16 px backdrop-blur, semitransparent white).
 * - On-flag:  `edge-lit-card` (solid #0a0a0a, hairline white/6 border,
 *             cyan top-edge hairline rising on hover).
 *
 * Use on rounded-2xl panels (project hub cards, contact form, about
 * specializations).
 */
export function cardSurface(): string {
  return isGlassRetirementFlagOn() ? "edge-lit-card" : "liquid-glass";
}

/**
 * Rounded-full secondary CTA surface.
 *
 * - Off-flag: `glass-panel` (20 px backdrop-blur).
 * - On-flag:  `ghost-outline-button` (transparent, hairline outline,
 *             quiet brighten on hover).
 *
 * Use on rounded-full secondary CTAs (GitHub link, "See the work",
 * "Open the book", hero secondary CTA).
 */
export function secondaryButton(): string {
  return isGlassRetirementFlagOn() ? "ghost-outline-button" : "glass-panel";
}
