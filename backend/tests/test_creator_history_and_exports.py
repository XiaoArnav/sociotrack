import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.snapshot_service import record_snapshot, get_creator_history
from app.database import async_session_maker
from app.models.analytics import FollowerSnapshot
from sqlalchemy import select, delete


@pytest.mark.asyncio
async def test_first_observation_has_no_artificial_delta():
    test_handle = "test_creator_fresh_baseline"
    # Clean up test rows
    async with async_session_maker() as db:
        await db.execute(delete(FollowerSnapshot).where(FollowerSnapshot.handle == test_handle))
        await db.commit()

    snap = await record_snapshot(
        handle=test_handle,
        followers=12500,
        following=450,
        media_count=85,
        source="meta_opengraph_verified",
        engagement_rate=4.25,
    )

    # First observation should have NO artificial delta (net_delta is None / null)
    assert snap["handle"] == test_handle
    assert snap["followers_count"] == 12500
    assert snap["net_delta"] is None
    assert snap["unfollowers"] == 0
    assert snap["new_followers"] == 0
    assert snap["source"] == "meta_opengraph_verified"


@pytest.mark.asyncio
async def test_deduplication_prevents_duplicate_rows_on_retry():
    test_handle = "test_creator_dedup"
    async with async_session_maker() as db:
        await db.execute(delete(FollowerSnapshot).where(FollowerSnapshot.handle == test_handle))
        await db.commit()

    snap1 = await record_snapshot(
        handle=test_handle,
        followers=3500,
        following=120,
        media_count=45,
        source="meta_opengraph_verified",
    )

    # Immediately retry or reuse cached scrape with exact same counts
    snap2 = await record_snapshot(
        handle=test_handle,
        followers=3500,
        following=120,
        media_count=45,
        source="meta_opengraph_verified",
    )

    assert snap1["id"] == snap2["id"], "Cached or retried scrape must return existing snapshot without inserting duplicate"

    # Confirm database only contains 1 record
    async with async_session_maker() as db:
        stmt = select(FollowerSnapshot).where(FollowerSnapshot.handle == test_handle)
        res = await db.execute(stmt)
        all_snaps = res.scalars().all()
        assert len(all_snaps) == 1


@pytest.mark.asyncio
async def test_consecutive_observations_calculate_exact_deltas_and_preserve_zeros():
    test_handle = "test_creator_consecutive_deltas"
    async with async_session_maker() as db:
        await db.execute(delete(FollowerSnapshot).where(FollowerSnapshot.handle == test_handle))
        await db.commit()

    # 1. Baseline observation
    snap1 = await record_snapshot(
        handle=test_handle,
        followers=10000,
        following=200,
        media_count=50,
        source="meta_opengraph_verified",
        engagement_rate=5.0,
    )
    assert snap1["net_delta"] is None

    # Manually backdate snap1 so the next snapshot is outside the dedup window
    async with async_session_maker() as db:
        stmt = select(FollowerSnapshot).where(FollowerSnapshot.id == snap1["id"])
        res = await db.execute(stmt)
        s1 = res.scalars().first()
        s1.recorded_at = datetime.now(timezone.utc) - timedelta(hours=2)
        await db.commit()

    # 2. Second observation: gain of 150 followers, 2 posts, engagement rose 0.20 pp
    snap2 = await record_snapshot(
        handle=test_handle,
        followers=10150,
        following=200,
        media_count=52,
        source="meta_opengraph_verified",
        engagement_rate=5.20,
    )
    assert snap2["net_delta"] == 150
    assert snap2["new_followers"] == 150
    assert snap2["unfollowers"] == 0

    # Backdate snap2
    async with async_session_maker() as db:
        stmt = select(FollowerSnapshot).where(FollowerSnapshot.id == snap2["id"])
        res = await db.execute(stmt)
        s2 = res.scalars().first()
        s2.recorded_at = datetime.now(timezone.utc) - timedelta(hours=1)
        await db.commit()

    # 3. Third observation: loss of 30 followers (unfollowers), 0 posts change
    snap3 = await record_snapshot(
        handle=test_handle,
        followers=10120,
        following=201,
        media_count=52,
        source="meta_opengraph_verified",
        engagement_rate=5.10,
    )
    assert snap3["net_delta"] == -30
    assert snap3["unfollowers"] == 30
    assert snap3["new_followers"] == 0

    # Backdate snap3
    async with async_session_maker() as db:
        stmt = select(FollowerSnapshot).where(FollowerSnapshot.id == snap3["id"])
        res = await db.execute(stmt)
        s3 = res.scalars().first()
        s3.recorded_at = datetime.now(timezone.utc) - timedelta(minutes=35)
        await db.commit()

    # 4. Fourth observation: real zero delta (followers remained 10120)
    # Changing following to trigger observation
    snap4 = await record_snapshot(
        handle=test_handle,
        followers=10120,
        following=202,
        media_count=52,
        source="meta_opengraph_verified",
        engagement_rate=5.10,
    )
    assert snap4["net_delta"] == 0, "Real zero must be preserved, not defaulted to 1"
    assert snap4["unfollowers"] == 0
    assert snap4["new_followers"] == 0


