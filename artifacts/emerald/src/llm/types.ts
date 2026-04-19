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

export interface KbChunk {
  id: string;
  source_url: string;
  source_label: string;
  chunk_index: number;
  text: string;
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
