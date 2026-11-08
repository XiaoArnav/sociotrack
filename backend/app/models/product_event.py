"""
ProductEvent SQLAlchemy model for privacy-conscious internal product analytics.
Measures onboarding funnels, time-to-first-insight, feature adoption, and abandonment points.
Zero PII collected.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from app.database import Base


class ProductEvent(Base):
    __tablename__ = "product_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_name = Column(String(100), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    session_id = Column(String(100), nullable=True)
    brand_id = Column(String(36), nullable=True)
    step_name = Column(String(100), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
