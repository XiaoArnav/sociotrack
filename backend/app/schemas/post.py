from datetime import datetime
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

PostStatus = Literal["draft", "pending_approval", "scheduled", "published"]


class GenerateDraftsRequest(BaseModel):
    brand_id: Optional[str] = Field(None, description="UUID of the brand")
    brand_name: Optional[str] = Field(None, description="Name of the brand")
    topic: str = Field(..., description="Topic or prompt for social media drafts", min_length=2)
    brand_guidelines: Optional[Any] = None

    model_config = ConfigDict(extra="allow")


class PostDraftResponse(BaseModel):
    id: str
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    content: str
    topic: str
    hook_style: Optional[str] = None
    format: Optional[str] = None
    status: str
    scheduled_for: Optional[datetime] = None
    created_at: datetime
    memory_context_applied: Optional[List[str]] = Field(
        default_factory=list,
        description="Relevant insights retrieved from Hindsight memory bank that shaped these drafts"
    )

    model_config = ConfigDict(from_attributes=True, extra="allow")


class GenerateDraftsResponse(BaseModel):
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    topic: str
    drafts: List[PostDraftResponse]
    selected_post: Optional[Dict[str, Any]] = None
    memory_context_summary: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")


class ApprovePostRequest(BaseModel):
    post_id: Optional[str] = Field(None, description="UUID of the post to approve")
    approved_content: Optional[str] = Field(None, description="Final edited or approved post copy")
    post_content: Optional[str] = Field(None, description="Alternative field for post copy")
    format: Optional[str] = Field(None, description="Format style of the post")
    hook_style: Optional[str] = Field(None, description="Hook style of the post")
    scheduled_time: Optional[Any] = Field(None, description="Timestamp for scheduled publishing")
    approved_by: Optional[str] = Field(None, description="Username of approver")

    model_config = ConfigDict(extra="allow")


class ApprovePostResponse(BaseModel):
    id: str
    post_id: str
    status: str
    post_status: Optional[str] = None
    content: Optional[str] = None
    format: Optional[str] = None
    hook_style: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    scheduled_time: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")


class PostQueueItem(BaseModel):
    id: str
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    content: str
    topic: str
    hook_style: Optional[str] = None
    format: Optional[str] = None
    status: str
    scheduled_for: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="allow")


class PostQueueResponse(BaseModel):
    total: int
    queue: List[PostQueueItem]

    model_config = ConfigDict(extra="allow")
