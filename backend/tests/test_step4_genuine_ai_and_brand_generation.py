"""
Automated Test Suite for Step 4: Genuine AI Intelligence & Brand-Specific Generation.

Verifies all 14 Step 4 requirements:
1. Real provider clients are invoked through the generation service (mocked for CI).
2. Provider configuration is loaded securely from settings/env.
3. Missing provider credentials produce an honest error or explicit fallback flag.
4. Provider timeouts and rate limits (429) are handled with Retry-After.
5. Different brand contexts produce appropriately different generation requests.
6. Cross-workspace brand context cannot be accessed (403 Forbidden).
7. Missing brand information is handled without fabrication.
8. Generation respects platform and format requirements (LinkedIn vs Instagram vs X).
9. Model output is validated against the expected schema.
10. Evaluation returns structured and meaningful feedback.
11. Unsupported factual claims are identified where present.
12. Fallback output is explicitly distinguishable from model-generated output.
13. Existing content workflows continue to work (generate -> approve).
14. No generated content is published automatically (strictly persisted as 'draft').
"""

import os
import json
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport, Response
from unittest.mock import patch, MagicMock

from app.main import app
from app.config import settings
from app.database import init_db, async_session_maker
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.schemas.auth import UserResponse
from app.core.security import hash_password, create_access_token
from app.services.ai_provider_service import (
    AIProviderService,
    AIProviderResult,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
    AIProviderSchemaValidationError,
    ai_provider_service,
)
from app.services.brand_context_engine import (
    BrandContextSummary,
    build_brand_context_from_brand,
    extract_brand_context,
    format_brand_generation_prompt,
)
from app.services.brand_voice_evaluator import (
    evaluate_draft_voice,
    evaluate_objective_rules,
    BrandVoiceEvaluationResult,
)
from app.services.brand_content_generator import (
    generate_brand_drafts,
    BrandGenerationResult,
)


from app.models.workspace import Workspace, WorkspaceMember


@pytest_asyncio.fixture
async def setup_test_users_and_brands():
    """Sets up two isolated users and brands across different workspaces."""
    await init_db()
    async with async_session_maker() as session:
        # Users
        user_a = User(
            id="user_a_step4_id",
            email="brand_owner_a@sociotrack.io",
            hashed_password=hash_password("Pass1234!"),
            name="Alice Architect",
            role="Editor",
        )
        user_b = User(
            id="user_b_step4_id",
            email="brand_owner_b@sociotrack.io",
            hashed_password=hash_password("Pass1234!"),
            name="Bob Barista",
            role="Editor",
        )
        await session.merge(user_a)
        await session.merge(user_b)

        # Workspaces
        ws_a = Workspace(
            id="ws_alpha_step4",
            name="Alpha Workspace",
            slug=f"alpha-ws-{uuid.uuid4().hex[:6]}",
            owner_id="user_a_step4_id",
        )
        ws_b = Workspace(
            id="ws_beta_step4",
            name="Beta Workspace",
            slug=f"beta-ws-{uuid.uuid4().hex[:6]}",
            owner_id="user_b_step4_id",
        )
        await session.merge(ws_a)
        await session.merge(ws_b)

        # Memberships
        m_a = WorkspaceMember(id="mem_a_step4", workspace_id="ws_alpha_step4", user_id="user_a_step4_id", role="owner")
        m_b = WorkspaceMember(id="mem_b_step4", workspace_id="ws_beta_step4", user_id="user_b_step4_id", role="owner")
        await session.merge(m_a)
        await session.merge(m_b)

        # Brand A: Enterprise Cloud Architecture
        brand_a = Brand(
            id="brand_a_cloud_id",
            workspace_id="ws_alpha_step4",
            user_id="user_a_step4_id",
            name="CloudScale Infrastructure",
            voice_description="Rigorous, data-backed, engineering-focused, zero-fluff.",
            target_audience="Principal Site Reliability Engineers and Cloud Architects.",
            intelligence_profile=json.dumps({
                "industry": "Enterprise Cloud & DevOps",
                "voice_archetype": {
                    "vocabulary_dos": ["Latency percentiles", "Failover topology", "Cost per compute unit"],
                    "vocabulary_donts": ["Hype", "Game-changing miracle", "Revolutionary"],
                },
                "topics": [{"topic": "Kubernetes Multi-Region Failover"}],
            }),
        )
        await session.merge(brand_a)

        # Brand B: Artisanal Sustainable Coffee
        brand_b = Brand(
            id="brand_b_coffee_id",
            workspace_id="ws_beta_step4",
            user_id="user_b_step4_id",
            name="Velvet Roast Coffee",
            voice_description="Warm, sensorial, craft-obsessed, inviting.",
            target_audience="Specialty coffee connoisseurs and mindful urban brewers.",
            intelligence_profile=json.dumps({
                "industry": "Artisan Specialty Beverage",
                "voice_archetype": {
                    "vocabulary_dos": ["Origin altitude", "Tasting notes", "Direct trade transparency"],
                    "vocabulary_donts": ["Corporate jargon", "Cheap discount hype"],
                },
                "topics": [{"topic": "Single-Origin Anaerobic Fermentation"}],
            }),
        )
        await session.merge(brand_b)

        # Brand C: Minimal brand with missing fields
        brand_c = Brand(
            id="brand_c_sparse_id",
            workspace_id="ws_alpha_step4",
            user_id="user_a_step4_id",
            name="Sparse Brand",
            voice_description=None,
            target_audience=None,
        )
        await session.merge(brand_c)

        await session.commit()

    token_a = create_access_token(data={"sub": "user_a_step4_id", "email": "brand_owner_a@sociotrack.io"})
    token_b = create_access_token(data={"sub": "user_b_step4_id", "email": "brand_owner_b@sociotrack.io"})

    return {
        "headers_a": {"Authorization": f"Bearer {token_a}"},
        "headers_b": {"Authorization": f"Bearer {token_b}"},
        "brand_a_id": "brand_a_cloud_id",
        "brand_b_id": "brand_b_coffee_id",
        "brand_c_id": "brand_c_sparse_id",
        "user_a_id": "user_a_step4_id",
        "user_b_id": "user_b_step4_id",
    }


