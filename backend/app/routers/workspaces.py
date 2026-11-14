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
from sqlalchemy import select, and_, or_, delete, func
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
from app.routers.auth import get_current_user, is_admin_user
from app.services.workspace_service import (
    get_member_role,
    require_role,
    record_audit_log,
    issue_api_key,
    verify_api_key,
    hash_secret,
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


class WorkspaceOwnershipTransfer(BaseModel):
    new_owner_id: str = Field(..., description="User ID of the existing workspace member to become the new owner")


class InviteCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
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


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a workspace tenant. Strictly restricted to the workspace owner (or platform admin).
    Unlinks contained brands cleanly and cascades members and invitations.
    """
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    res = await db.execute(stmt)
    ws = res.scalars().first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if ws.owner_id != current_user.id and not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the workspace owner can delete the workspace.",
        )

    # 1. Safely unlink all brands (preserve brands as personal/unassigned rather than deleting them)
    b_stmt = select(Brand).where(Brand.workspace_id == workspace_id)
    b_res = await db.execute(b_stmt)
    for brand in b_res.scalars().all():
        brand.workspace_id = None

    # 2. Delete all members, invites, and api keys
    await db.execute(delete(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id))
    await db.execute(delete(WorkspaceInvite).where(WorkspaceInvite.workspace_id == workspace_id))
    await db.execute(delete(ApiKey).where(ApiKey.workspace_id == workspace_id))

    # 3. Record audit log before deleting workspace
    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="workspace.deleted",
        resource_type="workspace",
        resource_id=workspace_id,
        metadata={"name": ws.name},
    )

    # 4. Delete the workspace
    await db.delete(ws)
    await db.commit()

    return {"message": "Workspace deleted successfully."}


@router.post("/{workspace_id}/transfer-ownership")
async def transfer_workspace_ownership(
    workspace_id: str,
    payload: WorkspaceOwnershipTransfer,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Transfers workspace ownership to an existing member.
    Strictly restricted to the current workspace owner.
    Demotes the previous owner to 'admin'.
    """
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    res = await db.execute(stmt)
    ws = res.scalars().first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if ws.owner_id != current_user.id and not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the workspace owner can transfer workspace ownership.",
        )

    if payload.new_owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already the owner of this workspace.",
        )

    # Verify target user is an existing member of this workspace
    m_stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == payload.new_owner_id,
        )
    )
    m_res = await db.execute(m_stmt)
    new_owner_member = m_res.scalars().first()
    if not new_owner_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user must be an active member of this workspace to become the owner.",
        )

    # Demote old owner to admin
    old_owner_stmt = select(WorkspaceMember).where(
        and_(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == ws.owner_id,
        )
    )
    old_owner_res = await db.execute(old_owner_stmt)
    old_owner_member = old_owner_res.scalars().first()
    if old_owner_member:
        old_owner_member.role = "admin"

    # Promote new owner
    new_owner_member.role = "owner"
    ws.owner_id = payload.new_owner_id

    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="workspace.ownership_transferred",
        resource_type="workspace",
        resource_id=workspace_id,
        metadata={
            "previous_owner_id": current_user.id,
            "new_owner_id": payload.new_owner_id,
        },
    )

    return {
        "message": "Workspace ownership transferred successfully.",
        "workspace_id": workspace_id,
        "new_owner_id": payload.new_owner_id,
    }


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
    """
    Associates a brand to a workspace or transfers a brand across workspaces.
    - If brand is not assigned to any workspace: requires brand ownership (or platform admin) and editor role in target workspace.
    - If brand already belongs to another workspace (cross-workspace transfer): strictly requires admin or owner role in BOTH the source and destination workspaces.
    """
    dest_role = await check_user_access(db, workspace_id, current_user.id, min_role="editor")

    b_stmt = select(Brand).where(Brand.id == brand_id)
    b_res = await db.execute(b_stmt)
    brand = b_res.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if brand.workspace_id == workspace_id:
        return {
            "message": f"Brand '{brand.name}' is already linked to this workspace.",
            "brand_id": brand.id,
            "workspace_id": workspace_id,
        }

    # Cross-workspace brand transfer scenario
    if brand.workspace_id and brand.workspace_id != workspace_id:
        source_ws_id = brand.workspace_id
        source_role = await get_member_role(db, source_ws_id, current_user.id)
        if not is_admin_user(current_user):
            if not source_role or not require_role(source_role, "admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Transferring a brand from another workspace requires admin role in the source workspace.",
                )
            if not require_role(dest_role, "admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Transferring a brand between workspaces requires admin role in the destination workspace.",
                )

        # Audit log in source workspace
        await record_audit_log(
            db,
            workspace_id=source_ws_id,
            user_id=current_user.id,
            action="brand.transferred_out",
            resource_type="brand",
            resource_id=brand.id,
            metadata={"destination_workspace_id": workspace_id, "brand_name": brand.name},
        )
    else:
        # Personal brand linking scenario: caller must own the brand
        if brand.user_id and brand.user_id != current_user.id and not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have ownership rights to link this brand to a workspace.",
            )

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


