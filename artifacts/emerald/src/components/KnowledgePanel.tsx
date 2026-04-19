import { useCallback, useEffect, useState } from "react";
import { Database, Globe, Loader2, Trash2, X } from "lucide-react";
import { useLLM } from "@/llm/LLMProvider";
import { deleteBySource, listSources } from "@/llm/vectorStore";
import type { IndexedSource, IngestProgress } from "@/llm/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "page" | "sitemap";

export function KnowledgePanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const llm = useLLM();
  const { toast } = useToast();

  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("page");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<IngestProgress | null>(null);
  const [sources, setSources] = useState<IndexedSource[]>([]);

  const refreshSources = useCallback(async () => {
    try {
      setSources(await listSources());
    } catch {
      // IndexedDB unavailable — leave empty.
    }
  }, []);

  useEffect(() => {
    if (isOpen) void refreshSources();
  }, [isOpen, refreshSources]);

  const handleIndex = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (llm.status !== "ready") {
      toast({
        title: "Local AI not ready",
        description:
          "Wait for the in-browser model to finish loading, then try again.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    setProgress(null);
    try {
      const result = await llm.ingest({
        url: trimmed,
        mode,
        bias: "neutral",
        onProgress: (p) => setProgress(p),
      });
      toast({
        title: "Indexed",
        description: `Indexed ${result.pages_indexed} page${
          result.pages_indexed === 1 ? "" : "s"
        } · ${result.chunks_indexed} chunk${
          result.chunks_indexed === 1 ? "" : "s"
        }.`,
      });
      setUrl("");
      await refreshSources();
    } catch (err) {
      toast({
        title: "Indexing failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (sourceUrl: string) => {
    try {
      const removed = await deleteBySource(sourceUrl);
      toast({
        title: "Source removed",
        description: `Removed ${removed} chunk${removed === 1 ? "" : "s"}.`,
      });
      await refreshSources();
    } catch (err) {
      toast({
        title: "Remove failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const totalChunks = sources.reduce((n, s) => n + s.chunk_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--widget-bg))] border-[hsl(var(--widget-border))] text-[hsl(var(--widget-fg))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Knowledge base
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--widget-muted))]">
            Index pages or sitemaps into the in-browser knowledge base. Extraction
            and embedding run locally — no LLM is invoked during indexing, and
            indexed content lives in your browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-[hsl(var(--widget-border))] overflow-hidden text-xs">
              {(["page", "sitemap"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3 py-2 transition-colors",
                    mode === m
                      ? "bg-emerald-600 text-white"
                      : "text-[hsl(var(--widget-muted))] hover:bg-white/5",
                  )}
                >
                  {m === "page" ? "Single page" : "Sitemap"}
                </button>
              ))}
            </div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                mode === "page"
                  ? "https://example.com/article"
                  : "https://example.com/sitemap.xml"
              }
              className="bg-transparent border-[hsl(var(--widget-border))] text-sm"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleIndex();
              }}
            />
            <Button
              onClick={() => void handleIndex()}
              disabled={busy || !url.trim() || llm.status !== "ready"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Index"}
            </Button>
          </div>
          {llm.status !== "ready" && (
            <p className="text-[11px] text-amber-300">
              Local AI is still loading; indexing will be available shortly.
            </p>
          )}

          {progress && (
            <ProgressLine progress={progress} />
          )}
        </div>

        <div className="border-t border-[hsl(var(--widget-border))] pt-3">
          <div className="flex items-baseline justify-between mb-2">
            <h4 className="text-xs uppercase tracking-wider text-[hsl(var(--widget-muted))]">
              Indexed sources
            </h4>
            <span className="text-[11px] text-[hsl(var(--widget-muted))]">
              {sources.length} source{sources.length === 1 ? "" : "s"} · {totalChunks} chunk
              {totalChunks === 1 ? "" : "s"}
            </span>
          </div>
          {sources.length === 0 ? (
            <p className="text-xs text-[hsl(var(--widget-muted))] py-6 text-center">
              No sources indexed yet.
            </p>
          ) : (
            <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {sources.map((s) => (
                <li
                  key={s.source_url}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 group"
                >
                  <Globe className="w-3.5 h-3.5 text-[hsl(var(--widget-muted))] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {s.source_label}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--widget-muted))] truncate flex items-center gap-2">
                      <span className="truncate">{s.source_url}</span>
                      {s.bias && s.bias !== "neutral" && (
                        <span
                          className={cn(
                            "shrink-0 px-1.5 py-px rounded uppercase tracking-wider text-[9px]",
                            s.bias === "core"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-purple-500/20 text-purple-300",
                          )}
                        >
                          {s.bias}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--widget-muted))] shrink-0">
                    {s.chunk_count}
                  </span>
                  <button
                    onClick={() => void handleRemove(s.source_url)}
                    className="p-1 text-[hsl(var(--widget-muted))] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${s.source_label}`}
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-[hsl(var(--widget-muted))] hover:text-[hsl(var(--widget-fg))]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

function ProgressLine({ progress }: { progress: IngestProgress }) {
  const pct =
    progress.total_pages > 0
      ? Math.min(
          100,
          Math.round((progress.done_pages / progress.total_pages) * 100),
        )
      : 0;
  let label: string;
  switch (progress.stage) {
    case "discovering":
      label = "Discovering pages…";
      break;
    case "extracting":
      label = `Extracting ${progress.current_url ?? ""}`;
      break;
    case "embedding":
      label = `Embedding chunk ${progress.done_chunks}…`;
      break;
    case "complete":
      label = "Complete.";
      break;
    case "error":
      label = `Error: ${progress.error ?? "unknown"}`;
      break;
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-[hsl(var(--widget-muted))]">
        <span className="truncate pr-2">{label}</span>
        <span>
          {progress.done_pages}/{progress.total_pages} pages · {progress.done_chunks} chunks
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            progress.stage === "error" ? "bg-red-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
