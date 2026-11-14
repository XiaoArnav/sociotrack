"""
User SQLAlchemy ORM model for real authentication, tenant isolation, and session validation.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base


class User(Base):
    """Stores registered accounts with bcrypt-hashed credentials and roles."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="Principal Content Architect")
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    telemetry_opt_in = Column(Boolean, default=True)
    ai_training_opt_out = Column(Boolean, default=True)
    consent_updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
