# CHB (Colon Hyphen Bracket) — Company Philosophy & Origins

*This document describes the origins, values, and product philosophy of CHB. It is intended for use in context windows, knowledge bases, and onboarding. It protects implementation details while being substantive about the company's identity, trajectory, and intent.*

---

## Who We Are

**CHB** — short for Colon Hyphen Bracket, written :-] — is a one-person digital design and development studio founded and operated by Kyle Cyree, a Principal Product Designer and Systems Architect based between the United States and El Salvador.

The company name is itself a statement. :-] is an emoticon — specifically a smiling, winking bracket-face — chosen to signal that technology doesn't have to be cold. It can be warm, a little playful, and still serious. The punctuation naming convention extends to every product in the CHB ecosystem: **Hash (#)**, **Semi (;)**, **Pipes (|)**, **Scout**, **Workshop**, **Ampersand (&)**. Each symbol carries meaning. Each product earns its name.

CHB is not a startup in the conventional sense. There is no pitch deck optimized for Series A. There is no growth-at-all-costs mentality. There is a founder who builds what he actually wants to exist in the world, and builds it carefully, with full-stack technical ownership from database schema to design system.

---

## The Founder

Kyle Cyree has spent the better part of two decades at the intersection of product design and systems architecture. His work spans enterprise data infrastructure, zero-to-one fintech platforms, and — most recently — collaborative agentic AI systems. He has worked across industries where the cost of getting the architecture wrong is high: financial services, healthcare-adjacent data systems, and consumer-facing products where millions of users depend on the reliability of what gets shipped.

His approach is characterized by a few consistent instincts:

- **Build for the person who doesn't fit the assumed user.** Much of what CHB makes is designed for people the mainstream tech industry underserves: older users, conservative users, users who are skeptical of the ideological defaults baked into most AI products, users who value privacy and ownership over convenience.

- **Earn the right to abstract.** Kyle's workflow involves understanding the full stack before reaching for abstraction. He writes the schema before the routes, the routes before the UI, and the UI before the marketing copy. This discipline produces systems that are coherent rather than patched.

- **The founder's personal experience is the product specification.** This is not romanticization — it is methodology. When Kyle needed a journaling platform that actually understood his thinking patterns, he built Hash. When he needed a writing assistant that didn't feel like talking to a corporate FAQ bot, he built Semi. When he wanted to read news through multiple interpretive lenses, he built Pipes. He is the primary user of everything he makes.

Kyle has lived abroad — specifically in El Salvador — during much of CHB's development. This has shaped the company's worldview: a belief that physical decentralization, bitcoin-native financial infrastructure, and escape from high-cost-of-living defaults are not fringe ideas but practical life design. That context shows up in the products, which are built to work across jurisdictions, to respect user privacy across legal regimes, and to be skeptical of the assumptions embedded in San Francisco tech culture.

---

## The Origin of CHB

CHB grew out of a straightforward observation: most AI products are built for a particular kind of user — young, coastal, progressive, comfortable with surveillance capitalism — and that user is not everyone. The majority of the world, and a significant portion of the United States, does not feel represented in the defaults of mainstream AI assistants.

The founding insight was not ideological in a partisan sense. It was practical: **if AI systems are trained on data that skews toward certain demographics and worldviews, and if those systems are then deployed as neutral advisors, they will systematically underserve everyone outside that skew.** The solution is not to build a reactionary AI, but to build AI systems that are transparent about their context, that can represent divergent viewpoints, and that can be meaningfully personalized to the individual user rather than optimized for the median user.

This led to the core CHB thesis: **AI should be local-first, memory-persistent, and ideologically navigable.**

- **Local-first**: The best AI is the one that knows you, and that knowledge should live where you control it — not in a cloud database owned by a company whose values may shift.
- **Memory-persistent**: Every conversation should build on what came before. The failure mode of most AI is amnesia. CHB products are designed to remember.
- **Ideologically navigable**: Users should be able to understand and adjust the perspective through which AI is operating. This is the core concept behind Pipes, and it animates the design of every other CHB product.

---

## The Product Ecosystem

### Hash (#) — Personal Knowledge & Journaling

Hash is the anchor of the CHB ecosystem. It is a personal journaling and knowledge management platform that treats entries as the raw material for AI-powered insight. Unlike generic note-taking apps, Hash is built around the idea that what you write about is who you are — and an AI system that has access to your writing history can serve you far more meaningfully than one meeting you cold.

Hash features voice-to-text capture, semantic topic clustering, personality profiling (Big Five, MBTI, Enneagram, cognitive style), and AI-assisted reflection. Critically, it exposes a cross-product API that allows other CHB applications — primarily Semi — to access a user's important facts, curator profile, and recent entries to deliver personalized experiences without the user having to re-explain themselves.

Hash is not a productivity tool in the GTD sense. It is closer to an externalized cognitive system — a place where your thinking lives and grows.

### Semi (;) — AI Companion & Thought Partner

Semi is the conversational AI that connects the CHB ecosystem. She is not a chatbot in the legacy sense. Semi's persona is warm, bookish, intellectually curious — modeled after a thoughtful friend who asks good questions and remembers what you told her last month.

Semi is built on a quality-first architecture: for authenticated users, she pulls context from Hash (personality profile, important facts, recent journal entries), draws on learned conversation patterns from previous interactions, and escalates to high-quality external language models when local pattern matching isn't sufficient. The goal is a progressive reduction in external AI dependency — each conversation teaches Semi something that can be answered locally next time.

