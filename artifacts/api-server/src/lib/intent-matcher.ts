export interface IntentResult {
  intent: string;
  isSecurityAlert: boolean;
  isFinancialAdvice: boolean;
  confidence: number;
  keywords: string[];
}

const SECURITY_KEYWORDS = [
  "hacked", "hack", "hacking",
  "unauthorized", "unauthorised",
  "2fa", "two-factor", "two factor", "totp",
  "freeze", "frozen",
  "stolen", "theft", "stole",
  "compromised", "breach", "breached",
  "suspicious", "phishing", "scam",
  "locked out", "lockout", "lock out",
  "lost access", "cant login", "can't login", "cannot login",
  "someone accessed", "someone logged",
  "password reset", "reset password",
];

const FINANCIAL_KEYWORDS = [
  "price", "invest", "investment", "buy", "sell",
  "trading", "trade", "profit", "loss",
  "should i buy", "worth buying", "good time to",
  "financial advice", "tax", "taxes",
  "portfolio", "market", "bull", "bear",
];

const INTENT_PATTERNS: Array<{ intent: string; patterns: RegExp[]; category: string }> = [
  {
    intent: "jade_setup",
    category: "Jade",
    patterns: [/jade/i, /hardware wallet/i, /setup.*jade/i, /jade.*setup/i, /initialize.*jade/i],
  },
  {
    intent: "jade_firmware",
    category: "Jade",
    patterns: [/firmware/i, /update.*jade/i, /jade.*update/i, /flash/i, /brick/i],
  },
  {
    intent: "liquid_network",
    category: "Liquid Network",
    patterns: [/liquid/i, /l-btc/i, /lbtc/i, /peg-in/i, /peg-out/i, /federation/i],
  },
  {
    intent: "liquid_swap",
    category: "Liquid Network",
    patterns: [/swap/i, /exchange/i, /convert/i, /atomic/i],
  },
  {
    intent: "green_wallet",
    category: "Green Wallet",
    patterns: [/green.*wallet/i, /blockstream green/i, /wallet.*setup/i, /recovery/i, /seed/i, /mnemonic/i],
  },
  {
    intent: "lightning",
    category: "Lightning",
    patterns: [/lightning/i, /ln\b/i, /channel/i, /invoice/i, /bolt11/i],
  },
  {
    intent: "multisig",
    category: "Security",
    patterns: [/multisig/i, /multi-sig/i, /multiple.*signature/i, /2-of-3/i, /2of3/i],
  },
  {
    intent: "account_security",
    category: "Security",
    patterns: [/security/i, /secure/i, /protect/i, /backup/i],
  },
  {
    intent: "transaction",
    category: "Transactions",
    patterns: [/transaction/i, /send/i, /receive/i, /fee/i, /stuck/i, /pending/i, /unconfirmed/i, /confirm/i],
  },
  {
    intent: "general",
    category: "General",
    patterns: [/.*/],
  },
];

function scrubPII(message: string): string {
  let scrubbed = message;
  scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]");
  scrubbed = scrubbed.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD_REDACTED]");
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE_REDACTED]");
  scrubbed = scrubbed.replace(/\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/g, "[BTC_ADDR_REDACTED]");
  scrubbed = scrubbed.replace(/\b[0-9a-fA-F]{64}\b/g, "[HASH_REDACTED]");
  return scrubbed;
}

export function matchIntent(rawMessage: string): IntentResult {
  const message = scrubPII(rawMessage).toLowerCase();

  const securityHits = SECURITY_KEYWORDS.filter(kw => message.includes(kw));
  const isSecurityAlert = securityHits.length > 0;

  const financialHits = FINANCIAL_KEYWORDS.filter(kw => message.includes(kw));
  const isFinancialAdvice = financialHits.length > 0;

  if (isSecurityAlert) {
    return {
      intent: "security_alert",
      isSecurityAlert: true,
      isFinancialAdvice,
      confidence: Math.min(0.98, 0.85 + securityHits.length * 0.05),
      keywords: securityHits,
    };
  }

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return {
          intent,
          isSecurityAlert: false,
          isFinancialAdvice,
          confidence: intent === "general" ? 0.72 : 0.88 + Math.random() * 0.08,
          keywords: [],
        };
      }
    }
  }

  return {
    intent: "general",
    isSecurityAlert: false,
    isFinancialAdvice: false,
    confidence: 0.70,
    keywords: [],
  };
}

export { scrubPII };
