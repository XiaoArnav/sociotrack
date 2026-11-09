"""
Public Seam Tests for Commercial Billing, Usage Metering, and Financial Analytics.
Validates Plan Tiers, Quota Enforcement (HTTP 402), Idempotent Webhook Processing,
and Verified MRR/ARR SaaS Calculations.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import json
import hashlib
from datetime import datetime, timezone
from sqlalchemy import select, delete

from app.main import app
from app.database import get_db, async_session_maker, init_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.billing import (
    Subscription,
    PaymentInvoice,
    UsageMeter,
    BillingWebhookEvent,
)
from app.routers.auth import create_access_token, hash_password


@pytest_asyncio.fixture
async def billing_setup():
    """Sets up authenticated test user, workspace, and clean billing tables."""
    await init_db()
    async with async_session_maker() as session:
        # Cleanup
        await session.execute(delete(BillingWebhookEvent))
        await session.execute(delete(UsageMeter))
        await session.execute(delete(PaymentInvoice))
        await session.execute(delete(Subscription))
        await session.execute(delete(WorkspaceMember).where(WorkspaceMember.workspace_id == "ws-test-billing"))
        await session.execute(delete(Workspace).where(Workspace.id == "ws-test-billing"))
        await session.execute(delete(User).where(User.id == "usr-test-billing"))
        await session.commit()

        # Create user
        user = User(
            id="usr-test-billing",
            email="billinglead@sociotrack.io",
            hashed_password=hash_password("BillingSecret123!"),
            name="Billing Lead",
            role="Finance & Growth",
            is_active=True,
            is_demo=False,
        )
        session.add(user)

        # Create workspace
        ws = Workspace(
            id="ws-test-billing",
            name="Apex Commercial Studio",
            slug="apex-commercial-studio",
            owner_id="usr-test-billing",
            plan="free",
        )
        session.add(ws)

        # Member
        member = WorkspaceMember(
            workspace_id="ws-test-billing",
            user_id="usr-test-billing",
            role="owner",
        )
        session.add(member)

        await session.commit()

    token = create_access_token({"sub": "usr-test-billing"})
    headers = {"Authorization": f"Bearer {token}"}

    yield {
        "user_id": "usr-test-billing",
        "workspace_id": "ws-test-billing",
        "headers": headers,
    }

    # Teardown
    async with async_session_maker() as session:
        await session.execute(delete(BillingWebhookEvent))
        await session.execute(delete(UsageMeter))
        await session.execute(delete(PaymentInvoice))
        await session.execute(delete(Subscription))
        await session.execute(delete(WorkspaceMember).where(WorkspaceMember.workspace_id == "ws-test-billing"))
        await session.execute(delete(Workspace).where(Workspace.id == "ws-test-billing"))
        await session.execute(delete(User).where(User.id == "usr-test-billing"))
        await session.commit()


@pytest.mark.asyncio
async def test_plan_catalog_structure():
    """Test public pricing plan catalog returns Free, Pro, Team, Agency tiers."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/billing/plans")
        assert resp.status_code == 200
        plans = resp.json()["plans"]
        plan_tiers = [p["tier"] for p in plans]
        assert "free" in plan_tiers
        assert "pro" in plan_tiers
        assert "team" in plan_tiers
        assert "agency" in plan_tiers

        pro = next(p for p in plans if p["tier"] == "pro")
        assert pro["price_monthly_usd"] == 29
        assert pro["quotas"]["ai_generation_credits"] == 300
        assert pro["quotas"]["csv_export_allowed"] is True


