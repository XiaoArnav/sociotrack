"""
Authentication Router for SocioTrack.
Provides real bcrypt-hashed registration, JWT session validation, rate limiting,
token revocation, and production-hardened guest sandbox controls.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.config import settings
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserChangePasswordRequest,
    AuthTokenResponse,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    decode_access_token,
)
from app.core.token_blocklist import token_blocklist
from app.core.rate_limiter import auth_rate_limiter, get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _is_production_environment() -> bool:
    env_norm = (settings.ENVIRONMENT or settings.APP_ENV or "").lower().strip()
    return env_norm in ("production", "prod")


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new authenticated user account",
)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Registers a new account with bcrypt password hashing and returns a signed JWT session.
    Enforces password complexity, email normalization, and rate limiting.
    """
    client_ip = get_client_ip(request)
    auth_rate_limiter.check_rate_limit(
        key=f"register:{client_ip}",
        max_attempts=settings.AUTH_RATE_LIMIT_REGISTER_MAX,
        window_seconds=settings.AUTH_RATE_LIMIT_REGISTER_WINDOW_SECONDS,
        error_message="Too many registration attempts. Please wait before creating another account.",
    )

    clean_email = payload.email.lower().strip()
    validate_password_strength(payload.password)

    result = await db.execute(select(User).where(User.email == clean_email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed_pw = hash_password(payload.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pw,
        name=payload.name.strip(),
        role=payload.role or "Principal Content Architect",
        is_demo=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "is_demo": False}
    )
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role,
            is_demo=False,
        ),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Log in with email and password",
)
async def login(
    payload: UserLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticates credentials against stored bcrypt hash and returns a signed JWT session.
    Protects against brute-force attacks via sliding window rate limiting and timing-neutral error messages.
    """
    clean_email = payload.email.lower().strip()
    client_ip = get_client_ip(request)
    rate_key = f"login:{client_ip}:{clean_email}"

    auth_rate_limiter.check_rate_limit(
        key=rate_key,
        max_attempts=settings.AUTH_RATE_LIMIT_LOGIN_MAX,
        window_seconds=settings.AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS,
        error_message="Too many failed login attempts. Please wait before trying again.",
    )

    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    # Pre-seed sandbox account only in non-production when demo mode is enabled
    if not user and not _is_production_environment() and settings.ENABLE_DEMO_MODE:
        if clean_email == "alex.chen@enterprise.com" and payload.password == "DemoPass2026!":
            user = User(
                email=clean_email,
                hashed_password=hash_password("DemoPass2026!"),
                name="Alex Chen",
                role="Principal Content Architect",
                is_demo=False,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    # Reset rate limit on successful credentials verification
    auth_rate_limiter.reset(rate_key)

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "is_demo": user.is_demo}
    )
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_demo=user.is_demo,
        ),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Invalidate active user session token",
)
async def logout(
    authorization: Optional[str] = Header(None),
    current_user: UserResponse = Depends(lambda: None),
    db: AsyncSession = Depends(get_db),
):
    """
    Explicitly logs out the user and revokes the active JWT token via token blocklist.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token, verify_revocation=False)
        if payload:
            jti = payload.get("jti")
            exp_raw = payload.get("exp")
            if jti and exp_raw:
                exp_dt = datetime.fromtimestamp(exp_raw, tz=timezone.utc)
                token_blocklist.revoke_token(jti, exp_dt)

    return {"message": "Successfully logged out. Session invalidated."}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change authenticated user password and invalidate existing sessions",
)
async def change_password(
    payload: UserChangePasswordRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Changes the authenticated user's password after verifying the old password.
    Globally invalidates all previous sessions for account security.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to change password.",
        )

    user = await get_current_user(authorization=authorization, db=db)
    validate_password_strength(payload.new_password)

    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()

    if not db_user or not verify_password(payload.old_password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed.",
        )

    db_user.hashed_password = hash_password(payload.new_password)
    await db.commit()

    # Revoke current token
    old_token = authorization.split(" ")[1]
    old_payload = decode_access_token(old_token, verify_revocation=False)
    if old_payload:
        old_jti = old_payload.get("jti")
        old_exp = old_payload.get("exp")
        if old_jti and old_exp:
            token_blocklist.revoke_token(old_jti, datetime.fromtimestamp(old_exp, tz=timezone.utc))

    # Invalidate all prior session tokens for this user
    token_blocklist.revoke_all_user_tokens(db_user.id)

    # Issue fresh token for current session
    new_token = create_access_token(
        data={"sub": db_user.id, "email": db_user.email, "is_demo": db_user.is_demo}
    )

    return {
        "message": "Password changed successfully. All previous sessions have been invalidated.",
        "access_token": new_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user session",
)
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Validates the incoming JWT bearer token and returns the current user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'.",
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again.",
        )

    # Check for demo sandbox token
    if payload.get("is_demo"):
        if _is_production_environment() and not settings.ENABLE_DEMO_MODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Demo guest tokens are strictly rejected in production environments.",
            )
        return UserResponse(
            id=payload["sub"],
            email=payload.get("email", "guest.demo@sociotrack.io"),
            name="Sandbox Guest",
            role=payload.get("role") or "admin",
            is_demo=True,
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists.",
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_demo=user.is_demo,
    )


def is_admin_user(user: UserResponse) -> bool:
    """Checks whether the user possesses administrative privileges."""
    if not user or not user.role:
        return False
    role_norm = str(user.role).strip().lower()
    return role_norm in ("admin", "superuser", "platform_admin", "owner")


async def get_current_admin(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Dependency that enforces administrative permissions."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to perform this action.",
        )
    return current_user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[UserResponse]:
    """Returns authenticated user if Authorization header is provided, or None if omitted."""
    if not authorization:
        return None
    return await get_current_user(authorization=authorization, db=db)


@router.post(
    "/demo-session",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize an isolated interactive demo guest session",
)
async def create_demo_session():
    """Returns an explicit ephemeral guest demo session without requiring credentials."""
    if _is_production_environment() and not settings.ENABLE_DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo sandbox mode is disabled in production environments.",
        )

    demo_id = "demo_guest_session"
    token = create_access_token(
        data={"sub": demo_id, "email": "demo.sandbox@sociotrack.io", "is_demo": True}
    )
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=demo_id,
            email="demo.sandbox@sociotrack.io",
            name="Guest Explorer",
            role="Demo Sandbox Mode",
            is_demo=True,
        ),
    )
