import { describe, expect, it } from "vitest";

const MIN_LENGTH = 20;
const MAX_LENGTH = 5000;

function validateInquiry(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Please enter an inquiry message.";
  if (trimmed.length < MIN_LENGTH) return `Inquiry must be at least ${MIN_LENGTH} characters.`;
  if (trimmed.length > MAX_LENGTH) return `Inquiry must not exceed ${MAX_LENGTH} characters.`;
  return null;
}

describe("inquiry validation", () => {
  it("accepts valid inquiry length", () => {
    expect(validateInquiry("A".repeat(25))).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateInquiry("   ")).toBe("Please enter an inquiry message.");
  });

  it("rejects too short input", () => {
    expect(validateInquiry("short")).toMatch(/at least/);
  });
});
