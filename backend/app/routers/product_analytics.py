"""
Router for internal Product Usage Analytics.
Measures onboarding funnels, time-to-first-insight, recommendation adoption, and abandonment points.
Zero PII collected. Enforces authentication and impersonation guardrails.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from app.database import get_db
from app.models.product_event import ProductEvent
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user, get_optional_current_user, is_admin_user
from app.schemas.product_analytics import (
    ProductEventCreate,
    ProductEventResponse,
    ProductMetricsSummary,
)

router = APIRouter(prefix="/api/analytics/product", tags=["Product Analytics"])


@router.post("/event", response_model=ProductEventResponse, status_code=status.HTTP_201_CREATED)
async def record_product_event(
    payload: ProductEventCreate,
    optional_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingests a privacy-conscious product usage event.
    Guards against user impersonation:
    - If payload specifies a user_id, caller must be authenticated as that user (or have admin privileges).
    - If unauthenticated, caller cannot attribute events to arbitrary user IDs (anonymous events allow user_id=None).
    - If authenticated and payload.user_id is omitted, event is attributed to verified current_user.id.
    """
    if payload.user_id:
        if not optional_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to record telemetry events attributed to a specific user ID.",
            )
        if payload.user_id != optional_user.id and not is_admin_user(optional_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Cannot record telemetry events under another user's ID.",
            )
        effective_user_id = payload.user_id
    else:
        effective_user_id = optional_user.id if optional_user else None

    ev = ProductEvent(
        event_name=payload.event_name,
        user_id=effective_user_id,
        session_id=payload.session_id,
        brand_id=payload.brand_id,
        step_name=payload.step_name,
        duration_seconds=payload.duration_seconds,
        metadata_json=payload.metadata_json,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return ev


@router.get("/dashboard", response_model=ProductMetricsSummary)
async def get_product_analytics_dashboard(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregates product usage metrics, funnel completion, and adoption statistics.
    Protected endpoint: strictly requires authenticated session.
    """
    # 1. Total events count
    total_events_res = await db.execute(select(func.count(ProductEvent.id)))
    total_events = total_events_res.scalar() or 0

    # 2. Funnel metrics
    funnel_keys = [
        "onboarding_started",
        "onboarding_step_completed",
        "first_insight_generated",
        "onboarding_completed",
        "onboarding_abandoned",
    ]
    funnel_counts: Dict[str, int] = {}
    for k in funnel_keys:
        res = await db.execute(
            select(func.count(ProductEvent.id)).where(ProductEvent.event_name == k)
        )
        funnel_counts[k] = res.scalar() or 0

    # 3. Time to first insight avg seconds
    avg_insight_res = await db.execute(
        select(func.avg(ProductEvent.duration_seconds)).where(
            ProductEvent.event_name == "first_insight_generated",
            ProductEvent.duration_seconds.isnot(None)
        )
    )
    avg_insight = avg_insight_res.scalar()
    time_to_first_insight_avg = round(float(avg_insight), 1) if avg_insight else 0.0

    # 4. Recommendation acceptance vs rejection
    acc_res = await db.execute(
        select(func.count(ProductEvent.id)).where(ProductEvent.event_name == "recommendation_accepted")
    )
    rej_res = await db.execute(
        select(func.count(ProductEvent.id)).where(ProductEvent.event_name == "recommendation_rejected")
    )
    gen_res = await db.execute(
        select(func.count(ProductEvent.id)).where(ProductEvent.event_name == "recommendation_generated")
    )
    acc_count = acc_res.scalar() or 0
    rej_count = rej_res.scalar() or 0
    gen_count = gen_res.scalar() or (acc_count + rej_count)

    evaluated_total = acc_count + rej_count
    acc_rate = round(acc_count / evaluated_total, 2) if evaluated_total > 0 else 0.0
    rej_rate = round(rej_count / evaluated_total, 2) if evaluated_total > 0 else 0.0

    # 5. Weekly active users (distinct user_ids in last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    wau_res = await db.execute(
        select(func.count(distinct(ProductEvent.user_id))).where(
            ProductEvent.user_id.isnot(None),
            ProductEvent.created_at >= seven_days_ago
        )
    )
    wau = wau_res.scalar() or 0

    # 6. Top abandonment steps
    abandon_res = await db.execute(
        select(ProductEvent.step_name, func.count(ProductEvent.id))
        .where(
            ProductEvent.event_name == "onboarding_abandoned",
            ProductEvent.step_name.isnot(None)
        )
        .group_by(ProductEvent.step_name)
        .order_by(func.count(ProductEvent.id).desc())
        .limit(5)
    )
    top_abandonment_steps = [
        {"step": row[0], "abandonment_count": row[1]}
        for row in abandon_res.fetchall()
    ]

    # 7. Exports & Publishes
    exp_res = await db.execute(
        select(func.count(ProductEvent.id)).where(ProductEvent.event_name == "export_completed")
    )
    pub_res = await db.execute(
        select(func.count(ProductEvent.id)).where(ProductEvent.event_name == "publish_completed")
    )

    return ProductMetricsSummary(
        total_events=total_events,
        onboarding_funnel=funnel_counts,
        time_to_first_insight_avg_sec=time_to_first_insight_avg,
        recommendation_acceptance_rate=acc_rate,
        recommendation_rejection_rate=rej_rate,
        weekly_active_users=wau,
        top_abandonment_steps=top_abandonment_steps,
        total_exports=exp_res.scalar() or 0,
        total_publishes=pub_res.scalar() or 0,
    )
