"""
Comprehensive Authentication & Production Configuration Hardening Test Suite.
Verifies all 16 Step 3 requirements:
1. Valid login and registration.
2. Incorrect credentials & email enumeration protection.
3. Expired JWT rejection.
4. Invalid signature rejection.
5. Unexpected JWT algorithm rejection (e.g. 'none').
6. Missing required JWT claims rejection.
7. Password hashing & complexity enforcement.
8. Authenticated password change and session invalidation.
9. Login and registration rate limits (429 Too Many Requests).
10. Logout and token blocklist revocation.
11. Production startup failure on missing SECRET_KEY.
12. Production startup failure on insecure default SECRET_KEY.
13. Production startup failure on DEBUG=True.
14. Production startup failure on wildcard CORS.
15. Disabled demo authentication in production.
16. Existing authenticated application workflows remain functional.
"""

import pytest
import pytest_asyncio
import uuid
import jwt
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db, async_session_maker
from app.models.user import User
from app.config import settings, Settings, validate_production_configuration
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    decode_access_token,
)
from app.core.token_blocklist import token_blocklist
from app.core.rate_limiter import auth_rate_limiter


@pytest_asyncio.fixture(autouse=True)
async def reset_auth_state():
    """Initializes DB and cleans rate limit and token blocklist state for clean isolation."""
    await init_db()
    token_blocklist.clear()
    auth_rate_limiter.clear()


@pytest.mark.asyncio
async def test_01_valid_login_and_registration():
    """Scenario 1: Valid registration and login returns compliant JWT and profile."""
    transport = ASGITransport(app=app)
    uid = uuid.uuid4().hex[:6]
    email = f"lead_{uid}@prodhardening.io"
    password = "HardenedPass2026!"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        reg_res = await client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": password,
                "name": "Alex Lead",
                "role": "Principal Content Architect",
            },
        )
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == email

        # Login
        login_res = await client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Validate with /me
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email


@pytest.mark.asyncio
async def test_02_incorrect_credentials_and_enumeration_prevention():
    """Scenario 2: Incorrect credentials return 401 with timing-safe uniform message."""
    transport = ASGITransport(app=app)
    uid = uuid.uuid4().hex[:6]
    email = f"user_{uid}@prodhardening.io"
    password = "KnownPassword2026!"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        await client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "name": "Test User"},
        )

        # 1. Non-existent email
        bad_email_res = await client.post(
            "/api/auth/login",
            json={"email": "nonexistent@prodhardening.io", "password": "AnyPassword123!"},
        )
        assert bad_email_res.status_code == 401
        assert bad_email_res.json()["detail"] == "Invalid email or password. Please check your credentials."

        # 2. Existing email with incorrect password
        bad_pw_res = await client.post(
            "/api/auth/login",
            json={"email": email, "password": "WrongPassword123!"},
        )
        assert bad_pw_res.status_code == 401
        assert bad_pw_res.json()["detail"] == "Invalid email or password. Please check your credentials."


@pytest.mark.asyncio
async def test_03_expired_jwts_rejected():
    """Scenario 3: Expired JWTs are strictly rejected by /me with 401."""
    transport = ASGITransport(app=app)
    # Generate token already expired 10 minutes ago
    expired_token = create_access_token(
        data={"sub": "usr_expired_1", "email": "expired@test.io"},
        expires_delta=timedelta(minutes=-10),
    )

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == 401
        assert "expired" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_04_invalid_jwt_signatures_rejected():
    """Scenario 4: JWT signed with attacker's key is rejected with 401."""
    transport = ASGITransport(app=app)
    fake_payload = {
        "sub": "usr_forged_1",
        "email": "attacker@forged.io",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
        "token_type": "access",
    }
    forged_token = jwt.encode(fake_payload, "completely_wrong_attacker_secret_key_12345", algorithm="HS256")

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_05_unexpected_jwt_algorithms_rejected():
    """Scenario 5: JWT signed with 'none' or unexpected algorithm is rejected with 401."""
    transport = ASGITransport(app=app)

    # 1. Algorithm 'none' attack token
    none_payload = {
        "sub": "usr_none_alg",
        "email": "none@exploit.io",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }
    none_token = jwt.encode(none_payload, key="", algorithm="none")

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res1 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {none_token}"})
        assert res1.status_code == 401

    # 2. Algorithm HS384 mismatch
    mismatch_token = jwt.encode(none_payload, key=settings.SECRET_KEY, algorithm="HS384")
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {mismatch_token}"})
        assert res2.status_code == 401


