import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import OpeningSequence from "@/components/cinematic/OpeningSequence";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LuminaChat from "@/components/chat/LuminaChat";
import GlobalGrain from "@/components/layout/GlobalGrain";
import CognitionAwareNavigationObserver from "@/components/v5/CognitionAwareNavigationObserver";
import { getSiteUrl } from "@/lib/site-url";

/* ── Geist — sole typography across the portfolio.
     Clean, neutral, engineering-oriented. No serif accents,
     no editorial italics, no Arabic-Latin dual-script overhead. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Emre Doğan — Cloud & SaaS Engineer",
  description:
    "19. Self-taught. Architecting AWS infrastructure and AI-native SaaS between 01:30 bakery shifts and high-school exams. Monk Mode.",
  /* iOS PWA — when the visitor adds the site to their home screen,
     these metas tell Safari to launch in standalone mode (no Safari
     chrome) with a black-translucent status bar that blends into
     the cinematic black hero. The title is what shows under the
     home-screen icon — short enough to fit one line on iOS. */
  appleWebApp: {
    capable: true,
    title: "ED.",
    statusBarStyle: "black-translucent",
  },
  /* Auto-linkification kills the "19." and "01:30" copy in the
     description (and similar numerals across the site). Disable
     all four detectors — none of them are intentional links. */
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  /* Apple touch icon — iOS uses this for the home-screen shortcut.
     The 192x192 PNG already exists for the manifest; reusing it
     here avoids a separate asset. iOS will render it at the
     correct size automatically. */
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    shortcut: "/favicon.ico",
  },
};

/* Viewport — `viewportFit: 'cover'` is the unlock that lets
   `env(safe-area-inset-*)` resolve to non-zero values on iOS. Without
   it, the page underlays the notch/home-indicator areas safely but
   CSS can't measure them, so fixed-positioned elements would still
   sit on top of the home indicator.

   width/initialScale are Next's defaults, redeclared here for
   completeness alongside the cover-fit unlock. themeColor lives
   here (not in metadata.themeColor — that's deprecated in Next 16
   in favour of the viewport export). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

/* ── JSON-LD Person schema. One source of truth so the same identity
     surfaces in <head> on every route. Stringified once at module
     scope so it isn't recomputed per render. */
const PERSON_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Emre Doğan",
  jobTitle: "Cloud & SaaS Engineer",
  url: SITE_URL,
  sameAs: [
    "https://github.com/emredogan-cloud",
    "https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/",
  ],
});

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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: PERSON_JSON_LD }}
        />
      </head>
      <body
        suppressHydrationWarning
        /* `touch-manipulation` (Tailwind v4 → CSS `touch-action:
           manipulation`) removes Safari's 300ms double-tap-zoom
           delay site-wide. Single-finger pan/zoom and scroll still
           work; only the double-tap gesture is suppressed. The
           perceived tap-to-feedback latency drops from ~350ms to
           ~50ms on iOS — the single biggest mobile-UX win that
           ships without any visual change. */
        className={`${geist.className} bg-black text-white antialiased overflow-x-hidden touch-manipulation`}
      >
        {/* Skip-to-content — invisible until Tab focus, then a white pill in
            the top-left corner. Bypasses the navbar + cinematic intro for
            keyboard and screen-reader visitors. Targets the per-page <main>
            element, which carries id="main". The focus position uses
            safe-area-inset-* so the pill never lands under the iOS notch
            on landscape iPhones. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-full focus:font-medium focus:text-sm"
          style={{
            top: "max(1rem, env(safe-area-inset-top))",
            left: "max(1rem, env(safe-area-inset-left))",
          }}
        >
          Skip to content
        </a>
        {/* Global cinematic film-grain overlay — deferred 3.5s for intro perf */}
        <GlobalGrain />
        <OpeningSequence />
        {/* Global navigation — single source of truth. Lives here at the
            root so every route inherits the exact same nav surface. The
            component is `fixed top-0 z-40`, so its DOM position doesn't
            affect layout; placing it before `{children}` mirrors the
            visual stack order (navbar above page content). */}
        <Navbar />
        {children}
        <Footer />
        <LuminaChat />
        {/* V5 Phase 6 Sub-PR 6.2 — cognition-aware navigation observer.
            Renders null. Fires perception events to
            /api/v5/perception/event ONLY when the visitor has opted in
            via the /v5/perception transparency page. Idle CPU is zero —
            the observer's only work runs on usePathname() change, which
            is a user action. Mounted globally because navigation
            observation requires a single layout-level instance. */}
        <CognitionAwareNavigationObserver />
        <Analytics />
      </body>
    </html>
  );
}
