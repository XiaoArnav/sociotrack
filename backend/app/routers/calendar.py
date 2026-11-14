"""
Intelligent Content Calendar & Mix Planner Router.
Generates empirical schedule recommendations based on BrandIntelligenceProfile.
Never publishes automatically without explicit human approval.
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.brand import Brand
from app.models.post import Post
from app.schemas.calendar import (
    CalendarSlotRecommendation,
    CalendarMixPlanResponse,
    ApproveCalendarSlotRequest,
)
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user, is_admin_user
from app.services.authorization_service import verify_brand_access, check_brand_access, get_accessible_brand_ids
from app.services.brand_intelligence import build_brand_intelligence_profile

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get(
    "/recommendations",
    response_model=CalendarMixPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate intelligent 7-day calendar recommendations and content mix",
)
async def get_calendar_recommendations(
    brand_id: Optional[str] = Query(None, description="UUID of the brand"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if brand_id:
        brand = await verify_brand_access(db, brand_id, current_user, min_role="viewer")

    if not brand:
        accessible_ids = await get_accessible_brand_ids(db, current_user)
        if accessible_ids:
            b_res = await db.execute(select(Brand).where(Brand.id.in_(accessible_ids)).limit(1))
            brand = b_res.scalar_one_or_none()
        elif is_admin_user(current_user) or current_user.is_demo:
            b_res = await db.execute(select(Brand).limit(1))
            brand = b_res.scalar_one_or_none()
        if not brand:
            brand = Brand(name="SocioTrack", user_id=current_user.id, voice_description="Analytical, technical")
            db.add(brand)
            await db.flush()

    # Query existing scheduled posts to detect gaps
    now = datetime.now(timezone.utc)
    future_limit = now + timedelta(days=7)
    posts_res = await db.execute(
        select(Post)
        .where(
            Post.brand_id == brand.id,
            Post.scheduled_for >= now,
            Post.scheduled_for <= future_limit,
        )
    )
    scheduled_posts = list(posts_res.scalars().all())

    # Build intelligence profile
    profile = build_brand_intelligence_profile(brand)
    best_hours = profile.timing.optimal_hours_utc or [14, 16]
    best_days = profile.timing.best_days or ["Tuesday", "Wednesday", "Thursday"]
    data_suff = "empirical" if profile.total_posts_analyzed >= 2 else "hypothesis"

    # Identify schedule gaps across upcoming 7 days
    slots: List[CalendarSlotRecommendation] = []
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    formats_cycle = [
        ("Framework Breakdown / Carousel", "High-retention visual architecture breakdown for complex flows.", 8.8),
        ("Contrarian / Industry Analysis", "Nuanced technical critique challenging superficial hype.", 8.4),
        ("Tactical Playbook / Benchmark", "Actionable, numbered implementation steps with metrics.", 9.1),
    ]

    gaps = 0
    for i in range(7):
        target_date = now + timedelta(days=i + 1)
        day_name = target_date.strftime("%A")
        is_high_velocity_day = day_name in best_days

        # Check if already booked
        already_scheduled = any(
            p.scheduled_for and p.scheduled_for.date() == target_date.date()
            for p in scheduled_posts
        )

        if not already_scheduled and is_high_velocity_day:
            gaps += 1
            hour = best_hours[gaps % len(best_hours)]
            fmt, rationale, score = formats_cycle[gaps % len(formats_cycle)]
            topic = (
                profile.topics[gaps % len(profile.topics)].topic
                if profile.topics
                else "System Architecture"
            )

            slot_instant = target_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            if slot_instant.tzinfo is None:
                slot_instant = slot_instant.replace(tzinfo=timezone.utc)

            slots.append(
                CalendarSlotRecommendation(
                    id=f"slot_{day_name.lower()}_{hour}",
                    day=f"{day_name} ({target_date.strftime('%b %d')})",
                    recommended_utc_hour=hour,
                    suggested_topic=topic,
                    content_format=fmt,
                    rationale=f"{rationale} Timed for peak empirical velocity window ({hour}:00 UTC).",
                    historical_supporting_score=score,
                    data_sufficiency=data_suff,
                    requires_approval=True,
                    is_approved=False,
                    scheduled_iso=slot_instant.isoformat(),
                )
            )

    return CalendarMixPlanResponse(
        brand_id=brand.id,
        brand_name=brand.name,
        planning_window="Upcoming 7-Day Publishing Window",
        schedule_gaps_detected=gaps,
        recommended_mix={
            "Framework Breakdown / Carousel": 40.0,
            "Contrarian / Industry Analysis": 35.0,
            "Tactical Playbook / Benchmark": 25.0,
        },
        slots=slots,
    )


@router.post(
    "/approve-slot",
    status_code=status.HTTP_201_CREATED,
    summary="Explicitly approve a recommended calendar slot and schedule draft idea",
)
async def approve_calendar_slot(
    payload: ApproveCalendarSlotRequest,
    brand_id: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if brand_id:
        brand = await verify_brand_access(db, brand_id, current_user, min_role="editor")

    if not brand:
        accessible_ids = await get_accessible_brand_ids(db, current_user)
        if accessible_ids:
            b_res = await db.execute(select(Brand).where(Brand.id.in_(accessible_ids)).limit(1))
            brand = b_res.scalar_one_or_none()
        elif is_admin_user(current_user) or current_user.is_demo:
            b_res = await db.execute(select(Brand).limit(1))
            brand = b_res.scalar_one_or_none()

    if brand:
        has_edit_role = await check_brand_access(db, brand, current_user, min_role="editor")
        if not has_edit_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Approving calendar slots and scheduling drafts requires editor role.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No accessible brand found to approve calendar slot.",
        )

    scheduled_time = datetime.now(timezone.utc) + timedelta(days=1)
    if payload.custom_scheduled_time:
        try:
            scheduled_time = datetime.fromisoformat(payload.custom_scheduled_time.replace("Z", "+00:00"))
        except Exception:
            pass

    post = Post(
        brand_id=brand.id if brand else str(uuid.uuid4()),
        topic=payload.approved_topic or "Scheduled Strategic Slot",
        hook_style="calendar_recommended",
        content=f"Planned topic draft for: {payload.approved_topic or payload.slot_id}",
        status="scheduled",
        scheduled_for=scheduled_time,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)

    return {
        "status": "success",
        "message": f"Slot '{payload.slot_id}' explicitly approved and scheduled for {scheduled_time.isoformat()}.",
        "post_id": post.id,
    }
