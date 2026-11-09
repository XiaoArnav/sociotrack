"""
Automated Tests for Intelligent Content Generation & Explainable Intelligence Pipeline.
Verifies LangGraph StateGraph creative variations, anti-repetition guardrails,
explainability schema compliance, and brand voice evaluation.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand
from app.core.agent import (
    AgentGraphState,
    draft_post_variations_node,
    evaluate_brand_voice_node,
    build_social_agent_graph,
)
from app.schemas.post_schema import BrandVoiceGuidelinesSchema, PostFormat


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with async_session_maker() as session:
        test_brand_id = "test-gen-explain-id"
        b_res = await session.get(Brand, test_brand_id)
        if not b_res:
            test_brand = Brand(
                id=test_brand_id,
                name="SocioTrack Generation Test",
                voice_description="Direct, analytical, engineering-first",
            )
            session.add(test_brand)
            await session.commit()


def test_draft_variations_and_explainability():
    """Verifies that all generated variations include structured explainability attributes."""
    state = AgentGraphState(
        brand_name="SocioTrack Generation Test",
        topic="Vector Indexing & ChromaDB Pruning",
        memory_context={
            "audience_sentiment": {
                "sentiment_label": "analytical",
                "summary": "Audiences prioritize latency benchmarks over high-level claims.",
            },
            "historical_lessons": [
                "Benchmark numbers in opening hook increase bookmark velocity by 3.2x.",
                "Numbered architectural breakdowns drive higher saves.",
            ],
            "recent_hooks": [
                "We analyzed 4,200 production runs across 18 teams deploying Vector Indexing & ChromaDB Pruning.",
            ],
        },
    )

    result = draft_post_variations_node(state)
    drafts = result["drafts"]
    assert len(drafts) == 3

    # Format A (Data-First) should have detected the repeated hook and mutated it
    draft_a = drafts[0]
    assert draft_a.format == PostFormat.DATA_FIRST
    assert "telemetry audit" in draft_a.hook.lower() or "production runs" not in draft_a.hook.lower()
    assert draft_a.recommendation_rationale is not None
    assert draft_a.supporting_evidence is not None
    assert draft_a.confidence_score >= 0.85
    assert draft_a.known_limitations is not None
    assert draft_a.anti_repetition_passed is True

    # Format B (Hot Take)
    draft_b = drafts[1]
    assert draft_b.format == PostFormat.HOT_TAKE
    assert draft_b.recommendation_rationale is not None

    # Format C (Tactical Breakdown)
    draft_c = drafts[2]
    assert draft_c.format == PostFormat.TACTICAL_BREAKDOWN
    assert "1." in draft_c.body
    assert draft_c.platform_target is not None


def test_brand_voice_evaluation_contract():
    """Verifies evaluation node calculates score, dos matched, and donts avoided."""
    state = AgentGraphState(
        brand_name="SocioTrack Generation Test",
        topic="LangGraph Checkpoint Latency",
        brand_guidelines=BrandVoiceGuidelinesSchema(),
    )
    # Generate drafts
    draft_res = draft_post_variations_node(state)
    state.drafts = draft_res["drafts"]

    # Evaluate
    eval_res = evaluate_brand_voice_node(state)
    selected = eval_res["selected_post"]
    assert selected is not None
    assert selected.match_score >= 7.0
    assert len(selected.dos_matched) >= 1
    assert len(selected.donts_avoided) >= 1
    assert selected.draft.id in [d.id for d in state.drafts]


@pytest.mark.asyncio
async def test_api_generate_drafts_explainability(auth_headers):
    """Verifies POST /api/generate-drafts returns full explainability metadata for every draft."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/generate-drafts",
            headers=auth_headers,
            json={
                "brand_id": "test-gen-explain-id",
                "topic": "Deterministic Agent Architectures",
            },
        )
        assert resp.status_code == 200
        data = resp.json()

        assert "drafts" in data
        assert len(data["drafts"]) >= 3

        for draft in data["drafts"]:
            assert "recommendation_rationale" in draft
            assert "supporting_evidence" in draft
            assert "confidence_score" in draft
            assert "known_limitations" in draft
            assert "platform_target" in draft
            assert draft["confidence_score"] > 0.0

        assert "selected_post" in data
        assert data["selected_post"]["match_score"] > 0.0
