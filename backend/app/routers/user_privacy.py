"""
Router for User Privacy Rights, GDPR/CCPA Data Export, and Hard Deletion.
Ensures complete tenant data isolation, consent management, authenticated authorization,
and full erasure upon request.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user, is_admin_user
from app.services.workspace_service import record_audit_log
from app.schemas.product_analytics import (
    UserConsentRequest,
    UserConsentResponse,
    UserDataExport,
)

router = APIRouter(tags=["User Privacy"])


def _verify_user_access(
    requested_user_id: Optional[str],
    current_user: UserResponse,
    action_name: str,
) -> str:
    """
    Verifies that the authenticated caller owns the target user record
    or possesses administrative privileges.
    Rejects cross-tenant and cross-user snooping attempts with HTTP 403.
    """
    target_id = requested_user_id if requested_user_id else current_user.id
    if target_id != current_user.id:
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You do not have permission to execute '{action_name}' for user '{target_id}'.",
            )
    return target_id


@router.post("/api/user/consent", response_model=UserConsentResponse, summary="Update privacy consent preferences")
@router.post("/api/privacy/consent", response_model=UserConsentResponse, summary="Alias: Update privacy consent preferences")
async def update_user_consent(
    payload: UserConsentRequest,
    user_id: Optional[str] = Query(None, description="Target user ID (defaults to authenticated caller)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates user privacy consent and training opt-out preferences.
    Requires authentication and strict user ownership (or admin privileges).
    """
    target_id = _verify_user_access(user_id, current_user, "update_consent")

    user = await db.get(User, target_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {target_id} not found."
        )

    user.telemetry_opt_in = payload.telemetry_opt_in
    user.ai_training_opt_out = payload.ai_training_opt_out
    user.consent_updated_at = datetime.now(timezone.utc)

    # Audit admin overrides
    if target_id != current_user.id:
        await record_audit_log(
            db=db,
            workspace_id=None,
            action="privacy.consent.admin_override",
            resource_type="user",
            resource_id=target_id,
            user_id=current_user.id,
            metadata={
                "telemetry_opt_in": payload.telemetry_opt_in,
                "ai_training_opt_out": payload.ai_training_opt_out,
                "target_user_id": target_id,
            },
        )

    await db.commit()
    await db.refresh(user)

    return UserConsentResponse(
        user_id=user.id,
        telemetry_opt_in=user.telemetry_opt_in,
        ai_training_opt_out=user.ai_training_opt_out,
        consent_updated_at=user.consent_updated_at,
    )


@router.get("/api/user/export-data", response_model=UserDataExport, summary="Export personal GDPR/CCPA data")
@router.get("/api/privacy/export-data", response_model=UserDataExport, summary="Alias: Export personal GDPR/CCPA data")
async def export_user_data(
    user_id: Optional[str] = Query(None, description="Target user ID (defaults to authenticated caller)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Exports all tenant-associated data (profile, brands, posts, memories)
    in a structured GDPR/CCPA compliant JSON format.
    Requires authentication; strictly forbids cross-user access unless performed by an admin.
    """
    target_id = _verify_user_access(user_id, current_user, "export_data")

    user = await db.get(User, target_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {target_id} not found."
        )

    # Audit admin overrides
    if target_id != current_user.id:
        await record_audit_log(
            db=db,
            workspace_id=None,
            action="privacy.export.admin_override",
            resource_type="user",
            resource_id=target_id,
            user_id=current_user.id,
            metadata={"target_user_id": target_id},
        )

    # Fetch brands
    brands_res = await db.execute(
        select(Brand).where(Brand.user_id == target_id)
    )
    brands = brands_res.scalars().all()
    brand_ids = [b.id for b in brands]

    # Fetch posts
    posts = []
    if brand_ids:
        posts_res = await db.execute(
            select(Post).where(Post.brand_id.in_(brand_ids))
        )
        posts = posts_res.scalars().all()

    # Fetch memories
    memories = []
    if brand_ids:
        mem_res = await db.execute(
            select(AgentMemory).where(AgentMemory.brand_id.in_(brand_ids))
        )
        memories = mem_res.scalars().all()

    return UserDataExport(
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_demo": user.is_demo,
            "telemetry_opt_in": user.telemetry_opt_in,
            "ai_training_opt_out": user.ai_training_opt_out,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        brands=[
            {
                "id": b.id,
                "name": b.name,
                "voice_description": b.voice_description,
                "target_audience": b.target_audience,
                "intelligence_profile": b.intelligence_profile,
            }
            for b in brands
        ],
        posts=[
            {
                "id": p.id,
                "brand_id": p.brand_id,
                "caption": p.caption,
                "status": p.status,
                "published_at": p.published_at.isoformat() if p.published_at else None,
            }
            for p in posts
        ],
        memories=[
            {
                "id": m.id,
                "brand_id": m.brand_id,
                "lesson": m.lesson,
                "supporting_evidence": m.supporting_evidence,
                "confidence_score": m.confidence_score,
                "is_active": m.is_active,
            }
            for m in memories
        ],
        exported_at=datetime.now(timezone.utc),
    )


@router.delete("/api/user/delete-data", summary="Hard delete user account and associated tenant data")
@router.delete("/api/user/delete-account", summary="Alias: Hard delete user account and associated tenant data")
@router.delete("/api/privacy/delete-data", summary="Alias: Hard delete user account and associated tenant data")
@router.delete("/api/privacy/delete-account", summary="Alias: Hard delete user account and associated tenant data")
async def delete_user_data(
    user_id: Optional[str] = Query(None, description="Target user ID (defaults to authenticated caller)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently erases all user records, brands, posts, and memories.
    Fulfills the 'Right to be Forgotten' under privacy regulations (GDPR/CCPA).
    Requires authentication; rejects unauthorized deletion attempts.
    """
    target_id = _verify_user_access(user_id, current_user, "delete_account")

    user = await db.get(User, target_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {target_id} not found."
        )

    # Audit admin overrides
    if target_id != current_user.id:
        await record_audit_log(
            db=db,
            workspace_id=None,
            action="privacy.delete.admin_override",
            resource_type="user",
            resource_id=target_id,
            user_id=current_user.id,
            metadata={"target_user_id": target_id},
        )

    # 1. Fetch user's brands
    brands_res = await db.execute(select(Brand).where(Brand.user_id == target_id))
    brands = brands_res.scalars().all()
    brand_ids = [b.id for b in brands]

    if brand_ids:
        # Cascade delete posts & memories
        await db.execute(delete(Post).where(Post.brand_id.in_(brand_ids)))
        await db.execute(delete(AgentMemory).where(AgentMemory.brand_id.in_(brand_ids)))
        await db.execute(delete(Brand).where(Brand.id.in_(brand_ids)))

    # Delete user account
    await db.delete(user)
    await db.commit()

    return {
        "deleted": True,
        "user_id": target_id,
        "brands_erased": len(brand_ids),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
