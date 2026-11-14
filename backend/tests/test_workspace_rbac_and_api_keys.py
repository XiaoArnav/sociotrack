"""
Unit and integration tests for Workspace Multi-Tenancy, Team RBAC, Scoped API Keys, and Audit Logs.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db, init_db, async_session_maker
from app.models.user import User
from app.models.brand import Brand
from app.models.workspace import Workspace, WorkspaceMember, ApiKey, AuditLog
from app.routers.auth import hash_password, create_access_token
from app.services.workspace_service import verify_api_key


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with async_session_maker() as session:
        # Create or merge test users: owner, admin, viewer
        owner = User(
            id="test-ws-owner-1",
            email="owner@sociotrack.io",
            hashed_password=hash_password("Password123!"),
            name="Alice Owner",
            role="Systems Architect",
        )
        editor = User(
            id="test-ws-editor-2",
            email="editor@sociotrack.io",
            hashed_password=hash_password("Password123!"),
            name="Bob Editor",
            role="Content Lead",
        )
        viewer = User(
            id="test-ws-viewer-3",
            email="viewer@sociotrack.io",
            hashed_password=hash_password("Password123!"),
            name="Charlie Viewer",
            role="Auditor",
        )
        await session.merge(owner)
        await session.merge(editor)
        await session.merge(viewer)

        # Test brand
        brand = Brand(
            id="brand-multi-ws-1",
            name="Nike Athletic Growth",
            voice_description="Direct, aspirational",
            user_id="test-ws-owner-1",
        )
        await session.merge(brand)
        await session.commit()


@pytest.mark.asyncio
async def test_01_create_workspace_assigns_owner():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    headers = {"Authorization": f"Bearer {owner_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/workspaces",
            json={"name": "Acme Global Agency", "slug": "acme-global"},
            headers=headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Acme Global Agency"
        assert data["slug"].startswith("acme-global")
        assert data["role"] == "owner"
        workspace_id = data["id"]

        # Verify listing
        list_res = await client.get("/api/workspaces", headers=headers)
        assert list_res.status_code == 200
        ws_list = list_res.json()["workspaces"]
        assert any(w["id"] == workspace_id and w["role"] == "owner" for w in ws_list)


@pytest.mark.asyncio
async def test_02_multi_brand_linking_and_switching():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    headers = {"Authorization": f"Bearer {owner_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create workspace
        ws_res = await client.post("/api/workspaces", json={"name": "MultiBrand Hub"}, headers=headers)
        ws_id = ws_res.json()["id"]

        # Link brand
        link_res = await client.post(f"/api/workspaces/{ws_id}/brands/brand-multi-ws-1/link", headers=headers)
        assert link_res.status_code == 200
        assert link_res.json()["workspace_id"] == ws_id

        # Verify details
        details_res = await client.get(f"/api/workspaces/{ws_id}", headers=headers)
        assert details_res.status_code == 200
        brands = details_res.json()["brands"]
        assert len(brands) == 1
        assert brands[0]["id"] == "brand-multi-ws-1"


@pytest.mark.asyncio
async def test_03_team_invite_acceptance_and_rbac():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    editor_token = create_access_token({"sub": "test-ws-editor-2", "email": "editor@sociotrack.io"})

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create workspace
        ws_res = await client.post(
            "/api/workspaces",
            json={"name": "Collaboration Studio"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        ws_id = ws_res.json()["id"]

        # 2. Invite Bob as editor
        invite_res = await client.post(
            f"/api/workspaces/{ws_id}/invites",
            json={"email": "editor@sociotrack.io", "role": "editor"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert invite_res.status_code == 200
        token = invite_res.json()["token"]

        # 3. Bob accepts invite
        accept_res = await client.post(
            f"/api/workspaces/invites/{token}/accept",
            headers={"Authorization": f"Bearer {editor_token}"},
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["role"] == "editor"

        # 4. Verify Bob can view workspace
        bob_details = await client.get(
            f"/api/workspaces/{ws_id}",
            headers={"Authorization": f"Bearer {editor_token}"},
        )
        assert bob_details.status_code == 200
        assert bob_details.json()["user_role"] == "editor"


@pytest.mark.asyncio
async def test_04_rbac_forbidden_for_insufficient_role():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    viewer_token = create_access_token({"sub": "test-ws-viewer-3", "email": "viewer@sociotrack.io"})

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create workspace
        ws_res = await client.post(
            "/api/workspaces",
            json={"name": "Secure Workspace"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        ws_id = ws_res.json()["id"]

        # Invite Charlie as viewer
        invite_res = await client.post(
            f"/api/workspaces/{ws_id}/invites",
            json={"email": "viewer@sociotrack.io", "role": "viewer"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        token = invite_res.json()["token"]

        # Charlie accepts
        await client.post(
            f"/api/workspaces/invites/{token}/accept",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )

        # Charlie attempts admin action (creating API key) -> should return 403 Forbidden
        forbidden_res = await client.post(
            f"/api/workspaces/{ws_id}/api-keys",
            json={"name": "Viewer Key", "scopes": ["read:analytics"]},
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert forbidden_res.status_code == 403
        assert "Insufficient permissions" in forbidden_res.json()["detail"]


@pytest.mark.asyncio
async def test_05_scoped_api_key_issuance_and_revocation():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    headers = {"Authorization": f"Bearer {owner_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create workspace
        ws_res = await client.post("/api/workspaces", json={"name": "Developer Tenant"}, headers=headers)
        ws_id = ws_res.json()["id"]

        # Issue API key
        key_res = await client.post(
            f"/api/workspaces/{ws_id}/api-keys",
            json={"name": "CI Bot Key", "scopes": ["read:analytics", "write:content"]},
            headers=headers,
        )
        assert key_res.status_code == 201
        key_data = key_res.json()
        raw_key = key_data["api_key"]
        key_id = key_data["id"]
        assert raw_key.startswith("st_live_")

        # Verify programmatic validation using service
        async with async_session_maker() as session:
            verified = await verify_api_key(session, raw_key, required_scope="read:analytics")
            assert verified.id == key_id

            # Scope check failure
            with pytest.raises(Exception) as exc:
                await verify_api_key(session, raw_key, required_scope="admin:workspace")
            assert "lacks required scope" in str(exc.value)

        # Revoke API key
        revoke_res = await client.delete(f"/api/workspaces/{ws_id}/api-keys/{key_id}", headers=headers)
        assert revoke_res.status_code == 200

        # Verify key fails after revocation
        async with async_session_maker() as session:
            with pytest.raises(Exception) as exc:
                await verify_api_key(session, raw_key)
            assert "invalid or deactivated" in str(exc.value)


@pytest.mark.asyncio
async def test_06_audit_logs_recorded():
    owner_token = create_access_token({"sub": "test-ws-owner-1", "email": "owner@sociotrack.io"})
    headers = {"Authorization": f"Bearer {owner_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        ws_res = await client.post("/api/workspaces", json={"name": "Audited Organization"}, headers=headers)
        ws_id = ws_res.json()["id"]

        # Fetch audit logs
        logs_res = await client.get(f"/api/workspaces/{ws_id}/audit-logs", headers=headers)
        assert logs_res.status_code == 200
        logs = logs_res.json()["audit_logs"]
        assert len(logs) >= 1
        assert logs[0]["action"] == "workspace.created"
