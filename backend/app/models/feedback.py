"""
UserFeedback ORM model for pilot participant surveys, in-app feedback, bug reports, and research backlog.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.database import Base


class UserFeedback(Base):
    __tablename__ = "user_feedbacks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, index=True)
    brand_id = Column(String(36), nullable=True, index=True)
    draft_id = Column(String(36), nullable=True)
    category = Column(String(50), nullable=False, default="general", index=True)
    rating = Column(Integer, nullable=True)
    sentiment = Column(String(20), nullable=True)
    message = Column(Text, nullable=False)
    rejection_reason = Column(String(50), nullable=True)
    triage_status = Column(String(30), nullable=False, default="new", index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
