# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **LLM**: Together.AI (Llama 3.3 70B Instruct Turbo)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── greater/            # Greater FOSS lead-gen chat shell (React + Vite, browser-local LLM)
│   └── mockup-sandbox/     # Component Preview Server (design iteration)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── attached_assets/        # Documentation & design assets
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## Greater chat shell (originally the "Emerald" Blockstream prototype)

The shell shipped at `artifacts/greater/` (originally prototyped under the name "Emerald" with Blockstream branding) is a FOSS lead-gen chat widget demonstrating "Sovereign Support" principles: privacy-first, triage-heavy, browser-local LLM, accessible. The Bitcoin pack is the live demo at hire.colonhyphenbracket.pink; the other five personas (HealthTech, Startups, Faith, Schools, Small Business) ship as persona-tuned holding pages.

### Features
- **Support Article Page**: Blockstream help center-style article page (light theme, white background) about unauthorized login activity, matching Blockstream's actual help center design
- **Floating Chat Widget**: Dark-themed Zendesk-style chat widget in bottom-right corner, expandable to panel and full-screen mode
- **Emerald Brand Color**: Primary brand color is emerald green (#10B981), deviating from Blockstream blue to match the "Emerald" product name
- **Blockstream Typography**: Uses din-2014 font from Adobe Typekit (kit chx2fbn), matching Blockstream's official design system
- **Security Triage**: Keyword detection ("hacked", "unauthorized", "2fa", "freeze") triggers a high-priority security banner in the chat widget with "Secure Now" walkthrough panel
- **LLM Integration**: Together.AI (Llama 3.3 70B) for intelligent responses, with local fallback responses
- **Intent Matching**: Local logic-based routing via regex pattern matcher for query classification
- **Knowledge Base**: PostgreSQL-backed help articles seeded from Blockstream help center content
- **Trust Ribbon**: Trust score percentage on every response, expandable to show CI breakdown, source link, last updated. Tiered visual indicators: green (≥92%), yellow-warning (75-91%), amber-caution (<75%, "Verification Required") per spec's 75% threshold
- **PII Scrubbing**: Local regex-based anonymization of emails, phone numbers, BTC addresses, etc.
- **Zendesk Export**: "Escalate to Human" generates Zendesk-conformant JSON payload with nested `ticket.comment.body` and `ticket.custom_fields[session_hash]` structure (console log only, no live API)
- **Compliance Banner**: Auto-detects financial advice queries and shows mandatory disclaimer
- **Stubbed Features**: "Improve This Model" feedback, "Request Update" on articles

### API Endpoints
- `GET /api/articles` - List help articles (optional `?q=search&category=filter`)
- `GET /api/articles/:id` - Get single article
- `POST /api/chat` - Send message, get bot response (intent matching + LLM)
- `POST /api/escalate` - Generate Zendesk ticket payload

### Database Schema
- `articles` table: id, title, description, body, category, source_url, trust_score, last_updated, created_at

### Environment Variables
- `TOGETHER_API_KEY` - Together.AI API key for LLM responses
- `DATABASE_URL` — PostgreSQL connection string (provided by your hosting environment)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/greater` (`@workspace/greater`)

Blockstream Emerald Support Bot. React + Vite frontend with dark-mode Blockstream branding.

- Entry: `src/main.tsx` → `src/App.tsx` → `src/pages/Home.tsx`
- Components: `src/components/ChatWidget.tsx` (floating chat), `ChatMessage.tsx`, `SecurityPanel.tsx`, `TrustBadge.tsx`
- Home.tsx renders a Blockstream help article page (light theme) with ChatWidget overlay (dark theme)
- ChatWidget uses `.chat-widget` CSS class to scope dark theme variables
- Uses `@workspace/api-client-react` for API hooks (useSendMessage, useEscalateTicket)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for health, articles, and chat.

- Routes: `src/routes/health.ts`, `src/routes/articles.ts`, `src/routes/chat.ts`
- Logic: `src/lib/intent-matcher.ts` (local intent classification + PII scrubbing)
- LLM: `src/lib/llm.ts` (Together.AI integration)
- Fallbacks: `src/lib/responses.ts` (hardcoded responses when LLM unavailable)

### `lib/db` (`@workspace/db`)

Database layer. Schema: `src/schema/articles.ts`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

- `seed-articles` — seeds 12 help center articles into the database
- `build-bitcoin-seed` — builds the Bitcoin RAG corpus from OpTech + GitHub commits + BitcoinTalk + Mises + Nakamoto. Now also emits per-doc JIT files at `artifacts/greater/public/corpus/bitcoin/<slug>.json` + `_index.json` (FNV-1a slug, no embeddings) — referenced by catalog leaves on demand.
- `check-optech-rss` — checks for new OpTech newsletters (manual run; no CI workflow currently shipped)
- `bitcoin-catalog-smoke` — deterministic smoke test for the Bitcoin catalog navigator: ~58 leaf-routing cases + 9 anti-drift probes (no transformers dep)
- `bitcoin-conversation-smoke` — 25-turn conversation simulator for the Bitcoin pack (technical + philosophical + adversarial probes; consistency checks via recency-boost ring buffer)

## Bitcoin pack — catalog-first retrieval (Task #68, April 2026)

The Bitcoin pack uses a **hand-curated L1→L2→leaf catalog** instead of the flat-embed pipeline used by the other 6 packs. Goals: <2s first-paint (no Xenova model download), coherent multi-turn no-shitcoin conversation, structural citations via per-leaf `sources[]`, sovereignty preserved (catalog files are static repo assets — anyone can fork and edit).

- **Per-pack flag**: `SeedBundleConfig.useCatalog: true` short-circuits the embed install. `AskOptions.useCatalog: { packSlug }` routes `ask()` through `navigateCatalog`.
- **Catalog files**: `artifacts/greater/public/catalog/bitcoin/` — root + **8 branches, all 8 fully built** with 6 leaves each (48 leaves total). Branches: `austrian-monetary`, `core-internals`, `lightning`, `privacy`, `mining-pow`, `wallets-keys`, `whitepaper-precursors`, `operational-questions`. Each leaf is a tight ~3-paragraph brief with `[1][2]` inline citations and 2-3 real-URL sources.
- **Navigator** (`artifacts/greater/src/llm/catalog/navigator.ts`): BM25-lite over edge `label` + `summary` + optional hidden `searchTerms[]` (2x weight, used to seed leaf-vocabulary into branch-level edges so root-level matches still route correctly). `TIE_RATIO = 1.08` triggers clarify only at root depth. `FLOOR_SCORE = 0.4` triggers clarify when no edge scores high enough.
- **Anti-drift gate** (`artifacts/greater/src/llm/catalog/antiDrift.ts`): deterministic regex for shitcoin/scam/financial-advice. Runs *before* the navigator descends. No chance the LLM accidentally engages.
- **Per-doc JIT layer**: `artifacts/greater/public/corpus/bitcoin/<slug>.json` lets leaves reference long-form docs without bundling the 11 MB seed.
- **ChatWidget wiring** (`src/components/ChatWidget.tsx`): persona `fintech` injects `useCatalog: { packSlug: "bitcoin" }`. A 5-deep ring buffer of recent landed leaf IDs feeds the navigator's recency boost (5%) so multi-turn threads on the same branch don't bounce around.

The other 6 packs are **unchanged** — they continue to use flat-embed retrieval with a Xenova model in the browser.

See `docs/INSTALL.md` for operator instructions, `docs/CORPUS_EXPANSION.md` for the architecture rationale, and `docs/TESTING.md` for the smoke harness reference.

### CI / GitHub Actions

No `.github/workflows/` ship in the repo today. The OpTech RSS poller (`check-optech-rss`) and corpus rebuild are run manually for now. Re-introducing them is tracked as a follow-up.
- Manual OpTech check tracking file: `scripts/src/bitcoin-seed/.last-optech-issue` (YYYY-MM-DD); new newsletters land at `scripts/src/bitcoin-seed/optech/<DATE>.txt`.

Production migrations run automatically on deployment. In development, use `pnpm --filter @workspace/db run push`.
