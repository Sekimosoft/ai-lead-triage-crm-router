import pytest

from app.config import Settings
from app.models.schemas import Category, CompanySize, LeadTriageResult, Priority, SalesPotential
from app.providers.mock_provider import MockProvider
from app.validation.rules import validate_inquiry_input, validate_triage_result


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
