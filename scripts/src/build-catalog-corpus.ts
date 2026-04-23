/**
 * Catalog corpus emitter (Task #68 follow-up).
 *
 * Walks every leaf JSON under `artifacts/greater/public/catalog/<pack>/`
 * and writes a per-source local copy to
 * `artifacts/greater/public/corpus/<pack>/<slug>.json`, plus an
 * `_index.json` mapping source URLs to slugs.
 *
 * Why this exists: the chat trace renders a "local copy" badge for every
 * citation whose `internalSlug` resolves to a real file in the static
 * site. The runtime navigator computes `slugForSource(url)` as a
 * fallback — but that fallback only works if a file with that slug
 * actually exists. This script guarantees one exists for every URL the
 * curated catalog cites, so the affordance never 404s.
 *
 * Unlike `build-bitcoin-seed`, we do NOT fetch the upstream pages. The
 * local copy carries the same data the trace panel already shows
 * (label + url + excerpt + which leaves cite it), so the visitor can
 * verify "the bot is quoting this exact text" against a static repo
 * file with no network call to the upstream host. Operators who want
 * the *full* upstream text in the local copy should run
 * `build-bitcoin-seed`, which fetches and re-emits the same files
 * with chunked body text.
 *
 * Idempotent. Safe to run on every commit; produces stable diffs.
 */

import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { slugForSource } from "../../artifacts/greater/src/llm/catalog/slug";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CATALOG_ROOT = path.join(
  REPO_ROOT,
  "artifacts",
  "greater",
  "public",
  "catalog",
);
const CORPUS_ROOT = path.join(
  REPO_ROOT,
  "artifacts",
  "greater",
  "public",
  "corpus",
);

interface CatalogSource {
  label: string;
  url: string;
  excerpt: string;
  internalSlug?: string;
}

interface CatalogLeaf {
  id?: string;
  label?: string;
  brief?: string;
  sources?: CatalogSource[];
}

interface CorpusDocPayload {
  slug: string;
  source_url: string;
  source_label: string;
  excerpt: string;
  /**
   * Source-derived body text. Concatenates the source excerpt with
   * the full brief of every citing leaf (the curator's hand-authored
   * long-form analysis grounded in this source). The runtime
   * navigator can JIT-load this and pass it to the trace panel
   * as the chunk body — see the `jitLoadBodies` option in
   * navigator.ts.
   *
   * If `build-bitcoin-seed` is run with network access, that script
   * overwrites these files with the actual upstream-fetched chunked
   * page text. This emitter is the offline-deterministic fallback
   * that keeps every cited source resolvable in CI.
   */
  body: string;
  cited_by: {
    pack: string;
    leaf_id: string;
    leaf_label: string;
    /** The citing leaf's full brief, included so the per-doc file
     * contains substantive source-derived content even when the
     * upstream-fetch step has not been run. */
    leaf_brief: string;
  }[];
  generated_by: "build-catalog-corpus";
  generated_at: string;
}

interface CorpusIndexEntry {
  slug: string;
  source_url: string;
  source_label: string;
  cited_by_count: number;
}

/**
 * Compose the per-doc body from the excerpt + every citing leaf's
 * brief. The result is what the runtime trace panel shows as the
 * "expanded local copy" content — substantial source-derived text,
 * not just a one-line excerpt.
 */
function composeBody(
  excerpt: string,
  cited_by: { leaf_label: string; leaf_brief: string }[],
): string {
  const sections: string[] = [];
  if (excerpt) sections.push(`Source excerpt:\n${excerpt}`);
  for (const c of cited_by) {
    if (!c.leaf_brief) continue;
    sections.push(`Cited by leaf "${c.leaf_label}":\n${c.leaf_brief}`);
  }
  return sections.join("\n\n---\n\n");
}

async function listPacks(): Promise<string[]> {
  const entries = await readdir(CATALOG_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function walkJson(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkJson(full)));
    } else if (e.isFile() && e.name.endsWith(".json") && e.name !== "index.json") {
      out.push(full);
    }
  }
  return out;
}

