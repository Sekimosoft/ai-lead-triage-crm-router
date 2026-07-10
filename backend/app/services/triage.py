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
        input_issues = validate_inquiry_input(request.inquiryText, self._settings)
        if input_issues:
            return AnalyzeResponse(
                success=False,
                validationIssues=input_issues,
                provider=self._provider.name,
            )

        try:
            result = await self._provider.analyze(request.inquiryText.strip())
        except Exception as exc:
            return AnalyzeResponse(
                success=False,
                validationIssues=[
                    ValidationIssue(
                        field="provider",
                        message=f"AI analysis failed: {exc}",
                    )
                ],
                provider=self._provider.name,
            )

        output_issues = validate_triage_result(result)
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
                message="Webhook request timed out.",
            )
        except httpx.RequestError as exc:
            return WebhookResponse(
                success=False,
                message=f"Webhook request failed: {exc}",
            )

        if response.is_success:
            return WebhookResponse(
                success=True,
                statusCode=response.status_code,
                message="Webhook delivered successfully.",
            )

        return WebhookResponse(
            success=False,
            statusCode=response.status_code,
            message=f"Webhook returned status {response.status_code}.",
        )
