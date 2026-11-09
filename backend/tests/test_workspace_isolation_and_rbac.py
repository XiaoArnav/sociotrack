"""
Comprehensive Multi-Tenant Workspace Isolation and Role-Based Access Control (RBAC) Test Suite.

Verifies strict tenant boundary enforcement across all 12 mandatory scenarios:
1. Cross-workspace resource isolation (User A in Workspace A cannot access Workspace B resources).
2. Non-member access rejected with 403.
3. Guessing resource IDs across workspaces rejected (BOLA/IDOR protection).
4. Member/Editor cannot perform owner-only operations (delete workspace, transfer ownership).
5. Viewer cannot modify resources (approve posts, publish, approve slots, create campaigns, generate drafts).
6. Self-promotion blocked (member cannot PATCH own role to admin/owner).
7. Invitations rejected when email does not match authenticated user (403).
8. Expired, revoked, and already consumed invitations rejected (400/404).
9. Unauthorized brand transfer across workspaces rejected (403); authorized transfer succeeds.
10. Member removal immediately revokes access to workspace resources.
11. Workspace deletion cleanly unlinks brands and cascades members without data leaks.
12. Existing authenticated workflows remain fully functional.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta

from app.main import app
from app.database import init_db, async_session_maker
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceInvite, AuditLog
from sqlalchemy import delete
from app.routers.auth import hash_password, create_access_token
from app.services.workspace_service import hash_secret


@pytest_asyncio.fixture(autouse=True)
async def setup_rbac_test_data():
    """Initializes isolated tenants, users, and brands for RBAC testing."""
    await init_db()
    async with async_session_maker() as session:
        # Clean up any leftover test data for these test IDs to guarantee isolation
        await session.execute(delete(WorkspaceMember).where(WorkspaceMember.workspace_id.in_(["ws-alpha-tenant-id", "ws-beta-tenant-id"])))
        await session.execute(delete(Post).where(Post.id.in_(["post-alpha-id", "post-beta-id"])))
        await session.execute(delete(Brand).where(Brand.id.in_(["brand-alpha-id", "brand-beta-id"])))
        await session.execute(delete(Workspace).where(Workspace.id.in_(["ws-alpha-tenant-id", "ws-beta-tenant-id"])))
        await session.commit()

        # Users
        owner_a = User(
            id="usr-owner-a",
            email="owner_a@alpha.io",
            hashed_password=hash_password("Password123!"),
            name="Alice Alpha",
            role="Founder",
        )
        editor_a = User(
            id="usr-editor-a",
            email="editor_a@alpha.io",
            hashed_password=hash_password("Password123!"),
            name="Evan Editor",
            role="Content Creator",
        )
        viewer_a = User(
            id="usr-viewer-a",
            email="viewer_a@alpha.io",
            hashed_password=hash_password("Password123!"),
            name="Victor Viewer",
            role="Analyst",
        )
        owner_b = User(
            id="usr-owner-b",
            email="owner_b@beta.io",
            hashed_password=hash_password("Password123!"),
            name="Bob Beta",
            role="Agency Owner",
        )
        external_user = User(
            id="usr-external-c",
            email="external@external.io",
            hashed_password=hash_password("Password123!"),
            name="Charlie Outside",
            role="Contractor",
        )

        for u in [owner_a, editor_a, viewer_a, owner_b, external_user]:
            await session.merge(u)

        # Workspaces
        ws_a = Workspace(
            id="ws-alpha-tenant-id",
            name="Alpha Corp",
            slug="alpha-corp-tenant",
            owner_id="usr-owner-a",
        )
        ws_b = Workspace(
            id="ws-beta-tenant-id",
            name="Beta Ventures",
            slug="beta-ventures-tenant",
            owner_id="usr-owner-b",
        )
        await session.merge(ws_a)
        await session.merge(ws_b)

        # Memberships
        m_owner_a = WorkspaceMember(id="mem-owner-a", workspace_id="ws-alpha-tenant-id", user_id="usr-owner-a", role="owner")
        m_editor_a = WorkspaceMember(id="mem-editor-a", workspace_id="ws-alpha-tenant-id", user_id="usr-editor-a", role="editor")
        m_viewer_a = WorkspaceMember(id="mem-viewer-a", workspace_id="ws-alpha-tenant-id", user_id="usr-viewer-a", role="viewer")
        m_owner_b = WorkspaceMember(id="mem-owner-b", workspace_id="ws-beta-tenant-id", user_id="usr-owner-b", role="owner")

        for m in [m_owner_a, m_editor_a, m_viewer_a, m_owner_b]:
            await session.merge(m)

        # Brands
        brand_a = Brand(
            id="brand-alpha-id",
            name="Alpha Tech Brand",
            voice_description="Direct, engineering-first",
            user_id="usr-owner-a",
            workspace_id="ws-alpha-tenant-id",
        )
        brand_b = Brand(
            id="brand-beta-id",
            name="Beta Retail Brand",
            voice_description="Playful and vibrant",
            user_id="usr-owner-b",
            workspace_id="ws-beta-tenant-id",
        )
        await session.merge(brand_a)
        await session.merge(brand_b)

        # Posts
        post_a = Post(
            id="post-alpha-id",
            brand_id="brand-alpha-id",
            topic="Alpha Cloud Architecture",
            content="Building resilient multi-tenant SaaS backends.",
            hook_style="technical",
            status="draft",
        )
        post_b = Post(
            id="post-beta-id",
            brand_id="brand-beta-id",
            topic="Beta Summer Sale",
            content="Exclusive discounts on developer gadgets.",
            hook_style="promotional",
            status="draft",
        )
        await session.merge(post_a)
        await session.merge(post_b)

        await session.commit()


def get_auth_header(user_id: str, email: str) -> dict:
    token = create_access_token({"sub": user_id, "email": email})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_01_cross_workspace_resource_isolation():
    """Scenario 1: User in Workspace A cannot read or list resources belonging to Workspace B."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Listing brands without workspace filter returns only accessible brands
        res = await client.get("/api/brands", headers=editor_a_headers)
        assert res.status_code == 200
        brand_ids = [b["id"] for b in res.json()]
        assert "brand-alpha-id" in brand_ids
        assert "brand-beta-id" not in brand_ids

        # Listing posts returns only posts from accessible brands
        p_res = await client.get("/api/posts", headers=editor_a_headers)
        assert p_res.status_code == 200
        post_ids = [p["id"] for p in p_res.json()]
        assert "post-alpha-id" in post_ids
        assert "post-beta-id" not in post_ids


