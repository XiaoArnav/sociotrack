"""
Workspaces, Team Collaboration, RBAC, API Keys, and Audit Trail API Router.
"""

import secrets
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from app.database import get_db
from app.models.user import User
from app.models.workspace import (
    Workspace,
    WorkspaceMember,
    WorkspaceInvite,
    ApiKey,
    AuditLog,
)
from app.models.brand import Brand
from app.routers.auth import get_current_user
from app.services.workspace_service import (
    get_member_role,
    require_role,
    record_audit_log,
    issue_api_key,
    verify_api_key,
    ROLE_LEVELS,
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Collaboration"])


# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None


class InviteCreate(BaseModel):
    email: str
    role: str = Field("editor", pattern="^(admin|editor|viewer)$")


class MemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(admin|editor|viewer)$")


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    scopes: List[str] = Field(default=["read:analytics", "write:content"])
    expires_in_days: Optional[int] = 90


# Helper to enforce RBAC in routes
async def check_user_access(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    min_role: str = "viewer",
) -> str:
    """Verifies user membership and asserts minimum role level."""
    role = await get_member_role(db, workspace_id, user_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not a member of this workspace.",
        )
    if not require_role(role, min_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Minimum role required: '{min_role}'. Your role: '{role}'.",
        )
    return role


# ---------------------------------------------------------
# Workspaces CRUD
# ---------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new workspace tenant and assigns the creator as 'owner'."""
    slug = payload.slug or re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    # Ensure slug uniqueness
    stmt = select(Workspace).where(Workspace.slug == slug)
    res = await db.execute(stmt)
    if res.scalars().first():
        slug = f"{slug}-{secrets.token_hex(3)}"

    workspace = Workspace(
        name=payload.name,
        slug=slug,
        owner_id=current_user.id,
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)

    # Add owner as workspace member
    owner_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(owner_member)
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace.id,
        user_id=current_user.id,
        action="workspace.created",
        resource_type="workspace",
        resource_id=workspace.id,
        metadata={"name": workspace.name, "slug": workspace.slug},
    )

    return {
        "id": workspace.id,
        "name": workspace.name,
        "slug": workspace.slug,
        "owner_id": workspace.owner_id,
        "created_at": workspace.created_at.isoformat(),
        "role": "owner",
    }


@router.get("")
async def list_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all workspaces the authenticated user belongs to."""
    stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    results = []
    for ws, role in res.all():
        # Count brands inside this workspace
        b_stmt = select(Brand).where(Brand.workspace_id == ws.id)
        b_res = await db.execute(b_stmt)
        brands_count = len(b_res.scalars().all())

        results.append({
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "owner_id": ws.owner_id,
            "role": role,
            "brands_count": brands_count,
            "created_at": ws.created_at.isoformat(),
        })

    return {"workspaces": results}


@router.get("/{workspace_id}")
async def get_workspace_details(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full workspace details, members, and contained brands."""
    user_role = await check_user_access(db, workspace_id, current_user.id, min_role="viewer")

    stmt = select(Workspace).where(Workspace.id == workspace_id)
    res = await db.execute(stmt)
    ws = res.scalars().first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get members
    m_stmt = (
        select(WorkspaceMember, User.name, User.email)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    m_res = await db.execute(m_stmt)
    members = [
        {
            "id": m.id,
            "user_id": m.user_id,
            "name": name,
            "email": email,
            "role": m.role,
            "joined_at": m.joined_at.isoformat(),
        }
        for m, name, email in m_res.all()
    ]

    # Get brands
    b_stmt = select(Brand).where(Brand.workspace_id == workspace_id)
    b_res = await db.execute(b_stmt)
    brands = [
        {
            "id": b.id,
            "name": b.name,
            "voice_description": b.voice_description,
            "created_at": b.created_at.isoformat(),
        }
        for b in b_res.scalars().all()
    ]

    return {
        "id": ws.id,
        "name": ws.name,
        "slug": ws.slug,
        "owner_id": ws.owner_id,
        "user_role": user_role,
        "members": members,
        "brands": brands,
        "created_at": ws.created_at.isoformat(),
    }


@router.patch("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    payload: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates workspace settings (requires admin or owner role)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    stmt = select(Workspace).where(Workspace.id == workspace_id)
    res = await db.execute(stmt)
    ws = res.scalars().first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if payload.name:
        ws.name = payload.name
    if payload.slug:
        ws.slug = payload.slug

    await db.commit()
    await db.refresh(ws)

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="workspace.updated",
        resource_type="workspace",
        resource_id=ws.id,
        metadata={"name": ws.name, "slug": ws.slug},
    )

    return {"message": "Workspace updated", "workspace": {"id": ws.id, "name": ws.name, "slug": ws.slug}}


# ---------------------------------------------------------
# Multi-Brand Association & Switching
# ---------------------------------------------------------

@router.post("/{workspace_id}/brands/{brand_id}/link")
async def link_brand_to_workspace(
    workspace_id: str,
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Associates an existing brand to a workspace (requires editor role or above)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="editor")

    b_stmt = select(Brand).where(Brand.id == brand_id)
    b_res = await db.execute(b_stmt)
    brand = b_res.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand.workspace_id = workspace_id
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="brand.linked",
        resource_type="brand",
        resource_id=brand.id,
        metadata={"brand_name": brand.name},
    )

    return {"message": f"Brand '{brand.name}' linked to workspace.", "brand_id": brand.id, "workspace_id": workspace_id}


# ---------------------------------------------------------
# Team Member & Invitation Workflows
# ---------------------------------------------------------

