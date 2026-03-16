# Emerald — Blockstream AI Support Bot

A high-fidelity prototype demonstrating "Sovereign Support" principles: privacy-first, triage-heavy, and accessible. Built for Blockstream as a design showcase and job interview portfolio piece.

## Overview

Emerald is a floating chat widget that sits atop a Blockstream help center article page, providing intelligent support for account security issues. The bot leverages local-first processing, PII anonymization, and tiered trust scoring to deliver secure, transparent AI-assisted troubleshooting.

**Live Features:**
- **Support Article Page**: Blockstream-styled help center article (light theme) about unauthorized login activity
- **Floating Chat Widget**: Dark-themed, Zendesk-style chat in bottom-right corner with full-screen toggle
- **Security Triage**: Keyword detection triggers high-priority security banner + walkthrough panel
- **Trust Ribbon**: Tiered visual indicators (green ≥92%, yellow 75–91%, amber <75%)
- **LLM Integration**: Together.AI (Llama 3.3 70B) with local fallback responses
- **PII Scrubbing**: Local regex-based anonymization (emails, phones, BTC addresses, seed phrases)
- **Zendesk Export**: Escalation generates spec-conformant JSON payload with scrubbed transcript
- **Blockstream Branding**: Uses din-2014 font from Adobe Typekit (chx2fbn)

## Tech Stack

- **Frontend**: React 18 + Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express 5, PostgreSQL + Drizzle ORM
- **LLM**: Together.AI (Llama-3.3-70B-Instruct-Turbo)
- **Validation**: Zod + Drizzle Zod
- **API Codegen**: Orval (OpenAPI → React Query + Zod)
- **Monorepo**: pnpm workspaces

## Architecture

```
emerald-support-bot/
├── artifacts/
│   ├── api-server/          Express API + intent matching + LLM
│   └── emerald/             React + Vite frontend
├── lib/
│   ├── api-spec/            OpenAPI 3.1 spec + Orval config
│   ├── api-client-react/    Generated React Query hooks
│   ├── api-zod/             Generated Zod schemas
│   └── db/                  Drizzle ORM + PostgreSQL schema
└── scripts/                 Seed articles utility
```

## Running Locally

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL (Replit provides it; use `DATABASE_URL` env var)
- Together.AI API key (`TOGETHER_API_KEY` env var)

### Setup

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @workspace/db run push

# Seed help articles
pnpm --filter @workspace/scripts run seed-articles

# Start both servers in dev mode
pnpm run dev
```

The frontend runs at `http://localhost:5173` (or Replit preview), API at `http://localhost:8080`.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/articles` | List help articles (supports `?q=search&category=filter`) |
| GET | `/api/articles/:id` | Get single article |
| POST | `/api/chat` | Send message, get bot response |
| POST | `/api/escalate` | Generate Zendesk ticket payload |

## Design & Spec Compliance

This prototype implements the "Sovereign Support" architecture from the specification document:

- **92% Security Weighting**: Trust scores reflect high-confidence thresholds (≥92% = "Verified")
- **Local-First Privacy**: PII scrubbing happens client-side and server-side before any external API call
- **Transparent Triage**: Security keywords trigger immediate escalation path; no silent failures
- **Blockstream Branding**: Uses official din-2014 typeface from Blockstream's design system
- **Zendesk Spec Alignment**: Escalation payload follows the exact JSON structure specified (nested `ticket.comment.body`, `ticket.custom_fields[session_hash]`)

## Key Files

- **Frontend**: `artifacts/emerald/src/pages/Home.tsx` (article + chat widget layout)
- **Chat Widget**: `artifacts/emerald/src/components/ChatWidget.tsx`
- **Chat Logic**: `artifacts/api-server/src/routes/chat.ts`
- **Intent Matching & PII Scrubbing**: `artifacts/api-server/src/lib/intent-matcher.ts`
- **LLM Integration**: `artifacts/api-server/src/lib/llm.ts`
- **Database Schema**: `lib/db/src/schema/articles.ts`

## Deployment

Push this repo to your Replit workspace, configure environment variables (`TOGETHER_API_KEY`, `DATABASE_URL`), and use Replit's deploy button to publish.

## Interview Highlights

1. **Spec Compliance**: Implements exact Zendesk payload structure and 92% trust weighting from design spec
2. **Privacy-First Design**: Local PII scrubbing prevents sensitive data from reaching cloud APIs
3. **Type-Safe API Chain**: OpenAPI spec → Zod schemas → React Query hooks (end-to-end validation)
4. **Accessible UI**: Progressive disclosure (expandable trust ribbon), keyboard navigation, ARIA labels
5. **Production-Ready Patterns**: Error handling, fallback responses, proper logging (no PII in logs)

## Future Considerations

- **Phase 2**: Web-LLM for offline support, PGP session signing (Sovereign Signature Module)
- **Phase 2**: ONNX local inference for high-frequency queries (35–50% token reduction)
- **Governing Agent**: Periodic audit of knowledge base against GitHub docs (freshness trigger)
- **Emergency Cache**: Offline fallback with top 20 critical troubleshooting markdown files

## Credits

Built as a proactive design challenge demonstrating "Product-Engineering" crossover. Incorporates principles from the Blockstream Emerald Sovereign Support specification document.

---

**Status**: Interview-ready prototype. Not production-hardened; suitable for demonstration and portfolio showcase.
