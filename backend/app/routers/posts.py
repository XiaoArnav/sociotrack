"""
Posts Router: Handles post approval and content queue management.
Endpoints:
- POST /api/posts/approve
- GET  /api/posts/queue
- GET  /api/posts
"""
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.post import Post
from app.models.brand import Brand
from app.schemas.post import (
    ApprovePostRequest,
    ApprovePostResponse,
    PostQueueResponse,
    PostQueueItem,
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post(
    "/approve",
    response_model=ApprovePostResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve and schedule a post draft",
)
async def approve_post(
    payload: ApprovePostRequest,
    db: AsyncSession = Depends(get_db),
):
    post = None
    if payload.post_id:
        result = await db.execute(select(Post).where(Post.id == payload.post_id))
        post = result.scalar_one_or_none()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post with id '{payload.post_id}' not found.",
            )

    approved_text = payload.approved_content or payload.post_content or "Approved post copy"
    scheduled_at = None
    if payload.scheduled_time:
        if isinstance(payload.scheduled_time, str):
            try:
                scheduled_at = datetime.fromisoformat(payload.scheduled_time.replace("Z", "+00:00"))
            except Exception:
                scheduled_at = datetime.now(timezone.utc)
        elif isinstance(payload.scheduled_time, datetime):
            scheduled_at = payload.scheduled_time

    if not post:
        brand_res = await db.execute(select(Brand).limit(1))
        brand = brand_res.scalar_one_or_none()
        brand_id = brand.id if brand else str(uuid.uuid4())

        post = Post(
            id=str(uuid.uuid4()),
            brand_id=brand_id,
            topic="Agent Architecture",
            hook_style=payload.format or payload.hook_style or "contrarian",
            content=approved_text,
            status="scheduled",
            scheduled_for=scheduled_at or datetime.now(timezone.utc),
        )
        db.add(post)
    else:
        post.content = approved_text
        post.scheduled_for = scheduled_at or post.scheduled_for
        post.status = "scheduled"
        if payload.format or payload.hook_style:
            post.hook_style = payload.format or payload.hook_style

    await db.flush()
    await db.refresh(post)

    resp_status = "approved" if payload.approved_by else post.status

    return ApprovePostResponse(
        id=post.id,
        post_id=post.id,
        status=resp_status,
        post_status=post.status,
        content=post.content,
        format=post.hook_style,
        hook_style=post.hook_style,
        scheduled_for=post.scheduled_for,
        scheduled_time=post.scheduled_for.isoformat() if post.scheduled_for else None,
        message="Post successfully approved and scheduled for publishing slot.",
    )


@router.get(
    "",
    response_model=List[PostQueueItem],
    status_code=status.HTTP_200_OK,
    summary="List all posts",
)
@router.get(
    "/",
    response_model=List[PostQueueItem],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def list_all_posts(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Post).order_by(Post.created_at.desc()))
    posts = result.scalars().all()

    return [
        PostQueueItem(
            id=p.id,
            brand_id=p.brand_id,
            content=p.content,
            topic=p.topic,
            hook_style=p.hook_style,
            format=p.hook_style,
            status=p.status,
            scheduled_for=p.scheduled_for,
            created_at=p.created_at,
        )
        for p in posts
    ]


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
            format=p.hook_style,
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
