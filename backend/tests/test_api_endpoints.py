"""
Integration tests for the 5 required SocioTrack REST API endpoints.
Tests against FastAPI test client using httpx.AsyncClient.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db
from db.seed import run_seed


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    await run_seed()


@pytest.mark.asyncio
async def test_endpoint_1_generate_drafts():
    brand_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/generate-drafts",
            json={
                "brand_id": brand_id,
                "topic": "Deterministic Agent Seams",
            },
        )
        assert res.status_code in (200, 201)
        data = res.json()
        assert data["brand_id"] == brand_id
        assert data["topic"] == "Deterministic Agent Seams"
        assert len(data["drafts"]) >= 3
        first_draft = data["drafts"][0]
        assert first_draft["status"] == "draft"
        assert len(first_draft["content"]) > 20
        assert "memory_context_applied" in first_draft


@pytest.mark.asyncio
async def test_endpoint_2_approve_post():
    post_id = "f6a7b89c-0d1e-2f3a-4b5c-6d7e8f901234"
    scheduled_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    approved_text = "Approved copy: Verified deterministic agent state with external memory engine."

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/posts/approve",
            json={
                "post_id": post_id,
                "approved_content": approved_text,
                "scheduled_time": scheduled_time,
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == post_id
        assert data["status"] == "scheduled"
        assert data["content"] == approved_text


@pytest.mark.asyncio
async def test_endpoint_3_posts_queue():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/posts/queue")
        assert res.status_code == 200
        data = res.json()
        assert "queue" in data
        assert "total" in data
        assert data["total"] >= 1
        # Check all items in queue are scheduled or pending_approval
        for item in data["queue"]:
            assert item["status"] in ("scheduled", "pending_approval")


@pytest.mark.asyncio
async def test_endpoint_4_feed_metrics_and_memory_feedback():
    post_id = "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9012"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/simulator/feed-metrics",
            json={
                "post_id": post_id,
                "impressions": 15000,
                "likes": 650,
                "replies": 120,
                "shares": 95,
            },
        )
        assert res.status_code in (200, 201)
        data = res.json()
        assert data["post_id"] == post_id
        assert data["impressions"] == 15000
        # engagements = 650*1 + 120*2.5 + 95*3.5 = 650 + 300 + 332.5 = 1282.5
        # score = (1282.5 / 15000) * 100 = 8.55
        assert data["engagement_score"] == 8.55
        assert data["feedback_insight"] is not None
        assert data["feedback_insight"]["category"] == "hook_rule"
        assert data["feedback_insight"]["confidence_score"] >= 0.85


@pytest.mark.asyncio
async def test_endpoint_5_memory_insights():
    brand_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/memory/insights?brand_id={brand_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["brand_id"] == brand_id
        assert data["total_insights"] >= 4
        assert len(data["insights"]) == data["total_insights"]
        categories = {i["category"] for i in data["insights"]}
        assert "hook_rule" in categories


@pytest.mark.asyncio
async def test_endpoint_error_handling_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid brand in generate-drafts
        res1 = await client.post(
            "/api/generate-drafts",
            json={"brand_id": "non-existent-uuid", "topic": "Testing"},
        )
        assert res1.status_code == 404

        # Invalid post in approve
        res2 = await client.post(
            "/api/posts/approve",
            json={
                "post_id": "non-existent-uuid",
                "approved_content": "test",
                "scheduled_time": datetime.now(timezone.utc).isoformat(),
            },
        )
        assert res2.status_code == 404

        # Invalid post in feed-metrics
        res3 = await client.post(
            "/api/simulator/feed-metrics",
            json={
                "post_id": "non-existent-uuid",
                "impressions": 100,
                "likes": 5,
                "replies": 1,
                "shares": 0,
            },
        )
        assert res3.status_code == 404
