/* ──────────────────────────────────────────────────────────────
 *  AdoptionStrip — V6 Sub-PR 15.1
 *
 *  Horizontal sparkline-of-counts for the operator surface
 *  adoption section. Five operator surfaces (/telemetry,
 *  /changelog, /lab, /v5/perception, /v5/operating) render as a
 *  single tight strip: mono surface label + tabular-nums count +
 *  a cyan tick beneath, scaled by relative count. The tick row
 *  reads as a low-resolution bar chart without ever borrowing
 *  the chrome of a real bar chart.
 *
 *  Per spec: "Rendered as a single sparkline-of-counts horizontal
 *  sequence — no individual tiles, no chrome. Just the numbers
 *  in mono with cyan ticks beneath like a low-resolution bar
 *  chart."
 *
 *  Server Component. No client JS, no motion. Reduced-motion safe
 *  by construction.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 15.1.
 * ────────────────────────────────────────────────────────────── */

export interface AdoptionEntry {
  /** Display label — e.g. "/telemetry", "/changelog". */
  label: string;
  /** Raw count (visit total). Null when no data. */
  count: number | null;
}

interface Props {
  entries: readonly AdoptionEntry[];
}

/* Compress wide counts to a 0-100 visual range using log scaling so
 * a single large surface doesn't squash the others to invisible
 * ticks. log(n+1) ∈ [0, ∞); we normalise against the row's max. */
function computeTickHeight(value: number | null, max: number): number {
  if (value === null || !Number.isFinite(value) || value <= 0) return 4;
  const logValue = Math.log(value + 1);
  const logMax = Math.log(max + 1);
  if (logMax <= 0) return 4;
  const ratio = logValue / logMax;
  /* Floor at 6 px so a non-zero count is still visually distinguishable
     from a null one; ceiling at 36 px so even the largest surface
     reads as a calm tick, not a dominant bar. */
  return Math.max(6, Math.min(36, Math.round(ratio * 36)));
}

function formatCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export default function AdoptionStrip({ entries }: Props) {
  const maxCount = entries.reduce<number>(
    (max, entry) =>
      entry.count !== null && entry.count > max ? entry.count : max,
    0,
  );

  return (
    <div className="border-t border-white/[0.06] pt-8">
      <div
        role="list"
        aria-label="Operator surface visits"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8"
      >
        {entries.map((entry) => {
          const tickHeight = computeTickHeight(entry.count, maxCount);
          return (
            <div
              key={entry.label}
              role="listitem"
              className="flex flex-col items-start"
            >
              <span className="text-2xl font-medium text-[#00d2ff] tabular-nums tracking-[-0.02em] leading-none">
                {formatCount(entry.count)}
              </span>
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary mt-3">
                {entry.label}
              </span>
              <div
                aria-hidden="true"
                className="w-full mt-3"
                style={{
                  height: `${tickHeight}px`,
                  background:
                    "linear-gradient(to top, rgba(0,210,255,0.35), rgba(0,210,255,0.10))",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
