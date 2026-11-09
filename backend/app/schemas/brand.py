from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class BrandBase(BaseModel):
    name: str = Field(..., description="Brand or organization name", min_length=2, max_length=255)
    voice_description: Optional[str] = Field(None, description="Tone, voice guidelines, persona instructions")
    target_audience: Optional[str] = Field(None, description="Target demographic, personas, community pain points")
    workspace_id: Optional[str] = Field(None, description="Workspace ID if linked to an organizational tenant")


class BrandCreate(BrandBase):
    pass


class TopicAffinity(BaseModel):
    topic: str
    affinity_score: float = Field(..., ge=0.0, le=10.0, description="0-10 effectiveness score")
    observed_post_count: int = Field(default=0)
    avg_engagement_rate: float = Field(default=0.0)
    status: str = Field(default="empirical", description="'empirical' | 'hypothesis' | 'insufficient_data'")


class FormatPerformance(BaseModel):
    format_name: str
    conversion_ratio: float = Field(..., description="Normalized conversion, save or share ratio")
    shares_per_reach: float = Field(default=0.0)
    saves_per_reach: float = Field(default=0.0)
    sample_size: int = Field(default=0)
    status: str = Field(default="empirical", description="'empirical' | 'insufficient_data'")


class TimingRecommendation(BaseModel):
    optimal_hours_utc: List[int] = Field(default_factory=lambda: [14, 16])
    best_days: List[str] = Field(default_factory=lambda: ["Tuesday", "Wednesday", "Thursday"])
    confidence: float = Field(default=0.85)
    evidence: str = Field(default="Observed historical distribution velocity")


class BrandVoiceArchetype(BaseModel):
    tone: str = Field(default="Direct, analytical, practitioner-focused")
    formality: str = Field(default="conversational_technical")
    vocabulary_dos: List[str] = Field(default_factory=list)
    vocabulary_donts: List[str] = Field(default_factory=list)
    anti_patterns: List[str] = Field(default_factory=list)


class BrandIntelligenceProfile(BaseModel):
    brand_id: str
    brand_name: str
    voice_archetype: BrandVoiceArchetype = Field(default_factory=BrandVoiceArchetype)
    topics: List[TopicAffinity] = Field(default_factory=list)
    format_performance: List[FormatPerformance] = Field(default_factory=list)
    timing: TimingRecommendation = Field(default_factory=TimingRecommendation)
    total_posts_analyzed: int = 0
    total_lessons_accumulated: int = 0
    data_sufficiency: str = Field(default="high", description="'high' | 'moderate' | 'insufficient'")
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(from_attributes=True, extra="allow")


class BrandResponse(BrandBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    intelligence_profile: Optional[BrandIntelligenceProfile] = None

    model_config = ConfigDict(from_attributes=True)


class RefreshIntelligenceResponse(BaseModel):
    status: str = "success"
    brand_id: str
    brand_name: str
    profile: BrandIntelligenceProfile
