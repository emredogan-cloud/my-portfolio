import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emre Doğan",
    short_name: "ED.",
    description: "Cloud & SaaS Engineer — Monk Mode operator",
    start_url: "/",
    /* `scope: "/"` makes the PWA "own" every route under the origin —
       deep links open inside the standalone shell instead of bouncing
       out to the system browser. */
    scope: "/",
    /* `display_override` lets the browser pick the most native option
       it supports. window-controls-overlay is a desktop-PWA win
       (lets us paint into the title bar later); falls back gracefully
       to standalone where unsupported. */
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    /* The splash background must match the body's resting black —
       any mismatch produces a visible flash between launch and
       first paint on Android. theme_color drives the status-bar
       and PWA chrome accents; cyan picks up the brand. */
    background_color: "#000000",
    theme_color: "#00d2ff",
    lang: "en",
    dir: "ltr",
    /* Discoverability metadata. Lighthouse PWA audit and Chrome's
       install prompt both surface these. */
    categories: ["productivity", "developer", "portfolio"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      /* Maskable variant — Android adaptive icons crop the icon to
         a per-device shape (squircle, circle, rounded square). The
         maskable hint tells the launcher this icon is safe to clip.
         We reuse icon-512 for now; if Android crops too aggressively
         we'll generate a dedicated bleed-margin variant later. */
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
