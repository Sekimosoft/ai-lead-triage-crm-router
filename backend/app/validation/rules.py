from app.config import Settings
from app.models.schemas import ValidationIssue


def validate_inquiry_input(text: str, settings: Settings) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    stripped = text.strip()

    if not stripped:
        issues.append(ValidationIssue(field="inquiryText", message="Inquiry text is required."))
        return issues

    if len(stripped) < settings.min_inquiry_length:
        issues.append(
            ValidationIssue(
                field="inquiryText",
                message=f"Inquiry must be at least {settings.min_inquiry_length} characters.",
            )
        )

    if len(stripped) > settings.max_inquiry_length:
        issues.append(
            ValidationIssue(
                field="inquiryText",
                message=f"Inquiry must not exceed {settings.max_inquiry_length} characters.",
            )
        )

    return issues


def validate_triage_result(result) -> list[ValidationIssue]:
    """Business-critical guardrails after AI interpretation."""
    issues: list[ValidationIssue] = []

    if result.confidence < 0.3:
        issues.append(
            ValidationIssue(
                field="confidence",
                message="Confidence is too low for automated routing; manual review required.",
            )
        )

    if result.company.lower() in {"unknown", "unknown company", "n/a"}:
        issues.append(
            ValidationIssue(
                field="company",
                message="Company name could not be determined reliably.",
            )
        )

    blocked_keywords = ("ssn", "credit card", "password")
    combined = f"{result.requestSummary} {result.suggestedReply}".lower()
    if any(keyword in combined for keyword in blocked_keywords):
        issues.append(
            ValidationIssue(
                field="inquiryText",
                message="Inquiry appears to contain sensitive data and cannot be processed.",
            )
        )

    return issues
