"""
Posts Router: Handles post approval and content queue management.
Endpoints:
- POST /api/posts/approve
- GET  /api/posts/queue
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.post import Post
from app.schemas.post import (
    ApprovePostRequest,
    PostDraftResponse,
    PostQueueResponse,
    PostQueueItem,
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post(
    "/approve",
    response_model=PostDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve and schedule a post draft",
)
async def approve_post(
    payload: ApprovePostRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Post).where(Post.id == payload.post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id '{payload.post_id}' not found.",
        )

    # Update post content, schedule timestamp, and transition status to 'scheduled'
    post.content = payload.approved_content
    post.scheduled_for = payload.scheduled_time
    post.status = "scheduled"

    await db.flush()
    await db.refresh(post)

    return PostDraftResponse(
        id=post.id,
        brand_id=post.brand_id,
        content=post.content,
        topic=post.topic,
        hook_style=post.hook_style,
        status=post.status,
        scheduled_for=post.scheduled_for,
        created_at=post.created_at,
        memory_context_applied=[],
    )


@router.get(
    "/queue",
    response_model=PostQueueResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch all scheduled and pending posts in publishing queue",
)
async def get_posts_queue(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Post)
        .where(or_(Post.status == "scheduled", Post.status == "pending_approval"))
        .order_by(Post.scheduled_for.asc().nulls_last(), Post.created_at.desc())
    )
    result = await db.execute(stmt)
    posts = result.scalars().all()

    queue_items = [
        PostQueueItem(
            id=p.id,
            brand_id=p.brand_id,
            content=p.content,
            topic=p.topic,
            hook_style=p.hook_style,
            status=p.status,
            scheduled_for=p.scheduled_for,
            created_at=p.created_at,
        )
        for p in posts
    ]

    return PostQueueResponse(
        total=len(queue_items),
        queue=queue_items,
    )
