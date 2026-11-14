"""
Pydantic contracts for posts, variations, drafts, and approval workflows.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PostFormat(str, Enum):
    DATA_FIRST = "Format A: Data-first"
    HOT_TAKE = "Format B: Hot take"
    TACTICAL_BREAKDOWN = "Format C: Tactical breakdown"


class PostStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    REJECTED = "rejected"


class PostVariationSchema(BaseModel):
    id: Optional[str] = None
    format: PostFormat
    hook: str
    body: str
    call_to_action: str
    full_text: str
    rationale: str
    match_score: Optional[float] = None
    recommendation_rationale: Optional[str] = None
    supporting_evidence: Optional[str] = None
    memories_applied: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.88, ge=0.0, le=1.0)
    known_limitations: Optional[str] = None
    platform_target: str = Field(default="Instagram")
    anti_repetition_passed: bool = Field(default=True)


class BrandVoiceGuidelinesSchema(BaseModel):
    brand_voice: str = "Authoritative yet conversational, insightful, high-signal, zero-fluff."
    dos: List[str] = Field(
        default_factory=lambda: [
            "Use concrete metrics, specific benchmarks, or real-world evidence.",
            "Maintain an authoritative, actionable, and practitioner-first perspective.",
            "Structure content with clean whitespace and scannable bullet points.",
            "End with an engaging open-ended question or clear CTA that sparks practitioner debate.",
        ]
    )
    donts: List[str] = Field(
        default_factory=lambda: [
            "Never use hollow marketing hype or unsubstantiated superlatives.",
            "Avoid hashtag stuffing (limit to at most 1-2 focused tags or none).",
            "Do not sound robotic, corporate, or overly formal.",
            "Never make controversial claims without actionable context or evidence.",
        ]
    )
    target_audience: str = "AI engineers, CTOs, tech leads, and founders building agentic systems."


class SelectedPostSchema(BaseModel):
    draft: PostVariationSchema
    match_score: float = Field(..., ge=0.0, le=10.0)
    evaluation_summary: str
    dos_matched: List[str] = Field(default_factory=list)
    donts_avoided: List[str] = Field(default_factory=list)
    scheduled_time: Optional[str] = None


class GenerateDraftsRequest(BaseModel):
    brand_name: str = Field(..., examples=["SocioTrack AI"])
    topic: str = Field(..., examples=["Deterministic State Machines with LangGraph"])
    brand_guidelines: Optional[BrandVoiceGuidelinesSchema] = None


class GenerateDraftsResponse(BaseModel):
    brand_name: str
    topic: str
    drafts: List[PostVariationSchema]
    selected_post: SelectedPostSchema
    memory_context_summary: str


class ApprovePostRequest(BaseModel):
    post_id: Optional[str] = None
    post_content: str
    format: PostFormat
    scheduled_time: Optional[str] = "2026-11-09T09:30:00Z"
    approved_by: Optional[str] = "social_media_manager"


class ApprovePostResponse(BaseModel):
    status: str
    post_id: str
    scheduled_time: str
    message: str


class EngagementMetricsSchema(BaseModel):
    impressions: int = Field(..., ge=0)
    shares: int = Field(default=0, ge=0)
    replies: int = Field(default=0, ge=0)
    likes: int = Field(default=0, ge=0)


class SimulatorFeedRequest(BaseModel):
    brand_name: str = Field(..., examples=["SocioTrack AI"])
    topic: str = Field(..., examples=["Deterministic State Machines with LangGraph"])
    post_content: str
    metrics: EngagementMetricsSchema


class SimulatorFeedResponse(BaseModel):
    composite_score: float
    qualifies_for_memory: bool
    status_message: str
    key_lesson: Optional[str] = None
    memory_doc_id: Optional[str] = None
