import re
from datetime import datetime, timezone

from app.models.schemas import (
    Category,
    CompanySize,
    LeadTriageResult,
    Priority,
    SalesPotential,
)
from app.providers.base import AIProvider


class MockProvider(AIProvider):
    """Keyword/heuristic stand-in so demos run without external API keys."""

    @property
    def name(self) -> str:
        return "mock"

    async def analyze(self, inquiry_text: str) -> LeadTriageResult:
        text = inquiry_text.strip()
        lower = text.lower()

        company = self._extract_company(text) or "Unknown Company"
        company_size = self._infer_company_size(lower)
        category = self._infer_category(lower)
        priority = self._infer_priority(lower)
        sales_potential = self._infer_sales_potential(lower, category, priority)
        request_summary = self._build_summary(text)
        recommended_action = self._recommend_action(category, priority, sales_potential)
        suggested_reply = self._suggest_reply(company, category, request_summary)
        confidence = self._estimate_confidence(text, company)

        return LeadTriageResult(
            company=company,
            companySize=company_size,
            requestSummary=request_summary,
            category=category,
            priority=priority,
            salesPotential=sales_potential,
            recommendedAction=recommended_action,
            suggestedReply=suggested_reply,
            confidence=confidence,
        )

    def _extract_company(self, text: str) -> str | None:
        patterns = [
            r"(?:from|at|company(?:\s+name)?(?:\s+is)?)\s+([A-Z][A-Za-z0-9&.\- ]{2,60})",
            r"^([A-Z][A-Za-z0-9&.\- ]{2,40})(?:\s+team|\s+Inc|\s+Ltd|\s+Corp|\s+Co\.|\s+here)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                return match.group(1).strip(" .,")
        return None

    def _infer_company_size(self, lower: str) -> CompanySize:
        if any(k in lower for k in ("enterprise", "global", "fortune", "10,000", "10000")):
            return CompanySize.ENTERPRISE
        if any(k in lower for k in ("500 employees", "large company", "multinational")):
            return CompanySize.LARGE
        if any(k in lower for k in ("50 employees", "mid-size", "medium-sized", "growing team")):
            return CompanySize.MEDIUM
        if any(k in lower for k in ("startup", "early-stage", "seed", "10 employees", "small team")):
            return CompanySize.STARTUP
        if any(k in lower for k in ("small business", "local business", "boutique")):
            return CompanySize.SMALL
        return CompanySize.UNKNOWN

    def _infer_category(self, lower: str) -> Category:
        if any(k in lower for k in ("demo", "walkthrough", "product tour")):
            return Category.DEMO
        if any(k in lower for k in ("price", "pricing", "quote", "cost", "budget")):
            return Category.PRICING
        if any(k in lower for k in ("partner", "partnership", "integrate", "reseller")):
            return Category.PARTNERSHIP
        if any(k in lower for k in ("bug", "issue", "broken", "support", "help desk", "error")):
            return Category.SUPPORT
        if any(k in lower for k in ("buy", "purchase", "trial", "subscription", "sales", "proposal")):
            return Category.SALES
        return Category.GENERAL

    def _infer_priority(self, lower: str) -> Priority:
        if any(k in lower for k in ("urgent", "asap", "immediately", "today", "deadline")):
            return Priority.URGENT
        if any(k in lower for k in ("this week", "soon", "priority", "important")):
            return Priority.HIGH
        if any(k in lower for k in ("when you can", "no rush", "exploring", "curious")):
            return Priority.LOW
        return Priority.MEDIUM

    def _infer_sales_potential(
        self, lower: str, category: Category, priority: Priority
    ) -> SalesPotential:
        if category in (Category.SALES, Category.DEMO, Category.PRICING) and priority in (
            Priority.HIGH,
            Priority.URGENT,
        ):
            return SalesPotential.HIGH
        if category in (Category.SALES, Category.PRICING, Category.DEMO):
            return SalesPotential.MEDIUM
        if category == Category.SUPPORT:
            return SalesPotential.LOW
        if "budget" in lower or "purchase" in lower:
            return SalesPotential.HIGH
        return SalesPotential.MEDIUM

    def _build_summary(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if len(cleaned) <= 180:
            return cleaned
        return cleaned[:177].rstrip() + "..."

    def _recommend_action(
        self, category: Category, priority: Priority, sales_potential: SalesPotential
    ) -> str:
        if priority == Priority.URGENT and category in (Category.SALES, Category.DEMO):
            return "Call the prospect within 2 hours and schedule a live demo."
        if sales_potential == SalesPotential.HIGH:
            return "Assign to senior sales and send a tailored proposal within one business day."
        if category == Category.SUPPORT:
            return "Route to support queue and acknowledge receipt within 4 business hours."
        if category == Category.PARTNERSHIP:
            return "Forward to partnerships team for qualification and follow-up call."
        return "Send a personalized email reply and add the lead to CRM for nurture."

    def _suggest_reply(self, company: str, category: Category, summary: str) -> str:
        greeting = f"Hello {company} team,"
        if category == Category.DEMO:
            body = (
                "Thank you for your interest in a product demo. "
                "We would be happy to walk you through the features most relevant to your use case."
            )
        elif category == Category.PRICING:
            body = (
                "Thank you for reaching out about pricing. "
                "To provide an accurate quote, we would like to understand your team size and requirements."
            )
        elif category == Category.SUPPORT:
            body = (
                "Thank you for contacting us. We are sorry you are experiencing an issue "
                "and our support team is reviewing your message."
            )
        else:
            body = "Thank you for your inquiry. We appreciate you considering our solutions."

        closing = "Could you share a convenient time for a brief call this week?"
        return f"{greeting}\n\n{body}\n\nWe noted: {summary}\n\n{closing}"

    def _estimate_confidence(self, text: str, company: str) -> float:
        score = 0.55
        if company != "Unknown Company":
            score += 0.15
        if len(text) >= 80:
            score += 0.1
        if re.search(r"\b(?:@|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b", text):
            score += 0.05
        return min(round(score, 2), 0.95)
