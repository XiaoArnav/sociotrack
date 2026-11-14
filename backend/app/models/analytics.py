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


class FollowerSnapshot(Base):
    __tablename__ = "follower_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    handle = Column(String(100), nullable=False, index=True)
    followers_count = Column(Integer, nullable=False, default=0)
    following_count = Column(Integer, nullable=False, default=0)
    media_count = Column(Integer, nullable=False, default=0)
    net_delta = Column(Integer, nullable=True, default=0)
    unfollowers_count = Column(Integer, nullable=False, default=0)
    new_followers_count = Column(Integer, nullable=False, default=0)
    retention_rate = Column(Float, nullable=False, default=95.0)
    source = Column(String(100), nullable=True, default="meta_opengraph_verified")
    engagement_rate = Column(Float, nullable=True)
    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
