import { ImageResponse } from "next/og";

import { isOperatingTwinEnabled } from "@/lib/v5/operating/flags";
import { composeOperationalSnapshot } from "@/lib/v5/operating/snapshot";
import { recordOperatingEvent } from "@/lib/v5/operating/telemetry";
import { listRecentJournalEntries } from "@/lib/v5/journal/storage";

/**
 * V5 Phase 9 Sub-PR 9.4 — operational portrait OG card.
 *
 * GET /api/og/operating  → 1200×675 PNG
 *
 * Edge runtime (next/og requires it). Composes the same
 * `OperationalSnapshot` Phase 9.2 renders, projects it into a
 * shareable image — what shipped this week, how many
 * production systems are alive, what's experimenting, what's
 * planned, what corrections were recorded. The image is what
 * visitors see next to the `/v5/operating` URL in a Slack
 * preview, a tweet card, a LinkedIn share.
 *
 * Gate
 *   `isOperatingTwinEnabled()` reads the V5_OPERATING_TWIN_ENABLED
 *   env (same flag as the page). When OFF the route returns
 *   404 — no card leaks before the operator launches.
 *
 * Composition philosophy (V5 § 4.4 + Phase 9 brief)
 *   - "Portrait, not dashboard." Card carries declarative
 *     numbers + a one-sentence narrative, NOT trend lines.
 *   - Anti-Generic-AI Law: the narrative is the latest
 *     journal entry's templated narrative (Sub-PR 9.3), OR
 *     a fixed-template line composed from the snapshot
 *     when no journal entry exists yet. NEVER LLM-derived.
 *   - Identity: same `#00d2ff` cyan accent, dark canvas,
 *     system-sans typography as `app/api/og/standup`.
 *   - Restrained: 4 stats max, 1 narrative sentence, no
 *     decorative chrome.
 *
 * Telemetry
 *   On successful PNG composition, fires `og_rendered` on
 *   the v5:operating:adoption hash. Server-side; every
 *   social-card scrape bumps it. Tells the operator "yes,
 *   the card is being requested in the wild."
 *
 * Caching
 *   `s-maxage=300, stale-while-revalidate=3600`. Five minutes
 *   means a fresh share preview within a few minutes of any
 *   cron / commit push, but doesn't hammer the composer for
 *   every scrape. Same posture as the rest of V5's edge
 *   surfaces.
 *
 * Privacy posture
 *   The card is operator-side data only — commits, infra
 *   counts, experiment names, planned status counts.
 *   Zero visitor-derived signal enters the composition.
 *
 * Edge-safety: `next/og` mandates the edge runtime. The
 * snapshot composer + journal storage are both edge-safe
 * (verified across Phase 9.1-9.3 builds).
 */

export const runtime = "edge";

const SIZE = { width: 1200, height: 675 };

const FALLBACK_NARRATIVE =
  "The operational twin is live. Read what's actually shipping at /v5/operating.";

