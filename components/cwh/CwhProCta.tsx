import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * CWH Pro CTA — native, inline call-to-action used on both
 * /projects/aws-waste-hunter and /architecture/cloud-waste-hunter.
 *
 * Discovery posture:
 *   /pro is intentionally NOT in the global navbar. Visitors find
 *   it via the CWH project context or via Lumina suggesting it.
 *   This card is the canonical "from case study → buy" jump,
 *   placed at the end of each CWH page so it reads as the natural
 *   next step after the architectural narrative.
 *
 * Visual identity:
 *   Single full-width card, cyan-accented border, cyan glow.
 *   Matches the ProductionMetrics tile family but louder — this
 *   is the conversion surface, not an info tile.
 *
 * Server Component — pure markup + a Link. No client state.
 */
export default function CwhProCta() {
  return (
    <section
      aria-label="Cloud Waste Hunter Pro"
      className="mt-14 pt-10 border-t border-white/[0.08]"
    >
      <div
        className="relative rounded-2xl overflow-hidden border border-[#00d2ff]/25 bg-[#00d2ff]/[0.03] p-6 sm:p-8"
        style={{
          boxShadow:
            "inset 0 0 60px rgba(0, 210, 255, 0.04), 0 0 40px rgba(0, 210, 255, 0.06)",
        }}
      >
        {/* Subtle cyan blob anchored to the right — gives the card
            depth without competing with the message. */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 w-[420px] h-[420px] rounded-full blur-[140px]"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/85">
              CWH Pro · cloudwastehunter.io
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-tight text-primary">
              Want the same scanner pointed at your own AWS account?
            </h3>
            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              Same scanner, same Bedrock remediation, same EventBridge
              schedule. Plus and Pro tiers add multi-account, API
              access, and SSO; Free starts you on a single account
              with no card required.
            </p>
          </div>

          <Link
            href="/pro"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 min-h-[44px] hover:bg-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/40"
          >
            Explore CWH Pro
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
