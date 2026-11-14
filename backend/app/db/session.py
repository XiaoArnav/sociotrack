"""
Database connection, session management, and Supabase integration.
Supports SQLite out-of-the-box and PostgreSQL / Supabase via connection string.
"""

from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings


def get_sync_database_url() -> str:
    sync_url = getattr(settings, "SYNC_DATABASE_URL", None)
    # If SYNC_DATABASE_URL is unset or left as default SQLite while DATABASE_URL is PostgreSQL,
    # derive the sync URL directly from DATABASE_URL to keep both drivers connected to the same DB.
    if not sync_url or (sync_url.startswith("sqlite") and ("postgres" in settings.DATABASE_URL)):
        url = settings.DATABASE_URL
    else:
        url = sync_url

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif "+asyncpg" in url:
        url = url.replace("+asyncpg", "+psycopg2") if "postgresql" in url else url.replace("+asyncpg", "")
    elif "+aiosqlite" in url:
        url = url.replace("+aiosqlite", "")
    return url


# Engine configuration
db_url = get_sync_database_url()

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes schema tables."""
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
