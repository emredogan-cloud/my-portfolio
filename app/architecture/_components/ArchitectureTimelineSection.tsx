import TimelineSlider from "@/components/v5/TimelineSlider";
import type { EvolutionEvent } from "@/lib/v5/temporal/schema";

/**
 * V5 Phase 7 Sub-PR 7.4 — per-architecture-page timeline
 * section.
 *
 * A small server-rendered shell that wraps the Phase 7.3
 * TimelineSlider on each /architecture/<slug> page. The slider
 * itself is the client island; this component decides:
 *
 *   - WHEN to render (only when the project has at least two
 *     registry events; otherwise the V4 page experience is
 *     preserved without an empty section).
 *   - WHERE to render (hidden below 768px viewport per V5 §
 *     5.2 7.4 spec — mobile users get the V4-equivalent page).
 *   - HOW to caption it (project-aware editorial copy that
 *     reads as a small companion to the scroll-through below).
 *
 * Why a min event count: the slider's playback is a no-op when
 * `frames.length < 2` (you can't scrub between one frame). A
 * single-event project would render a degenerate slider — visible
 * but useless. The 2-event minimum keeps the surface honest.
 *
 * Why no per-project mounted counter: the architecture page itself
 * already counts as a page-visit signal (visible elsewhere in the
 * V4 telemetry); a per-project mounted counter would duplicate
 * what's already observable. Per-project ENGAGED, however, is
 * distinct — it measures whether visitors actually USE the
 * scrubber on that page, which is the V5 § 5.2 7.4 slot.
 *
 * SEO + LCP preservation
 *   - The section is SERVER-RENDERED into the page; crawlers see
 *     the slider's static SSR fallback (an HTML role="slider"
 *     element with the latest event as `aria-valuenow`).
 *   - The default rendered state matches the V4 latest-snapshot
 *     view: the slider's initial cursor = the last event, which
 *     IS the latest architectural state. V4 behavior preserved.
 *   - The section sits AFTER the page header, so the LCP element
 *     (the h1 inside the header) is untouched.
 *   - Mobile (< 768px) hides the section entirely via Tailwind's
 *     `hidden md:block`. Mobile LCP is unchanged from V4.
 *
 * No KV reads happen on this code path. The architecture pages
 * stay STATIC; the slider's engagement signal lives entirely on
 * the client side (sessionStorage dedupe + fire-and-forget POST
 * to /api/v5/temporal/timeline).
 */

interface ArchitectureTimelineSectionProps {
  /** Project slug as it appears in the URL + in the registry's
   *  `system` field. The slider's per-project engagement signal
   *  fires through this slug. */
  slug: string;
  /** Filtered registry slice for this project. The caller is
   *  responsible for calling `getEvolutionEventsBySystem(slug)`;
   *  this component takes the result as-is. */
  events: readonly EvolutionEvent[];
}

const MIN_EVENTS_FOR_SLIDER = 2;

export default function ArchitectureTimelineSection({
  slug,
  events,
}: ArchitectureTimelineSectionProps) {
  /* Insufficient events → render nothing. V4 page experience is
   * preserved verbatim; the slider section is opt-in based on
   * registry coverage. */
  if (events.length < MIN_EVENTS_FOR_SLIDER) return null;

  return (
    <section
      /* `hidden md:block` satisfies V5 § 5.2 7.4: "Timeline
       * slider opt-in (visible on viewport > 768px)". Tailwind's
       * `md:` breakpoint is exactly 768px. Mobile visitors get
       * the V4 page experience verbatim. */
      className="hidden md:block mt-16 mb-12 max-w-3xl"
      aria-label={`Timeline scrubber for ${slug}`}
    >
      <div className="border-t border-white/[0.06] pt-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80 mb-2">
          Memory
        </p>
        <h2 className="text-2xl font-medium tracking-[-0.02em] mb-4 text-primary">
          This system&apos;s evolution
        </h2>
        <p className="text-tertiary text-[14px] leading-relaxed mb-7 max-w-2xl">
          A scrubbable cursor over the architectural events the
          registry remembers about this project. Drag the thumb,
          step with arrows, or hit play to advance the cursor
          back through time. The architecture below remains the
          latest snapshot regardless of cursor position — this
          surface is companion, not replacement. The full
          archive lives at{" "}
          <a
            href={`/evolution?system=${slug}`}
            className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
          >
            /evolution?system={slug}
          </a>
          .
        </p>
        <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 md:p-6">
          <TimelineSlider events={events} context={slug} />
        </div>
      </div>
    </section>
  );
}