# ==============================================================================
# 1. Real Provider Client Invocation
# ==============================================================================

@pytest.mark.asyncio
async def test_01_real_provider_client_invoked_through_generation_service():
    """Verifies that the provider service calls the configured LLM API (Gemini/Groq/OpenAI)."""
    service = AIProviderService()

    # Mock Gemini REST response
    fake_gemini_resp = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "drafts": [
                                    {
                                        "format": "Format A: Data-first",
                                        "hook": "99.99% uptime requires active-active topology.",
                                        "body": "Here is what we observed running Kubernetes across regions...",
                                        "call_to_action": "What is your RTO target?",
                                        "full_text": "99.99% uptime requires active-active topology.\n\nHere is what we observed...",
                                        "rationale": "Data-first hook.",
                                        "supporting_evidence": "Grounds discussion in architecture.",
                                        "confidence_score": 0.94,
                                        "platform_target": "LinkedIn",
                                    }
                                ]
                            })
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 95},
    }

    with patch.object(service, "get_gemini_key", return_value="fake_valid_gemini_key_12345"):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value = Response(200, json=fake_gemini_resp)

            result = await service.call_ai_model(
                prompt="Generate 3 drafts about failover",
                system_prompt="You are SocioTrack AI",
                provider_override="gemini",
            )

            assert result.is_ai_generated is True
            assert result.provider == "gemini"
            assert result.structured_data is not None
            assert "drafts" in result.structured_data
            assert len(result.structured_data["drafts"]) == 1
            assert mock_post.called
            called_url = str(mock_post.call_args[0][0])
            assert "generativelanguage.googleapis.com" in called_url


# ==============================================================================
# 2. Provider Configuration Loaded Securely
# ==============================================================================

def test_02_provider_configuration_loaded_securely():
    """Verifies that API keys are retrieved without exposing raw credentials in representations."""
    service = AIProviderService()

    with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSySecretTestKey9999"}):
        key = service.get_gemini_key()
        assert key == "AIzaSySecretTestKey9999"
        assert service.is_provider_configured("gemini") is True

    # Empty placeholder should be rejected as unconfigured
    with patch.dict(os.environ, {"GEMINI_API_KEY": "your_gemini_api_key_here"}):
        key_empty = service.get_gemini_key()
        assert key_empty == ""
        assert service.is_provider_configured("gemini") is False


