import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function OpenClaw() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Link
        href="/"
        className="chb-mono-label text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Home
      </Link>
      <p className="chb-mono-eyebrow text-muted-foreground mb-4">Aspirational</p>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
        OpenClaw &mdash; the integration that makes Greater a platform.
      </h1>
      <div className="space-y-6 mt-10 text-base sm:text-lg text-foreground/85 leading-relaxed">
        <p>
          OpenClaw is a public catalog of curated, hash-signed knowledge
          corpora that any Greater deployment can consume at runtime. Think of
          it as a deliberately small, deliberately curated alternative to "ask
          the entire internet": a registry of corpora that someone with a name
          and a reputation has stood behind.
        </p>
        <p>
          Today OpenClaw is aspirational. The Greater shell is built so that
          when OpenClaw exists, no rewrite is needed &mdash; the corpus loader
          is already addressed by signed manifest, and the browser-LLM stack
          already verifies hashes at load time. The remaining work is the
          social layer: curators, signing keys, dispute resolution, and an
          incentive structure that does not collapse into "highest bidder
          wins."
        </p>

        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-12 mb-2">
          Why the indirection matters
        </h2>
        <p>
          The current AI ecosystem has two failure modes: vendor-mediated
          knowledge, where the corpus is hidden inside a black-box model, and
          ungoverned knowledge, where the corpus is "the entire internet" and
          the model averages it. Both are bad. OpenClaw proposes a third
          option: explicitly-curated, explicitly-attributed, explicitly-signed
          corpora that any application can pull from at runtime, and whose
          provenance is visible to the end user.
        </p>

        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-12 mb-2">
          Status
        </h2>
        <p>
          Specification in draft. Not yet implemented. The Greater repo
          contains the architectural seams that OpenClaw will plug into.
          Interested in being a launch curator? Use the contact form.
        </p>
      </div>
    </article>
  );
}
