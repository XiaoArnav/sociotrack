"""
FastAPI routes for social engagement simulation and metrics feeding.
Owned by Person 2.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import MetricModel, LearnedLessonModel
from backend.app.schemas.post_schema import (
    SimulatorFeedRequest,
    SimulatorFeedResponse,
)
from backend.app.core.agent import SocialEngagementAgent
from backend.app.core.memory import get_memory_manager

router = APIRouter(prefix="", tags=["Simulator"])


@router.post(
    "/api/simulator/feed-metrics",
    response_model=SimulatorFeedResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate post engagement metrics, compute composite score, and update memory"
)
async def feed_simulator_metrics(
    payload: SimulatorFeedRequest,
    db: Session = Depends(get_db),
) -> SimulatorFeedResponse:
    try:
        mem_mgr = get_memory_manager(payload.brand_name)
        agent = SocialEngagementAgent(memory_mgr=mem_mgr)

        state = agent.evaluate_performance(
            brand_name=payload.brand_name,
            topic=payload.topic,
            post_content=payload.post_content,
            metrics=payload.metrics,
        )

        fb = state.performance_feedback
        if not fb:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to compute feedback from agent pipeline."
            )

        # Record metrics in relational database
        db_metric = MetricModel(
            impressions=payload.metrics.impressions,
            shares=payload.metrics.shares,
            replies=payload.metrics.replies,
            likes=payload.metrics.likes,
            composite_score=fb.composite_score,
        )
        db.add(db_metric)

        # If high score (> 5.0), also record learned lesson in relational database
        if fb.qualifies_for_memory and fb.key_lesson:
            db_lesson = LearnedLessonModel(
                brand_name=payload.brand_name,
                topic=payload.topic,
                post_content=payload.post_content,
                key_lesson=fb.key_lesson,
                composite_score=fb.composite_score,
                memory_doc_id=fb.memory_doc_id,
            )
            db.add(db_lesson)

        db.commit()

        return fb
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation feed failed: {str(e)}",
        )
