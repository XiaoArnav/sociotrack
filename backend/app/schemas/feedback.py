"""
Schemas for recommendation evaluation and user research feedback.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RecommendationFeedbackCreate(BaseModel):
    draft_id: str
    brand_id: str
    decision: str = Field(..., description="'accepted' | 'rejected' | 'edited'")
    rejection_reason: Optional[str] = Field(None, description="'poor_voice' | 'repetitive' | 'off_topic' | 'inappropriate_hook' | 'other'")
    user_explanation: Optional[str] = None
    usefulness_rating: Optional[int] = Field(None, ge=1, le=5)
    edited_caption: Optional[str] = None
    is_explicit_rule: Optional[bool] = Field(None, description="Whether user explicitly requests creating a permanent negative brand rule")


class RecommendationFeedbackResponse(BaseModel):
    status: str
    feedback_id: str
    memory_lesson_created: Optional[bool] = False
    lesson_id: Optional[str] = None
    confidence_impact: Optional[float] = None
    rejection_count: Optional[int] = None


class UserFeedbackCreate(BaseModel):
    category: str = Field(..., description="'ai_quality' | 'usability' | 'bug_report' | 'feature_request' | 'general'")
    message: str
    rating: Optional[int] = Field(None, ge=1, le=5)
    brand_id: Optional[str] = None
    user_id: Optional[str] = None
    draft_id: Optional[str] = None


class UserFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    message: str
    rating: Optional[int] = None
    rejection_reason: Optional[str] = None
    triage_status: str
    created_at: datetime


class FeedbackTriageUpdate(BaseModel):
    triage_status: str = Field(..., description="'new' | 'in_review' | 'triaged' | 'resolved'")


class FeedbackBacklogSummary(BaseModel):
    total_feedback_items: int
    average_rating: float
    by_category: Dict[str, int]
    rejection_reasons_breakdown: Dict[str, int]
    prioritized_items: List[UserFeedbackResponse]
