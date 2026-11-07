import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class PostAnalytics(Base):
    __tablename__ = "post_analytics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True)
    impressions = Column(Integer, nullable=False, default=0)
    likes = Column(Integer, nullable=False, default=0)
    replies = Column(Integer, nullable=False, default=0)
    shares = Column(Integer, nullable=False, default=0)
    engagement_score = Column(Float, nullable=False, default=0.0)
    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    post = relationship("Post", back_populates="analytics")
