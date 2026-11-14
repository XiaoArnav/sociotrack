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


def normalize_async_database_url(url: str) -> str:
    if not url:
        return "sqlite+aiosqlite:///./sociotrack.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


# Async Engine & Session Factory with pool pre-ping
async_db_url = normalize_async_database_url(settings.DATABASE_URL)
engine = create_async_engine(
    async_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
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
            if sync_conn.dialect.name == "postgresql":
                try:
                    sync_conn.execute(text("ALTER TABLE follower_snapshots ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'meta_opengraph_verified'"))
                    sync_conn.execute(text("ALTER TABLE follower_snapshots ADD COLUMN IF NOT EXISTS engagement_rate FLOAT"))
                except Exception:
                    pass
                return

            # Only execute SQLite-specific dynamic column migrations on SQLite
            if sync_conn.dialect.name != "sqlite":
                return

            inspector = inspect(sync_conn)
            table_names = inspector.get_table_names()

            if "brands" in table_names:
                brand_cols = {c["name"] for c in inspector.get_columns("brands")}
                if "workspace_id" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN workspace_id VARCHAR(36)"))
                if "user_id" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN user_id VARCHAR(36)"))
                if "intelligence_profile" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN intelligence_profile TEXT"))
                if "updated_at" not in brand_cols:
                    sync_conn.execute(text("ALTER TABLE brands ADD COLUMN updated_at DATETIME"))

            if "posts" in table_names:
                post_cols = {c["name"] for c in inspector.get_columns("posts")}
                if "idempotency_key" not in post_cols:
                    sync_conn.execute(text("ALTER TABLE posts ADD COLUMN idempotency_key VARCHAR(100)"))
                if "source_provenance" not in post_cols:
                    sync_conn.execute(text("ALTER TABLE posts ADD COLUMN source_provenance VARCHAR(100) DEFAULT 'synthetic_or_agent'"))
                if "platform_post_id" not in post_cols:
                    sync_conn.execute(text("ALTER TABLE posts ADD COLUMN platform_post_id VARCHAR(100)"))
                if "published_at" not in post_cols:
                    sync_conn.execute(text("ALTER TABLE posts ADD COLUMN published_at DATETIME"))

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
                if "workspace_id" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN workspace_id VARCHAR(36)"))
                if "supporting_evidence" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN supporting_evidence TEXT"))
                if "source_post_id" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN source_post_id VARCHAR(36)"))
                if "source_event" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN source_event VARCHAR(50) DEFAULT 'telemetry_ingest'"))
                if "is_active" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                if "is_explicit" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN is_explicit BOOLEAN DEFAULT 0"))
                if "evidence_count" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN evidence_count INTEGER DEFAULT 1"))
                if "memory_type" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN memory_type VARCHAR(50) DEFAULT 'inferred_preference'"))
                if "conflict_status" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN conflict_status VARCHAR(50) DEFAULT 'active'"))
                if "updated_at" not in mem_cols:
                    sync_conn.execute(text("ALTER TABLE agent_memories ADD COLUMN updated_at DATETIME"))

            if "follower_snapshots" in table_names:
                fs_cols = {c["name"] for c in inspector.get_columns("follower_snapshots")}
                if "source" not in fs_cols:
                    sync_conn.execute(text("ALTER TABLE follower_snapshots ADD COLUMN source VARCHAR(100) DEFAULT 'meta_opengraph_verified'"))
                if "engagement_rate" not in fs_cols:
                    sync_conn.execute(text("ALTER TABLE follower_snapshots ADD COLUMN engagement_rate FLOAT"))

            if "audit_logs" in table_names:
                cols = {c["name"]: c for c in inspector.get_columns("audit_logs")}
                if cols.get("workspace_id", {}).get("nullable") is False:
                    sync_conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS audit_logs_new (
                            id VARCHAR(36) NOT NULL PRIMARY KEY,
                            workspace_id VARCHAR(36),
                            user_id VARCHAR(36),
                            action VARCHAR(100) NOT NULL,
                            resource_type VARCHAR(50) NOT NULL,
                            resource_id VARCHAR(36),
                            metadata_json TEXT,
                            ip_address VARCHAR(45),
                            created_at DATETIME NOT NULL,
                            FOREIGN KEY(workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
                        )
                    """))
                    sync_conn.execute(text("INSERT OR IGNORE INTO audit_logs_new SELECT id, workspace_id, user_id, action, resource_type, resource_id, metadata_json, ip_address, created_at FROM audit_logs"))
                    sync_conn.execute(text("DROP TABLE audit_logs"))
                    sync_conn.execute(text("ALTER TABLE audit_logs_new RENAME TO audit_logs"))
                    sync_conn.execute(text("CREATE INDEX IF NOT EXISTS ix_audit_logs_workspace_id ON audit_logs (workspace_id)"))
                    sync_conn.execute(text("CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id)"))

        await conn.run_sync(_migrate_columns)
