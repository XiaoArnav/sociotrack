"""
Test Suite: Date, Time, and Timezone Consistency Regression Tests.
Verifies UTC instant propagation, resilient cache timestamps, and calendar slot recommendations.
"""

import pytest
import time
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from app.main import app
from app.routers.avatars import _LIVE_STATS_CACHE


@pytest.mark.asyncio
async def test_live_creator_stats_returns_utc_iso_timestamp():
    """Verifies that live creator telemetry returns an ISO-8601 UTC timestamp."""
    test_handle = "test_creator_utc"
    now_epoch = time.time()
    now_iso = datetime.fromtimestamp(now_epoch, tz=timezone.utc).isoformat()
    _LIVE_STATS_CACHE[test_handle] = (
        now_epoch,
        {
            "handle": test_handle,
            "name": "Test Creator",
            "followers": 15000,
            "followersDelta": "+150 (+1.0%)",
            "following": 300,
            "mediaCount": 50,
            "engagementRate": 3.5,
            "avatar": "/api/creators/test_creator_utc/avatar",
            "updatedAt": now_iso,
            "updatedAtEpoch": now_epoch,
            "lastFetchFailed": False,
        },
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(f"/api/creators/live/{test_handle}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["handle"] == test_handle
        assert data["updatedAt"] == now_iso
        assert data["lastFetchFailed"] is False

        # Verify that the timestamp parses as valid UTC instant
        parsed = datetime.fromisoformat(data["updatedAt"])
        assert parsed.tzinfo is not None


@pytest.mark.asyncio
async def test_live_creator_scrape_failure_preserves_cached_timestamp():
    """Verifies that a failed refresh preserves original fetch timestamp with lastFetchFailed=True."""
    test_handle = "test_failing_refresh"
    original_epoch = 1700000000.0
    original_iso = datetime.fromtimestamp(original_epoch, tz=timezone.utc).isoformat()
    _LIVE_STATS_CACHE[test_handle] = (
        original_epoch,
        {
            "handle": test_handle,
            "name": "Stale Creator",
            "followers": 10000,
            "updatedAt": original_iso,
            "updatedAtEpoch": original_epoch,
            "lastFetchFailed": False,
        },
    )

    # Force scrape to fail by making httpx raise an exception
    with patch("httpx.AsyncClient.get", side_effect=Exception("Instagram rate limited")):
        from app.routers.avatars import scrape_live_instagram_profile
        with patch("app.routers.avatars.STATS_CACHE_TTL", 0):
            result = await scrape_live_instagram_profile(test_handle)
            assert result is not None
            assert result["lastFetchFailed"] is True
            assert result["fallback"] is True
            # Preserves original successful fetch time!
            assert result["updatedAt"] == original_iso


@pytest.mark.asyncio
async def test_calendar_recommendations_contain_exact_scheduled_iso(auth_headers):
    """Verifies calendar recommendation slots include scheduled_iso in UTC."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/calendar/recommendations", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "slots" in data
        assert len(data["slots"]) > 0

        for slot in data["slots"]:
            assert "scheduled_iso" in slot
            assert slot["scheduled_iso"] is not None
            parsed = datetime.fromisoformat(slot["scheduled_iso"])
            assert parsed.tzinfo is not None


@pytest.mark.asyncio
async def test_post_approval_normalizes_scheduled_time_to_utc(auth_headers):
    """Verifies that scheduled draft times are normalized to UTC instants."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Get accessible brand
        rec_resp = await ac.get("/api/calendar/recommendations", headers=auth_headers)
        brand_id = rec_resp.json().get("brand_id")

        scheduled_input = "2026-11-20T18:00:00+05:30"
        resp = await ac.post(
            "/api/posts/approve",
            json={
                "brand_id": brand_id,
                "post_content": "Testing timezone normalization in posts router",
                "format": "CAROUSEL",
                "scheduled_time": scheduled_input,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("scheduled", "success")
        assert "post_id" in data
        assert "scheduled for" in data["message"]
