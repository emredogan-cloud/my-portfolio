import { ImageResponse } from "next/og";

/**
 * Dynamic OG image for the daily standup tweet.
 *
 * GET /api/og/standup?date=2026-05-19&repos=my-portfolio,cloud-waste-hunter
 *
 * Edge runtime (next/og requires it). Renders a 1200×675 PNG
 * matching the portfolio's cinematic identity: pure black canvas,
 * cyan #00d2ff accents, system-sans typography (Satori can't pull
 * from next/font, so we use the system stack — same constraint as
 * app/opengraph-image.tsx from Phase 1).
 *
 * Layout:
 *   ●  DAILY STANDUP                    Tuesday, May 19
 *   ─────────────────                   ─────────────────
 *
 *   [my-portfolio]   [cloud-waste-…]   [vibing-coder…]
 *
 *                  ┌──────────────┐
 *                  │   ● ● ● ● ●  │
 *                  │  ●  CORE  ●  │   ← 5-node constellation
 *                  │   ● ● ● ● ●  │
 *                  └──────────────┘
 *
 *   CLOUD · AI · PRODUCTION                  EMREDOGAN.COM
 *
 * The constellation mirrors the home hero's InfrastructureCore —
 * same vocabulary, static. The image is what visitors see next to
 * the tweet text on a busy Twitter timeline.
 */

export const runtime = "edge";

const SIZE = { width: 1200, height: 675 };

const MAX_REPOS = 3;

function formatDateLabel(dateString: string | null): string {
  const now = dateString ? new Date(`${dateString}T12:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) {
    return formatDateLabel(null);
  }
  // Locale-free formatting via Intl in en-GB for "Tuesday, 19 May 2026"
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(now);
}

function parseRepos(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateLabel = formatDateLabel(url.searchParams.get("date"));
  const allRepos = parseRepos(url.searchParams.get("repos"));
  const visibleRepos = allRepos.slice(0, MAX_REPOS);
  const overflow = allRepos.length - visibleRepos.length;

  // 5-node constellation positioned around (centerX, centerY) with
  // radius `r` in viewBox units. Same shape as InfrastructureCore.
  const cx = 200;
  const cy = 200;
  const r = 130;
  const angles = [-90, -18, 54, 126, -162];

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE.width,
          height: SIZE.height,
          background: "#000000",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          position: "relative",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Ambient cyan glow anchored top-right */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -220,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(0,210,255,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top: eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily:
              "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "#00d2ff",
              boxShadow: "0 0 18px #00d2ff",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: 20,
              letterSpacing: 6,
              color: "rgba(0,210,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            Daily Standup
          </span>
        </div>

        {/* Date — large, bold */}
        <div
          style={{
            marginTop: 32,
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {dateLabel}.
        </div>

        {/* Repo pills row */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            fontFamily:
              "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
          }}
        >
          {visibleRepos.length === 0 ? (
            <div
              style={{
                fontSize: 18,
                letterSpacing: 2.5,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              Quiet build day
            </div>
          ) : (
            <>
              {visibleRepos.map((repo) => (
                <div
                  key={repo}
                  style={{
                    border: "1px solid rgba(0,210,255,0.32)",
                    borderRadius: 9999,
                    padding: "10px 22px",
                    fontSize: 20,
                    color: "rgba(255,255,255,0.9)",
                    background: "rgba(0,210,255,0.06)",
                    display: "flex",
                  }}
                >
                  {repo}
                </div>
              ))}
              {overflow > 0 && (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 9999,
                    padding: "10px 22px",
                    fontSize: 20,
                    color: "rgba(255,255,255,0.55)",
                    display: "flex",
                  }}
                >
                  +{overflow} more
                </div>
              )}
            </>
          )}
        </div>

        {/* Constellation — anchored right-of-center, vertically centered
            with the date+pills block. Satori does not support <text>
            inside inline SVG, so the "CORE" label is a positioned div
            overlaid on top of the constellation. */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: 200,
            width: 400,
            height: 400,
            display: "flex",
          }}
        >
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* dashed outer ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r + 22}
              fill="none"
              stroke="rgba(0,210,255,0.16)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
            {/* faint inner guide */}
            <circle
              cx={cx}
              cy={cy}
              r={70}
              fill="none"
              stroke="rgba(0,210,255,0.06)"
            />
            {/* filaments + nodes */}
            {angles.map((a, i) => {
              const rad = (a * Math.PI) / 180;
              const x = cx + Math.cos(rad) * r;
              const y = cy + Math.sin(rad) * r;
              return (
                <g key={i}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="rgba(0,210,255,0.28)"
                    strokeWidth="1"
                  />
                  <circle cx={x} cy={y} r="9" fill="#00d2ff" />
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="none"
                    stroke="rgba(0,210,255,0.45)"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {/* central core — shapes only; label is overlaid as a div */}
            <circle
              cx={cx}
              cy={cy}
              r="42"
              fill="rgba(0,210,255,0.16)"
            />
            <circle cx={cx} cy={cy} r="28" fill="#00d2ff" />
          </svg>
          {/* CORE label — Satori-compatible div overlay */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 400,
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily:
                "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#0a0a0a",
            }}
          >
            CORE
          </div>
        </div>

        {/* Bottom row — tagline + URL */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 5,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            fontFamily:
              "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
          }}
        >
          <span style={{ display: "flex" }}>Cloud · AI · Production</span>
          <span style={{ display: "flex" }}>emredogan.com</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
