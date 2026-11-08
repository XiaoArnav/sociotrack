"""
Brands Router: Handles brand configuration and listing.
Endpoints:
- GET  /api/brands
- POST /api/brands
"""
from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandIntelligenceProfile,
    RefreshIntelligenceResponse,
)
from app.services.brand_intelligence import (
    build_brand_intelligence_profile,
    refresh_brand_intelligence_async,
)

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get(
    "",
    response_model=List[BrandResponse],
    status_code=status.HTTP_200_OK,
    summary="List all brands configured in the system",
)
async def list_brands(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Brand).order_by(Brand.created_at.desc()))
    brands = result.scalars().all()
    out = []
    for b in brands:
        resp = BrandResponse.model_validate(b)
        if b.intelligence_profile:
            try:
                resp.intelligence_profile = BrandIntelligenceProfile.model_validate_json(b.intelligence_profile)
            except Exception:
                pass
        out.append(resp)
    return out


@router.post(
    "",
    response_model=BrandResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new brand persona",
)
async def create_brand(
    payload: BrandCreate,
    db: AsyncSession = Depends(get_db),
):
    brand = Brand(
        name=payload.name,
        voice_description=payload.voice_description,
        target_audience=payload.target_audience,
    )
    db.add(brand)
    await db.flush()
    await db.refresh(brand)
    return BrandResponse.model_validate(brand)


@router.get(
    "/{brand_id}/intelligence",
    response_model=BrandIntelligenceProfile,
    status_code=status.HTTP_200_OK,
    summary="Retrieve structured brand intelligence profile",
)
async def get_brand_intelligence(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = res.scalar_one_or_none()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with id '{brand_id}' not found.",
        )

    if brand.intelligence_profile:
        try:
            return BrandIntelligenceProfile.model_validate_json(brand.intelligence_profile)
        except Exception:
            pass

    from sqlalchemy.orm import selectinload
    # Compute freshly if not cached
    p_res = await db.execute(
        select(Post)
        .where(Post.brand_id == brand_id)
        .options(selectinload(Post.analytics))
        .order_by(Post.created_at.desc())
    )
    posts = list(p_res.scalars().all())

    m_res = await db.execute(
        select(AgentMemory).where(AgentMemory.brand_id == brand_id, AgentMemory.is_active.is_(True))
    )
    db_memories = list(m_res.scalars().all())

    profile = build_brand_intelligence_profile(brand, posts=posts, db_memories=db_memories)
    brand.intelligence_profile = profile.model_dump_json()
    await db.flush()
    return profile


@router.post(
    "/{brand_id}/refresh-intelligence",
    response_model=RefreshIntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Recompute structured brand intelligence profile from latest data",
)
async def refresh_intelligence(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        profile = await refresh_brand_intelligence_async(brand_id, db)
        return RefreshIntelligenceResponse(
            status="success",
            brand_id=profile.brand_id,
            brand_name=profile.brand_name,
            profile=profile,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
