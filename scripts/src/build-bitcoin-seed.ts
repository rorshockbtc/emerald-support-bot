/**
 * Build the Bitcoin knowledge seed bundle.
 *
 * This is the proprietary "Greater mode" curation that the FOSS shell
 * does not ship with. The output bundle (`data/seeds/bitcoin.json`) is
 * gitignored — the script and its source list are checked in, but the
 * built artifact is not.
 *
 * Sources:
 *   1. Bitcoin OpTech newsletter — every issue, extracted via Readability.
 *   2. The last 12 months of merged commits from `bitcoin/bitcoin` and
 *      `bitcoinknots/bitcoin` (commit messages, not patches).
 *   3. A curated list of high-signal BitcoinTalk threads, configured in
 *      `scripts/src/bitcoin-seed/bitcointalk-threads.json`.
 *
 * Bias tags:
 *   - bitcoin/bitcoin commits     → bias: 'core'
 *   - bitcoinknots/bitcoin commits → bias: 'knots'
 *   - OpTech, BitcoinTalk          → bias: 'neutral'
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx pnpm --filter @workspace/scripts run build-bitcoin-seed
 *
 * Without GITHUB_TOKEN you'll quickly hit anonymous rate limits (60/hr).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const OUTPUT_PATH = path.join(REPO_ROOT, "data", "seeds", "bitcoin.json");
const THREADS_CONFIG = path.join(__dirname, "bitcoin-seed", "bitcointalk-threads.json");

const USER_AGENT =
  "GreaterSeedBuilder/1.0 (+https://hire.colonhyphenbracket.pink) Readability/1.0";

const TARGET_WORDS = 450;
const MAX_WORDS = 600;
const MIN_WORDS = 60;
const OVERLAP_WORDS = 60;

type Bias = "core" | "knots" | "neutral";

interface BundleChunk {
  text: string;
  chunk_index: number;
}
interface BundleDoc {
  source_url: string;
  source_label: string;
  source_type: "optech" | "github-commit" | "bitcointalk";
  bias: Bias;
  chunks: BundleChunk[];
}
interface Bundle {
  version: string;
  generated_at: string;
  documents: BundleDoc[];
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

async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<{ text: string; finalUrl: string }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "user-agent": USER_AGENT,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return { text: await res.text(), finalUrl: res.url || url };
}

function readabilityExtract(html: string, url: string): string | null {
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  if (!article?.textContent) return null;
  return article.textContent.replace(/\s+/g, " ").trim();
}

/* ---------------- OpTech ---------------- */

async function fetchOpTechNewsletters(): Promise<BundleDoc[]> {
  console.log("Fetching Bitcoin OpTech newsletter index…");
  const { text } = await fetchText("https://bitcoinops.org/en/newsletters/");
  const dom = new JSDOM(text, { url: "https://bitcoinops.org/en/newsletters/" });
  const links = Array.from(
    dom.window.document.querySelectorAll("a[href^='/en/newsletters/']"),
  )
    .map((a) => (a as { href?: string }).href ?? "")
    .filter(
      (href) =>
        /\/en\/newsletters\/\d{4}\/\d{2}\/\d{2}\/?$/.test(href) ||
        /^https:\/\/bitcoinops\.org\/en\/newsletters\/\d{4}\/\d{2}\/\d{2}\/?$/.test(
          href,
        ),
    );
  const unique = Array.from(new Set(links)).map((href) =>
    href.startsWith("http") ? href : `https://bitcoinops.org${href}`,
  );

  console.log(`  Found ${unique.length} newsletters; extracting…`);
  const docs: BundleDoc[] = [];
  for (const url of unique) {
    try {
      const { text: html } = await fetchText(url);
      const body = readabilityExtract(html, url);
      if (!body || body.length < 200) continue;
      const dom2 = new JSDOM(html, { url });
      const title =
        dom2.window.document.querySelector("title")?.textContent?.trim() ??
        url;
      docs.push({
        source_url: url,
        source_label: title,
        source_type: "optech",
        bias: "neutral",
        chunks: chunkText(body),
      });
    } catch (err) {
      console.warn(`  skip ${url}: ${(err as Error).message}`);
    }
  }
  console.log(`  → ${docs.length} OpTech docs (${countChunks(docs)} chunks)`);
  return docs;
}

/* ---------------- GitHub commits ---------------- */

interface GhCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string };
  };
}

