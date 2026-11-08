"""
Audience Pattern Model.
Encapsulates empirical engagement patterns, retention telemetry, and active format affinities.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AudiencePattern(Base):
    """
    Stores verified audience response patterns derived from historical post analytics.
    Distinguishes observed facts from statistical inference.
    """
    __tablename__ = "audience_patterns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # e.g., "Engineering Tips", "Product Teasers"
    peak_hours_json = Column(Text, nullable=True)  # JSON list of UTC hours e.g. [14, 15, 18]
    top_format = Column(String(50), nullable=False, default="REELS")
    avg_dwell_seconds = Column(Float, default=0.0)
    viral_share_ratio = Column(Float, default=0.0)
    retention_index = Column(Float, default=1.0)
    confidence_score = Column(Float, default=0.85)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    brand = relationship("Brand")
