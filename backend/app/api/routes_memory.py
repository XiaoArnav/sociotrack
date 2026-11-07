"""
FastAPI routes for brand memory insights, sentiment signals, and learned lessons.
Owned by Person 2.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import LearnedLessonModel
from backend.app.schemas.memory_schema import (
    AudienceSentimentSchema,
    LearnedLessonSchema,
    MemoryInsightsResponse,
    PastWinningPostSchema,
)
from backend.app.core.memory import get_memory_manager

router = APIRouter(prefix="", tags=["Memory & Insights"])


@router.get(
    "/api/memory/insights",
    response_model=MemoryInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch audience sentiment, top winning posts, and learned lessons"
)
async def get_memory_insights(
    brand_name: str = Query("SocioTrack", description="Brand identifier"),
    topic: str = Query("LangGraph Multi-Agent Workflows", description="Context topic"),
    db: Session = Depends(get_db),
) -> MemoryInsightsResponse:
    mem_mgr = get_memory_manager(brand_name)
    top_posts_raw = mem_mgr.retrieve_top_posts(topic=topic, limit=5)
    sentiment_raw = mem_mgr.retrieve_sentiment(topic=topic)
    lessons_raw = mem_mgr.retrieve_lessons(topic=topic, limit=5)

    stats = mem_mgr.get_stats()

    # Format top winning posts
    formatted_posts: List[PastWinningPostSchema] = []
    for item in top_posts_raw:
        meta = item.get("metadata", {})
        formatted_posts.append(
            PastWinningPostSchema(
                id=meta.get("post_id", "post_unknown"),
                topic=meta.get("topic", topic),
                content=item.get("content", ""),
                hook=meta.get("hook", ""),
                composite_score=float(meta.get("composite_score", 0.0)),
                impressions=int(meta.get("impressions", 0)),
                shares=int(meta.get("shares", 0)),
                replies=int(meta.get("replies", 0)),
                likes=int(meta.get("likes", 0)),
                key_takeaway=meta.get("key_takeaway", "High practitioner resonance"),
            )
        )

    # Format current sentiment
    kw_raw = sentiment_raw.get("keywords", "")
    keywords = [k.strip() for k in kw_raw.split(",") if k.strip()] if isinstance(kw_raw, str) else []
    sentiment_schema = AudienceSentimentSchema(
        topic=topic,
        sentiment_label=sentiment_raw.get("sentiment_label", "neutral_interested"),
        sentiment_score=float(sentiment_raw.get("sentiment_score", 0.65)),
        summary=sentiment_raw.get("summary", "Demand for production benchmark metrics."),
        keywords=keywords,
    )

    # Format learned lessons (merge DB records and vector memory)
    formatted_lessons: List[LearnedLessonSchema] = []
    db_lessons = (
        db.query(LearnedLessonModel)
        .filter(LearnedLessonModel.brand_name == brand_name)
        .order_by(LearnedLessonModel.created_at.desc())
        .limit(5)
        .all()
    )

    for dbl in db_lessons:
        formatted_lessons.append(
            LearnedLessonSchema(
                id=dbl.id,
                topic=dbl.topic,
                key_lesson=dbl.key_lesson,
                composite_score=dbl.composite_score,
                derived_at=dbl.created_at.isoformat() if dbl.created_at else None,
            )
        )

    # If DB lessons are empty, fill from vector memory store
    if not formatted_lessons:
        for idx, l in enumerate(lessons_raw):
            meta = l.get("metadata", {})
            formatted_lessons.append(
                LearnedLessonSchema(
                    id=meta.get("lesson_id", f"lesson_{idx}"),
                    topic=meta.get("topic", topic),
                    key_lesson=meta.get("key_lesson", l.get("lesson", "")),
                    composite_score=float(meta.get("composite_score", 6.5)),
                    derived_at=None,
                )
            )

    return MemoryInsightsResponse(
        brand_name=brand_name,
        total_winning_posts=stats["winning_posts_count"],
        total_lessons_learned=max(stats["lessons_learned_count"], len(formatted_lessons)),
        current_sentiment=sentiment_schema,
        top_winning_posts=formatted_posts,
        learned_lessons=formatted_lessons,
    )
