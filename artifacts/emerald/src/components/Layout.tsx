import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactFormModal } from "@/components/ContactFormModal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/openclaw", label: "OpenClaw" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        location={location}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onContact={() => setContactOpen(true)}
      />

      <main className="flex-1">{children}</main>

      <Footer onContact={() => setContactOpen(true)} />

      <ContactFormModal open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-baseline gap-1 select-none", className)}
      data-testid="link-wordmark"
    >
      <span
        className="chb-display text-2xl leading-none"
        style={{ color: "#FE299E" }}
        aria-hidden="true"
      >
        &gt;
      </span>
      <span className="font-semibold text-base tracking-tight">greater</span>
    </Link>
  );
}

function Header({
  location,
  mobileOpen,
  setMobileOpen,
  onContact,
}: {
  location: string;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  onContact: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Wordmark />

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "chb-mono-label transition-colors hover:text-foreground",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button
              size="sm"
              onClick={onContact}
              className="rounded-full"
              data-testid="button-nav-contact"
            >
              Contact
            </Button>
          </nav>

          <button
            type="button"
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover-elevate"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 chb-mono-label text-muted-foreground hover:text-foreground hover-elevate rounded-md"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onContact();
              }}
              className="block w-full text-left px-2 py-2 chb-mono-label text-muted-foreground hover:text-foreground hover-elevate rounded-md"
            >
              Contact
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer({ onContact }: { onContact: () => void }) {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <Wordmark />
            <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
              Sovereign-by-default support bots. FOSS shell, persona-tuned demos,
              fractional architecture for hire.
            </p>
          </div>

          <div>
            <h4 className="chb-mono-label text-foreground mb-4">Project</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  About Greater
                </Link>
              </li>
              <li>
                <Link
                  href="/openclaw"
                  className="text-muted-foreground hover:text-foreground"
                >
                  OpenClaw
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/rorshockbtc/emerald-support-bot"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="chb-mono-label text-foreground mb-4">Get in touch</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onContact}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-footer-contact"
                >
                  Contact form
                </button>
              </li>
              <li>
                <a
                  href="https://hire.colonhyphenbracket.pink"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted-foreground hover:text-foreground"
                >
                  hire.colonhyphenbracket.pink
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; 2026 colonhyphenbracket. FOSS — released under MIT.</p>
          <p className="font-mono">
            Browser-local LLM. No telemetry. No vendor lock-in.
          </p>
        </div>
      </div>
    </footer>
  );
}
