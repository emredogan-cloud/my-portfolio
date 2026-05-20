"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Operator's LinkedIn profile — the destination of the Résumé link
 * in the drawer footer. Kept in sync with the desktop wordmark
 * cluster in Navbar.tsx.
 */
const RESUME_URL =
  "https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/";

interface NavLink {
  readonly label: string;
  readonly href: string;
  readonly matches: readonly string[];
}

/* The drawer's primary surfaces mirror V6Navbar's V6_PRIMARY_LINKS
   verbatim. "Work" stays prefix-matched to /projects + /architecture
   in anticipation of the Phase 14.1 hub merge. */
const PRIMARY_LINKS: readonly NavLink[] = [
  { label: "Work", href: "/projects", matches: ["/projects", "/architecture"] },
  { label: "Lab", href: "/lab", matches: ["/lab"] },
  { label: "Notes", href: "/notes", matches: ["/notes"] },
  { label: "Codex", href: "/codex", matches: ["/codex"] },
] as const;

/* Operate parent — the single in-drawer expandable. Per V6 § 12.4
   spec ("The Operate item expands inline (no second drawer)") the
   submenu uses a height-auto reveal, not a nested drawer surface. */
/* V6 13.5 — when the pulse-extraction flag is on, the Operate
   submenu in the drawer gains a /pulse entry and the parent's
   prefix-match array includes /pulse so the Operate row
   highlights when the visitor is on the lifestyle route.
   Mirrors the V6Navbar's desktop Operate list. */
const PULSE_ENABLED =
  process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION === "1";

const OPERATE_PARENT: NavLink = {
  label: "Operate",
  href: "/v5/operating",
  matches: [
    "/v5/operating",
    "/v5/journal",
    "/telemetry",
    "/evolution",
    "/changelog",
    "/lumina/brain",
    ...(PULSE_ENABLED ? ["/pulse"] : []),
  ],
};

const OPERATE_SUBMENU: readonly NavLink[] = [
  { label: "Operating", href: "/v5/operating", matches: ["/v5/operating"] },
  { label: "Telemetry", href: "/telemetry", matches: ["/telemetry"] },
  { label: "Evolution", href: "/evolution", matches: ["/evolution"] },
  { label: "Journal", href: "/v5/journal", matches: ["/v5/journal"] },
  { label: "Changelog", href: "/changelog", matches: ["/changelog"] },
  { label: "Brain", href: "/lumina/brain", matches: ["/lumina/brain"] },
  ...(PULSE_ENABLED
    ? [{ label: "Pulse", href: "/pulse", matches: ["/pulse"] }]
    : []),
];

/* ── Route-matching helper ───────────────────────────────────────
 * Section-prefix match: exact pathname OR pathname under the
 * pattern (with a trailing slash separator to avoid false-positive
 * matches like /projects-archive matching /projects). Mirrors the
 * matcher in Navbar.tsx. */
