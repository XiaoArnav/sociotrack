"""
Tests for Recommendation Quality Validation, Feedback Loop, and User Feedback Backlog.
Verifies:
- POST /api/recommendations/feedback (accept, reject with reason, 1-5 usefulness rating)
- Automatic memory ingestion: rejections generate 'donts_avoided' lessons
- POST /api/feedback (in-app feedback, bug report, survey)
- GET /api/feedback/backlog (prioritized research backlog)
- PUT /api/feedback/{id}/triage (triage management)
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand
from app.models.memory import AgentMemory


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_recommendation_rejection_triggers_negative_memory_lesson(auth_headers):
    uid = uuid.uuid4().hex[:6]
    brand_id = f"brd_fb_{uid}"
    async with async_session_maker() as session:
        brand = Brand(
            id=brand_id,
            name=f"Quantum Systems {uid}",
            voice_description="Direct, technical, zero buzzwords",
            target_audience="DevOps & Cloud Engineers"
        )
        session.add(brand)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User rejects recommendation for 'poor_voice'
        rej_payload = {
            "draft_id": "drf_123_test",
            "brand_id": brand_id,
            "decision": "rejected",
            "rejection_reason": "poor_voice",
            "user_explanation": "Too salesy and uses generic emojis that violate our technical voice.",
            "usefulness_rating": 2,
        }
        res = await client.post("/api/recommendations/feedback", headers=auth_headers, json=rej_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert data["memory_lesson_created"] is True
        assert data["lesson_id"] is not None

        # Verify a new donts_avoided lesson exists for this brand
        res_mem = await client.get(f"/api/brands/{brand_id}/memory", headers=auth_headers)
        assert res_mem.status_code == 200
        mem_data = res_mem.json()
        donts = mem_data["lessons"]["donts_avoided"]
        assert any("salesy" in d.lower() or "poor_voice" in d.lower() or "violate" in d.lower() for d in donts)


@pytest.mark.asyncio
async def test_recommendation_approval_and_rating(auth_headers):
    uid = uuid.uuid4().hex[:6]
    brand_id = f"brd_app_{uid}"
    async with async_session_maker() as session:
        brand = Brand(
            id=brand_id,
            name=f"AeroDynamics {uid}",
            voice_description="Authoritative aerospace engineering",
            target_audience="Aerospace community"
        )
        session.add(brand)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        app_payload = {
            "draft_id": "drf_456_app",
            "brand_id": brand_id,
            "decision": "accepted",
            "usefulness_rating": 5,
            "user_explanation": "Spot-on hook and flawless technical carousel breakdown."
        }
        res = await client.post("/api/recommendations/feedback", headers=auth_headers, json=app_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert data["confidence_impact"] > 0


@pytest.mark.asyncio
async def test_user_feedback_submission_and_backlog(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Submit general feedback items
        items = [
            {"category": "ai_quality", "rating": 4, "message": "The carousel structure is exceptional, but would love more slide pacing tips."},
            {"category": "usability", "rating": 3, "message": "Onboarding was clear, but connecting Meta accounts required three retries."},
            {"category": "bug_report", "rating": 2, "message": "Preview modal on mobile viewport overflows slightly."},
        ]

        created_ids = []
        for it in items:
            res = await client.post("/api/feedback", headers=auth_headers, json=it)
            assert res.status_code == 201
            data = res.json()
            assert data["category"] == it["category"]
            created_ids.append(data["id"])

        # Fetch backlog
        res_backlog = await client.get("/api/feedback/backlog", headers=auth_headers)
        assert res_backlog.status_code == 200
        backlog = res_backlog.json()
        assert backlog["total_feedback_items"] >= 3
        assert "by_category" in backlog
        assert backlog["by_category"]["ai_quality"] >= 1

        # Triage an item
        target_id = created_ids[0]
        res_triage = await client.put(f"/api/feedback/{target_id}/triage", headers=auth_headers, json={"triage_status": "triaged"})
        assert res_triage.status_code == 200
        assert res_triage.json()["triage_status"] == "triaged"