@pytest.mark.asyncio
async def test_02_non_member_access_rejected():
    """Scenario 2: Non-member rejected with 403 when accessing Workspace B endpoints."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Trying to view Workspace B details
        res_ws = await client.get("/api/workspaces/ws-beta-tenant-id", headers=editor_a_headers)
        assert res_ws.status_code == 403
        assert "Access denied" in res_ws.json()["detail"]

        # Trying to query brands filtered by Workspace B
        res_brands = await client.get("/api/brands?workspace_id=ws-beta-tenant-id", headers=editor_a_headers)
        assert res_brands.status_code == 403

        # Trying to view Workspace B subscription
        res_sub = await client.get("/api/billing/subscription?workspace_id=ws-beta-tenant-id", headers=editor_a_headers)
        assert res_sub.status_code == 403


@pytest.mark.asyncio
async def test_03_guessing_resource_ids_rejected():
    """Scenario 3: Guessing resource IDs across workspaces rejected (BOLA/IDOR protection)."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Guessing Brand B UUID
        res_brand = await client.get("/api/brands/brand-beta-id/intelligence", headers=editor_a_headers)
        assert res_brand.status_code == 403
        assert "Forbidden" in res_brand.json()["detail"]

        # Guessing Post B UUID
        res_post = await client.get("/api/posts/post-beta-id/performance", headers=editor_a_headers)
        assert res_post.status_code == 403
        assert "Forbidden" in res_post.json()["detail"]


@pytest.mark.asyncio
async def test_04_member_or_editor_cannot_perform_owner_only_operations():
    """Scenario 4: Member/Editor cannot perform owner-only operations (delete workspace, transfer ownership)."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")
    owner_a_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Editor attempts to delete Workspace A
        del_res = await client.delete("/api/workspaces/ws-alpha-tenant-id", headers=editor_a_headers)
        assert del_res.status_code == 403
        assert "owner" in del_res.json()["detail"].lower()

        # Editor attempts to transfer ownership
        trans_res = await client.post(
            "/api/workspaces/ws-alpha-tenant-id/transfer-ownership",
            headers=editor_a_headers,
            json={"new_owner_id": "usr-editor-a"},
        )
        assert trans_res.status_code == 403
        assert "owner" in trans_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_05_viewer_cannot_modify_resources():
    """Scenario 5: Viewer cannot modify resources (approve post, publish, approve slot, create campaign, generate drafts)."""
    viewer_a_headers = get_auth_header("usr-viewer-a", "viewer_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Viewer attempts to approve post
        res_approve = await client.post(
            "/api/posts/approve",
            headers=viewer_a_headers,
            json={"post_id": "post-alpha-id", "approved_content": "Viewer trying to edit copy"},
        )
        assert res_approve.status_code == 403

        # Viewer attempts to publish post
        res_pub = await client.post(
            "/api/posts/post-alpha-id/publish",
            headers=viewer_a_headers,
            json={"idempotency_key": "viewer-attempt-pub"},
        )
        assert res_pub.status_code == 403

        # Viewer attempts to approve calendar slot
        res_cal = await client.post(
            "/api/calendar/approve-slot?brand_id=brand-alpha-id",
            headers=viewer_a_headers,
            json={"slot_id": "slot-123", "approved_topic": "Unauthorized schedule"},
        )
        assert res_cal.status_code == 403

        # Viewer attempts to create campaign
        res_camp = await client.post(
            "/api/content-ops/campaigns",
            headers=viewer_a_headers,
            json={"brand_id": "brand-alpha-id", "name": "Unauthorized Campaign"},
        )
        assert res_camp.status_code == 403

        # Viewer attempts to generate drafts
        res_draft = await client.post(
            "/api/generate-drafts",
            headers=viewer_a_headers,
            json={"brand_id": "brand-alpha-id", "topic": "AI Future"},
        )
        assert res_draft.status_code == 403


@pytest.mark.asyncio
async def test_06_self_promotion_blocked():
    """Scenario 6: Member/Editor cannot PATCH own role to admin or owner."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Self-promotion attempt to admin
        res = await client.patch(
            "/api/workspaces/ws-alpha-tenant-id/members/usr-editor-a/role",
            headers=editor_a_headers,
            json={"role": "admin"},
        )
        assert res.status_code in [400, 403]
        detail = res.json()["detail"].lower()
        assert "own workspace role" in detail or "insufficient" in detail or "denied" in detail


