"""
Pytest configuration and shared fixtures for SocioTrack backend tests.
"""
import pytest
import asyncio
from app.core.security import create_access_token
from app.database import init_db


@pytest.fixture(autouse=True, scope="session")
def setup_database_schema():
    """Initializes and migrates database tables prior to test execution."""
    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())
    loop.close()


def get_test_auth_headers(user_id: str = "usr_test_default", email: str = "test@sociotrack.com", role: str = "admin") -> dict:
    """Helper to generate JWT bearer authorization headers for tests."""
    token = create_access_token(data={"sub": user_id, "email": email, "role": role, "is_demo": True})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers():
    return get_test_auth_headers()


@pytest.fixture
def user_headers():
    return get_test_auth_headers(user_id="usr_test_regular", email="user@sociotrack.com", role="user")