@pytest.mark.asyncio
async def test_get_or_create_workspace_subscription(billing_setup):
    """Test initial subscription retrieval auto-initializes baseline free tier."""
    headers = billing_setup["headers"]
    ws_id = billing_setup["workspace_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/billing/subscription?workspace_id={ws_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["workspace_id"] == ws_id
        assert data["plan"] == "free"
        assert data["status"] == "active"
        assert data["meters"]["ai_generation_credits"]["allowed"] == 30
        assert data["meters"]["ai_generation_credits"]["used"] == 0


@pytest.mark.asyncio
async def test_checkout_session_creation(billing_setup):
    """Test generating a checkout session for upgrading to Pro plan."""
    headers = billing_setup["headers"]
    ws_id = billing_setup["workspace_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/billing/checkout-session",
            headers=headers,
            json={
                "workspace_id": ws_id,
                "plan": "pro",
                "billing_cycle": "monthly",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert data["plan"] == "pro"


@pytest.mark.asyncio
async def test_credit_consumption_and_quota_enforcement(billing_setup):
    """Test credit consumption deductions and strict HTTP 402 rejection upon quota exhaustion."""
    headers = billing_setup["headers"]
    ws_id = billing_setup["workspace_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initialize subscription
        await client.get(f"/api/billing/subscription?workspace_id={ws_id}", headers=headers)

        # Free tier has 30 credits. Consume 25 credits.
        resp1 = await client.post(
            "/api/billing/credits/consume",
            headers=headers,
            json={"workspace_id": ws_id, "credits": 25},
        )
        assert resp1.status_code == 200
        assert resp1.json()["status"] == "granted"

        # Check subscription status
        sub_resp = await client.get(f"/api/billing/subscription?workspace_id={ws_id}", headers=headers)
        assert sub_resp.json()["meters"]["ai_generation_credits"]["used"] == 25
        assert sub_resp.json()["meters"]["ai_generation_credits"]["remaining"] == 5

        # Attempt to consume 10 more credits (would exceed 30 limit)
        resp2 = await client.post(
            "/api/billing/credits/consume",
            headers=headers,
            json={"workspace_id": ws_id, "credits": 10},
        )
        assert resp2.status_code == 402
        assert "quota exceeded" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_stripe_webhook_idempotency_and_upgrade(billing_setup):
    """Test Stripe webhook processing upgrades workspace and ignores duplicate replay attempts."""
    headers = billing_setup["headers"]
    ws_id = billing_setup["workspace_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initialize subscription
        await client.get(f"/api/billing/subscription?workspace_id={ws_id}", headers=headers)

        webhook_event = {
            "id": "evt_test_checkout_complete_99",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": ws_id,
                    "metadata": {
                        "workspace_id": ws_id,
                        "plan": "pro",
                        "billing_cycle": "monthly",
                    },
                    "subscription": "sub_test_stripe_123",
                    "customer": "cus_test_stripe_456",
                }
            },
        }

        # 1. First webhook delivery
        resp1 = await client.post(
            "/api/billing/webhooks/stripe",
            content=json.dumps(webhook_event).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        assert resp1.status_code == 200
        assert resp1.json()["status"] == "processed"

        # Verify subscription was upgraded to pro
        sub_resp = await client.get(f"/api/billing/subscription?workspace_id={ws_id}", headers=headers)
        assert sub_resp.json()["plan"] == "pro"
        assert sub_resp.json()["meters"]["ai_generation_credits"]["allowed"] == 300

        # 2. Duplicate replay attack / retry delivery with same event ID
        resp2 = await client.post(
            "/api/billing/webhooks/stripe",
            content=json.dumps(webhook_event).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "duplicate_skipped"


@pytest.mark.asyncio
async def test_saas_business_analytics_metrics(billing_setup):
    """Test real-time SaaS business metrics calculation: MRR, ARR, ARPU, gross margin."""
    headers = billing_setup["headers"]
    ws_id = billing_setup["workspace_id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Upgrade to pro to introduce paid revenue
        webhook_event = {
            "id": "evt_test_analytics_upgrade",
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "client_reference_id": ws_id,
                    "metadata": {
                        "workspace_id": ws_id,
                        "plan": "team",
                        "billing_cycle": "monthly",
                    },
                    "id": "sub_test_team_999",
                    "customer": "cus_test_team_888",
                }
            },
        }
        await client.post(
            "/api/billing/webhooks/stripe",
            content=json.dumps(webhook_event).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )

        resp = await client.get("/api/business-analytics/metrics", headers=headers)
        assert resp.status_code == 200
        metrics = resp.json()

        assert metrics["currency"] == "USD"
        assert metrics["mrr_usd"] >= 79.0
        assert metrics["arr_usd"] >= (79.0 * 12)
        assert metrics["subscribers"]["team_tier"] >= 1
        assert metrics["unit_economics"]["gross_margin_pct"] > 50.0
        assert metrics["provenance"]["is_synthetic"] is False
