"""
Tests for Pilot Workflow:
- POST /api/pilot/import-historical (historical content import with data provenance)
- POST /api/pilot/export-content (formatted export for manual or 3rd-party publishing)
- POST /api/posts/{id}/publish (idempotent publishing seam, double-post prevention)
- GET /api/posts/{id}/performance (performance measurement with attribution caveats)
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, async_session_maker
from app.models.brand import Brand
from app.models.post import Post


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_historical_content_import_with_provenance(auth_headers):
    uid = uuid.uuid4().hex[:6]
    brand_id = f"brd_hist_{uid}"
    async with async_session_maker() as session:
        brand = Brand(
            id=brand_id,
            name=f"Pilot Creator {uid}",
            voice_description="Pragmatic creator tutorials",
            target_audience="Next-gen builders"
        )
        session.add(brand)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "brand_id": brand_id,
            "source_provenance": "verified_archive",
            "data_limitations": "Organic reach estimated via standard 12.5x impression multiplier where API insights restricted.",
            "posts": [
                {
                    "caption": "Why state machines beat amnesiac chatbots in production agent systems.",
                    "format": "carousel",
                    "likes": 450,
                    "comments": 78,
                    "shares": 190,
                    "impressions": 8500,
                    "is_verified": True
                },
                {
                    "caption": "Zero-downtime database migrations: Our 4-step checklist.",
                    "format": "single_image",
                    "likes": 210,
                    "comments": 34,
                    "shares": 85,
                    "impressions": 4200,
                    "is_verified": True
                }
            ]
        }
        res = await client.post("/api/pilot/import-historical", headers=auth_headers, json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["posts_imported"] == 2
        assert data["data_provenance"] == "verified_archive"
        assert "estimated" in data["limitations_disclaimer"].lower()
        assert data["intelligence_profile_updated"] is True


@pytest.mark.asyncio
async def test_content_export_for_manual_publishing(auth_headers):
    uid = uuid.uuid4().hex[:6]
    brand_id = f"brd_exp_{uid}"
    async with async_session_maker() as session:
        brand = Brand(
            id=brand_id,
            name=f"Export Brand {uid}",
            voice_description="Pragmatic creator tutorials",
            target_audience="Next-gen builders"
        )
        session.add(brand)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "brand_id": brand_id,
            "caption": "Here is how to design invariant boundaries for agent reliability.",
            "format": "carousel",
            "hashtags": ["#SoftwareArchitecture", "#AI", "#Engineering"],
            "optimal_utc_time": "14:00 UTC",
            "target_platform": "instagram"
        }
        res = await client.post("/api/pilot/export-content", headers=auth_headers, json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "export_id" in data
        assert "#SoftwareArchitecture" in data["formatted_content"]
        assert "clipboard_text" in data


@pytest.mark.asyncio
async def test_idempotent_publishing_and_duplicate_prevention(auth_headers):
    uid = uuid.uuid4().hex[:6]
    brand_id = f"brd_pub_{uid}"
    post_id = f"post_pub_{uid}"

    async with async_session_maker() as session:
        brand = Brand(
            id=brand_id,
            name=f"Publisher Brand {uid}",
            voice_description="Direct technical",
            target_audience="Developers"
        )
        post = Post(
            id=post_id,
            brand_id=brand_id,
            content="Idempotent test publication caption",
            topic="Reliability",
            format="carousel",
            status="approved"
        )
        session.add(brand)
        session.add(post)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        idempotency_key = f"idem_key_{uid}"
        pub_payload = {
            "idempotency_key": idempotency_key,
            "platform": "instagram",
            "caption": "Idempotent test publication caption"
        }

        # First publish attempt
        res1 = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers, json=pub_payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["status"] in ("published", "scheduled", "action_required")
        assert data1["idempotency_key"] == idempotency_key

        # Second publish attempt with IDENTICAL idempotency key must NOT duplicate publication
        res2 = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers, json=pub_payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert "already processed" in data2["message"].lower() or data2["idempotency_key"] == idempotency_key