@pytest.mark.asyncio
async def test_get_creator_history_api_endpoint_and_date_filtering():
    test_handle = "test_creator_history_api"
    async with async_session_maker() as db:
        await db.execute(delete(FollowerSnapshot).where(FollowerSnapshot.handle == test_handle))
        await db.commit()

    # Empty state check
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        empty_res = await ac.get(f"/api/creators/{test_handle}/history")
        assert empty_res.status_code == 200
        empty_data = empty_res.json()
        assert empty_data["handle"] == test_handle
        assert empty_data["count"] == 0
        assert empty_data["history"] == []
        assert empty_data["last_collected_at"] is None

    # Populate 3 snapshots across 3 days
    base_time = datetime.now(timezone.utc)
    async with async_session_maker() as db:
        s1 = FollowerSnapshot(
            handle=test_handle,
            followers_count=2000,
            following_count=100,
            media_count=20,
            net_delta=0,
            source="meta_opengraph_verified",
            recorded_at=base_time - timedelta(days=2),
        )
        s2 = FollowerSnapshot(
            handle=test_handle,
            followers_count=2100,
            following_count=102,
            media_count=21,
            net_delta=100,
            source="meta_opengraph_verified",
            recorded_at=base_time - timedelta(days=1),
        )
        s3 = FollowerSnapshot(
            handle=test_handle,
            followers_count=2150,
            following_count=102,
            media_count=22,
            net_delta=50,
            source="meta_opengraph_verified",
            recorded_at=base_time,
        )
        db.add_all([s1, s2, s3])
        await db.commit()

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/creators/{test_handle}/history")
        assert res.status_code == 200
        data = res.json()
        assert data["handle"] == test_handle
        assert data["count"] == 3
        assert len(data["history"]) == 3

        # History is returned DESC (newest first)
        h0 = data["history"][0]  # newest (s3)
        h1 = data["history"][1]  # middle (s2)
        h2 = data["history"][2]  # oldest (s1)

        assert h0["followers"] == 2150
        assert h0["followers_delta"] == 50
        assert h0["following_delta"] == 0  # real zero
        assert h0["media_delta"] == 1

        assert h1["followers"] == 2100
        assert h1["followers_delta"] == 100
        assert h1["following_delta"] == 2
        assert h1["media_delta"] == 1

        assert h2["followers"] == 2000
        assert h2["followers_delta"] is None, "Earliest observation must have null delta"
        assert h2["following_delta"] is None
        assert h2["media_delta"] is None

        # Test date range filtering: only last 36 hours (s2 and s3)
        start_iso = (base_time - timedelta(hours=36)).isoformat()
        res_filter = await ac.get(f"/api/creators/{test_handle}/history?start_date={start_iso}")
        assert res_filter.status_code == 200
        data_filter = res_filter.json()
        assert data_filter["count"] == 2
        assert data_filter["history"][0]["followers"] == 2150
        assert data_filter["history"][1]["followers"] == 2100