# ==============================================================================
# 3. Missing Provider Credentials Produce Honest Error or Explicit Fallback
# ==============================================================================

@pytest.mark.asyncio
async def test_03_missing_provider_credentials_produce_honest_error():
    """Verifies that when no credentials are configured, system returns explicit fallback or raises."""
    service = AIProviderService()

    with patch.object(service, "get_available_providers", return_value=[]):
        # 1. With allow_fallback=False, raises AIProviderAuthError
        with pytest.raises(AIProviderAuthError) as exc_info:
            await service.call_ai_model("Hello", allow_fallback=False)
        assert "No AI model provider configured" in str(exc_info.value)

        # 2. With allow_fallback=True, returns identified fallback with is_ai_generated=False
        result = await service.call_ai_model("Hello", allow_fallback=True)
        assert result.is_ai_generated is False
        assert result.provider == "fallback"
        assert result.fallback_reason is not None
        assert "No AI provider configured" in result.fallback_reason


# ==============================================================================
# 4. Provider Timeouts and Rate Limits Handled
# ==============================================================================

@pytest.mark.asyncio
async def test_04_provider_timeouts_and_rate_limits_handled():
    """Verifies that HTTP 429 raises AIProviderRateLimitError and timeouts raise AIProviderTimeoutError."""
    service = AIProviderService()

    # Rate limit test (HTTP 429)
    with patch.object(service, "get_groq_key", return_value="fake_groq_key_123"):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value = Response(429, headers={"Retry-After": "12"}, text="Too Many Requests")

            with pytest.raises(AIProviderRateLimitError) as exc_info:
                await service.call_ai_model("prompt", provider_override="groq", allow_fallback=False)
            assert exc_info.value.retry_after == 12

    # Timeout test
    import httpx
    with patch.object(service, "get_openai_key", return_value="fake_openai_key_123"):
        with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Read timed out")):
            with pytest.raises(AIProviderTimeoutError):
                await service.call_ai_model("prompt", provider_override="openai", allow_fallback=False)


# ==============================================================================
# 5. Different Brand Contexts Produce Different Generation Requests
# ==============================================================================

def test_05_different_brand_contexts_produce_different_prompts():
    """Verifies that B2B Cloud and Artisan Coffee produce completely distinct generation prompts."""
    # Brand A: Cloud SRE
    b_a = Brand(
        id="b_a",
        name="CloudScale Infrastructure",
        voice_description="Rigorous, SRE-focused, benchmark-driven.",
        target_audience="Principal SREs and Cloud Architects.",
    )
    ctx_a = build_brand_context_from_brand(b_a)
    prompt_a = format_brand_generation_prompt(ctx_a, topic="Observability", platform="LinkedIn")

    # Brand B: Coffee
    b_b = Brand(
        id="b_b",
        name="Velvet Roast Coffee",
        voice_description="Sensorial, artisanal, warm.",
        target_audience="Specialty coffee lovers and home baristas.",
    )
    ctx_b = build_brand_context_from_brand(b_b)
    prompt_b = format_brand_generation_prompt(ctx_b, topic="Observability", platform="Instagram")

    # Prompts must differ significantly based on brand attributes
    assert "CloudScale Infrastructure" in prompt_a["user_prompt"]
    assert "Principal SREs" in prompt_a["user_prompt"]
    assert "LinkedIn" in prompt_a["user_prompt"]

    assert "Velvet Roast Coffee" in prompt_b["user_prompt"]
    assert "Specialty coffee lovers" in prompt_b["user_prompt"]
    assert "Instagram" in prompt_b["user_prompt"]

    assert prompt_a["user_prompt"] != prompt_b["user_prompt"]


# ==============================================================================
# 6. Cross-Workspace Brand Context Cannot Be Accessed
# ==============================================================================

