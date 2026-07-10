export type CompanySize =
  | "startup"
  | "small"
  | "medium"
  | "large"
  | "enterprise"
  | "unknown";

export type Category =
  | "sales"
  | "support"
  | "partnership"
  | "pricing"
  | "demo"
  | "general";

export type Priority = "low" | "medium" | "high" | "urgent";
export type SalesPotential = "low" | "medium" | "high";

export interface LeadTriageResult {
  company: string;
  companySize: CompanySize;
  requestSummary: string;
  category: Category;
  priority: Priority;
  salesPotential: SalesPotential;
  recommendedAction: string;
  suggestedReply: string;
  confidence: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface AnalyzeResponse {
  success: boolean;
  result: LeadTriageResult | null;
  validationIssues: ValidationIssue[];
  provider: string;
  webhookPayload: Record<string, unknown> | null;
}

export interface WebhookResponse {
  success: boolean;
  statusCode: number | null;
  message: string;
}
