"""
Database Seed Script for SocioTrack.
Populates initial sample brands, posts, analytics, and agent memories.
Usable with both SQLite and PostgreSQL.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.database import async_session_maker, init_db
from app.models.brand import Brand
from app.models.post import Post
from app.models.analytics import PostAnalytics
from app.models.memory import AgentMemory


async def run_seed():
    print("🌱 Initializing database schema...")
    await init_db()

    async with async_session_maker() as session:
        # Check if already seeded
        existing_brand = await session.execute(
            select(Brand).where(Brand.id == "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")
        )
        if existing_brand.scalar_one_or_none():
            print("ℹ️ Database already contains sample seed brands. Skipping seed.")
            return

        print("📦 Seeding brands...")
        brand_1 = Brand(
            id="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            name="DevRelay",
            voice_description="Pragmatic, technical, no-nonsense senior engineer tone with subtle dry humor. Prefers direct code examples over marketing buzzwords.",
            target_audience="Full-stack developers, engineering leads, open-source contributors, devops practitioners.",
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        brand_2 = Brand(
            id="b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
            name="CloudScale",
            voice_description="Authoritative, architecture-focused, enterprise-ready. Data-driven insights on cloud infrastructure and cost optimization.",
            target_audience="CTOs, VP of Engineering, Cloud Architects, Site Reliability Engineers.",
            created_at=datetime.now(timezone.utc) - timedelta(days=20),
        )
        session.add_all([brand_1, brand_2])
        await session.flush()

        print("📝 Seeding posts...")
        post_1 = Post(
            id="c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
            brand_id=brand_1.id,
            content="Most agents forget the context 5 turns later. Here is how we wired Hindsight memory banks to retain developer preferences across sessions.",
            topic="Agent Memory",
            hook_style="problem_agitation",
            status="published",
            scheduled_for=datetime.now(timezone.utc) - timedelta(days=3),
            created_at=datetime.now(timezone.utc) - timedelta(days=4),
        )
        post_2 = Post(
            id="d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90",
            brand_id=brand_1.id,
            content="Stop dumping your entire database schema into the system prompt. Deep module architecture + vector memory cuts token burn by 73%.",
            topic="Architecture & Token Optimization",
            hook_style="contrarian",
            status="published",
            scheduled_for=datetime.now(timezone.utc) - timedelta(days=1),
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
        post_3 = Post(
            id="e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9012",
            brand_id=brand_1.id,
            content="How do you test non-deterministic AI agents? We wrote 40 pytest cases around deterministic boundary seams. Thread below 👇",
            topic="Testing & TDD for AI",
            hook_style="question_hook",
            status="scheduled",
            scheduled_for=datetime.now(timezone.utc) + timedelta(hours=4),
            created_at=datetime.now(timezone.utc) - timedelta(hours=6),
        )
        post_4 = Post(
            id="f6a7b89c-0d1e-2f3a-4b5c-6d7e8f901234",
            brand_id=brand_1.id,
            content="Controversial take: LLMs shouldn't manage their own state. You need an external memory engine that distinguishes facts from hallucinated summaries.",
            topic="Agent Architecture",
            hook_style="contrarian",
            status="pending_approval",
            scheduled_for=None,
            created_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        session.add_all([post_1, post_2, post_3, post_4])
        await session.flush()

        print("📊 Seeding analytics...")
        analytics_1 = PostAnalytics(
            id="aa11bb22-cc33-dd44-ee55-ff6677889900",
            post_id=post_1.id,
            impressions=12500,
            likes=480,
            replies=72,
            shares=54,
            engagement_score=6.79,
            recorded_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
        analytics_2 = PostAnalytics(
            id="bb22cc33-dd44-ee55-ff66-778899001122",
            post_id=post_2.id,
            impressions=21400,
            likes=1150,
            replies=185,
            shares=142,
            engagement_score=9.86,
            recorded_at=datetime.now(timezone.utc) - timedelta(hours=12),
        )
        session.add_all([analytics_1, analytics_2])

        print("🧠 Seeding learned agent memories (Hindsight insights)...")
        mem_1 = AgentMemory(
            id="dd44ee55-ff66-7788-9900-112233445566",
            brand_id=brand_1.id,
            insight_text="Contrarian hooks challenging industry orthodoxy on agent state generate 2.8x higher reply rates among senior engineers.",
            category="hook_rule",
            confidence_score=0.920,
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
        mem_2 = AgentMemory(
            id="ee55ff66-7788-9900-1122-334455667788",
            brand_id=brand_1.id,
            insight_text="Dev audiences disengage from generic hype; posts citing specific architectural percentages (e.g. 73% token reduction) double bookmark and share velocity.",
            category="hook_rule",
            confidence_score=0.880,
            created_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        mem_3 = AgentMemory(
            id="ff667788-9900-1122-3344-556677889900",
            brand_id=brand_1.id,
            insight_text="Publishing technical posts between 08:30 and 10:15 AM EST on Tuesday and Thursday produces peak tech Twitter/LinkedIn dwell time.",
            category="timing_rule",
            confidence_score=0.850,
            created_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        mem_4 = AgentMemory(
            id="00112233-4455-6677-8899-aabbccddeeff",
            brand_id=brand_1.id,
            insight_text="Audience intensely feels the pain of non-deterministic LLM behavior in production and high API token expenses in multi-agent loops.",
            category="audience_pain_point",
            confidence_score=0.940,
            created_at=datetime.now(timezone.utc) - timedelta(days=5),
        )
        session.add_all([mem_1, mem_2, mem_3, mem_4])

        await session.commit()
        print("✅ Database successfully seeded with rich mock data!")


if __name__ == "__main__":
    asyncio.run(run_seed())
