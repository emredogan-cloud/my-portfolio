/* ──────────────────────────────────────────────────────────────
 *  Pill — V6 Sub-PR 11.2
 *
 *  A typed pill vocabulary that replaces the ad-hoc chip soup
 *  (`border-white/10 bg-white/5 rounded-full` everywhere) and
 *  retires the emerald/blue/purple status palette that broke the
 *  closed cyan + white-opacity identity.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md §§ 1.2, 1.5, 5.1, 9.1.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 11.2.
 *
 *  Server Component. The state-live pulse case mounts the small
 *  `<PillPulseDot>` Client island. Every other kind is pure CSS.
 *
 *  Rollback: env flag V6_PILL_VOCABULARY. Default OFF — the
 *  component renders the legacy chip className passed via the
 *  `legacy` prop per call site, so flipping the flag off restores
 *  the pre-V6 visual contract everywhere.
 *
 *  The "rounded-full pill in a bordered container" container is
 *  retired for `state-*` and `filter-*` per the spec. State and
 *  filter now read through visual weight (dot, ring, underline,
 *  dim) — not container shape.
 * ────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import PillPulseDot from "./PillPulseDot";

export type PillKind =
  | "state-live"
  | "state-building"
  | "state-planning"
  | "state-archived"
  | "meta"
  | "filter-active"
  | "filter-inactive"
  | "timestamp";

export interface PillProps {
  kind: PillKind;
  children: ReactNode;
  /**
   * Legacy className string rendered when `V6_PILL_VOCABULARY` is off.
   * Preserves the pre-V6 visual contract per call site. If omitted, the
   * canonical chip (`border-white/10 bg-white/5 rounded-full`) is rendered.
   */
  legacy?: string;
  /**
   * For `state-live` only: enables the cyan dot's breathing pulse via the
   * `<PillPulseDot>` client island. Reduced-motion safe (static dot).
   * Ignored for other kinds.
   */
  pulse?: boolean;
  /** Pulse phase delay in seconds — staggers concurrent pulses. */
  pulseDelay?: number;
  /** Forwarded to the rendered outer `<span>` for layout positioning. */
  className?: string;
  /** Forwarded `title` attribute for hover tooltips on the rendered span. */
  title?: string;
}

/**
 * Pill is imported by both Server Components (project pages, lab hub,
 * v5/operating) and Client Components (HeroSection, CertificationRadar,
 * ArchitectureHubGrid). For the flag to read coherently on both sides
 * at build time and avoid hydration mismatch, the env var must be
 * prefixed `NEXT_PUBLIC_` so Next.js inlines it everywhere.
 *
 * Spec rollback matrix names the flag `V6_PILL_VOCABULARY` (V6 § 8).
 * Implementation uses the public variant.
 */
function isPillFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_V6_PILL_VOCABULARY === "1";
}

const LEGACY_FALLBACK_CHIP =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary";

function cx(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export default function Pill({
  kind,
  children,
  legacy,
  pulse,
  pulseDelay,
  className,
  title,
}: PillProps) {
  if (!isPillFlagOn()) {
    return (
      <span className={cx(legacy ?? LEGACY_FALLBACK_CHIP, className)} title={title}>
        {children}
      </span>
    );
  }

  switch (kind) {
    case "state-live":
      return (
        <span
          className={cx(
            "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#00d2ff]",
            className,
          )}
          title={title}
        >
          {pulse ? (
            <PillPulseDot delay={pulseDelay} />
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shrink-0"
              aria-hidden="true"
            />
          )}
          {children}
        </span>
      );

    case "state-building":
      return (
        <span
          className={cx(
            "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#00d2ff]/85",
            className,
          )}
          title={title}
        >
          <span
            className="w-1.5 h-1.5 rounded-full border border-[#00d2ff] shrink-0"
            aria-hidden="true"
          />
          {children}
        </span>
      );

    case "state-planning":
      return (
        <span
          className={cx(
            "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary",
            className,
          )}
          title={title}
        >
          <span
            className="w-1.5 h-1.5 rounded-full border border-white/20 shrink-0"
            aria-hidden="true"
          />
          {children}
        </span>
      );

    case "state-archived":
      return (
        <span
          className={cx(
            "inline-flex items-center text-[10px] font-mono uppercase tracking-[0.18em] text-quiet",
            className,
          )}
          title={title}
        >
          {children}
        </span>
      );

    case "meta":
      return (
        <span
          className={cx(
            "inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/[0.12] text-[10px] font-mono uppercase tracking-[0.14em] text-tertiary",
            className,
          )}
          title={title}
        >
          {children}
        </span>
      );

    case "filter-active":
      return (
        <span
          className={cx(
            "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#00d2ff] border-b border-dotted border-[#00d2ff]/60 pb-0.5",
            className,
          )}
          title={title}
        >
          {children}
        </span>
      );

    case "filter-inactive":
      return (
        <span
          className={cx(
            "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary border-b border-dotted border-transparent hover:border-white/30 pb-0.5 transition-colors",
            className,
          )}
          title={title}
        >
          {children}
        </span>
      );

    case "timestamp":
      return (
        <span
          className={cx(
            "font-mono uppercase tracking-[0.18em] text-[10px] text-quiet",
            className,
          )}
          title={title}
        >
          {children}
        </span>
      );
  }
}
