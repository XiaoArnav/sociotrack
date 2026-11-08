import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ContentExperiment(Base):
    __tablename__ = "content_experiments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    experiment_type = Column(String(50), nullable=False, default="hook")  # hook, format, cta, structure
    
    variant_a_label = Column(String(100), nullable=False, default="Variant A")
    variant_a_content = Column(Text, nullable=False)
    variant_a_impressions = Column(Integer, default=0)
    variant_a_engagement_rate = Column(Float, default=0.0)

    variant_b_label = Column(String(100), nullable=False, default="Variant B")
    variant_b_content = Column(Text, nullable=False)
    variant_b_impressions = Column(Integer, default=0)
    variant_b_engagement_rate = Column(Float, default=0.0)

    status = Column(String(50), default="active")  # active, completed, insufficient_data
    observation_days = Column(Integer, default=7)
    min_sample_size = Column(Integer, default=1000)
    
    winner_variant = Column(String(100), nullable=True)
    confidence_score = Column(Float, default=0.0)
    conclusion_notes = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)

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
    brand = relationship("Brand", backref="experiments")
