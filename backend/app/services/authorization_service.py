"""
Authorization & Resource Ownership Service.
Enforces multi-tenant data boundaries, user resource ownership, and workspace RBAC.
Pocock-OS Deep Module: encapsulates resource access verification behind a clean public seam.
"""
import re
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.models.experiment import ContentExperiment
from app.models.workspace import WorkspaceMember
from app.schemas.auth import UserResponse
from app.routers.auth import is_admin_user
from app.services.workspace_service import get_member_role, require_role


async def get_user_workspace_ids(db: AsyncSession, user_id: str) -> List[str]:
    """Retrieves list of workspace IDs where user is an active member."""
    stmt = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def check_brand_access(
    db: AsyncSession,
    brand: Brand,
    current_user: Optional[UserResponse],
    min_role: str = "viewer",
) -> bool:
    """
    Checks if current_user has access to the brand.
    Access granted if:
    1. User is platform admin / superuser.
    2. Brand user_id matches current_user.id.
    3. Brand workspace_id is in user's memberships with at least min_role.
    4. Unassigned brand in demo mode.
    """
    if not current_user:
        return False

    if is_admin_user(current_user):
        return True

    # If brand belongs to a workspace, workspace tenant isolation and RBAC strictly govern access
    if brand.workspace_id:
        role = await get_member_role(db, brand.workspace_id, current_user.id)
        if role and require_role(role, min_role):
            return True
        return False

    # Standalone personal brand (no workspace attached)
    if brand.user_id and brand.user_id == current_user.id:
        return True

    if not brand.user_id and not brand.workspace_id:
        # Legacy/demo unassigned record: allow demo user or claim for caller
        if current_user.is_demo:
            return True
        brand.user_id = current_user.id
        return True

    return False


async def verify_brand_access(
    db: AsyncSession,
    brand_id: str,
    current_user: Optional[UserResponse],
    min_role: str = "viewer",
) -> Brand:
    """
    Verifies that brand exists and caller is authorized to access it.
    Raises 404 if not found, 403 if unauthorized.
    """
    stmt = select(Brand).where(Brand.id == brand_id)
    res = await db.execute(stmt)
    brand = res.scalar_one_or_none()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with id '{brand_id}' not found.",
        )

    has_access = await check_brand_access(db, brand, current_user, min_role)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have access to this brand's resources.",
        )
    return brand


async def verify_post_access(
    db: AsyncSession,
    post_id: str,
    current_user: UserResponse,
    min_role: str = "viewer",
) -> Tuple[Post, Optional[Brand]]:
    """
    Verifies post existence and asserts ownership/workspace authorization via brand.
    Raises 404 if not found, 403 if unauthorized.
    """
    stmt = select(Post).where(Post.id == post_id)
    res = await db.execute(stmt)
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id '{post_id}' not found.",
        )

    brand = None
    if post.brand_id:
        brand = await verify_brand_access(db, post.brand_id, current_user, min_role)
    return post, brand


async def verify_memory_access(
    db: AsyncSession,
    memory_id: str,
    current_user: UserResponse,
    min_role: str = "viewer",
) -> Tuple[AgentMemory, Optional[Brand]]:
    """
    Verifies agent memory existence and asserts authorization.
    """
    stmt = select(AgentMemory).where(AgentMemory.id == memory_id)
    res = await db.execute(stmt)
    memory = res.scalar_one_or_none()
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent memory with id '{memory_id}' not found.",
        )

    brand = None
    if memory.brand_id:
        brand = await verify_brand_access(db, memory.brand_id, current_user, min_role)
    return memory, brand


async def verify_experiment_access(
    db: AsyncSession,
    experiment_id: str,
    current_user: UserResponse,
    min_role: str = "viewer",
) -> ContentExperiment:
    """
    Verifies content experiment existence and asserts authorization.
    """
    stmt = select(ContentExperiment).where(ContentExperiment.id == experiment_id)
    res = await db.execute(stmt)
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with id '{experiment_id}' not found.",
        )

    if exp.brand_id:
        await verify_brand_access(db, exp.brand_id, current_user, min_role)
    return exp


async def get_accessible_brand_ids(
    db: AsyncSession,
    current_user: UserResponse,
    workspace_id: Optional[str] = None,
) -> Optional[List[str]]:
    """
    Returns list of brand IDs accessible to current_user.
    Returns None if user is admin (unrestricted access) and no workspace filter is specified.
    """
    if workspace_id:
        role = await get_member_role(db, workspace_id, current_user.id)
        if not role and not is_admin_user(current_user):
            return []
        stmt = select(Brand.id).where(Brand.workspace_id == workspace_id)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    if is_admin_user(current_user):
        return None

    workspace_ids = await get_user_workspace_ids(db, current_user.id)
    conditions = [and_(Brand.user_id == current_user.id, Brand.workspace_id.is_(None))]
    if workspace_ids:
        conditions.append(Brand.workspace_id.in_(workspace_ids))
    if current_user.is_demo:
        conditions.append(and_(Brand.user_id.is_(None), Brand.workspace_id.is_(None)))

    stmt = select(Brand.id).where(or_(*conditions))
    res = await db.execute(stmt)
    return list(res.scalars().all())


def sanitize_handle(handle: str, lowercase: bool = False) -> str:
    """Sanitizes creator handle to prevent path traversal and injection attacks."""
    if not handle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Creator handle cannot be empty.",
        )
    raw = handle.strip().lstrip("@")
    if not raw or not re.match(r"^[a-zA-Z0-9._-]{1,50}$", raw) or ".." in raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid creator handle format.",
        )
    clean = raw.strip(".")
    return clean.lower() if lowercase else clean
