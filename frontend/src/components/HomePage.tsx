"use client";

import { useState } from "react";
import { InquiryForm } from "@/components/InquiryForm";
import { TriageResultPanel } from "@/components/TriageResultPanel";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/lib/locale-context";
import { getMessages } from "@/lib/i18n";
import type { AnalyzeResponse } from "@/types";
import { colors, layout } from "@/lib/theme";

export function HomePage() {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main style={layout.page}>
      <div style={layout.container}>
        <header style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "0.5rem",
            }}
          >
            <p
              style={{
                color: colors.accent,
                fontWeight: 600,
                margin: 0,
                fontSize: "0.875rem",
              }}
            >
              {t.brand}
            </p>
            <LanguageToggle />
          </div>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
            {t.title}
          </h1>
          <p style={{ color: colors.muted, margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            {t.description}
          </p>
        </header>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <section style={layout.card}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem" }}>{t.sectionPasteInquiry}</h2>
            <InquiryForm
              onResult={setResponse}
              onError={setError}
              onLoading={setLoading}
            />
            {loading && (
              <p style={{ color: colors.muted, marginTop: "1rem", marginBottom: 0 }}>
                {t.analyzing}
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
          {t.footer}
        </footer>
      </div>
    </main>
  );
}
