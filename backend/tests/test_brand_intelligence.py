"""
Automated Tests for Adaptive Brand Intelligence & Memory Feedback Loop.
Tests empirical profile derivation, data sufficiency flagging, insight editing & deactivation,
and automatic user edit capture during post approval.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import uuid

from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.services.brand_intelligence import build_brand_intelligence_profile
from app.core.memory import get_memory_manager


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with async_session_maker() as session:
        # Create a test brand
        test_brand_id = "test-brand-intelligence-id"
        b_res = await session.get(Brand, test_brand_id)
        if not b_res:
            test_brand = Brand(
                id=test_brand_id,
                name="SocioTrack Engine Test",
                voice_description="Direct, analytical, engineering-first",
            )
            session.add(test_brand)
            await session.commit()


@pytest.mark.asyncio
async def test_brand_intelligence_profile_derivation():
    """Verifies empirical calculations and data sufficiency tagging."""
    brand = Brand(
        id=str(uuid.uuid4()),
        name="Empirical Test Brand",
        voice_description="Deterministic, metric-driven",
    )

    # 1. Zero posts -> status should be 'insufficient_data'
    profile_empty = build_brand_intelligence_profile(brand, posts=[], db_memories=[])
    assert profile_empty.data_sufficiency == "insufficient"
    assert profile_empty.total_posts_analyzed == 0
    assert len(profile_empty.topics) > 0
    assert profile_empty.topics[0].status == "insufficient_data"

    # 2. Add sample posts -> status should elevate to 'empirical'
    from app.models.analytics import PostAnalytics

    p1 = Post(
        id=str(uuid.uuid4()),
        brand_id=brand.id,
        topic="Distributed Systems",
        content="Detailed breakdown of distributed lock contention in high-throughput clusters.",
        created_at=datetime.now(timezone.utc),
    )
    p1.analytics = PostAnalytics(
        post_id=p1.id,
        shares=45,
        likes=120,
        replies=15,
        impressions=2000,
        engagement_score=8.5,
    )

    p2 = Post(
        id=str(uuid.uuid4()),
        brand_id=brand.id,
        topic="Distributed Systems",
        content="Contrarian perspective on distributed database replication latency.",
        created_at=datetime.now(timezone.utc),
    )
    p2.analytics = PostAnalytics(
        post_id=p2.id,
        shares=60,
        likes=180,
        replies=25,
        impressions=2500,
        engagement_score=9.2,
    )

    posts = [p1, p2]

    profile_populated = build_brand_intelligence_profile(brand, posts=posts, db_memories=[])
    assert profile_populated.total_posts_analyzed == 2
    assert profile_populated.data_sufficiency == "moderate"

    ds_topic = next(t for t in profile_populated.topics if t.topic == "Distributed Systems")
    assert ds_topic.observed_post_count == 2
    assert ds_topic.status == "empirical"
    assert ds_topic.affinity_score > 8.0


@pytest.mark.asyncio
async def test_memory_insight_crud_and_deactivation(auth_headers):
    """Verifies inspecting, updating, and deactivating learned insights."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a learned insight
        create_resp = await client.post(
            "/api/memory/insights",
            headers=auth_headers,
            json={
                "brand_id": "test-brand-intelligence-id",
                "insight_text": "Avoid introductory pleasantries; technical leads bounce within 2 seconds.",
                "category": "hook_rule",
                "confidence_score": 0.88,
                "supporting_evidence": "Observed 34% drop-off on posts beginning with 'Hey everyone!'",
                "source_event": "telemetry_ingest",
                "is_active": True,
            },
        )
        assert create_resp.status_code == 201
        created_data = create_resp.json()
        insight_id = created_data["id"]
        assert created_data["supporting_evidence"] is not None

        # 2. Update the insight
        update_resp = await client.put(
            f"/api/memory/insights/{insight_id}",
            headers=auth_headers,
            json={
                "insight_text": "Avoid all conversational filler; open directly with architecture diagrams.",
                "confidence_score": 0.95,
            },
        )
        assert update_resp.status_code == 200
        updated_data = update_resp.json()
        assert "architecture diagrams" in updated_data["insight_text"]
        assert updated_data["confidence_score"] == 0.95

        # 3. Deactivate the insight
        del_resp = await client.delete(f"/api/memory/insights/{insight_id}", headers=auth_headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "success"

        # 4. Verify it is excluded from default active list
        list_resp = await client.get("/api/memory/insights?brand_id=test-brand-intelligence-id", headers=auth_headers)
        assert list_resp.status_code == 200
        active_insights = list_resp.json()["insights"]
        assert not any(i["id"] == insight_id for i in active_insights)


@pytest.mark.asyncio
async def test_post_approval_user_edit_feedback_loop(auth_headers):
    """Verifies that user edits on /api/posts/approve automatically record high-confidence preference insights."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        approve_resp = await client.post(
            "/api/posts/approve",
            headers=auth_headers,
            json={
                "brand_id": "test-brand-intelligence-id",
                "post_content": "AI Draft: The top 5 ways to speed up your vector database query times.",
                "approved_content": "Production Benchmark: We cut ChromaDB retrieval latency by 68% using index pruning.",
                "format": "Technical Benchmark",
                "hook_style": "quantitative",
                "approved_by": "lead_engineer",
            },
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "approved"

        # Check that user edit was persisted to memory insights
        mem_resp = await client.get("/api/memory/insights?brand_id=test-brand-intelligence-id", headers=auth_headers)
        assert mem_resp.status_code == 200
        insights = mem_resp.json()["insights"]
        user_edits = [i for i in insights if i.get("source_event") == "user_edit"]
        assert len(user_edits) >= 1
        assert "editorial preference" in user_edits[0]["insight_text"].lower()


@pytest.mark.asyncio
async def test_brand_intelligence_endpoints(auth_headers):
    """Verifies GET /api/brands/{id}/intelligence and POST /api/brands/{id}/refresh-intelligence."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET intelligence
        get_resp = await client.get("/api/brands/test-brand-intelligence-id/intelligence", headers=auth_headers)
        assert get_resp.status_code == 200
        profile = get_resp.json()
        assert profile["brand_id"] == "test-brand-intelligence-id"
        assert "voice_archetype" in profile
        assert "topics" in profile

        # Refresh intelligence
        refresh_resp = await client.post("/api/brands/test-brand-intelligence-id/refresh-intelligence", headers=auth_headers)
        assert refresh_resp.status_code == 200
        refresh_data = refresh_resp.json()
        assert refresh_data["status"] == "success"
        assert refresh_data["brand_id"] == "test-brand-intelligence-id"
