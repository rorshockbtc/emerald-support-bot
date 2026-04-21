import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { type Persona } from "@/data/personas";

const BASE = (import.meta as { env: { BASE_URL: string } }).env.BASE_URL;

/**
 * Persona card with a collapsible hero image and TWO pinned CTAs at
 * the bottom: "Try Demo" and "Read Case Study". Spec calls for both
 * buttons to remain visible regardless of collapse state.
 */
export function PersonaCard({ persona }: { persona: Persona }) {
  const [imageOpen, setImageOpen] = useState(true);
  const isLive = persona.demoStatus === "live";
  const demoHref =
    persona.slug === "fintech" ? "/demo/fintech" : `/demo/${persona.slug}`;

  return (
    <article
      className="flex flex-col rounded-xl border border-card-border bg-card overflow-hidden"
      data-testid={`card-persona-${persona.slug}`}
    >
      <div className="border-b border-card-border">
        <button
          type="button"
          onClick={() => setImageOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2 hover-elevate"
          aria-expanded={imageOpen}
          data-testid={`button-toggle-image-${persona.slug}`}
        >
          <span className="chb-mono-label text-muted-foreground truncate min-w-0">
            {persona.shortName}
          </span>
          <span className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {/* Knowledge-base fullness badge. Honest signal so a
                visitor doesn't expect a Robust answer from a Starter
                corpus. The label is a single word ("Starter",
                "Basic", "Partial", "Robust") so it works inside the
                tight card chrome and matches the four-tier vocab on
                the homepage intro. */}
            {persona.kbStatus && (
              <span
                className="chb-mono-label px-1.5 py-0.5 rounded border border-border text-muted-foreground"
                title={`Knowledge base: ${persona.kbStatus}`}
                data-testid={`badge-kb-${persona.slug}`}
              >
                KB: {persona.kbStatus}
              </span>
            )}
            <span
              className="chb-mono-label"
              style={{
                color: isLive ? "#FE299E" : "hsl(var(--muted-foreground))",
              }}
            >
              {isLive ? "Live demo" : "Coming online"}
            </span>
            {imageOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {imageOpen && (
            <motion.div
              key="hero"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden bg-secondary/50"
            >
              <div className="aspect-[16/9]">
                <img
                  src={`${BASE}${persona.heroImage}`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold leading-snug mb-2">
          {persona.tagline}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {persona.pain}
        </p>

        <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
          <Link
            href={demoHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover-elevate active-elevate active:scale-[0.97]"
            data-testid={`link-card-demo-${persona.slug}`}
          >
            Try Demo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/bots/${persona.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-medium hover-elevate active-elevate active:scale-[0.97]"
            data-testid={`link-card-case-${persona.slug}`}
          >
            Read Case Study
          </Link>
        </div>
      </div>
    </article>
  );
}
