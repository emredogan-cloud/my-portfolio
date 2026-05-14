"use client";

import { motion } from "motion/react";
import Image from "next/image";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  src: string;
  alt: string;
}

/**
 * Project gallery image with hover-scale lift.
 * SVG sources get object-contain treatment with padding; raster sources
 * fill the frame via object-cover. Auto-detected from file extension.
 */
export function GalleryItem({ src, alt }: Props) {
  const isSvg = src.endsWith(".svg");
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
      style={{ aspectRatio: isSvg ? "3/1" : "16/9" }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={isSvg ? "object-contain p-8" : "object-cover"}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </motion.div>
  );
}
