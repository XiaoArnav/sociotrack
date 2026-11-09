"""
Security Foundation & Authorization Tests (Step 1 Verification).

Guarantees:
1. Every sensitive endpoint identifies the authenticated user from a verified token.
2. User ID supplied by client is NEVER trusted as proof of ownership.
3. Cross-user data snooping, consent modification, and deletion attempts are strictly rejected with 403 Forbidden.
4. Unauthenticated calls are rejected with 401 Unauthorized.
5. Admin users can perform authorized administrative tasks and these actions produce immutable audit logs.
6. Product telemetry event ingestion strictly prevents user impersonation.
7. Analytics dashboard is protected against unauthorized access.
"""
import pytest
import pytest_asyncio
import uuid
import json
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.database import init_db, async_session_maker
from app.models.user import User
from app.models.brand import Brand
from app.models.workspace import AuditLog
from app.core.security import create_access_token


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_unauthenticated_requests_strictly_rejected():
    """Confirms all privacy and analytics endpoints reject unauthenticated access with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User / Privacy endpoints
        res1 = await client.get("/api/user/export-data")
        assert res1.status_code == 401

        res2 = await client.post("/api/user/consent", json={"telemetry_opt_in": True})
        assert res2.status_code == 401

        res3 = await client.delete("/api/user/delete-data")
        assert res3.status_code == 401

        # Privacy aliases
        res4 = await client.get("/api/privacy/export-data")
        assert res4.status_code == 401

        res5 = await client.delete("/api/privacy/delete-account")
        assert res5.status_code == 401

        # Analytics Dashboard
        res6 = await client.get("/api/analytics/product/dashboard")
        assert res6.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_privacy_snooping_rejected():
    """
    Confirms User A cannot access, export, modify consent for, or delete User B's data (403 Forbidden).
    """
    user_a_id = f"usr_a_{uuid.uuid4().hex[:6]}"
    user_b_id = f"usr_b_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user_a = User(
            id=user_a_id,
            email=f"user_a_{uuid.uuid4().hex[:6]}@domain.com",
            name="Alice Architect",
            hashed_password="pw_hash_alice",
            role="Principal Content Architect",
            is_active=True,
        )
        user_b = User(
            id=user_b_id,
            email=f"user_b_{uuid.uuid4().hex[:6]}@domain.com",
            name="Bob Builder",
            hashed_password="pw_hash_bob",
            role="Principal Content Architect",
            is_active=True,
        )
        brand_b = Brand(
            id=f"brd_b_{uuid.uuid4().hex[:6]}",
            user_id=user_b_id,
            name=f"Bob Private Brand {uuid.uuid4().hex[:6]}",
            voice_description="Confidential proprietary voice",
        )
        session.add(user_a)
        session.add(user_b)
        session.add(brand_b)
        await session.commit()

    token_a = create_access_token({"sub": user_a_id, "email": user_a.email, "is_demo": False})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. User A attempts to export User B's private data -> 403 Forbidden
        res_export = await client.get(
            "/api/user/export-data",
            params={"user_id": user_b_id},
            headers=headers_a,
        )
        assert res_export.status_code == 403
        assert "Forbidden" in res_export.json()["detail"]

        # Also verify privacy alias route
        res_export_alias = await client.get(
            "/api/privacy/export-data",
            params={"user_id": user_b_id},
            headers=headers_a,
        )
        assert res_export_alias.status_code == 403

        # 2. User A attempts to alter User B's privacy consent -> 403 Forbidden
        res_consent = await client.post(
            "/api/user/consent",
            params={"user_id": user_b_id},
            json={"telemetry_opt_in": False, "ai_training_opt_out": False},
            headers=headers_a,
        )
        assert res_consent.status_code == 403

        # 3. User A attempts to hard-delete User B's account -> 403 Forbidden
        res_del = await client.delete(
            "/api/user/delete-data",
            params={"user_id": user_b_id},
            headers=headers_a,
        )
        assert res_del.status_code == 403

        # Confirm Bob and Bob's brand still exist intact in DB
        async with async_session_maker() as session:
            bob_db = await session.get(User, user_b_id)
            assert bob_db is not None
            brand_db = await session.get(Brand, brand_b.id)
            assert brand_db is not None


@pytest.mark.asyncio
async def test_authorized_user_self_service_privacy():
    """Confirms legitimate users can export, modify consent, and delete their own data."""
    user_id = f"usr_legit_{uuid.uuid4().hex[:6]}"
    brand_id = f"brd_legit_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user = User(
            id=user_id,
            email=f"legit_{uuid.uuid4().hex[:6]}@domain.com",
            name="Legitimate User",
            hashed_password="pw_hash_legit",
            role="Growth Lead",
            is_active=True,
        )
        brand = Brand(
            id=brand_id,
            user_id=user_id,
            name=f"Legit Brand {uuid.uuid4().hex[:6]}",
            voice_description="Open and clear",
        )
        session.add(user)
        session.add(brand)
        await session.commit()

    token = create_access_token({"sub": user_id, "email": user.email, "is_demo": False})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Update own consent (omitting user_id defaults to self)
        res_consent = await client.post(
            "/api/user/consent",
            json={"telemetry_opt_in": False, "ai_training_opt_out": True},
            headers=headers,
        )
        assert res_consent.status_code == 200
        assert res_consent.json()["telemetry_opt_in"] is False
        assert res_consent.json()["ai_training_opt_out"] is True

        # 2. Export own data
        res_export = await client.get("/api/user/export-data", headers=headers)
        assert res_export.status_code == 200
        data = res_export.json()
        assert data["user"]["id"] == user_id
        assert len(data["brands"]) == 1
        assert data["brands"][0]["id"] == brand_id

        # 3. Hard delete own account
        res_del = await client.delete("/api/user/delete-data", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["deleted"] is True

        # Confirm erasure
        async with async_session_maker() as session:
            assert await session.get(User, user_id) is None
            assert await session.get(Brand, brand_id) is None


@pytest.mark.asyncio
async def test_admin_authorized_privacy_override_with_audit_trail():
    """
    Confirms an authenticated administrator can view or manage user data for compliance,
    and that this action is permanently recorded in the immutable audit trail.
    """
    admin_id = f"admin_{uuid.uuid4().hex[:6]}"
    victim_id = f"target_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        admin_user = User(
            id=admin_id,
            email=f"admin_{uuid.uuid4().hex[:6]}@sociotrack.io",
            name="Compliance Admin",
            hashed_password="pw_hash_admin",
            role="admin",  # Administrative role
            is_active=True,
        )
        target_user = User(
            id=victim_id,
            email=f"subject_{uuid.uuid4().hex[:6]}@example.com",
            name="Data Subject",
            hashed_password="pw_hash_target",
            role="Editor",
            is_active=True,
        )
        session.add(admin_user)
        session.add(target_user)
        await session.commit()

    admin_token = create_access_token({"sub": admin_id, "email": admin_user.email, "is_demo": False})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Admin exports target user data
        res_export = await client.get(
            "/api/user/export-data",
            params={"user_id": victim_id},
            headers=admin_headers,
        )
        assert res_export.status_code == 200
        assert res_export.json()["user"]["id"] == victim_id

        # Verify audit log was recorded for the administrative override
        async with async_session_maker() as session:
            logs_res = await session.execute(
                select(AuditLog).where(
                    AuditLog.action == "privacy.export.admin_override",
                    AuditLog.resource_id == victim_id,
                )
            )
            audit_entry = logs_res.scalars().first()
            assert audit_entry is not None
            assert audit_entry.user_id == admin_id


@pytest.mark.asyncio
async def test_telemetry_impersonation_guardrails():
    """
    Verifies product usage telemetry event ingestion:
    - Rejects unauthenticated callers attempting to claim an explicit user_id (401).
    - Rejects authenticated users attempting to record events under someone else's user_id (403).
    - Permits anonymous telemetry when user_id is omitted (201).
    - Automatically binds authenticated user_id when logged in (201).
    """
    legit_user_id = f"usr_legit_{uuid.uuid4().hex[:6]}"
    other_user_id = f"usr_other_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user = User(
            id=legit_user_id,
            email=f"legit_{uuid.uuid4().hex[:6]}@domain.com",
            name="Legit User",
            hashed_password="pw_hash_legit",
            role="Growth Lead",
            is_active=True,
        )
        session.add(user)
        await session.commit()

    token = create_access_token({"sub": legit_user_id, "email": user.email, "is_demo": False})
    auth_headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated client claims a specific user_id -> 401 Unauthorized
        res_unauth_spoof = await client.post(
            "/api/analytics/product/event",
            json={"event_name": "spoofed_event", "user_id": other_user_id},
        )
        assert res_unauth_spoof.status_code == 401

        # 2. Authenticated user claims someone else's user_id -> 403 Forbidden
        res_auth_spoof = await client.post(
            "/api/analytics/product/event",
            json={"event_name": "cross_user_event", "user_id": other_user_id},
            headers=auth_headers,
        )
        assert res_auth_spoof.status_code == 403

        # 3. Unauthenticated client submits anonymous event (no user_id) -> 201 Created
        res_anon = await client.post(
            "/api/analytics/product/event",
            json={"event_name": "onboarding_started", "step_name": "landing_page"},
        )
        assert res_anon.status_code == 201
        assert res_anon.json()["user_id"] is None

        # 4. Authenticated user submits event without user_id -> automatically bound to caller ID
        res_bound = await client.post(
            "/api/analytics/product/event",
            json={"event_name": "recommendation_viewed", "step_name": "feed"},
            headers=auth_headers,
        )
        assert res_bound.status_code == 201
        assert res_bound.json()["user_id"] == legit_user_id
