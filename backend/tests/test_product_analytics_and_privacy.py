"""
Tests for Product Usage Analytics, System Health Observability, and User Privacy Rights.
Verifies public seams for:
- POST /api/analytics/product/event
- GET /api/analytics/product/dashboard
- GET /api/system/health
- GET /api/system/metrics
- GET /api/user/export-data
- DELETE /api/user/delete-data
- POST /api/user/consent
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand
from app.models.user import User


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_product_event_ingestion_and_funnel():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Ingest onboarding events
        events = [
            {"event_name": "onboarding_started", "user_id": "usr_test_1", "step_name": "brand_info", "duration_seconds": 12.5},
            {"event_name": "onboarding_step_completed", "user_id": "usr_test_1", "step_name": "brand_info", "duration_seconds": 15.0},
            {"event_name": "onboarding_step_completed", "user_id": "usr_test_1", "step_name": "voice_archetype", "duration_seconds": 25.0},
            {"event_name": "first_insight_generated", "user_id": "usr_test_1", "step_name": "insight", "duration_seconds": 45.0},
            {"event_name": "onboarding_completed", "user_id": "usr_test_1", "step_name": "complete", "duration_seconds": 55.0},
            {"event_name": "recommendation_generated", "user_id": "usr_test_1", "metadata_json": '{"format": "carousel"}'},
            {"event_name": "recommendation_accepted", "user_id": "usr_test_1", "metadata_json": '{"format": "carousel"}'},
            {"event_name": "recommendation_rejected", "user_id": "usr_test_1", "metadata_json": '{"reason": "repetitive"}'},
        ]

        for ev in events:
            res = await client.post("/api/analytics/product/event", json=ev)
            assert res.status_code == 201
            data = res.json()
            assert data["event_name"] == ev["event_name"]
            assert "id" in data

        # 2. Query product analytics dashboard
        res_dash = await client.get("/api/analytics/product/dashboard")
        assert res_dash.status_code == 200
        metrics = res_dash.json()
        assert metrics["total_events"] >= 8
        assert "onboarding_funnel" in metrics
        assert metrics["onboarding_funnel"]["onboarding_started"] >= 1
        assert metrics["onboarding_funnel"]["onboarding_completed"] >= 1
        assert metrics["time_to_first_insight_avg_sec"] > 0
        assert metrics["recommendation_acceptance_rate"] == 0.5


@pytest.mark.asyncio
async def test_system_health_and_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health check
        res_health = await client.get("/api/system/health")
        assert res_health.status_code == 200
        health = res_health.json()
        assert health["status"] in ("healthy", "degraded")
        assert "database" in health
        assert "db_latency_ms" in health
        assert "agent_pipeline" in health
        assert "uptime_seconds" in health

        # Operational metrics
        res_metrics = await client.get("/api/system/metrics")
        assert res_metrics.status_code == 200
        metrics = res_metrics.json()
        assert "total_requests" in metrics
        assert "active_tenants" in metrics


@pytest.mark.asyncio
async def test_user_privacy_export_and_deletion():
    user_id = f"usr_privacy_{uuid.uuid4().hex[:6]}"
    brand_id = f"brd_privacy_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user = User(
            id=user_id,
            email=f"privacy_{uuid.uuid4().hex[:6]}@example.com",
            name=f"Privacy User {uuid.uuid4().hex[:6]}",
            hashed_password="hashed_secret",
            is_active=True
        )
        brand = Brand(
            id=brand_id,
            user_id=user_id,
            name="Privacy Brand",
            voice_description="Discreet and compliant",
            target_audience="Enterprise Social Teams"
        )
        session.add(user)
        session.add(brand)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Update privacy consent
        res_consent = await client.post(
            "/api/user/consent",
            params={"user_id": user_id},
            json={"telemetry_opt_in": True, "ai_training_opt_out": True}
        )
        assert res_consent.status_code == 200
        assert res_consent.json()["ai_training_opt_out"] is True

        # 2. Export user data
        res_export = await client.get(
            "/api/user/export-data",
            params={"user_id": user_id}
        )
        assert res_export.status_code == 200
        export_payload = res_export.json()
        assert "user" in export_payload
        assert len(export_payload["brands"]) == 1
        assert export_payload["brands"][0]["id"] == brand_id

        # 3. Hard delete user data
        res_del = await client.delete(
            "/api/user/delete-data",
            params={"user_id": user_id}
        )
        assert res_del.status_code == 200
        assert res_del.json()["deleted"] is True

        # Verify brand is wiped
        async with async_session_maker() as session:
            brand_check = await session.get(Brand, brand_id)
            assert brand_check is None
