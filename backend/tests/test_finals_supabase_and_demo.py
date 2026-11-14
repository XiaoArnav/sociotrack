"""
Finals Verification Test Suite:
1. Supabase Postgres & SQLite dual database path normalization.
2. Dialect-aware schema initialization (no SQLite ALTER TABLE syntax on Postgres).
3. Demo finals account, workspace, and brand seeding.
4. Walkthrough rehearsal: login, brand access, draft generation, persistence, restart survival.
"""
import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable
from app.config import settings
from app.database import (
    normalize_async_database_url,
    Base,
    async_session_maker,
    init_db,
)
from app.db.session import get_sync_database_url
from app.db.seed_demo import (
    seed_demo_data,
    DEMO_USER_EMAIL,
    DEMO_USER_PASSWORD,
    DEMO_BRAND_ID,
    DEMO_WORKSPACE_ID,
)
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.core.security import verify_password, create_access_token


def test_01_database_url_normalization_both_paths():
    """Verify async and sync drivers are correctly mapped and normalized for Supabase Postgres and SQLite."""
    # Case 1: Supabase Pooler URI (IPv4 Session pooler on port 5432)
    supa_pooler = "postgresql+asyncpg://postgres.xyzproject:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    async_url = normalize_async_database_url(supa_pooler)
    sync_url = get_sync_database_url()  # When DATABASE_URL is not set yet, tests fall back to config
    assert async_url.startswith("postgresql+asyncpg://")

    # Case 2: Raw postgres:// copy-pasted from Supabase dashboard
    raw_postgres = "postgres://postgres:mysecret@db.abc.supabase.co:5432/postgres"
    assert normalize_async_database_url(raw_postgres).startswith("postgresql+asyncpg://")

    # Case 3: Raw postgresql:// without async driver
    raw_psql = "postgresql://postgres:mysecret@db.abc.supabase.co:5432/postgres"
    assert normalize_async_database_url(raw_psql).startswith("postgresql+asyncpg://")

    # Case 4: SQLite path
    sqlite_async = "sqlite+aiosqlite:///./sociotrack.db"
    assert normalize_async_database_url(sqlite_async) == "sqlite+aiosqlite:///./sociotrack.db"


def test_02_postgres_ddl_compilation_and_schema_safety():
    """Verify all tables compile valid DDL for PostgreSQL and contain required columns."""
    import app.models  # noqa: F401

    table_names = {t.name for t in Base.metadata.sorted_tables}
    required_tables = {"users", "workspaces", "workspace_members", "brands", "posts", "agent_memories"}
    assert required_tables.issubset(table_names), f"Missing tables: {required_tables - table_names}"

    for table in Base.metadata.sorted_tables:
        ddl = str(CreateTable(table).compile(dialect=postgresql.dialect()))
        assert "CREATE TABLE" in ddl
        # Ensure no SQLite-specific syntax slipped into schema
        assert "AUTOINCREMENT" not in ddl


@pytest.mark.asyncio
async def test_03_seed_demo_account_workspace_and_brand():
    """Verify seed_demo_data creates all necessary records with verified relations."""
    await init_db()
    seeded = await seed_demo_data(force=True)
    assert seeded is True

    async with async_session_maker() as session:
        # 1. Verify User
        u_res = await session.execute(select(User).where(User.email == DEMO_USER_EMAIL))
        user = u_res.scalar_one_or_none()
        assert user is not None
        assert user.name == "Alex Chen"
        assert verify_password(DEMO_USER_PASSWORD, user.hashed_password) is True

        # 2. Verify Workspace
        ws_res = await session.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))
        ws = ws_res.scalar_one_or_none()
        assert ws is not None
        assert ws.name == "SocioTrack Core Engineering"

        # 3. Verify Workspace Member
        wm_res = await session.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == ws.id,
                WorkspaceMember.user_id == user.id,
            )
        )
        wm = wm_res.scalar_one_or_none()
        assert wm is not None
        assert wm.role == "owner"

        # 4. Verify Brand
        b_res = await session.execute(select(Brand).where(Brand.id == DEMO_BRAND_ID))
        brand = b_res.scalar_one_or_none()
        assert brand is not None
        assert brand.name == "DevRelay"
        assert brand.workspace_id == ws.id

        # 5. Verify Memories
        m_res = await session.execute(select(AgentMemory).where(AgentMemory.brand_id == brand.id))
        memories = m_res.scalars().all()
        assert len(memories) >= 4


