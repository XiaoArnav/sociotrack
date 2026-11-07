"""
Database connection, session management, and Supabase integration.
Supports SQLite out-of-the-box and PostgreSQL / Supabase via connection string.
"""

from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from backend.app.config import settings

# Engine configuration
db_url = getattr(settings, "SYNC_DATABASE_URL", None) or settings.DATABASE_URL
if "+aiosqlite" in db_url:
    db_url = db_url.replace("+aiosqlite", "")
if "+asyncpg" in db_url:
    db_url = db_url.replace("+asyncpg", "")

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
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
    from backend.app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
