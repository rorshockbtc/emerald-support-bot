import {
  ingestExtract,
  ingestRss,
  ingestSitemap,
} from "@workspace/api-client-react";
import { chunkText } from "./chunker";
import { putChunkWithVector } from "./vectorStore";
import type { Bias, IngestProgress, JobKind, KbChunk } from "./types";

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

/**
 * Ingestion modes. `page` indexes a single URL; `sitemap` walks an
 * XML sitemap (or sitemap index); `rss` walks an RSS 2.0 or Atom 1.0
 * feed. All three produce one "job" in the Knowledge panel — sitemap
 * and rss may produce many pages but appear as a single ingest unit
 * the user can remove with one click.
 */
export type IngestMode = "page" | "sitemap" | "rss";

export interface IngestOptions {
  url: string;
  mode: IngestMode;
  bias?: Bias;
  /** Called between each step so the UI can show a live counter. */
  onProgress?: (p: IngestProgress) => void;
  /** Cap on pages indexed when mode is sitemap or rss. */
  maxPages?: number;
}

export interface IngestResult {
  job_id: string;
  pages_indexed: number;
  chunks_indexed: number;
}

function chunkId(jobId: string, pageUrl: string, index: number): string {
  // Stable ID so re-running the same job with the same URLs overwrites
  // prior chunks rather than duplicating them.
  return `${jobId}::${pageUrl}#${index}`;
}

function newJobId(): string {
  // Small UUID; collision risk is irrelevant per browser.
  return crypto.randomUUID();
}

interface JobMeta {
  job_id: string;
  job_root_url: string;
  job_label: string;
  job_kind: JobKind;
}

async function indexSinglePage(
  pageUrl: string,
  bias: Bias,
  job: JobMeta,
  embed: EmbedFn,
  emit: (n: number) => void,
): Promise<{ chunks: number; pageLabel: string }> {
  const extracted = await ingestExtract({ url: pageUrl });
  const chunks = chunkText(extracted.contentText);
  const pageLabel =
    extracted.title?.trim() ||
    new URL(extracted.url).hostname + new URL(extracted.url).pathname;
  const indexedAt = Date.now();
  for (const ch of chunks) {
    const vec = await embed(ch.text);
    await putChunkWithVector(
      {
        id: chunkId(job.job_id, extracted.url, ch.chunk_index),
        job_id: job.job_id,
        job_root_url: job.job_root_url,
        job_label: job.job_label,
        job_kind: job.job_kind,
        page_url: extracted.url,
        page_label: pageLabel,
        chunk_index: ch.chunk_index,
        text: ch.text,
        bias,
        indexed_at: indexedAt,
      } satisfies KbChunk,
      vec,
    );
    emit(1);
  }
  return { chunks: chunks.length, pageLabel };
}

function jobLabelFromUrl(url: string, kind: JobKind): string {
  try {
    const u = new URL(url);
    const suffix =
      kind === "sitemap" ? " (sitemap)"
      : kind === "rss" ? " (feed)"
      : "";
    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}${suffix}`;
  } catch {
    return url;
  }
}

export async function ingestUrl(
  embed: EmbedFn,
  options: IngestOptions,
): Promise<IngestResult> {
  const bias: Bias = options.bias ?? "neutral";
  const onProgress = options.onProgress ?? (() => undefined);
  const maxPages = options.maxPages ?? 200;

  const job: JobMeta = {
    job_id: newJobId(),
    job_root_url: options.url,
    job_kind: options.mode,
    job_label: jobLabelFromUrl(options.url, options.mode),
  };

  const progress: IngestProgress = {
    total_pages: options.mode === "page" ? 1 : 0,
    done_pages: 0,
    done_chunks: 0,
    stage: "discovering",
    current_url: options.url,
  };
  onProgress(progress);

  try {
    let pageUrls: string[];
    if (options.mode === "page") {
      pageUrls = [options.url];
    } else if (options.mode === "sitemap") {
      const res = await ingestSitemap({ url: options.url });
      pageUrls = res.urls.slice(0, maxPages);
    } else {
      const res = await ingestRss({ url: options.url });
      pageUrls = res.urls.slice(0, maxPages);
    }

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
        await indexSinglePage(pageUrl, bias, job, embed, (n) => {
          totalChunks += n;
          progress.done_chunks = totalChunks;
          progress.stage = "embedding";
          onProgress({ ...progress });
        });
        pagesDone += 1;
        progress.done_pages = pagesDone;
        progress.done_chunks = totalChunks;
        onProgress({ ...progress });
      } catch (err) {
        // Soft-fail individual pages on a multi-page walk so one 502
        // does not abort a hundred-page index. Single-page mode does
        // re-throw because the user is watching one URL.
        if (options.mode === "page") throw err;
        // eslint-disable-next-line no-console
        console.warn(`Skipping ${pageUrl}: ${(err as Error).message}`);
      }
    }

    progress.stage = "complete";
    progress.current_url = undefined;
    onProgress({ ...progress });
    return {
      job_id: job.job_id,
      pages_indexed: pagesDone,
      chunks_indexed: totalChunks,
    };
  } catch (err) {
    progress.stage = "error";
    progress.error = (err as Error).message;
    onProgress({ ...progress });
    throw err;
  }
}
