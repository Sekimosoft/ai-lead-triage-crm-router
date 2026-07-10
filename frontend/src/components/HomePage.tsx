"use client";

import { useState } from "react";
import { InquiryForm } from "@/components/InquiryForm";
import { TriageResultPanel } from "@/components/TriageResultPanel";
import type { AnalyzeResponse } from "@/types";
import { colors, layout } from "@/lib/theme";

export function HomePage() {
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main style={layout.page}>
      <div style={layout.container}>
        <header style={{ marginBottom: "2rem" }}>
          <p style={{ color: colors.accent, fontWeight: 600, margin: "0 0 0.5rem", fontSize: "0.875rem" }}>
            Sekimosoft · Portfolio Demo
          </p>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
            AI Lead Triage CRM Router
          </h1>
          <p style={{ color: colors.muted, margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            Turn messy inbound inquiries into structured sales-ready data — company, priority,
            recommended action, and a draft reply — in seconds.
          </p>
        </header>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <section style={layout.card}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem" }}>1. Paste inquiry</h2>
            <InquiryForm
              onResult={setResponse}
              onError={setError}
              onLoading={setLoading}
            />
            {loading && (
              <p style={{ color: colors.muted, marginTop: "1rem", marginBottom: 0 }}>
                Analyzing…
              </p>
            )}
            {error && (
              <p style={{ color: colors.danger, marginTop: "1rem", marginBottom: 0 }}>{error}</p>
            )}
          </section>

          {response && (
            <section style={layout.card}>
              <TriageResultPanel response={response} />
            </section>
          )}
        </div>

        <footer style={{ marginTop: "2.5rem", color: colors.muted, fontSize: "0.875rem" }}>
          Demo only — use fictional inquiries. Built by Sekimosoft as part of the BizDXAI platform portfolio.
        </footer>
      </div>
    </main>
  );
}
