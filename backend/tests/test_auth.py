"""
Integration tests for real authentication & session validation:
- Password hashing with bcrypt
- JWT issue and validation
- Registration and login flows
- Protection of /api/auth/me
- Explicit demo sandbox session creation
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_auth_registration_and_login_flow():
    transport = ASGITransport(app=app)
    unique_email = f"architect_{uuid.uuid4().hex[:6]}@enterprise.com"
    password = "SecurePassword2026!"
    name = "Elena Rostova"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register new user
        reg_res = await client.post(
            "/api/auth/register",
            json={
                "email": unique_email,
                "password": password,
                "name": name,
                "role": "Lead Systems Architect",
            },
        )
        assert reg_res.status_code == 201
        reg_data = reg_res.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["email"] == unique_email
        assert reg_data["user"]["name"] == name
        assert reg_data["user"]["is_demo"] is False

        # 2. Duplicate registration attempt should be rejected with 400
        dup_res = await client.post(
            "/api/auth/register",
            json={
                "email": unique_email,
                "password": "AnotherPassword!",
                "name": name,
            },
        )
        assert dup_res.status_code == 400

        # 3. Login with correct password
        login_res = await client.post(
            "/api/auth/login",
            json={"email": unique_email, "password": password},
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        token = login_data["access_token"]
        assert token

        # 4. Login with incorrect password should be rejected with 401
        bad_login = await client.post(
            "/api/auth/login",
            json={"email": unique_email, "password": "WrongPassword!"},
        )
        assert bad_login.status_code == 401

        # 5. Access /api/auth/me with Bearer token
        me_res = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["email"] == unique_email
        assert me_data["name"] == name
        assert me_data["is_demo"] is False


@pytest.mark.asyncio
async def test_auth_me_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # No header
        res1 = await client.get("/api/auth/me")
        assert res1.status_code == 401

        # Invalid token
        res2 = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.fake.token"},
        )
        assert res2.status_code == 401


@pytest.mark.asyncio
async def test_auth_demo_session():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/auth/demo-session")
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["is_demo"] is True

        token = data["access_token"]
        me_res = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["is_demo"] is True
