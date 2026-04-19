import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Cpu, FileText, AlertCircle } from "lucide-react";
import { personas, type Persona } from "@/data/personas";

const BASE = (import.meta as { env: { BASE_URL: string } }).env.BASE_URL;

export default function Home() {
  return (
    <>
      <Hero />
      <PrinciplesStrip />
      <PersonasGrid />
      <ClosingCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="chb-mono-eyebrow text-muted-foreground mb-6"
        >
          Greater &mdash; sovereign support bots, FOSS by default
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl"
        >
          Your customers deserve a chatbot that{" "}
          <span style={{ color: "#FE299E" }}>actually knows your business</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl leading-relaxed"
        >
          The free shell runs entirely in the browser. Six industry templates,
          one architectural conviction: bias is unavoidable, so make it explicit
          and make it yours.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#personas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover-elevate active-elevate"
            data-testid="link-hero-personas"
          >
            See the six bots
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium hover-elevate active-elevate"
            data-testid="link-hero-about"
          >
            What is Greater?
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function PrinciplesStrip() {
  const items = [
    {
      icon: Cpu,
      title: "Browser-local LLM",
      body: "WebGPU inference. No per-message API tax. Your visitors' messages never leave their device unless they escalate.",
    },
    {
      icon: FileText,
      title: "Curated corpus",
      body: "Deterministic scrapers, not LLM extraction. The bot only speaks from material you've reviewed and approved.",
    },
    {
      icon: AlertCircle,
      title: "Explicit bias",
      body: "Pretending to be neutral is a worse failure than being explicit. Every persona declares its perspective.",
    },
    {
      icon: Lock,
      title: "FOSS shell",
      body: "MIT-licensed core. Fork it, run it yourself. The custom indexing and integration is what gets hired.",
    },
  ];
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.title} className="flex flex-col gap-2">
              <it.icon className="w-5 h-5" style={{ color: "#01a9f4" }} />
              <h3 className="text-sm font-semibold">{it.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonasGrid() {
  return (
    <section id="personas" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="chb-mono-eyebrow text-muted-foreground mb-3">
            Six industries / six bots
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
            Each card is a real product surface, not a placeholder.
          </h2>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl">
            One demo is wired live today (FinTech &mdash; the Blockstream bot below).
            The other five are persona-tuned holding pages while we index their
            pilot corpora.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((p) => (
            <PersonaCard key={p.slug} persona={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonaCard({ persona }: { persona: Persona }) {
  const isLive = persona.demoStatus === "live";
  return (
    <Link
      href={`/personas/${persona.slug}`}
      className="group block rounded-xl border border-card-border bg-card overflow-hidden hover-elevate active-elevate"
      data-testid={`card-persona-${persona.slug}`}
    >
      <div className="aspect-[16/9] overflow-hidden bg-secondary/50 border-b border-card-border">
        <img
          src={`${BASE}${persona.heroImage}`}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="chb-mono-label text-muted-foreground">
            {persona.shortName}
          </span>
          <span
            className="chb-mono-label"
            style={{ color: isLive ? "#FE299E" : "hsl(var(--muted-foreground))" }}
          >
            {isLive ? "Live demo" : "Coming online"}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug mb-2">
          {persona.tagline}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {persona.pain}
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
          {isLive ? "Try the demo" : "Read the case study"}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function ClosingCTA() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <p className="chb-mono-eyebrow text-muted-foreground mb-3">
            For the curious
          </p>
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            The shell is free. The thinking is for hire.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Greater is open-source under MIT. Fork it, run it yourself, ship it
            on your own domain &mdash; that's the point. The work clients hire me
            for is the corpus curation, the integration into your stack, and the
            architectural calls that make the bot actually close the lead.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://hire.colonhyphenbracket.pink"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover-elevate active-elevate"
              data-testid="link-cta-hire"
            >
              hire.colonhyphenbracket.pink
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/rorshockbtc/emerald-support-bot"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium hover-elevate active-elevate"
              data-testid="link-cta-github"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
