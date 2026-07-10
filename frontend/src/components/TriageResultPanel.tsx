"use client";

import { useState } from "react";
import { sendWebhook, ApiError } from "@/lib/api";
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
  };
  return map[value] ?? colors.muted;
}

export function TriageResultPanel({ response }: TriageResultProps) {
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
      setCopyStatus("Copied to clipboard");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Copy failed — select JSON manually");
    }
  }

  async function handleWebhookSend() {
    if (!webhookUrl.trim() || !response.webhookPayload) return;

    setWebhookLoading(true);
    setWebhookStatus(null);

    try {
      const result = await sendWebhook(webhookUrl.trim(), response.webhookPayload);
      setWebhookStatus(result.message);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Webhook delivery failed.";
      setWebhookStatus(message);
    } finally {
      setWebhookLoading(false);
    }
  }

  if (!response.success || !response.result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Validation issues</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: colors.warning }}>
          {response.validationIssues.map((issue) => (
            <li key={`${issue.field}-${issue.message}`}>
              <strong>{issue.field}:</strong> {issue.message}
            </li>
          ))}
        </ul>
        <p style={{ color: colors.muted, margin: 0, fontSize: "0.875rem" }}>
          Provider: {response.provider}
        </p>
      </div>
    );
  }

  const { result } = response;
  const fields: { label: string; value: string | number }[] = [
    { label: "Company", value: result.company },
    { label: "Company size", value: result.companySize },
    { label: "Category", value: result.category },
    { label: "Priority", value: result.priority },
    { label: "Sales potential", value: result.salesPotential },
    { label: "Confidence", value: `${Math.round(result.confidence * 100)}%` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Structured output</h2>
        <span style={{ color: colors.muted, fontSize: "0.875rem" }}>
          via {response.provider} provider
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
                color:
                  field.label === "Priority" || field.label === "Sales potential"
                    ? badgeColor(String(field.value))
                    : colors.text,
                textTransform: "capitalize",
              }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>

      <Section title="Request summary" body={result.requestSummary} />
      <Section title="Recommended action" body={result.recommendedAction} />
      <Section title="Suggested reply" body={result.suggestedReply} mono />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Webhook JSON</h3>
          <button type="button" onClick={handleCopy} style={buttonStyle}>
            Copy JSON
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
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Send to webhook</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-crm-or-automation-endpoint"
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
            {webhookLoading ? "Sending…" : "Send webhook"}
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
