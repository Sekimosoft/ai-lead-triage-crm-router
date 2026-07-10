import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getMessages,
  getSampleInquiry,
  SAMPLE_INQUIRY_EN,
  SAMPLE_INQUIRY_JA,
  formatMessage,
  labelEnum,
} from "./i18n";

const MIN_LENGTH = 20;
const MAX_LENGTH = 5000;

function validateInquiry(text: string, locale: "en" | "ja"): string | null {
  const t = getMessages(locale);
  const trimmed = text.trim();
  if (!trimmed) return t.errEmpty;
  if (trimmed.length < MIN_LENGTH) return formatMessage(t.errTooShort, { min: MIN_LENGTH });
  if (trimmed.length > MAX_LENGTH) return formatMessage(t.errTooLong, { max: MAX_LENGTH });
  return null;
}

describe("i18n", () => {
  it("defaults to English locale constant", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("returns English messages for en", () => {
    expect(getMessages("en").analyzeInquiry).toBe("Analyze inquiry");
    expect(getMessages("en").title).toBe("AI Lead Triage CRM Router");
  });

  it("returns Japanese messages for ja", () => {
    expect(getMessages("ja").analyzeInquiry).toBe("問い合わせを解析");
    expect(getMessages("ja").loadSample).toBe("サンプルを読み込む");
  });

  it("switches primary labels between EN and JP", () => {
    const en = getMessages("en");
    const ja = getMessages("ja");
    expect(en.sectionPasteInquiry).not.toBe(ja.sectionPasteInquiry);
    expect(ja.sectionPasteInquiry).toBe("1. 問い合わせ文を貼り付け");
  });

  it("provides locale-specific sample inquiries", () => {
    expect(getSampleInquiry("en")).toBe(SAMPLE_INQUIRY_EN);
    expect(getSampleInquiry("ja")).toBe(SAMPLE_INQUIRY_JA);
    expect(SAMPLE_INQUIRY_JA).toContain("会計事務所");
  });

  it("validates inquiry messages per locale", () => {
    expect(validateInquiry("", "en")).toBe("Please enter an inquiry message.");
    expect(validateInquiry("", "ja")).toBe("問い合わせ文を入力してください。");
    expect(validateInquiry("short", "ja")).toMatch(/文字/);
  });

  it("labels enums in Japanese without changing keys", () => {
    expect(labelEnum("ja", "category", "pricing")).toBe("料金");
    expect(labelEnum("en", "category", "pricing")).toBe("pricing");
  });
});