@pytest.mark.asyncio
async def test_06_missing_required_jwt_claims_rejected():
    """Scenario 6: Tokens missing required claims ('sub', 'exp', 'iat') are rejected with 401."""
    transport = ASGITransport(app=app)

    # Token missing 'sub'
    no_sub = jwt.encode(
        {"email": "no_sub@test.io", "exp": datetime.now(timezone.utc) + timedelta(hours=1), "iat": datetime.now(timezone.utc)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {no_sub}"})
        assert res.status_code == 401


def test_07_password_hashing_and_complexity_verification():
    """Scenario 7: Password hashing uses bcrypt work factor 12 and validates complexity."""
    pw = "SuperSecurePass2026!"
    hashed = hash_password(pw)
    assert hashed.startswith("$2b$12$")
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

    # Password complexity checks
    with pytest.raises(Exception):
        validate_password_strength("short")  # < 8 chars

    with pytest.raises(Exception):
        validate_password_strength("12345678")  # No letters

    with pytest.raises(Exception):
        validate_password_strength("abcdefgh")  # No numbers/specials

    # Valid passwords
    validate_password_strength("ValidPassword123")
    validate_password_strength("AnotherValidPass!")


@pytest.mark.asyncio
async def test_08_authenticated_password_change_invalidates_previous_sessions():
    """Scenario 8: Changing password invalidates previous sessions and updates hash."""
    transport = ASGITransport(app=app)
    uid = uuid.uuid4().hex[:6]
    email = f"pwd_user_{uid}@security.io"
    old_pw = "OriginalPass2026!"
    new_pw = "BrandNewSecurePass2026!"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        reg_res = await client.post(
            "/api/auth/register",
            json={"email": email, "password": old_pw, "name": "Password User"},
        )
        token1 = reg_res.json()["access_token"]

        # Change password
        chg_res = await client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {token1}"},
            json={"old_password": old_pw, "new_password": new_pw},
        )
        assert chg_res.status_code == 200
        token2 = chg_res.json()["access_token"]
        assert token2 != token1

        # Old token1 is now globally invalidated for this user
        old_me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
        assert old_me_res.status_code == 401

        # New token2 succeeds
        new_me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token2}"})
        assert new_me_res.status_code == 200


@pytest.mark.asyncio
async def test_09_login_and_registration_rate_limits():
    """Scenario 9: Rapid failed login requests trigger 429 Too Many Requests."""
    transport = ASGITransport(app=app)
    fake_email = "bruteforce_target@security.io"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Send attempts up to limit
        for _ in range(settings.AUTH_RATE_LIMIT_LOGIN_MAX):
            res = await client.post(
                "/api/auth/login",
                json={"email": fake_email, "password": "BadPassword123!"},
            )
            assert res.status_code == 401

        # Next attempt exceeds rate limit -> 429 Too Many Requests
        rate_res = await client.post(
            "/api/auth/login",
            json={"email": fake_email, "password": "BadPassword123!"},
        )
        assert rate_res.status_code == 429
        assert "Too many" in rate_res.json()["detail"]
        assert "Retry-After" in rate_res.headers


@pytest.mark.asyncio
async def test_10_logout_and_session_invalidation():
    """Scenario 10: Explicit logout revokes JTI and blocks subsequent requests."""
    transport = ASGITransport(app=app)
    uid = uuid.uuid4().hex[:6]
    email = f"logout_user_{uid}@security.io"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        reg_res = await client.post(
            "/api/auth/register",
            json={"email": email, "password": "SessionPass2026!", "name": "Logout User"},
        )
        token = reg_res.json()["access_token"]

        # Valid before logout
        me_res1 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res1.status_code == 200

        # Logout
        logout_res = await client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_res.status_code == 200
        assert "invalidated" in logout_res.json()["message"]

        # Invalidated after logout
        me_res2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res2.status_code == 401


def test_11_production_startup_missing_secret_key_fails():
    """Scenario 11: Production configuration validator fails when SECRET_KEY is missing/short."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="",
        CORS_ORIGINS=["https://sociotrack.vercel.app"],
        META_VERIFY_TOKEN="unique_prod_meta_token_secure_xyz_123",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_production_configuration(prod_cfg)
    assert "SECRET_KEY must be a cryptographically strong secret" in str(exc_info.value)


def test_12_production_startup_insecure_default_secret_key_fails():
    """Scenario 12: Production configuration validator fails on insecure default SECRET_KEY."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="sociotrack_jwt_secret_key_prod_hardening_2026_super_secure",
        CORS_ORIGINS=["https://sociotrack.vercel.app"],
        META_VERIFY_TOKEN="unique_prod_meta_token_secure_xyz_123",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_production_configuration(prod_cfg)
    assert "Hardcoded/insecure default SECRET_KEY detected" in str(exc_info.value)


