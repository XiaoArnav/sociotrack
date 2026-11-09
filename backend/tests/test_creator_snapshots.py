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
async def test_create_creator_snapshot(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/creators/arnav.patel07/snapshot", headers=auth_headers)
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
async def test_trigger_snapshot_cron(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/creators/cron/poll", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["snapshots_recorded"] > 0


@pytest.mark.asyncio
async def test_snapshot_endpoints_resilience_when_crawler_returns_none(auth_headers):
    from unittest.mock import patch
    transport = ASGITransport(app=app)
    with patch("app.routers.avatars.scrape_live_instagram_profile", return_value=None), \
         patch("app.services.snapshot_service.scrape_live_instagram_profile", return_value=None):
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res_unf = await ac.get("/api/creators/resilience_user/unfollowers")
            assert res_unf.status_code == 200
            assert res_unf.json()["handle"] == "resilience_user"

            res_snap = await ac.post("/api/creators/resilience_user/snapshot", headers=auth_headers)
            assert res_snap.status_code == 200
            assert res_snap.json()["handle"] == "resilience_user"

            res_cron = await ac.post("/api/creators/cron/poll", headers=auth_headers)
            assert res_cron.status_code == 200
            assert res_cron.json()["snapshots_recorded"] > 0
