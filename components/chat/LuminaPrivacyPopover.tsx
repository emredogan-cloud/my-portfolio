"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Database, Eraser } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  memoryOptOut: boolean;
  onMemoryToggle: () => void;
  onForgetMe: () => void;
}

/**
 * V6 Sub-PR 15.5 — Privacy popover.
 *
 * Clusters the two privacy controls (memory toggle + forget
 * conversation) behind a single hairline-bordered trigger so the
 * LuminaWindow header reads as four elements instead of five:
 *   title + status + Privacy + Close
 *
 * The trigger carries a small cyan dot + "Privacy" label and the
 * existing aria-label vocabulary; the popover panel keeps the
 * Database / Eraser icons + each control's original aria-label /
 * title strings verbatim so the SR + tooltip contract from Sub-PR 4.4
 * / Forget-Me is preserved.
 *
 * Focus behavior:
 *   - Tab from the trigger when the popover is closed → next header
 *     element (Close), exactly as the V5 strip.
 *   - Open the popover → focus moves to the first focusable element
 *     inside the panel (Memory toggle).
 *   - Tab from the last item cycles to the first; Shift+Tab from the
 *     first cycles to the last (keyboard-trappable per spec gate #2).
 *   - ESC closes the popover and returns focus to the trigger.
 *   - Mousedown outside the popover (excluding the trigger) closes it.
 *
 * Action behavior:
 *   - Memory toggle: does NOT close the popover. The visitor sees the
 *     state hint flip in place (ON ↔ OFF). They close manually when
 *     done. Matches the V5 in-strip toggle's "flip and keep going"
 *     UX without spawning extra dismissal motion.
 *   - Forget conversation: DOES close the popover. The user has
 *     committed to a destructive action; closing the popover signals
 *     completion.
 */
export default function LuminaPrivacyPopover({
  memoryOptOut,
  onMemoryToggle,
  onForgetMe,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const memoryButtonRef = useRef<HTMLButtonElement>(null);
  const forgetButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    /* Return focus to the trigger so keyboard users land where they
       started, matching the WAI-ARIA Authoring Practices menu-button
       pattern. */
    triggerRef.current?.focus();
  }, []);

  /* ESC + click-outside dismiss. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, close]);

  /* Move focus into the popover when it opens. */
  useEffect(() => {
    if (!open) return;
    /* Defer one tick so the panel is in the DOM before focus. */
    const t = setTimeout(() => {
      memoryButtonRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  /* Keyboard trap inside the panel — Tab from last cycles to first;
     Shift+Tab from first cycles to last. */
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const first = memoryButtonRef.current;
    const last = forgetButtonRef.current;
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="relative">
      {/* Trigger — cyan dot + "Privacy" label, hairline-bordered pill.
          py-2.5 (10 + 16 + 10 + 2 border = 38px visual) + -my-1
          (extends ±4 px) = 46 px hit target, above the WCAG 2.5.5
          AAA 44 × 44 minimum. */}
      <button
        ref={triggerRef}
        id="lumina-privacy-trigger"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="lumina-privacy-popover-panel"
        aria-label="Privacy controls"
        title="Privacy — memory + forget"
        className={[
          "inline-flex items-center gap-1.5 px-3 py-2.5 -my-1 rounded-full",
          "border transition-colors duration-200",
          "text-[11px] uppercase tracking-widest font-medium",
          open
            ? "border-[#00d2ff]/45 text-primary"
            : "border-white/[0.10] text-tertiary hover:text-primary hover:border-white/[0.18]",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_rgba(0,210,255,0.6)]"
        />
        <span>Privacy</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="lumina-privacy-popover-panel"
            role="menu"
            aria-labelledby="lumina-privacy-trigger"
            ref={panelRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            onKeyDown={onPanelKeyDown}
            className="absolute right-0 top-full mt-2 z-20 w-64 rounded-xl border border-white/[0.10] bg-[#0a0a0a] p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)]"
            style={{
              boxShadow:
                "0 18px 40px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,210,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Memory toggle row.
                px-3 py-3 = 12+content+12 ≥ 44 px vertical hit. */}
            <button
              ref={memoryButtonRef}
              role="menuitemcheckbox"
              type="button"
              onClick={onMemoryToggle}
              aria-checked={!memoryOptOut}
              aria-label={
                memoryOptOut
                  ? "Conversation memory — currently off, tap to enable"
                  : "Conversation memory — currently on, tap to disable"
              }
              title={
                memoryOptOut
                  ? "Memory off — chat is not persisted (tap to enable)"
                  : "Memory on — 14-day persistence with PII redacted (tap to disable)"
              }
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors hover:bg-white/[0.04] focus:bg-white/[0.04] focus:outline-none"
            >
              <Database
                className={`w-4 h-4 flex-shrink-0 ${
                  memoryOptOut ? "text-amber-300/80" : "text-tertiary"
                }`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-primary">Memory</span>
                  <span
                    className={`text-[10px] uppercase tracking-widest ${
                      memoryOptOut ? "text-amber-300/80" : "text-tertiary"
                    }`}
                  >
                    {memoryOptOut ? "Off" : "On"}
                  </span>
                </div>
                <span className="text-[11px] text-quiet block mt-0.5 leading-snug">
                  {memoryOptOut
                    ? "Chat is not persisted."
                    : "14-day persistence, PII redacted."}
                </span>
              </div>
            </button>

            {/* Forget row.
                Closes the popover after activation — the action is a
                committed end-state. */}
            <button
              ref={forgetButtonRef}
              role="menuitem"
              type="button"
              onClick={() => {
                onForgetMe();
                close();
              }}
              aria-label="Forget conversation"
              title="Forget conversation — clears stored history"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors hover:bg-white/[0.04] focus:bg-white/[0.04] focus:outline-none"
            >
              <Eraser
                className="w-4 h-4 flex-shrink-0 text-tertiary"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-primary block">
                  Forget conversation
                </span>
                <span className="text-[11px] text-quiet block mt-0.5 leading-snug">
                  Clears stored history.
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
