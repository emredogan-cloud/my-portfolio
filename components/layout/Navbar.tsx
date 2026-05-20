"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MotionLink = motion.create(Link);

/**
 * Primary navigation surfaces (always visible on desktop).
 *
 * Phase 2 polish — nav refinement. The previous flat row carried
 * seven items: About / Projects / Architecture / Stack / Notes /
 * Codex / Contact. Two new Phase 2 surfaces (/lab, /telemetry)
 * landed without a discovery path. Adding them as #8 and #9 on
 * the flat row would inflate density at the moment of maturity —
 * the opposite of the intended atmosphere.
 *
 * The grouped row now: About · Projects · Systems ▾ · Contact.
 * Everything that previously sat between Projects and Contact
 * moves into the Systems dropdown.
 */
const PRIMARY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
] as const;

/**
 * Grouped under "Systems". Order is intentional — the most
 * architecturally-flavoured surfaces (Architecture / Stack) lead;
 * the editorial reads (Notes / Codex) sit in the middle; the
 * operating-system surfaces (Lab / Telemetry / Changelog) close;
 * Lumina Brain anchors the row as the transparency surface for
 * the chat itself. Each link still routes to the exact same href
 * as before; the dropdown is presentation only.
 */
const SYSTEMS_LINKS = [
  { label: "Architecture", href: "/architecture" },
  { label: "Stack", href: "/stack" },
  { label: "Notes", href: "/notes" },
  { label: "Codex", href: "/codex" },
  { label: "Lab", href: "/lab" },
  { label: "Telemetry", href: "/telemetry" },
  { label: "Changelog", href: "/changelog" },
  { label: "Brain", href: "/lumina/brain" },
] as const;

const CONTACT_LINK = { label: "Contact", href: "/contact" } as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  const [systemsOpen, setSystemsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  /* Global Esc-to-close. Only attaches the listener when the
   * menu is open so we don't leak a keydown subscriber site-wide
   * for a feature that's idle 99% of the time. */
  useEffect(() => {
    if (!systemsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSystemsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemsOpen]);

  /* Motion-safe duration. The global CSS reduced-motion guard
   * collapses CSS transitions but motion/react drives its
   * animations via RAF — useReducedMotion is the canonical
   * path. Mirrors the BuildBeacon precedent in this repo. */
  const fadeDuration = prefersReducedMotion ? 0 : 0.18;

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-40 h-16 border-b border-white/5 bg-[#0c0c0c]/70 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="text-primary font-semibold tracking-tight">
          ED.
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {PRIMARY_LINKS.map((link) => (
            <MotionLink
              key={link.label}
              href={link.href}
              className="text-tertiary text-sm transition-colors duration-200 hover:text-primary"
              whileHover={{ opacity: 1 }}
            >
              {link.label}
            </MotionLink>
          ))}

          {/* Systems dropdown.
              The wrapper unifies the hover region so the mouse can
              travel from trigger to panel without losing hover —
              the panel sits inside this same div and inherits the
              mouseenter/leave scope. */}
          <div
            className="relative"
            onMouseEnter={() => setSystemsOpen(true)}
            onMouseLeave={() => setSystemsOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={systemsOpen}
              aria-controls="systems-menu"
              onClick={() => setSystemsOpen((v) => !v)}
              className="flex items-center text-tertiary text-sm transition-colors duration-200 hover:text-primary focus:text-primary focus-visible:outline-none"
            >
              Systems
              <span
                aria-hidden="true"
                className={`ml-1.5 text-[9px] text-quiet transition-transform duration-200 ${
                  systemsOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            <AnimatePresence>
              {systemsOpen && (
                <motion.div
                  id="systems-menu"
                  role="menu"
                  aria-label="Systems"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: fadeDuration, ease: EASE }}
                  /* `top-full + mt-3` lands the panel 12px below
                     the trigger baseline. The wrapper extends
                     vertically to enclose that 12px gap because
                     the absolute-positioned panel still counts as
                     a child for mouseenter/leave purposes — the
                     mouse can cross the gap without losing hover. */
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[176px] rounded-xl border border-white/[0.06] bg-[#0c0c0c]/95 backdrop-blur-md py-2"
                >
                  {SYSTEMS_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setSystemsOpen(false)}
                      className="block px-4 py-2 text-sm text-tertiary hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MotionLink
            href={CONTACT_LINK.href}
            className="text-tertiary text-sm transition-colors duration-200 hover:text-primary"
            whileHover={{ opacity: 1 }}
          >
            {CONTACT_LINK.label}
          </MotionLink>
        </div>

        <a
          href="https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-white text-black font-medium text-sm px-5 py-2 transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          View Résumé
        </a>
      </div>
    </motion.nav>
  );
}
