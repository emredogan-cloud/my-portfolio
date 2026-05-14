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
    "19. Self-taught. Architecting AWS infrastructure and AI-native SaaS between 04:30 bakery shifts and high-school exams. Monk Mode.",
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