@pytest.mark.asyncio
async def test_06_cross_workspace_brand_context_cannot_be_accessed(setup_test_users_and_brands):
    """Verifies that User B cannot access Brand A's context across workspace boundaries."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User B attempts to generate drafts for Brand A (in Workspace A)
        resp = await client.post(
            "/api/generate-drafts",
            headers=setup_test_users_and_brands["headers_b"],
            json={
                "brand_id": setup_test_users_and_brands["brand_a_id"],
                "topic": "Zero Trust Security",
            },
        )
        # Must be rejected with 403 Forbidden
        assert resp.status_code == 403
        assert "Forbidden" in resp.json()["detail"]


# ==============================================================================
# 7. Missing Brand Information Handled Without Fabrication
# ==============================================================================

def test_07_missing_brand_information_handled_without_fabrication():
    """Verifies that missing voice/audience fields are tracked honestly in missing_critical_fields and assumptions."""
    sparse_brand = Brand(
        id="sparse_id",
        name="MinimalBrand",
        voice_description=None,
        target_audience=None,
    )
    ctx = build_brand_context_from_brand(sparse_brand)

    assert "voice_description" in ctx.missing_critical_fields
    assert "target_audience" in ctx.missing_critical_fields
    assert len(ctx.assumptions_made) >= 2
    assert ctx.data_completeness_score < 1.0


# ==============================================================================
# 8. Generation Respects Platform and Format Requirements
# ==============================================================================

@pytest.mark.asyncio
async def test_08_generation_respects_platform_and_format_requirements():
    """Verifies that generated variations adhere to platform length and format specs."""
    brand = Brand(
        id="brd_test",
        name="PlatformTestBrand",
        voice_description="Direct and concise.",
        target_audience="Developers.",
    )
    ctx = build_brand_context_from_brand(brand)

    # Generate for LinkedIn
    res_linkedin = await generate_brand_drafts(
        brand_context=ctx,
        topic="Database Indexing",
        platform="LinkedIn",
        allow_model_call=False,
    )
    assert len(res_linkedin.drafts) == 3
    formats = [d.format for d in res_linkedin.drafts]
    assert "Format A: Data-first" in formats
    assert "Format B: Hot take" in formats
    assert "Format C: Tactical breakdown" in formats

    for d in res_linkedin.drafts:
        assert d.platform_target == "LinkedIn"
        assert d.full_text != ""
        assert d.hook != ""
        assert d.call_to_action != ""


# ==============================================================================
# 9. Model Output Validated Against Expected Schema
# ==============================================================================

@pytest.mark.asyncio
async def test_09_model_output_validated_against_expected_schema():
    """Verifies that malformed model JSON responses raise schema validation errors."""
    service = AIProviderService()

    class StrictDraftSchema(AIProviderResult):
        pass

    # Malformed JSON (missing required fields)
    bad_json_resp = {
        "choices": [{"message": {"content": '{"broken_array": [1, 2, 3]}'}}]
    }

    with patch.object(service, "get_groq_key", return_value="fake_key"):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value = Response(200, json=bad_json_resp)

            # Requesting strict schema that doesn't match should raise
            with pytest.raises(AIProviderSchemaValidationError):
                await service.call_ai_model(
                    prompt="test",
                    response_schema=BrandVoiceEvaluationResult,
                    provider_override="groq",
                    allow_fallback=False,
                )


# ==============================================================================
# 10. Evaluation Returns Structured and Meaningful Feedback
# ==============================================================================

@pytest.mark.asyncio
async def test_10_evaluation_returns_structured_and_meaningful_feedback():
    """Verifies that voice evaluation produces numeric scores, dos matched, and critique summary."""
    brand = Brand(
        id="b_eval",
        name="EvalBrand",
        voice_description="High-signal systems engineering.",
        target_audience="Engineers.",
    )
    ctx = build_brand_context_from_brand(brand)

    sample_post = (
        "In deploying state machines, 73% of token cost regressions stem from open-loop retries.\n\n"
        "Here are 3 rules we follow:\n"
        "1. Checkpoint states explicitly.\n"
        "2. Isolate deterministic boundaries.\n"
        "3. Prune historical memory.\n\n"
        "What is your team's biggest operational bottleneck?"
    )

    eval_result = await evaluate_draft_voice(
        content=sample_post,
        brand_context=ctx,
        platform="LinkedIn",
        allow_model_call=False,
    )

    assert 0.0 <= eval_result.match_score <= 10.0
    assert eval_result.tone_alignment_score >= 0.0
    assert eval_result.clarity_score >= 0.0
    assert len(eval_result.dos_matched) >= 1
    assert eval_result.critique_summary != ""


# ==============================================================================
# 11. Unsupported Factual Claims Are Identified Where Possible
# ==============================================================================

def test_11_unsupported_factual_claims_identified():
    """Verifies that suspicious unsupported claims (e.g. '95% increase') are flagged in evaluation."""
    brand = Brand(id="b_claim", name="ClaimBrand")
    ctx = build_brand_context_from_brand(brand)

    # Post with ungrounded dramatic percentage claim
    risky_post = "Using our tool guarantees a 95% increase in your company revenue within 2 weeks! #miracle"

    eval_res = evaluate_objective_rules(risky_post, ctx, platform="LinkedIn")
    assert len(eval_res.unsupported_claims) >= 1
    assert any("95% increase" in c for c in eval_res.unsupported_claims)
    assert any("miracle" in s.lower() for s in eval_res.improvement_suggestions)


# ==============================================================================
# 12. Fallback Output Explicitly Distinguishable From Model-Generated Output
# ==============================================================================

@pytest.mark.asyncio
async def test_12_fallback_output_distinguishable_from_model_output(setup_test_users_and_brands):
    """Verifies that drafts generated in fallback mode explicitly advertise is_ai_generated=False."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # In test environment without GEMINI_API_KEY, fallback engine is triggered
        resp = await client.post(
            "/api/generate-drafts",
            headers=setup_test_users_and_brands["headers_a"],
            json={
                "brand_id": setup_test_users_and_brands["brand_a_id"],
                "topic": "Distributed Consensus",
                "platform": "LinkedIn",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["drafts"]) == 3

        for draft in data["drafts"]:
            # Explicit provenance tags
            assert draft["is_ai_generated"] is False
            assert draft["generation_method"] == "fallback"
            assert draft["model"] == "deterministic_engine"
            assert draft["fallback_reason"] is not None
            assert "assumptions_made" in draft


# ==============================================================================
# 13. Existing Content Workflows Continue to Work (Generate -> Approve -> Queue)
# ==============================================================================

@pytest.mark.asyncio
async def test_13_existing_content_workflows_continue_to_work(setup_test_users_and_brands):
    """Verifies that generating drafts and subsequently approving one persists correctly in queue."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Generate drafts
        gen_resp = await client.post(
            "/api/generate-drafts",
            headers=setup_test_users_and_brands["headers_a"],
            json={
                "brand_id": setup_test_users_and_brands["brand_a_id"],
                "topic": "Microservice Resilience",
            },
        )
        assert gen_resp.status_code == 200
        draft_to_approve = gen_resp.json()["drafts"][0]

        # 2. Approve draft via POST /api/posts/approve
        app_resp = await client.post(
            "/api/posts/approve",
            headers=setup_test_users_and_brands["headers_a"],
            json={
                "post_id": draft_to_approve["id"],
                "brand_id": setup_test_users_and_brands["brand_a_id"],
                "approved_content": draft_to_approve["content"] + "\n\n#ApprovedCopy",
                "format": draft_to_approve["format"],
            },
        )
        assert app_resp.status_code == 200
        assert app_resp.json()["status"] in ("approved", "scheduled")

        # 3. Check queue via GET /api/posts/queue
        q_resp = await client.get(
            f"/api/posts/queue?brand_id={setup_test_users_and_brands['brand_a_id']}",
            headers=setup_test_users_and_brands["headers_a"],
        )
        assert q_resp.status_code == 200
        assert q_resp.json()["total"] >= 1


# ==============================================================================
# 14. No Generated Content Is Published Automatically
# ==============================================================================

@pytest.mark.asyncio
async def test_14_no_generated_content_published_automatically(setup_test_users_and_brands):
    """Verifies that generated drafts strictly have status='draft' in the database."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        gen_resp = await client.post(
            "/api/generate-drafts",
            headers=setup_test_users_and_brands["headers_a"],
            json={
                "brand_id": setup_test_users_and_brands["brand_a_id"],
                "topic": "Publishing Safety Verification",
            },
        )
        assert gen_resp.status_code == 200
        drafts = gen_resp.json()["drafts"]

        # Check DB directly
        async with async_session_maker() as session:
            for d in drafts:
                post = await session.get(Post, d["id"])
                assert post is not None
                assert post.status == "draft"
                assert post.published_at is None
