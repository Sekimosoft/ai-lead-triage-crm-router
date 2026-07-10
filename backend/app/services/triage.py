from datetime import datetime, timezone

import httpx

from app.config import Settings
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    LeadTriageResult,
    ValidationIssue,
    WebhookPayload,
    WebhookRequest,
    WebhookResponse,
)
from app.providers.base import AIProvider
from app.validation.rules import validate_inquiry_input, validate_triage_result


class TriageService:
    def __init__(self, provider: AIProvider, settings: Settings) -> None:
        self._provider = provider
        self._settings = settings

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        locale = request.locale
        input_issues = validate_inquiry_input(request.inquiryText, self._settings, locale)
        if input_issues:
            return AnalyzeResponse(
                success=False,
                validationIssues=input_issues,
                provider=self._provider.name,
            )

        try:
            result = await self._provider.analyze(request.inquiryText.strip(), locale)
        except Exception as exc:
            fail_msg = (
                f"AI analysis failed: {exc}"
                if locale == "en"
                else f"AI解析に失敗しました: {exc}"
            )
            return AnalyzeResponse(
                success=False,
                validationIssues=[
                    ValidationIssue(field="provider", message=fail_msg)
                ],
                provider=self._provider.name,
            )

        output_issues = validate_triage_result(result, locale)
        webhook_payload = self.build_webhook_payload(result)

        return AnalyzeResponse(
            success=len(output_issues) == 0,
            result=result,
            validationIssues=output_issues,
            provider=self._provider.name,
            webhookPayload=webhook_payload,
        )

    def build_webhook_payload(self, result: LeadTriageResult) -> dict:
        payload = WebhookPayload(
            triage=result,
            metadata={
                "processedAt": datetime.now(timezone.utc).isoformat(),
                "provider": self._provider.name,
            },
        )
        return payload.model_dump(mode="json")


class WebhookService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def send(self, request: WebhookRequest) -> WebhookResponse:
        locale = request.locale
        try:
            async with httpx.AsyncClient(timeout=self._settings.webhook_timeout_seconds) as client:
                response = await client.post(
                    str(request.url),
                    json=request.payload.model_dump(mode="json"),
                    headers={"Content-Type": "application/json"},
                )
        except httpx.TimeoutException:
            return WebhookResponse(
                success=False,
                message="Webhook request timed out."
                if locale == "en"
                else "Webhookのリクエストがタイムアウトしました。",
            )
        except httpx.RequestError as exc:
            prefix = "Webhook request failed:" if locale == "en" else "Webhookの送信に失敗しました:"
            return WebhookResponse(success=False, message=f"{prefix} {exc}")

        if response.is_success:
            return WebhookResponse(
                success=True,
                statusCode=response.status_code,
                message="Webhook delivered successfully."
                if locale == "en"
                else "Webhookの送信に成功しました。",
            )

        prefix = "Webhook returned status" if locale == "en" else "Webhookがステータス"
        return WebhookResponse(
            success=False,
            statusCode=response.status_code,
            message=f"{prefix} {response.status_code}.",
        )
