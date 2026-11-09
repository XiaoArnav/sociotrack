"""
Router for Recommendation Evaluation, Learning Feedback Loop, and Research Backlog.
Lead Agent & Memory Systems: Arnav Patel
"""
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.brand import Brand
from app.models.memory import AgentMemory
from app.models.feedback import UserFeedback
from app.models.product_event import ProductEvent
from app.schemas.feedback import (
    RecommendationFeedbackCreate,
    RecommendationFeedbackResponse,
    UserFeedbackCreate,
    UserFeedbackResponse,
    FeedbackTriageUpdate,
    FeedbackBacklogSummary,
)
from app.core.memory import get_memory_manager
from app.routers.auth import get_current_user, is_admin_user
from app.schemas.auth import UserResponse
from app.services.authorization_service import verify_brand_access, get_accessible_brand_ids

router = APIRouter(prefix="/api", tags=["Recommendation Quality & Feedback"])


@router.post(
    "/recommendations/feedback",
    response_model=RecommendationFeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit user evaluation, rating, or rejection reason for an AI draft recommendation",
)
async def record_recommendation_feedback(
    payload: RecommendationFeedbackCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluates an AI recommendation.
    - If rejected: dynamically constructs a negative 'donts_avoided' guideline and injects it into vector memory.
    - If accepted with 4-5 stars: records positive validation.
    - Logs a telemetry ProductEvent.
    """
    # 1. Fetch & authorize brand
    brand = await verify_brand_access(db, payload.brand_id, current_user, min_role="editor")
    brand_name = brand.name if brand else "default_brand"

    # 2. Store in UserFeedback table
    feedback_record = UserFeedback(
        brand_id=payload.brand_id,
        user_id=current_user.id,
        draft_id=payload.draft_id,
        category="ai_quality",
        rating=payload.usefulness_rating,
        sentiment="positive" if payload.decision == "accepted" else ("negative" if payload.decision == "rejected" else "neutral"),
        message=payload.user_explanation or f"Recommendation {payload.decision} with reason {payload.rejection_reason}",
        rejection_reason=payload.rejection_reason,
        triage_status="resolved" if payload.decision == "accepted" else "new",
    )
    db.add(feedback_record)

    memory_lesson_created = False
    lesson_id = None
    confidence_impact = 0.0

    # 3. Memory Learning Feedback Loop
    if payload.decision == "rejected" and payload.rejection_reason:
        # A. Vector memory injection
        mem_mgr = get_memory_manager(brand_name)
        lesson_id, negative_lesson = mem_mgr.record_recommendation_rejection_lesson(
            rejection_reason=payload.rejection_reason,
            user_explanation=payload.user_explanation,
            topic="general",
        )

        # B. Relational database injection
        db_memory = AgentMemory(
            id=lesson_id,
            brand_id=payload.brand_id,
            category="donts_avoided",
            insight_text=negative_lesson,
            confidence_score=0.88,
            supporting_evidence=f"User Rejection [{payload.rejection_reason}]: {payload.user_explanation or 'Observed friction'}",
            source_event="recommendation_feedback",
            is_active=True,
        )
        db.add(db_memory)

        # C. Invalidate cached brand intelligence profile so next fetch refreshes
        if brand:
            brand.intelligence_profile = None

        memory_lesson_created = True
        confidence_impact = -0.15

    elif payload.decision == "accepted":
        confidence_impact = 0.10 if (payload.usefulness_rating or 5) >= 4 else 0.05

    # 4. Record product telemetry event
    ev = ProductEvent(
        event_name=f"recommendation_{payload.decision}",
        brand_id=payload.brand_id,
        duration_seconds=float(payload.usefulness_rating or 0),
        metadata_json=f'{{"reason": "{payload.rejection_reason or ""}", "draft_id": "{payload.draft_id}"}}',
    )
    db.add(ev)

    await db.commit()

    return RecommendationFeedbackResponse(
        status="recorded",
        feedback_id=feedback_record.id,
        memory_lesson_created=memory_lesson_created,
        lesson_id=lesson_id,
        confidence_impact=confidence_impact,
    )


@router.post(
    "/feedback",
    response_model=UserFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit user feedback, usability issue, or feature request",
)
async def submit_user_feedback(
    payload: UserFeedbackCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stores in-app feedback or bug reports into the research backlog."""
    if payload.brand_id:
        await verify_brand_access(db, payload.brand_id, current_user, min_role="viewer")

    feedback = UserFeedback(
        category=payload.category,
        message=payload.message,
        rating=payload.rating,
        brand_id=payload.brand_id,
        user_id=current_user.id,
        draft_id=payload.draft_id,
        triage_status="new",
    )
    db.add(feedback)

    # Telemetry
    ev = ProductEvent(
        event_name="feedback_submitted",
        user_id=current_user.id,
        brand_id=payload.brand_id,
        metadata_json=f'{{"category": "{payload.category}", "rating": {payload.rating or 0}}}',
    )
    db.add(ev)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get(
    "/feedback/backlog",
    response_model=FeedbackBacklogSummary,
    summary="Retrieve prioritized user feedback research backlog",
)
async def get_feedback_backlog(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, description="Filter by triage status"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregates user research feedback, ratings, and recurring friction points."""
    query = select(UserFeedback).order_by(desc(UserFeedback.created_at))

    # Multi-tenant boundary: non-admins only see their own submissions or feedback on their accessible brands
    if not is_admin_user(current_user):
        accessible_brand_ids = await get_accessible_brand_ids(db, current_user)
        access_conditions = [UserFeedback.user_id == current_user.id]
        if accessible_brand_ids:
            access_conditions.append(UserFeedback.brand_id.in_(accessible_brand_ids))
        query = query.where(or_(*access_conditions))

    if category:
        query = query.where(UserFeedback.category == category)
    if status_filter:
        query = query.where(UserFeedback.triage_status == status_filter)

    res = await db.execute(query)
    items = list(res.scalars().all())

    # Calculate average rating
    rated_items = [it.rating for it in items if it.rating is not None]
    avg_rating = round(sum(rated_items) / len(rated_items), 2) if rated_items else 0.0

    # Categorize counts
    by_category: Dict[str, int] = {}
    rejection_reasons: Dict[str, int] = {}
    for it in items:
        by_category[it.category] = by_category.get(it.category, 0) + 1
        if it.rejection_reason:
            rejection_reasons[it.rejection_reason] = rejection_reasons.get(it.rejection_reason, 0) + 1

    return FeedbackBacklogSummary(
        total_feedback_items=len(items),
        average_rating=avg_rating,
        by_category=by_category,
        rejection_reasons_breakdown=rejection_reasons,
        prioritized_items=items[:50],
    )


@router.put(
    "/feedback/{feedback_id}/triage",
    response_model=UserFeedbackResponse,
    summary="Update feedback triage status",
)
async def update_feedback_triage(
    feedback_id: str,
    payload: FeedbackTriageUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates triage status for a feedback or bug report item."""
    feedback = await db.get(UserFeedback, feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback item {feedback_id} not found."
        )

    # Authorization check
    if not is_admin_user(current_user):
        if feedback.brand_id:
            await verify_brand_access(db, feedback.brand_id, current_user, min_role="editor")
        elif feedback.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Cannot triage feedback belonging to another user.",
            )

    feedback.triage_status = payload.triage_status
    await db.commit()
    await db.refresh(feedback)
    return feedback