function matchesAny(
  pathname: string | null,
  patterns: readonly string[],
): boolean {
  if (!pathname) return false;
  return patterns.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/* ── Trigger glyph ───────────────────────────────────────────────
 * Three stacked 1px lines per V6 § 12.4 spec ("a quiet
 * horizontal-line glyph (3 stacked 1 px lines), no 'hamburger'
 * suggestion"). 16px wide × 12px tall inside a 24×24 viewBox so
 * the lines read as elegant horizontal rules, not as a chunky
 * hamburger icon. */
export function MobileMenuTrigger({
  onOpen,
  ariaControls,
  open,
}: {
  onOpen: () => void;
  ariaControls: string;
  open: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation menu"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={ariaControls}
      className="md:hidden -m-2.5 inline-flex items-center justify-center p-2.5 text-tertiary hover:text-primary transition-colors duration-200"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <line
          x1="4"
          y1="8"
          x2="20"
          y2="8"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="4"
          y1="16"
          x2="20"
          y2="16"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </button>
  );
}

/* ── MobileMenu drawer ──────────────────────────────────────────
 *
 * V6 Sub-PR 12.4 — the real mobile drawer that retires the audit
 * § 3.5 BLOCKER (mobile has no menu).
 *
 * Composition:
 * - Fixed backdrop (z-45) fades in; click anywhere closes.
 * - Fixed drawer (z-50) slides in from the right at 78vw / max
 *   320px. Black background with a 1px cyan border on the left
 *   edge — the margin-tick motif (11.5) extended to the drawer.
 * - Close button (top-right inside drawer).
 * - Primary nav rows (Work / Lab / Notes / Codex / Operate) as
 *   large mono-eyebrow + Geist medium headline pairs; each row is
 *   ≥ 64 px tall for comfortable touch.
 * - Operate expands inline — no second drawer surface.
 * - Footer with quiet Résumé link + cyan-bordered "Get in touch"
 *   pill (12.2's right-edge cluster, reproduced inside the drawer
 *   so mobile visitors get the same conversion path as desktop).
 *
 * Lumina trigger is at z-[55], above this drawer. Spec validates
 * that the trigger remains tappable while the drawer is open.
 *
 * Reduced-motion: drawer fades opacity instead of sliding.
 * Esc + backdrop click close. Body scroll locked while open. */
export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [operateExpanded, setOperateExpanded] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Esc closes — listener attached only while open. */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Body scroll lock while open — preserves the V5 scroll
   * position by toggling overflow rather than position:fixed. */
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  /* Focus the close button on open so keyboard / screen-reader
   * users land inside the drawer immediately. */
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  /* Note: Operate expansion intentionally persists across
   * open/close cycles. Visitors who chose to expand Operate while
   * exploring should see that state preserved when they reopen
   * the drawer. */

  const drawerMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: EASE },
      }
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { duration: 0.32, ease: EASE },
      };

  const operateActive = matchesAny(pathname, OPERATE_PARENT.matches);

  return (
    <AnimatePresence>
      {open ? (
        <div className="md:hidden">
          {/* Backdrop — click anywhere closes the drawer. Sits
              below the drawer (z-45) and below the Lumina trigger
              (z-[55]) so the trigger stays tappable. */}
          <motion.div
            className="fixed inset-0 z-[45] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            id="mobile-menu-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed top-0 right-0 z-[50] h-full w-[78vw] max-w-[320px] bg-black border-l border-[#00d2ff]/30 flex flex-col"
            initial={drawerMotion.initial}
            animate={drawerMotion.animate}
            exit={drawerMotion.exit}
            transition={drawerMotion.transition}
          >
            {/* Top row — close button only (the drawer's nav rows
                carry the brand identity below). */}
            <div className="flex items-center justify-end p-4 shrink-0">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="-m-2.5 inline-flex items-center justify-center p-2.5 text-tertiary hover:text-primary focus-visible:text-primary transition-colors duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                  <path
                    d="M6 6 L18 18 M18 6 L6 18"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    fill="none"
                  />
                </svg>
              </button>
            </div>

            {/* Primary navigation list. Each row pairs a mono
                index eyebrow (01, 02, …) with a larger headline.
                Generous py-4 gives a comfortable touch target
                (≥ 64 px row height) and lets the rows breathe. */}
            <nav className="flex-1 px-6 overflow-y-auto">
              <ul className="space-y-1">
                {PRIMARY_LINKS.map((link, i) => {
                  const active = matchesAny(pathname, link.matches);
                  const indexLabel = String(i + 1).padStart(2, "0");
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`block py-4 group transition-colors duration-200 ${
                          active ? "text-primary" : "text-secondary hover:text-primary"
                        }`}
                      >
                        <span className="block text-[10px] font-mono uppercase tracking-[0.20em] text-quiet group-hover:text-tertiary mb-1.5">
                          {indexLabel}
                        </span>
                        <span className="block text-2xl font-medium tracking-tight">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}

                {/* Operate — expandable inline. Toggling the
                    button reveals the 6 operator-grade routes
                    without opening a second drawer surface. */}
                <li>
                  <button
                    type="button"
                    onClick={() => setOperateExpanded((v) => !v)}
                    aria-expanded={operateExpanded}
                    aria-controls="mobile-operate-submenu"
                    className={`w-full text-left py-4 group transition-colors duration-200 ${
                      operateActive
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    <span className="block text-[10px] font-mono uppercase tracking-[0.20em] text-quiet group-hover:text-tertiary mb-1.5">
                      {String(PRIMARY_LINKS.length + 1).padStart(2, "0")}
                    </span>
                    <span className="flex items-center gap-2 text-2xl font-medium tracking-tight">
                      {OPERATE_PARENT.label}
                      <span
                        aria-hidden="true"
                        className={`text-xs text-quiet transition-transform duration-200 ${
                          operateExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {operateExpanded ? (
                      <motion.ul
                        id="mobile-operate-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.22,
                          ease: EASE,
                        }}
                        className="overflow-hidden pl-1"
                      >
                        {OPERATE_SUBMENU.map((sub) => {
                          const active = matchesAny(pathname, sub.matches);
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                onClick={onClose}
                                aria-current={active ? "page" : undefined}
                                className={`block py-3 text-sm transition-colors duration-200 ${
                                  active
                                    ? "text-primary"
                                    : "text-tertiary hover:text-primary"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    ) : null}
                  </AnimatePresence>
                </li>
              </ul>
            </nav>

            {/* Footer — quiet Résumé link + cyan-bordered
                "Get in touch" pill. Reproduces the 12.2 right-edge
                cluster inside the drawer so mobile visitors get the
                same conversion path. */}
            <div className="px-6 py-5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="text-xs uppercase tracking-[0.14em] text-tertiary hover:text-primary transition-colors duration-200"
              >
                Résumé
              </a>
              <Link
                href="/contact"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-[#00d2ff]/40 hover:border-[#00d2ff]/70 hover:bg-[#00d2ff]/[0.06] text-primary text-sm font-medium px-4 py-1.5 transition-colors duration-200"
              >
                Get in touch
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
