/**
 * Curated Q&A bank generator.
 *
 * Reads each persona's existing `artifacts/emerald/public/qa-bank/<slug>.json`,
 * uses an LLM (Together AI, OpenAI-compatible) to extend it up to the
 * target size (default 30), and writes the merged result back. Existing
 * items are preserved verbatim and act as voice/style exemplars for the
 * generator. Duplicates are filtered by normalized-question match.
 *
 * Usage:
 *
 *   TOGETHER_API_KEY=... pnpm exec tsx scripts/src/build-qa-bank.ts
 *   TOGETHER_API_KEY=... pnpm exec tsx scripts/src/build-qa-bank.ts faith fintech
 *
 * The generator is deliberately conservative: items are short, cite no
 * specific URLs, decline gracefully on out-of-scope questions, and never
 * invent product names beyond those that already appear in the seed.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const QA_DIR = path.join(
  REPO_ROOT,
  "artifacts",
  "emerald",
  "public",
  "qa-bank",
);

const TARGET_PER_PERSONA = 30;
const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const TOGETHER_URL = "https://api.together.xyz/v1/chat/completions";

interface QaItem {
  q: string;
  a: string;
}

interface QaBank {
  version: string;
  generated_at: string;
  persona: string;
  items: QaItem[];
}

interface PersonaBrief {
  name: string;
  audience: string;
  brief: string;
  outOfScope: string;
}

const PERSONA_BRIEFS: Record<string, PersonaBrief> = {
  fintech: {
    name: "FinTech (Bitcoin / self-custody)",
    audience:
      "Bitcoin self-custody users — Blockstream Jade, Green wallet, Core/Knots node operators, and people thinking about leaving custodians.",
    brief:
      "Voice is calm, precise, anti-hype. Always names the failure mode (lost seed = lost funds). Promotes self-custody but acknowledges trade-offs honestly. Mentions Bitcoin Optech for technical depth. Knows the Core vs Knots policy distinction. Never gives price predictions or trading advice.",
    outOfScope:
      "Price predictions, investment advice, altcoins, anything non-Bitcoin. Decline politely and redirect to self-custody / wallet / node topics.",
  },
  healthtech: {
    name: "HealthTech",
    audience:
      "Healthcare operators evaluating browser-local AI for HIPAA-aware patient-facing surfaces (intake, scheduling, post-visit follow-up).",
    brief:
      "Voice is sober, compliance-aware, technically literate about HIPAA / BAAs / PHI. Always notes when something requires PHI handling and what the architecture would need (no third-party LLM in the path, no PHI to vendor). Never gives clinical advice. Distinguishes between marketing-site assistants (no PHI) and authenticated patient surfaces (PHI requires a different posture).",
    outOfScope:
      "Clinical diagnosis, medication advice, anything that crosses the patient-care line. Decline and redirect to operations / compliance / front-door automation topics.",
  },
  faith: {
    name: "Faith",
    audience:
      "Pastors, church staff, and faith-community administrators considering a chatbot grounded in their own teaching corpus (sermons, position papers, confessions).",
    brief:
      "Voice is pastoral, careful, theologically literate but never sectarian-aggressive. Honors the church's specific confession of faith as authoritative — the bot speaks for the church, not from the median internet. Confessional Reformed/Baptist register where the existing bank uses it, but generally communicates how a faith-specific corpus is the right grounding. Never gives spiritual direction directly; points to the elders/pastor.",
    outOfScope:
      "Spiritual direction, doctrinal arbitration outside the church's confession, comparative religion debates. Decline and redirect to scoping / discipleship / curriculum / corpus topics.",
  },
  schools: {
    name: "Schools (Classical / Christian K-12)",
    audience:
      "Heads of school, admissions directors, and curriculum coordinators at classical or Christian K-12 schools that compete on distinctiveness of curriculum and worldview.",
    brief:
      "Voice is mission-aware. Distinguishes the school's specific curriculum and worldview from 'the median internet'. Talks about parent journeys (admissions tour, applying, FAQ), faculty support (lesson context), and operational uses (calendar, dress code, drop-off). Always honors that families chose this school precisely because it is not the average.",
    outOfScope:
      "K-12 academic advice for individual students, public-school policy, comparative curriculum debates outside the school's stated philosophy. Decline and redirect to operations / admissions / values topics.",
  },
  "small-business": {
    name: "Small business (real-estate brokerage demo)",
    audience:
      "Owner-operators of small businesses — the Pinecrest Realty demo persona — where the chatbot is the difference between a captured lead and a bounce.",
    brief:
      "Voice is operational, margin-aware, conversion-focused. Talks about listings, neighborhoods, financing in plain language. Knows the owner is reading the same chat to learn what to fix on their public site. Emphasizes that the visitor's message stays in-browser unless they explicitly hand off contact info. Never gives legal or specific financial advice; routes to a licensed agent / lender.",
    outOfScope:
      "Specific legal advice, specific lending decisions, anything outside the brokerage's market or service area. Decline and redirect to listings / neighborhood / financing-overview / contact topics.",
  },
  startups: {
    name: "Startups (B2B SaaS)",
    audience:
      "Founders and growth leads at high-growth B2B SaaS startups whose customers are increasingly aware of where their data goes.",
    brief:
      "Voice is product-literate, candid about trade-offs, allergic to hype. Talks about pricing pages, onboarding flow, integrations, security questionnaire answers, and the difference between a marketing-site assistant and a logged-in product surface. Knows the cost story (no per-message API tax, browser-local) and the privacy story (message stays in-browser).",
    outOfScope:
      "Investment / fundraising advice, specific legal/tax guidance, competitor takedowns. Decline and redirect to product / onboarding / pricing / security-posture topics.",
  },
};

function normalizeQ(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(
  brief: PersonaBrief,
  existing: QaItem[],
  needed: number,
): { system: string; user: string } {
  const exemplars = existing
    .slice(0, 8)
    .map(
      (item, i) =>
        `Example ${i + 1}:\nQ: ${item.q}\nA: ${item.a}`,
    )
    .join("\n\n");

  const system =
    `You are extending a curated Q&A bank for a persona-specific support chatbot. ` +
    `The bank is loaded into a browser-local semantic cache: when a visitor's question matches above a cosine threshold, the curated answer is served instantly with zero LLM tokens spent. ` +
    `That means each Q must be a question a real visitor would actually type, and each A must be self-contained, accurate, and the same voice as the existing items. ` +
    `Output STRICT JSON only — a single JSON object with an "items" array. No prose, no markdown fences.`;

  const user =
    `# Persona\n` +
    `${brief.name}\n\n` +
    `# Audience\n` +
    `${brief.audience}\n\n` +
    `# Voice & substance\n` +
    `${brief.brief}\n\n` +
    `# Out-of-scope behavior\n` +
    `${brief.outOfScope}\n\n` +
    `# Existing items (preserve voice; do NOT duplicate these)\n` +
    `${exemplars}\n\n` +
    `# Task\n` +
    `Generate exactly ${needed} additional Q&A items that:\n` +
    `- Cover topics NOT already in the existing items.\n` +
    `- Stay in the voice and substance described above.\n` +
    `- Use questions a real visitor would type (short, natural, sometimes awkward).\n` +
    `- Give answers that are 2-5 sentences, self-contained, no URLs, no fabricated product names.\n` +
    `- Include at least 2 out-of-scope decline-and-redirect items.\n` +
    `- Include at least 2 items that surface the privacy/architecture story for this persona where natural.\n\n` +
    `# Output format\n` +
    `{\n  "items": [\n    { "q": "...", "a": "..." },\n    ...\n  ]\n}\n`;

  return { system, user };
}

async function generateItems(
  brief: PersonaBrief,
  existing: QaItem[],
  needed: number,
  apiKey: string,
  model: string,
): Promise<QaItem[]> {
  const { system, user } = buildPrompt(brief, existing, needed);

  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Together API ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty completion from Together API");

  // The model occasionally wraps JSON in a code fence even when asked
  // not to. Strip a leading/trailing ```json ... ``` block defensively.
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Could not parse JSON: ${(err as Error).message}\nContent: ${cleaned.slice(0, 400)}`,
    );
  }

  const items = (parsed as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    throw new Error("Response missing top-level `items` array");
  }

  const validated: QaItem[] = [];
  for (const it of items) {
    if (
      it &&
      typeof it === "object" &&
      typeof (it as QaItem).q === "string" &&
      typeof (it as QaItem).a === "string" &&
      (it as QaItem).q.trim().length > 0 &&
      (it as QaItem).a.trim().length > 0
    ) {
      validated.push({
        q: (it as QaItem).q.trim(),
        a: (it as QaItem).a.trim(),
      });
    }
  }
  return validated;
}

async function processPersona(
  slug: string,
  apiKey: string,
  model: string,
): Promise<void> {
  const brief = PERSONA_BRIEFS[slug];
  if (!brief) {
    console.warn(`  skip: no brief for "${slug}"`);
    return;
  }

  const filePath = path.join(QA_DIR, `${slug}.json`);
  const raw = await readFile(filePath, "utf-8");
  const bank = JSON.parse(raw) as QaBank;

  if (bank.items.length >= TARGET_PER_PERSONA) {
    console.log(
      `  ${slug}: already ${bank.items.length} items (target ${TARGET_PER_PERSONA}); skipping`,
    );
    return;
  }

  const needed = TARGET_PER_PERSONA - bank.items.length;
  // Ask for a small surplus so dedupe still leaves us at target.
  const askFor = needed + 5;
  console.log(
    `  ${slug}: ${bank.items.length} items → asking for ${askFor} new items`,
  );

  const generated = await generateItems(brief, bank.items, askFor, apiKey, model);
  console.log(`    received ${generated.length} candidates`);

  const seen = new Set(bank.items.map((it) => normalizeQ(it.q)));
  const merged: QaItem[] = [...bank.items];
  for (const item of generated) {
    if (merged.length >= TARGET_PER_PERSONA) break;
    const key = normalizeQ(item.q);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  if (merged.length === bank.items.length) {
    console.warn(
      `    no new unique items merged for ${slug}; nothing written`,
    );
    return;
  }

  const updated: QaBank = {
    ...bank,
    generated_at: new Date().toISOString().slice(0, 10),
    items: merged,
  };

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  console.log(
    `    wrote ${filePath} — ${updated.items.length} items (+${updated.items.length - bank.items.length})`,
  );
}

async function main() {
  const apiKey = process.env["TOGETHER_API_KEY"];
  if (!apiKey) {
    console.error(
      "TOGETHER_API_KEY is unset. Set it (or pass it inline) and retry.",
    );
    process.exit(1);
  }
  const model = process.env["QA_BANK_MODEL"] ?? DEFAULT_MODEL;

  const requested = process.argv.slice(2);
  const slugs =
    requested.length > 0 ? requested : Object.keys(PERSONA_BRIEFS);

  console.log(
    `Building Q&A banks for ${slugs.length} persona(s) using ${model}`,
  );
  console.log("");

  for (const slug of slugs) {
    try {
      await processPersona(slug, apiKey, model);
    } catch (err) {
      console.error(`  ${slug}: FAILED — ${(err as Error).message}`);
    }
  }

  console.log("");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
