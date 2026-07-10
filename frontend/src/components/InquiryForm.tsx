"use client";

import { useState } from "react";
import { analyzeInquiry, ApiError } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { formatMessage, getMessages, getSampleInquiry } from "@/lib/i18n";
import type { AnalyzeResponse } from "@/types";
import { colors } from "@/lib/theme";

const MIN_LENGTH = 20;
const MAX_LENGTH = 5000;

interface InquiryFormProps {
  onResult: (response: AnalyzeResponse) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}

export function InquiryForm({ onResult, onError, onLoading }: InquiryFormProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function validateLocally(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return t.errEmpty;
    if (trimmed.length < MIN_LENGTH) {
      return formatMessage(t.errTooShort, { min: MIN_LENGTH });
    }
    if (trimmed.length > MAX_LENGTH) {
      return formatMessage(t.errTooLong, { max: MAX_LENGTH });
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
      const response = await analyzeInquiry(text.trim(), locale);
      onResult(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t.errUnexpected;
      onError(message);
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label htmlFor="inquiry">
        <span style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          {t.customerInquiry}
        </span>
        <textarea
          id="inquiry"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (localError) setLocalError(null);
          }}
          rows={8}
          placeholder={t.placeholder}
          style={textareaStyle}
        />
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ color: colors.muted, fontSize: "0.875rem" }}>
          {text.trim().length} / {MAX_LENGTH} {t.characters}
        </span>
        <button
          type="button"
          onClick={() => setText(getSampleInquiry(locale))}
          style={secondaryButtonStyle}
        >
          {t.loadSample}
        </button>
      </div>

      {localError && <p style={{ color: colors.danger, margin: 0 }}>{localError}</p>}

      <button type="submit" style={primaryButtonStyle}>
        {t.analyzeInquiry}
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
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
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
