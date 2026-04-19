import React, { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { useLLM } from "./LLMProvider";

/**
 * Small (i) popover surfacing the active model metadata and a
 * "Clear cache & re-download" action. Mounted in the chat widget
 * header.
 */
export function ModelInfoPopover() {
  const { modelInfo, status, clearCacheAndReload } = useLLM();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-[hsl(var(--widget-muted))] hover:text-[hsl(var(--widget-fg))] transition-colors"
        title="Model info"
        aria-label="Model info"
        data-testid="button-model-info"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-[hsl(var(--widget-border))] bg-[hsl(220,13%,10%)] p-3 text-xs text-[hsl(var(--widget-fg))] shadow-2xl"
          role="dialog"
        >
          <div className="font-semibold mb-2 text-sm">Local model</div>
          <dl className="space-y-1.5">
            <Row label="Model" value={modelInfo.llmName} mono />
            <Row label="Quantization" value={modelInfo.llmQuantization} mono />
            <Row label="Embedder" value={modelInfo.embedderName} mono />
            <Row label="Approx. size" value={`${modelInfo.approxSizeMb} MB`} />
            <Row
              label="Loaded at"
              value={
                modelInfo.loadedAt
                  ? modelInfo.loadedAt.toLocaleString()
                  : status === "ready"
                    ? "—"
                    : "Not yet loaded"
              }
            />
          </dl>
          <div className="mt-3 pt-3 border-t border-[hsl(var(--widget-border))]">
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                data-testid="button-clear-cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear cache &amp; re-download
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-[hsl(var(--widget-muted))] leading-relaxed">
                  This wipes the model cache and the local vector index,
                  then reloads the page.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => clearCacheAndReload()}
                    className="px-2 py-1 text-[11px] rounded bg-red-600 text-white hover:bg-red-500"
                    data-testid="button-clear-cache-confirm"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="px-2 py-1 text-[11px] rounded border border-[hsl(var(--widget-border))]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[hsl(var(--widget-muted))]">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-[10px] text-right break-all"
            : "text-right"
        }
      >
        {value}
      </dd>
    </div>
  );
}