async function emitForPack(pack: string): Promise<{ docs: number; sources: number }> {
  const packCatalogDir = path.join(CATALOG_ROOT, pack);
  const packCorpusDir = path.join(CORPUS_ROOT, pack);
  await mkdir(packCorpusDir, { recursive: true });

  const leafFiles = await walkJson(packCatalogDir);
  // Map slug → payload (deduplicate when several leaves cite the same URL).
  const bySlug = new Map<string, CorpusDocPayload>();

  for (const leafFile of leafFiles) {
    let leaf: CatalogLeaf;
    try {
      leaf = JSON.parse(await readFile(leafFile, "utf8")) as CatalogLeaf;
    } catch {
      continue; // Branch index files etc. fall through here.
    }
    if (!Array.isArray(leaf.sources) || leaf.sources.length === 0) continue;
    const leafId = leaf.id ?? path.basename(leafFile, ".json");
    const leafLabel = leaf.label ?? leafId;

    const leafBrief = leaf.brief ?? "";
    for (const src of leaf.sources) {
      if (!src?.url) continue;
      const slug = src.internalSlug ?? slugForSource(src.url);
      const existing = bySlug.get(slug);
      const cite = {
        pack,
        leaf_id: leafId,
        leaf_label: leafLabel,
        leaf_brief: leafBrief,
      };
      if (existing) {
        // First-cite wins for label/excerpt; later cites just register
        // and contribute their brief to the body.
        existing.cited_by.push(cite);
        existing.body = composeBody(existing.excerpt, existing.cited_by);
        continue;
      }
      const cited_by = [cite];
      bySlug.set(slug, {
        slug,
        source_url: src.url,
        source_label: src.label,
        excerpt: src.excerpt,
        body: composeBody(src.excerpt, cited_by),
        cited_by,
        generated_by: "build-catalog-corpus",
        // Pinned generated_at so reruns produce stable diffs unless
        // the catalog actually changed. Using a sentinel string here
        // (callers that care about freshness should look at the
        // commit timestamp of the file).
        generated_at: "static",
      });
    }
  }

  // Write per-doc payloads. We only overwrite when content has actually
  // changed, to keep git diffs minimal.
  for (const [slug, payload] of bySlug) {
    const filePath = path.join(packCorpusDir, `${slug}.json`);
    const next = JSON.stringify(payload, null, 2) + "\n";
    let prev = "";
    try {
      prev = await readFile(filePath, "utf8");
    } catch {
      // file doesn't exist yet
    }
    if (prev !== next) {
      await writeFile(filePath, next, "utf8");
    }
  }

  // Index for the trace UI's eventual "browse local corpus" affordance.
  const index: CorpusIndexEntry[] = [...bySlug.values()]
    .map((p) => ({
      slug: p.slug,
      source_url: p.source_url,
      source_label: p.source_label,
      cited_by_count: p.cited_by.length,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const indexPath = path.join(packCorpusDir, "_index.json");
  const indexNext =
    JSON.stringify(
      {
        version: "v1",
        pack,
        generated_by: "build-catalog-corpus",
        documents: index,
      },
      null,
      2,
    ) + "\n";
  let indexPrev = "";
  try {
    indexPrev = await readFile(indexPath, "utf8");
  } catch {
    // missing
  }
  if (indexPrev !== indexNext) {
    await writeFile(indexPath, indexNext, "utf8");
  }

  return { docs: bySlug.size, sources: bySlug.size };
}

async function main(): Promise<void> {
  let packs: string[];
  try {
    await stat(CATALOG_ROOT);
    packs = await listPacks();
  } catch {
    console.error(`No catalog directory at ${CATALOG_ROOT}`);
    process.exit(1);
  }
  // Today only the bitcoin pack uses the catalog architecture. Other
  // packs may opt in later.
  const eligible = packs.filter((p) => p === "bitcoin");
  if (eligible.length === 0) {
    console.log("No catalog packs to emit corpus for.");
    return;
  }
  for (const pack of eligible) {
    const { docs } = await emitForPack(pack);
    console.log(`  ${pack}: emitted ${docs} per-source local copies`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
