/**
 * Anti-drift gate for the Bitcoin catalog (Task #68).
 *
 * Three deterministic checks run BEFORE the navigator descends the
 * catalog tree:
 *
 *   1. Shitcoin probe — explicit altcoin mentions ("ethereum",
 *      "solana", "doge", …) trigger a curt redirect that names the
 *      asset and the catalog's actual scope. The model is never
 *      consulted; the response is canned.
 *   2. Scam / hype-cycle probe — "to the moon", "100x", "when lambo",
 *      airdrop / presale framing. Treated as off-topic for an
 *      operational Bitcoin assistant; redirected to the spirit of
 *      the catalog (sound money, technical reality).
 *   3. Financial-advice probe — "should I buy", "is it a good time",
 *      "price prediction". The bot has no business answering these
 *      and saying so plainly is a feature of the persona.
 *
 * Why deterministic: a probabilistic LLM gate would sometimes engage
 * with these queries on a tangent and quietly recommend a shitcoin.
 * A keyword regex never does. False positives (legitimate question
 * that happens to mention "ethereum" in passing) are acceptable —
 * the redirect text is short, friendly, and explains the scope.
 *
 * Hidden in this file are the actual response templates; the caller
 * (navigator.ts) just receives a ready-to-render string.
 */

export type DriftKind = "shitcoin" | "scam" | "advice" | null;

/**
 * Match whole-word so that "ethernet" doesn't trigger the "ETH" rule
 * and "doge" inside "dogecoin" doesn't double-fire. Generated via
 * `\b…\b` boundaries. Kept tight — overreach trains visitors that
 * the bot is hostile.
 */
const SHITCOIN_RE =
  /\b(eth|ethereum|sol|solana|ada|cardano|doge(?:coin)?|shitcoin|altcoin|nft|defi|memecoin|xrp|ripple|bnb|binance\s?coin|usdt|tether|usdc|stablecoin|polkadot|avalanche|tron|chainlink|monero|xmr|litecoin|ltc|bitcoin\s?cash|bch|bsv)\b/i;

const SCAM_RE =
  /\b(to\s+the\s+moon|when\s+lambo|100x|10x|1000x|presale|airdrop|rug(?:\s?pull)?|ponzi|pump|shill|degen)\b/i;

const ADVICE_RE =
  /\b(should\s+i\s+(buy|sell|invest|hold|stack|take\s+out|borrow|put|use\s+leverage)|is\s+(it|now|today)\s+(a\s+)?good\s+time|price\s+(prediction|target|forecast)|will\s+(btc|bitcoin|the\s+price)\s+(hit|reach|go|moon|crash)|how\s+much\s+will\s+(btc|bitcoin)\s+be\s+worth|take\s+out\s+a?\s*(loan|heloc|mortgage|line\s+of\s+credit)|use\s+leverage|put\s+my\s+(paycheck|salary|savings|life\s+savings)|(buy|sell)\s+the\s+(dip|top)|when\s+to\s+(buy|sell))\b/i;

export interface DriftDetection {
  kind: DriftKind;
  /** The matched substring, useful for telemetry / logging. */
  match?: string;
}

export function detectDrift(query: string): DriftDetection {
  const shit = query.match(SHITCOIN_RE);
  if (shit) return { kind: "shitcoin", match: shit[0] };
  const scam = query.match(SCAM_RE);
  if (scam) return { kind: "scam", match: scam[0] };
  const adv = query.match(ADVICE_RE);
  if (adv) return { kind: "advice", match: adv[0] };
  return { kind: null };
}

/**
 * Render the redirect text. Mentions the matched asset by name so the
 * response doesn't read like a generic deflection — visitors who asked
 * about ETH on purpose deserve to know the bot read their question.
 */
export function renderDriftRedirect(
  detection: DriftDetection,
  topicalAnchor: string,
): string {
  if (detection.kind === "shitcoin") {
    return [
      `I don't cover ${detection.match ?? "altcoins"} — this catalog is scoped to ${topicalAnchor}, on purpose.`,
      "",
      "I can talk about why that scope exists (the monetary case for a single hard asset, the engineering tradeoffs the protocol makes, what self-custody actually looks like in practice), or about what Bitcoin is doing on a specific topic. What were you actually trying to figure out?",
    ].join("\n");
  }
  if (detection.kind === "scam") {
    return [
      `That framing isn't what this assistant is for. I cover ${topicalAnchor} — the monetary thesis, how the protocol actually works, and how to hold keys safely.`,
      "",
      "If you're trying to evaluate whether something is real or hype, the honest move is to read the primary sources directly — I can point you at them. What's the underlying question?",
    ].join("\n");
  }
  if (detection.kind === "advice") {
    return [
      "I don't give buy/sell/timing advice — that's not a thing a small support bot can answer responsibly, and anyone who claims they can is either guessing or selling something.",
      "",
      `What I CAN do is explain ${topicalAnchor}: why a fixed-supply asset behaves the way it does, what the protocol actually guarantees, and what self-custody looks like in practice. Want to start there?`,
    ].join("\n");
  }
  // Defensive: caller should not reach here when kind === null.
  return `I'm scoped to ${topicalAnchor}.`;
}
