"""
Simulator Router: Handles POST /api/simulator/feed-metrics.
Calculates engagement scores and executes the agent memory feedback loop.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.post import Post
from app.models.brand import Brand
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
    status_code=status.HTTP_200_OK,
    summary="Simulate incoming post engagement metrics and trigger memory feedback loop",
)
async def simulate_feed_metrics(
    payload: FeedMetricsRequest,
    db: AsyncSession = Depends(get_db),
):
    # 1. Resolve Metrics (flat or nested)
    if payload.metrics:
        impressions = payload.metrics.impressions
        likes = payload.metrics.likes
        replies = payload.metrics.replies
        shares = payload.metrics.shares
    else:
        impressions = payload.impressions if payload.impressions is not None else 1000
        likes = payload.likes if payload.likes is not None else 10
        replies = payload.replies if payload.replies is not None else 5
        shares = payload.shares if payload.shares is not None else 2

    # 2. Fetch or create Post
    post = None
    if payload.post_id:
        result = await db.execute(select(Post).where(Post.id == payload.post_id))
        post = result.scalar_one_or_none()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post with id '{payload.post_id}' not found.",
            )

    if not post:
        brand_res = await db.execute(select(Brand).limit(1))
        brand = brand_res.scalar_one_or_none()
        brand_id = brand.id if brand else str(uuid.uuid4())

        post = Post(
            id=str(uuid.uuid4()),
            brand_id=brand_id,
            topic=payload.topic or "Agent Workflow",
            hook_style="contrarian",
            content=payload.post_content or "Post content under performance simulation",
            status="published",
            scheduled_for=datetime.now(timezone.utc),
        )
        db.add(post)
        await db.flush()

    # 3. Calculate Scores
    # Hackathon engagement score formula: (likes*2 + replies*3 + shares*4) / impressions * 100
    engagement_score = calculate_engagement_score(
        impressions=impressions,
        likes=likes,
        replies=replies,
        shares=shares,
    )
    # Person 1 composite score: (shares*3 + replies*2 + likes*1) / impressions * 100
    denom = max(impressions, 1)
    raw_composite = ((shares * 3 + replies * 2 + likes * 1) / denom) * 100
    composite_score = round(raw_composite, 2)
    qualifies = composite_score > 5.0

    # 4. Create or Update Post Analytics Record
    analytics_res = await db.execute(
        select(PostAnalytics).where(PostAnalytics.post_id == post.id)
    )
    analytics = analytics_res.scalar_one_or_none()

    if analytics:
        analytics.impressions = impressions
        analytics.likes = likes
        analytics.replies = replies
        analytics.shares = shares
        analytics.engagement_score = engagement_score
    else:
        analytics = PostAnalytics(
            post_id=post.id,
            impressions=impressions,
            likes=likes,
            replies=replies,
            shares=shares,
            engagement_score=engagement_score,
        )
        db.add(analytics)

    if post.status != "published":
        post.status = "published"

    # 5. Trigger Agent Memory Feedback Loop
    metrics_dict = {
        "impressions": impressions,
        "likes": likes,
        "replies": replies,
        "shares": shares,
    }
    post_info = {
        "id": post.id,
        "topic": post.topic,
        "hook_style": post.hook_style,
    }

    insight_data = derive_memory_insight(post_info, metrics_dict, engagement_score)
    created_memory = None
    key_lesson = (
        f"Contrarian data hook for '{post.topic}' yielded {composite_score:.1f}% engagement velocity."
        if qualifies
        else None
    )
    doc_id = f"mem_rule_{uuid.uuid4().hex[:8]}" if qualifies else None

    if insight_data:
        await hindsight_client.retain(
            brand_id=post.brand_id,
            content=insight_data["insight_text"],
            category=insight_data["category"],
            confidence=insight_data["confidence_score"],
            metadata={
                "post_id": post.id,
                "engagement_score": engagement_score,
                "composite_score": composite_score,
                "topic": post.topic,
            },
        )

        memory_rec = AgentMemory(
            brand_id=post.brand_id,
            insight_text=insight_data["insight_text"],
            category=insight_data["category"],
            confidence_score=insight_data["confidence_score"],
        )
        db.add(memory_rec)
        await db.flush()
        created_memory = AgentMemoryResponse.model_validate(memory_rec)

    await db.flush()
    if analytics:
        await db.refresh(analytics)

    return FeedMetricsResponse(
        id=analytics.id if analytics else str(uuid.uuid4()),
        post_id=post.id,
        impressions=impressions,
        likes=likes,
        replies=replies,
        shares=shares,
        engagement_score=engagement_score,
        composite_score=composite_score,
        qualifies_for_memory=qualifies,
        key_lesson=key_lesson,
        memory_doc_id=doc_id,
        status_message=f"Composite score {composite_score} processed. Memory qualification: {qualifies}.",
        recorded_at=analytics.recorded_at if analytics else datetime.now(timezone.utc),
        feedback_insight=created_memory,
    )
