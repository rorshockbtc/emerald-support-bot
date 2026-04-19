import { Router, type IRouter, type Request, type Response } from "express";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { XMLParser } from "fast-xml-parser";
import rateLimit from "express-rate-limit";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  IngestExtractBody,
  IngestExtractResponse,
  IngestRssBody,
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

/* -------------------------------------------------------------- */
/*  SSRF guard                                                    */
/* -------------------------------------------------------------- */

/**
 * Reject IP literals or DNS results that point at infrastructure the
 * caller has no business reaching from a public scraper:
 *
 *   - loopback (127/8, ::1)
 *   - link-local (169.254/16, fe80::/10)
 *   - private RFC1918 (10/8, 172.16/12, 192.168/16)
 *   - unique-local IPv6 (fc00::/7)
 *   - cloud metadata (169.254.169.254 — covered by link-local above,
 *     but called out here because it is the headline SSRF target)
 *   - 0.0.0.0 / ::, broadcast, multicast
 *
 * IPv4 checks are bitwise on the parsed octets; IPv6 checks compare
 * the canonical address prefix.
 */
function isBlockedIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true; // unparseable → block by default
}

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts as [number, number, number, number];
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 224) return true; // multicast
  if (a >= 240) return true; // reserved / broadcast
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Strip zone identifier ("fe80::1%eth0") if present.
  const bare = lower.split("%")[0]!;
  if (bare === "::" || bare === "::1") return true; // unspecified, loopback
  if (bare.startsWith("fe8") || bare.startsWith("fe9") ||
      bare.startsWith("fea") || bare.startsWith("feb")) return true; // fe80::/10
  if (bare.startsWith("fc") || bare.startsWith("fd")) return true; // fc00::/7 ULA
  if (bare.startsWith("ff")) return true; // multicast ff00::/8
  // IPv4-mapped (::ffff:a.b.c.d) — defer to IPv4 rules.
  const v4Mapped = bare.match(/^::ffff:([0-9.]+)$/);
  if (v4Mapped) return isBlockedIPv4(v4Mapped[1]!);
  return false;
}

interface SafeUrl {
  url: URL;
  resolvedIp: string;
}

/**
 * Validate a user-supplied URL is safe to fetch from this server.
 * Performs the parse + scheme + hostname check, then resolves the
 * hostname and re-checks the resulting IP against the block list.
 *
 * Returns the parsed URL plus the resolved IP so the caller can pass
 * it to fetch() without a second DNS round-trip differing from this
 * one (the classic TOCTOU is a DNS-rebinding host that resolves
 * differently between the check and the actual fetch — `dns.lookup`
 * may use the OS resolver and cache; we accept that small window
 * because nothing in this server reaches sensitive internal targets).
 */
