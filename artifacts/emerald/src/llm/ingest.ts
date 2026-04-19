import { ingestExtract, ingestSitemap } from "@workspace/api-client-react";
import { chunkText } from "./chunker";
import { putChunkWithVector } from "./vectorStore";
import type { Bias, IngestProgress, KbChunk } from "./types";

/**
 * Ingestion orchestrator. Lives in the main thread because it needs the
 * embed worker (owned by `LLMProvider`) and IndexedDB. The HTTP fetches
 * to extract clean text are *not* run from the browser directly — they
 * go through the API server (`/api/ingest/*`) for CORS + rate limiting.
 *
 * The orchestrator is deliberately stateless and decoupled from React:
 * pass in an `embed` callback (typically `LLMProvider.embed`) plus a
 * progress callback, and it will report each milestone.
 *
 * Critical: NO LLM is called during ingestion. Extraction is Readability
 * on the server, chunking is deterministic word-count splitting, and
 * embedding is the local sentence-transformer. This is a hard product
 * constraint — every claim about "no telemetry, no cloud" depends on
 * ingestion staying offline.
 */

export type EmbedFn = (text: string) => Promise<number[]>;

export interface IngestOptions {
  url: string;
  mode: "page" | "sitemap";
  bias?: Bias;
  /** Called between each step so the UI can show a live counter. */
  onProgress?: (p: IngestProgress) => void;
  /** Cap on pages indexed when mode === 'sitemap'. */
  maxPages?: number;
}

export interface IngestResult {
  pages_indexed: number;
  chunks_indexed: number;
}

function chunkId(sourceUrl: string, index: number): string {
  // Stable ID so re-indexing the same URL overwrites prior chunks.
  return `${sourceUrl}#${index}`;
}

async function indexSinglePage(
  url: string,
  bias: Bias,
  sourceType: KbChunk["source_type"],
  embed: EmbedFn,
  emit: (n: number) => void,
): Promise<{ chunks: number; label: string }> {
  const extracted = await ingestExtract({ url });
  const chunks = chunkText(extracted.contentText);
  const label =
    extracted.title?.trim() ||
    new URL(extracted.url).hostname + new URL(extracted.url).pathname;
  const indexedAt = Date.now();
  for (const ch of chunks) {
    const vec = await embed(ch.text);
    await putChunkWithVector(
      {
        id: chunkId(extracted.url, ch.chunk_index),
        source_url: extracted.url,
        source_label: label,
        chunk_index: ch.chunk_index,
        text: ch.text,
        bias,
        source_type: sourceType,
        indexed_at: indexedAt,
      },
      vec,
    );
    emit(1);
  }
  return { chunks: chunks.length, label };
}

export async function ingestUrl(
  embed: EmbedFn,
  options: IngestOptions,
): Promise<IngestResult> {
  const bias: Bias = options.bias ?? "neutral";
  const onProgress = options.onProgress ?? (() => undefined);
  const maxPages = options.maxPages ?? 200;

  const progress: IngestProgress = {
    total_pages: options.mode === "page" ? 1 : 0,
    done_pages: 0,
    done_chunks: 0,
    stage: "discovering",
    current_url: options.url,
  };
  onProgress(progress);

  try {
    const pageUrls: string[] =
      options.mode === "page"
        ? [options.url]
        : await ingestSitemap({ url: options.url }).then((res) =>
            res.urls.slice(0, maxPages),
          );

    progress.total_pages = pageUrls.length;
    progress.stage = "extracting";
    onProgress({ ...progress });

    let totalChunks = 0;
    let pagesDone = 0;

    for (const pageUrl of pageUrls) {
      progress.current_url = pageUrl;
      progress.stage = "extracting";
      onProgress({ ...progress });
      try {
        const { chunks } = await indexSinglePage(
          pageUrl,
          bias,
          options.mode === "page" ? "user-page" : "user-sitemap",
          embed,
          (n) => {
            totalChunks += n;
            progress.done_chunks = totalChunks;
            progress.stage = "embedding";
            onProgress({ ...progress });
          },
        );
        pagesDone += 1;
        progress.done_pages = pagesDone;
        progress.done_chunks = totalChunks;
        onProgress({ ...progress });
        // chunks variable also tracked through the emit callback
        void chunks;
      } catch (err) {
        // Soft-fail individual pages on a sitemap walk so one 502 does
        // not abort a multi-hundred-page index. Single-page mode does
        // re-throw because the user is watching one URL.
        if (options.mode === "page") throw err;
        // eslint-disable-next-line no-console
        console.warn(`Skipping ${pageUrl}: ${(err as Error).message}`);
      }
    }

    progress.stage = "complete";
    progress.current_url = undefined;
    onProgress({ ...progress });
    return { pages_indexed: pagesDone, chunks_indexed: totalChunks };
  } catch (err) {
    progress.stage = "error";
    progress.error = (err as Error).message;
    onProgress({ ...progress });
    throw err;
  }
}
