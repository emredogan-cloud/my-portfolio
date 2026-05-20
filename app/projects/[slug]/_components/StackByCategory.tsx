/* ──────────────────────────────────────────────────────────────
 *  StackByCategory — V6 Sub-PR 14.2
 *
 *  Replaces the flat-chip tech-stack list with a 2-col category
 *  layout (Frontend / Backend / Data / AI / Identity / etc.). Per
 *  spec: categories are already implicit in the project data;
 *  this component surfaces them.
 *
 *  Each category renders as a column with a mono uppercase title
 *  and tech items as inline mono rows beneath — no chip
 *  containers, no glass shells. Reads as a structured spec sheet,
 *  not a chip soup.
 *
 *  Server Component. No client JS. Graceful fallback: when a
 *  project lacks `stackByCategory`, the parent renders the V5
 *  flat chip list instead (spec validation: "Tech-stack
 *  categories work without backfill in data file").
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.2.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 5.3 ("chips, again. Same
 *             pattern as the hub. Same chips everywhere.").
 * ────────────────────────────────────────────────────────────── */

import type { ProjectStackCategory } from "@/data/projects";

interface Props {
  categories: readonly ProjectStackCategory[];
}

export default function StackByCategory({ categories }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
      {categories.map((cat) => (
        <div key={cat.category} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 w-8 h-px bg-[#00d2ff]/30"
          />
          <p className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/85 pt-4 mb-3">
            {cat.category}
          </p>
          <ul className="space-y-1.5">
            {cat.items.map((item) => (
              <li
                key={item}
                className="font-mono text-[13px] tracking-tight text-secondary leading-snug"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