async function resolveSafeUrl(value: string): Promise<SafeUrl | null> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Strip brackets from IPv6 hostnames before passing to the DNS
  // resolver / IP parser.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host) return null;
  // Block obvious string-form internal hosts before paying for DNS.
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return null;
  }
  // If the host is already an IP literal, validate it directly.
  if (isIP(host)) {
    if (isBlockedIp(host)) return null;
    return { url, resolvedIp: host };
  }
  try {
    const { address } = await dnsLookup(host, { verbatim: true });
    if (isBlockedIp(address)) return null;
    return { url, resolvedIp: address };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- */
/*  Fetch with size + time bounds                                 */
/* -------------------------------------------------------------- */

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
      if (text.length > MAX_BYTES) throw new Error("Response exceeded max size");
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

/* -------------------------------------------------------------- */
/*  /ingest/extract                                               */
/* -------------------------------------------------------------- */

router.post("/ingest/extract", async (req: Request, res: Response): Promise<void> => {
  const parsed = IngestExtractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const safe = await resolveSafeUrl(parsed.data.url);
  if (!safe) {
    res.status(400).json({ error: "URL must resolve to a public http(s) address" });
    return;
  }

  try {
    const { text: html, finalUrl } = await fetchText(safe.url.toString());
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

/* -------------------------------------------------------------- */
/*  /ingest/sitemap                                               */
/* -------------------------------------------------------------- */

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
  const safe = await resolveSafeUrl(parsed.data.url);
  if (!safe) {
    res.status(400).json({ error: "URL must resolve to a public http(s) address" });
    return;
  }

  const xmlParser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
  });

  const visited = new Set<string>();
  const queue: string[] = [safe.url.toString()];
  const pages = new Set<string>();
  const MAX_PAGES = 5_000;
  const MAX_SITEMAPS = 25;

  try {
    while (queue.length > 0 && visited.size < MAX_SITEMAPS && pages.size < MAX_PAGES) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Re-validate every child sitemap URL — a sitemap index could in
      // principle list internal hosts. Skip-and-continue rather than
      // failing the whole walk so a single bad entry doesn't poison
      // the run.
      const childSafe = current === safe.url.toString()
        ? safe
        : await resolveSafeUrl(current);
      if (!childSafe) continue;

      const { text } = await fetchText(childSafe.url.toString(), {
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
        sourceUrl: safe.url.toString(),
        urls: Array.from(pages),
        truncated: pages.size >= MAX_PAGES || visited.size >= MAX_SITEMAPS,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sitemap fetch failed";
    res.status(502).json({ error: `Failed to parse sitemap: ${message}` });
  }
});

/* -------------------------------------------------------------- */
/*  /ingest/rss  (RSS 2.0 + Atom 1.0)                             */
/* -------------------------------------------------------------- */

interface RssItem {
  link?: unknown;
  guid?: unknown;
}
interface AtomEntry {
  link?: unknown;
  id?: unknown;
}

/**
 * Pull an http(s) URL out of either RSS's `<link>text</link>` form or
 * Atom's `<link href="...">` form (which fast-xml-parser surfaces as
 * either a string or an array of objects with `@_href` keys depending
 * on the document — but with `ignoreAttributes: true` we only get the
 * first link's text).
 */
function flattenLink(node: unknown): string | null {
  if (typeof node === "string") {
    const t = node.trim();
    return t || null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const got = flattenLink(item);
      if (got) return got;
    }
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const text = obj["#text"];
    if (typeof text === "string" && text.trim()) return text.trim();
    const href = obj["@_href"];
    if (typeof href === "string" && href.trim()) return href.trim();
  }
  return null;
}

function collectFeedUrls(doc: Record<string, unknown>): string[] {
  const out: string[] = [];

  // RSS 2.0: rss → channel → item[]
  const rss = doc["rss"] as { channel?: { item?: RssItem | RssItem[] } } | undefined;
  if (rss?.channel?.item) {
    const items = Array.isArray(rss.channel.item) ? rss.channel.item : [rss.channel.item];
    for (const item of items) {
      const link = flattenLink(item.link) ?? flattenLink(item.guid);
      if (link) out.push(link);
    }
  }

  // Atom 1.0: feed → entry[]
  const feed = doc["feed"] as { entry?: AtomEntry | AtomEntry[] } | undefined;
  if (feed?.entry) {
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    for (const entry of entries) {
      const link = flattenLink(entry.link) ?? flattenLink(entry.id);
      if (link) out.push(link);
    }
  }

  return out;
}

router.post("/ingest/rss", async (req: Request, res: Response): Promise<void> => {
  const parsed = IngestRssBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const safe = await resolveSafeUrl(parsed.data.url);
  if (!safe) {
    res.status(400).json({ error: "URL must resolve to a public http(s) address" });
    return;
  }

  const MAX_ENTRIES = 500;

  try {
    const { text } = await fetchText(safe.url.toString(), {
      headers: { accept: "application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.8" },
    });
    const xmlParser = new XMLParser({
      // Atom puts its href in an attribute; we explicitly need it.
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });
    const doc = xmlParser.parse(text) as Record<string, unknown>;
    const links = collectFeedUrls(doc);

    if (links.length === 0) {
      res.status(422).json({
        error: "Feed parsed but no entries with links were found (not a valid RSS or Atom feed?).",
      });
      return;
    }

    const trimmed = links.slice(0, MAX_ENTRIES);
    res.json(
      IngestSitemapResponse.parse({
        sourceUrl: safe.url.toString(),
        urls: trimmed,
        truncated: links.length > MAX_ENTRIES,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feed fetch failed";
    res.status(502).json({ error: `Failed to parse feed: ${message}` });
  }
});

export default router;
