import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

SAMPLE_JA = (
    "当社は従業員25名の山田会計事務所です。月300件ほどの問い合わせを担当者が手作業で振り分けています。"
    "この業務を自動化したいのですが、概算費用を相談できますか？"
)


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
async def test_analyze_japanese_mock(client):
    response = await client.post(
        "/api/v1/analyze",
        json={"inquiryText": SAMPLE_JA, "locale": "ja"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    result = data["result"]
    assert result["company"] == "山田会計事務所"
    assert not any(issue["field"] == "company" for issue in data["validationIssues"])
    assert "ありがとう" in result["suggestedReply"]


@pytest.mark.asyncio
async def test_analyze_english_official_sample(client):
    inquiry = (
        "Hello, we are from Northwind Analytics, a mid-size team of about 50 employees. "
        "We are evaluating CRM tools and would like a product demo plus pricing for 80 seats this week."
    )
    response = await client.post("/api/v1/analyze", json={"inquiryText": inquiry, "locale": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Northwind" in data["result"]["company"]


@pytest.mark.asyncio
async def test_analyze_defaults_to_english(client):
    inquiry = (
        "Hello, we are from Acme Corp, a growing team of 50 employees. "
        "We would like a product demo and pricing details this week."
    )
    response = await client.post("/api/v1/analyze", json={"inquiryText": inquiry})
    data = response.json()
    assert "Thank you" in data["result"]["suggestedReply"]


@pytest.mark.asyncio
async def test_analyze_rejects_short_input(client):
    response = await client.post("/api/v1/analyze", json={"inquiryText": "Too short"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["result"] is None
    assert any(issue["field"] == "inquiryText" for issue in data["validationIssues"])


@pytest.mark.asyncio
async def test_analyze_rejects_short_input_japanese_message(client):
    response = await client.post(
        "/api/v1/analyze",
        json={"inquiryText": "短い", "locale": "ja"},
    )
    data = response.json()
    assert data["success"] is False
    assert any("文字" in issue["message"] for issue in data["validationIssues"])


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
