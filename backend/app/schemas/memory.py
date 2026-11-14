from datetime import datetime
from typing import Optional, List, Literal, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

MemoryCategory = Literal[
    "brand_identity",
    "content_preferences",
    "content_history",
    "feedback_and_learning",
    "performance_insights",
    "donts_avoided",
    "hook_rule",
    "timing_rule",
    "audience_pain_point",
    "user_preference",
]


class AgentMemoryBase(BaseModel):
    brand_id: Optional[str] = None
    workspace_id: Optional[str] = None
    insight_text: str = Field(..., min_length=2, description="Audience or engagement rule learned by the agent")
    category: str = Field("content_preferences", description="Classification of the insight")
    confidence_score: float = Field(0.85, ge=0.0, le=1.0, description="Confidence rating from 0.0 to 1.0")
    supporting_evidence: Optional[str] = None
    source_post_id: Optional[str] = None
    source_event: Optional[str] = "telemetry_ingest"
    is_active: bool = True
    is_explicit: bool = False
    evidence_count: int = 1
    memory_type: str = "inferred_preference"  # explicit_directive, inferred_preference, recurring_pattern, performance_insight
    conflict_status: str = "active"  # active, superseded, resolved

    model_config = ConfigDict(extra="allow")


class AgentMemoryCreate(AgentMemoryBase):
    embedding: Optional[str] = None


class AgentMemoryUpdate(BaseModel):
    insight_text: Optional[str] = Field(None, min_length=2)
    category: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    supporting_evidence: Optional[str] = None
    is_active: Optional[bool] = None
    is_explicit: Optional[bool] = None
    evidence_count: Optional[int] = None
    memory_type: Optional[str] = None
    conflict_status: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class AgentMemoryResponse(AgentMemoryBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")


class MemoryStatusResponse(BaseModel):
    status: str = "healthy"
    is_persistent: bool = True
    storage_provider: str = "chroma_persistent"
    persist_directory: Optional[str] = None
    total_memories: int = 0
    active_memories: int = 0
    vector_collections_count: int = 0
    vector_store_healthy: bool = True
    storage_error: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class MemoryClearRequest(BaseModel):
    brand_id: str
    confirm: bool = True

    model_config = ConfigDict(extra="allow")


class PastWinningPostSchema(BaseModel):
    id: str
    topic: str
    content: str
    hook: str = ""
    composite_score: float = 0.0
    impressions: int = 0
    shares: int = 0
    replies: int = 0
    likes: int = 0
    key_takeaway: str = ""

    model_config = ConfigDict(extra="allow")


class AudienceSentimentSchema(BaseModel):
    topic: str = ""
    sentiment_label: str = "positive"
    sentiment_score: float = 0.8
    summary: str = ""
    keywords: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class LearnedLessonSchema(BaseModel):
    id: str
    topic: str
    key_lesson: str
    composite_score: float
    derived_at: Optional[str] = None
    supporting_evidence: Optional[str] = None
    source_event: Optional[str] = "telemetry_ingest"
    is_active: bool = True
    brand_id: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class MemoryInsightsResponse(BaseModel):
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    topic: Optional[str] = None
    total_insights: Optional[int] = 0
    total_active_memories: Optional[int] = 0
    insights: Optional[List[AgentMemoryResponse]] = Field(default_factory=list)
    total_winning_posts: Optional[int] = 0
    total_lessons_learned: Optional[int] = 0
    current_sentiment: Optional[AudienceSentimentSchema] = None
    top_winning_posts: Optional[List[PastWinningPostSchema]] = Field(default_factory=list)
    learned_lessons: Optional[List[LearnedLessonSchema]] = Field(default_factory=list)
    persistence_status: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")
