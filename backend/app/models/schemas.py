from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

Locale = Literal["en", "ja"]


class CompanySize(str, Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"
    UNKNOWN = "unknown"


class Category(str, Enum):
    SALES = "sales"
    SUPPORT = "support"
    PARTNERSHIP = "partnership"
    PRICING = "pricing"
    DEMO = "demo"
    GENERAL = "general"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SalesPotential(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class LeadTriageResult(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    companySize: CompanySize
    requestSummary: str = Field(..., min_length=10, max_length=500)
    category: Category
    priority: Priority
    salesPotential: SalesPotential
    recommendedAction: str = Field(..., min_length=10, max_length=500)
    suggestedReply: str = Field(..., min_length=20, max_length=2000)
    confidence: float = Field(..., ge=0.0, le=1.0)


class AnalyzeRequest(BaseModel):
    inquiryText: str = Field(..., min_length=1)
    locale: Locale = "en"


class ValidationIssue(BaseModel):
    field: str
    message: str


class AnalyzeResponse(BaseModel):
    success: bool
    result: LeadTriageResult | None = None
    validationIssues: list[ValidationIssue] = Field(default_factory=list)
    provider: str
    webhookPayload: dict | None = None


class WebhookPayload(BaseModel):
    source: Literal["ai-lead-triage-crm-router"] = "ai-lead-triage-crm-router"
    version: Literal["1.0"] = "1.0"
    triage: LeadTriageResult
    metadata: dict = Field(default_factory=dict)


class WebhookRequest(BaseModel):
    url: HttpUrl
    payload: WebhookPayload
    locale: Locale = "en"


class WebhookResponse(BaseModel):
    success: bool
    statusCode: int | None = None
    message: str


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
