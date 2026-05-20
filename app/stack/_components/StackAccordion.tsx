"use client";

/* ──────────────────────────────────────────────────────────────
 *  StackAccordion — V6 Sub-PR 14.5
 *
 *  Mobile composition for the compressed /stack page. On viewports
 *  below `md` the V5 7-section vertical layout collapses to a
 *  single-column accordion: each category renders as a tappable
 *  row showing index + icon + title + item count. Tap expands
 *  inline to reveal the category's tech items as mono rows.
 *
 *  Reduced-motion: under `prefers-reduced-motion: reduce` every
 *  category renders pre-expanded. The tap remains a real button
 *  for keyboard accessibility but the visual state is unchanged.
 *  Same posture as the V6 14.4 TimelineLadder.
 *
 *  SSR-deterministic initial render: the expanded body is always
 *  in the DOM (with `hidden` class when collapsed) so SSR + first
 *  client paint emit identical HTML — no hydration reflow.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.5
 *            ("Mobile: single-column accordion. Each category
 *             collapsed by default; tap to expand. Reduces 7
 *             stacked sections to ~7 small rows").
 * ────────────────────────────────────────────────────────────── */

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

interface Tech {
  name: string;
  role: string;
}

export interface StackAccordionCategory {
  id: string;
  index: string;
  title: string;
  icon: LucideIcon;
  items: readonly Tech[];
}

interface Props {
  categories: readonly StackAccordionCategory[];
}

/* ── Reduced-motion external store — same pattern as 14.4 ──── */

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  mql.addListener(callback);
  return () => mql.removeListener(callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export default function StackAccordion({ categories }: Props) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (reducedMotion) return;
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [reducedMotion],
  );

  return (
    <ul
      role="list"
      aria-label="Stack categories"
      className="space-y-0 list-none border-t border-white/[0.06]"
    >
      {categories.map((cat) => {
        const expanded = reducedMotion || expandedIds.has(cat.id);
        return (
          <AccordionRow
            key={cat.id}
            category={cat}
            expanded={expanded}
            onToggle={() => handleToggle(cat.id)}
          />
        );
      })}
    </ul>
  );
}

interface RowProps {
  category: StackAccordionCategory;
  expanded: boolean;
  onToggle: () => void;
}

function AccordionRow({ category, expanded, onToggle }: RowProps) {
  const Icon = category.icon;
  const itemCount = category.items.length;
  const bodyId = `stack-accordion-body-${category.id}`;

  return (
    <li className="border-b border-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="group flex items-center w-full text-left gap-3 py-4 px-1"
      >
        <span className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/80 shrink-0 w-6">
          {category.index}
        </span>
        <Icon
          className="w-4 h-4 text-[#00d2ff]/65 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="text-primary text-[15px] font-medium leading-tight flex-1 pr-2">
          {category.title}
        </span>
        <span className="font-mono text-[10px] text-quiet uppercase tracking-[0.2em] shrink-0">
          {itemCount}
        </span>
        <Chevron expanded={expanded} />
      </button>

      {/* Body — always in DOM (with `hidden` class when collapsed) so SSR
          + client first paint emit identical HTML and no layout reflow
          happens on hydration. */}
      <div
        id={bodyId}
        className={
          expanded
            ? "pl-10 pr-2 pb-5 pt-1"
            : "hidden"
        }
      >
        <ul className="space-y-2.5 list-none">
          {category.items.map((tech) => (
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
    </li>
  );
}

function Chevron({ expanded }: { expanded: boolean }): ReactNode {
  return (
    <svg
      viewBox="0 0 12 12"
      width={10}
      height={10}
      aria-hidden="true"
      className={
        expanded
          ? "shrink-0 text-[#00d2ff]/85 rotate-180 transition-transform duration-200"
          : "shrink-0 text-quiet group-hover:text-tertiary transition-all duration-200"
      }
    >
      <path
        d="M2 4l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
