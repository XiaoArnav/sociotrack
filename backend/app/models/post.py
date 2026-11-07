import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    topic = Column(String(255), nullable=False)
    hook_style = Column(String(100), nullable=True)
    format = Column(String(100), nullable=True)
    brand_name = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="draft")  # draft, pending_approval, scheduled, published
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    brand = relationship("Brand", back_populates="posts")
    analytics = relationship("PostAnalytics", back_populates="post", cascade="all, delete-orphan", uselist=False)
