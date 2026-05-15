import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import OpeningSequence from "@/components/cinematic/OpeningSequence";
import Footer from "@/components/layout/Footer";
import LuminaChat from "@/components/chat/LuminaChat";
import GlobalGrain from "@/components/layout/GlobalGrain";

/* ── Geist — sole typography across the portfolio.
     Clean, neutral, engineering-oriented. No serif accents,
     no editorial italics, no Arabic-Latin dual-script overhead. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Emre Doğan — Cloud & SaaS Engineer",
  description:
    "19. Self-taught. Architecting AWS infrastructure and AI-native SaaS between 01:30 bakery shifts and high-school exams. Monk Mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={geist.variable}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`${geist.className} bg-black text-white antialiased overflow-x-hidden`}
      >
        {/* Skip-to-content — invisible until Tab focus, then a white pill in
            the top-left corner. Bypasses the navbar + cinematic intro for
            keyboard and screen-reader visitors. Targets the per-page <main>
            element, which carries id="main". */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-full focus:font-medium focus:text-sm"
        >
          Skip to content
        </a>
        {/* Global cinematic film-grain overlay — deferred 3.5s for intro perf */}
        <GlobalGrain />
        <OpeningSequence />
        {children}
        <Footer />
        <LuminaChat />
        <Analytics />
      </body>
    </html>
  );
}
