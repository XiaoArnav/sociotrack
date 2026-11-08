"""
Database connectivity and session management.
Provides both async and sync SQLAlchemy engines with automatic schema initialization.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


class Base(DeclarativeBase):
    pass


# Async Engine & Session Factory
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from sqlalchemy import inspect, text

async def init_db() -> None:
    """Initializes tables for development/testing and migrates missing columns."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate_columns(sync_conn):
            inspector = inspect(sync_conn)
            table_names = inspector.get_table_names()

            if "brands" in table_names:
                brand_cols = {c["name"] for c in inspector.get_columns("brands")}
                if "user_id" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN user_id VARCHAR(36)"))
                if "intelligence_profile" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN intelligence_profile TEXT"))
                if "updated_at" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN updated_at DATETIME"))

            if "users" in table_names:
                user_cols = {c["name"] for c in inspector.get_columns("users")}
                if "telemetry_opt_in" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN telemetry_opt_in BOOLEAN DEFAULT 1"))
                if "ai_training_opt_out" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN ai_training_opt_out BOOLEAN DEFAULT 1"))
                if "consent_updated_at" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN consent_updated_at DATETIME"))

            if "agent_memories" in table_names:
                mem_cols = {c["name"] for c in inspector.get_columns("agent_memories")}
                if "supporting_evidence" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN supporting_evidence TEXT"))
                if "source_post_id" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN source_post_id VARCHAR(36)"))
                if "source_event" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN source_event VARCHAR(50) DEFAULT 'telemetry_ingest'"))
                if "is_active" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                if "updated_at" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN updated_at DATETIME"))

        await conn.run_sync(_migrate_columns)
