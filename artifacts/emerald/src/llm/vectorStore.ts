import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Bias, IndexedSource, KbChunk, RetrievedChunk } from "./types";

/**
 * IndexedDB-backed vector store for the Greater RAG pipeline.
 *
 * - `documents` keeps the human-readable corpus chunks (text + source +
 *   bias). A `source_url` index supports fast delete-by-source for the
 *   Knowledge panel.
 * - `embeddings` keeps the dense vectors keyed by document id.
 * - `meta` records the seed-corpus version + the embedder used to build
 *   the index so cache invalidation is automatic when either changes,
 *   plus arbitrary key/value flags (e.g. "bitcoin-bundle:v1" markers).
 *
 * Cosine similarity is computed in-process; for the seed-corpus size
 * (~20 chunks) this is trivially fast. The Bitcoin bundle pushes us to
 * O(10k) chunks which is still well under the threshold where you'd
 * want a real ANN index.
 */

const DB_NAME = "greater-vector-store";
const DB_VERSION = 2;

interface DocumentRow extends KbChunk {}
interface EmbeddingRow {
  document_id: string;
  vector: number[];
}
interface MetaRow {
  key: string;
  value?: string;
  version?: string;
  embedderName?: string;
  count?: number;
  installed_at?: number;
}

interface GreaterVectorDB extends DBSchema {
  documents: {
    key: string;
    value: DocumentRow;
    indexes: { by_source_url: string };
  };
  embeddings: { key: string; value: EmbeddingRow };
  meta: { key: string; value: MetaRow };
}

let dbPromise: Promise<IDBPDatabase<GreaterVectorDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GreaterVectorDB>(DB_NAME, DB_VERSION, {
      // The `transaction` parameter is the active versionchange
      // transaction; we MUST use it (rather than opening a new one) to
      // mutate existing stores during upgrade. Opening a fresh tx here
      // throws InvalidStateError.
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains("documents")) {
          const store = db.createObjectStore("documents", { keyPath: "id" });
          store.createIndex("by_source_url", "source_url", { unique: false });
        } else if (oldVersion < 2) {
          const store = transaction.objectStore("documents");
          if (!store.indexNames.contains("by_source_url")) {
            store.createIndex("by_source_url", "source_url", { unique: false });
          }
        }
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
  await db.put("meta", {
    key: "corpus",
    version,
    embedderName,
    count,
  });
}

export async function getMetaFlag(key: string): Promise<MetaRow | undefined> {
  const db = await getDb();
  return db.get("meta", key);
}

export async function setMetaFlag(
  key: string,
  value: string,
): Promise<void> {
  const db = await getDb();
  await db.put("meta", { key, value, installed_at: Date.now() });
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

/**
 * Delete every chunk + embedding belonging to the given source URL.
 * Used by the Knowledge panel's "Remove" button.
 */
export async function deleteBySource(sourceUrl: string): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(["documents", "embeddings"], "readwrite");
  const docs = await tx
    .objectStore("documents")
    .index("by_source_url")
    .getAll(sourceUrl);
  for (const doc of docs) {
    await tx.objectStore("documents").delete(doc.id);
    await tx.objectStore("embeddings").delete(doc.id);
  }
  await tx.done;
  return docs.length;
}

/**
 * List every distinct source URL with its chunk count and most recent
 * indexing timestamp. Used by the Knowledge panel's source list.
 */
export async function listSources(): Promise<IndexedSource[]> {
  const db = await getDb();
  const docs = await db.getAll("documents");
  const map = new Map<string, IndexedSource>();
  for (const doc of docs) {
    const existing = map.get(doc.source_url);
    if (existing) {
      existing.chunk_count += 1;
      if (
        doc.indexed_at &&
        (!existing.indexed_at || doc.indexed_at > existing.indexed_at)
      ) {
        existing.indexed_at = doc.indexed_at;
      }
    } else {
      map.set(doc.source_url, {
        source_url: doc.source_url,
        source_label: doc.source_label,
        chunk_count: 1,
        source_type: doc.source_type,
        bias: doc.bias,
        indexed_at: doc.indexed_at,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.indexed_at ?? 0) - (a.indexed_at ?? 0),
  );
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
  options: { biasFilter?: Bias[] } = {},
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
    if (options.biasFilter && options.biasFilter.length > 0) {
      const tag: Bias = doc.bias ?? "neutral";
      if (!options.biasFilter.includes(tag)) continue;
    }
    scored.push({ ...doc, score: cosine(queryVector, row.vector) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
