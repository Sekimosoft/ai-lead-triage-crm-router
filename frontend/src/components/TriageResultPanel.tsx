"use client";

import { useState } from "react";
import { sendWebhook, ApiError } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { formatMessage, getMessages, labelEnum } from "@/lib/i18n";
import type { AnalyzeResponse } from "@/types";
import { colors } from "@/lib/theme";

interface TriageResultProps {
  response: AnalyzeResponse;
}

function badgeColor(value: string): string {
  const map: Record<string, string> = {
    urgent: colors.danger,
    high: colors.warning,
    medium: colors.accent,
    low: colors.muted,
    緊急: colors.danger,
    高: colors.warning,
    中: colors.accent,
    低: colors.muted,
  };
  return map[value] ?? colors.muted;
}

export function TriageResultPanel({ response }: TriageResultProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const jsonPayload = response.webhookPayload
    ? JSON.stringify(response.webhookPayload, null, 2)
    : "";

  async function handleCopy() {
    if (!jsonPayload) return;
    try {
      await navigator.clipboard.writeText(jsonPayload);
      setCopyStatus(t.copied);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus(t.copyFailed);
    }
  }

  async function handleWebhookSend() {
    if (!webhookUrl.trim() || !response.webhookPayload) return;

    setWebhookLoading(true);
    setWebhookStatus(null);

    try {
      const result = await sendWebhook(webhookUrl.trim(), response.webhookPayload, locale);
      setWebhookStatus(result.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.errWebhookFailed;
      setWebhookStatus(message);
    } finally {
      setWebhookLoading(false);
    }
  }

  if (!response.success || !response.result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem" }}>{t.validationIssues}</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: colors.warning }}>
          {response.validationIssues.map((issue) => (
            <li key={`${issue.field}-${issue.message}`}>
              <strong>{issue.field}:</strong> {issue.message}
            </li>
          ))}
        </ul>
        <p style={{ color: colors.muted, margin: 0, fontSize: "0.875rem" }}>
          {t.provider}: {response.provider}
        </p>
      </div>
    );
  }

  const { result } = response;
  const fields: { label: string; value: string; highlight?: boolean }[] = [
    { label: t.company, value: result.company },
    {
      label: t.companySize,
      value: labelEnum(locale, "companySize", result.companySize),
    },
    {
      label: t.category,
      value: labelEnum(locale, "category", result.category),
    },
    {
      label: t.priority,
      value: labelEnum(locale, "priority", result.priority),
      highlight: true,
    },
    {
      label: t.salesPotential,
      value: labelEnum(locale, "salesPotential", result.salesPotential),
      highlight: true,
    },
    { label: t.confidence, value: `${Math.round(result.confidence * 100)}%` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem" }}>{t.structuredOutput}</h2>
        <span style={{ color: colors.muted, fontSize: "0.875rem" }}>
          {formatMessage(t.viaProvider, { provider: response.provider })}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {fields.map((field) => (
          <div
            key={field.label}
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              background: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ fontSize: "0.75rem", color: colors.muted, marginBottom: 4 }}>
              {field.label}
            </div>
            <div
              style={{
                fontWeight: 600,
                color: field.highlight ? badgeColor(field.value) : colors.text,
                textTransform: locale === "en" && field.highlight ? "capitalize" : "none",
              }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>

      <Section title={t.requestSummary} body={result.requestSummary} />
      <Section title={t.recommendedAction} body={result.recommendedAction} />
      <Section title={t.suggestedReply} body={result.suggestedReply} mono />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{t.webhookJson}</h3>
          <button type="button" onClick={handleCopy} style={buttonStyle}>
            {t.copyJson}
          </button>
        </div>
        {copyStatus && (
          <p style={{ color: colors.success, fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
            {copyStatus}
          </p>
        )}
        <pre style={preStyle}>{jsonPayload}</pre>
      </div>

      <div>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{t.sendWebhook}</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={t.webhookPlaceholder}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleWebhookSend}
            disabled={webhookLoading || !webhookUrl.trim()}
            style={{
              ...buttonStyle,
              opacity: webhookLoading || !webhookUrl.trim() ? 0.6 : 1,
            }}
          >
            {webhookLoading ? t.sending : t.sendWebhookButton}
          </button>
        </div>
        {webhookStatus && (
          <p style={{ color: colors.muted, fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {webhookStatus}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  body,
  mono = false,
}: {
  title: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{title}</h3>
      <p
        style={{
          margin: 0,
          lineHeight: 1.6,
          color: colors.text,
          whiteSpace: mono ? "pre-wrap" : "normal",
          fontFamily: mono ? "Consolas, monospace" : "inherit",
          fontSize: mono ? "0.9rem" : "1rem",
        }}
      >
        {body}
      </p>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: "1rem",
  borderRadius: 8,
  background: "#0d1117",
  border: `1px solid ${colors.border}`,
  overflow: "auto",
  fontSize: "0.8rem",
  lineHeight: 1.5,
  maxHeight: 280,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  padding: "0.625rem 0.875rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceAlt,
  color: colors.text,
};

const buttonStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceAlt,
  color: colors.text,
  cursor: "pointer",
  fontWeight: 500,
};
