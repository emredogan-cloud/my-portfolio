"use client";

import { useCapabilities } from "@/lib/playground/capabilities";

/**
 * Hello-playground body — V4 Phase 5 Sub-PR 5.3.
 *
 * The FIRST shell experiment body. Exists to prove the
 * registry → body → switch → lazy-load → mount → capability
 * pipeline works end-to-end. Renders the visitor's capability
 * snapshot as a small mono panel so the operator can use this
 * shell to verify their environment reports the values future
 * experiments will gate on.
 *
 * Posture choices:
 *   - Client component, "use client" at the top so the
 *     useCapabilities hook can run.
 *   - No animation. The constitutional "idle 0% CPU" rule is
 *     trivially satisfied — there are no setInterval, no RAF,
 *     no observers beyond the one inside useCapabilities (which
 *     subscribes to resize + media-query).
 *   - No network. No state beyond what useCapabilities returns.
 *   - Same cinematic vocabulary as the rest of /playground —
 *     mono labels, #00d2ff accents, amber for the experimental
 *     status (the shell renders against the standard
 *     PlaygroundShell chrome).
 *
 * Bundle posture:
 *   This body is reached via `createExperimentBody` (see the
 *   [slug] route). That helper wraps it in
 *   `next/dynamic({ ssr: false })` — so this entire module's
 *   chunk only ships when the visitor actually navigates to
 *   /playground/hello-playground AND the feature flag is on.
 */

export default function HelloPlaygroundBody() {
  const caps = useCapabilities();

  /* useCapabilities returns SERVER_DEFAULTS during the brief
   * pre-mount window. ExperimentMount upstream renders the
   * "checking environment…" placeholder while caps.ready is
   * false — by the time this body renders, caps.ready is true.
   * Defensive check anyway. */
  if (!caps.ready) return null;

  return (
    <div className="space-y-6">
      <p className="text-secondary text-sm leading-relaxed max-w-2xl">
        You are seeing the diagnostic shell. The page itself renders only
        because three gates passed: the slug is registered, its status is{" "}
        <code className="font-mono text-[13px] text-primary">&ldquo;active&rdquo;</code>
        , and the env var{" "}
        <code className="font-mono text-[13px] text-primary">
          PLAYGROUND_FLAG_HELLO_PLAYGROUND
        </code>{" "}
        is set to{" "}
        <code className="font-mono text-[13px] text-primary">&ldquo;1&rdquo;</code>{" "}
        in this environment.
      </p>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-2">
          Capability snapshot
        </p>
        <CapabilityRow
          label="Viewport width"
          value={`${caps.viewportWidth}px`}
        />
        <CapabilityRow
          label="prefers-reduced-motion"
          value={caps.prefersReducedMotion ? "reduce" : "no-preference"}
        />
        <CapabilityRow
          label="WebGPU (navigator.gpu)"
          value={caps.hasWebGPU ? "available" : "unavailable"}
        />
      </div>

      <p className="text-tertiary text-[13px] leading-relaxed max-w-2xl">
        Future experiments declare{" "}
        <code className="font-mono text-[12.5px] text-primary">requirements</code>{" "}
        in the registry; the mount component compares them to the
        values above and either loads the body or renders a fallback.
        This shell has no requirements declared — it renders on every
        environment.
      </p>
    </div>
  );
}

function CapabilityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 items-baseline">
      <span className="font-mono uppercase tracking-[0.16em] text-[10px] text-tertiary">
        {label}
      </span>
      <span className="font-mono text-[13px] text-[#00d2ff]/90">{value}</span>
    </div>
  );
}
