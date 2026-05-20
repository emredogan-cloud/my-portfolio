import { Reveal } from "@/components/ui/Reveal";

/* ──────────────────────────────────────────────────────────────
 *  PhilosophyTiles — V6 Sub-PR 13.4
 *
 *  Extracted from app/about/page.tsx for clarity per V6 § 13.4
 *  spec. The Operating Philosophy section keeps its V5/13.3
 *  asymmetric 1+3 layout (1 tall tile on the left across two
 *  rows + 3 stacked tiles on the right) — the spec calls this
 *  "already correct" and only mandates the extraction.
 *
 *  Pure Server Component. Same Reveal motion pattern as the V5
 *  inline implementation; no behavioural change.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.4.
 * ────────────────────────────────────────────────────────────── */

export interface PhilosophyEntry {
  readonly eyebrow: string;
  readonly body: string;
}

export interface PhilosophyTilesProps {
  readonly philosophy: readonly PhilosophyEntry[];
}

export default function PhilosophyTiles({
  philosophy,
}: PhilosophyTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
      {philosophy.map((p, i) => (
        <Reveal
          key={p.eyebrow}
          duration={0.6}
          delay={i * 0.07}
          y={14}
          margin="-60px"
          className={
            /* The first tile takes the full left column on lg
             * and spans two rows; the other three stack in the
             * right pair across both rows. This is the only
             * asymmetric tile in the about page — the V6 § 13.4
             * spatial-variation pass adds two more asymmetric
             * sections (Principles + Specializations) so the
             * asymmetric move earns its identity through
             * repetition. */
            i === 0
              ? "lg:row-span-2 lg:col-span-1"
              : "lg:col-span-2 lg:max-w-full"
          }
        >
          <div
            className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 md:p-7 h-full transition-colors duration-500 hover:border-white/[0.10] hover:bg-white/[0.025] ${
              i === 0 ? "flex flex-col justify-between min-h-[240px]" : ""
            }`}
          >
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 block mb-3">
              {p.eyebrow}
            </span>
            <p className="text-secondary text-[15px] leading-[1.75]">
              {p.body}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
