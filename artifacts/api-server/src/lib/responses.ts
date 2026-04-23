export const FALLBACK_RESPONSES: Record<string, {
  reply: string;
  sources: Array<{ title: string; url: string; type: string }>;
}> = {
  security_alert: {
    reply: `🚨 **Your account security is our top priority.**

I've detected that your concern may be security-related. Here's what you should do immediately:

1. **Do not share your recovery phrase** with anyone, including anyone claiming to be Blockstream support.
2. **Check your 2FA settings** — if you still have access, enable or verify your two-factor authentication.
3. **Review recent activity** — look for any transactions you don't recognize.

Use the **"Secure My Account Now"** button above to access our step-by-step security guide. This will walk you through freezing your account and securing your funds.

If you believe your account is actively compromised, please escalate to our human support team using the button in the header.`,
    sources: [
      { title: "Security Best Practices", url: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green", type: "docs" },
      { title: "2FA Setup Guide", url: "https://help.blockstream.com/hc/en-us/articles/900001388566-How-do-I-set-up-two-factor-authentication-2FA-", type: "docs" },
    ],
  },
  jade_setup: {
    reply: `**Getting started with Blockstream Jade** is straightforward. Here's a quick overview:

1. **Unbox and charge** — Connect your Jade via USB-C. It will power on automatically.
2. **Download Blockstream Green** — Available on Android, iOS, and desktop. This is the companion app for Jade.
3. **Initialize your wallet** — Follow the on-screen prompts in Green to set up a new wallet or restore an existing one.
4. **Write down your recovery phrase** — Jade will generate a 12-word recovery phrase. Write it down on paper and store it securely. Never store it digitally.

Your Jade uses a unique "Virtual Secure Element" design that keeps your keys safe without relying on closed-source security chips.`,
    sources: [
      { title: "Jade Setup Guide", url: "https://help.blockstream.com/hc/en-us/articles/4403861557017-How-do-I-set-up-Jade-", type: "docs" },
      { title: "Blockstream Jade Overview", url: "https://github.com/nicola/blockstream-jade", type: "github" },
    ],
  },
  jade_firmware: {
    reply: `**Jade firmware updates** keep your device secure and add new features. Here's how to update:

1. **Connect Jade** to your phone or computer via USB or Bluetooth.
2. **Open Blockstream Green** — The app will notify you if a firmware update is available.
3. **Follow the prompts** — The update process takes a few minutes. Do not disconnect during the update.

**Troubleshooting a bricked Jade:**
- If your Jade is unresponsive after an update, hold the power button for 15 seconds to force restart.
- Connect via USB (not Bluetooth) for the most reliable recovery.
- In rare cases, you may need to reflash the firmware using the official recovery tool.

Your funds are always safe — Jade firmware updates never affect your keys or recovery phrase.`,
    sources: [
      { title: "Jade Firmware Update", url: "https://help.blockstream.com/hc/en-us/articles/4408498495769-How-do-I-update-Jade-s-firmware-", type: "docs" },
      { title: "Jade GitHub Repository", url: "https://github.com/nicola/blockstream-jade", type: "github" },
    ],
  },
  liquid_network: {
    reply: `**The Liquid Network** is a Bitcoin sidechain that enables faster, more confidential transactions.

**Key features:**
- **Fast settlements** — 2-minute block times vs Bitcoin's 10 minutes
- **Confidential Transactions** — Transaction amounts are hidden by default
- **L-BTC** — The native asset, pegged 1:1 with Bitcoin
- **Issued Assets** — Create and trade tokenized securities, stablecoins, and more

**Peg-in process** (BTC → L-BTC):
1. Send BTC to the Liquid federation address
2. Wait for 102 Bitcoin confirmations (~17 hours)
3. Receive L-BTC in your Liquid-compatible wallet

**Peg-out process** (L-BTC → BTC):
1. Initiate a peg-out from your Liquid wallet
2. The federation processes the withdrawal
3. Receive BTC at your specified address`,
    sources: [
      { title: "Liquid Network FAQ", url: "https://help.blockstream.com/hc/en-us/categories/900000061906-Liquid-Network", type: "docs" },
      { title: "Liquid Documentation", url: "https://docs.liquid.net", type: "docs" },
    ],
  },
  liquid_swap: {
    reply: `**Liquid Swaps** allow you to exchange assets on the Liquid Network with minimal fees.

You can perform swaps using:
- **Blockstream Green** — Built-in swap functionality for L-BTC and Liquid assets
- **SideSwap** — A dedicated swap service for Liquid Network assets
- **Atomic swaps** — Trustless peer-to-peer exchanges using Liquid's scripting capabilities

**To perform a swap in Green Wallet:**
1. Open your Liquid account in Green
2. Navigate to the swap feature
3. Select the assets you want to exchange
4. Review the rate and confirm

Swaps on Liquid settle in approximately 2 minutes and benefit from Confidential Transactions.`,
    sources: [
      { title: "Liquid Swaps Guide", url: "https://help.blockstream.com/hc/en-us/articles/900004633526-How-do-I-swap-assets-on-Liquid-", type: "docs" },
    ],
  },
  green_wallet: {
    reply: `**Blockstream Green** is a multi-platform Bitcoin and Liquid wallet with advanced security features.

**Setup:**
1. Download from your app store or [blockstream.com/green](https://blockstream.com/green)
2. Create a new wallet or restore from a recovery phrase
3. Choose your security model: singlesig or multisig (2-of-2)

**Recovery options:**
- **12 or 24-word recovery phrase** — The master backup for your wallet
- **PIN protection** — Quick access with a 6-digit PIN
- **Watch-only mode** — Monitor your balance without exposing keys

**Security features:**
- Two-factor authentication (email, SMS, phone call, or Google Authenticator)
- Multisig protection with Blockstream's co-signing server
- Tor support for enhanced privacy
- Hardware wallet support via Jade`,
    sources: [
      { title: "Green Wallet FAQ", url: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green", type: "docs" },
      { title: "Green Wallet GitHub", url: "https://github.com/nicola/gdk", type: "github" },
    ],
  },
  lightning: {
    reply: `**Lightning Network** support in the Blockstream ecosystem:

**Using Lightning with Green Wallet:**
- Green Wallet supports Lightning via an integrated node
- Send and receive Lightning payments directly
- No channel management required — Green handles it

**Key concepts:**
- **Channels** — Payment pathways between nodes
- **Invoices** — BOLT11 payment requests with encoded amount and destination
- **Routing** — Payments hop through connected nodes to reach the destination

**Common issues:**
- **Stuck payment** — Wait for the timeout (usually ~24 hours) or contact the recipient
- **Low inbound capacity** — You may need to receive a payment or open an inbound channel
- **Channel force-close** — Funds return to your on-chain wallet after a timelock period`,
    sources: [
      { title: "Lightning in Green", url: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green", type: "docs" },
    ],
  },
  multisig: {
    reply: `**Multisig (Multi-signature)** adds an extra layer of security to your Bitcoin holdings.

**Green Wallet Multisig (2-of-2):**
- You hold one key, Blockstream holds the other
- Both signatures required for transactions
- Time-locked recovery if Blockstream's service is unavailable
- Protects against single points of failure

**Setting up multisig:**
1. Create a new wallet in Green and select "Multisig Shield"
2. Set up 2FA — this protects the Blockstream co-signing key
3. Fund your wallet and transact with enhanced security

**With Jade:**
- Jade can serve as one of your signing devices in a multisig setup
- Supports standard BIP-174 PSBT (Partially Signed Bitcoin Transactions)`,
    sources: [
      { title: "Multisig in Green", url: "https://help.blockstream.com/hc/en-us/articles/900001390563-What-does-Multisig-Shield-mean-", type: "docs" },
    ],
  },
  transaction: {
    reply: `**Transaction help** — Here's guidance for common transaction issues:

**Stuck/Unconfirmed transaction:**
- Check the transaction status on a block explorer (e.g., mempool.space)
- If the fee was too low, you can use **RBF (Replace-By-Fee)** to bump the fee in Green Wallet
- Most transactions confirm within a few blocks if the fee is adequate

**Sending Bitcoin:**
1. Open Green Wallet and select your account
2. Tap "Send" and enter the recipient address or scan a QR code
3. Set your fee rate (higher = faster confirmation)
4. Review and confirm with your PIN or Jade

**Fee estimation:**
- Green Wallet suggests fee rates based on current network conditions
- For urgent transactions, use a higher fee priority
- For Liquid transactions, fees are typically very low (~0.1 sat/vbyte)`,
    sources: [
      { title: "Transaction FAQ", url: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green", type: "docs" },
    ],
  },
  account_security: {
    reply: `**Account Security Best Practices:**

1. **Recovery Phrase** — Write it down on paper. Never store digitally. Never share it.
2. **Two-Factor Authentication** — Enable 2FA on your Green Wallet account
3. **Hardware Wallet** — Use Blockstream Jade for cold storage of significant amounts
4. **Software Updates** — Keep Green Wallet and Jade firmware up to date
5. **Verify Addresses** — Always double-check recipient addresses before sending
6. **Beware of Scams** — Blockstream will never ask for your recovery phrase or private keys

**If you suspect a compromise:**
- Move funds to a new wallet immediately using a secure device
- Change all associated passwords
- Contact our support team for additional guidance`,
    sources: [
      { title: "Security Guide", url: "https://help.blockstream.com/hc/en-us/articles/900001388566-How-do-I-set-up-two-factor-authentication-2FA-", type: "docs" },
    ],
  },
  general: {
    reply: `Thanks for reaching out! I'm Greater, Blockstream's support assistant.

I can help you with:
- **Blockstream Green** — Wallet setup, recovery, transactions
- **Blockstream Jade** — Hardware wallet setup, firmware, troubleshooting
- **Liquid Network** — L-BTC, peg-ins/outs, swaps, issued assets
- **Lightning Network** — Payments, channels, invoices
- **Security** — 2FA, multisig, best practices

Could you tell me more about what you need help with? The more specific you are, the better I can assist you.`,
    sources: [
      { title: "Blockstream Help Center", url: "https://help.blockstream.com/hc/en-us", type: "docs" },
    ],
  },
};
