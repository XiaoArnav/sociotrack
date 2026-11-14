"""
Automated Tests for Controlled Content Experiments & Intelligent Calendar Planner.
Verifies sample size enforcement, responsible winner determination, schedule gap detection,
and explicit approval requirements for scheduled posts.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with async_session_maker() as session:
        test_brand_id = "test-exp-calendar-id"
        b_res = await session.get(Brand, test_brand_id)
        if not b_res:
            test_brand = Brand(
                id=test_brand_id,
                name="SocioTrack Experiments Test",
                voice_description="Direct, analytical, engineering-first",
            )
            session.add(test_brand)
            await session.commit()


@pytest.mark.asyncio
async def test_experiment_insufficient_data_guardrail(auth_headers):
    """Verifies that experiments do NOT declare a winner when sample size threshold is unmet."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Experiment with min_sample_size = 1000
        create_resp = await client.post(
            "/api/experiments",
            headers=auth_headers,
            json={
                "brand_id": "test-exp-calendar-id",
                "title": "Quantitative Benchmark vs Contrarian Opener",
                "experiment_type": "hook",
                "variant_a_label": "Variant A: Benchmarks",
                "variant_a_content": "We tracked 4,200 production agent runs across 18 enterprise clusters.",
                "variant_b_label": "Variant B: Contrarian",
                "variant_b_content": "Hot take: 90% of teams building agent swarms don't need autonomous loops.",
                "observation_days": 7,
                "min_sample_size": 1000,
            },
        )
        assert create_resp.status_code == 201
        exp_id = create_resp.json()["id"]

        # 2. Record low sample results (only 150 impressions total < 1000)
        res_resp = await client.post(
            f"/api/experiments/{exp_id}/record-result",
            headers=auth_headers,
            json={
                "variant_a_impressions": 80,
                "variant_a_engagement_rate": 14.5,
                "variant_b_impressions": 70,
                "variant_b_engagement_rate": 8.2,
            },
        )
        assert res_resp.status_code == 200
        result = res_resp.json()

        # Strict invariant: MUST NOT declare winner on insufficient data
        assert result["status"] == "insufficient_data"
        assert result["winner_variant"] is None
        assert "insufficient sample size" in result["conclusion_notes"].lower()


@pytest.mark.asyncio
async def test_experiment_statistically_sound_winner(auth_headers):
    """Verifies that a winner is declared only after meeting min_sample_size with clear delta."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_resp = await client.post(
            "/api/experiments",
            headers=auth_headers,
            json={
                "brand_id": "test-exp-calendar-id",
                "title": "Carousel vs Single Observation Format",
                "experiment_type": "format",
                "variant_a_label": "Variant A: Carousel Breakdown",
                "variant_a_content": "Slide 1: Architecture breakdown of vector caching...",
                "variant_b_label": "Variant B: Single Observation",
                "variant_b_content": "Vector cache hit rates exceed 94% when keys are normalized.",
                "min_sample_size": 500,
            },
        )
        exp_id = create_resp.json()["id"]

        # Record statistically valid sample (650 impressions > 500 threshold)
        res_resp = await client.post(
            f"/api/experiments/{exp_id}/record-result",
            headers=auth_headers,
            json={
                "variant_a_impressions": 350,
                "variant_a_engagement_rate": 12.8,
                "variant_b_impressions": 300,
                "variant_b_engagement_rate": 6.4,
            },
        )
        assert res_resp.status_code == 200
        result = res_resp.json()

        assert result["status"] == "completed"
        assert result["winner_variant"] == "Variant A: Carousel Breakdown"
        assert result["confidence_score"] >= 0.90
        assert "statistically significant" in result["conclusion_notes"].lower()


@pytest.mark.asyncio
async def test_calendar_recommendations_and_human_approval(auth_headers):
    """Verifies intelligent 7-day mix planner and explicit human approval flow."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch calendar recommendations
        cal_resp = await client.get("/api/calendar/recommendations?brand_id=test-exp-calendar-id", headers=auth_headers)
        assert cal_resp.status_code == 200
        plan = cal_resp.json()

        assert plan["schedule_gaps_detected"] > 0
        assert len(plan["slots"]) > 0
        assert sum(plan["recommended_mix"].values()) == pytest.approx(100.0)

        for slot in plan["slots"]:
            assert slot["requires_approval"] is True
            assert slot["is_approved"] is False
            assert slot["recommended_utc_hour"] in [14, 16, 17]

        # 2. Approve a slot
        slot_to_approve = plan["slots"][0]
        app_resp = await client.post(
            f"/api/calendar/approve-slot?brand_id=test-exp-calendar-id",
            headers=auth_headers,
            json={
                "slot_id": slot_to_approve["id"],
                "approved_topic": slot_to_approve["suggested_topic"],
            },
        )
        assert app_resp.status_code == 201
        assert app_resp.json()["status"] == "success"
