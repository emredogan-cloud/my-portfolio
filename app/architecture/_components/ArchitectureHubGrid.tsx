"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, X } from "lucide-react";

/**
 * ArchitectureHubGrid — the interactive surface of /architecture.
 *
 * Two kinds of cards:
 *
 *   state === "ready"            → <Link> that navigates to
 *                                  /architecture/{slug}.
 *   state === "in-development"   → <button> that opens a
 *   state === "concept"             "drafting" modal instead of
 *                                  routing to a 404.
 *
 * The "ready" cards keep the cyan hover ring + "Walk through →"
 * affordance from the prior server-only version. The two
 * "drafting" cards swap that affordance for a status badge —
 * "Development Started" or "Concept Phase" — and explain on tap
 * that the full scroll story isn't ready yet.
 *
 * Modal is intentionally small: project name, status, two
 * sentences, a "Got it" button. ESC + backdrop-click both close.
 */

export interface HubEntry {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  stack: readonly string[];
  state: "ready" | "in-development" | "concept";
}

const STATE_LABEL: Record<HubEntry["state"], string> = {
  ready: "Walk through",
  "in-development": "Development Started",
  concept: "Concept Phase",
};

interface Props {
  entries: readonly HubEntry[];
}

export default function ArchitectureHubGrid({ entries }: Props) {
  const [modalEntry, setModalEntry] = useState<HubEntry | null>(null);

  useEffect(() => {
    if (!modalEntry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalEntry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalEntry]);

  return (
    <>
      <section
        aria-label="Project architecture stories"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
      >
        {entries.map((entry) =>
          entry.state === "ready" ? (
            <ReadyCard key={entry.slug} entry={entry} />
          ) : (
            <DraftingCard
              key={entry.slug}
              entry={entry}
              onOpen={() => setModalEntry(entry)}
            />
          ),
        )}
      </section>

      <AnimatePresence>
        {modalEntry && (
          <DraftingModal
            entry={modalEntry}
            onClose={() => setModalEntry(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Ready card ─────────────────────────────────────────────────── */

function ReadyCard({ entry }: { entry: HubEntry }) {
  return (
    <Link
      href={`/architecture/${entry.slug}`}
      className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 transition-all duration-300 hover:border-[#00d2ff]/30 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/30 min-h-[320px]"
    >
      <Eyebrow>{entry.eyebrow}</Eyebrow>
      <CardTitle>{entry.title}</CardTitle>
      <Tagline>{entry.tagline}</Tagline>
      <StackPills tags={entry.stack} />
      <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 group-hover:text-[#00d2ff] transition-colors">
        {STATE_LABEL.ready}
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

/* ── Drafting card (PawDoc / Aevum) ─────────────────────────────── */

function DraftingCard({
  entry,
  onOpen,
}: {
  entry: HubEntry;
  onOpen: () => void;
}) {
  const badgeLabel = STATE_LABEL[entry.state];
  const badgeTone =
    entry.state === "in-development"
      ? "border-[#00d2ff]/25 bg-[#00d2ff]/[0.06] text-[#00d2ff]/85"
      : "border-white/[0.12] bg-white/[0.04] text-white/55";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col text-left rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-7 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/30 min-h-[320px]"
    >
      <Eyebrow>{entry.eyebrow}</Eyebrow>
      <CardTitle>{entry.title}</CardTitle>
      <Tagline>{entry.tagline}</Tagline>
      <StackPills tags={entry.stack} />
      <div className="mt-6 inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${badgeTone}`}
        >
          <span
            className={`w-1 h-1 rounded-full ${
              entry.state === "in-development"
                ? "bg-[#00d2ff]"
                : "bg-white/40"
            }`}
            aria-hidden="true"
          />
          {badgeLabel}
        </span>
      </div>
    </button>
  );
}

/* ── Shared card subcomponents ─────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/85">
      {children}
    </p>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-tight text-white">
      {children}
    </h2>
  );
}

function Tagline({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-sm leading-relaxed text-white/55 flex-grow">
      {children}
    </p>
  );
}

function StackPills({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/60 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

/* ── Drafting modal ─────────────────────────────────────────────── */

function DraftingModal({
  entry,
  onClose,
}: {
  entry: HubEntry;
  onClose: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.title} architecture status`}
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        className="relative max-w-md w-full rounded-2xl border border-white/[0.10] bg-[#0a0a0a]/95 p-7"
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 6 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          boxShadow:
            "0 32px 80px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 text-white/40 hover:text-white/85 transition-colors rounded-full"
          aria-label="Close"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/85">
          {entry.eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">
          {entry.title}
        </h3>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55">
          {STATE_LABEL[entry.state]}
        </span>

        <p className="mt-5 text-sm leading-relaxed text-white/65">
          Architecture design is currently being drafted. A full
          scroll-through walkthrough will appear here once {entry.title}{" "}
          reaches alpha — the same shape as the other stories in this
          hub.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-white/40">
          Want to follow the build?{" "}
          <Link
            href="/contact"
            className="text-[#00d2ff]/85 hover:text-[#00d2ff] underline-offset-4 hover:underline"
            onClick={onClose}
          >
            Drop a line on /contact
          </Link>{" "}
          and I'll let you know when the writeup lands.
        </p>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-semibold px-5 min-h-[44px] hover:bg-white/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
