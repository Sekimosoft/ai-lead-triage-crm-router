import re

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

    async def analyze(self, inquiry_text: str, locale: str = "en") -> LeadTriageResult:
        text = inquiry_text.strip()
        lower = text.lower()
        is_ja = locale == "ja"

        company = self._extract_company(text, is_ja) or ("不明な会社" if is_ja else "Unknown Company")
        company_size = self._infer_company_size(lower, text)
        category = self._infer_category(lower, text)
        priority = self._infer_priority(lower, text)
        sales_potential = self._infer_sales_potential(lower, text, category, priority)
        request_summary = self._build_summary(text)
        recommended_action = self._recommend_action(category, priority, sales_potential, is_ja)
        suggested_reply = self._suggest_reply(company, category, request_summary, is_ja)
        confidence = self._estimate_confidence(text, company, is_ja)

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

    def _extract_company(self, text: str, is_ja: bool) -> str | None:
        if is_ja:
            patterns = [
                r"当社は従業員\d+名の([^。、\s]{2,30})",
                r"(?:会社名|企業名)[:：]?\s*([^\s。、]{2,40})",
            ]
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip(" .、")
            if "会計事務所" in text:
                return "会計事務所"
            return None

        patterns = [
            r"(?:from|at|company(?:\s+name)?(?:\s+is)?)\s+([A-Z][A-Za-z0-9&.\- ]{2,60})",
            r"^([A-Z][A-Za-z0-9&.\- ]{2,40})(?:\s+team|\s+Inc|\s+Ltd|\s+Corp|\s+Co\.|\s+here)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                return match.group(1).strip(" .,")
        return None

    def _infer_company_size(self, lower: str, text: str) -> CompanySize:
        if re.search(r"25名|２５名", text):
            return CompanySize.SMALL
        if any(k in lower for k in ("enterprise", "global", "fortune", "10,000", "10000")):
            return CompanySize.ENTERPRISE
        if any(k in lower for k in ("500 employees", "large company", "multinational")):
            return CompanySize.LARGE
        if any(k in lower or k in text for k in ("50 employees", "mid-size", "medium-sized", "growing team", "50名", "中規模")):
            return CompanySize.MEDIUM
        if any(k in lower for k in ("startup", "early-stage", "seed", "10 employees", "small team")):
            return CompanySize.STARTUP
        if any(k in lower or k in text for k in ("small business", "local business", "boutique", "小規模", "会計事務所")):
            return CompanySize.SMALL
        return CompanySize.UNKNOWN

    def _infer_category(self, lower: str, text: str) -> Category:
        if any(k in lower for k in ("demo", "walkthrough", "product tour")) or "デモ" in text:
            return Category.DEMO
        if any(k in lower for k in ("price", "pricing", "quote", "cost", "budget")) or any(
            k in text for k in ("料金", "費用", "価格", "概算")
        ):
            return Category.PRICING
        if any(k in lower for k in ("partner", "partnership", "integrate", "reseller")) or "提携" in text:
            return Category.PARTNERSHIP
        if any(k in lower for k in ("bug", "issue", "broken", "support", "help desk", "error")) or "サポート" in text:
            return Category.SUPPORT
        if any(k in lower for k in ("buy", "purchase", "trial", "subscription", "sales", "proposal")) or "自動化" in text:
            return Category.SALES
        return Category.GENERAL

    def _infer_priority(self, lower: str, text: str) -> Priority:
        if any(k in lower for k in ("urgent", "asap", "immediately", "today", "deadline")) or "至急" in text:
            return Priority.URGENT
        if any(k in lower for k in ("this week", "soon", "priority", "important")) or "今週" in text:
            return Priority.HIGH
        if any(k in lower for k in ("when you can", "no rush", "exploring", "curious")):
            return Priority.LOW
        return Priority.MEDIUM

    def _infer_sales_potential(
        self, lower: str, text: str, category: Category, priority: Priority
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
        if "budget" in lower or "purchase" in lower or "費用" in text or "自動化" in text:
            return SalesPotential.HIGH
        return SalesPotential.MEDIUM

    def _build_summary(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if len(cleaned) <= 180:
            return cleaned
        return cleaned[:177].rstrip() + "..."

    def _recommend_action(
        self, category: Category, priority: Priority, sales_potential: SalesPotential, is_ja: bool
    ) -> str:
        if is_ja:
            if priority == Priority.URGENT and category in (Category.SALES, Category.DEMO):
                return "2時間以内に架電し、ライブデモの日程を調整してください。"
            if sales_potential == SalesPotential.HIGH:
                return "シニア営業担当へ割り当て、1営業日以内に個別提案を送付してください。"
            if category == Category.SUPPORT:
                return "サポートキューへ振り分け、4営業時間以内に受領確認を送ってください。"
            if category == Category.PARTNERSHIP:
                return "パートナーシップチームへ転送し、要件確認のフォローアップを行ってください。"
            if category == Category.PRICING:
                return "営業担当が概算見積のたたき台を作成し、2営業日以内に返信してください。"
            return "個別メールで返信し、CRMに登録してナーチャリングを開始してください。"

        if priority == Priority.URGENT and category in (Category.SALES, Category.DEMO):
            return "Call the prospect within 2 hours and schedule a live demo."
        if sales_potential == SalesPotential.HIGH:
            return "Assign to senior sales and send a tailored proposal within one business day."
        if category == Category.SUPPORT:
            return "Route to support queue and acknowledge receipt within 4 business hours."
        if category == Category.PARTNERSHIP:
            return "Forward to partnerships team for qualification and follow-up call."
        return "Send a personalized email reply and add the lead to CRM for nurture."

    def _suggest_reply(
        self, company: str, category: Category, summary: str, is_ja: bool
    ) -> str:
        if is_ja:
            greeting = f"{company} ご担当者様"
            if category == Category.DEMO:
                body = "デモのご希望ありがとうございます。貴社の用途に合わせた機能をご案内いたします。"
            elif category == Category.PRICING:
                body = "お見積りのご相談ありがとうございます。正確な概算をお出しするため、ご利用人数と要件をお聞かせください。"
            elif category == Category.SUPPORT:
                body = "お問い合わせありがとうございます。ご不便をおかけしており申し訳ございません。サポートチームが内容を確認しております。"
            else:
                body = "お問い合わせいただきありがとうございます。弊社ソリューションにご関心をお寄せいただき感謝いたします。"

            closing = "今週中に15分ほどのお打ち合わせのお時間をいただけますでしょうか。"
            return f"{greeting}\n\n{body}\n\n確認内容: {summary}\n\n{closing}"

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

    def _estimate_confidence(self, text: str, company: str, is_ja: bool) -> float:
        score = 0.55
        unknown = "Unknown Company" if not is_ja else "不明な会社"
        if company != unknown and company not in {"不明", "不明な会社"}:
            score += 0.15
        if len(text) >= 80:
            score += 0.1
        if re.search(r"\b(?:@|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b", text):
            score += 0.05
        return min(round(score, 2), 0.95)