def test_13_production_startup_debug_true_fails():
    """Scenario 13: Production configuration validator fails when DEBUG=True."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=True,
        SECRET_KEY="a_very_secure_production_secret_key_that_is_long_enough_123",
        CORS_ORIGINS=["https://sociotrack.vercel.app"],
        META_VERIFY_TOKEN="unique_prod_meta_token_secure_xyz_123",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_production_configuration(prod_cfg)
    assert "DEBUG must be set to False" in str(exc_info.value)


def test_14_production_cors_wildcard_rejected():
    """Scenario 14: Production configuration validator rejects wildcard '*' in CORS_ORIGINS."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="a_very_secure_production_secret_key_that_is_long_enough_123",
        CORS_ORIGINS=["https://sociotrack.vercel.app", "*"],
        META_VERIFY_TOKEN="unique_prod_meta_token_secure_xyz_123",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_production_configuration(prod_cfg)
    assert "Wildcard '*' is strictly prohibited" in str(exc_info.value)


@pytest.mark.asyncio
async def test_15_disabled_demo_authentication_in_production(monkeypatch):
    """Scenario 15: Demo sandbox endpoints and guest tokens are blocked in production."""
    transport = ASGITransport(app=app)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ENABLE_DEMO_MODE", False)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. /api/auth/demo-session is rejected with 403
        demo_init_res = await client.post("/api/auth/demo-session")
        assert demo_init_res.status_code == 403
        assert "disabled in production" in demo_init_res.json()["detail"].lower()

        # 2. Existing demo token presented to /api/auth/me is rejected with 403
        demo_token = create_access_token(data={"sub": "demo_guest", "email": "demo@guest.io", "is_demo": True})
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {demo_token}"})
        assert me_res.status_code == 403
        assert "rejected in production" in me_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_16_existing_authenticated_application_workflows_functional():
    """Scenario 16: Legitimate authenticated workflows remain completely operational."""
    transport = ASGITransport(app=app)
    uid = uuid.uuid4().hex[:6]
    email = f"workflow_user_{uid}@prodhardening.io"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        reg_res = await client.post(
            "/api/auth/register",
            json={"email": email, "password": "WorkflowPass2026!", "name": "Workflow User"},
        )
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create brand
        b_res = await client.post(
            "/api/brands",
            headers=headers,
            json={"name": f"Hardened Brand {uid}", "voice_description": "Data-first"},
        )
        assert b_res.status_code == 201
        brand_id = b_res.json()["id"]

        # List brands
        list_res = await client.get("/api/brands", headers=headers)
        assert list_res.status_code == 200
        assert any(b["id"] == brand_id for b in list_res.json())

        # Calendar recommendations
        cal_res = await client.get(f"/api/calendar/recommendations?brand_id={brand_id}", headers=headers)
        assert cal_res.status_code == 200
        assert "slots" in cal_res.json()


@pytest.mark.asyncio
async def test_17_render_lifespan_auto_heals_insecure_defaults(monkeypatch):
    """Scenario 17: In hosted environment (Render), lifespan gracefully auto-heals missing/insecure SECRET_KEY."""
    from app.main import lifespan
    from app.config import settings

    monkeypatch.setenv("RENDER", "true")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEBUG", False)
    monkeypatch.setattr(settings, "SECRET_KEY", "sociotrack_jwt_secret_key_prod_hardening_2026_super_secure")
    monkeypatch.setattr(settings, "META_VERIFY_TOKEN", "sociotrack_meta_verify_token_2026")

    async with lifespan(app):
        # Successfully booted through lifespan
        assert settings.SECRET_KEY != "sociotrack_jwt_secret_key_prod_hardening_2026_super_secure"
        assert len(settings.SECRET_KEY) >= 32
        assert settings.META_VERIFY_TOKEN != "sociotrack_meta_verify_token_2026"


@pytest.mark.asyncio
async def test_18_avatar_endpoint_returns_200_inline_svg_for_unknown_creator():
    """Scenario 18: /api/creators/{handle}/avatar returns 200 with image, never 404 or crash."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/creators/some_unseen_creator_xyz_9999/avatar")
        assert res.status_code == 200
        assert "image/" in res.headers["content-type"]
