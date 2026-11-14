"""
Public Seam Tests for Content Operations and Advanced Reporting.
Validates Campaigns, Content Templates, Approval Workflows, Draft Comments,
Platform Specifications, and Verifiable CSV/JSON Reporting.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from sqlalchemy import select, delete

from app.main import app
from app.database import get_db, async_session_maker, init_db
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.analytics import PostAnalytics
from app.models.feedback import UserFeedback
from app.models.content_operations import Campaign, ContentTemplate, DraftApproval, DraftComment
from app.routers.auth import create_access_token, hash_password


@pytest_asyncio.fixture
async def content_ops_setup():
    """Sets up authenticated test user, brand, posts, analytics, and recommendations."""
    await init_db()
    async with async_session_maker() as session:
        # Cleanup
        await session.execute(delete(DraftComment))
        await session.execute(delete(DraftApproval))
        await session.execute(delete(ContentTemplate))
        await session.execute(delete(Campaign))
        await session.execute(delete(PostAnalytics).where(PostAnalytics.post_id == "test-post-ops-1"))
        await session.execute(delete(Post).where(Post.id == "test-post-ops-1"))
        await session.execute(delete(UserFeedback).where(UserFeedback.id == "test-rec-ops-1"))
        await session.execute(delete(Brand).where(Brand.id == "test-brand-ops"))
        await session.execute(delete(User).where(User.email == "opslead@sociotrack.io"))
        await session.commit()

        # Create user
        user = User(
            id="test-ops-user-1",
            email="opslead@sociotrack.io",
            hashed_password=hash_password("OpsPassword123!"),
            name="Operations Lead",
            role="Content Operations",
            is_active=True,
            is_demo=False,
        )
        session.add(user)

        # Create brand
        brand = Brand(
            id="test-brand-ops",
            name="Apex Content Studio",
            voice_description="Authoritative and Actionable",
            target_audience="Creators and Marketers",
        )
        session.add(brand)

        # Create post
        post = Post(
            id="test-post-ops-1",
            brand_id="test-brand-ops",
            brand_name="Apex Content Studio",
            content="5 lessons from scaling multi-brand AI workflows in 2026.",
            topic="Operations",
            hook_style="Data-Driven",
            format="CAROUSEL",
            status="draft",
        )
        session.add(post)

        # Create post analytics
        analytics = PostAnalytics(
            post_id="test-post-ops-1",
            impressions=12500,
            likes=850,
            replies=64,
            shares=190,
            engagement_score=8.83,
        )
        session.add(analytics)

        # Create recommendation feedback
        rec_feedback = UserFeedback(
            id="test-rec-ops-1",
            brand_id="test-brand-ops",
            user_id="test-ops-user-1",
            category="ai_quality",
            sentiment="positive",
            message="Recommendation accepted by operations lead",
            rating=5,
        )
        session.add(rec_feedback)

        await session.commit()

    token = create_access_token({"sub": "test-ops-user-1"})
    headers = {"Authorization": f"Bearer {token}"}

    yield {
        "user_id": "test-ops-user-1",
        "brand_id": "test-brand-ops",
        "post_id": "test-post-ops-1",
        "headers": headers,
    }

    # Teardown
    async with async_session_maker() as session:
        await session.execute(delete(DraftComment))
        await session.execute(delete(DraftApproval))
        await session.execute(delete(ContentTemplate))
        await session.execute(delete(Campaign))
        await session.execute(delete(PostAnalytics).where(PostAnalytics.post_id == "test-post-ops-1"))
        await session.execute(delete(Post).where(Post.id == "test-post-ops-1"))
        await session.execute(delete(UserFeedback).where(UserFeedback.id == "test-rec-ops-1"))
        await session.execute(delete(Brand).where(Brand.id == "test-brand-ops"))
        await session.execute(delete(User).where(User.email == "opslead@sociotrack.io"))
        await session.commit()


@pytest.mark.asyncio
async def test_campaign_lifecycle(content_ops_setup):
    """Test creating and listing marketing campaigns."""
    headers = content_ops_setup["headers"]
    brand_id = content_ops_setup["brand_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create Campaign
        resp = await client.post(
            "/api/content-ops/campaigns",
            headers=headers,
            json={
                "brand_id": brand_id,
                "name": "Q4 AI Brand Scaling Blitz",
                "description": "Cross-platform thought leadership sprint.",
                "target_engagement_rate": 12.5,
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Q4 AI Brand Scaling Blitz"
        assert data["status"] == "active"
        campaign_id = data["id"]

        # List Campaigns
        list_resp = await client.get(
            f"/api/content-ops/campaigns?brand_id={brand_id}",
            headers=headers,
        )
        assert list_resp.status_code == 200
        camp_list = list_resp.json()["campaigns"]
        assert any(c["id"] == campaign_id for c in camp_list)


@pytest.mark.asyncio
async def test_content_template_blueprint(content_ops_setup):
    """Test storing and listing reusable content templates."""
    headers = content_ops_setup["headers"]
    brand_id = content_ops_setup["brand_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/content-ops/templates",
            headers=headers,
            json={
                "brand_id": brand_id,
                "title": "Data Breakdown Carousel Blueprint",
                "hook_pattern": "Most teams spend [X hours] on [Y]. Here's how we reduced it by 80%:",
                "body_template": "Slide 1: Problem. Slide 2: Root cause. Slide 3: Architecture solution. Slide 4: Real results.",
                "cta_pattern": "Save this carousel if you're architecting multi-tenant systems.",
                "suggested_format": "CAROUSEL",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Data Breakdown Carousel Blueprint"
        template_id = data["id"]

        # List Templates
        list_resp = await client.get(
            f"/api/content-ops/templates?brand_id={brand_id}",
            headers=headers,
        )
        assert list_resp.status_code == 200
        tmpls = list_resp.json()["templates"]
        assert any(t["id"] == template_id for t in tmpls)


@pytest.mark.asyncio
async def test_draft_approval_workflow(content_ops_setup):
    """Test the complete state machine transitions for draft approvals."""
    headers = content_ops_setup["headers"]
    post_id = content_ops_setup["post_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initial State Check
        status_resp = await client.get(
            f"/api/content-ops/posts/{post_id}/approval",
            headers=headers,
        )
        assert status_resp.status_code == 200
        assert status_resp.json()["status"] == "none"

        # 2. Submit for Review
        submit_resp = await client.post(
            f"/api/content-ops/posts/{post_id}/approval",
            headers=headers,
            json={"action": "submit", "feedback_notes": "Ready for executive sign-off."},
        )
        assert submit_resp.status_code == 200
        assert submit_resp.json()["status"] == "pending_review"

        # 3. Approve
        approve_resp = await client.post(
            f"/api/content-ops/posts/{post_id}/approval",
            headers=headers,
            json={"action": "approve", "feedback_notes": "Strong hook, verified data point."},
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "approved"
        assert approve_resp.json()["feedback_notes"] == "Strong hook, verified data point."

        # 4. Reject (e.g. if changes needed)
        reject_resp = await client.post(
            f"/api/content-ops/posts/{post_id}/approval",
            headers=headers,
            json={"action": "reject", "feedback_notes": "Please swap slide 3 graphic."},
        )
        assert reject_resp.status_code == 200
        assert reject_resp.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_draft_comments_thread(content_ops_setup):
    """Test adding and retrieving internal peer review comments on drafts."""
    headers = content_ops_setup["headers"]
    post_id = content_ops_setup["post_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add Comment
        c_resp = await client.post(
            f"/api/content-ops/posts/{post_id}/comments",
            headers=headers,
            json={"content": "Can we make the first 3 seconds of the hook more urgent?"},
        )
        assert c_resp.status_code == 201
        assert c_resp.json()["author_name"] == "Operations Lead"
        comment_id = c_resp.json()["id"]

        # List Comments
        list_resp = await client.get(
            f"/api/content-ops/posts/{post_id}/comments",
            headers=headers,
        )
        assert list_resp.status_code == 200
        comments = list_resp.json()["comments"]
        assert any(c["id"] == comment_id for c in comments)


@pytest.mark.asyncio
async def test_platform_specifications():
    """Test retrieving multi-platform publishing specifications."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/content-ops/platforms/specifications")
        assert resp.status_code == 200
        data = resp.json()["platforms"]
        assert "instagram" in data
        assert "linkedin" in data
        assert "x" in data
        assert data["instagram"]["max_caption_length"] == 2200
        assert data["linkedin"]["max_caption_length"] == 3000
        assert data["x"]["max_caption_length"] == 280


