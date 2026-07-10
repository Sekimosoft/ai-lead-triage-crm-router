import type { AnalyzeResponse, WebhookResponse } from "@/types";
import type { Locale } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const WEBHOOK_MESSAGES_JA: Record<string, string> = {
  "Webhook delivered successfully.": "Webhookの送信に成功しました。",
  "Webhook request timed out.": "Webhookのリクエストがタイムアウトしました。",
};

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function analyzeInquiry(
  inquiryText: string,
  locale: Locale = "en"
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inquiryText, locale }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || "Analysis request failed.", response.status);
  }

  return response.json();
}

export async function sendWebhook(
  url: string,
  payload: Record<string, unknown>,
  locale: Locale = "en"
): Promise<WebhookResponse> {
  const response = await fetch(`${API_BASE}/api/v1/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, payload, locale }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || "Webhook request failed.", response.status);
  }

  const data: WebhookResponse = await response.json();
  if (locale === "ja" && data.message in WEBHOOK_MESSAGES_JA) {
    return { ...data, message: WEBHOOK_MESSAGES_JA[data.message] };
  }
  if (locale === "ja" && data.message.startsWith("Webhook request failed:")) {
    return { ...data, message: data.message.replace("Webhook request failed:", "Webhookの送信に失敗しました:") };
  }
  if (locale === "ja" && data.message.startsWith("Webhook returned status")) {
    return { ...data, message: data.message.replace("Webhook returned status", "Webhookがステータス") };
  }
  return data;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}
