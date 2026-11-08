"""
Unit and integration tests for Advanced Social Intelligence:
Competitor Benchmarking, Verified Audience Patterns, and Natural Language Brand Exploration ("Ask SocioTrack").
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, async_session_maker
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.analytics import PostAnalytics
from app.models.memory import AgentMemory
from app.routers.auth import hash_password, create_access_token


@pytest_asyncio.fixture(autouse=True)
async def setup_test_intelligence_data():
    await init_db()
    async with async_session_maker() as session:
        from sqlalchemy import delete
        await session.execute(delete(PostAnalytics).where(PostAnalytics.post_id.in_(["intel-post-1", "intel-post-2"])))
        await session.commit()

        # Create test user
        user = User(
            id="test-intel-user-1",
            email="intelligence@sociotrack.io",
            hashed_password=hash_password("Password123!"),
            name="Diana Intelligence",
            role="Analytics Lead",
        )
        await session.merge(user)

        # Create test brand
        brand = Brand(
            id="brand-intel-1",
            name="TechScale SaaS",
            voice_description="Direct, engineering-led, concise",
            user_id="test-intel-user-1",
        )
        await session.merge(brand)

        # Create sample published posts with analytics
        p1 = Post(
            id="intel-post-1",
            brand_id="brand-intel-1",
            format="REELS",
            topic="Python Optimization",
            content="Stop using nested loops in Python. Here are 3 vector alternatives. #algorithms #python",
            status="published",
        )
        a1 = PostAnalytics(
            id="intel-analytics-1",
            post_id="intel-post-1",
            likes=420,
            replies=85,
            shares=140,
            impressions=5000,
            engagement_score=17.1,
        )

        p2 = Post(
            id="intel-post-2",
            brand_id="brand-intel-1",
            format="CAROUSEL",
            topic="System Design",
            content="System design breakdown: How Kafka handles partition failover. #systemdesign",
            status="published",
        )
        a2 = PostAnalytics(
            id="intel-analytics-2",
            post_id="intel-post-2",
            likes=310,
            replies=45,
            shares=95,
            impressions=4200,
            engagement_score=15.0,
        )

        # Vector memory
        mem = AgentMemory(
            id="intel-mem-1",
            brand_id="brand-intel-1",
            category="hook_rule",
            insight_text="Do not post generic Monday motivation quotes; engagement drops below 2.5%",
            confidence_score=0.95,
        )

        await session.merge(p1)
        await session.merge(a1)
        await session.merge(p2)
        await session.merge(a2)
        await session.merge(mem)
        await session.commit()


@pytest.mark.asyncio
async def test_01_competitor_tracking_and_format_gap_analysis():
    token = create_access_token({"sub": "test-intel-user-1", "email": "intelligence@sociotrack.io"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Add competitor
        res = await client.post(
            "/api/intelligence/competitors",
            json={
                "brand_id": "brand-intel-1",
                "handle": "@dev_competitor",
                "display_name": "Dev Competitor Inc",
                "follower_count": 45000,
                "post_count": 320,
                "estimated_engagement_rate": 3.8,
                "top_formats": {"reels": 0.40, "carousels": 0.50, "images": 0.10},
                "recent_topics": ["docker", "kubernetes", "cloud"],
            },
            headers=headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["handle"] == "@dev_competitor"
        assert data["provenance_type"] == "public_benchmark"
        assert "Public profile benchmark only" in data["disclaimer"]

        # 2. List competitors and verify gap analysis
        list_res = await client.get("/api/intelligence/competitors?brand_id=brand-intel-1", headers=headers)
        assert list_res.status_code == 200
        comp_data = list_res.json()
        assert len(comp_data["competitors"]) == 1
        comp = comp_data["competitors"][0]
        assert comp["handle"] == "@dev_competitor"
        gap = comp["format_gap_analysis"]
        assert "strategic_delta" in gap


@pytest.mark.asyncio
async def test_02_verified_audience_pattern_storage():
    token = create_access_token({"sub": "test-intel-user-1", "email": "intelligence@sociotrack.io"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/intelligence/audience-patterns",
            json={
                "brand_id": "brand-intel-1",
                "category": "Architecture Deep Dives",
                "peak_hours": [14, 16, 19],
                "top_format": "CAROUSEL",
                "avg_dwell_seconds": 24.5,
                "viral_share_ratio": 3.1,
                "retention_index": 1.25,
                "confidence_score": 0.94,
            },
            headers=headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["category"] == "Architecture Deep Dives"
        assert data["peak_hours"] == [14, 16, 19]

        # Fetch patterns
        fetch_res = await client.get("/api/intelligence/audience-patterns?brand_id=brand-intel-1", headers=headers)
        assert fetch_res.status_code == 200
        patterns = fetch_res.json()["patterns"]
        assert len(patterns) >= 1
        assert patterns[0]["top_format"] == "CAROUSEL"


@pytest.mark.asyncio
async def test_03_natural_language_topics_query():
    token = create_access_token({"sub": "test-intel-user-1", "email": "intelligence@sociotrack.io"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/intelligence/explore",
            json={
                "brand_id": "brand-intel-1",
                "query": "Which content topics performed best this month?",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "topics_performance"
        assert "TechScale SaaS" in data["answer"]
        assert len(data["supporting_records"]) >= 1
        assert data["confidence_score"] > 0.0
        assert "data_provenance" in data


@pytest.mark.asyncio
async def test_04_natural_language_lessons_learned_query():
    token = create_access_token({"sub": "test-intel-user-1", "email": "intelligence@sociotrack.io"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/intelligence/explore",
            json={
                "brand_id": "brand-intel-1",
                "query": "What lessons has the AI learned from our previous content?",
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "lessons_learned"
        assert "Avoidance Rule" in data["answer"] or "persistent vector memory" in data["answer"]
        assert len(data["supporting_records"]) >= 1


@pytest.mark.asyncio
async def test_05_strategic_recommendations_synthesis():
    token = create_access_token({"sub": "test-intel-user-1", "email": "intelligence@sociotrack.io"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/intelligence/strategic-recommendations?brand_id=brand-intel-1", headers=headers)
        assert res.status_code == 200
        data = res.json()
        recs = data["recommendations"]
        assert len(recs) >= 2
        assert any(r["type"] == "format_allocation" for r in recs)
        assert any("evidence_sources" in r for r in recs)
