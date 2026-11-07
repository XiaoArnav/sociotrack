"""
SQLAlchemy ORM models mirroring the Supabase schema.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from backend.app.db.session import Base


class BrandModel(Base):
    """Stores brands, voice specifications, and target audience definitions."""
    __tablename__ = "brands"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    voice_description = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PostModel(Base):
    """Stores posts, variations, and approval states."""
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=True)
    brand_name = Column(String(100), nullable=True, index=True)
    topic = Column(String(255), nullable=False, index=True)
    hook_style = Column(String(100), nullable=True)
    format = Column(String(50), nullable=True)
    hook = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    call_to_action = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    status = Column(String(30), default="draft", index=True)  # draft, approved, scheduled, published
    match_score = Column(Float, default=0.0)
    scheduled_time = Column(String(100), nullable=True)
    scheduled_for = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    metrics = relationship("MetricModel", back_populates="post", cascade="all, delete-orphan")


class MetricModel(Base):
    """Engagement metrics recorded for posts."""
    __tablename__ = "metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id"), nullable=True)
    impressions = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    replies = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    composite_score = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("PostModel", back_populates="metrics")


class LearnedLessonModel(Base):
    """Reflective memory insights stored when performance crosses threshold (> 5.0)."""
    __tablename__ = "learned_lessons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_name = Column(String(100), nullable=False, index=True)
    topic = Column(String(255), nullable=False, index=True)
    post_content = Column(Text, nullable=False)
    key_lesson = Column(Text, nullable=False)
    composite_score = Column(Float, default=0.0)
    memory_doc_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SentimentModel(Base):
    """Audience sentiment signals."""
    __tablename__ = "sentiments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String(255), nullable=False, index=True)
    sentiment_label = Column(String(50), default="positive")
    sentiment_score = Column(Float, default=0.8)
    summary = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
