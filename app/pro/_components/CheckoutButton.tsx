"use client";

import { useState } from "react";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";

/**
 * Single-tier checkout button.
 *
 * Flow:
 *   tap → POST /api/checkout {tier} →
 *      ok    → window.location.assign(url) (LS Buy Now permalink)
 *      503   → "Billing temporarily offline" affordance, mailto fallback
 *      429   → "Slow down" affordance
 *      other → generic error
 *
 * The button stays at 44px min-height to honour the touch-target audit.
 */

type Status = "idle" | "loading" | "error";

type ErrorCode =
  | "billing-offline"
  | "rate-limited"
  | "invalid-tier"
  | "invalid-json"
  | "checkout-failed";

const ERROR_LABEL: Record<ErrorCode, string> = {
  "billing-offline": "Billing temporarily offline — email emre30283@gmail.com",
  "rate-limited": "Slow down — try again in a minute.",
  "invalid-tier": "Unknown tier.",
  "invalid-json": "Couldn't reach checkout.",
  "checkout-failed": "Couldn't reach checkout.",
};

interface Props {
  tier: "plus" | "pro";
  label: string;
  highlight?: boolean;
}

export default function CheckoutButton({ tier, label, highlight }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const handleClick = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setErrorCode(null);

    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
    } catch {
      setStatus("error");
      setErrorCode("checkout-failed");
      return;
    }

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const code = (data.error ?? "checkout-failed") as ErrorCode;
      setStatus("error");
      setErrorCode(
        code === "billing-offline" || code === "rate-limited"
          ? code
          : "checkout-failed",
      );
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { url?: string };
    if (!data.url) {
      setStatus("error");
      setErrorCode("checkout-failed");
      return;
    }
    // Redirect to the Lemon Squeezy Buy Now permalink. No need to
    // restore "idle" — the page navigates away.
    window.location.assign(data.url);
  };

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold px-6 min-h-[44px] w-full transition-colors disabled:cursor-not-allowed";

  const styleClasses = highlight
    ? "bg-white text-black hover:bg-white/90 disabled:opacity-60"
    : "bg-white/[0.06] text-primary hover:bg-white/[0.10] hover:text-primary disabled:opacity-60";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className={`${baseClasses} ${styleClasses}`}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Redirecting…
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </button>
      {status === "error" && errorCode && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-200/85"
        >
          <AlertCircle
            className="w-3 h-3 mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{ERROR_LABEL[errorCode]}</span>
        </p>
      )}
    </div>
  );
}
