import pytest

from app.config import Settings
from app.models.schemas import Category, CompanySize, LeadTriageResult, Priority, SalesPotential
from app.providers.mock_provider import MockProvider
from app.validation.rules import validate_inquiry_input, validate_triage_result

SAMPLE_JA = (
    "当社は従業員25名の会計事務所です。月300件ほどの問い合わせを担当者が手作業で振り分けています。"
    "この業務を自動化したいのですが、概算費用を相談できますか？"
)


@pytest.fixture
def settings():
    return Settings(ai_provider="mock", min_inquiry_length=20, max_inquiry_length=5000)


@pytest.mark.asyncio
async def test_mock_provider_extracts_company():
    provider = MockProvider()
    result = await provider.analyze(
        "Hello from Northwind Trading, we need pricing for 100 seats urgently."
    )
    assert "Northwind" in result.company or result.company != "Unknown Company"
    assert result.category == Category.PRICING
    assert result.priority == Priority.URGENT


@pytest.mark.asyncio
async def test_mock_provider_japanese_output():
    provider = MockProvider()
    result = await provider.analyze(SAMPLE_JA, locale="ja")
    assert result.category == Category.PRICING
    assert "ありがとう" in result.suggestedReply
    assert result.companySize == CompanySize.SMALL
    assert len(result.recommendedAction) >= 10


@pytest.mark.asyncio
async def test_mock_provider_english_output():
    provider = MockProvider()
    result = await provider.analyze(
        "Hello from Acme Corp, we need a demo this week.", locale="en"
    )
    assert "Thank you" in result.suggestedReply


@pytest.mark.asyncio
async def test_mock_provider_support_inquiry():
    provider = MockProvider()
    result = await provider.analyze(
        "We are seeing a bug in the login flow and need support when you can help."
    )
    assert result.category == Category.SUPPORT
    assert result.salesPotential == SalesPotential.LOW


def test_validate_inquiry_input_too_short(settings):
    issues = validate_inquiry_input("short text", settings)
    assert len(issues) == 1
    assert issues[0].field == "inquiryText"


def test_validate_inquiry_input_too_short_japanese(settings):
    issues = validate_inquiry_input("短い", settings, locale="ja")
    assert len(issues) == 1
    assert "文字" in issues[0].message


def test_validate_triage_low_confidence():
    result = LeadTriageResult(
        company="Acme",
        companySize=CompanySize.MEDIUM,
        requestSummary="Looking for a demo of the platform for our team.",
        category=Category.DEMO,
        priority=Priority.MEDIUM,
        salesPotential=SalesPotential.MEDIUM,
        recommendedAction="Schedule a product demo with the sales team this week.",
        suggestedReply="Thank you for your interest. We would be glad to arrange a demo at a time that works for you.",
        confidence=0.2,
    )
    issues = validate_triage_result(result)
    assert any(issue.field == "confidence" for issue in issues)


def test_validate_triage_schema_maintained():
    result = LeadTriageResult(
        company="会計事務所",
        companySize=CompanySize.SMALL,
        requestSummary="従業員25名の会計事務所からの問い合わせ自動化と概算費用の相談。",
        category=Category.PRICING,
        priority=Priority.MEDIUM,
        salesPotential=SalesPotential.HIGH,
        recommendedAction="営業担当が概算見積のたたき台を作成し、2営業日以内に返信してください。",
        suggestedReply="お見積りのご相談ありがとうございます。ご利用人数と要件をお聞かせください。",
        confidence=0.8,
    )
    assert result.model_dump()["category"] == "pricing"
