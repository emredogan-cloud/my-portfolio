import TimelineSlider from "@/components/v5/TimelineSlider";
import TimelineLadder from "@/components/v5/TimelineLadder";
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

  /* V6 14.4 — mobile timeline ladder gate.
   *
   * Pre-14.4 the entire section was hidden below 768 px (`hidden
   * md:block`). Audit § 6.3 flagged this as a BLOCKER: the most
   * distinctive temporal interaction in the codebase was mobile-
   * invisible, and recruiters frequently view from phones.
   *
   * When V6_TIMELINE_LADDER is on, the section becomes always-
   * visible. Inside the section, the slider stays desktop-only
   * (its drag-to-scrub UX doesn't translate to one-thumb scroll);
   * the ladder takes its place on mobile with the same data
   * shape, the same engagement telemetry, and an inline tap-to-
   * expand interaction appropriate to the viewport.
   *
   * Flag off → section behaves verbatim per V5 (mobile-hidden);
   * the new <TimelineLadder> tree is dead code but tree-shaken
   * out of the production bundle since the conditional below
   * evaluates statically at build time. */
  const ladderEnabled =
    process.env.NEXT_PUBLIC_V6_TIMELINE_LADDER === "1";

  return (
    <section
      className={
        ladderEnabled
          ? "mt-16 mb-12 max-w-3xl"
          : "hidden md:block mt-16 mb-12 max-w-3xl"
      }
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
          {ladderEnabled ? (
            <>
              The architectural events the registry remembers about
              this project. On desktop, drag the scrubber, step with
              arrows, or hit play to advance the cursor back through
              time. On mobile, tap each marker to read its rationale.
              The architecture below remains the latest snapshot
              regardless of cursor position — this surface is
              companion, not replacement.
            </>
          ) : (
            <>
              A scrubbable cursor over the architectural events the
              registry remembers about this project. Drag the thumb,
              step with arrows, or hit play to advance the cursor
              back through time. The architecture below remains the
              latest snapshot regardless of cursor position — this
              surface is companion, not replacement.
            </>
          )}{" "}
          The full archive lives at{" "}
          <a
            href={`/evolution?system=${slug}`}
            className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
          >
            /evolution?system={slug}
          </a>
          .
        </p>

        {/* Desktop slider — preserved verbatim from V5.
            When the ladder flag is off, the legacy `hidden md:block`
            section wraps the slider; it remains the only timeline
            surface and stays desktop-only. When the ladder flag is
            on, the slider keeps its desktop-only gate at the inner
            block level (`hidden md:block`); the ladder takes the
            mobile slot via the complementary `md:hidden`. */}
        <div
          className={
            ladderEnabled
              ? "hidden md:block border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 md:p-6"
              : "border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 md:p-6"
          }
        >
          <TimelineSlider events={events} context={slug} />
        </div>

        {/* Mobile ladder — only rendered when the ladder flag is on.
            Sits in the complementary md:hidden slot so the section
            is filled on every viewport without duplicating the
            engagement signal in the DOM. */}
        {ladderEnabled ? (
          <div className="md:hidden border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
            <TimelineLadder events={events} context={slug} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
