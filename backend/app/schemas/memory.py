from datetime import datetime
from typing import Optional, List, Literal, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

MemoryCategory = Literal["hook_rule", "timing_rule", "audience_pain_point"]


class AgentMemoryBase(BaseModel):
    brand_id: Optional[str] = None
    insight_text: str = Field(..., min_length=2, description="Audience or engagement rule learned by the agent")
    category: str = Field("hook_rule", description="Classification of the insight")
    confidence_score: float = Field(0.85, ge=0.0, le=1.0, description="Confidence rating from 0.0 to 1.0")

    model_config = ConfigDict(extra="allow")


class AgentMemoryCreate(AgentMemoryBase):
    embedding: Optional[str] = None


class AgentMemoryResponse(AgentMemoryBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")


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

    model_config = ConfigDict(extra="allow")


class MemoryInsightsResponse(BaseModel):
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    topic: Optional[str] = None
    total_insights: Optional[int] = 0
    insights: Optional[List[AgentMemoryResponse]] = Field(default_factory=list)
    total_winning_posts: Optional[int] = 0
    total_lessons_learned: Optional[int] = 0
    current_sentiment: Optional[AudienceSentimentSchema] = None
    top_winning_posts: Optional[List[PastWinningPostSchema]] = Field(default_factory=list)
    learned_lessons: Optional[List[LearnedLessonSchema]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, extra="allow")
