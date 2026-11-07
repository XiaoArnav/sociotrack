from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict

MemoryCategory = Literal["hook_rule", "timing_rule", "audience_pain_point"]


class AgentMemoryBase(BaseModel):
    brand_id: str
    insight_text: str = Field(..., min_length=5, description="Audience or engagement rule learned by the agent")
    category: MemoryCategory = Field(..., description="Classification of the insight")
    confidence_score: float = Field(0.85, ge=0.0, le=1.0, description="Confidence rating from 0.0 to 1.0")


class AgentMemoryCreate(AgentMemoryBase):
    embedding: Optional[str] = None


class AgentMemoryResponse(AgentMemoryBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemoryInsightsResponse(BaseModel):
    brand_id: str
    total_insights: int
    insights: List[AgentMemoryResponse]
