import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AgentMemory(Base):
    __tablename__ = "agent_memories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    insight_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # hook_rule, timing_rule, audience_pain_point
    confidence_score = Column(Float, nullable=False, default=0.850)
    embedding = Column(Text, nullable=True)  # JSON-serialized vector or pgvector representation
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    brand = relationship("Brand", back_populates="memories")
