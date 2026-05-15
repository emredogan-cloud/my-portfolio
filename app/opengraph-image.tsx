import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Emre Doğan — 19. Self-taught. Monk Mode.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Cinematic OG card — black canvas, single cyan accent, the same
 * "19. Self-taught. Monk Mode." voice the hero opens with. Rendered
 * once at build time, served from the edge. ImageResponse uses Satori,
 * which can't load Google Fonts via next/font, so we fall back to the
 * system stack — readers see their OS's default sans-serif.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background:
            "radial-gradient(circle at 78% 25%, rgba(11,37,81,0.55) 0%, transparent 50%), #000",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "20px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "9999px",
              background: "#00d2ff",
              boxShadow: "0 0 24px #00d2ff",
            }}
          />
          19. Self-taught. Monk Mode.
        </div>

        <div
          style={{
            marginTop: "40px",
            fontSize: "144px",
            fontWeight: 600,
            letterSpacing: "-0.06em",
            lineHeight: 0.95,
            color: "#ffffff",
          }}
        >
          Emre Doğan.
        </div>

        <div
          style={{
            marginTop: "48px",
            fontSize: "28px",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.7)",
            maxWidth: "880px",
          }}
        >
          Cloud &amp; SaaS engineer. AWS infrastructure and AI-native
          systems, built between 01:30 bakery shifts and high-school exams.
        </div>
      </div>
    ),
    { ...size },
  );
}