@router.post("/{workspace_id}/brands/{brand_id}/unlink")
@router.delete("/{workspace_id}/brands/{brand_id}")
async def unlink_brand_from_workspace(
    workspace_id: str,
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unlinks a brand from the workspace. Requires admin or owner role in the workspace.
    """
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    b_stmt = select(Brand).where(Brand.id == brand_id)
    b_res = await db.execute(b_stmt)
    brand = b_res.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if brand.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand does not belong to this workspace.",
        )

    brand.workspace_id = None
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="brand.unlinked",
        resource_type="brand",
        resource_id=brand.id,
        metadata={"brand_name": brand.name},
    )

    return {
        "message": f"Brand '{brand.name}' unlinked from workspace.",
        "brand_id": brand.id,
        "workspace_id": workspace_id,
    }


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
    """
    Invites a user by email to join the workspace (requires admin role or above).
    - Cannot invite with role 'owner'.
    - Only workspace owner (or platform admin) can invite an 'admin'.
    - Rejects invite if target user is already an active member of this workspace.
    - Stores SHA-256 hash of token at rest for credential safety.
    """
    caller_role = await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    if payload.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot invite members with owner role. Use ownership transfer instead.",
        )

    if payload.role == "admin" and caller_role != "owner" and not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can invite new admins.",
        )

    norm_email = payload.email.lower().strip()

    # Reject if user is already an active member of this workspace
    u_stmt = select(User).where(User.email == norm_email)
    u_res = await db.execute(u_stmt)
    target_user = u_res.scalars().first()
    if target_user:
        m_stmt = select(WorkspaceMember).where(
            and_(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == target_user.id,
            )
        )
        m_res = await db.execute(m_stmt)
        if m_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{norm_email}' is already an active member of this workspace.",
            )

    token = secrets.token_urlsafe(32)
    token_hashed = hash_secret(token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=norm_email,
        role=payload.role,
        token=token_hashed,
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
        "token": token,  # Plaintext token returned only once to caller
        "role": invite.role,
        "expires_at": invite.expires_at.isoformat(),
    }


@router.delete("/{workspace_id}/invites/{invite_id}")
async def revoke_workspace_invite(
    workspace_id: str,
    invite_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Revokes an active or pending workspace invitation. Requires admin or owner role.
    """
    await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    stmt = select(WorkspaceInvite).where(
        and_(
            WorkspaceInvite.id == invite_id,
            WorkspaceInvite.workspace_id == workspace_id,
        )
    )
    res = await db.execute(stmt)
    invite = res.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    invite.status = "revoked"
    await db.commit()

    await record_audit_log(
        db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="member.invite_revoked",
        resource_type="workspace_invite",
        resource_id=invite.id,
        metadata={"email": invite.email},
    )

    return {"message": f"Invitation for '{invite.email}' revoked successfully."}


@router.post("/invites/{token}/accept")
async def accept_workspace_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accepts a pending invitation token and adds the user to the workspace."""
    token_hash = hash_secret(token)
    stmt = select(WorkspaceInvite).where(
        or_(
            WorkspaceInvite.token == token_hash,
            WorkspaceInvite.token == token,
        )
    )
    res = await db.execute(stmt)
    invite = res.scalars().first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found or already consumed.")

    if invite.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is no longer valid (status: {invite.status}).",
        )

    exp_at = invite.expires_at
    if exp_at.tzinfo is None:
        exp_at = exp_at.replace(tzinfo=timezone.utc)
    if exp_at < datetime.now(timezone.utc):
        invite.status = "expired"
        await db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired.")

    # Security check: verify that accepting user's email matches the invited email
    if invite.email.lower().strip() != current_user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: This invitation was issued for '{invite.email}', but you are signed in as '{current_user.email}'.",
        )

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
    """Removes a user from the workspace (cannot remove workspace owner; only owner can remove admins)."""
    caller_role = await check_user_access(db, workspace_id, current_user.id, min_role="admin")

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

    if member.role == "admin" and caller_role != "owner" and not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the workspace owner can remove an administrator.",
        )

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
    """Updates an existing member's RBAC role (requires owner or admin; only owner can modify/promote admins)."""
    caller_role = await check_user_access(db, workspace_id, current_user.id, min_role="admin")

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own workspace role. Self-promotion or demotion is blocked.",
        )

    if payload.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set role to owner via role update. Use ownership transfer instead.",
        )

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

    # Only owner can promote to admin or change an existing admin's role
    if (member.role == "admin" or payload.role == "admin") and caller_role != "owner" and not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only workspace owners can promote members to admin or modify an administrator.",
        )

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
