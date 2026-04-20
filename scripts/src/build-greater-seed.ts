/**
 * Build the Greater meta-bot knowledge seed bundle.
 *
 * The output bundle (`data/seeds/greater.json` and the mirror at
 * `artifacts/emerald/public/seeds/greater.json`) powers the meta-bot
 * pinned to the marketing home page. The bundle is gitignored; this
 * builder script and its source list (below) are not.
 *
 * Sources
 *   - The author's `.pink` properties (full Readability text per page):
 *       hire.colonhyphenbracket.pink   — the launch / lead-gen site
 *       colonhyphenbracket.pink        — the author's main site
 *       hash.pink                      — Bitcoin / hashing musings
 *       semi.pink                      — short-form notes
 *       pipes.pink                     — Pipes proprietary extension layer
 *   - The public repo's README (rorshockbtc/greater-than) via raw.github.
 *   - Any extra URLs added to `EXTRA_URLS` below.
 *
 * Private overlay
 *   For operator-only notes (pricing for hire engagements, internal
 *   roadmap, app data not yet on the public web), hand-author a sibling
 *   file at `artifacts/emerald/public/seeds/greater-private.json` with
 *   the same shape but `private: true` on each document. The runtime
 *   loader (LLMProvider.ensureSeedBundle) merges it on top, stamps the
 *   chunks with an `internal://` page_url, and the citation UI renders
 *   them as "internal note" with no outbound link.
 *
 * Schema
 *   {
 *     "version": "v1",
 *     "generated_at": "ISO timestamp",
 *     "documents": [
 *       {
 *         "source_url":   "https://…",
 *         "source_label": "Page title",
 *         "bias":         "neutral",     // optional; defaults to neutral
 *         "private":      false,         // omit on public bundle
 *         "chunks":       [{ "chunk_index": 0, "text": "…" }, …]
 *       }
 *     ]
 *   }
 *
 * Usage
 *   pnpm --filter @workspace/scripts run build-greater-seed
 *
 * Notes
 *   - No credentials required. The .pink properties and the repo README
 *     are public.
 *   - Pages that 404 or yield no extractable text are logged and
 *     skipped, not fatal — the bundle build always completes.
 *   - This script is intentionally simpler than build-bitcoin-seed:
 *     small fixed source list, no GitHub-API rate limiting, no long-
 *     running cache. A re-run takes seconds.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_PATH = path.join(REPO_ROOT, "data", "seeds", "greater.json");
const PUBLIC_OUTPUT_PATH = path.join(
  REPO_ROOT,
  "artifacts",
  "emerald",
  "public",
  "seeds",
  "greater.json",
);

const USER_AGENT =
  "GreaterMetaBotSeedBuilder/1.0 (+https://hire.colonhyphenbracket.pink) Readability/1.0";

const TARGET_WORDS = 450;
const MAX_WORDS = 600;
const MIN_WORDS = 60;
const OVERLAP_WORDS = 60;

/** Minimum spacing between requests to the same host. */
const POLITE_DELAY_MS = 400;

/**
 * Sources to scrape. Each entry is fetched, run through Readability,
 * chunked, and added to the bundle. Order is preserved so re-runs are
 * deterministic. To add a property, just append a URL — no other
 * scaffolding required.
 */
const SEED_URLS: string[] = [
  // Author's .pink properties.
  "https://hire.colonhyphenbracket.pink/",
  "https://colonhyphenbracket.pink/",
  "https://hash.pink/",
  "https://semi.pink/",
  "https://pipes.pink/",
  // Public repo README (raw, no GitHub markup).
  "https://raw.githubusercontent.com/rorshockbtc/greater-than/main/README.md",
];

/** Allows operators to extend the source list without editing arrays. */
const EXTRA_URLS: string[] = (process.env.GREATER_EXTRA_URLS ?? "")
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

interface BundleChunk {
  text: string;
  chunk_index: number;
}
interface BundleDoc {
  source_url: string;
  source_label: string;
  bias: "neutral";
  chunks: BundleChunk[];
}
interface Bundle {
  version: string;
  generated_at: string;
  documents: BundleDoc[];
}

/* -------------------------------------------------------------- */
/*  Utilities                                                     */
/* -------------------------------------------------------------- */

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const lastHostFetch = new Map<string, number>();