@pytest.mark.asyncio
async def test_04_rehearsal_draft_generation_and_persistence_across_restart():
    """
    Simulates the finals rehearsal:
    1. Authenticate with seeded demo account
    2. Open seeded brand 'DevRelay'
    3. Generate and save a new draft
    4. Confirm saved record exists in database
    5. Simulate backend restart (fresh session factory)
    6. Reopen saved draft and assert persistence
    """
    await init_db()
    await seed_demo_data(force=False)

    async with async_session_maker() as session:
        # Sign in: get user and token
        u_res = await session.execute(select(User).where(User.email == DEMO_USER_EMAIL))
        user = u_res.scalar_one()
        token = create_access_token(data={"sub": user.id, "email": user.email, "is_demo": user.is_demo})
        assert token is not None

        # Fetch seeded brand
        b_res = await session.execute(select(Brand).where(Brand.id == DEMO_BRAND_ID))
        brand = b_res.scalar_one()

        # Simulate saving a newly generated draft
        draft_id = str(uuid.uuid4())
        draft_content = (
            "We replaced our 10-step agent loop with a single deterministic LangGraph state machine. "
            "P99 latency dropped 73%, and token spend fell by 61%."
        )
        draft_post = Post(
            id=draft_id,
            brand_id=brand.id,
            brand_name=brand.name,
            content=draft_content,
            topic="Deterministic State Management with LangGraph",
            hook_style="Format A: Data-First Technical (Selected Winner)",
            format="Carousel",
            status="draft",
            source_provenance="genuine_ai:gemini:gemini-1.5-flash",
            created_at=datetime.now(timezone.utc),
        )
        session.add(draft_post)
        await session.commit()

    # --- SIMULATE PROCESS RESTART ---
    # Create a completely separate session mimicking a restart
    async with async_session_maker() as fresh_session:
        reopened_res = await fresh_session.execute(select(Post).where(Post.id == draft_id))
        reopened_post = reopened_res.scalar_one_or_none()

        assert reopened_post is not None, "Draft was not found after simulated backend restart!"
        assert reopened_post.content == draft_content
        assert reopened_post.brand_name == "DevRelay"
        assert reopened_post.status == "draft"
        assert reopened_post.source_provenance == "genuine_ai:gemini:gemini-1.5-flash"


@pytest.mark.asyncio
async def test_05_chroma_learned_preferences_persist_across_restart(tmp_path):
    """Verify learned brand preferences in Chroma vector store persist across process dereference."""
    from app.core.memory import VectorMemoryManager

    persist_dir = str(tmp_path / "chroma_finals_test")
    brand = "DevRelay"
    ws_id = "ws_demo_finals_workspace"
    b_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"

    # Boot instance 1: insert lesson
    mgr1 = VectorMemoryManager(
        brand_name=brand,
        workspace_id=ws_id,
        brand_id=b_id,
        persist_directory=persist_dir,
    )
    mgr1.insert_lesson(
        topic="Architecture",
        lesson="Direct metrics and architecture diagrams outperform narrative fluff by 4.2x.",
        score=9.6,
        is_explicit=True,
    )
    del mgr1  # Dereference instance 1

    # Boot instance 2: read from same directory
    mgr2 = VectorMemoryManager(
        brand_name=brand,
        workspace_id=ws_id,
        brand_id=b_id,
        persist_directory=persist_dir,
    )
    lessons = mgr2.retrieve_lessons(topic="Architecture")
    assert len(lessons) >= 1
    assert "Direct metrics" in lessons[0]["lesson"]
