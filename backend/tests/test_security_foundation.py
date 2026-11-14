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


@pytest.mark.asyncio
async def test_comprehensive_unauthenticated_endpoints_rejected():
    """
    Step 1 Verification: Confirms that every private application endpoint rejects
    unauthenticated requests with 401 Unauthorized.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Brands
        assert (await client.get("/api/brands")).status_code == 401
        assert (await client.post("/api/brands", json={"name": "Test Brand"})).status_code == 401
        assert (await client.get("/api/brands/fake-id/intelligence")).status_code == 401
        assert (await client.get("/api/brands/fake-id/memory")).status_code == 401
        assert (await client.post("/api/brands/fake-id/refresh-intelligence")).status_code == 401

        # Drafts & Posts
        assert (await client.post("/api/generate-drafts", json={"brand_id": "fake", "topic": "AI"})).status_code == 401
        assert (await client.post("/api/posts/approve", json={"post_id": "fake"})).status_code == 401
        assert (await client.get("/api/posts/queue")).status_code == 401
        assert (await client.get("/api/posts")).status_code == 401

        # Calendar
        assert (await client.get("/api/calendar/recommendations?brand_id=fake")).status_code == 401
        assert (await client.post("/api/calendar/approve-slot?brand_id=fake", json={"slot_id": "s1"})).status_code == 401

        # Memory
        assert (await client.get("/api/memory/insights?brand_id=fake")).status_code == 401
        assert (await client.post("/api/memory/insights", json={"brand_id": "fake", "insight_text": "t"})).status_code == 401

        # Feedback
        assert (await client.post("/api/recommendations/feedback", json={"brand_id": "fake", "draft_id": "d1", "decision": "accepted"})).status_code == 401
        assert (await client.post("/api/feedback", json={"category": "ai_quality", "message": "msg"})).status_code == 401
        assert (await client.get("/api/feedback/backlog")).status_code == 401

        # Pilot & Experiments
        assert (await client.post("/api/pilot/import-historical", json={"brand_id": "fake", "posts": []})).status_code == 401
        assert (await client.post("/api/pilot/export-content", json={"brand_id": "fake", "caption": "c"})).status_code == 401
        assert (await client.get("/api/experiments")).status_code == 401
        assert (await client.post("/api/experiments", json={"title": "exp", "variant_a_label": "a", "variant_b_label": "b"})).status_code == 401

        # Billing
        assert (await client.get("/api/billing/subscription?workspace_id=fake")).status_code == 401
        assert (await client.post("/api/billing/checkout-session", json={"workspace_id": "fake", "plan": "pro"})).status_code == 401
        assert (await client.post("/api/billing/portal-session", json={"workspace_id": "fake"})).status_code == 401
        assert (await client.get("/api/billing/invoices?workspace_id=fake")).status_code == 401
        assert (await client.post("/api/billing/credits/consume", json={"workspace_id": "fake", "credits": 1})).status_code == 401

        # Avatars & Webhooks Cron/Simulation
        assert (await client.post("/api/creators/cron/poll")).status_code == 401
        assert (await client.post("/api/creators/somehandle/snapshot")).status_code == 401
        assert (await client.post("/api/webhooks/instagram/simulate", json={"brand_name": "b", "topic": "t"})).status_code == 401


@pytest.mark.asyncio
async def test_cross_user_resource_access_rejected_with_403():
    """
    Step 1 Verification: Confirms that User A cannot read or mutate User B's private resources (403 Forbidden).
    """
    uid_a = uuid.uuid4().hex[:6]
    uid_b = uuid.uuid4().hex[:6]

    async with async_session_maker() as session:
        user_a = User(
            id=f"usr_{uid_a}",
            email=f"alice_{uid_a}@brand.com",
            name="Alice",
            hashed_password="hash",
            role="Editor",
            is_active=True,
        )
        user_b = User(
            id=f"usr_{uid_b}",
            email=f"bob_{uid_b}@brand.com",
            name="Bob",
            hashed_password="hash",
            role="Editor",
            is_active=True,
        )
        brand_b = Brand(
            id=f"brd_{uid_b}",
            user_id=f"usr_{uid_b}",
            name=f"Bob Exclusive Brand {uid_b}",
            voice_description="Confidential",
        )
        session.add_all([user_a, user_b, brand_b])
        await session.commit()

    token_a = create_access_token({"sub": f"usr_{uid_a}", "email": user_a.email, "is_demo": False})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. User A cannot view User B's brand intelligence -> 403 Forbidden
        res_intel = await client.get(f"/api/brands/{brand_b.id}/intelligence", headers=headers_a)
        assert res_intel.status_code == 403

        # 2. User A cannot generate drafts for User B's brand -> 403 Forbidden
        res_draft = await client.post(
            "/api/generate-drafts",
            headers=headers_a,
            json={"brand_id": brand_b.id, "topic": "Infiltrating Topics"},
        )
        assert res_draft.status_code == 403

        # 3. User A cannot approve posts for User B's brand -> 403 Forbidden
        res_app = await client.post(
            "/api/posts/approve",
            headers=headers_a,
            json={"brand_id": brand_b.id, "approved_content": "Unauthorized approve"},
        )
        assert res_app.status_code == 403

        # 4. User A cannot trigger historical import for User B's brand -> 403 Forbidden
        res_hist = await client.post(
            "/api/pilot/import-historical",
            headers=headers_a,
            json={"brand_id": brand_b.id, "posts": []},
        )
        assert res_hist.status_code == 403

        # 5. User A cannot export content under User B's brand -> 403 Forbidden
        res_exp = await client.post(
            "/api/pilot/export-content",
            headers=headers_a,
            json={"brand_id": brand_b.id, "caption": "Leaked Caption"},
        )
        assert res_exp.status_code == 403


@pytest.mark.asyncio
async def test_workspace_security_invite_email_and_brand_linking():
    """
    Step 1 Verification:
    - User cannot accept an invitation issued for a different email address (403).
    - User cannot link another user's brand to their workspace without ownership (403).
    """
    uid = uuid.uuid4().hex[:6]
    async with async_session_maker() as session:
        owner = User(id=f"usr_ws_owner_{uid}", email=f"owner_{uid}@corp.com", name="Owner", hashed_password="h", is_active=True)
        eve = User(id=f"usr_eve_{uid}", email=f"eve_{uid}@intruder.com", name="Eve", hashed_password="h", is_active=True)
        victim = User(id=f"usr_vic_{uid}", email=f"victim_{uid}@other.com", name="Victim", hashed_password="h", is_active=True)

        vic_brand = Brand(id=f"brd_vic_{uid}", user_id=victim.id, name=f"Victim Brand {uid}")
        session.add_all([owner, eve, victim, vic_brand])
        await session.commit()

    token_owner = create_access_token({"sub": owner.id, "email": owner.email, "is_demo": False})
    token_eve = create_access_token({"sub": eve.id, "email": eve.email, "is_demo": False})
    headers_owner = {"Authorization": f"Bearer {token_owner}"}
    headers_eve = {"Authorization": f"Bearer {token_eve}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create workspace
        ws_res = await client.post("/api/workspaces", headers=headers_owner, json={"name": f"Corp WS {uid}"})
        assert ws_res.status_code == 201
        ws_id = ws_res.json()["id"]

        # Owner invites alice@corp.com
        inv_res = await client.post(
            f"/api/workspaces/{ws_id}/invites",
            headers=headers_owner,
            json={"email": f"alice_{uid}@corp.com", "role": "editor"},
        )
        assert inv_res.status_code == 200
        inv_token = inv_res.json()["token"]

        # Eve attempts to accept invitation issued to Alice -> 403 Forbidden
        accept_res = await client.post(f"/api/workspaces/invites/{inv_token}/accept", headers=headers_eve)
        assert accept_res.status_code == 403
        assert "Forbidden" in accept_res.json()["detail"]

        # Owner attempts to link Victim's private brand to Corp WS without ownership -> 403 Forbidden
        link_res = await client.post(
            f"/api/workspaces/{ws_id}/brands/{vic_brand.id}/link",
            headers=headers_owner,
        )
        assert link_res.status_code == 403
        assert "Forbidden" in link_res.json()["detail"]


@pytest.mark.asyncio
async def test_meta_webhook_hmac_and_handle_sanitization():
    """
    Step 1 Verification:
    - Meta webhook verifies X-Hub-Signature-256 HMAC and rejects forged signatures (403).
    - Creator handles are sanitized against path traversal or injection (400).
    """
    import hmac
    import hashlib
    from app.config import settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test Meta webhook signature verification with configured secret
        orig_secret = settings.META_APP_SECRET
        settings.META_APP_SECRET = "test_meta_app_secret_abc123"
        try:
            payload = json.dumps({"object": "instagram", "entry": []}).encode("utf-8")
            valid_sig = "sha256=" + hmac.new(b"test_meta_app_secret_abc123", msg=payload, digestmod=hashlib.sha256).hexdigest()
            invalid_sig = "sha256=invalid_forged_signature_00000000000000000000000000000000"

            # Valid signature -> accepted (200)
            res_valid = await client.post(
                "/api/webhooks/instagram",
                content=payload,
                headers={"X-Hub-Signature-256": valid_sig, "Content-Type": "application/json"},
            )
            assert res_valid.status_code == 200

            # Forged signature -> rejected (403)
            res_invalid = await client.post(
                "/api/webhooks/instagram",
                content=payload,
                headers={"X-Hub-Signature-256": invalid_sig, "Content-Type": "application/json"},
            )
            assert res_invalid.status_code == 403

            # Missing signature -> rejected (403)
            res_missing = await client.post(
                "/api/webhooks/instagram",
                content=payload,
                headers={"Content-Type": "application/json"},
            )
            assert res_missing.status_code == 403
        finally:
            settings.META_APP_SECRET = orig_secret

        # 2. Public creator handle sanitization
        # Malicious handle with path traversal
        res_traversal = await client.get("/api/creators/live/..%2F..%2Fetc%2Fpasswd")
        assert res_traversal.status_code in (400, 404)

        res_invalid_chars = await client.get("/api/creators/live/user$*()")
        assert res_invalid_chars.status_code == 400


@pytest.mark.asyncio
async def test_simulator_security_and_ownership():
    """
    Step 1 Verification:
    - Anonymous access to /api/simulator/feed-metrics is rejected with 401.
    - User A cannot mutate metrics or insert memories for User B's post (403/404).
    - Legitimate owner can simulate feed metrics (200).
    """
    from app.models.post import Post

    user_a_id = f"usr_sim_a_{uuid.uuid4().hex[:6]}"
    user_b_id = f"usr_sim_b_{uuid.uuid4().hex[:6]}"
    brand_b_id = f"brd_sim_b_{uuid.uuid4().hex[:6]}"
    post_b_id = f"pst_sim_b_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user_a = User(
            id=user_a_id,
            email=f"{user_a_id}@example.com",
            name="Alice Simulator",
            hashed_password="pw",
            role="creator",
            is_active=True,
        )
        user_b = User(
            id=user_b_id,
            email=f"{user_b_id}@example.com",
            name="Bob Simulator",
            hashed_password="pw",
            role="creator",
            is_active=True,
        )
        brand_b = Brand(
            id=brand_b_id,
            user_id=user_b_id,
            name=f"Brand B {uuid.uuid4().hex[:6]}",
        )
        post_b = Post(
            id=post_b_id,
            brand_id=brand_b_id,
            topic="Bob Private Architecture",
            hook_style="contrarian",
            content="Bob confidential post content",
            status="published",
        )
        session.add(user_a)
        session.add(user_b)
        session.add(brand_b)
        session.add(post_b)
        await session.commit()

    token_a = create_access_token({"sub": user_a_id, "email": user_a.email, "is_demo": False})
    token_b = create_access_token({"sub": user_b_id, "email": user_b.email, "is_demo": False})
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Anonymous access rejected with 401
        res_anon = await client.post(
            "/api/simulator/feed-metrics",
            json={"post_id": post_b_id, "impressions": 1000, "likes": 50},
        )
        assert res_anon.status_code == 401

        # 2. User A cross-user access to Bob's post rejected with 403
        res_cross = await client.post(
            "/api/simulator/feed-metrics",
            headers=headers_a,
            json={"post_id": post_b_id, "impressions": 1000, "likes": 50},
        )
        assert res_cross.status_code in (403, 404)

        # 3. Legitimate user B can simulate feed metrics
        res_owner = await client.post(
            "/api/simulator/feed-metrics",
            headers=headers_b,
            json={"post_id": post_b_id, "impressions": 5000, "likes": 250, "replies": 30, "shares": 20},
        )
        assert res_owner.status_code == 200
        assert res_owner.json()["post_id"] == post_b_id


@pytest.mark.asyncio
async def test_diagnostics_security_and_handle_sanitization():
    """
    Step 1 Verification:
    - Traversal attacks on diagnostics endpoints are rejected with 400.
    - Snooping on private user-owned brands via /api/diagnostics/audit is rejected with 403.
    """
    user_owner_id = f"usr_diag_{uuid.uuid4().hex[:6]}"
    brand_private_name = f"brand_priv_{uuid.uuid4().hex[:6]}"

    async with async_session_maker() as session:
        user_owner = User(
            id=user_owner_id,
            email=f"{user_owner_id}@example.com",
            name="Diag Owner",
            hashed_password="pw",
            role="creator",
            is_active=True,
        )
        brand_private = Brand(
            id=f"brd_diag_{uuid.uuid4().hex[:6]}",
            user_id=user_owner_id,
            name=brand_private_name,
        )
        session.add(user_owner)
        session.add(brand_private)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Path traversal in handle returns 400 or 404 (routed-level rejection)
        res_traversal = await client.get("/api/diagnostics/instagram/..%2F..%2Fetc/predict")
        assert res_traversal.status_code in (400, 404)

        res_post_traversal = await client.post(
            "/api/diagnostics/predict-content",
            json={"creator_handle": "../traversal/attempt"},
        )
        assert res_post_traversal.status_code == 400

        # 2. Cross-user access to private brand without auth returns 403
        res_private_audit = await client.get(f"/api/diagnostics/audit?brand_name={brand_private_name}")
        assert res_private_audit.status_code == 403

        # 3. Public/demo audit succeeds
        res_public_audit = await client.get("/api/diagnostics/audit?brand_name=DevRelay")
        assert res_public_audit.status_code == 200
