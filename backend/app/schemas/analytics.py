from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
try:
    from app.schemas.memory import AgentMemoryResponse
except ImportError:
    from backend.app.schemas.memory import AgentMemoryResponse


class FeedMetricsRequest(BaseModel):
    post_id: str = Field(..., description="UUID of the post being measured")
    impressions: int = Field(..., ge=0, description="Total views or impressions")
    likes: int = Field(..., ge=0, description="Total likes")
    replies: int = Field(..., ge=0, description="Total replies or comments")
    shares: int = Field(..., ge=0, description="Total shares or reposts")


class FeedMetricsResponse(BaseModel):
    id: str
    post_id: str
    impressions: int
    likes: int
    replies: int
    shares: int
    engagement_score: float = Field(..., description="Calculated weighted engagement percentage")
    recorded_at: datetime
    feedback_insight: Optional[AgentMemoryResponse] = Field(
        None,
        description="Newly retained insight generated from the agent's memory feedback loop"
    )

    model_config = ConfigDict(from_attributes=True)
