"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface Segment {
  readonly text: string;
  readonly className: string;
}

interface WordsPullUpMultiStyleProps {
  segments: readonly Segment[];
  containerClassName?: string;
  delay?: number;
}

export default function WordsPullUpMultiStyle({
  segments,
  containerClassName = "",
  delay = 0,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const allWords: { word: string; className: string }[] = [];
  segments.forEach((segment) => {
    const words = segment.text.split(" ").filter((w) => w.length > 0);
    words.forEach((word) => {
      allWords.push({ word, className: segment.className });
    });
  });

  return (
    <div
      ref={ref}
      className={`inline-flex flex-wrap justify-center gap-y-0 ${containerClassName}`}
    >
      {allWords.map(({ word, className }, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className={`inline-block ${className}`}
            style={{ marginRight: "0.25em" }}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
}
