import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { KbChunk, RetrievedChunk } from "./types";

/**
 * IndexedDB-backed vector store for the Greater RAG pipeline.
 *
 * - `documents` keeps the human-readable corpus chunks (text + source).
 * - `embeddings` keeps the dense vectors keyed by document id.
 * - `meta` records seed-corpus version + the embedder used to build the
 *   index so cache invalidation is automatic when either changes.
 *
 * Cosine similarity is computed in-process; for the seed-corpus size
 * (~20 chunks) this is trivially fast.
 */

const DB_NAME = "greater-vector-store";
const DB_VERSION = 1;

interface DocumentRow extends KbChunk {}
interface EmbeddingRow {
  document_id: string;
  vector: number[];
}
interface MetaRow {
  key: "corpus";
  version: string;
  embedderName: string;
  count: number;
}

interface GreaterVectorDB extends DBSchema {
  documents: { key: string; value: DocumentRow };
  embeddings: { key: string; value: EmbeddingRow };
  meta: { key: string; value: MetaRow };
}

let dbPromise: Promise<IDBPDatabase<GreaterVectorDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GreaterVectorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("documents"))
          db.createObjectStore("documents", { keyPath: "id" });
        if (!db.objectStoreNames.contains("embeddings"))
          db.createObjectStore("embeddings", { keyPath: "document_id" });
        if (!db.objectStoreNames.contains("meta"))
          db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export async function getCorpusMeta(): Promise<MetaRow | undefined> {
  const db = await getDb();
  return db.get("meta", "corpus");
}

export async function setCorpusMeta(
  version: string,
  embedderName: string,
  count: number,
): Promise<void> {
  const db = await getDb();
  await db.put("meta", { key: "corpus", version, embedderName, count });
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear("documents");
  await db.clear("embeddings");
  await db.clear("meta");
}

export async function putChunkWithVector(
  chunk: KbChunk,
  vector: number[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["documents", "embeddings"], "readwrite");
  await tx.objectStore("documents").put(chunk);
  await tx
    .objectStore("embeddings")
    .put({ document_id: chunk.id, vector });
  await tx.done;
}

export async function countDocuments(): Promise<number> {
  const db = await getDb();
  return db.count("documents");
}

function cosine(a: number[], b: number[]): number {
  // Embeddings are L2-normalized at the embedder; cosine reduces to dot
  // product, but we still compute the full form to stay correct if the
  // normalization assumption ever changes.
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function topK(
  queryVector: number[],
  k: number,
): Promise<RetrievedChunk[]> {
  const db = await getDb();
  const [docs, embs] = await Promise.all([
    db.getAll("documents"),
    db.getAll("embeddings"),
  ]);
  const docById = new Map(docs.map((d) => [d.id, d]));
  const scored: RetrievedChunk[] = [];
  for (const row of embs) {
    const doc = docById.get(row.document_id);
    if (!doc) continue;
    scored.push({ ...doc, score: cosine(queryVector, row.vector) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
