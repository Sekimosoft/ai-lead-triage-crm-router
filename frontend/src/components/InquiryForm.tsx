"use client";

import { useState } from "react";
import { analyzeInquiry, ApiError } from "@/lib/api";
import type { AnalyzeResponse } from "@/types";
import { colors } from "@/lib/theme";

const MIN_LENGTH = 20;
const MAX_LENGTH = 5000;

const SAMPLE_INQUIRY =
  "Hello, we are from Northwind Analytics, a mid-size team of about 50 employees. " +
  "We are evaluating CRM tools and would like a product demo plus pricing for 80 seats this week.";

interface InquiryFormProps {
  onResult: (response: AnalyzeResponse) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}

export function InquiryForm({ onResult, onError, onLoading }: InquiryFormProps) {
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function validateLocally(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter an inquiry message.";
    if (trimmed.length < MIN_LENGTH) {
      return `Inquiry must be at least ${MIN_LENGTH} characters.`;
    }
    if (trimmed.length > MAX_LENGTH) {
      return `Inquiry must not exceed ${MAX_LENGTH} characters.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const issue = validateLocally(text);
    if (issue) {
      setLocalError(issue);
      return;
    }

    setLocalError(null);
    onLoading(true);
    onError("");

    try {
      const response = await analyzeInquiry(text.trim());
      onResult(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unexpected error during analysis.";
      onError(message);
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label htmlFor="inquiry">
        <span style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Customer inquiry
        </span>
        <textarea
          id="inquiry"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (localError) setLocalError(null);
          }}
          rows={8}
          placeholder="Paste a sample sales or support inquiry. Do not use real customer data."
          style={textareaStyle}
        />
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: colors.muted, fontSize: "0.875rem" }}>
          {text.trim().length} / {MAX_LENGTH} characters
        </span>
        <button
          type="button"
          onClick={() => setText(SAMPLE_INQUIRY)}
          style={secondaryButtonStyle}
        >
          Load sample
        </button>
      </div>

      {localError && <p style={{ color: colors.danger, margin: 0 }}>{localError}</p>}

      <button type="submit" style={primaryButtonStyle}>
        Analyze inquiry
      </button>
    </form>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.875rem 1rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.surfaceAlt,
  color: colors.text,
  fontSize: "0.95rem",
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.75rem 1.25rem",
  borderRadius: 8,
  border: "none",
  background: colors.accent,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "1rem",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.875rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.muted,
  cursor: "pointer",
  fontSize: "0.875rem",
};
