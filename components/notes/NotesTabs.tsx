"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import AudioPlayer from "./AudioPlayer";
import type { NoteAudio, NoteDiagram } from "@/data/notes";

/**
 * NotesTabs — minimal Read / Listen / Diagram tab strip for
 * `/notes/[slug]`.
 *
 * V4 Phase 2 — Sub-PR 2.5.
 *
 * Bundle posture (V4 § 5.2.5 < 50 KB delta for xyflow):
 *   - `InteractiveDiagram` is `next/dynamic`-imported with
 *     `ssr: false` so the @xyflow/react chunk only loads in the
 *     browser AND only when the Diagram tab is mounted. The
 *     `loading` skeleton is small and pure-React — keeps the
 *     visitor from staring at an empty box during the chunk
 *     fetch.
 *   - `AudioPlayer` is eager — its bundle cost is a handful of
 *     React hooks and zero third-party imports. Cheap.
 *   - The longform tab content is passed in as a server-
 *     rendered `ReactNode` from the parent page. NotesTabs
 *     never re-renders the Markdown; it just toggles `hidden`.
 *
 * Cinematic identity: mono tab labels, hairline cyan accent on
 * the active tab, same vocabulary as /telemetry / /lab pills.
 *
 * Accessibility: WAI-ARIA tabs pattern — `role="tablist"`,
 * `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`,
 * and `aria-labelledby` wired correctly so screen readers
 * announce the panel switch.
 */

const InteractiveDiagram = dynamic(
  () => import("./InteractiveDiagram"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6"
        style={{ minHeight: 460 }}
      >
        <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
          Loading diagram…
        </span>
      </div>
    ),
  },
);

type TabKey = "read" | "listen" | "diagram";

interface NotesTabsProps {
  slug: string;
  /** The server-rendered Markdown article. NotesTabs receives
   *  it as a JSX node and just toggles its visibility — no
   *  client-side Markdown parsing. */
  readContent: ReactNode;
  audio?: NoteAudio;
  diagram?: NoteDiagram;
}

export default function NotesTabs({
  slug,
  readContent,
  audio,
  diagram,
}: NotesTabsProps) {
  const tabs: { key: TabKey; label: string; available: boolean }[] = [
    { key: "read", label: "Read", available: true },
    { key: "listen", label: "Listen", available: Boolean(audio) },
    { key: "diagram", label: "Diagram", available: Boolean(diagram) },
  ];

  const availableTabs = tabs.filter((t) => t.available);

  /* If there's nothing beyond the read tab, skip the whole tab
   * strip — the page renders identically to the V3 notes
   * layout. Backward-compat across notes without `formats`. */
  if (availableTabs.length === 1) {
    return <>{readContent}</>;
  }

  return <NotesTabsActive
    slug={slug}
    readContent={readContent}
    audio={audio}
    diagram={diagram}
    availableTabs={availableTabs}
  />;
}

function NotesTabsActive({
  slug,
  readContent,
  audio,
  diagram,
  availableTabs,
}: NotesTabsProps & {
  availableTabs: { key: TabKey; label: string }[];
}) {
  const [active, setActive] = useState<TabKey>("read");

  return (
    <>
      {/* TAB STRIP */}
      <div
        role="tablist"
        aria-label="Note format"
        className="mb-7 flex flex-wrap items-center gap-2"
      >
        <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet mr-1">
          Format
        </span>
        {availableTabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              id={`notes-tab-${t.key}`}
              aria-selected={isActive}
              aria-controls={`notes-tabpanel-${t.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={
                isActive
                  ? "px-3 py-1.5 rounded-full border border-[#00d2ff]/40 bg-[#00d2ff]/[0.05] font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/90"
                  : "px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary transition-colors hover:border-white/[0.16] hover:text-secondary"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB PANELS — only the active one renders content. We
          keep the inactive panels in the DOM with `hidden` so
          screen readers and tab key navigation behave correctly,
          but the heavy InteractiveDiagram is conditionally
          rendered behind the next/dynamic boundary so the chunk
          only loads when the Diagram tab actually mounts. */}
      <section
        role="tabpanel"
        id="notes-tabpanel-read"
        aria-labelledby="notes-tab-read"
        hidden={active !== "read"}
      >
        {readContent}
      </section>

      {audio && (
        <section
          role="tabpanel"
          id="notes-tabpanel-listen"
          aria-labelledby="notes-tab-listen"
          hidden={active !== "listen"}
        >
          {active === "listen" && (
            <AudioPlayer
              src={audio.url}
              duration={audio.duration}
              slug={slug}
            />
          )}
        </section>
      )}

      {diagram && (
        <section
          role="tabpanel"
          id="notes-tabpanel-diagram"
          aria-labelledby="notes-tab-diagram"
          hidden={active !== "diagram"}
        >
          {active === "diagram" && (
            <InteractiveDiagram diagram={diagram} slug={slug} />
          )}
        </section>
      )}
    </>
  );
}
