"""
Advanced Content Operations API Router.
Manages Campaigns, Reusable Templates, Draft Approval State Machine, and Team Comments.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.database import get_db
from app.models.user import User
from app.models.brand import Brand
from app.models.post import Post
from app.models.content_operations import (
    Campaign,
    ContentTemplate,
    DraftApproval,
    DraftComment,
)
from app.routers.auth import get_current_user
from app.services.platform_integrations import PlatformSpecification, PlatformPublisher

router = APIRouter(prefix="/content-ops", tags=["Advanced Content Operations"])


# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class CampaignCreate(BaseModel):
    brand_id: str
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    target_engagement_rate: float = Field(default=10.0, ge=0.0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TemplateCreate(BaseModel):
    brand_id: str
    title: str = Field(..., min_length=2, max_length=255)
    hook_pattern: str = Field(..., min_length=5)
    body_template: str = Field(..., min_length=10)
    cta_pattern: str = Field(..., min_length=5)
    suggested_format: str = "REELS"


class ApprovalActionRequest(BaseModel):
    action: str = Field(..., pattern="^(submit|approve|reject)$")
    feedback_notes: Optional[str] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


# ---------------------------------------------------------
# Campaigns CRUD
# ---------------------------------------------------------

@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a strategic marketing campaign grouping posts and targets."""
    campaign = Campaign(
        brand_id=payload.brand_id,
        name=payload.name,
        description=payload.description,
        status="active",
        target_engagement_rate=payload.target_engagement_rate,
        start_date=payload.start_date or datetime.now(timezone.utc),
        end_date=payload.end_date,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    return {
        "id": campaign.id,
        "brand_id": campaign.brand_id,
        "name": campaign.name,
        "status": campaign.status,
        "target_engagement_rate": campaign.target_engagement_rate,
        "created_at": campaign.created_at.isoformat(),
    }


@router.get("/campaigns")
async def list_campaigns(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all active and completed campaigns for a brand."""
    stmt = (
        select(Campaign)
        .where(Campaign.brand_id == brand_id)
        .order_by(desc(Campaign.created_at))
    )
    res = await db.execute(stmt)
    campaigns = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "status": c.status,
            "target_engagement_rate": c.target_engagement_rate,
            "created_at": c.created_at.isoformat(),
        }
        for c in res.scalars().all()
    ]
    return {"brand_id": brand_id, "campaigns": campaigns}


# ---------------------------------------------------------
# Reusable Content Templates
# ---------------------------------------------------------

@router.post("/templates", status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stores a reusable high-performing hook, body, and CTA blueprint."""
    tmpl = ContentTemplate(
        brand_id=payload.brand_id,
        title=payload.title,
        hook_pattern=payload.hook_pattern,
        body_template=payload.body_template,
        cta_pattern=payload.cta_pattern,
        suggested_format=payload.suggested_format,
        created_by=current_user.id,
    )
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)

    return {
        "id": tmpl.id,
        "title": tmpl.title,
        "hook_pattern": tmpl.hook_pattern,
        "body_template": tmpl.body_template,
        "cta_pattern": tmpl.cta_pattern,
        "suggested_format": tmpl.suggested_format,
        "created_at": tmpl.created_at.isoformat(),
    }


@router.get("/templates")
async def list_templates(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves reusable content blueprints for a brand."""
    stmt = (
        select(ContentTemplate)
        .where(ContentTemplate.brand_id == brand_id)
        .order_by(desc(ContentTemplate.created_at))
    )
    res = await db.execute(stmt)
    templates = [
        {
            "id": t.id,
            "title": t.title,
            "hook_pattern": t.hook_pattern,
            "body_template": t.body_template,
            "cta_pattern": t.cta_pattern,
            "suggested_format": t.suggested_format,
            "created_at": t.created_at.isoformat(),
        }
        for t in res.scalars().all()
    ]
    return {"brand_id": brand_id, "templates": templates}


# ---------------------------------------------------------
# Approval Workflow State Machine
# ---------------------------------------------------------

@router.post("/posts/{post_id}/approval")
async def handle_post_approval(
    post_id: str,
    payload: ApprovalActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    State machine transition for post draft approval.
    Transitions:
    - 'submit'  -> pending_review
    - 'approve' -> approved
    - 'reject'  -> rejected
    """
    p_stmt = select(Post).where(Post.id == post_id)
    p_res = await db.execute(p_stmt)
    post = p_res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    a_stmt = select(DraftApproval).where(DraftApproval.post_id == post_id)
    a_res = await db.execute(a_stmt)
    approval = a_res.scalars().first()

    if not approval:
        approval = DraftApproval(
            post_id=post_id,
            requested_by=current_user.id,
            status="pending_review",
        )
        db.add(approval)

    if payload.action == "submit":
        approval.status = "pending_review"
        approval.requested_by = current_user.id
        post.status = "pending_approval"
    elif payload.action == "approve":
        approval.status = "approved"
        approval.reviewer_id = current_user.id
        approval.feedback_notes = payload.feedback_notes
        post.status = "approved"
    elif payload.action == "reject":
        approval.status = "rejected"
        approval.reviewer_id = current_user.id
        approval.feedback_notes = payload.feedback_notes
        post.status = "draft"

    await db.commit()
    await db.refresh(approval)

    return {
        "approval_id": approval.id,
        "post_id": post_id,
        "status": approval.status,
        "reviewer_id": approval.reviewer_id,
        "feedback_notes": approval.feedback_notes,
        "updated_at": approval.updated_at.isoformat(),
    }


@router.get("/posts/{post_id}/approval")
async def get_post_approval(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetches current approval status for a post draft."""
    stmt = select(DraftApproval).where(DraftApproval.post_id == post_id)
    res = await db.execute(stmt)
    approval = res.scalars().first()
    if not approval:
        return {"post_id": post_id, "status": "none", "is_approved": False}

    return {
        "approval_id": approval.id,
        "post_id": post_id,
        "status": approval.status,
        "is_approved": approval.status == "approved",
        "reviewer_id": approval.reviewer_id,
        "feedback_notes": approval.feedback_notes,
        "updated_at": approval.updated_at.isoformat(),
    }


# ---------------------------------------------------------
# Internal Peer Feedback / Draft Comments
# ---------------------------------------------------------

@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_draft_comment(
    post_id: str,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Appends an internal review comment to a draft."""
    comment = DraftComment(
        post_id=post_id,
        user_id=current_user.id,
        author_name=current_user.name,
        content=payload.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "author_name": comment.author_name,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


@router.get("/posts/{post_id}/comments")
async def list_draft_comments(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves asynchronous peer feedback thread for a draft."""
    stmt = (
        select(DraftComment)
        .where(DraftComment.post_id == post_id)
        .order_by(DraftComment.created_at.asc())
    )
    res = await db.execute(stmt)
    comments = [
        {
            "id": c.id,
            "user_id": c.user_id,
            "author_name": c.author_name,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
        }
        for c in res.scalars().all()
    ]
    return {"post_id": post_id, "comments": comments}


# ---------------------------------------------------------
# Platform Specifications
# ---------------------------------------------------------

@router.get("/platforms/specifications")
async def get_platform_specifications():
    """Returns technical specifications, token scopes, and rate limits for official APIs."""
    return {"platforms": PlatformSpecification.PLATFORMS}
