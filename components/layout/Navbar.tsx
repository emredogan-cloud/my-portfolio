"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MobileMenu, { MobileMenuTrigger } from "./MobileMenu";

const MotionLink = motion.create(Link);

const EASE = [0.22, 1, 0.36, 1] as const;

/* ──────────────────────────────────────────────────────────────
 *  Primary navigation surface.
 *
 *  Two coexisting layouts (selected by the V6 Sub-PR 12.1 env
 *  flag `NEXT_PUBLIC_V6_NAV_PROMOTION`):
 *
 *  Legacy (V5, flag OFF — default):
 *    ED. | About · Projects · Systems ▾ · Contact | View Résumé
 *    The "Systems" dropdown buries the most identity-native
 *    surfaces (Architecture, Lab, Codex, Telemetry, Brain) one
 *    chevron deep. The audit (§ 3.2) flagged this as a recruiter-
 *    perception blocker.
 *
 *  V6 (flag ON):
 *    ED. | Work · Lab · Notes · Codex · Operate ▾ |
 *         About · Contact · View Résumé
 *    The five identity-defining surfaces sit flat on the primary
 *    row. The only remaining dropdown is "Operate" — collecting
 *    the operator-grade surfaces (Telemetry, Evolution, Journal,
 *    Changelog, Brain) the recruiter doesn't need front-door but
 *    the senior engineer enjoys finding. About/Contact move
 *    right, smaller, in front of the right-edge action.
 *
 *  Either layout sets `aria-current="page"` on the active link
 *  (fixes audit § 3.3). The Operate parent matches any of its
 *  submenu routes; the "Work" link matches both /projects and
 *  /architecture in anticipation of the Phase 14.1 hub merge.
 *
 *  Mobile path (< md): unchanged in 12.1. Sub-PR 12.4 ships the
 *  real mobile drawer. The current `hidden md:flex` collapse
 *  remains in place until then.
 * ────────────────────────────────────────────────────────────── */

/* ── Legacy structure (V5 baseline, retained for rollback) ───── */

const LEGACY_PRIMARY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
] as const;

const LEGACY_SYSTEMS_LINKS = [
  { label: "Architecture", href: "/architecture" },
  { label: "Stack", href: "/stack" },
  { label: "Notes", href: "/notes" },
  { label: "Codex", href: "/codex" },
  { label: "Lab", href: "/lab" },
  { label: "Telemetry", href: "/telemetry" },
  { label: "Changelog", href: "/changelog" },
  { label: "Brain", href: "/lumina/brain" },
] as const;

const LEGACY_CONTACT_LINK = { label: "Contact", href: "/contact" } as const;

/* ── V6 structure (Sub-PR 12.1 → ON) ─────────────────────────── */

/**
 * Primary surfaces — flat, identity-defining, no dropdown.
 * `matches` lists the route prefixes for which the link is active.
 * "Work" matches both `/projects` and `/architecture` so the
 * link stays highlighted across the future Phase 14.1 hub merge
 * (when /projects + /architecture redirect to `/work#...`).
 */
const V6_PRIMARY_LINKS = [
  {
    label: "Work",
    href: "/projects",
    matches: ["/projects", "/architecture"],
  },
  { label: "Lab", href: "/lab", matches: ["/lab"] },
  { label: "Notes", href: "/notes", matches: ["/notes"] },
  { label: "Codex", href: "/codex", matches: ["/codex"] },
] as const;

/**
 * Operate — the single remaining dropdown. The parent link
 * navigates to `/v5/operating` (the primary operator surface)
 * on click; the dropdown reveals the rest of the operator
 * family on hover/focus. None of these routes is recruiter
 * front-door; they reward operator-tone visitors.
 */
const V6_OPERATE_PARENT = {
  label: "Operate",
  href: "/v5/operating",
  matches: [
    "/v5/operating",
    "/v5/journal",
    "/telemetry",
    "/evolution",
    "/changelog",
    "/lumina/brain",
  ],
} as const;

const V6_OPERATE_LINKS = [
  { label: "Telemetry", href: "/telemetry" },
  { label: "Evolution", href: "/evolution" },
  { label: "Journal", href: "/v5/journal" },
  { label: "Changelog", href: "/changelog" },
  { label: "Brain", href: "/lumina/brain" },
] as const;

/**
 * Secondary surfaces — calmer right-edge cluster. Sit before the
 * calm cluster (Résumé link + Get in touch pill, see V6 § 12.2).
 */
const V6_SECONDARY_LINKS = [
  { label: "About", href: "/about", matches: ["/about"] },
  { label: "Contact", href: "/contact", matches: ["/contact"] },
] as const;

/**
 * Operator's LinkedIn profile — the destination of the Résumé link.
 * Centralised so the legacy white pill (LegacyNavbar) and the V6
 * calm inline link (V6Navbar) both point to the same URL.
 */
