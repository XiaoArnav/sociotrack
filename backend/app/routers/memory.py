"""
Memory Router: Handles GET /api/memory/insights?brand_id={id}.
Retrieves learned audience insights and hook rules for the specified brand.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.models.memory import AgentMemory
from app.schemas.memory import MemoryInsightsResponse, AgentMemoryResponse

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.get(
    "/insights",
    response_model=MemoryInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get all learned audience insights stored for a brand",
)
async def get_memory_insights(
    brand_id: str = Query(..., description="UUID of the brand"),
    db: AsyncSession = Depends(get_db),
):
    # 1. Verify Brand exists
    brand_res = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = brand_res.scalar_one_or_none()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with id '{brand_id}' not found.",
        )

    # 2. Query Agent Memories
    mem_res = await db.execute(
        select(AgentMemory)
        .where(AgentMemory.brand_id == brand_id)
        .order_by(AgentMemory.created_at.desc())
    )
    memories = mem_res.scalars().all()

    insights_list = [AgentMemoryResponse.model_validate(m) for m in memories]

    return MemoryInsightsResponse(
        brand_id=brand_id,
        total_insights=len(insights_list),
        insights=insights_list,
    )
