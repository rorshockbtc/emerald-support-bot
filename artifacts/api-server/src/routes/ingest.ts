import { Router, type IRouter, type Request, type Response } from "express";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { XMLParser } from "fast-xml-parser";
import rateLimit from "express-rate-limit";
import {
  IngestExtractBody,
  IngestExtractResponse,
  IngestSitemapBody,
  IngestSitemapResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 5 * 1024 * 1024;
const USER_AGENT =
  "GreaterIngestBot/1.0 (+https://hire.colonhyphenbracket.pink) Readability/1.0";

const ingestLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit exceeded; try again in a minute." },
});

const dailyQuotaLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 500,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Daily ingestion quota exceeded for this IP." },
});

router.use("/ingest", ingestLimiter, dailyQuotaLimiter);

function isHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Reject obvious internal targets to keep the public scraper from being
    // weaponized against the deployment's own metadata service.
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.")
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<{ text: string; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Upstream responded ${res.status}`);
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { text, finalUrl: res.url || url };
    }
    let total = 0;
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        controller.abort();
        throw new Error("Response exceeded max size");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { text, finalUrl: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

router.post("/ingest/extract", async (req: Request, res: Response): Promise<void> => {
  const parsed = IngestExtractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const url = isHttpUrl(parsed.data.url);
  if (!url) {
    res.status(400).json({ error: "URL must be a public http(s) URL" });
    return;
  }

  try {
    const { text: html, finalUrl } = await fetchText(url.toString());
    const dom = new JSDOM(html, { url: finalUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().length < 40) {
      res.status(422).json({
        error:
          "Could not extract readable content. Page may be JS-rendered or paywalled.",
      });
      return;
    }

    const looksJsRendered = /<noscript[^>]*>\s*you need to enable javascript/i.test(html);

    const payload = {
      url: finalUrl,
      title: article.title ?? null,
      byline: article.byline ?? null,
      contentText: article.textContent.replace(/\s+/g, " ").trim(),
      contentHtml: article.content ?? null,
      length: article.length ?? article.textContent.length,
      fetchedAt: new Date(),
      warning: looksJsRendered
        ? "This page appears to be JavaScript-rendered; extracted content may be incomplete."
        : null,
    };
    res.json(IngestExtractResponse.parse(payload));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    res.status(502).json({ error: `Failed to fetch or extract: ${message}` });
  }
});

interface SitemapNode {
  loc?: string | { "#text"?: string };
  lastmod?: string;
  url?: SitemapNode | SitemapNode[];
  sitemap?: SitemapNode | SitemapNode[];
}

function flattenLoc(node: unknown): string | null {
  if (typeof node === "string") return node.trim();
  if (node && typeof node === "object" && "#text" in (node as Record<string, unknown>)) {
    const t = (node as Record<string, unknown>)["#text"];
    return typeof t === "string" ? t.trim() : null;
  }
  return null;
}

function collectUrls(parsed: Record<string, unknown>): {
  pages: string[];
  childSitemaps: string[];
} {
  const pages: string[] = [];
  const childSitemaps: string[] = [];

  const urlset = parsed["urlset"] as { url?: SitemapNode | SitemapNode[] } | undefined;
  if (urlset?.url) {
    const list = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
    for (const entry of list) {
      const loc = flattenLoc(entry.loc);
      if (loc) pages.push(loc);
    }
  }

  const sitemapIndex = parsed["sitemapindex"] as
    | { sitemap?: SitemapNode | SitemapNode[] }
    | undefined;
  if (sitemapIndex?.sitemap) {
    const list = Array.isArray(sitemapIndex.sitemap)
      ? sitemapIndex.sitemap
      : [sitemapIndex.sitemap];
    for (const entry of list) {
      const loc = flattenLoc(entry.loc);
      if (loc) childSitemaps.push(loc);
    }
  }

  return { pages, childSitemaps };
}

router.post("/ingest/sitemap", async (req: Request, res: Response): Promise<void> => {
  const parsed = IngestSitemapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const url = isHttpUrl(parsed.data.url);
  if (!url) {
    res.status(400).json({ error: "URL must be a public http(s) URL" });
    return;
  }

  const xmlParser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
  });

  const visited = new Set<string>();
  const queue: string[] = [url.toString()];
  const pages = new Set<string>();
  const MAX_PAGES = 5_000;
  const MAX_SITEMAPS = 25;

  try {
    while (queue.length > 0 && visited.size < MAX_SITEMAPS && pages.size < MAX_PAGES) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const { text } = await fetchText(current, {
        headers: { accept: "application/xml,text/xml,*/*;q=0.8" },
      });
      const doc = xmlParser.parse(text) as Record<string, unknown>;
      const { pages: ps, childSitemaps } = collectUrls(doc);
      for (const p of ps) {
        if (pages.size >= MAX_PAGES) break;
        pages.add(p);
      }
      for (const s of childSitemaps) {
        if (!visited.has(s)) queue.push(s);
      }
    }

    res.json(
      IngestSitemapResponse.parse({
        sitemapUrl: url.toString(),
        urls: Array.from(pages),
        truncated: pages.size >= MAX_PAGES || visited.size >= MAX_SITEMAPS,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sitemap fetch failed";
    res.status(502).json({ error: `Failed to parse sitemap: ${message}` });
  }
});

export default router;
