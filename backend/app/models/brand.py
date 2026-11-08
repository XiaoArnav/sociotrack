import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    voice_description = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    intelligence_profile = Column(Text, nullable=True)  # Serialized BrandIntelligenceProfile JSON
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
    posts = relationship("Post", back_populates="brand", cascade="all, delete-orphan")
    memories = relationship("AgentMemory", back_populates="brand", cascade="all, delete-orphan")
