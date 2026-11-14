from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
try:
    from app.schemas.memory import AgentMemoryResponse
except ImportError:
    from backend.app.schemas.memory import AgentMemoryResponse


class MetricsNested(BaseModel):
    impressions: int = 0
    likes: int = 0
    replies: int = 0
    shares: int = 0

    model_config = ConfigDict(extra="allow")


class FeedMetricsRequest(BaseModel):
    post_id: Optional[str] = Field(None, description="UUID of the post being measured")
    brand_name: Optional[str] = Field(None, description="Brand name if testing directly")
    topic: Optional[str] = Field(None, description="Context topic")
    post_content: Optional[str] = Field(None, description="Post copy evaluated")
    impressions: Optional[int] = Field(None, ge=0, description="Total views or impressions")
    likes: Optional[int] = Field(None, ge=0, description="Total likes")
    replies: Optional[int] = Field(None, ge=0, description="Total replies or comments")
    shares: Optional[int] = Field(None, ge=0, description="Total shares or reposts")
    metrics: Optional[MetricsNested] = Field(None, description="Nested metrics dictionary")

    model_config = ConfigDict(extra="allow")


class FeedMetricsResponse(BaseModel):
    id: Optional[str] = None
    post_id: Optional[str] = None
    impressions: int = 0
    likes: int = 0
    replies: int = 0
    shares: int = 0
    engagement_score: float = Field(0.0, description="Calculated weighted engagement percentage")
    composite_score: Optional[float] = Field(None, description="Person 1 composite score")
    qualifies_for_memory: Optional[bool] = Field(None, description="Whether performance triggered memory retention")
    key_lesson: Optional[str] = Field(None, description="Learned cognitive insight")
    memory_doc_id: Optional[str] = Field(None, description="Identifier of the stored memory vector")
    status_message: Optional[str] = None
    recorded_at: Optional[datetime] = None
    feedback_insight: Optional[AgentMemoryResponse] = Field(
        None,
        description="Newly retained insight generated from the agent's memory feedback loop"
    )

    model_config = ConfigDict(from_attributes=True, extra="allow")
