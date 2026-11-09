"""
Cryptographic security and JWT token management module for SocioTrack.
Implements bcrypt password hashing, HMAC-SHA256 JWT tokens, and token revocation checks.
"""

import re
import uuid
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status

try:
    from app.config import settings
    from app.core.token_blocklist import token_blocklist
except ImportError:
    from backend.app.config import settings
    from backend.app.core.token_blocklist import token_blocklist


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with random salt (cost factor 12)."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def validate_password_strength(password: str) -> None:
    """
    Validates password complexity:
    - Minimum 8 characters.
    - Contains at least one letter.
    - Contains at least one digit or special character.
    Raises 400 Bad Request if invalid.
    """
    if not password or len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    if not re.search(r"[a-zA-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter.",
        )
    if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':\",.<>?/\\|`~]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number or special character.",
        )


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    token_type: str = "access",
) -> str:
    """
    Creates a cryptographically signed JWT access token containing explicit claims:
    - sub: subject (user id)
    - jti: unique token identifier for revocation tracking
    - token_type: token scope ('access')
    - iat: issued at timestamp
    - exp: expiration timestamp
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Required claims
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": to_encode.get("jti") or str(uuid.uuid4()),
        "token_type": token_type,
    })

    # Strict algorithm signing
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str, verify_revocation: bool = True) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token:
    - Verifies HMAC signature with configured SECRET_KEY.
    - Strictly restricts allowed algorithm to configured ALGORITHM (HS256).
    - Checks expiration and required claims ('sub', 'exp', 'iat').
    - Verifies token has not been revoked in the token blocklist.
    Returns decoded claims payload, or None if invalid/expired/revoked.
    """
    try:
        # Pre-check header to strictly disallow 'none' algorithm or mismatched algorithms
        unverified_headers = jwt.get_unverified_header(token)
        alg = unverified_headers.get("alg")
        if not alg or alg.lower() == "none" or alg != settings.ALGORITHM:
            return None

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "require": ["sub", "exp", "iat"],
            },
        )

        # Check token blocklist revocation
        if verify_revocation:
            jti = payload.get("jti")
            user_id = payload.get("sub")
            iat_raw = payload.get("iat")
            issued_at = datetime.fromtimestamp(iat_raw, tz=timezone.utc) if iat_raw else None
            if token_blocklist.is_token_revoked(jti=jti, user_id=user_id, issued_at=issued_at):
                return None

        return payload
    except (jwt.PyJWTError, Exception):
        return None
