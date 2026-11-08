"""
Router for User Privacy Rights, GDPR/CCPA Data Export, and Hard Deletion.
Ensures complete tenant data isolation, consent management, and full erasure upon request.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.schemas.product_analytics import (
    UserConsentRequest,
    UserConsentResponse,
    UserDataExport,
)

router = APIRouter(prefix="/api/user", tags=["User Privacy"])


@router.post("/consent", response_model=UserConsentResponse)
async def update_user_consent(
    user_id: str,
    payload: UserConsentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Updates user privacy consent and training opt-out preferences."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found."
        )

    user.telemetry_opt_in = payload.telemetry_opt_in
    user.ai_training_opt_out = payload.ai_training_opt_out
    user.consent_updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    return UserConsentResponse(
        user_id=user.id,
        telemetry_opt_in=user.telemetry_opt_in,
        ai_training_opt_out=user.ai_training_opt_out,
        consent_updated_at=user.consent_updated_at,
    )


@router.get("/export-data", response_model=UserDataExport)
async def export_user_data(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Exports all tenant-associated data (profile, brands, posts, memories)
    in a structured GDPR/CCPA compliant JSON format.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found."
        )

    # Fetch brands
    brands_res = await db.execute(
        select(Brand).where(Brand.user_id == user_id)
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


@router.delete("/delete-data")
async def delete_user_data(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently erases all user records, brands, posts, and memories.
    Fulfills the 'Right to be Forgotten' under privacy regulations.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found."
        )

    # 1. Fetch user's brands
    brands_res = await db.execute(select(Brand).where(Brand.user_id == user_id))
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
        "user_id": user_id,
        "brands_erased": len(brand_ids),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
