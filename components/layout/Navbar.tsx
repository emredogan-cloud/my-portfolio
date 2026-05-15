"use client";

import { motion } from "motion/react";
import Link from "next/link";

const MotionLink = motion.create(Link);

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Architecture", href: "/architecture" },
  { label: "Stack", href: "/stack" },
  { label: "Notes", href: "/notes" },
  { label: "Contact", href: "/contact" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-40 h-16 border-b border-white/5 bg-[#0c0c0c]/70 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-tight">
          ED.
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <MotionLink
              key={link.label}
              href={link.href}
              className="text-white/60 text-sm transition-colors duration-200 hover:text-white"
              whileHover={{ opacity: 1 }}
            >
              {link.label}
            </MotionLink>
          ))}
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
