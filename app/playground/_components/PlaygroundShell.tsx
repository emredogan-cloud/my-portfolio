import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Shared chrome for any `/playground/*` route.
 *
 * V4 Phase 5 Sub-PR 5.1. Cousin of `app/lab/_components/ExperimentFrame`
 * but with intentionally distinct vocabulary:
 *   - `/lab` is the public sandbox. "Active" by default. Rate-
 *     limited + cost-capped + cinematic-marketing voice.
 *   - `/playground` is the experimental research surface.
 *     "Disabled" by default. Feature-flag gated. Honest-risk
 *     voice ("may stutter on mobile", "burns CPU").
 *
 * The shell preserves cinematic identity (Geist, #00d2ff, bg-black)
 * but uses an amber tag on the experimental-status pill to signal
 * "this is research, not production". Visitors landing here without
 * a slug see the index; visitors with a slug see whatever the
 * experiment body decides to render.
 *
 * Why a Server Component:
 *   - Pure structural chrome. No state, no event handlers.
 *   - Any future experiment can pass a client island via `children`
 *     using next/dynamic({ ssr: false }) — that's how the
 *     bundle-isolation guarantee is achieved.
 *
 * Reduced motion: the Reveal component already respects the global
 * `prefers-reduced-motion` guard.
 */

interface PlaygroundShellProps {
  /** Top-of-page eyebrow. The third crumb (after "Playground").
   *  Pass "" on the index to omit. */
  crumb?: string;
  /** Two-line hero title. First line is the noun ("Playground"
   *  or the experiment name). Second line is the framing line. */
  title: string;
  /** Quiet second line under the title. */
  tagline: string;
  /** One framing paragraph the page owns. */
  framing: string;
  /** Optional honest-risk caveat — rendered as an amber pill in
   *  the header. Used by individual experiments to set
   *  expectations ("may stutter on mobile", "requires WebGPU"). */
  risk?: string;
  /** The actual experiment body, or the index list, or whatever
   *  the page wants to render. */
  children: ReactNode;
}

export default function PlaygroundShell({
  crumb,
  title,
  tagline,
  framing,
  risk,
  children,
}: PlaygroundShellProps) {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient cyan atmosphere — same gradient stack as /lab and
          /lumina/brain. Visual continuity across the meta surfaces. */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* BREADCRUMB EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            {crumb ? (
              <>
                <Link
                  href="/playground"
                  className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-secondary transition-colors"
                >
                  Playground
                </Link>
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] text-faint"
                >
                  /
                </span>
                <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
                  {crumb}
                </span>
              </>
            ) : (
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
                Playground
              </span>
            )}
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-amber-400/40 bg-amber-400/[0.05] text-amber-300/90"
              title="This is an experimental research surface — different posture than /lab."
            >
              experimental
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-10">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">{title}.</span>
            <span className="block text-white/55">{tagline}</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            {framing}
          </p>
          {risk && (
            <p className="mt-4 inline-block px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/[0.04] font-mono uppercase tracking-[0.18em] text-[10px] text-amber-300/80">
              {risk}
            </p>
          )}
        </Reveal>

        {/* BODY */}
        <Reveal duration={0.7} className="mb-12">
          {children}
        </Reveal>

        {/* FOOTER — honest disclosure of the playground's posture */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-amber-400/60 align-middle"
              />
              <span>Research surface</span>
              <span className="text-faint">·</span>
              <span>Feature-flagged</span>
              <span className="text-faint">·</span>
              <span>Disabled by default</span>
              <span className="text-faint">·</span>
              <span>Phase 5 conditional</span>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
