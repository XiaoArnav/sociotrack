"""
Brands Router: Handles brand configuration and listing.
Endpoints:
- GET  /api/brands
- POST /api/brands
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandResponse

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
    return [BrandResponse.model_validate(b) for b in brands]


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