const RESUME_URL =
  "https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/";

/* ── V6 12.3 — Brand mark glyph ──────────────────────────────────
 *
 * A small low-stroke glyph that mirrors the HeroTopology center
 * node: a cyan-filled core surrounded by a single quiescent ring.
 * Replaces the "ED." monogram on the V6 layout. The legacy navbar
 * keeps the monogram (rollback path).
 *
 * 24 px diameter (w-6 h-6). The wordmark sits adjacent on md+ and
 * is hidden below md — the glyph alone reads as the mark on
 * mobile. The wrapping Link extends the click area to ≥ 44 × 44
 * via -m-2.5 / p-2.5 without shifting the visual position.
 *
 * Pure SVG, no animation surface, reduced-motion safe by
 * construction.
 * ────────────────────────────────────────────────────────────── */
function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 shrink-0"
      aria-hidden="true"
    >
      {/* Quiescent ring — low-stroke, low opacity, restrained. */}
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="#00d2ff"
        strokeOpacity="0.30"
        strokeWidth="1"
      />
      {/* Cyan-cored center — the HeroTopology center-node echo. */}
      <circle cx="12" cy="12" r="3.5" fill="#00d2ff" />
    </svg>
  );
}

/* ── Route-matching helper ───────────────────────────────────── */

function matchesAny(
  pathname: string | null,
  patterns: readonly string[],
): boolean {
  if (!pathname) return false;
  return patterns.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/* ── Entry point ─────────────────────────────────────────────── */

export default function Navbar() {
  if (process.env.NEXT_PUBLIC_V6_NAV_PROMOTION === "1") {
    return <V6Navbar />;
  }
  return <LegacyNavbar />;
}

/* ── Legacy navbar (rollback path) ───────────────────────────── */

function LegacyNavbar() {
  const [systemsOpen, setSystemsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (!systemsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSystemsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [systemsOpen]);

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
          {LEGACY_PRIMARY_LINKS.map((link) => {
            const active = matchesAny(pathname, [link.href]);
            return (
              <MotionLink
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors duration-200 ${
                  active
                    ? "text-primary"
                    : "text-tertiary hover:text-primary"
                }`}
                whileHover={{ opacity: 1 }}
              >
                {link.label}
              </MotionLink>
            );
          })}

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
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[176px] rounded-xl border border-white/[0.06] bg-[#0c0c0c]/95 backdrop-blur-md py-2"
                >
                  {LEGACY_SYSTEMS_LINKS.map((link) => {
                    const active = matchesAny(pathname, [link.href]);
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setSystemsOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors duration-200 ${
                          active
                            ? "text-primary"
                            : "text-tertiary hover:text-primary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(() => {
            const active = matchesAny(pathname, [LEGACY_CONTACT_LINK.href]);
            return (
              <MotionLink
                href={LEGACY_CONTACT_LINK.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors duration-200 ${
                  active
                    ? "text-primary"
                    : "text-tertiary hover:text-primary"
                }`}
                whileHover={{ opacity: 1 }}
              >
                {LEGACY_CONTACT_LINK.label}
              </MotionLink>
            );
          })()}
        </div>

        <a
          href={RESUME_URL}
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

/* ── V6 navbar (Sub-PR 12.1 + 12.2 + 12.3 + 12.4 layout) ─────── */

function V6Navbar() {
  const [operateOpen, setOperateOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();

  /* Global Esc-to-close. Same posture as the legacy navbar — the
   * listener attaches only while the menu is open. The MobileMenu
   * has its own internal Esc-listener bound to its own state. */
  useEffect(() => {
    if (!operateOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOperateOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [operateOpen]);

  /* Note: in-drawer Link clicks call onClose explicitly, so the
   * common close path is covered without an effect. Browser
   * back/forward while the drawer is open is an edge case;
   * visitors can still close via Esc or backdrop click. */

  const fadeDuration = prefersReducedMotion ? 0 : 0.18;

  const operateActive = matchesAny(pathname, V6_OPERATE_PARENT.matches);

  /* V6 12.4 — mobile-drawer flag. Separate from V6_NAV_PROMOTION so
   * the operator can ship the drawer independently. When the flag
   * is off, the V6 mobile layout keeps the 12.3 state (brand glyph
   * on the left + Get in touch pill on the right). */
  const mobileNavEnabled =
    process.env.NEXT_PUBLIC_V6_MOBILE_NAV === "1";

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-40 h-16 border-b border-white/5 bg-[#0c0c0c]/70 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-8">
        {/* V6 12.3 — brand mark: glyph + wordmark.
            The "ED." monogram is retired here on the V6 layout.
            Default per spec: glyph + wordmark adjacent. Wordmark
            hidden below md. The wrapping Link extends the click
            area to ≥ 44 × 44 via -m-2.5 + p-2.5 without shifting
            the visual position. */}
        <Link
          href="/"
          aria-label="Emre Doğan — Home"
          className="-m-2.5 inline-flex items-center gap-2.5 p-2.5 shrink-0"
        >
          <BrandMark />
          <span className="hidden md:inline text-sm font-medium tracking-tight text-primary">
            Emre Doğan
          </span>
        </Link>

        {/* PRIMARY ROW — Work / Lab / Notes / Codex / Operate ▾ */}
        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {V6_PRIMARY_LINKS.map((link) => {
            const active = matchesAny(pathname, link.matches);
            return (
              <MotionLink
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors duration-200 ${
                  active
                    ? "text-primary"
                    : "text-tertiary hover:text-primary"
                }`}
                whileHover={{ opacity: 1 }}
              >
                {link.label}
              </MotionLink>
            );
          })}

          {/* Operate — split-button: hover opens dropdown, click navigates. */}
          <div
            className="relative"
            onMouseEnter={() => setOperateOpen(true)}
            onMouseLeave={() => setOperateOpen(false)}
          >
            <Link
              href={V6_OPERATE_PARENT.href}
              aria-current={operateActive ? "page" : undefined}
              aria-haspopup="menu"
              aria-expanded={operateOpen}
              aria-controls="operate-menu"
              onFocus={() => setOperateOpen(true)}
              className={`flex items-center text-sm transition-colors duration-200 focus-visible:outline-none ${
                operateActive
                  ? "text-primary"
                  : "text-tertiary hover:text-primary focus:text-primary"
              }`}
            >
              {V6_OPERATE_PARENT.label}
              <span
                aria-hidden="true"
                className={`ml-1.5 text-[9px] text-quiet transition-transform duration-200 ${
                  operateOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </Link>

            <AnimatePresence>
              {operateOpen && (
                <motion.div
                  id="operate-menu"
                  role="menu"
                  aria-label="Operate"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: fadeDuration, ease: EASE }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[176px] rounded-xl border border-white/[0.06] bg-[#0c0c0c]/95 backdrop-blur-md py-2"
                >
                  {V6_OPERATE_LINKS.map((link) => {
                    const active = matchesAny(pathname, [link.href]);
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOperateOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors duration-200 ${
                          active
                            ? "text-primary"
                            : "text-tertiary hover:text-primary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECONDARY CLUSTER — About · Contact · Résumé · [Get in touch].
            About / Contact / Résumé collapse below md.

            V6 12.4: when the mobile-nav flag is on, the "Get in
            touch" pill is also hidden on mobile (it migrates into
            the drawer footer alongside the Résumé link); the mobile
            trigger glyph takes its place on the right edge. When
            the flag is off, the pill stays as the always-visible
            mobile right-edge anchor (the 12.3 state). */}
        <div className="flex items-center gap-5 shrink-0">
          {V6_SECONDARY_LINKS.map((link) => {
            const active = matchesAny(pathname, link.matches);
            return (
              <MotionLink
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`hidden md:inline-flex text-xs uppercase tracking-[0.14em] transition-colors duration-200 ${
                  active
                    ? "text-primary"
                    : "text-quiet hover:text-primary"
                }`}
                whileHover={{ opacity: 1 }}
              >
                {link.label}
              </MotionLink>
            );
          })}

          <a
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex text-xs uppercase tracking-[0.14em] text-tertiary hover:text-primary transition-colors duration-200"
          >
            Résumé
          </a>

          <Link
            href="/contact"
            className={`${
              mobileNavEnabled ? "hidden md:inline-flex" : "inline-flex"
            } items-center justify-center rounded-full border border-[#00d2ff]/40 hover:border-[#00d2ff]/70 hover:bg-[#00d2ff]/[0.06] text-primary text-sm font-medium px-4 py-1.5 transition-colors duration-200`}
          >
            Get in touch
          </Link>

          {/* V6 12.4 — mobile trigger glyph. Replaces the visible
              Get in touch pill on mobile when the flag is on.
              The pill migrates into the drawer footer so visitors
              still get one-tap access to /contact, plus access to
              the full primary navigation that V5 / 12.3 hid behind
              hidden md:flex. */}
          {mobileNavEnabled ? (
            <MobileMenuTrigger
              onOpen={() => setMobileMenuOpen(true)}
              ariaControls="mobile-menu-dialog"
              open={mobileMenuOpen}
            />
          ) : null}
        </div>
      </div>

      {/* V6 12.4 — mobile drawer. Mounts conditionally; when the
          flag is off it never enters the DOM. When the flag is on
          and the trigger fires, AnimatePresence animates it in. */}
      {mobileNavEnabled ? (
        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      ) : null}
    </motion.nav>
  );
}
