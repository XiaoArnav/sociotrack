"""
Automatic seed service for finals demo account, workspace, and brand.
Guarantees that a fresh Supabase / PostgreSQL database is immediately
walkthrough-ready without manual SQL execution.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.database import async_session_maker
from app.core.security import hash_password
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.brand import Brand
from app.models.memory import AgentMemory
from app.models.post import Post

logger = logging.getLogger("uvicorn.error")

DEMO_USER_EMAIL = "alex.chen@enterprise.com"
DEMO_USER_PASSWORD = "DemoPass2026!"
DEMO_USER_ID = "u1_demo_finals_user"
DEMO_WORKSPACE_ID = "ws_demo_finals_workspace"
DEMO_BRAND_ID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"


async def seed_demo_data(force: bool = False) -> bool:
    """
    Seeds the required demo user, workspace, brand, posts, and memories
    if they do not already exist in the database.
    """
    async with async_session_maker() as session:
        # Check if demo user already exists
        result = await session.execute(select(User).where(User.email == DEMO_USER_EMAIL))
        existing_user = result.scalar_one_or_none()

        if existing_user and not force:
            return False

        logger.info("🌱 Seeding finals demo account, workspace, and brand into database...")

        # 1. Create or update Demo User
        if not existing_user:
            user = User(
                id=DEMO_USER_ID,
                email=DEMO_USER_EMAIL,
                hashed_password=hash_password(DEMO_USER_PASSWORD),
                name="Alex Chen",
                role="Principal Content Architect",
                is_demo=False,
                is_active=True,
                telemetry_opt_in=True,
                ai_training_opt_out=True,
            )
            session.add(user)
            await session.flush()
        else:
            user = existing_user

        # 2. Create Workspace
        ws_res = await session.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))
        workspace = ws_res.scalar_one_or_none()
        if not workspace:
            workspace = Workspace(
                id=DEMO_WORKSPACE_ID,
                name="SocioTrack Core Engineering",
                slug="sociotrack-core",
                owner_id=user.id,
                plan="enterprise_scale",
            )
            session.add(workspace)
            await session.flush()

        # 3. Create WorkspaceMember
        wm_res = await session.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace.id,
                WorkspaceMember.user_id == user.id,
            )
        )
        if not wm_res.scalar_one_or_none():
            member = WorkspaceMember(
                id=str(uuid.uuid4()),
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner",
            )
            session.add(member)
            await session.flush()

        # 4. Create or update Seed Brand (DevRelay)
        brand_res = await session.execute(select(Brand).where(Brand.id == DEMO_BRAND_ID))
        brand = brand_res.scalar_one_or_none()
        if not brand:
            brand = Brand(
                id=DEMO_BRAND_ID,
                workspace_id=workspace.id,
                user_id=user.id,
                name="DevRelay",
                voice_description="Pragmatic, technical, no-nonsense senior engineer tone with subtle dry humor. Prefers direct code examples over marketing buzzwords.",
                target_audience="Full-stack developers, engineering leads, open-source contributors, devops practitioners.",
            )
            session.add(brand)
            await session.flush()
        else:
            if not brand.workspace_id:
                brand.workspace_id = workspace.id
            if not brand.user_id:
                brand.user_id = user.id
            await session.flush()

        # 5. Create or update Seed Memories
        mem_res = await session.execute(select(AgentMemory).where(AgentMemory.brand_id == brand.id))
        existing_mems = mem_res.scalars().all()
        for m in existing_mems:
            if not m.workspace_id:
                m.workspace_id = workspace.id
        if not existing_mems:
            memories = [
                AgentMemory(
                    id="dd44ee55-ff66-7788-9900-112233445566",
                    workspace_id=workspace.id,
                    brand_id=brand.id,
                    insight_text="Contrarian hooks challenging industry orthodoxy on agent state generate 2.8x higher reply rates among senior engineers.",
                    category="donts_avoided",
                    confidence_score=0.92,
                    is_explicit=True,
                    is_active=True,
                    memory_type="explicit_directive",
                ),
                AgentMemory(
                    id="ee55ff66-7788-9900-1122-334455667788",
                    workspace_id=workspace.id,
                    brand_id=brand.id,
                    insight_text="Dev audiences disengage from generic hype; posts citing specific architectural percentages (e.g. 73% token reduction) double bookmark and share velocity.",
                    category="content_preferences",
                    confidence_score=0.88,
                    is_explicit=True,
                    is_active=True,
                    memory_type="explicit_directive",
                ),
                AgentMemory(
                    id="ff667788-9900-1122-3344-556677889900",
                    workspace_id=workspace.id,
                    brand_id=brand.id,
                    insight_text="Publishing technical posts between 08:30 and 10:15 AM EST on Tuesday and Thursday produces peak tech Twitter/LinkedIn dwell time.",
                    category="feedback_and_learning",
                    confidence_score=0.85,
                    is_explicit=False,
                    is_active=True,
                    memory_type="inferred_preference",
                ),
                AgentMemory(
                    id="00112233-4455-6677-8899-aabbccddeeff",
                    workspace_id=workspace.id,
                    brand_id=brand.id,
                    insight_text="Audience intensely feels the pain of non-deterministic LLM behavior in production and high API token expenses in multi-agent loops.",
                    category="brand_identity",
                    confidence_score=0.94,
                    is_explicit=False,
                    is_active=True,
                    memory_type="inferred_preference",
                ),
            ]
            session.add_all(memories)

        # 6. Create Sample Posts for walkthrough
        post_res = await session.execute(select(Post).where(Post.brand_id == brand.id))
        existing_posts = post_res.scalars().all()
        if not existing_posts:
            post_1 = Post(
                id="c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
                brand_id=brand.id,
                brand_name=brand.name,
                content="Most agents forget the context 5 turns later. Here is how we wired Hindsight memory banks to retain developer preferences across sessions.",
                topic="Agent Memory",
                hook_style="Format A: Data-First Technical (Selected Winner)",
                format="Carousel",
                status="published",
                scheduled_for=datetime.now(timezone.utc) - timedelta(days=3),
                source_provenance="verified_seed",
            )
            post_2 = Post(
                id="d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90",
                brand_id=brand.id,
                brand_name=brand.name,
                content="Stop dumping your entire database schema into the system prompt. Deep module architecture + vector memory cuts token burn by 73%.",
                topic="Architecture & Token Optimization",
                hook_style="Format B: Contrarian Hot Take",
                format="Discussion",
                status="draft",
                scheduled_for=datetime.now(timezone.utc) + timedelta(days=1),
                source_provenance="verified_seed",
            )
            session.add_all([post_1, post_2])

        await session.commit()
        logger.info("✅ Finals demo data seeded successfully into database.")

        # Ingest into ChromaDB persistent vector memory as well
        try:
            from app.core.memory import get_memory_manager
            mem_mgr = get_memory_manager(
                brand_name=brand.name,
                workspace_id=workspace.id,
                brand_id=brand.id,
            )
            mem_mgr.insert_lesson(
                topic="Architecture & Token Optimization",
                lesson="Posts citing specific architectural percentages double bookmark and share velocity.",
                score=9.2,
                is_explicit=True,
            )
            mem_mgr.insert_lesson(
                topic="Agent Memory",
                lesson="Contrarian hooks challenging industry orthodoxy on agent state generate 2.8x higher reply rates among senior engineers.",
                score=9.4,
                is_explicit=True,
            )
        except Exception as e:
            logger.warning("Could not ingest initial Chroma vector lessons: %s", e)

        return True
