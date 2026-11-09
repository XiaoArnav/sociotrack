"""
Pytest configuration and shared fixtures for SocioTrack backend tests.
"""
import pytest
from app.core.security import create_access_token


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
