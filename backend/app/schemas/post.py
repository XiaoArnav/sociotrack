from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict

PostStatus = Literal["draft", "pending_approval", "scheduled", "published"]


class GenerateDraftsRequest(BaseModel):
    brand_id: str = Field(..., description="UUID of the brand")
    topic: str = Field(..., description="Topic or prompt for social media drafts", min_length=2)


class PostDraftResponse(BaseModel):
    id: str
    brand_id: str
    content: str
    topic: str
    hook_style: Optional[str] = None
    status: str
    scheduled_for: Optional[datetime] = None
    created_at: datetime
    memory_context_applied: Optional[List[str]] = Field(
        default_factory=list,
        description="Relevant insights retrieved from Hindsight memory bank that shaped these drafts"
    )

    model_config = ConfigDict(from_attributes=True)


class GenerateDraftsResponse(BaseModel):
    brand_id: str
    topic: str
    drafts: List[PostDraftResponse]


class ApprovePostRequest(BaseModel):
    post_id: str = Field(..., description="UUID of the post to approve")
    approved_content: str = Field(..., description="Final edited or approved post copy", min_length=1)
    scheduled_time: datetime = Field(..., description="ISO 8601 timestamp when the post should be published")


class PostQueueItem(BaseModel):
    id: str
    brand_id: str
    content: str
    topic: str
    hook_style: Optional[str] = None
    status: str
    scheduled_for: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PostQueueResponse(BaseModel):
    total: int
    queue: List[PostQueueItem]
