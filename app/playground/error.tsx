"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Error boundary for the entire /playground subtree.
 *
 * V4 Phase 5 Sub-PR 5.1. The playground is research surface — a
 * failure here MUST NOT bubble up to the global root error
 * boundary and contaminate the rest of the site. This file
 * catches anything thrown inside `/playground/*` and renders a
 * calm operator-grade fallback in the same cinematic vocabulary
 * as the rest of the platform.
 *
 * Next.js App Router convention: an `error.tsx` at a route segment
 * boundary creates a client-only React Error Boundary that wraps
 * the segment's children. The `reset` callback re-renders the
 * segment when clicked.
 */

interface PlaygroundErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlaygroundError({
  error,
  reset,
}: PlaygroundErrorProps) {
  /* Surface the error to the browser console with the experiment
   * digest if Next.js attached one. Operator can grep the server
   * logs for the matching digest. */
  useEffect(() => {
    if (error?.digest) {
      console.error(`[playground] error digest: ${error.digest}`);
    }
    console.error("[playground] error:", error);
  }, [error]);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
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
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-amber-300/80">
              Error
            </span>
          </div>
        </Reveal>

        <Reveal mode="mount" duration={0.8} className="mb-10">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Experiment crashed.</span>
            <span className="block text-white/55">Rest of the site is fine.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            This is research surface — failure modes are expected
            and isolated. Nothing about the platform&apos;s
            production paths is affected.
          </p>
        </Reveal>

        <Reveal duration={0.7} className="mb-10">
          <div className="font-mono text-[12.5px] bg-white/[0.02] border border-amber-400/[0.15] rounded-xl p-5 text-secondary space-y-2">
            <div className="text-amber-300/80">
              {error?.name ?? "Error"}: {error?.message ?? "Unknown failure"}
            </div>
            {error?.digest && (
              <div className="text-tertiary text-[11px]">
                digest: {error.digest}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal duration={0.7}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00d2ff]/40 bg-[#00d2ff]/[0.05] text-[#00d2ff] hover:bg-[#00d2ff]/[0.10] transition-colors font-mono uppercase tracking-[0.18em] text-[10px]"
            >
              Retry experiment
            </button>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.02] text-tertiary hover:text-primary hover:bg-white/[0.04] transition-colors font-mono uppercase tracking-[0.18em] text-[10px]"
            >
              ← Playground index
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
