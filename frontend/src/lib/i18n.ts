export type Locale = "en" | "ja";

export const DEFAULT_LOCALE: Locale = "en";

export type Messages = {
  brand: string;
  title: string;
  description: string;
  sectionPasteInquiry: string;
  customerInquiry: string;
  placeholder: string;
  characters: string;
  loadSample: string;
  analyzeInquiry: string;
  analyzing: string;
  validationIssues: string;
  structuredOutput: string;
  viaProvider: string;
  company: string;
  companySize: string;
  category: string;
  priority: string;
  salesPotential: string;
  confidence: string;
  requestSummary: string;
  recommendedAction: string;
  suggestedReply: string;
  webhookJson: string;
  copyJson: string;
  copied: string;
  copyFailed: string;
  sendWebhook: string;
  webhookPlaceholder: string;
  sending: string;
  sendWebhookButton: string;
  footer: string;
  provider: string;
  errEmpty: string;
  errTooShort: string;
  errTooLong: string;
  errUnexpected: string;
  errWebhookFailed: string;
  langSwitchLabel: string;
  langEn: string;
  langJa: string;
};

const en: Messages = {
  brand: "Sekimosoft · Portfolio Demo",
  title: "AI Lead Triage CRM Router",
  description:
    "Turn messy inbound inquiries into structured sales-ready data — company, priority, recommended action, and a draft reply — in seconds.",
  sectionPasteInquiry: "1. Paste inquiry",
  customerInquiry: "Customer inquiry",
  placeholder: "Paste a sample sales or support inquiry. Do not use real customer data.",
  characters: "characters",
  loadSample: "Load sample",
  analyzeInquiry: "Analyze inquiry",
  analyzing: "Analyzing…",
  validationIssues: "Validation issues",
  structuredOutput: "Structured output",
  viaProvider: "via {provider} provider",
  company: "Company",
  companySize: "Company size",
  category: "Category",
  priority: "Priority",
  salesPotential: "Sales potential",
  confidence: "Confidence",
  requestSummary: "Request summary",
  recommendedAction: "Recommended action",
  suggestedReply: "Suggested reply",
  webhookJson: "Webhook JSON",
  copyJson: "Copy JSON",
  copied: "Copied to clipboard",
  copyFailed: "Copy failed — select JSON manually",
  sendWebhook: "Send to webhook",
  webhookPlaceholder: "https://your-crm-or-automation-endpoint",
  sending: "Sending…",
  sendWebhookButton: "Send webhook",
  footer:
    "Demo only — use fictional inquiries. Built by Sekimosoft as part of the BizDXAI platform portfolio.",
  provider: "Provider",
  errEmpty: "Please enter an inquiry message.",
  errTooShort: "Inquiry must be at least {min} characters.",
  errTooLong: "Inquiry must not exceed {max} characters.",
  errUnexpected: "Unexpected error during analysis.",
  errWebhookFailed: "Webhook delivery failed.",
  langSwitchLabel: "Language",
  langEn: "EN",
  langJa: "JP",
};

const ja: Messages = {
  brand: "Sekimosoft · Portfolio Demo",
  title: "AI Lead Triage CRM Router",
  description:
    "受け付けた問い合わせ文を、会社名・優先度・推奨アクション・返信草案を含む営業・CRM向けの構造化データへ数秒で変換します。",
  sectionPasteInquiry: "1. 問い合わせ文を貼り付け",
  customerInquiry: "お問い合わせ内容",
  placeholder: "サンプルの営業・サポート問い合わせを貼り付けてください。実在の顧客データは使用しないでください。",
  characters: "文字",
  loadSample: "サンプルを読み込む",
  analyzeInquiry: "問い合わせを解析",
  analyzing: "解析中…",
  validationIssues: "検証エラー",
  structuredOutput: "構造化出力",
  viaProvider: "{provider} プロバイダー経由",
  company: "会社名",
  companySize: "会社規模",
  category: "カテゴリ",
  priority: "優先度",
  salesPotential: "商談可能性",
  confidence: "信頼度",
  requestSummary: "要約",
  recommendedAction: "推奨アクション",
  suggestedReply: "返信草案",
  webhookJson: "Webhook JSON",
  copyJson: "JSONをコピー",
  copied: "クリップボードにコピーしました",
  copyFailed: "コピーに失敗しました — JSONを手動で選択してください",
  sendWebhook: "Webhookへ送信",
  webhookPlaceholder: "https://your-crm-or-automation-endpoint",
  sending: "送信中…",
  sendWebhookButton: "Webhookを送信",
  footer:
    "デモ専用 — 架空の問い合わせのみ使用してください。BizDXAIプラットフォームのポートフォリオ作品としてSekimosoftが制作しました。",
  provider: "プロバイダー",
  errEmpty: "問い合わせ文を入力してください。",
  errTooShort: "問い合わせは{min}文字以上で入力してください。",
  errTooLong: "問い合わせは{max}文字以内で入力してください。",
  errUnexpected: "解析中に予期しないエラーが発生しました。",
  errWebhookFailed: "Webhookの送信に失敗しました。",
  langSwitchLabel: "言語",
  langEn: "EN",
  langJa: "JP",
};

const dictionaries: Record<Locale, Messages> = { en, ja };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export const SAMPLE_INQUIRY_EN =
  "Hello, we are from Northwind Analytics, a mid-size team of about 50 employees. " +
  "We are evaluating CRM tools and would like a product demo plus pricing for 80 seats this week.";

export const SAMPLE_INQUIRY_JA =
  "当社は従業員25名の会計事務所です。月300件ほどの問い合わせを担当者が手作業で振り分けています。" +
  "この業務を自動化したいのですが、概算費用を相談できますか？";

export function getSampleInquiry(locale: Locale): string {
  return locale === "ja" ? SAMPLE_INQUIRY_JA : SAMPLE_INQUIRY_EN;
}

const categoryLabels: Record<Locale, Record<string, string>> = {
  en: {
    sales: "sales",
    support: "support",
    partnership: "partnership",
    pricing: "pricing",
    demo: "demo",
    general: "general",
  },
  ja: {
    sales: "営業",
    support: "サポート",
    partnership: "提携",
    pricing: "料金",
    demo: "デモ",
    general: "一般",
  },
};

const priorityLabels: Record<Locale, Record<string, string>> = {
  en: { low: "low", medium: "medium", high: "high", urgent: "urgent" },
  ja: { low: "低", medium: "中", high: "高", urgent: "緊急" },
};

const salesPotentialLabels: Record<Locale, Record<string, string>> = {
  en: { low: "low", medium: "medium", high: "high" },
  ja: { low: "低", medium: "中", high: "高" },
};

const companySizeLabels: Record<Locale, Record<string, string>> = {
  en: {
    startup: "startup",
    small: "small",
    medium: "medium",
    large: "large",
    enterprise: "enterprise",
    unknown: "unknown",
  },
  ja: {
    startup: "スタートアップ",
    small: "小規模",
    medium: "中規模",
    large: "大規模",
    enterprise: "エンタープライズ",
    unknown: "不明",
  },
};

export function labelEnum(
  locale: Locale,
  group: "category" | "priority" | "salesPotential" | "companySize",
  value: string
): string {
  const maps = {
    category: categoryLabels,
    priority: priorityLabels,
    salesPotential: salesPotentialLabels,
    companySize: companySizeLabels,
  };
  return maps[group][locale][value] ?? value;
}