Semi also serves as CHB's integration hub. She can operate in different modes: standard conversation, template-guided sessions, Pipe-perspective mode (where she responds through a specific interpretive lens), and collaborative modes with other agents in the CHB network.

### Pipes (|) — Perspective-Switching Content Layer

Pipes is the flagship product concept and the most philosophically central CHB innovation. It is a browser plugin and platform that allows any piece of web content to be read through a different perspective lens.

The simplest version: read a New York Times article through the lens of a Breitbart editor, or an economics professor, or a rural farmer. But the deeper version is more significant: Pipes addresses what Kyle calls "the convergence problem" in AI — the tendency of AI-generated and AI-curated content to collapse toward the same set of assumptions, interpretive frames, and value hierarchies. Pipes is a tool for restoring the divergence that makes information useful.

Pipes is built on a curator model. Users can subscribe to curated "perspectives" — interpretive frameworks maintained by specific people or organizations — and apply them to any content they encounter. This creates a marketplace of viewpoints rather than a marketplace of content.

### Scout — Pattern Recognition & Synthesis

Scout is the asynchronous intelligence engine in the CHB ecosystem. While Semi handles real-time conversation, Scout operates in the background — synthesizing patterns across conversations, journal entries, and external sources to generate insights that are surfaced to the user over time.

Scout is designed for the "off-peak" relationship with AI: not the immediate question-and-answer, but the slower accumulation of understanding that comes from reviewing patterns across weeks and months of data.

### Workshop — Constitutional AI Development Governance

Workshop is a tool for governing AI-assisted development projects. It operates through "Primers" — structured constitutional documents that define the rules under which AI agents can operate on a given project. Workshop's contribution is the discipline it brings to multi-agent collaboration: rather than ad-hoc prompting, it establishes a formal governance layer for what AI can and cannot do.

### Ampersand (&) — Knowledge Synthesis

Ampersand is the emerging CHB product focused on synthesis across sources. Where Hash is personal and Pipes is perspectival, Ampersand is integrative — its purpose is to find connections and produce structured knowledge from disparate inputs.

---

## How We Build

CHB's development philosophy can be summarized in a few principles:

**1. Privacy is not a feature, it is a constraint.**
Every architectural decision is evaluated against a privacy model. PII stripping, rotating pseudonymous IDs, semantic compression, and local-first data storage are not add-ons — they are requirements.

**2. $0 AI cost is the target, not free models.**
CHB's systems are designed to progressively reduce dependence on external AI providers. Every successful external AI call is an opportunity to learn a pattern that can be answered locally next time. The long-term goal is an AI companion that runs entirely on your device.

**3. Quality over speed.**
CHB does not ship fast and break things. The codebase is typed end-to-end (TypeScript throughout), schemas are defined before code is written, and architectural decisions are made deliberately. This is a consequence of building alone — there is no team to fix what gets broken in a rush.

**4. The product serves the user, not the other way around.**
CHB products do not monetize attention. They do not A/B test engagement tricks. The business model is straightforward: users pay for value delivered, and the value delivered is genuine utility to that specific user's life and thinking.

**5. Build for divergence.**
This is the most important principle. In a world where AI is flattening viewpoints, CHB builds tools that restore individual voice, preserve ideological heterogeneity, and make it possible for a person to engage with AI without having that AI subtly reshape them toward a set of assumptions they didn't choose.

---

## Business Model & Stage

CHB operates on a credit-based subscription model. Users purchase credits that are consumed by AI-intensive operations. Local operations — pattern matching, template responses, library lookups — are free. External AI calls are metered. This creates a clear incentive for both the user and the platform to invest in the local knowledge base: the better Semi knows you, the less you pay.

CHB is currently pre-revenue in any meaningful scale, operating in an extended build phase where the primary investment is the founder's time and the primary output is the architecture of systems that will eventually support a product business.

The company is registered and maintains proper business presence for developer account compliance across mobile platforms.

---

## What We Are Not

It is worth stating clearly what CHB is not, because the category is crowded with things that sound similar:

- **Not a ChatGPT wrapper.** CHB builds original systems with original memory architectures, original persona design, and original product concepts. External LLMs are a cost input, not the product.
- **Not a surveillance platform.** CHB does not sell user data. The business model does not depend on advertising or data brokerage.
- **Not ideologically neutral in the false sense.** CHB does not pretend that its products have no perspective. All technology encodes values. CHB's values are user sovereignty, cognitive diversity, and privacy. Those are stated explicitly.
- **Not a startup looking for acquisition.** The goal is a sustainable, independent business that serves a real audience over a long time horizon.

---

## The Longer Vision

CHB's long-term ambition is to be the platform through which a significant minority of AI users — those who care about privacy, ideological independence, and genuine personalization — engage with artificial intelligence. Not the majority. A specific minority who are currently underserved and who will reward loyalty with loyalty.

The punctuation naming convention is not an accident or a branding gimmick. It is a commitment: these products belong together, they are designed to work together, and they will grow together into a coherent system for human thinking in an age of machine intelligence.

The smiling bracket face at the center of it all is a reminder that this is supposed to be good. Not just functional. Good — in the sense of genuinely beneficial to the people who use it, built with craft, and honest about what it is.

---

*Document maintained by Kyle Cyree / CHB*
*Last updated: April 2026*
*Classification: Company overview — safe for context injection, client-facing use, and IP documentation*
