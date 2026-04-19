/**
 * Shared types for the in-browser LLM stack.
 *
 * The model runs in a Web Worker (see `llmWorker.ts`); the React provider
 * (see `LLMProvider.tsx`) owns the worker reference and exposes the
 * imperative API to the rest of the app.
 */

export type ChatRole = "system" | "user" | "assistant";
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/**
 * Bias label attached to ingested chunks.
 *
 *  - `core`     — content originating from the bitcoin/bitcoin reference
 *                 implementation (commits, release notes, official docs).
 *  - `knots`    — content from the bitcoinknots/bitcoin alternative client.
 *  - `neutral`  — third-party content with no fork affiliation (OpTech,
 *                 BitcoinTalk, generic web pages indexed by users).
 *
 * Tagged at ingestion time only. The toggle that filters retrieval by
 * bias is built in Task #5; this task just stamps the metadata.
 */
export type Bias = "core" | "knots" | "neutral";

export interface KbChunk {
  id: string;
  source_url: string;
  source_label: string;
  chunk_index: number;
  text: string;
  /** Optional bias tag; absent on legacy chunks (treated as 'neutral'). */
  bias?: Bias;
  /** Optional grouping for "Knowledge" UI: which ingested source bundle it came from. */
  source_type?: "seed" | "user-page" | "user-sitemap" | "bitcoin-bundle";
  /** Unix ms when the chunk was indexed. */
  indexed_at?: number;
}

/** Aggregate stats per source_url, used by the Knowledge panel. */
export interface IndexedSource {
  source_url: string;
  source_label: string;
  chunk_count: number;
  source_type?: KbChunk["source_type"];
  bias?: Bias;
  indexed_at?: number;
}

export interface IngestProgress {
  /** Pages discovered (1 for single-page mode, N for sitemap). */
  total_pages: number;
  /** Pages whose extraction + chunking + embedding finished. */
  done_pages: number;
  /** Total chunks added so far across all pages. */
  done_chunks: number;
  /** Stage label for the UI. */
  stage: "discovering" | "extracting" | "embedding" | "complete" | "error";
  /** URL currently being worked on, if any. */
  current_url?: string;
  /** Error message; only set when stage === 'error'. */
  error?: string;
}

export interface RetrievedChunk extends KbChunk {
  score: number;
}

export type ResponseSource = "local" | "cloud";

/**
 * Why a given message was served from the cloud rather than locally.
 * Carried per-message so the UI can label each turn truthfully even
 * after the global model state has changed.
 */
export type CloudReason = "loading" | "unsupported" | "local-error";

export interface ThoughtTrace {
  /** Chunks actually fed into the prompt (not fabricated). */
  chunks: RetrievedChunk[];
  /** Short summary of what the model considered. */
  reasoning: string;
}

/* ---------- Worker message protocol ---------- */

export type LoadStage = "embedder" | "llm";

export interface ProgressEvent {
  type: "progress";
  stage: LoadStage;
  /** Filename the worker is currently downloading. */
  file?: string;
  /** 0..100; -1 if unknown. */
  progress?: number;
  status?: string;
}

export interface ReadyEvent {
  type: "ready";
  stage: LoadStage | "all";
}

export interface ErrorEvent {
  type: "error";
  id?: string;
  stage?: LoadStage;
  message: string;
}

export interface EmbedRequest {
  type: "embed";
  id: string;
  text: string;
}

export interface EmbedResult {
  type: "embedResult";
  id: string;
  vector: number[];
}

export interface GenerateRequest {
  type: "generate";
  id: string;
  messages: ChatTurn[];
  maxNewTokens?: number;
}

export interface GenerateResult {
  type: "generateResult";
  id: string;
  text: string;
}

export type WorkerInbound = { type: "init" } | EmbedRequest | GenerateRequest;
export type WorkerOutbound =
  | ProgressEvent
  | ReadyEvent
  | ErrorEvent
  | EmbedResult
  | GenerateResult;

/* ---------- Provider-facing API ---------- */

/**
 * Stages of model readiness. The chat widget reflects these directly:
 *   unsupported → no WebGPU; permanent cloud-only mode
 *   idle        → worker not yet started (briefly, on mount)
 *   loading-embedder / loading-llm → downloads in flight
 *   ready       → local inference available
 *   error       → load failed; cloud fallback continues
 */
export type ModelStatus =
  | "idle"
  | "unsupported"
  | "loading-embedder"
  | "loading-llm"
  | "ready"
  | "error";

export interface ModelInfo {
  llmName: string;
  llmQuantization: string;
  embedderName: string;
  approxSizeMb: number;
  loadedAt: Date | null;
}

export interface LocalAnswer {
  text: string;
  source: ResponseSource;
  thoughtTrace?: ThoughtTrace;
}
