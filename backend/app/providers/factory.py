from app.providers.base import AIProvider
from app.providers.mock_provider import MockProvider
from app.providers.openai_provider import OpenAIProvider
from app.config import Settings


def get_ai_provider(settings: Settings) -> AIProvider:
    provider = settings.ai_provider.lower().strip()

    if provider == "mock":
        return MockProvider()

    if provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
        return OpenAIProvider(api_key=settings.openai_api_key, model=settings.openai_model)

    raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")
