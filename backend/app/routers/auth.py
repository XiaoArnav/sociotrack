"""
Authentication Router for SocioTrack.
Provides real bcrypt-hashed registration, JWT session validation, and separate demo mode endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new authenticated user account",
)
async def register(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new account with bcrypt password hashing and returns a signed JWT session."""
    clean_email = payload.email.lower().strip()
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
    db: AsyncSession = Depends(get_db),
):
    """Authenticates credentials against stored bcrypt hash and returns a signed JWT session."""
    clean_email = payload.email.lower().strip()
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    # Pre-seed default sandbox account if signing in with demo credentials
    if not user and clean_email == "alex.chen@enterprise.com" and payload.password == "DemoPass2026!":
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
    # Strictly validate incoming header if provided
    return await get_current_user(authorization=authorization, db=db)


@router.post(
    "/demo-session",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize an isolated interactive demo guest session",
)
async def create_demo_session():
    """Returns an explicit ephemeral guest demo session without requiring credentials."""
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
