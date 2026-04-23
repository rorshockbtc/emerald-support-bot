/**
 * Worker-safe constants shared between `llmWorker.ts` and the main
 * thread (`LLMProvider.tsx`, `ModelInfoPopover.tsx`).
 *
 * IMPORTANT: This module must NEVER import `@huggingface/transformers`
 * or any worker-only runtime. Anything that imports the worker
 * directly drags the entire transformers bundle into the main thread,
 * defeating the lazy-load architecture.
 */

export const LLM_MODEL_ID = "onnx-community/Llama-3.2-1B-Instruct-q4f16";
export const EMBEDDER_MODEL_ID = "Xenova/bge-small-en-v1.5";
export const APPROX_SIZE_MB = 830;
export const LLM_QUANTIZATION_LABEL = "q4f16 · WebGPU";
