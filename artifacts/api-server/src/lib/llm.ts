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

const SYSTEM_PROMPT = `You are Emerald, Blockstream's intelligent support assistant. You help users with Blockstream products including Green Wallet, Jade hardware wallet, Liquid Network, and Lightning Network.

Guidelines:
- Be concise and helpful. Use short paragraphs and bullet points.
- Never provide financial advice. If asked about price, investment, or trading, redirect to the informational disclaimer.
- For security issues, always recommend the user secure their account immediately and contact official support.
- Reference official Blockstream documentation when possible.
- Be warm and reassuring, especially for users who fear their funds may be compromised.
- Use progressive disclosure: give a clear summary first, then offer to go deeper.
- You are a prototype/demo. Be honest about your limitations.`;

export async function generateLLMResponse(
  userMessage: string,
  intent: string,
  context?: string
): Promise<string | null> {
  const together = getClient();
  if (!together) {
    return null;
  }

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

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
