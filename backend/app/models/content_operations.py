"""
Content Operations Models.
Includes Campaigns, Reusable Content Templates, Draft Approval Workflows, and Internal Comments.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Campaign(Base):
    """
    Groups posts, experiments, and deliverables into unified strategic initiatives.
    """
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="planning")  # planning, active, completed, paused
    target_engagement_rate = Column(Float, default=10.0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    brand = relationship("Brand")


class ContentTemplate(Base):
    """
    Reusable structured patterns for high-yield hooks, body layouts, and CTAs.
    """
    __tablename__ = "content_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    hook_pattern = Column(Text, nullable=False)
    body_template = Column(Text, nullable=False)
    cta_pattern = Column(Text, nullable=False)
    suggested_format = Column(String(50), default="REELS")
    created_by = Column(String(36), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    brand = relationship("Brand")


class DraftApproval(Base):
    """
    Audited approval workflow state machine for content publishing gates.
    States: 'pending_review', 'approved', 'rejected'.
    """
    __tablename__ = "draft_approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending_review")  # pending_review, approved, rejected
    requested_by = Column(String(36), nullable=False)
    reviewer_id = Column(String(36), nullable=True)
    feedback_notes = Column(Text, nullable=True)
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

    post = relationship("Post")


class DraftComment(Base):
    """
    Internal asynchronous peer feedback thread attached to a post draft.
    """
    __tablename__ = "draft_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False)
    author_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    post = relationship("Post")
