import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AgentMemory(Base):
    __tablename__ = "agent_memories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), nullable=True, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    insight_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # brand_identity, content_preferences, content_history, feedback_and_learning, performance_insights, donts_avoided
    confidence_score = Column(Float, nullable=False, default=0.850)
    embedding = Column(Text, nullable=True)  # JSON-serialized vector or pgvector representation
    supporting_evidence = Column(Text, nullable=True)
    source_post_id = Column(String(36), nullable=True)
    source_event = Column(String(50), default="telemetry_ingest")  # telemetry_ingest, user_edit, approval, recurring_rejection, explicit_directive
    is_active = Column(Boolean, default=True)
    is_explicit = Column(Boolean, default=False)
    evidence_count = Column(Integer, default=1)
    memory_type = Column(String(50), default="inferred_preference")  # explicit_directive, inferred_preference, recurring_pattern, performance_insight
    conflict_status = Column(String(50), default="active")  # active, superseded, resolved
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

    # Relationships
    brand = relationship("Brand", back_populates="memories")
