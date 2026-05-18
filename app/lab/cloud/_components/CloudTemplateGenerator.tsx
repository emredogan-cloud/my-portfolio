"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Download, RefreshCw } from "lucide-react";
import {
  buildCloudformation,
  buildTerraform,
  buildVerifyCommand,
  generateExternalId,
  validateAccountId,
} from "@/lib/lab/cloud/templates";

/**
 * CloudTemplateGenerator — client island for /lab/cloud.
 *
 * Posture:
 *   - Two inputs: parent AWS account id + external id. The id
 *     defaults to a freshly-generated UUID on mount; the visitor
 *     can regenerate it via the refresh affordance or paste their
 *     own value.
 *   - Three tabs render the same three template texts every visitor
 *     would get from a bespoke generator script — CloudFormation,
 *     Terraform, CLI verify snippet. No server-side endpoint. The
 *     template strings live in lib/lab/cloud/templates and are
 *     pure functions over the two inputs.
 *   - Copy-to-clipboard and download (CFN/TF only — CLI is a single
 *     command, copy is enough).
 *   - Account-id validation happens client-side: 12 numeric digits,
 *     no separators. Invalid input renders an inline pill rather
 *     than blocking the tabs — the visitor can still read the
 *     architecture while typing.
 *   - prefers-reduced-motion: nothing animates inside this island.
 *     The shared global CSS guard already collapses Reveal motion
 *     on the wrapping page.
 */

type Tab = "cloudformation" | "terraform" | "cli";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "cloudformation", label: "CloudFormation" },
  { id: "terraform", label: "Terraform" },
  { id: "cli", label: "CLI verify" },
];

const PLACEHOLDER_ROLE_ARN =
  "arn:aws:iam::<your-account-id>:role/cloud-lab-cross-account-role";

export default function CloudTemplateGenerator() {
  const [parentAccountId, setParentAccountId] = useState("");
  const [externalId, setExternalId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("cloudformation");
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null);

  /* Mint an external id on mount. The effect-based init is
     deliberate: useState's initializer would run during SSR and
     emit a value that the client immediately replaces, causing a
     hydration mismatch on every visit. With this shape the
     server renders the empty placeholder and the client generates
     the UUID on the first commit. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExternalId(generateExternalId());
  }, []);

  const accountIdValid = parentAccountId === "" || validateAccountId(parentAccountId);

  /* The templates render off whatever the visitor has typed so far.
     When the account id is blank or invalid, we fall back to a
     placeholder so the visitor can still see the SHAPE of the
     output without entering anything. The placeholder is obvious
     enough that nobody would deploy it as-is. */
  const effectiveAccountId =
    parentAccountId && validateAccountId(parentAccountId)
      ? parentAccountId
      : "000000000000";
  const effectiveExternalId = externalId || "REGENERATE_AND_PASTE";

  const cloudformation = useMemo(
    () =>
      buildCloudformation({
        parentAccountId: effectiveAccountId,
        externalId: effectiveExternalId,
      }),
    [effectiveAccountId, effectiveExternalId],
  );
  const terraform = useMemo(
    () =>
      buildTerraform({
        parentAccountId: effectiveAccountId,
        externalId: effectiveExternalId,
      }),
    [effectiveAccountId, effectiveExternalId],
  );
  const cliVerify = useMemo(
    () =>
      buildVerifyCommand({
        roleArn: PLACEHOLDER_ROLE_ARN,
        externalId: effectiveExternalId,
      }),
    [effectiveExternalId],
  );

  const tabContent: Record<Tab, string> = {
    cloudformation,
    terraform,
    cli: cliVerify,
  };

  const downloadInfo: Record<Tab, { filename: string; mime: string } | null> = {
    cloudformation: {
      filename: "cloud-lab-role.cfn.yaml",
      mime: "application/x-yaml;charset=utf-8",
    },
    terraform: {
      filename: "cloud-lab-role.tf",
      mime: "text/plain;charset=utf-8",
    },
    cli: null,
  };

  function regenerateExternalId() {
    setExternalId(generateExternalId());
  }

  async function copyActive() {
    const text = tabContent[activeTab];
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTab(activeTab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      /* clipboard blocked — silent no-op, the textarea is still
         visible and selectable */
    }
  }

  function downloadActive() {
    const info = downloadInfo[activeTab];
    if (!info) return;
    const text = tabContent[activeTab];
    const blob = new Blob([text], { type: info.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = info.filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-6">
      {/* INPUTS */}
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-2 block">
            Parent account id
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={parentAccountId}
            onChange={(e) => setParentAccountId(e.target.value)}
            placeholder="123456789012"
            maxLength={12}
            aria-invalid={!accountIdValid}
            className={[
              "w-full rounded-xl px-4 py-3 text-sm font-mono",
              "bg-white/[0.04] border text-primary placeholder:text-faint",
              accountIdValid
                ? "border-white/[0.08] focus:border-[#00d2ff]/40"
                : "border-amber-400/40 focus:border-amber-400/60",
              "focus:outline-none focus:bg-white/[0.06] transition-colors",
            ].join(" ")}
          />
          {!accountIdValid && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/80 mt-2 inline-block">
              expected 12 numeric digits
            </span>
          )}
        </label>

        <label className="block">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary mb-2 flex items-center justify-between">
            <span>External id</span>
            <button
              type="button"
              onClick={regenerateExternalId}
              className="inline-flex items-center gap-1 text-tertiary hover:text-[#00d2ff] transition-colors"
              aria-label="Regenerate external id"
              title="Regenerate"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span className="text-[10px] tracking-[0.18em]">regen</span>
            </button>
          </span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={externalId}
            onChange={(e) => setExternalId(e.target.value.trim())}
            placeholder="generating…"
            className="w-full rounded-xl px-4 py-3 text-sm font-mono bg-white/[0.04] border border-white/[0.08] text-primary placeholder:text-faint focus:border-[#00d2ff]/40 focus:outline-none focus:bg-white/[0.06] transition-colors"
          />
        </label>
      </div>

      {/* TABS */}
      <div
        role="tablist"
        aria-label="Template format"
        className="flex items-center gap-1 border-b border-white/[0.06]"
      >
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              className={[
                "px-4 py-2 -mb-px font-mono uppercase tracking-[0.18em] text-[10px] border-b transition-colors",
                active
                  ? "text-[#00d2ff] border-[#00d2ff]/60"
                  : "text-tertiary hover:text-secondary border-transparent",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={copyActive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-tertiary hover:text-primary hover:bg-white/[0.04] transition-colors font-mono uppercase tracking-[0.18em] text-[10px]"
            aria-label="Copy template to clipboard"
            title="Copy"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-3 h-3" aria-hidden="true" />
                <span>copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>copy</span>
              </>
            )}
          </button>
          {downloadInfo[activeTab] && (
            <button
              type="button"
              onClick={downloadActive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-tertiary hover:text-primary hover:bg-white/[0.04] transition-colors font-mono uppercase tracking-[0.18em] text-[10px]"
              aria-label="Download template file"
              title="Download"
            >
              <Download className="w-3 h-3" aria-hidden="true" />
              <span>download</span>
            </button>
          )}
        </div>
      </div>

      {/* CODE BLOCK */}
      <pre
        className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-[12.5px] font-mono leading-relaxed text-primary whitespace-pre"
        aria-label={`${TABS.find((t) => t.id === activeTab)?.label} template`}
      >
        {tabContent[activeTab]}
      </pre>
    </div>
  );
}
