import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_creator_unfollowers_report():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/creators/arnav.patel07/unfollowers")
        assert res.status_code == 200
        data = res.json()
        assert data["handle"] == "arnav.patel07"
        assert "retention_rate" in data
        assert "health_grade" in data
        assert "recent_events" in data
        assert isinstance(data["recent_events"], list)
        assert len(data["recent_events"]) > 0
        assert "recommendations" in data


@pytest.mark.asyncio
async def test_create_creator_snapshot():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/creators/arnav.patel07/snapshot")
        assert res.status_code == 200
        data = res.json()
        assert data["handle"] == "arnav.patel07"
        assert "followers_count" in data
        assert "net_delta" in data
        assert "unfollowers" in data


@pytest.mark.asyncio
async def test_get_creator_feed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/creators/arnav.patel07/feed?max_posts=6")
        assert res.status_code == 200
        data = res.json()
        assert data["handle"] == "arnav.patel07"
        assert "posts" in data
        assert len(data["posts"]) > 0
        p = data["posts"][0]
        assert "post_id" in p
        assert "media_type" in p
        assert "engagement_rate" in p
        assert "winning_factor" in p


@pytest.mark.asyncio
async def test_trigger_snapshot_cron():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/creators/cron/poll")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["snapshots_recorded"] > 0
