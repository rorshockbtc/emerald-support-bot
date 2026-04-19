/**
 * Greater — persona / bot data model.
 *
 * Single source of truth that feeds the homepage cards, case-study pages,
 * and demo holding screens. Add new personas here only.
 *
 * `caseStudy` is plain markdown; the case-study page renders it.
 * `heroImage` is the URL relative to the artifact base path.
 * `demoStatus`:
 *   - `live`    → the demo route is fully wired (e.g. blockstream)
 *   - `holding` → the demo route shows a "coming online" holding screen
 */

export type Persona = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  pain: string;
  heroImage: string;
  caseStudy: string;
  demoStatus: 'live' | 'holding';
  demoLabel: string;
};

const PERSONAS: Persona[] = [
  {
    slug: 'startups',
    name: 'Startups',
    shortName: 'Startups',
    tagline: 'Stop bleeding qualified leads to a 2023-grade chatbot.',
    pain: 'Customer acquisition costs are high, attention windows are short, and a generic chatbot can lose a $400-CAC visitor in 8 seconds.',
    heroImage: 'images/personas/startups.png',
    demoStatus: 'holding',
    demoLabel: 'Demo coming online — startup template being indexed',
    caseStudy: `## Why startups lose customers in the chat window

Imagine a Series A founder has just spent $4 acquiring a click — maybe much more, depending on the channel. The visitor lands on the pricing page, has a question, and opens the chatbot in the corner. What happens next is, statistically, a coin flip on whether that customer is retained.

Most startups today are running one of three flavors of failure. The first is the off-the-shelf rules-based bot that pattern-matches on keywords and answers with a canned link to a help article — the visitor types "can I cancel anytime" and gets back the FAQ for "cancellation policy" with no acknowledgement of intent. The second is the generic LLM chatbot wired into ChatGPT or Claude with a thin prompt — it answers fluently but invents pricing, hallucinates features, and occasionally tells customers something the company has never said. The third, increasingly common, is the per-seat AI add-on from a vendor like Zendesk or Intercom: a real product, but priced as a tax on every conversation, with the company's own knowledge held captive inside the vendor's infrastructure.

## What Greater does instead

Greater drops a chat surface onto the startup's site that runs entirely in the visitor's browser, with no per-message API cost and no proprietary data leaving the visitor's device. The base bot is fluent and well-mannered out of the box — it knows it's representing a startup, not a generic helpdesk. It's polite about uncertainty and explicit about what it doesn't know.

Where the value actually compounds is in the curated knowledge layer. The startup brings their own docs, marketing site, changelog, and pricing page; Greater indexes them locally with a deterministic scraper (no LLM in the extraction path), and the bot answers from that corpus with citations the visitor can click. Every claim links back to the source paragraph. When the bot doesn't know, it says so and offers an escalation path the company controls — not a vendor-mediated handoff.

## The financial argument

A typical SaaS startup running a per-seat support stack at modest scale pays a five-figure monthly tax for the privilege of a chatbot that frequently makes them look bad. Greater's runtime cost is essentially zero — the model runs in the user's browser. The cost shifts to a one-time setup and a fractional maintenance contract, both of which are vastly smaller than a year of seat fees, and the startup ends up owning their support intelligence instead of renting it.

## The trust argument

For high-growth startups whose customers are increasingly aware of where their data goes, "your message never leaves your browser unless you escalate" is a credible privacy story. The bot can show its work — every retrieved chunk and every citation is visible in the chat — which is the opposite of the black-box experience visitors get from most production AI today.

## Who this is for

Founders who've already realized the chatbot in their corner is costing them deals, who don't want to write a check for another six-figure SaaS line item, and who'd rather hire a fractional architect to set up something they'll own outright. The default Greater shell is free and open-source. The persona-tuned bot — the one that actually closes leads on your specific funnel — is the work clients hire me for.`,
  },
  {
    slug: 'faith',
    name: 'Faith-Based Organizations',
    shortName: 'Faith',
    tagline: 'A bot that actually knows your church, your sermons, your doctrine.',
    pain: 'Years of YouTube and Rumble sermons, distinctive doctrine, and almost no way for a curious visitor to find a five-minute answer.',
    heroImage: 'images/personas/faith.png',
    demoStatus: 'holding',
    demoLabel: 'Demo coming online — pilot church corpus being indexed',
    caseStudy: `## The conversion problem most churches do not name

Every faith community has a specific shape — a set of distinctive convictions, a way of reading scripture, a set of practices and counsel that distinguishes it from the church down the street. Most churches communicate that shape through hours of sermons, weekly Bible studies, occasional position papers, and the slow work of personal discipleship. None of that is easily searchable.

A curious visitor — say, someone who lost a parent and found the church through a friend — may have a single five-minute window to figure out what the community actually teaches about a question that matters intensely to them. What they find, almost universally, is a website with a "What We Believe" page that says the same five things every other church's site says, and a YouTube channel with 600 sermons and no transcripts.

## What Greater does for a church

Greater sits on the church's website as a chat surface. Behind it is a knowledge base built from the church's actual primary sources: every YouTube and Rumble sermon transcript, every position paper, every catechism the church publishes. The transcript pipeline is a one-time cost; once indexed, the local browser bot can hold real conversations about the church's distinctive teaching, with citations back to the specific sermon, the timestamp, and the verse the pastor was preaching from.

This is not a substitute for personal discipleship. It is a way for a curious visitor to find an answer to a real question without sitting through twelve hours of video — and, importantly, an answer that is *this church's* answer, not a generic average of every Christian website on the public internet. When the bot doesn't know, it says so and routes the visitor to a real human contact, which the church controls.

## On bias and explicit perspective

Greater takes the position that bias in AI is unavoidable, and that explicit bias is more honest than implied neutrality. A church bot trained on a Reformed Baptist church's sermons will answer like a Reformed Baptist; a bot trained on a Roman Catholic parish's catechism will answer like a Catholic. The bot tells the visitor up front whose perspective it speaks from, which is the opposite of the soft-edged "all paths" hedging most general AI defaults to.

## What this is not

It is not a chaplain. It is not a substitute for a pastor or for a relationship with the local body. It is a tool for the curious visitor — the person who is two clicks away from closing the tab and never coming back. For that visitor, the difference between "I had a question and got a real, sourced answer in two minutes" and "I had a question and watched ninety seconds of a sermon on YouTube before giving up" is large.

## Who this is for

Churches and faith-based organizations whose distinctive teaching is locked inside hours of video and pages of position papers, who want to give curious visitors a real entry point without compromising on what they actually believe. Christ-first by the author's conviction, but the architecture is faith-agnostic — the same pipeline works for any community whose primary sources are in long-form audio and video that nobody is going to watch end-to-end.`,
  },
  {
    slug: 'schools',
    name: 'Private Schools & Families',
    shortName: 'Schools & Families',
    tagline: 'Curated knowledge for institutions and families that care about what their kids learn.',
    pain: 'Private schools want granular control over the curriculum a chatbot speaks from. Families want certainty that the AI in the room will not drift into territory that violates their values.',
    heroImage: 'images/personas/schools.png',
    demoStatus: 'holding',
    demoLabel: 'Demo coming online — pilot school corpus being indexed',
    caseStudy: `## The "what is the AI teaching my child" problem

A private school spends decades building a curriculum that reflects a specific educational philosophy — classical, Charlotte Mason, Montessori, parochial, or some carefully-calibrated blend. Parents pay a meaningful premium to send their children to that school precisely because of that distinctiveness. The moment a generic AI chatbot enters the room — whether on the school's website, the homework help app, or the LMS — that distinctiveness evaporates. The bot answers with the median of its training data, which is the average of the entire public internet, which is the opposite of what the school sells.

The same problem repeats inside individual families. A parent may want their child to be able to ask an AI about the periodic table or the French Revolution. They may not want that same AI improvising answers about identity, ethics, religion, or relationships from a corpus the parent has never seen and cannot inspect.

## What Greater does for schools

A private school deploying Greater can publish a chatbot for prospective families, current families, and students that speaks only from the school's own curriculum, faculty handbook, parent handbook, and approved supplementary reading. The corpus is curated and inspectable. When a visitor asks "what does this school teach about X," the answer comes from the school's own materials, with citations to the specific document and page.

For homework help and study questions, the school can layer on subject-specific corpora it has reviewed and approved — primary source texts, vetted reference material, the school's own teaching materials. Out-of-corpus questions get a clear "I don't have material on that — talk to your teacher or a parent" rather than a confident hallucination.

## What Greater does for families

A family deploying Greater on a home device or browser gets the same architecture at a smaller scale. Parents can curate the corpus the bot answers from — the encyclopedia they trust, the math textbook the child is using, the books the family has chosen — and the bot will not stray outside it. When the bot doesn't know, it says so. The architecture is intentionally narrow; that is the feature, not the bug.

This is the inverse of how most consumer AI works. The big general-purpose assistants are designed to answer everything; their guardrails are bolted on after the fact, and they drift. A corpus-bounded bot is designed to know one thing well and to be honest about everything else.

## On case studies and proof

The roadmap calls for two or three pilot deployments — ideally one classical school, one parochial school, and one Charlotte Mason or Montessori cooperative, in the US Southeast or Midwest where there is real demand for this kind of curation. Visitors to the demo will be able to compare the same question answered by a generic AI and by a corpus-bounded school bot, and see the difference in real time.

## Who this is for

Heads of school, deans of academic affairs, and curriculum directors who are watching the AI debate from the outside and don't see a way to participate without compromising. Also: families who run their household with the same intentionality — who already filter what their children read and watch and want the same control over what the AI in the room speaks from. The default Greater shell is free and open-source; the curated corpora and the integration into your specific school information system are the work that gets hired.`,
  },
  {
    slug: 'small-business',
    name: 'Small Businesses',
    shortName: 'Small Business',
    tagline: 'The chatbot a $50k-revenue local business could never afford until now.',
    pain: 'Generic mass-market chatbots are tuned for nothing; private AI is priced for the Fortune 500. There is no middle.',
    heroImage: 'images/personas/small-business.png',
    demoStatus: 'holding',
    demoLabel: 'Demo coming online — small-business template being indexed',
    caseStudy: `## The market gap small businesses fall into

A local realty office, a regional law firm, a specialty manufacturer, a dental practice — these businesses each have a small set of distinctive details that matter intensely to the customers who find them. The realty office has a list of current properties and the financing options it works with. The law firm has a specific practice area and a specific client intake process. The manufacturer has a parts catalog and a return policy. The dentist has a schedule, a list of accepted insurances, and a position on whether they take new patients this month.

The off-the-shelf chatbot market does not serve these businesses well. The cheap end of the market gives them a glorified FAQ widget that cannot answer "is this house still available." The expensive end of the market gives them a per-seat platform priced as if they were running a hundred-agent contact center. Most small businesses end up doing nothing — leaving the chat surface empty, or using a free widget that pushes visitors to a contact form they will never staff in real time.

## What Greater does for a small business

Greater drops a working chatbot onto a small business's site at a one-time setup cost, with zero per-message runtime cost — the model runs in the visitor's browser. The base bot is fluent and industry-aware: a realty bot knows what a "buyer's agent" is and roughly how mortgage pre-approval works; a dental bot knows the difference between a cleaning and a deep scaling without being told.

The custom layer — the part that makes it actually useful — is the business's own data, indexed locally. The realty office uploads its current listings; the bot can answer "do you have anything under $400k with three bedrooms in this school district" and link to the matching listings without ever sending the visitor's query to an external API. The dental practice uploads its insurance list and current schedule; the bot can answer "do you take BlueCross PPO" and "do you have any new-patient slots this month" and route to the booking page.

## Why the FOSS shell matters

The base of Greater is open-source. A small business with a developer in the family can fork it, plug in their own corpus, and run it themselves at zero ongoing cost. For everyone else, hiring a fractional architect to do the integration is dramatically cheaper than the per-seat alternative — and they end up owning their corpus, not renting it from a vendor.

## Where this lives

The natural fit is the local business sector that has been most under-served by the AI wave so far: real estate, professional services, healthcare, specialty retail, service trades. The pitch is not "this will replace your front desk." It is "this will answer the question that's stopping a curious visitor from picking up the phone." That question is almost always something the business already knows the answer to and has never managed to put in writing.

## Who this is for

Owner-operators who are competent enough to know their site's chat experience is costing them business, but who don't want to learn to operate Zendesk or pay for a year of seat fees to find out it doesn't fit. The default Greater shell is free and open-source; the custom indexing and the integration into your CRM, listings system, or scheduler is the work that gets hired.`,
  },
  {
    slug: 'healthtech',
    name: 'HealthTech',
    shortName: 'HealthTech',
    tagline: 'A support bot that respects HIPAA, says what it knows, and shuts up about what it does not.',
    pain: 'Generic AI chat in a healthcare context is a compliance liability. Vendor-locked AI chat is a per-seat tax on a margin-thin business.',
    heroImage: 'images/personas/healthtech.png',
    demoStatus: 'holding',
    demoLabel: 'Demo coming online — pilot healthtech corpus being indexed',
    caseStudy: `## Why healthcare cannot use the chatbot in the corner

The cost of an AI support bot inventing a drug interaction, hallucinating a contraindication, or quietly logging a patient's symptoms to a third-party model provider's training set is — in the healthcare context — not a customer-experience problem. It is a regulatory event, a liability event, and an existential brand event. The default posture of every healthtech company toward generic chatbot vendors should be skepticism, and most are right to feel it.

The other end of the market — vendor-built "HIPAA-compliant" AI chat — solves the compliance problem by charging enough that the company can afford the SOC 2 reports and the data processing agreements. Margins in healthtech are thin. Adding another six-figure SaaS line item to a Series B startup's burn rate, when half the conversations are "where is my invoice" and "do you accept Medicare," is hard to justify.

## What Greater does for healthtech

Greater's architecture is structurally well-suited to the healthcare use case for one specific reason: the model runs in the patient's or user's browser, and the corpus the bot speaks from is shipped as static, inspectable, version-controlled content. Nothing the user types is sent to a third-party LLM provider as a matter of course. There is no per-conversation data egress to manage. The compliance story is "we don't send this anywhere, here is the source code" rather than "we have a 60-page DPA with a vendor."

The free, open-source version of Greater is auditable end to end. A healthtech CISO can read every line of the chat surface and the indexing pipeline, can verify that the corpus the bot speaks from is exactly the corpus the medical and legal teams approved, and can sign off without relying on a vendor's self-attestation. The paid, customized version is the same shell with the company's specific operational corpus indexed in — billing flows, insurance acceptance, scheduling rules, condition-specific patient education — all of it under the company's full control.

## What the bot is allowed to do, and what it is not

A Greater deployment in healthtech is configured to be conservative by default. It answers operational and educational questions from the indexed corpus, with citations. It will not improvise medical advice. When asked something outside its corpus — "what dose of this drug is safe for me" — it returns a clear "I cannot answer that; here is how to reach your provider" rather than guessing. The escalation path is something the company controls, not a vendor handoff.

This conservative posture is not a limitation; it is the product. The value proposition for a healthtech company is precisely that the bot is well-bounded, that its answers are sourced, and that the company can demonstrate to a regulator exactly what the bot will and will not say in any given scenario.

## Who this is for

Healthtech founders and product leads who are watching the AI wave from outside the gate, who know they need an AI support layer to compete on user experience, and who have correctly assessed that the off-the-shelf options are either non-compliant or too expensive. The default Greater shell is free, open-source, and auditable. The integration into your specific operational stack — your billing system, your scheduling system, your insurance verification flow — is the work that gets hired.`,
  },
  {
    slug: 'fintech',
    name: 'FinTech & Bitcoin',
    shortName: 'FinTech',
    tagline: 'Sovereign support for an industry that takes "do not trust, verify" seriously.',
    pain: 'Bitcoin and fintech users are paranoid about where their queries go, for good reason. Most chat AI sends every keystroke to a third party.',
    heroImage: 'images/personas/fintech.png',
    demoStatus: 'live',
    demoLabel: 'Try the live demo — Blockstream support bot',
    caseStudy: `## The "where does my message go" problem

The Bitcoin community in particular, and the fintech community more broadly, has been burned enough times to be properly suspicious of any chat surface that sends user queries to a third-party LLM provider. A user typing "I think my wallet has been compromised, here is what I see" into a chat widget that posts to OpenAI is a category of risk that the user, the company, and the regulator should all care about, in roughly that order. Most production chat AI is exactly this architecture, with a privacy policy that promises it will be fine.

The other end of the market is the all-cloud "HIPAA-grade" or "SOC 2-grade" vendor that solves the data-egress problem by being expensive. Fintech margins are not what they were. Adding a per-seat per-conversation tax to support — when half the conversations are "where is my statement" and "I forgot my password" — is a hard sell.

## What Greater does for fintech

Greater runs the language model in the user's browser. The user's message never leaves the device unless the user explicitly escalates to a human. The bot's knowledge base is shipped as static, signed content — the company can publish a hash of the corpus, sign it, and let security-minded users verify they are talking to a bot speaking from the corpus the company actually published. This is the "do not trust, verify" ethos applied to support.

For a Bitcoin company specifically — Blockstream is the working example in this demo — the corpus is a curated snapshot of the company's own help articles, the relevant Bitcoin Core and Knots commit history, the Bitcoin OpTech newsletter back catalog, and a curated set of high-signal community threads. The bot answers operational questions about the company's product from the company's own docs, and answers Bitcoin-protocol questions from the curated technical corpus, with explicit citations.

## On explicit bias

The Bitcoin community contains real disagreements that matter — Core versus Knots, custodial versus non-custodial, the various scaling and fee debates. Greater takes the position that pretending to be neutral is a worse failure than being explicit. The Bitcoin demo includes a perspective toggle (Neutral / Core / Knots) so the user can see what the bot says under each lens, and switch between them mid-conversation. The bot is allowed to disagree with itself when the user changes the lens — that is the correct behavior.

This is the product-level expression of a philosophical position: bias in AI is unavoidable, and explicit bias is more honest than implied neutrality. Most Bitcoiners will recognize this as the same argument they have been making about money for years.

## The financial argument

A fintech company running a per-seat AI support stack at a few thousand active users a month is paying a monthly tax that compounds with every new agent and every new conversation. Greater's runtime cost is essentially zero — the model runs in the user's browser. The cost shifts to a one-time setup, a fractional maintenance contract, and a corpus-curation engagement, all of which are dramatically smaller than a year of seat fees.

## Who this is for

Bitcoin companies, Lightning startups, custodial and non-custodial wallet providers, and the broader fintech market that has been correctly skeptical of vendor-mediated AI. The Blockstream demo on this site is the working proof. The integration into your specific support stack — your help center, your escalation path, your specific product's quirks — is the work that gets hired. Forks of the open-source shell are welcome and encouraged; that is how the ecosystem gets sovereign by default.`,
  },
];

export const personas = PERSONAS;

export function getPersona(slug: string): Persona | undefined {
  return PERSONAS.find((p) => p.slug === slug);
}
