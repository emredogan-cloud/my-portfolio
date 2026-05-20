/* ──────────────────────────────────────────────────────────────
 *  StackLane — V6 Sub-PR 14.5
 *
 *  Single category lane for the compressed /stack composition.
 *  Replaces the V5 TechCard's bordered chip rendering with a
 *  mono lane structure: small index + icon + title at the top,
 *  tech items stacked beneath as plain mono rows (name + tiny
 *  role line, no chip container).
 *
 *  Used in the V6 desktop 4-col lane grid and the V6 tablet 2-col
 *  lane grid. The mobile accordion (StackAccordion) builds its
 *  collapsible rows from the same data shape but renders the
 *  item list inline only when expanded.
 *
 *  Server Component. No client JS. No motion. Reduced-motion safe
 *  by construction.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.5
 *            ("4-column grid where each lane is a category … tech
 *             items stack beneath in mono-rendered rows — no chip
 *             containers — just the name + tiny role line").
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 9.1 ("7 identical category
 *             sections", "Stack chips visually identical to Project
 *             chips").
 * ────────────────────────────────────────────────────────────── */

import type { LucideIcon } from "lucide-react";

interface Tech {
  name: string;
  role: string;
}

interface Props {
  index: string;
  title: string;
  icon: LucideIcon;
  items: readonly Tech[];
}

export default function StackLane({ index, title, icon: Icon, items }: Props) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 w-8 h-px bg-[#00d2ff]/30"
      />
      <div className="pt-5 mb-5 flex items-center gap-2.5">
        <span className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/85">
          {index}
        </span>
        <Icon
          className="w-3.5 h-3.5 text-[#00d2ff]/65"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h3 className="text-primary text-[15px] font-medium leading-tight">
          {title}
        </h3>
      </div>
      <ul className="space-y-2.5 list-none">
        {items.map((tech) => (
          <li key={tech.name}>
            <p className="text-secondary font-mono text-[13px] tracking-tight leading-tight">
              {tech.name}
            </p>
            <p className="text-quiet text-[11px] mt-0.5 leading-tight">
              {tech.role}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
