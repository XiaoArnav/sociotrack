"""
Simulator Router: Handles POST /api/simulator/feed-metrics.
Calculates engagement scores and executes the agent memory feedback loop.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.post import Post
from app.models.analytics import PostAnalytics
from app.models.memory import AgentMemory
from app.schemas.analytics import FeedMetricsRequest, FeedMetricsResponse
from app.schemas.memory import AgentMemoryResponse
from app.services.engagement import calculate_engagement_score, derive_memory_insight
from app.services.hindsight_client import hindsight_client

router = APIRouter(prefix="/simulator", tags=["Simulator"])


@router.post(
    "/feed-metrics",
    response_model=FeedMetricsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Simulate incoming post engagement metrics and trigger memory feedback loop",
)
async def simulate_feed_metrics(
    payload: FeedMetricsRequest,
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch Post
    result = await db.execute(select(Post).where(Post.id == payload.post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id '{payload.post_id}' not found.",
        )

    # 2. Calculate Engagement Score
    score = calculate_engagement_score(
        impressions=payload.impressions,
        likes=payload.likes,
        replies=payload.replies,
        shares=payload.shares,
    )

    # 3. Create or Update Post Analytics Record
    analytics_res = await db.execute(
        select(PostAnalytics).where(PostAnalytics.post_id == post.id)
    )
    analytics = analytics_res.scalar_one_or_none()

    if analytics:
        analytics.impressions = payload.impressions
        analytics.likes = payload.likes
        analytics.replies = payload.replies
        analytics.shares = payload.shares
        analytics.engagement_score = score
    else:
        analytics = PostAnalytics(
            post_id=post.id,
            impressions=payload.impressions,
            likes=payload.likes,
            replies=payload.replies,
            shares=payload.shares,
            engagement_score=score,
        )
        db.add(analytics)

    # Mark post status as published if it was scheduled or pending
    if post.status != "published":
        post.status = "published"

    # 4. Trigger Agent Memory Feedback Loop
    metrics_dict = {
        "impressions": payload.impressions,
        "likes": payload.likes,
        "replies": payload.replies,
        "shares": payload.shares,
    }
    post_info = {
        "id": post.id,
        "topic": post.topic,
        "hook_style": post.hook_style,
    }

    insight_data = derive_memory_insight(post_info, metrics_dict, score)
    created_memory = None

    if insight_data:
        # Retain into Hindsight Memory Bank
        await hindsight_client.retain(
            brand_id=post.brand_id,
            content=insight_data["insight_text"],
            category=insight_data["category"],
            confidence=insight_data["confidence_score"],
            metadata={
                "post_id": post.id,
                "engagement_score": score,
                "topic": post.topic,
                "hook_style": post.hook_style,
            },
        )

        # Store into PostgreSQL agent_memories table
        created_memory = AgentMemory(
            brand_id=post.brand_id,
            insight_text=insight_data["insight_text"],
            category=insight_data["category"],
            confidence_score=insight_data["confidence_score"],
        )
        db.add(created_memory)

    await db.flush()
    await db.refresh(analytics)
    if created_memory:
        await db.refresh(created_memory)

    return FeedMetricsResponse(
        id=analytics.id,
        post_id=analytics.post_id,
        impressions=analytics.impressions,
        likes=analytics.likes,
        replies=analytics.replies,
        shares=analytics.shares,
        engagement_score=analytics.engagement_score,
        recorded_at=analytics.recorded_at,
        feedback_insight=(
            AgentMemoryResponse.model_validate(created_memory)
            if created_memory
            else None
        ),
    )
