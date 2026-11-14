"""
Workspace Service: RBAC evaluation, secure API key generation/hashing,
audit logging, and multi-tenancy enforcement.
"""

import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from fastapi import HTTPException, status, Header, Depends
from app.database import get_db
from app.models.workspace import (
    Workspace,
    WorkspaceMember,
    WorkspaceInvite,
    ApiKey,
    AuditLog,
)
from app.models.user import User
from app.routers.auth import get_current_user

# Role hierarchy: higher integer = more privileges
ROLE_LEVELS: Dict[str, int] = {
    "viewer": 1,
    "editor": 2,
    "admin": 3,
    "owner": 4,
}


def hash_secret(secret: str) -> str:
    """Computes SHA-256 hex digest of a secret key or token."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


async def record_audit_log(
    db: AsyncSession,
    workspace_id: Optional[str] = None,
    action: str = "audit.action",
    resource_type: str = "general",
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Appends an immutable entry to the workspace audit trail."""
    log_entry = AuditLog(
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_json=json.dumps(metadata or {}),
        ip_address=ip_address,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry


async def get_member_role(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> Optional[str]:
    """Retrieves the RBAC role for a given user in a workspace."""
    stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    res = await db.execute(stmt)
    member = res.scalars().first()
    return member.role if member else None


def require_role(member_role: str, required_role: str) -> bool:
    """Validates whether member_role meets or exceeds required_role in the hierarchy."""
    user_level = ROLE_LEVELS.get(member_role, 0)
    req_level = ROLE_LEVELS.get(required_role, 0)
    return user_level >= req_level


async def issue_api_key(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    name: str,
    scopes: List[str],
    expires_in_days: Optional[int] = 90,
) -> Tuple[ApiKey, str]:
    """
    Issues a new scoped programmatic API key (e.g. st_live_...).
    Returns (ApiKey record, raw_plaintext_secret_key). The raw key is never stored in plaintext.
    """
    prefix = secrets.token_hex(4)  # 8 chars
    secret_part = secrets.token_urlsafe(32)  # 43 chars
    raw_key = f"st_live_{prefix}_{secret_part}"
    hashed = hash_secret(raw_key)

    expires_at = None
    if expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    key_record = ApiKey(
        workspace_id=workspace_id,
        user_id=user_id,
        name=name,
        key_prefix=f"st_live_{prefix}",
        hashed_key=hashed,
        scopes=",".join(scopes),
        is_active=True,
        expires_at=expires_at,
    )
    db.add(key_record)
    await db.commit()
    await db.refresh(key_record)

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=user_id,
        action="api_key.created",
        resource_type="api_key",
        resource_id=key_record.id,
        metadata={"name": name, "scopes": scopes, "prefix": key_record.key_prefix},
    )

    return key_record, raw_key


async def verify_api_key(
    db: AsyncSession,
    raw_key: str,
    required_scope: Optional[str] = None,
) -> ApiKey:
    """
    Validates a raw bearer API key against stored hashed keys.
    Verifies expiration, activity status, and optional required scope.
    """
    if not raw_key.startswith("st_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format. Expected 'st_live_...' prefix.",
        )

    hashed = hash_secret(raw_key)
    stmt = select(ApiKey).where(ApiKey.hashed_key == hashed)
    res = await db.execute(stmt)
    key_record = res.scalars().first()

    if not key_record or not key_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is invalid or deactivated.",
        )

    if key_record.expires_at:
        exp_at = key_record.expires_at
        if exp_at.tzinfo is None:
            exp_at = exp_at.replace(tzinfo=timezone.utc)
        if exp_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired.",
            )

    if required_scope:
        allowed = [s.strip() for s in key_record.scopes.split(",") if s.strip()]
        if required_scope not in allowed and "admin:workspace" not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key lacks required scope '{required_scope}'.",
            )

    # Update last_used_at
    key_record.last_used_at = datetime.now(timezone.utc)
    await db.commit()

    return key_record
