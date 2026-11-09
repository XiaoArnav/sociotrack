"""
Optional Real-Provider Integration Smoke Test.
Only runs when RUN_REAL_AI_TESTS="true" and valid API keys are configured in the environment.
Does NOT run by default in offline/CI environments to avoid external dependencies.
"""

import os
import pytest
from app.services.ai_provider_service import ai_provider_service
from app.services.brand_context_engine import BrandContextSummary
from app.services.brand_content_generator import generate_brand_drafts


RUN_REAL_AI_TESTS = os.environ.get("RUN_REAL_AI_TESTS", "").lower() in ("true", "1")


@pytest.mark.skipif(
    not RUN_REAL_AI_TESTS,
    reason="Real-provider smoke tests disabled. Set RUN_REAL_AI_TESTS=true with valid credentials to enable."
)
@pytest.mark.asyncio
async def test_real_provider_live_call():
    """Executes a real live API call against the configured LLM provider."""
    available = ai_provider_service.get_available_providers()
    if not available:
        pytest.skip("No real AI provider credentials (GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY) found.")

    provider = available[0]
    prompt = "Generate 3 bullet points on the advantages of structured logging in Python."
    result = await ai_provider_service.call_ai_model(
        prompt=prompt,
        system_prompt="You are a helpful engineering assistant.",
        provider_override=provider,
        allow_fallback=False,
    )

    assert result.is_ai_generated is True
    assert result.provider == provider
    assert len(result.content.strip()) > 20
    assert result.latency_ms > 0
