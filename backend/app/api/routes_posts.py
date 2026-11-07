"""
FastAPI routes for post generation and human-in-the-loop approval.
Owned by Person 2.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import PostModel
from backend.app.schemas.post_schema import (
    ApprovePostRequest,
    ApprovePostResponse,
    GenerateDraftsRequest,
    GenerateDraftsResponse,
    PostFormat,
    PostStatus,
    PostVariationSchema,
    SelectedPostSchema,
)
from backend.app.core.agent import SocialEngagementAgent
from backend.app.core.memory import get_memory_manager

router = APIRouter(prefix="", tags=["Posts & Drafts"])


@router.post(
    "/api/generate-drafts",
    response_model=GenerateDraftsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 3 post variations (Data-first, Hot take, Tactical) and select winner"
)
async def generate_drafts(
    payload: GenerateDraftsRequest,
    db: Session = Depends(get_db),
) -> GenerateDraftsResponse:
    try:
        mem_mgr = get_memory_manager(payload.brand_name)
        agent = SocialEngagementAgent(memory_mgr=mem_mgr)

        state = agent.generate_drafts(
            brand_name=payload.brand_name,
            topic=payload.topic,
            brand_guidelines=payload.brand_guidelines,
        )

        if not state.selected_post:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent failed to select a winning post.",
            )

        # Save generated variations into database
        for draft in state.drafts:
            db_post = PostModel(
                id=str(uuid.uuid4()),
                brand_name=payload.brand_name,
                topic=payload.topic,
                format=draft.format.value,
                hook=draft.hook,
                body=draft.body,
                call_to_action=draft.call_to_action,
                full_text=draft.full_text,
                status=PostStatus.DRAFT.value,
                match_score=draft.match_score or 0.0,
            )
            db.add(db_post)
        db.commit()

        context_summary = ""
        if state.memory_context:
            context_summary = state.memory_context.get("summary", "")

        return GenerateDraftsResponse(
            brand_name=state.brand_name,
            topic=state.topic,
            drafts=state.drafts,
            selected_post=state.selected_post,
            memory_context_summary=context_summary,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Draft generation failed: {str(e)}",
        )


@router.post(
    "/api/posts/approve",
    response_model=ApprovePostResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve selected post and queue for distribution"
)
async def approve_post(
    payload: ApprovePostRequest,
    db: Session = Depends(get_db),
) -> ApprovePostResponse:
    post_id = payload.post_id or f"post_{uuid.uuid4().hex[:8]}"

    # Check if existing or create scheduled record
    db_post = db.query(PostModel).filter(PostModel.id == post_id).first() if payload.post_id else None
    if not db_post:
        db_post = PostModel(
            id=post_id,
            brand_name="SocioTrack",
            topic="Agentic AI",
            format=payload.format.value,
            hook=payload.post_content.split("\n")[0][:100],
            body=payload.post_content,
            call_to_action="Follow for more insights",
            full_text=payload.post_content,
            status=PostStatus.APPROVED.value,
            scheduled_time=payload.scheduled_time or "2026-11-09T09:30:00Z",
        )
        db.add(db_post)
    else:
        db_post.status = PostStatus.APPROVED.value
        db_post.scheduled_time = payload.scheduled_time or db_post.scheduled_time

    db.commit()
    db.refresh(db_post)

    return ApprovePostResponse(
        status="approved",
        post_id=db_post.id,
        scheduled_time=db_post.scheduled_time or "2026-11-09T09:30:00Z",
        message=f"Post approved by {payload.approved_by} and scheduled for distribution.",
    )


@router.get(
    "/api/posts",
    summary="Fetch all posts from database filtered by status"
)
async def list_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(PostModel)
    if status_filter:
        query = query.filter(PostModel.status == status_filter)
    posts = query.order_by(PostModel.created_at.desc()).limit(20).all()

    return [
        {
            "id": p.id,
            "brand_name": p.brand_name,
            "topic": p.topic,
            "format": p.format,
            "hook": p.hook,
            "full_text": p.full_text,
            "status": p.status,
            "match_score": p.match_score,
            "scheduled_time": p.scheduled_time,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]