@router.post("/{workspace_id}/invites")
async def invite_team_member(
    workspace_id: str,
    payload: InviteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invites a user by email to join the workspace (requires admin role or above)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=payload.email.lower().strip(),
        role=payload.role,
        token=token,
        invited_by=current_user.id,
        expires_at=expires_at,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="member.invited",
        resource_type="workspace_invite",
        resource_id=invite.id,
        metadata={"email": invite.email, "role": invite.role},
    )

    return {
        "message": f"Invitation generated for {invite.email}.",
        "invite_id": invite.id,
        "token": invite.token,
        "role": invite.role,
        "expires_at": invite.expires_at.isoformat(),
    }


@router.post("/invites/{token}/accept")
async def accept_workspace_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accepts a pending invitation token and adds the user to the workspace."""
    stmt = select(WorkspaceInvite).where(
        and_(
            WorkspaceInvite.token == token,
            WorkspaceInvite.status == "pending",
        )
    )
    res = await db.execute(stmt)
    invite = res.scalars().first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or already consumed.")

    exp_at = invite.expires_at
    if exp_at.tzinfo is None:
        exp_at = exp_at.replace(tzinfo=timezone.utc)
    if exp_at < datetime.now(timezone.utc):
        invite.status = "expired"
        await db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired.")

    # Check if already a member
    existing_stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == invite.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        invite.status = "accepted"
        await db.commit()
        return {"message": "You are already a member of this workspace.", "workspace_id": invite.workspace_id}

    # Add as member
    member = WorkspaceMember(
        workspace_id=invite.workspace_id,
        user_id=current_user.id,
        role=invite.role,
    )
    db.add(member)
    invite.status = "accepted"
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=invite.workspace_id,
        user_id=current_user.id,
        action="member.joined",
        resource_type="workspace_member",
        resource_id=member.id,
        metadata={"role": member.role, "email": current_user.email},
    )

    return {
        "message": "Invitation accepted successfully.",
        "workspace_id": invite.workspace_id,
        "role": member.role,
    }


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes a user from the workspace (cannot remove workspace owner)."""
    current_role = await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
    ws_res = await db.execute(ws_stmt)
    ws = ws_res.scalars().first()
    if ws.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the workspace owner.")

    m_stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    m_res = await db.execute(m_stmt)
    member = m_res.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    await db.delete(member)
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="member.removed",
        resource_type="workspace_member",
        resource_id=user_id,
    )

    return {"message": "Member removed from workspace."}


@router.patch("/{workspace_id}/members/{user_id}/role")
async def update_member_role(
    workspace_id: str,
    user_id: str,
    payload: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates an existing member's RBAC role (requires owner or admin)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
    ws_res = await db.execute(ws_stmt)
    ws = ws_res.scalars().first()
    if ws.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify the workspace owner's role.")

    m_stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    m_res = await db.execute(m_stmt)
    member = m_res.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    old_role = member.role
    member.role = payload.role
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="member.role_updated",
        resource_type="workspace_member",
        resource_id=user_id,
        metadata={"old_role": old_role, "new_role": member.role},
    )

    return {"message": "Member role updated.", "user_id": user_id, "role": member.role}


# ---------------------------------------------------------
# Audit Trail API
# ---------------------------------------------------------

@router.get("/{workspace_id}/audit-logs")
async def get_workspace_audit_logs(
    workspace_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves immutable audit logs for the workspace (requires admin role or above)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    stmt = (
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    logs = [
        {
            "id": l.id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "user_id": l.user_id,
            "metadata": l.metadata_json,
            "created_at": l.created_at.isoformat(),
        }
        for l in res.scalars().all()
    ]
    return {"audit_logs": logs}


# ---------------------------------------------------------
# Developer API Key Management
# ---------------------------------------------------------

@router.post("/{workspace_id}/api-keys", status_code=status.HTTP_201_CREATED)
async def create_workspace_api_key(
    workspace_id: str,
    payload: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates a scoped programmatic API key (raw key returned only once)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    key_record, raw_key = await issue_api_key(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        name=payload.name,
        scopes=payload.scopes,
        expires_in_days=payload.expires_in_days,
    )

    return {
        "id": key_record.id,
        "name": key_record.name,
        "key_prefix": key_record.key_prefix,
        "api_key": raw_key,  # Plaintext key shown once
        "scopes": key_record.scopes.split(","),
        "expires_at": key_record.expires_at.isoformat() if key_record.expires_at else None,
        "warning": "Store this API key safely. It will not be shown again.",
    }


@router.get("/{workspace_id}/api-keys")
async def list_workspace_api_keys(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all active API keys for the workspace (hashed secret is never revealed)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    stmt = (
        select(ApiKey)
        .where(ApiKey.workspace_id == workspace_id)
        .order_by(ApiKey.created_at.desc())
    )
    res = await db.execute(stmt)
    keys = [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "scopes": k.scopes.split(","),
            "is_active": k.is_active,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "expires_at": k.expires_at.isoformat() if k.expires_at else None,
            "created_at": k.created_at.isoformat(),
        }
        for k in res.scalars().all()
    ]
    return {"api_keys": keys}


@router.delete("/{workspace_id}/api-keys/{key_id}")
async def revoke_workspace_api_key(
    workspace_id: str,
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revokes an API key immediately (requires admin role or above)."""
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    stmt = select(ApiKey).where(
        and_(
            ApiKey.id == key_id,
            ApiKey.workspace_id == workspace_id,
        )
    )
    res = await db.execute(stmt)
    key_record = res.scalars().first()
    if not key_record:
        raise HTTPException(status_code=404, detail="API key not found.")

    key_record.is_active = False
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="api_key.revoked",
        resource_type="api_key",
        resource_id=key_id,
        metadata={"name": key_record.name},
    )

    return {"message": "API key revoked successfully."}