async function politeFetchText(url: string): Promise<string> {
  const host = new URL(url).host;
  const last = lastHostFetch.get(host);
  if (last !== undefined) {
    const elapsed = Date.now() - last;
    if (elapsed < POLITE_DELAY_MS) {
      await sleep(POLITE_DELAY_MS - elapsed);
    }
  }
  lastHostFetch.set(host, Date.now());

  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function chunkText(input: string): BundleChunk[] {
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const paragraphs = cleaned
    .split(/(?<=[.!?])\s{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const wc = (t: string) => t.split(/\s+/).filter(Boolean).length;
  const chunks: BundleChunk[] = [];
  let buffer = "";
  for (const p of paragraphs) {
    const candidate = buffer ? `${buffer} ${p}` : p;
    if (wc(candidate) > TARGET_WORDS && wc(buffer) >= MIN_WORDS) {
      chunks.push({ text: buffer, chunk_index: chunks.length });
      const words = buffer.split(/\s+/);
      const overlap = words.slice(-OVERLAP_WORDS).join(" ");
      buffer = `${overlap} ${p}`.trim();
    } else if (wc(candidate) > MAX_WORDS) {
      chunks.push({ text: buffer || p, chunk_index: chunks.length });
      buffer = "";
    } else {
      buffer = candidate;
    }
  }
  if (buffer) chunks.push({ text: buffer, chunk_index: chunks.length });
  return chunks;
}

/**
 * Extract readable body text from raw HTML, or treat plain text /
 * markdown bodies (e.g. raw.github.com README) as-is. Returns null
 * when nothing useful can be extracted.
 */
function extractBody(
  body: string,
  url: string,
): { text: string; title: string } | null {
  // Plain text / markdown — used for raw.github.com fetches.
  const isHtml = /<html[\s>]/i.test(body) || /<body[\s>]/i.test(body);
  if (!isHtml) {
    const text = body.replace(/\s+/g, " ").trim();
    if (text.length < 80) return null;
    // Title: first markdown heading, else hostname + pathname.
    const heading = body.match(/^\s*#\s+(.+?)\s*$/m)?.[1];
    const fallback = (() => {
      try {
        const u = new URL(url);
        return `${u.host}${u.pathname}`;
      } catch {
        return url;
      }
    })();
    return { text, title: heading?.trim() || fallback };
  }
  const dom = new JSDOM(body, { url });
  const article = new Readability(dom.window.document).parse();
  const text = article?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (!text || text.length < 80) return null;
  const title =
    article?.title?.trim() ||
    dom.window.document.querySelector("title")?.textContent?.trim() ||
    url;
  return { text, title };
}

/* -------------------------------------------------------------- */
/*  Main                                                          */
/* -------------------------------------------------------------- */

async function main(): Promise<void> {
  const allUrls = [...SEED_URLS, ...EXTRA_URLS];
  console.log(`Building Greater meta-bot seed (${allUrls.length} sources)…`);

  const docs: BundleDoc[] = [];
  let chunkTotal = 0;
  let skipped = 0;

  for (let i = 0; i < allUrls.length; i += 1) {
    const url = allUrls[i];
    try {
      const body = await politeFetchText(url);
      const extracted = extractBody(body, url);
      if (!extracted) {
        console.warn(
          `  [${i + 1}/${allUrls.length}] skip ${url} (no readable body)`,
        );
        skipped += 1;
        continue;
      }
      const chunks = chunkText(extracted.text);
      if (chunks.length === 0) {
        console.warn(
          `  [${i + 1}/${allUrls.length}] skip ${url} (chunked to zero)`,
        );
        skipped += 1;
        continue;
      }
      docs.push({
        source_url: url,
        source_label: extracted.title,
        bias: "neutral",
        chunks,
      });
      chunkTotal += chunks.length;
      console.log(
        `  [${i + 1}/${allUrls.length}] ${url} → ${chunks.length} chunks (${extracted.title})`,
      );
    } catch (err) {
      console.warn(
        `  [${i + 1}/${allUrls.length}] skip ${url}: ${(err as Error).message}`,
      );
      skipped += 1;
    }
  }

  if (docs.length === 0) {
    throw new Error(
      "No documents were extracted — refusing to write an empty bundle.",
    );
  }

  const bundle: Bundle = {
    version: "v1",
    generated_at: new Date().toISOString(),
    documents: docs,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(bundle, null, 2), "utf8");
  await mkdir(path.dirname(PUBLIC_OUTPUT_PATH), { recursive: true });
  await writeFile(
    PUBLIC_OUTPUT_PATH,
    JSON.stringify(bundle, null, 2),
    "utf8",
  );

  console.log("");
  console.log(`✓ ${docs.length} documents · ${chunkTotal} chunks · ${skipped} skipped`);
  console.log(`  → ${path.relative(REPO_ROOT, OUTPUT_PATH)}`);
  console.log(`  → ${path.relative(REPO_ROOT, PUBLIC_OUTPUT_PATH)}`);
  console.log("");
  console.log(
    "Both outputs are gitignored. The runtime loader picks up the public mirror automatically.",
  );
  console.log(
    "For operator-only notes, hand-author a sibling `greater-private.json` with `private: true` on each doc.",
  );
}

main().catch((err) => {
  console.error("build-greater-seed failed:", err);
  process.exitCode = 1;
});
