import { db, articlesTable } from "@workspace/db";
import { pool } from "@workspace/db";

const articles = [
  {
    title: "How do I set up Blockstream Jade?",
    description: "Step-by-step guide to initializing your Blockstream Jade hardware wallet, including firmware setup and wallet creation.",
    body: "Blockstream Jade is an open-source hardware wallet designed for Bitcoin and Liquid Network. To set up your Jade:\n\n1. Connect your Jade to your phone or computer via USB-C or Bluetooth.\n2. Download and install Blockstream Green from your app store or blockstream.com/green.\n3. Open Green and select 'Set up a new wallet' or 'Restore an existing wallet'.\n4. Follow the on-screen prompts to create a new 12-word recovery phrase.\n5. Write down your recovery phrase on paper and store it in a secure location.\n6. Set a PIN for quick access.\n\nJade uses a unique 'Virtual Secure Element' that keeps your private keys safe without relying on closed-source security chips. Your recovery phrase is the master backup for your wallet — never store it digitally or share it with anyone.",
    category: "Jade",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/4403861557017-How-do-I-set-up-Jade-",
    trustScore: 0.96,
  },
  {
    title: "How do I update Jade's firmware?",
    description: "Instructions for updating your Blockstream Jade hardware wallet firmware to the latest version.",
    body: "Keeping your Jade firmware up to date ensures you have the latest security patches and features.\n\n1. Connect your Jade to Blockstream Green via USB or Bluetooth.\n2. Green will automatically check for firmware updates.\n3. If an update is available, you'll see a prompt to install it.\n4. Follow the on-screen instructions — the process takes a few minutes.\n5. Do not disconnect your Jade during the update.\n\nIf your Jade becomes unresponsive after an update:\n- Hold the power button for 15 seconds to force restart.\n- Try connecting via USB instead of Bluetooth.\n- Use the official recovery tool if needed.\n\nYour funds are always safe — firmware updates never affect your keys or recovery phrase.",
    category: "Jade",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/4408498495769-How-do-I-update-Jade-s-firmware-",
    trustScore: 0.95,
  },
  {
    title: "How do I set up two-factor authentication (2FA)?",
    description: "Guide to enabling and configuring two-factor authentication on your Blockstream Green wallet for enhanced security.",
    body: "Two-factor authentication adds an extra layer of security to your Green wallet.\n\nSupported 2FA methods:\n- Google Authenticator / TOTP apps\n- Email verification\n- SMS (less recommended due to SIM swap risks)\n- Phone call verification\n\nTo enable 2FA:\n1. Open Green Wallet and go to Settings.\n2. Select 'Two-Factor Authentication'.\n3. Choose your preferred 2FA method.\n4. Follow the verification steps.\n5. Save your backup codes securely.\n\nImportant: If you lose access to your 2FA method, you can recover using your recovery phrase and the built-in recovery mechanism. For multisig (2-of-2) accounts, there is a time-locked recovery path.",
    category: "Security",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/900001388566-How-do-I-set-up-two-factor-authentication-2FA-",
    trustScore: 0.97,
  },
  {
    title: "What is the Liquid Network?",
    description: "Overview of the Liquid Network Bitcoin sidechain, including L-BTC, confidential transactions, and issued assets.",
    body: "The Liquid Network is a federated Bitcoin sidechain that enables faster, more confidential Bitcoin transactions.\n\nKey features:\n- Fast settlements: 2-minute block times vs Bitcoin's ~10 minutes\n- Confidential Transactions: amounts are cryptographically hidden by default\n- L-BTC: the native asset, pegged 1:1 with Bitcoin via a federation\n- Issued Assets: tokenize securities, stablecoins, and more\n\nPeg-in (BTC → L-BTC):\n1. Send BTC to the Liquid federation address\n2. Wait for 102 Bitcoin confirmations (~17 hours)\n3. Receive L-BTC in your Liquid-compatible wallet\n\nPeg-out (L-BTC → BTC):\n1. Initiate from your Liquid wallet\n2. The federation processes the withdrawal\n3. Receive BTC at your specified address\n\nLiquid is used by traders, exchanges, and businesses that need fast, private Bitcoin transactions.",
    category: "Liquid Network",
    sourceUrl: "https://help.blockstream.com/hc/en-us/categories/900000061906-Liquid-Network",
    trustScore: 0.94,
  },
  {
    title: "How do I swap assets on Liquid?",
    description: "Guide to performing asset swaps on the Liquid Network using Blockstream Green and other tools.",
    body: "You can swap assets on the Liquid Network using several methods:\n\n1. Blockstream Green: Built-in swap functionality for L-BTC and Liquid assets. Open your Liquid account, navigate to the swap feature, select assets, review rates, and confirm.\n\n2. SideSwap: A dedicated swap service for Liquid Network assets with competitive rates.\n\n3. Atomic Swaps: Trustless peer-to-peer exchanges using Liquid's scripting capabilities.\n\nSwaps on Liquid settle in approximately 2 minutes and benefit from Confidential Transactions, meaning swap amounts remain private.",
    category: "Liquid Network",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/900004633526-How-do-I-swap-assets-on-Liquid-",
    trustScore: 0.93,
  },
  {
    title: "What does Multisig Shield mean?",
    description: "Explanation of the Multisig Shield security model in Blockstream Green wallet.",
    body: "Multisig Shield is Green wallet's enhanced security model using 2-of-2 multisignature protection.\n\nHow it works:\n- You hold one key on your device\n- Blockstream holds the other key on a secure co-signing server\n- Both signatures are required to authorize any transaction\n- A time-locked recovery path ensures you can always recover funds if Blockstream's service is unavailable\n\nBenefits:\n- Protection against single points of failure\n- Requires 2FA for Blockstream's co-signature\n- Self-sovereign recovery via time-lock mechanism\n- Compatible with Blockstream Jade hardware wallet\n\nMultisig Shield is recommended for users who want maximum security for their Bitcoin holdings.",
    category: "Security",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/900001390563-What-does-Multisig-Shield-mean-",
    trustScore: 0.95,
  },
  {
    title: "Getting Started with Blockstream Green",
    description: "Complete guide to downloading, installing, and configuring Blockstream Green wallet across all platforms.",
    body: "Blockstream Green is a multi-platform Bitcoin and Liquid wallet with advanced security features.\n\nAvailable on:\n- Android (Google Play Store)\n- iOS (App Store)\n- Desktop (Windows, macOS, Linux)\n\nSetup:\n1. Download from your app store or blockstream.com/green\n2. Create a new wallet or restore from a recovery phrase\n3. Choose your security model:\n   - Singlesig: Simple, single-key security\n   - Multisig Shield (2-of-2): Enhanced security with Blockstream co-signing\n4. Set a PIN for quick access\n5. Enable 2FA for additional protection\n\nFeatures:\n- Multiple account types (Bitcoin, Liquid, Lightning)\n- Hardware wallet support via Jade\n- Tor support for enhanced privacy\n- Watch-only mode to monitor balances safely\n- Full coin control and fee customization",
    category: "Green Wallet",
    sourceUrl: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green",
    trustScore: 0.96,
  },
  {
    title: "How do I recover my wallet?",
    description: "Step-by-step instructions for recovering a Blockstream Green wallet using your recovery phrase.",
    body: "If you need to recover your wallet on a new device or after reinstalling Green:\n\n1. Install Blockstream Green on your device.\n2. Select 'Restore Green Wallet'.\n3. Enter your 12 or 24-word recovery phrase.\n4. Select the correct network (Bitcoin mainnet, Liquid, or testnet).\n5. Your wallet and transaction history will be restored.\n\nImportant notes:\n- Your recovery phrase is the master key to your funds\n- Never share it with anyone, including Blockstream support\n- If you used Multisig Shield, the time-locked recovery path activates after a preset period\n- For Jade users, the recovery phrase backs up both the hardware wallet and any connected Green wallets\n\nIf you've lost your recovery phrase and still have access to your wallet, consider setting up a new wallet and transferring your funds.",
    category: "Green Wallet",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/900001391543-How-do-I-restore-a-Blockstream-Green-wallet-",
    trustScore: 0.97,
  },
  {
    title: "Understanding Bitcoin Transaction Fees",
    description: "How transaction fees work on the Bitcoin network and how to set appropriate fee levels in Green wallet.",
    body: "Bitcoin transaction fees are paid to miners for including your transaction in a block.\n\nFee factors:\n- Transaction size (in bytes, not BTC amount)\n- Network congestion (mempool size)\n- Desired confirmation speed\n\nGreen wallet fee options:\n- Fast: Higher fee for next-block confirmation\n- Medium: Balanced fee for confirmation within a few blocks\n- Slow: Lower fee, may take longer to confirm\n- Custom: Set your own fee rate (sat/vbyte)\n\nIf your transaction is stuck:\n- Use RBF (Replace-By-Fee) to bump the fee\n- Green supports RBF for unconfirmed transactions\n- Check mempool.space to see current fee estimates\n\nLiquid Network transactions have much lower fees (~0.1 sat/vbyte) and confirm in ~2 minutes.",
    category: "Transactions",
    sourceUrl: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green",
    trustScore: 0.92,
  },
  {
    title: "Jade Firmware Recovery Guide",
    description: "Advanced troubleshooting guide for recovering a Blockstream Jade that is unresponsive or bricked after a firmware update.",
    body: "If your Jade becomes unresponsive or appears bricked, follow these recovery steps:\n\n1. Force restart: Hold the power button for 15+ seconds.\n2. USB connection: Always use USB-C (not Bluetooth) for recovery.\n3. Boot into recovery mode: Hold both buttons while connecting USB.\n4. Flash firmware: Use the official Jade recovery tool from GitHub.\n\nImportant:\n- Your funds are safe — recovery does not affect your keys\n- Your 12-word recovery phrase can always restore access to your funds\n- If recovery mode fails, contact Blockstream support for hardware-level assistance\n\nPrevention:\n- Always keep your Jade charged above 20% before firmware updates\n- Use a stable USB connection, not Bluetooth\n- Don't interrupt the update process",
    category: "Jade",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/4408498495769-How-do-I-update-Jade-s-firmware-",
    trustScore: 0.94,
  },
  {
    title: "Lightning Network in Green Wallet",
    description: "How to send and receive Lightning payments using Blockstream Green wallet.",
    body: "Green Wallet supports Lightning Network payments for fast, low-fee Bitcoin transactions.\n\nGetting started:\n1. Open Green Wallet and create a Lightning account.\n2. Fund your Lightning account by sending Bitcoin to it.\n3. Send payments by scanning a BOLT11 invoice or entering a Lightning address.\n4. Receive payments by generating a Lightning invoice.\n\nKey features:\n- Integrated Lightning node — no separate setup required\n- Automatic channel management\n- Send and receive instantly\n- Very low fees compared to on-chain transactions\n\nCommon issues:\n- Payment failed: The recipient may be offline or the amount may exceed routing capacity\n- Stuck payment: Wait for the timeout period (usually ~24 hours)\n- Low balance: Lightning has limits based on channel capacity",
    category: "Lightning",
    sourceUrl: "https://help.blockstream.com/hc/en-us/categories/900000056183-Blockstream-Green",
    trustScore: 0.91,
  },
  {
    title: "Security Best Practices for Bitcoin",
    description: "Comprehensive guide to securing your Bitcoin holdings with Blockstream products.",
    body: "Protect your Bitcoin with these security best practices:\n\n1. Recovery Phrase Security:\n   - Write it on paper, never store digitally\n   - Use a metal backup for fire/water resistance\n   - Store in a secure location (safe, safety deposit box)\n   - Never share with anyone\n\n2. Authentication:\n   - Enable 2FA on all accounts\n   - Use hardware-based 2FA (Jade, YubiKey) when possible\n   - Avoid SMS-based 2FA due to SIM swap risks\n\n3. Hardware Wallet:\n   - Use Blockstream Jade for storing significant amounts\n   - Verify addresses on the Jade screen before sending\n   - Keep firmware up to date\n\n4. Software Practices:\n   - Download Green only from official sources\n   - Verify PGP signatures on desktop downloads\n   - Use Tor for enhanced privacy\n   - Keep your operating system and apps updated\n\n5. Social Engineering:\n   - Blockstream will never ask for your recovery phrase\n   - Be wary of unsolicited DMs about cryptocurrency\n   - Verify support URLs match official Blockstream domains",
    category: "Security",
    sourceUrl: "https://help.blockstream.com/hc/en-us/articles/900001388566-How-do-I-set-up-two-factor-authentication-2FA-",
    trustScore: 0.98,
  },
];

async function seed() {
  console.log("Seeding articles...");

  const existing = await db.select().from(articlesTable);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing articles, skipping seed.`);
    await pool.end();
    return;
  }

  for (const article of articles) {
    await db.insert(articlesTable).values({
      ...article,
      lastUpdated: new Date(),
    });
    console.log(`  Seeded: ${article.title}`);
  }

  console.log(`\nSeeded ${articles.length} articles successfully.`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
