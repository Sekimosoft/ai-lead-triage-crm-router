import re

from app.config import Settings
from app.models.schemas import ValidationIssue

_MESSAGES = {
    "en": {
        "required": "Inquiry text is required.",
        "min": "Inquiry must be at least {min} characters.",
        "max": "Inquiry must not exceed {max} characters.",
        "confidence": "Confidence is too low for automated routing; manual review required.",
        "company": "Company name could not be determined reliably.",
        "sensitive": "Inquiry appears to contain sensitive data and cannot be processed.",
    },
    "ja": {
        "required": "問い合わせ文を入力してください。",
        "min": "問い合わせは{min}文字以上で入力してください。",
        "max": "問い合わせは{max}文字以内で入力してください。",
        "confidence": "信頼度が低いため自動振り分けできません。手動確認が必要です。",
        "company": "会社名を十分に特定できませんでした。",
        "sensitive": "問い合わせに機密情報が含まれている可能性があるため処理できません。",
    },
}


def _msg(locale: str, key: str, **kwargs: int) -> str:
    template = _MESSAGES.get(locale, _MESSAGES["en"])[key]
    return template.format(**kwargs) if kwargs else template


def validate_inquiry_input(text: str, settings: Settings, locale: str = "en") -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    stripped = text.strip()

    if not stripped:
        issues.append(ValidationIssue(field="inquiryText", message=_msg(locale, "required")))
        return issues

    if len(stripped) < settings.min_inquiry_length:
        issues.append(
            ValidationIssue(
                field="inquiryText",
                message=_msg(locale, "min", min=settings.min_inquiry_length),
            )
        )

    if len(stripped) > settings.max_inquiry_length:
        issues.append(
            ValidationIssue(
                field="inquiryText",
                message=_msg(locale, "max", max=settings.max_inquiry_length),
            )
        )

    return issues


def validate_triage_result(result, locale: str = "en") -> list[ValidationIssue]:
    """Business-critical guardrails after AI interpretation."""
    issues: list[ValidationIssue] = []

    if result.confidence < 0.3:
        issues.append(
            ValidationIssue(field="confidence", message=_msg(locale, "confidence"))
        )

    unknown_names = {"unknown", "unknown company", "n/a", "不明", "不明な会社"}
    if result.company.lower() in unknown_names or result.company in {"不明", "不明な会社"}:
        issues.append(ValidationIssue(field="company", message=_msg(locale, "company")))

    blocked_keywords = ("ssn", "credit card", "password", "クレジットカード", "パスワード")
    combined = f"{result.requestSummary} {result.suggestedReply}".lower()
    if any(keyword in combined for keyword in blocked_keywords):
        issues.append(ValidationIssue(field="inquiryText", message=_msg(locale, "sensitive")))

    return issues
