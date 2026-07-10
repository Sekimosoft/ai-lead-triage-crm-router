import type { AnalyzeResponse, WebhookResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function analyzeInquiry(inquiryText: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inquiryText }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || "Analysis request failed.", response.status);
  }

  return response.json();
}

export async function sendWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<WebhookResponse> {
  const response = await fetch(`${API_BASE}/api/v1/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, payload }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || "Webhook request failed.", response.status);
  }

  return response.json();
}

export function getApiBaseUrl(): string {
  return API_BASE;
}
