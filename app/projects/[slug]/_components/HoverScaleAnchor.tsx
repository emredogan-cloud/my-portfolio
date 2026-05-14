"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Action button client leaf — used for both "Visit Website" (live URL)
 * and "GitHub" CTAs on project detail pages. Provides whileHover/whileTap
 * scale physics over a server-rendered anchor element.
 *
 * `suppressHydrationWarning` is preserved from the original implementation
 * to insulate against extension-injected style attributes on Lucide icons.
 */
export function HoverScaleAnchor({
  href,
  target,
  rel,
  className,
  children,
}: Props) {
  return (
    <motion.a
      suppressHydrationWarning
      href={href}
      target={target}
      rel={rel}
      className={className}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </motion.a>
  );
}
