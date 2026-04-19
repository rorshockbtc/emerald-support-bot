import React, { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Bell } from "lucide-react";
import { getPersona } from "@/data/personas";
import NotFound from "@/pages/not-found";
import { ContactFormModal } from "@/components/ContactFormModal";

export default function DemoHolding() {
  const [, params] = useRoute("/demo/:slug");
  const [, setLocation] = useLocation();
  const persona = params ? getPersona(params.slug) : undefined;
  const [contactOpen, setContactOpen] = useState(false);

  // Personas whose demo is live get routed to their dedicated demo route
  // instead of the "coming online" holding screen. Today that's only
  // FinTech → /demo/blockstream; future live personas should be added
  // to this map as they ship.
  const liveDemoRoutes: Record<string, string> = {
    fintech: "/demo/blockstream",
  };
  const liveTarget = persona ? liveDemoRoutes[persona.slug] : undefined;

  useEffect(() => {
    if (liveTarget) setLocation(liveTarget, { replace: true });
  }, [liveTarget, setLocation]);

  if (!persona) return <NotFound />;
  if (liveTarget) return null;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <Link
          href={`/personas/${persona.slug}`}
          className="chb-mono-label text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-10"
          data-testid="link-back-persona"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {persona.name}
        </Link>

        <p className="chb-mono-eyebrow text-muted-foreground mb-3">
          {persona.name} demo &mdash; coming online
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
          We're indexing the corpus for this one.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mt-5 leading-relaxed">
          {persona.demoLabel}. The architecture is identical to the live{" "}
          <Link
            href="/demo/blockstream"
            className="underline underline-offset-4 hover:text-foreground"
          >
            FinTech demo
          </Link>{" "}
          &mdash; what differs is the curated knowledge base, the persona's
          declared perspective, and the persona-specific escalation flow.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0"
              style={{ color: "#FE299E" }}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1.5">
                Want to be a pilot?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Pilot deployments get the full architecture &mdash; corpus
                curation, indexing, browser-LLM tuning &mdash; at favorable
                terms in exchange for a public case study. If you operate in
                this space and want to be the showcase deployment for{" "}
                {persona.name.toLowerCase()}, get in touch.
              </p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover-elevate active-elevate"
                data-testid="button-pilot-contact"
              >
                Pilot contact form
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="chb-mono-label text-muted-foreground mb-3">
            In the meantime
          </p>
          <ul className="space-y-2 text-base">
            <li>
              <Link
                href={`/personas/${persona.slug}`}
                className="text-foreground hover:underline underline-offset-4"
              >
                Read the {persona.name.toLowerCase()} case study &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/demo/blockstream"
                className="text-foreground hover:underline underline-offset-4"
              >
                Try the live FinTech demo &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-foreground hover:underline underline-offset-4"
              >
                What is Greater? &rarr;
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <ContactFormModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
