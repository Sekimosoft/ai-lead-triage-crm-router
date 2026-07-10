import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_analyze_success(client):
    inquiry = (
        "Hello, we are from Acme Corp, a growing team of 50 employees. "
        "We would like a product demo and pricing details this week."
    )
    response = await client.post("/api/v1/analyze", json={"inquiryText": inquiry})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] == "mock"
    assert data["result"]["company"] == "Acme Corp"
    assert data["result"]["category"] in {"demo", "pricing", "sales"}
    assert "webhookPayload" in data
    assert data["webhookPayload"]["source"] == "ai-lead-triage-crm-router"


@pytest.mark.asyncio
async def test_analyze_rejects_short_input(client):
    response = await client.post("/api/v1/analyze", json={"inquiryText": "Too short"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["result"] is None
    assert any(issue["field"] == "inquiryText" for issue in data["validationIssues"])


@pytest.mark.asyncio
async def test_analyze_rejects_empty_input(client):
    response = await client.post("/api/v1/analyze", json={"inquiryText": "   "})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False


@pytest.mark.asyncio
async def test_webhook_rejects_invalid_url(client):
    payload = {
        "url": "not-a-url",
        "payload": {
            "triage": {
                "company": "Acme",
                "companySize": "medium",
                "requestSummary": "Needs a demo for the sales team soon.",
                "category": "demo",
                "priority": "high",
                "salesPotential": "high",
                "recommendedAction": "Schedule a demo with senior sales within one day.",
                "suggestedReply": "Thank you for reaching out. We would be happy to schedule a demo at your convenience.",
                "confidence": 0.8,
            }
        },
    }
    response = await client.post("/api/v1/webhook", json=payload)
    assert response.status_code == 422
