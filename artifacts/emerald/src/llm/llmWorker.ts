/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * In-browser LLM + embedder worker for Greater.
 *
 * - Embedder: Xenova/bge-small-en-v1.5 (small, fast, ~30MB).
 * - LLM:     onnx-community/Llama-3.2-1B-Instruct-q4f16 (~800MB,
 *            WebGPU-accelerated). Picked over Llama-3.2-3B because
 *            the 1B variant has the best stable WebGPU build at this
 *            time and downloads in <1 minute on a typical home
 *            connection. Same chat-template format; trivial swap if
 *            we move up to 3B later.
 *
 * The worker is intentionally stateless about the corpus: the main
 * thread owns IndexedDB. The worker just embeds and generates.
 */

import {
  pipeline,
  env,
  type TextGenerationPipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import type { WorkerInbound, WorkerOutbound, ChatTurn } from "./types";

// Don't try to look up models on the local filesystem; always use the
// HuggingFace hub (which is browser-cached via OPFS by Transformers.js).
env.allowLocalModels = false;

export const LLM_MODEL_ID = "onnx-community/Llama-3.2-1B-Instruct-q4f16";
export const EMBEDDER_MODEL_ID = "Xenova/bge-small-en-v1.5";

let embedder: FeatureExtractionPipeline | null = null;
let llm: TextGenerationPipeline | null = null;

function send(msg: WorkerOutbound) {
  (self as DedicatedWorkerGlobalScope).postMessage(msg);
}

async function loadAll() {
  try {
    embedder = (await pipeline(
      "feature-extraction",
      EMBEDDER_MODEL_ID,
      {
        progress_callback: (p: any) => {
          send({
            type: "progress",
            stage: "embedder",
            file: p.file,
            progress: typeof p.progress === "number" ? p.progress : -1,
            status: p.status,
          });
        },
      },
    )) as FeatureExtractionPipeline;
    send({ type: "ready", stage: "embedder" });

    llm = (await pipeline(
      "text-generation",
      LLM_MODEL_ID,
      {
        device: "webgpu",
        dtype: "q4f16",
        progress_callback: (p: any) => {
          send({
            type: "progress",
            stage: "llm",
            file: p.file,
            progress: typeof p.progress === "number" ? p.progress : -1,
            status: p.status,
          });
        },
      } as any,
    )) as TextGenerationPipeline;
    send({ type: "ready", stage: "llm" });
    send({ type: "ready", stage: "all" });
  } catch (err) {
    send({
      type: "error",
      message: (err as Error).message ?? String(err),
    });
  }
}

async function handleEmbed(id: string, text: string) {
  if (!embedder) throw new Error("Embedder not ready");
  const out = await embedder(text, { pooling: "mean", normalize: true });
  // out.data is a TypedArray (Float32Array). Convert to plain array
  // for structured-clone friendliness with IndexedDB downstream.
  const vector = Array.from(out.data as Float32Array);
  send({ type: "embedResult", id, vector });
}

async function handleGenerate(
  id: string,
  messages: ChatTurn[],
  maxNewTokens: number,
) {
  if (!llm) throw new Error("LLM not ready");
  const out: any = await llm(messages as any, {
    max_new_tokens: maxNewTokens,
    do_sample: false,
    return_full_text: false,
  });
  // Transformers.js v3 chat-mode returns generated_text as the full
  // message array including the new assistant turn at the end.
  let text = "";
  const first = Array.isArray(out) ? out[0] : out;
  const gen = first?.generated_text;
  if (Array.isArray(gen)) {
    const last = gen[gen.length - 1];
    text =
      typeof last?.content === "string"
        ? last.content
        : JSON.stringify(last);
  } else if (typeof gen === "string") {
    text = gen;
  } else {
    text = String(gen ?? "");
  }
  send({ type: "generateResult", id, text: text.trim() });
}

self.onmessage = async (e: MessageEvent<WorkerInbound>) => {
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
    send({
      type: "error",
      id: (msg as any).id,
      message: (err as Error).message ?? String(err),
    });
  }
};