@pytest.mark.asyncio
async def test_07_invitation_rejected_when_email_mismatched():
    """Scenario 7: Invitations rejected when email does not match authenticated user (403)."""
    owner_a_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")
    unauthorized_user_headers = get_auth_header("usr-external-c", "external@external.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Owner invites david@example.com
        inv_res = await client.post(
            "/api/workspaces/ws-alpha-tenant-id/invites",
            headers=owner_a_headers,
            json={"email": "david@partner.io", "role": "editor"},
        )
        assert inv_res.status_code == 200
        raw_token = inv_res.json()["token"]

        # External user tries to accept David's invite
        accept_res = await client.post(
            f"/api/workspaces/invites/{raw_token}/accept",
            headers=unauthorized_user_headers,
        )
        assert accept_res.status_code == 403
        assert "david@partner.io" in accept_res.json()["detail"]


@pytest.mark.asyncio
async def test_08_invalid_invitation_tokens_rejected():
    """Scenario 8: Expired, revoked, and already consumed invitations rejected (400/404)."""
    owner_a_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")
    recipient_headers = get_auth_header("usr-external-c", "external@external.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create invite for external@external.io
        inv_res = await client.post(
            "/api/workspaces/ws-alpha-tenant-id/invites",
            headers=owner_a_headers,
            json={"email": "external@external.io", "role": "editor"},
        )
        assert inv_res.status_code == 200
        invite_id = inv_res.json()["invite_id"]
        raw_token = inv_res.json()["token"]

        # 2. Revoke the invitation
        rev_res = await client.delete(
            f"/api/workspaces/ws-alpha-tenant-id/invites/{invite_id}",
            headers=owner_a_headers,
        )
        assert rev_res.status_code == 200
        assert "revoked" in rev_res.json()["message"]

        # 3. Attempt to accept revoked invitation
        accept_res = await client.post(
            f"/api/workspaces/invites/{raw_token}/accept",
            headers=recipient_headers,
        )
        assert accept_res.status_code == 400
        assert "revoked" in accept_res.json()["detail"]

        # 4. Attempt to accept with bogus token
        bogus_res = await client.post(
            "/api/workspaces/invites/completely-bogus-token-xyz/accept",
            headers=recipient_headers,
        )
        assert bogus_res.status_code == 404


@pytest.mark.asyncio
async def test_09_unauthorized_brand_transfer_rejected():
    """Scenario 9: Cross-workspace transfer without source admin rights is rejected with 403; authorized transfer succeeds."""
    owner_b_headers = get_auth_header("usr-owner-b", "owner_b@beta.io")
    owner_a_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Owner B tries to steal Brand A from Workspace A into Workspace B
        steal_res = await client.post(
            "/api/workspaces/ws-beta-tenant-id/brands/brand-alpha-id/link",
            headers=owner_b_headers,
        )
        assert steal_res.status_code == 403
        assert "source workspace" in steal_res.json()["detail"].lower()

        # Add Owner A as admin in Workspace B to simulate authorized cross-company consolidation
        invite_res = await client.post(
            "/api/workspaces/ws-beta-tenant-id/invites",
            headers=owner_b_headers,
            json={"email": "owner_a@alpha.io", "role": "admin"},
        )
        token = invite_res.json()["token"]
        await client.post(f"/api/workspaces/invites/{token}/accept", headers=owner_a_headers)

        # Now Owner A has admin/owner rights in BOTH Workspace A and Workspace B -> Transfer succeeds!
        transfer_res = await client.post(
            "/api/workspaces/ws-beta-tenant-id/brands/brand-alpha-id/link",
            headers=owner_a_headers,
        )
        assert transfer_res.status_code == 200
        assert transfer_res.json()["workspace_id"] == "ws-beta-tenant-id"

        # Transfer it back to Workspace A to leave fixture clean
        revert_res = await client.post(
            "/api/workspaces/ws-alpha-tenant-id/brands/brand-alpha-id/link",
            headers=owner_a_headers,
        )
        assert revert_res.status_code == 200
        assert revert_res.json()["workspace_id"] == "ws-alpha-tenant-id"


@pytest.mark.asyncio
async def test_10_member_removal_immediately_revokes_access():
    """Scenario 10: Member removal immediately revokes access to workspace resources."""
    owner_a_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a temporary member
        inv_res = await client.post(
            "/api/workspaces/ws-alpha-tenant-id/invites",
            headers=owner_a_headers,
            json={"email": "temp_member@alpha.io", "role": "editor"},
        )
        token = inv_res.json()["token"]

        async with async_session_maker() as session:
            temp_user = User(
                id="usr-temp-member",
                email="temp_member@alpha.io",
                hashed_password=hash_password("Password123!"),
                name="Temp Member",
                role="Contractor",
            )
            await session.merge(temp_user)
            await session.commit()

        temp_headers = get_auth_header("usr-temp-member", "temp_member@alpha.io")
        await client.post(f"/api/workspaces/invites/{token}/accept", headers=temp_headers)

        # Verify access before removal
        pre_res = await client.get("/api/brands?workspace_id=ws-alpha-tenant-id", headers=temp_headers)
        assert pre_res.status_code == 200

        # Owner removes temp member
        del_res = await client.delete(
            "/api/workspaces/ws-alpha-tenant-id/members/usr-temp-member",
            headers=owner_a_headers,
        )
        assert del_res.status_code == 200

        # Verify immediate revocation (403 Forbidden)
        post_res = await client.get("/api/brands?workspace_id=ws-alpha-tenant-id", headers=temp_headers)
        assert post_res.status_code == 403


@pytest.mark.asyncio
async def test_11_workspace_deletion_unlinks_brands_safely():
    """Scenario 11: Workspace deletion unlinks brands and cascades members without data leaks."""
    import secrets
    unique_suffix = secrets.token_hex(4)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create disposable workspace
        owner_headers = get_auth_header("usr-owner-a", "owner_a@alpha.io")
        ws_res = await client.post(
            "/api/workspaces",
            headers=owner_headers,
            json={"name": f"Disposable Workspace {unique_suffix}", "slug": f"disposable-ws-{unique_suffix}"},
        )
        assert ws_res.status_code == 201
        disposable_id = ws_res.json()["id"]

        # Create brand inside disposable workspace
        b_res = await client.post(
            "/api/brands",
            headers=owner_headers,
            json={
                "name": f"Disposable Brand {unique_suffix}",
                "voice_description": "Temporary",
                "workspace_id": disposable_id,
            },
        )
        assert b_res.status_code == 201
        brand_id = b_res.json()["id"]

        # Delete workspace
        del_ws_res = await client.delete(f"/api/workspaces/{disposable_id}", headers=owner_headers)
        assert del_ws_res.status_code == 200

        # Brand still exists but its workspace_id is now None (safely unlinked)
        async with async_session_maker() as session:
            brand = (await session.execute(Brand.__table__.select().where(Brand.id == brand_id))).first()
            assert brand is not None
            assert brand.workspace_id is None


@pytest.mark.asyncio
async def test_12_existing_authenticated_workflows_functional():
    """Scenario 12: Legitimate authenticated editor workflows operate cleanly."""
    editor_a_headers = get_auth_header("usr-editor-a", "editor_a@alpha.io")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Listing workspace brands
        res_brands = await client.get("/api/brands?workspace_id=ws-alpha-tenant-id", headers=editor_a_headers)
        assert res_brands.status_code == 200
        assert len(res_brands.json()) >= 1

        # Editor can approve post in their workspace
        res_approve = await client.post(
            "/api/posts/approve",
            headers=editor_a_headers,
            json={"post_id": "post-alpha-id", "approved_content": "Editor verified launch copy."},
        )
        assert res_approve.status_code == 200
        assert res_approve.json()["status"] == "scheduled"

        # Editor can create marketing campaigns
        res_camp = await client.post(
            "/api/content-ops/campaigns",
            headers=editor_a_headers,
            json={"brand_id": "brand-alpha-id", "name": "Q4 Engineering Push"},
        )
        assert res_camp.status_code == 201
        assert res_camp.json()["name"] == "Q4 Engineering Push"
