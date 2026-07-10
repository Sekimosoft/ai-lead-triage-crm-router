import json

import httpx

from app.models.schemas import LeadTriageResult
from app.providers.base import AIProvider


class OpenAIProvider(AIProvider):
    """Optional real provider — same contract as MockProvider for drop-in use."""

    SYSTEM_PROMPT = """You triage inbound B2B sales inquiries into structured CRM-ready data.
Return ONLY valid JSON with these exact keys:
company, companySize, requestSummary, category, priority, salesPotential,
recommendedAction, suggestedReply, confidence

Allowed enum values:
- companySize: startup, small, medium, large, enterprise, unknown
- category: sales, support, partnership, pricing, demo, general
- priority: low, medium, high, urgent
- salesPotential: low, medium, high
- confidence: number between 0 and 1

Keep requestSummary under 500 characters. Keep suggestedReply professional and under 2000 characters."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self._api_key = api_key
        self._model = model

    @property
    def name(self) -> str:
        return "openai"

    async def analyze(self, inquiry_text: str) -> LeadTriageResult:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": inquiry_text},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]

        data = json.loads(content)
        return LeadTriageResult.model_validate(data)
