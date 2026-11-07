"""
Database and Vector Store Seeding Script.
Owned by Person 4.

Populates initial winning posts, audience sentiments, and learned lessons.
Run via:
    python backend/scripts/seed_db.py
"""

import sys
import os
import uuid

# Ensure backend package can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.db.session import init_db, SessionLocal
from backend.app.db.models import PostModel, MetricModel, LearnedLessonModel, SentimentModel
from backend.app.schemas.post_schema import EngagementMetricsSchema
from backend.app.core.memory import get_memory_manager


def seed():
    print("=" * 60)
    print("SocioTrack Seeding: Relational DB & Vector Store")
    print("=" * 60)

    # 1. Initialize DB tables
    init_db()
    db = SessionLocal()

    brand_name = "SocioTrack"
    mem_mgr = get_memory_manager(brand_name)

    # 2. Seed Winning Post 1 (Data-first)
    p1_content = (
        "We migrated our multi-agent pipelines from unbounded autonomous loops to LangGraph StateGraph.\n"
        "Results after 100,000 runs:\n"
        "• P99 agent latency dropped from 14.2s to 3.8s (-73%)\n"
        "• Failed execution recovery rate improved from 42% to 99.4%\n"
        "• Token expenditure cut by 61% through localized memory checkpointing."
    )
    p1_topic = "Deterministic State Management with LangGraph"
    p1_metrics = EngagementMetricsSchema(impressions=25000, shares=320, replies=140, likes=850)

    db_p1 = PostModel(
        id=str(uuid.uuid4()),
        brand_name=brand_name,
        topic=p1_topic,
        format="Format A: Data-first",
        hook="We migrated our multi-agent pipelines from unbounded loops to LangGraph StateGraph.",
        body=p1_content,
        call_to_action="Are you tracking token cost per agent run yet?",
        full_text=p1_content,
        status="published",
        match_score=9.8,
        scheduled_time="2026-11-05T09:30:00Z",
    )
    db.add(db_p1)

    # Vector store ingestion
    mem_mgr.ingest_post(
        topic=p1_topic,
        content=p1_content,
        metrics=p1_metrics,
        hook="We migrated our multi-agent pipelines from unbounded loops to LangGraph StateGraph.",
        key_takeaway="Quantitative latency and token reduction triggers 3x higher engineering shares.",
        post_id=f"win_{db_p1.id[:8]}",
    )

    # 3. Seed Winning Post 2 (Hot take)
    p2_content = (
        "Hot take: 90% of 'multi-agent systems' built this year are just overcomplicated while-loops.\n"
        "If your agents don't have deterministic state schemas, checkpoint persistence, and "
        "clear boundary evaluators, you don't have agents—you have distributed nondeterminism."
    )
    p2_topic = "Agent Architecture Realities"
    p2_metrics = EngagementMetricsSchema(impressions=18000, shares=210, replies=190, likes=620)

    db_p2 = PostModel(
        id=str(uuid.uuid4()),
        brand_name=brand_name,
        topic=p2_topic,
        format="Format B: Hot take",
        hook="Hot take: 90% of 'multi-agent systems' are overcomplicated while-loops.",
        body=p2_content,
        call_to_action="Where have you seen unconstrained swarms beat deterministic graphs?",
        full_text=p2_content,
        status="published",
        match_score=9.4,
        scheduled_time="2026-11-06T09:30:00Z",
    )
    db.add(db_p2)

    mem_mgr.ingest_post(
        topic=p2_topic,
        content=p2_content,
        metrics=p2_metrics,
        hook="Hot take: 90% of 'multi-agent systems' are overcomplicated while-loops.",
        key_takeaway="Contrarian hook debunking agent swarms creates viral comment threads.",
        post_id=f"win_{db_p2.id[:8]}",
    )

    # 4. Seed Winning Post 3 (Tactical breakdown)
    p3_content = (
        "4 rules for building bulletproof LangGraph workflows in production:\n"
        "1. Enforce Pydantic typing on every State field.\n"
        "2. Decouple retrieval nodes from LLM generation passes.\n"
        "3. Embed a critique node before dispatch.\n"
        "4. Compute composite engagement scores to feed long-term vector memory."
    )
    p3_topic = "Production LangGraph Framework"
    p3_metrics = EngagementMetricsSchema(impressions=22000, shares=290, replies=95, likes=710)

    db_p3 = PostModel(
        id=str(uuid.uuid4()),
        brand_name=brand_name,
        topic=p3_topic,
        format="Format C: Tactical breakdown",
        hook="4 rules for building bulletproof LangGraph workflows in production:",
        body=p3_content,
        call_to_action="Save this framework for your next sprint.",
        full_text=p3_content,
        status="published",
        match_score=9.7,
        scheduled_time="2026-11-07T09:30:00Z",
    )
    db.add(db_p3)

    mem_mgr.ingest_post(
        topic=p3_topic,
        content=p3_content,
        metrics=p3_metrics,
        hook="4 rules for building bulletproof LangGraph workflows in production:",
        key_takeaway="Numbered actionable steps with zero fluff maximize bookmarking and reposts.",
        post_id=f"win_{db_p3.id[:8]}",
    )

    # 5. Seed Audience Sentiment
    mem_mgr.ingest_sentiment(
        topic=p1_topic,
        sentiment_label="cautious_and_demanding",
        sentiment_score=0.74,
        summary="Engineers want verifiable benchmarks and state machine architectures over toy demos.",
        keywords=["benchmarks", "state machines", "deterministic agents", "cost reduction"],
    )

    db_sent = SentimentModel(
        id=str(uuid.uuid4()),
        brand_name=brand_name,
        topic=p1_topic,
        sentiment_label="cautious_and_demanding",
        sentiment_score=0.74,
        summary="Engineers want verifiable benchmarks and state machine architectures over toy demos.",
        keywords="benchmarks, state machines, deterministic agents, cost reduction",
    )
    db.add(db_sent)

    # 6. Seed a Learned Lesson (Composite Score 8.8 > 5.0)
    db_lesson = LearnedLessonModel(
        id=str(uuid.uuid4()),
        brand_name=brand_name,
        topic=p1_topic,
        post_content=p1_content,
        key_lesson="P99 latency benchmarks and token reduction stats drive highest technical leadership share rates.",
        composite_score=8.8,
        memory_doc_id="lesson_seed_001",
    )
    db.add(db_lesson)

    # 7. Seed from seed_data.json if present (15 realistic brand posts & 6 extracted memories)
    seed_json_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    if not os.path.exists(seed_json_path):
        seed_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../seed_data.json"))

    if os.path.exists(seed_json_path):
        import json
        with open(seed_json_path, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

        posts_data = seed_data.get("posts", [])
        memories_data = seed_data.get("memories", [])

        seeded_posts_count = 0
        for p in posts_data:
            content = p.get("content", "")
            metrics_dict = p.get("metrics", {})
            m_obj = EngagementMetricsSchema(
                impressions=metrics_dict.get("impressions", 1000),
                shares=metrics_dict.get("reposts", 10),
                replies=metrics_dict.get("replies", 5),
                likes=metrics_dict.get("likes", 20),
            )
            post_id = p.get("id", str(uuid.uuid4()))
            perf_tier = p.get("performance_tier", "mediocre")

            existing_post = db.query(PostModel).filter(PostModel.id == post_id).first()
            if not existing_post:
                themes = p.get("metadata", {}).get("key_themes", [])
                post_topic = themes[0].replace("-", " ").title() if themes else "Systems Caching & State"
                db_post = PostModel(
                    id=post_id,
                    brand_name=p.get("brand", brand_name),
                    topic=post_topic,
                    format="Format B: Hot take" if perf_tier == "high" else "Format A: Data-first",
                    hook=content.split("\n")[0] if "\n" in content else content[:80],
                    body=content,
                    call_to_action=content.split("\n")[-1] if "\n" in content else "What are your thoughts?",
                    full_text=content,
                    status="published",
                    match_score=9.6 if perf_tier == "high" else 7.2,
                    scheduled_time=p.get("posted_at", "2026-10-14T14:00:00Z"),
                )
                db.add(db_post)

                if perf_tier == "high":
                    mem_mgr.ingest_post(
                        topic=post_topic,
                        content=content,
                        metrics=m_obj,
                        hook=db_post.hook,
                        key_takeaway=f"Contrarian insight: {db_post.hook}",
                        post_id=post_id,
                    )
                seeded_posts_count += 1

        for mem in memories_data:
            mem_id = mem.get("id", str(uuid.uuid4()))
            existing_lesson = db.query(LearnedLessonModel).filter(LearnedLessonModel.id == mem_id).first()
            if not existing_lesson:
                db_lesson = LearnedLessonModel(
                    id=mem_id,
                    brand_name=brand_name,
                    topic=mem.get("category", "General").replace("_", " ").title(),
                    post_content=mem.get("insight", ""),
                    key_lesson=mem.get("operational_rule", ""),
                    composite_score=round(mem.get("confidence_score", 0.9) * 10, 1),
                    memory_doc_id=mem_id,
                )
                db.add(db_lesson)

        print(f"✓ Successfully seeded {seeded_posts_count} additional posts and {len(memories_data)} structured memories from seed_data.json.")

    db.commit()
    db.close()

    stats = mem_mgr.get_stats()
    print("✓ Successfully seeded 3 past winning posts into DB and ChromaDB.")
    print("✓ Successfully seeded audience sentiment records.")
    print("✓ Successfully seeded learned historical lessons.")
    print(f"✓ Current Vector Store Stats: {stats}")
    print("=" * 60)


if __name__ == "__main__":
    seed()
