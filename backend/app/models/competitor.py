"""
Competitor Intelligence Model.
Tracks publicly available creator/brand benchmarks without claiming access to private analytics.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CompetitorTracker(Base):
    """
    Stores publicly accessible benchmark data for competitor accounts.
    Explicitly tracks provenance as 'public_benchmark' and identifies data limitations.
    """
    __tablename__ = "competitor_trackers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    handle = Column(String(100), nullable=False, index=True)
    platform = Column(String(50), nullable=False, default="instagram")
    display_name = Column(String(255), nullable=True)
    follower_count = Column(Integer, default=0)
    post_count = Column(Integer, default=0)
    estimated_engagement_rate = Column(Float, default=0.0)
    top_formats_json = Column(Text, nullable=True)  # JSON e.g. {"reels": 0.60, "carousels": 0.30, "images": 0.10}
    recent_topics_json = Column(Text, nullable=True)  # JSON list of extracted public topic tags
    provenance_type = Column(String(100), nullable=False, default="public_benchmark")
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    brand = relationship("Brand")