@pytest.mark.asyncio
async def test_advanced_reporting_json_and_csv(content_ops_setup):
    """Test generating comprehensive executive JSON reporting and downloadable CSV export."""
    headers = content_ops_setup["headers"]
    brand_id = content_ops_setup["brand_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # JSON Report
        json_resp = await client.get(
            f"/api/reports/advanced?brand_id={brand_id}&timeframe_days=30",
            headers=headers,
        )
        assert json_resp.status_code == 200
        report = json_resp.json()
        assert report["brand_id"] == brand_id
        assert report["provenance"]["is_synthetic"] is False
        assert report["kpi_overview"]["total_posts"] >= 1
        assert report["kpi_overview"]["total_impressions"] == 12500
        assert report["recommendation_adoption"]["adoption_rate_pct"] == 100.0
        assert "CAROUSEL" in report["format_performance"]
        assert "Apex Content Studio" in report["executive_summary"]

        # CSV Export
        csv_resp = await client.get(
            f"/api/reports/advanced/export?brand_id={brand_id}&format=csv",
            headers=headers,
        )
        assert csv_resp.status_code == 200
        assert "text/csv" in csv_resp.headers["content-type"]
        assert "attachment; filename=" in csv_resp.headers["content-disposition"]
        csv_text = csv_resp.text
        assert "# SocioTrack Verifiable Executive Report" in csv_text
        assert "Apex Content Studio" in csv_text
        assert "Total Impressions" in csv_text
