from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ErrorResponse,
    WebhookRequest,
    WebhookResponse,
)
from app.providers.factory import get_ai_provider
from app.services.triage import TriageService, WebhookService

router = APIRouter(prefix="/api/v1")


def get_triage_service(settings: Settings = Depends(get_settings)) -> TriageService:
    try:
        provider = get_ai_provider(settings)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return TriageService(provider=provider, settings=settings)


def get_webhook_service(settings: Settings = Depends(get_settings)) -> WebhookService:
    return WebhookService(settings=settings)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def analyze(
    request: AnalyzeRequest,
    service: TriageService = Depends(get_triage_service),
) -> AnalyzeResponse:
    return await service.analyze(request)


@router.post(
    "/webhook",
    response_model=WebhookResponse,
    responses={400: {"model": ErrorResponse}},
)
async def send_webhook(
    request: WebhookRequest,
    service: WebhookService = Depends(get_webhook_service),
) -> WebhookResponse:
    return await service.send(request)