async function fetchGithubCommits(
  repo: string,
  bias: Bias,
  monthsBack: number,
): Promise<BundleDoc[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceIso = since.toISOString();

  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    console.warn(
      `  GITHUB_TOKEN unset — anonymous GitHub requests are limited to 60/hr.`,
    );
  }

  const headers: Record<string, string> = {
    accept: "application/vnd.github.v3+json",
    "user-agent": USER_AGENT,
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  console.log(`Fetching commits for ${repo} since ${sinceIso}…`);
  const docs: BundleDoc[] = [];
  let page = 1;
  while (page <= 30) {
    const url = `https://api.github.com/repos/${repo}/commits?since=${encodeURIComponent(sinceIso)}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (res.status === 403) {
      console.warn(`  403 from GitHub — likely rate-limited. Stopping.`);
      break;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const batch = (await res.json()) as GhCommit[];
    if (batch.length === 0) break;
    for (const c of batch) {
      const message = c.commit.message.trim();
      if (!message) continue;
      const subject = message.split("\n", 1)[0].slice(0, 120);
      const text = `Commit ${c.sha.slice(0, 12)} (${c.commit.author?.date ?? "unknown date"})\n\n${message}`;
      docs.push({
        source_url: c.html_url,
        source_label: `${repo}@${c.sha.slice(0, 7)} — ${subject}`,
        source_type: "github-commit",
        bias,
        chunks: [{ text, chunk_index: 0 }],
      });
    }
    if (batch.length < 100) break;
    page += 1;
  }
  console.log(`  → ${docs.length} commits from ${repo}`);
  return docs;
}

/* ---------------- BitcoinTalk ---------------- */

interface ThreadConfig {
  url: string;
  label?: string;
  bias?: Bias;
}

async function fetchBitcoinTalkThreads(
  configPath: string,
): Promise<BundleDoc[]> {
  let configRaw: string;
  try {
    configRaw = await readFile(configPath, "utf8");
  } catch {
    console.log("  No BitcoinTalk thread config; skipping.");
    return [];
  }
  const config = JSON.parse(configRaw) as ThreadConfig[];
  console.log(`Fetching ${config.length} BitcoinTalk thread(s)…`);
  const docs: BundleDoc[] = [];
  for (const thread of config) {
    try {
      const { text: html } = await fetchText(thread.url);
      const body = readabilityExtract(html, thread.url);
      if (!body || body.length < 200) continue;
      const dom2 = new JSDOM(html, { url: thread.url });
      const title =
        thread.label ??
        dom2.window.document.querySelector("title")?.textContent?.trim() ??
        thread.url;
      docs.push({
        source_url: thread.url,
        source_label: title,
        source_type: "bitcointalk",
        bias: thread.bias ?? "neutral",
        chunks: chunkText(body),
      });
    } catch (err) {
      console.warn(`  skip ${thread.url}: ${(err as Error).message}`);
    }
  }
  console.log(`  → ${docs.length} BitcoinTalk threads (${countChunks(docs)} chunks)`);
  return docs;
}

/* ---------------- Driver ---------------- */

function countChunks(docs: BundleDoc[]): number {
  return docs.reduce((n, d) => n + d.chunks.length, 0);
}

async function main() {
  console.log("Building Bitcoin knowledge seed bundle…");
  const optech = await fetchOpTechNewsletters();
  const core = await fetchGithubCommits("bitcoin/bitcoin", "core", 12);
  const knots = await fetchGithubCommits("bitcoinknots/bitcoin", "knots", 12);
  const talk = await fetchBitcoinTalkThreads(THREADS_CONFIG);

  const bundle: Bundle = {
    version: "v1",
    generated_at: new Date().toISOString(),
    documents: [...optech, ...core, ...knots, ...talk],
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(bundle), "utf8");

  const totalChunks = countChunks(bundle.documents);
  const sizeMb = ((await readFile(OUTPUT_PATH)).byteLength / 1024 / 1024).toFixed(2);
  console.log("");
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(
    `  ${bundle.documents.length} documents · ${totalChunks} chunks · ${sizeMb} MB`,
  );
  console.log(
    `  bias breakdown: core=${bundle.documents.filter((d) => d.bias === "core").length}, knots=${bundle.documents.filter((d) => d.bias === "knots").length}, neutral=${bundle.documents.filter((d) => d.bias === "neutral").length}`,
  );
  console.log("");
  console.log(
    "Next: copy to artifacts/emerald/public/seeds/bitcoin.json so the web app can fetch it.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
