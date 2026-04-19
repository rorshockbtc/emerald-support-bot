/// <reference lib="webworker" />

/**
 * In-browser LLM + embedder worker for Greater.
 *
 * - Embedder: Xenova/bge-small-en-v1.5 (small, fast, ~30MB).
 * - LLM:     onnx-community/Llama-3.2-1B-Instruct-q4f16 (~800MB,
 *            WebGPU-accelerated). Picked over Llama-3.2-3B because
 *            the 1B variant has the most stable WebGPU build at
 *            this time and downloads in <1 minute on a typical home
 *            connection. Same chat-template format; trivial swap if
 *            we move up to 3B later.
 *
 * The worker is intentionally stateless about the corpus: the main
 * thread owns IndexedDB. The worker just embeds and generates.
 */

import {
  pipeline,
  env,
  type FeatureExtractionPipeline,
  type TextGenerationPipeline,
  type ProgressInfo,
  type Tensor,
} from "@huggingface/transformers";
import type { WorkerInbound, WorkerOutbound, ChatTurn } from "./types";
import { EMBEDDER_MODEL_ID, LLM_MODEL_ID } from "./config";

// Don't try to look up models on the local filesystem; always use the
// HuggingFace hub (which is browser-cached via OPFS by Transformers.js).
env.allowLocalModels = false;

let embedder: FeatureExtractionPipeline | null = null;
let llm: TextGenerationPipeline | null = null;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function send(msg: WorkerOutbound) {
  ctx.postMessage(msg);
}

/**
 * Narrow ProgressInfo to the file/progress/status fields we surface.
 * The transformers.js union covers initiate / download / progress /
 * done; "file", "progress", and "status" are present on the relevant
 * variants and absent on others, so we read them defensively.
 */
function readProgress(p: ProgressInfo): {
  file?: string;
  progress: number;
  status?: string;
} {
  const rec = p as unknown as Record<string, unknown>;
  const file = typeof rec.file === "string" ? rec.file : undefined;
  const status = typeof rec.status === "string" ? rec.status : undefined;
  const progress =
    typeof rec.progress === "number" ? (rec.progress as number) : -1;
  return { file, progress, status };
}

async function loadAll() {
  try {
    embedder = await pipeline("feature-extraction", EMBEDDER_MODEL_ID, {
      progress_callback: (p: ProgressInfo) => {
        const { file, progress, status } = readProgress(p);
        send({ type: "progress", stage: "embedder", file, progress, status });
      },
    });
    send({ type: "ready", stage: "embedder" });

    llm = await pipeline("text-generation", LLM_MODEL_ID, {
      device: "webgpu",
      dtype: "q4f16",
      progress_callback: (p: ProgressInfo) => {
        const { file, progress, status } = readProgress(p);
        send({ type: "progress", stage: "llm", file, progress, status });
      },
    });
    send({ type: "ready", stage: "llm" });
    send({ type: "ready", stage: "all" });
  } catch (err) {
    send({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleEmbed(id: string, text: string) {
  if (!embedder) throw new Error("Embedder not ready");
  const out = (await embedder(text, {
    pooling: "mean",
    normalize: true,
  })) as Tensor;
  // Tensor.data is a Float32Array. Convert to plain array for
  // structured-clone friendliness with IndexedDB downstream.
  const vector = Array.from(out.data as Float32Array);
  send({ type: "embedResult", id, vector });
}

/** Shape of the assistant turn returned by chat-mode generation. */
interface AssistantTurn {
  role: string;
  content: string;
}
interface GeneratedItem {
  generated_text: string | AssistantTurn[];
}

function extractAssistantText(out: unknown): string {
  const first: unknown = Array.isArray(out) ? out[0] : out;
  const gen = (first as GeneratedItem | undefined)?.generated_text;
  if (Array.isArray(gen)) {
    const last = gen[gen.length - 1];
    return typeof last?.content === "string" ? last.content : "";
  }
  if (typeof gen === "string") return gen;
  return "";
}

async function handleGenerate(
  id: string,
  messages: ChatTurn[],
  maxNewTokens: number,
) {
  if (!llm) throw new Error("LLM not ready");
  const out = await llm(messages, {
    max_new_tokens: maxNewTokens,
    do_sample: false,
    return_full_text: false,
  });
  send({ type: "generateResult", id, text: extractAssistantText(out).trim() });
}

ctx.onmessage = async (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      await loadAll();
    } else if (msg.type === "embed") {
      await handleEmbed(msg.id, msg.text);
    } else if (msg.type === "generate") {
      await handleGenerate(msg.id, msg.messages, msg.maxNewTokens ?? 256);
    }
  } catch (err) {
    const id = "id" in msg ? msg.id : undefined;
    send({
      type: "error",
      id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
