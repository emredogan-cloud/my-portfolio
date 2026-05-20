/* ──────────────────────────────────────────────────────────────
 *  PageAtmosphere — V6 Sub-PR 11.1
 *
 *  Replaces the duplicated two-blob radial wallpaper that V1–V5
 *  inlined identically across 17 surfaces. Six typed variants,
 *  each a distinct composition within the closed cyan + black +
 *  white-opacity palette.
 *
 *  Server Component. Zero client JS. Zero animation — every
 *  variant is reduced-motion safe by construction.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 1.1.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 11.1.
 *
 *  Rollback: env flag V6_ATMOSPHERE_VARIANTS. Default OFF —
 *  the component renders the legacy two-blob composition with
 *  per-page colour preserved via the `legacy` prop, so flipping
 *  the flag off restores the pre-V6 visual contract on every
 *  surface (or renders nothing when `legacy={null}`).
 * ────────────────────────────────────────────────────────────── */

export type AtmosphereVariant =
  | "signal"
  | "archive"
  | "lab"
  | "editorial"
  | "operator"
  | "narrative";

type LegacyBlobPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

interface LegacyBlob {
  /** Full CSS colour expression, e.g. "rgba(0,210,255,0.07)". */
  color: string;
  position: LegacyBlobPosition;
  /** "lg" = 700px / 180px blur (primary). "md" = 600px / 160px blur (secondary). */
  size?: "lg" | "md";
}

export interface PageAtmosphereProps {
  variant: AtmosphereVariant;
  /**
   * Legacy two-blob fallback rendered when V6_ATMOSPHERE_VARIANTS env flag is
   * off — the pre-V6 visual contract for the surface. Pass `null` to suppress
   * legacy rendering (e.g. home page, which had no atmosphere block in V5).
   * Omitting the prop renders the canonical cyan + cyan operator-family pair.
   */
  legacy?: { primary: LegacyBlob; secondary: LegacyBlob } | null;
  /**
   * For the `narrative` variant: an optional sigil glyph rendered very large
   * at 4 % opacity in the bottom-left corner. Codex book pages pass
   * `book.sigil`. Architecture surfaces omit it.
   */
  sigil?: string;
}

const FLAG_ENV = "V6_ATMOSPHERE_VARIANTS";

function isVariantFlagOn(): boolean {
  return process.env[FLAG_ENV] === "1";
}

/* ── Legacy fallback ──────────────────────────────────────────── */

const DEFAULT_LEGACY: { primary: LegacyBlob; secondary: LegacyBlob } = {
  primary: { color: "rgba(0,210,255,0.07)", position: "top-right", size: "lg" },
  secondary: { color: "rgba(0,210,255,0.04)", position: "bottom-left", size: "md" },
};

function legacyPositionClass(pos: LegacyBlobPosition): string {
  switch (pos) {
    case "top-right":
      return "top-[-200px] right-[-200px]";
    case "top-left":
      return "top-[-200px] left-[-200px]";
    case "bottom-right":
      return "bottom-[-200px] right-[-100px]";
    case "bottom-left":
      return "bottom-[-200px] left-[-100px]";
  }
}

function legacySizeClass(size: "lg" | "md" = "lg"): string {
  return size === "lg"
    ? "w-[700px] h-[700px] blur-[180px]"
    : "w-[600px] h-[600px] blur-[160px]";
}

function LegacyAtmosphere({
  primary,
  secondary,
}: {
  primary: LegacyBlob;
  secondary: LegacyBlob;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className={`absolute rounded-full ${legacyPositionClass(primary.position)} ${legacySizeClass(primary.size)}`}
        style={{
          background: `radial-gradient(ellipse, ${primary.color} 0%, transparent 70%)`,
        }}
      />
      <div
        className={`absolute rounded-full ${legacyPositionClass(secondary.position)} ${legacySizeClass(secondary.size)}`}
        style={{
          background: `radial-gradient(ellipse, ${secondary.color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

/* ── Variants ─────────────────────────────────────────────────── */

function SignalVariant() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute top-[-180px] right-[-180px] w-[720px] h-[720px] rounded-full blur-[170px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,210,255,0.085) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 left-0 h-px"
        style={{
          width: "140vmax",
          transform: "rotate(26deg)",
          transformOrigin: "top left",
          background:
            "linear-gradient(to right, rgba(0,210,255,0.22) 0%, rgba(0,210,255,0) 65%)",
        }}
      />
    </div>
  );
}

function ArchiveVariant() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute bottom-[-220px] left-[-200px] w-[760px] h-[760px] rounded-full blur-[180px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,210,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[28vh]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,210,255,0.04) 0.7px, transparent 0.7px)",
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0",
        }}
      />
    </div>
  );
}

function LabVariant() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute top-[-180px] left-[-180px] w-[720px] h-[720px] rounded-full blur-[170px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,210,255,0.085) 0%, transparent 70%)",
        }}
      />
      {/* Horizontal 240×1px cyan rule bisecting the viewport horizontally. */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-px"
        style={{ background: "rgba(0,210,255,0.12)" }}
      />
    </div>
  );
}

function EditorialVariant() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute top-[12%] left-[8%] w-[60vmin] h-[60vmin] rounded-full blur-[170px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[8%] right-[15%] w-[55vmin] h-[55vmin] rounded-full blur-[180px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 right-0 w-px h-20 -translate-y-1/2"
        style={{ background: "rgba(0,210,255,0.28)" }}
      />
    </div>
  );
}

function OperatorVariant() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute left-0 right-0 top-1/2 h-px"
        style={{ background: "rgba(0,210,255,0.06)" }}
      />
      <div
        className="absolute top-0 bottom-0 left-1/2 w-px"
        style={{ background: "rgba(0,210,255,0.06)" }}
      />
    </div>
  );
}

function NarrativeVariant({ sigil }: { sigil?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute top-[-140px] right-[-200px] w-[860px] h-[860px] rounded-full blur-[190px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,210,255,0.10) 0%, transparent 70%)",
        }}
      />
      {sigil ? (
        <div
          className="absolute leading-none select-none"
          style={{
            bottom: "-2vmin",
            left: "-2vmin",
            color: "#00d2ff",
            opacity: 0.04,
            fontSize: "min(48vmin, 520px)",
          }}
          aria-hidden="true"
        >
          {sigil}
        </div>
      ) : null}
    </div>
  );
}

/* ── Public component ─────────────────────────────────────────── */

export default function PageAtmosphere({
  variant,
  legacy,
  sigil,
}: PageAtmosphereProps) {
  if (!isVariantFlagOn()) {
    if (legacy === null) return null;
    return <LegacyAtmosphere {...(legacy ?? DEFAULT_LEGACY)} />;
  }

  switch (variant) {
    case "signal":
      return <SignalVariant />;
    case "archive":
      return <ArchiveVariant />;
    case "lab":
      return <LabVariant />;
    case "editorial":
      return <EditorialVariant />;
    case "operator":
      return <OperatorVariant />;
    case "narrative":
      return <NarrativeVariant sigil={sigil} />;
  }
}
