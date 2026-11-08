"""
Adaptive Brand Intelligence Service.
Builds and maintains independent, structured BrandIntelligenceProfile instances
derived from real post history, engagement telemetry, vector lessons, and user feedback.

Owned by Person 2 (Arnav Patel) & Person 1 (Krishna Verma).
"""

import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.schemas.brand import (
    BrandIntelligenceProfile,
    BrandVoiceArchetype,
    TopicAffinity,
    FormatPerformance,
    TimingRecommendation,
)
from app.core.memory import get_memory_manager


def build_brand_intelligence_profile(
    brand: Brand,
    posts: Optional[List[Post]] = None,
    db_memories: Optional[List[AgentMemory]] = None,
) -> BrandIntelligenceProfile:
    """
    Analyzes historical posts, engagement telemetry, active vector memories,
    and user edit patterns to synthesize a structured brand intelligence profile.
    Explicitly tags metrics as 'empirical' vs 'insufficient_data'.
    """
    posts = posts or []
    db_memories = db_memories or []
    total_posts = len(posts)

    # 2. Topic Affinity Analysis
    topic_data: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"posts": 0, "total_score": 0.0, "total_shares": 0, "total_likes": 0, "total_impressions": 0}
    )

    format_data: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"sample_size": 0, "shares": 0, "saves": 0, "impressions": 0, "total_ratio": 0.0}
    )

    hourly_performance: Dict[int, List[float]] = defaultdict(list)
    day_performance: Dict[str, List[float]] = defaultdict(list)

    for p in posts:
        topic = p.topic or "General Engineering"
        analytics = getattr(p, "analytics", None)
        score = float(analytics.engagement_score if analytics else getattr(p, "composite_score", 5.0))
        shares = int(analytics.shares if analytics else getattr(p, "shares_count", 0))
        likes = int(analytics.likes if analytics else getattr(p, "likes_count", 0))
        impressions = max(1, int(analytics.impressions if analytics else getattr(p, "impressions_count", 1)))

        topic_data[topic]["posts"] += 1
        topic_data[topic]["total_score"] += score
        topic_data[topic]["total_shares"] += shares
        topic_data[topic]["total_likes"] += likes
        topic_data[topic]["total_impressions"] += impressions

        # Detect format from topic, title, or length
        content_len = len(p.content or "")
        if "carousel" in (p.content or "").lower() or "slide" in (p.content or "").lower():
            fmt = "Framework Breakdown / Carousel"
        elif content_len < 180:
            fmt = "Single Punchy Observation"
        elif "step" in (p.content or "").lower() or "1." in (p.content or ""):
            fmt = "Structured Tactical Playbook"
        else:
            fmt = "Deep Technical Essay"

        format_data[fmt]["sample_size"] += 1
        format_data[fmt]["shares"] += shares
        format_data[fmt]["saves"] += shares // 2  # Conservative estimate when save not split
        format_data[fmt]["impressions"] += impressions
        conversion = (shares / impressions) * 100.0
        format_data[fmt]["total_ratio"] += conversion

        # Timestamp analysis
        if p.created_at:
            dt = p.created_at
            hourly_performance[dt.hour].append(score)
            day_name = dt.strftime("%A")
            day_performance[day_name].append(score)

    # Format Topic Affinities
    topics: List[TopicAffinity] = []
    for topic, stats in topic_data.items():
        count = stats["posts"]
        avg_score = stats["total_score"] / count if count > 0 else 0.0
        avg_er = (
            (stats["total_shares"] * 3 + stats["total_likes"]) / max(1, stats["total_impressions"]) * 100.0
        )
        status = "empirical" if count >= 2 else "insufficient_data"
        topics.append(
            TopicAffinity(
                topic=topic,
                affinity_score=round(min(10.0, avg_score), 2),
                observed_post_count=count,
                avg_engagement_rate=round(avg_er, 2),
                status=status,
            )
        )

    # If no posts exist yet, provide initial baseline topics tagged as insufficient_data
    if not topics:
        topics = [
            TopicAffinity(
                topic="Systems Architecture & Benchmarks",
                affinity_score=8.5,
                observed_post_count=0,
                avg_engagement_rate=0.0,
                status="insufficient_data",
            ),
            TopicAffinity(
                topic="AI Agent Workflows & Memory",
                affinity_score=8.2,
                observed_post_count=0,
                avg_engagement_rate=0.0,
                status="insufficient_data",
            ),
        ]

    # Format Performance
    formats: List[FormatPerformance] = []
    for fmt, stats in format_data.items():
        sample = stats["sample_size"]
        avg_conv = stats["total_ratio"] / sample if sample > 0 else 0.0
        shares_reach = stats["shares"] / max(1, stats["impressions"])
        saves_reach = stats["saves"] / max(1, stats["impressions"])
        status = "empirical" if sample >= 2 else "insufficient_data"
        formats.append(
            FormatPerformance(
                format_name=fmt,
                conversion_ratio=round(avg_conv, 3),
                shares_per_reach=round(shares_reach, 4),
                saves_per_reach=round(saves_reach, 4),
                sample_size=sample,
                status=status,
            )
        )

    if not formats:
        formats = [
            FormatPerformance(
                format_name="Framework Breakdown / Carousel",
                conversion_ratio=4.80,
                shares_per_reach=0.038,
                saves_per_reach=0.025,
                sample_size=0,
                status="insufficient_data",
            ),
            FormatPerformance(
                format_name="Single Punchy Observation",
                conversion_ratio=2.90,
                shares_per_reach=0.015,
                saves_per_reach=0.008,
                sample_size=0,
                status="insufficient_data",
            ),
        ]

    # Timing Recommendations
    if hourly_performance and sum(len(v) for v in hourly_performance.values()) >= 3:
        best_hours = sorted(
            hourly_performance.keys(),
            key=lambda h: sum(hourly_performance[h]) / len(hourly_performance[h]),
            reverse=True,
        )[:2]
        best_days = sorted(
            day_performance.keys(),
            key=lambda d: sum(day_performance[d]) / len(day_performance[d]),
            reverse=True,
        )[:3]
        confidence = 0.88
        evidence = f"Empirical analysis of {total_posts} published posts across peak engagement velocity windows."
    else:
        best_hours = [14, 17]
        best_days = ["Tuesday", "Wednesday", "Thursday"]
        confidence = 0.50
        evidence = "Baseline engineering distribution curve (Insufficient brand posts for dedicated empirical curve)."

    timing = TimingRecommendation(
        optimal_hours_utc=best_hours,
        best_days=best_days,
        confidence=confidence,
        evidence=evidence,
    )

    # 3. Voice Archetype derived from Brand preferences and Vector Memory lessons
    mem_mgr = get_memory_manager(brand.name)
    vector_lessons = mem_mgr.retrieve_lessons(topic="voice", limit=10, active_only=True)

    dos = [
        "Include concrete production latency or efficiency numbers",
        "Lead with non-obvious technical trade-offs",
        "Direct practitioner-to-practitioner tone",
    ]
    donts = [
        "Speculative buzzwords ('revolutionary', 'game-changing')",
        "Passive marketing questions ('What do you think? Drop comments!')",
        "Over-promising unverified capabilities",
    ]
    anti_patterns = [
        "Generic top-10 listicles without architecture diagrams",
        "Engagement baiting without novel code or benchmarks",
    ]

    # Extract user edits or specific preference memories
    for mem in db_memories:
        if mem.category in ("hook_rule", "user_preference") and mem.insight_text:
            if "avoid" in mem.insight_text.lower() or "don't" in mem.insight_text.lower():
                if mem.insight_text not in donts:
                    donts.append(mem.insight_text[:120])
            else:
                if mem.insight_text not in dos:
                    dos.append(mem.insight_text[:120])

    voice = BrandVoiceArchetype(
        tone=brand.voice_description or "Direct, analytical, practitioner-focused",
        formality="conversational_technical",
        vocabulary_dos=dos[:5],
        vocabulary_donts=donts[:5],
        anti_patterns=anti_patterns[:3],
    )

    total_lessons = len(db_memories) + len(vector_lessons)

    # Data Sufficiency
    if total_posts >= 5 and total_lessons >= 3:
        data_sufficiency = "high"
    elif total_posts >= 2 or total_lessons >= 1:
        data_sufficiency = "moderate"
    else:
        data_sufficiency = "insufficient"

    return BrandIntelligenceProfile(
        brand_id=brand.id,
        brand_name=brand.name,
        voice_archetype=voice,
        topics=topics,
        format_performance=formats,
        timing=timing,
        total_posts_analyzed=total_posts,
        total_lessons_accumulated=total_lessons,
        data_sufficiency=data_sufficiency,
        last_updated=datetime.now(timezone.utc).isoformat(),
    )


async def refresh_brand_intelligence_async(brand_id: str, db: Any) -> BrandIntelligenceProfile:
    """
    Asynchronously gathers posts and memories, computes updated profile,
    and updates Brand.intelligence_profile in database.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.brand import Brand
    from app.models.post import Post
    from app.models.memory import AgentMemory

    b_res = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = b_res.scalar_one_or_none()
    if not brand:
        raise ValueError(f"Brand with id '{brand_id}' not found.")

    p_res = await db.execute(
        select(Post)
        .where(Post.brand_id == brand_id)
        .options(selectinload(Post.analytics))
        .order_by(Post.created_at.desc())
    )
    posts = list(p_res.scalars().all())

    m_res = await db.execute(
        select(AgentMemory).where(AgentMemory.brand_id == brand_id, AgentMemory.is_active.is_(True))
    )
    db_memories = list(m_res.scalars().all())

    profile = build_brand_intelligence_profile(brand, posts=posts, db_memories=db_memories)
    brand.intelligence_profile = profile.model_dump_json()
    brand.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return profile