function notFoundResponse(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

/**
 * Pick the narrative line the card overlays. Priority:
 *   1. Latest journal entry's `narrative` (Sub-PR 9.3 output).
 *   2. Templated assembly from the snapshot's commit + planned
 *      counts.
 *   3. Static fallback (used when no signal at all).
 *
 * Returns at most ~180 chars so it lays out on one or two
 * lines at the card's font size.
 */
function pickNarrative(
  journalNarrative: string | null,
  weeklyCommits: number,
  infraActive: number,
  plannedInProgress: number,
): string {
  if (journalNarrative && journalNarrative.length > 0) {
    return journalNarrative.length > 180
      ? `${journalNarrative.slice(0, 177)}…`
      : journalNarrative;
  }
  /* Templated assembly. Each branch is a fixed string
   * concatenated with primitive numbers — grep-auditable. */
  if (weeklyCommits === 0 && plannedInProgress === 0) {
    return FALLBACK_NARRATIVE;
  }
  const parts: string[] = [];
  if (weeklyCommits > 0) {
    parts.push(
      `${weeklyCommits} commit${weeklyCommits === 1 ? "" : "s"} this week`,
    );
  }
  if (infraActive > 0) {
    parts.push(
      `${infraActive} active system${infraActive === 1 ? "" : "s"}`,
    );
  }
  if (plannedInProgress > 0) {
    parts.push(
      `${plannedInProgress} in progress`,
    );
  }
  if (parts.length === 0) return FALLBACK_NARRATIVE;
  return `${parts.join(" · ")}.`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "today";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(d);
}

interface StatTile {
  label: string;
  value: string;
  hint?: string;
}

export async function GET() {
  if (!isOperatingTwinEnabled()) {
    return notFoundResponse();
  }

  /* Compose the snapshot first. Journal read is optional
   * — failure is a no-op (we fall back to templated narrative). */
  const snapshot = await composeOperationalSnapshot();

  let journalNarrative: string | null = null;
  try {
    const recent = await listRecentJournalEntries(1);
    journalNarrative = recent[0]?.narrative ?? null;
  } catch {
    journalNarrative = null;
  }

  const weeklyCommits = safeNumber(
    snapshot.weekly_commits.total_commits,
  );
  const reposTouched = safeNumber(
    snapshot.weekly_commits.repos_touched,
  );
  const infraActive = safeNumber(
    snapshot.active_infrastructure.by_status.active,
  );
  const infraDormant = safeNumber(
    snapshot.active_infrastructure.by_status.dormant,
  );
  const experimentsActive = safeNumber(
    snapshot.running_experiments.active_count,
  );
  const plannedInProgress = safeNumber(
    snapshot.planned_next.by_status["in-progress"],
  );
  const plannedNextUp = safeNumber(
    snapshot.planned_next.by_status["next-up"],
  );

  const dateLabel = formatDateLabel(snapshot.generated_at);
  const narrative = pickNarrative(
    journalNarrative,
    weeklyCommits,
    infraActive,
    plannedInProgress,
  );

  const tiles: readonly StatTile[] = [
    {
      label: "Shipped",
      value: String(weeklyCommits),
      hint: `${reposTouched} repo${reposTouched === 1 ? "" : "s"}`,
    },
    {
      label: "Running",
      value: String(infraActive),
      hint: infraDormant > 0 ? `+${infraDormant} dormant` : "production",
    },
    {
      label: "Experiments",
      value: String(experimentsActive),
      hint: "lab + playground",
    },
    {
      label: "Planned",
      value: String(plannedInProgress + plannedNextUp),
      hint: `${plannedInProgress} now · ${plannedNextUp} next`,
    },
  ];

  /* Fire telemetry after composition succeeds, before the
   * ImageResponse builds. The fetch-back from social card
   * scrapers is the signal the operator wants to count. */
  void recordOperatingEvent("og_rendered");

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
        {/* Ambient cyan glow — top-right corner. Same anchor
            as the standup card, identity continuity. */}
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
        {/* Secondary glow — bottom-left for visual balance. */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -180,
            width: 540,
            height: 540,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Eyebrow */}
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
              display: "flex",
            }}
          >
            V5 · Operating · Portrait
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 16,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {dateLabel}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 36,
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ display: "flex" }}>Operating.</span>
          <span
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.45)",
              fontSize: 56,
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            What&apos;s actually happening.
          </span>
        </div>

        {/* Stat tile row */}
        <div
          style={{
            marginTop: 44,
            display: "flex",
            gap: 18,
          }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(0,210,255,0.22)",
                borderRadius: 16,
                background: "rgba(0,210,255,0.04)",
                padding: "20px 22px",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: 3,
                  color: "rgba(255,255,255,0.55)",
                  textTransform: "uppercase",
                  fontFamily:
                    "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
                  display: "flex",
                }}
              >
                {tile.label}
              </span>
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  letterSpacing: -2,
                  color: "#ffffff",
                  marginTop: 6,
                  display: "flex",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tile.value}
              </span>
              {tile.hint ? (
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(0,210,255,0.7)",
                    fontFamily:
                      "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
                    display: "flex",
                    marginTop: 4,
                  }}
                >
                  {tile.hint}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Narrative — one templated sentence; uses the latest
            journal entry if present, falls back to assembled
            primitives. */}
        <div
          style={{
            marginTop: 36,
            fontSize: 22,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.4,
            maxWidth: 1056,
            display: "flex",
          }}
        >
          {narrative}
        </div>

        {/* Footer row — tagline + URL */}
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
          <span style={{ display: "flex" }}>Portrait · Not dashboard</span>
          <span style={{ display: "flex" }}>
            emredogan.com/v5/operating
          </span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
