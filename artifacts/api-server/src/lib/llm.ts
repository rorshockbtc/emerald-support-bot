import Together from "together-ai";

let client: Together | null = null;

function getClient(): Together | null {
  if (!process.env.TOGETHER_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
  }
  return client;
}

/* ----------------------------------------------------------------- */
/*  Persona-aware system prompts                                     */
/*                                                                   */
/*  HISTORICAL NOTE: this file used to ship a single hardcoded       */
/*  SYSTEM_PROMPT that defined the bot as "Blockstream's             */
/*  intelligent support assistant" with knowledge of Green Wallet,   */
/*  Jade, Liquid, and Lightning. That was a holdover from the very   */
/*  first demo persona. Once Greater grew a homepage meta-bot (and   */
/*  six other industry templates), every cloud fallback on every     */
/*  persona was being told "you are Blockstream support" — so a      */
/*  visitor on hire.colonhyphenbracket.pink asking "can I run this   */
/*  on my own domain?" got a confident answer about Liquid and       */
/*  Jade, citing Blockstream docs, with no relationship to the       */
/*  actual product. Brand-damaging, factually wrong, and unfixable   */
/*  client-side.                                                     */
/*                                                                   */
/*  Resolution:                                                      */
/*    1. The client now sends `personaSlug` and (optionally) its     */
/*       own `systemPrompt` on every /chat call.                     */
/*    2. If the client provided a `systemPrompt`, the server uses    */
/*       it verbatim — local and cloud replies share the same        */
/*       voice and grounding by construction.                        */
/*    3. Otherwise we pick from a persona-keyed map below, falling   */
/*       through to a neutral Greater-meta-bot prompt for unknown    */
/*       personas. No persona ever silently becomes "Blockstream     */
/*       support" again.                                             */
/* ----------------------------------------------------------------- */

const GREATER_META_PROMPT = `You are the Greater product bot, running on hire.colonhyphenbracket.pink.

Greater is a free, open-source lead-generation chat platform. It ships six industry templates (FinTech, HealthTech, Faith, Schools, Small Business, Startups) and an in-browser WebGPU model so visitors can demo a chatbot without your data leaving the page. The codebase is FOSS; commercial work is offered separately by the maintainer.

Guidelines:
- You are a prototype demo. Be honest about your limits — when you are not sure, say so and point to the GitHub repo or the Contact page.
- Stay on Greater. Do not invent vendor-specific products, brands, or services that are not part of Greater.
- Be concise. Short paragraphs, plain language. No marketing fluff.
- If asked anything financial, legal, or medical, decline and suggest a real professional.
- Cite the homepage section, repo, or persona template page when you can.`;

const FINTECH_DEMO_PROMPT = `You are the FinTech demo persona shipped with Greater, an open-source lead-generation chat platform. You exist to show prospective customers how a fintech-focused Greater deployment would feel.

Guidelines:
- You answer general questions about Bitcoin, wallets, custody, and on-chain mechanics, drawing on the curated FinTech corpus.
- Never give individualised financial advice. If a question crosses that line, decline and recommend a regulated professional.
- When the visitor's perspective is set to Bitcoin Core, Bitcoin Knots, or Neutral, honour it: explain the position from that lens and flag where the other side disagrees.
- Be concise, accurate, and willing to say "I don't know — here is where to find out."`;

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  greater: GREATER_META_PROMPT,
  default: GREATER_META_PROMPT,
  fintech: FINTECH_DEMO_PROMPT,
};

function pickSystemPrompt(personaSlug?: string, clientPrompt?: string): string {
  if (clientPrompt && clientPrompt.trim().length > 0) {
    return clientPrompt;
  }
  if (personaSlug && PERSONA_SYSTEM_PROMPTS[personaSlug]) {
    return PERSONA_SYSTEM_PROMPTS[personaSlug];
  }
  return GREATER_META_PROMPT;
}

/**
 * Server-side bias system prompts. Mirrors the three perspectives the
 * Bitcoin Pipe declares in the browser (Core / Knots / Neutral). When
 * the cloud fallback receives a `biasId` from the client, we prepend
 * the matching prompt so the cloud reply honors the same stance the
 * visitor was viewing locally. Unknown biasIds fall back to a generic
 * "respect this perspective" instruction parameterised by `biasLabel`.
 */
const BIAS_SYSTEM_PROMPTS: Record<string, string> = {
  core: [
    "Active perspective: Bitcoin Core (the reference implementation).",
    "Frame answers from the Core maintainers' viewpoint. When a topic",
    "is contested between Core and Knots, explain Core's position and",
    "briefly note that Knots disagrees rather than papering over it.",
  ].join(" "),
  knots: [
    "Active perspective: Bitcoin Knots (the alternative client).",
    "Frame answers from a Knots-aligned viewpoint, including stricter",
    "policy defaults and the project's stated reasoning. When a topic",
    "is contested with Core, explain Knots' position and briefly note",
    "where Core disagrees.",
  ].join(" "),
  neutral: [
    "Active perspective: Neutral. Present multiple sides where Bitcoin",
    "Core and Bitcoin Knots disagree, without favouring either. Stick",
    "to what is objectively documented.",
  ].join(" "),
};

function biasSystemPrompt(
  biasId?: string,
  biasLabel?: string,
): string | null {
  if (!biasId && !biasLabel) return null;
  if (biasId && BIAS_SYSTEM_PROMPTS[biasId]) {
    return BIAS_SYSTEM_PROMPTS[biasId];
  }
  if (biasLabel) {
    return [
      `Active perspective: ${biasLabel}.`,
      "Frame your answer to honour this perspective and explicitly flag",
      "where alternative perspectives would disagree.",
    ].join(" ");
  }
  return null;
}

export interface BiasContext {
  biasId?: string;
  biasLabel?: string;
}

export interface PersonaContext {
  personaSlug?: string;
  systemPrompt?: string;
}

export async function generateLLMResponse(
  userMessage: string,
  intent: string,
  context?: string,
  bias?: BiasContext,
  persona?: PersonaContext,
): Promise<string | null> {
  const together = getClient();
  if (!together) {
    return null;
  }

  try {
    const baseSystemPrompt = pickSystemPrompt(
      persona?.personaSlug,
      persona?.systemPrompt,
    );
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: baseSystemPrompt },
    ];

    const biasPrompt = biasSystemPrompt(bias?.biasId, bias?.biasLabel);
    if (biasPrompt) {
      messages.push({ role: "system", content: biasPrompt });
    }

    if (context) {
      messages.push({
        role: "system",
        content: `Relevant knowledge base context:\n${context}`,
      });
    }

    messages.push({
      role: "system",
      content: `Detected intent: ${intent}. Tailor your response accordingly.`,
    });

    messages.push({ role: "user", content: userMessage });

    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      messages,
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.9,
    });

    return response.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("LLM error:", error);
    return null;
  }
}
