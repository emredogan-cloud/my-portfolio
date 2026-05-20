"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import WordsPullUpMultiStyle from "@/components/ui/WordsPullUpMultiStyle";

const BODY_TEXT =
  "Cloud architecture, AI agents, and production SaaS — engineered for compounding leverage at scale.";

const HEADING_SEGMENTS = [
  {
    text: "I build AI-native infrastructure systems",
    className: "font-normal text-primary",
  },
  {
    text: "designed for scale, automation, and operational leverage.",
    className: "font-normal text-tertiary",
  },
] as const;

interface AnimatedLetterProps {
  char: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

function AnimatedLetter({
  char,
  index,
  total,
  scrollYProgress,
}: AnimatedLetterProps) {
  const charProgress = index / total;
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, charProgress - 0.1), Math.min(1, charProgress + 0.05)],
    [0.2, 1],
  );
  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

export default function AboutSection() {
  const textRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ["start 0.8", "end 0.2"],
  });

  const chars = BODY_TEXT.split("");

  return (
    <section className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#0d0d0d] rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-14 text-center">

          {/* Label */}
          <div className="mb-5 sm:mb-7">
            <span className="text-tertiary text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              Manifesto
            </span>
          </div>

          {/* Compact manifesto heading */}
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl max-w-3xl mx-auto leading-[1.1] sm:leading-[1.05] md:leading-[1.0] mb-8 sm:mb-10 md:mb-12 tracking-tight">
            <WordsPullUpMultiStyle segments={HEADING_SEGMENTS} />
          </div>

          {/* Supporting paragraph — scroll-linked character reveal */}
          <div ref={textRef} className="max-w-xl mx-auto">
            <p
              className="text-xs sm:text-sm"
              style={{ color: "#ffffff", lineHeight: 1.7 }}
            >
              {chars.map((char, i) => (
                <AnimatedLetter
                  key={i}
                  char={char}
                  index={i}
                  total={chars.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
