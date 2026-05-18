import { getApiBase } from "../api-base.js";
import { formatAgo, padCell } from "../format.js";

/**
 * `emredogan telemetry` — print live platform metrics as a
 * three-column ASCII table.
 *
 * V4 Phase 2, CLI v0.1.1 expansion. Fetches `/api/cli/telemetry`
 * (a curated 6-metric subset of the /telemetry dashboard) and
 * renders an aligned three-column table:
 *
 *   METRIC                       VALUE             UPDATED
 *   ───────────────────────────  ───────────────   ──────────
 *   lumina p95 latency           423 ms            3m ago
 *   auto-tweet successes         12                1h ago
 *   ...
 *
 * Column widths are fixed so the output reads identically on
 * any 80-column terminal. The widths are chosen against the
 * longest realistic value for each metric (e.g. lumina p95 up
 * to "60000 ms" — 8 chars, well under the 15-char value column).
 *
 * Exit codes:
 *   0  - clean print
 *   2  - network / fetch error
 *   5  - unexpected upstream error
 */

interface CliMetric {
  slug: string;
  label: string;
  value: number | null;
  unit?: string;
  updated_at: string | null;
}

interface TelemetryResponse {
  metrics: CliMetric[];
}

/* Column widths. Tuned so the overall table fits comfortably
 * inside a standard 80-column shell — 2 (indent) + 28 + 2 + 15
 * + 2 + 12 + slack = ~61 chars. */
const COL_LABEL_WIDTH = 28;
const COL_VALUE_WIDTH = 15;
const COL_UPDATED_WIDTH = 12;
const COL_GAP = "  ";
const ROW_INDENT = "  ";

function formatValue(metric: CliMetric): string {
  if (metric.value === null || !Number.isFinite(metric.value)) {
    return "—";
  }
  /* Integer-friendly: telemetry values are mostly counters or
   * rounded ms — `.toLocaleString` adds thousands separators
   * without bringing a number-formatting dep along. */
  const rendered = Math.round(metric.value).toLocaleString("en-US");
  return metric.unit ? `${rendered} ${metric.unit}` : rendered;
}

export async function runTelemetry(): Promise<number> {
  const url = `${getApiBase()}/api/cli/telemetry`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "emredogan-cli",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`[emredogan] network error: ${msg}\n`);
    return 2;
  }

  if (!res.ok) {
    process.stderr.write(
      `[emredogan] upstream returned ${res.status} while fetching telemetry.\n`,
    );
    return 5;
  }

  let body: TelemetryResponse;
  try {
    body = (await res.json()) as TelemetryResponse;
  } catch {
    process.stderr.write(
      `[emredogan] upstream returned non-JSON for /api/cli/telemetry.\n`,
    );
    return 5;
  }

  const metrics = Array.isArray(body.metrics) ? body.metrics : [];
  if (metrics.length === 0) {
    process.stdout.write("(no telemetry data)\n");
    return 0;
  }

  /* Header row + separator. The separator uses the U+2500 box-
   * drawing horizontal — renders cleanly on every modern
   * terminal without bringing a box-drawing dependency. */
  process.stdout.write(
    `${ROW_INDENT}${padCell("METRIC", COL_LABEL_WIDTH)}${COL_GAP}${padCell(
      "VALUE",
      COL_VALUE_WIDTH,
    )}${COL_GAP}${padCell("UPDATED", COL_UPDATED_WIDTH)}\n`,
  );
  const dashLabel = "─".repeat(COL_LABEL_WIDTH);
  const dashValue = "─".repeat(COL_VALUE_WIDTH);
  const dashUpdated = "─".repeat(COL_UPDATED_WIDTH);
  process.stdout.write(
    `${ROW_INDENT}${dashLabel}${COL_GAP}${dashValue}${COL_GAP}${dashUpdated}\n`,
  );

  for (const m of metrics) {
    const label = padCell(m.label, COL_LABEL_WIDTH);
    const value = padCell(formatValue(m), COL_VALUE_WIDTH);
    const updated = padCell(formatAgo(m.updated_at), COL_UPDATED_WIDTH);
    process.stdout.write(
      `${ROW_INDENT}${label}${COL_GAP}${value}${COL_GAP}${updated}\n`,
    );
  }

  return 0;
}
