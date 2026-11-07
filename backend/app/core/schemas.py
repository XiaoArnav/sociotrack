"""
Pydantic data contracts for Person 1: AI Diagnostic Brain.
Defines RawPost, PostAuditPattern, and CreatorAuditReport.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RawPost(BaseModel):
    """Raw social/Instagram post metadata and metrics."""
    post_id: str
    media_type: str = Field(..., description="Post media type: REELS, CAROUSEL_ALBUM, IMAGE")
    caption: str
    views_or_reach: int = Field(..., ge=0, description="Total views or reach")
    likes: int = Field(default=0, ge=0)
    comments: int = Field(default=0, ge=0)
    shares: int = Field(default=0, ge=0)
    saves: int = Field(default=0, ge=0)
    posted_hour_utc: int = Field(default=12, ge=0, le=23, description="Upload hour in UTC (0-23)")


class PostAuditPattern(BaseModel):
    """Identified content pattern with metric evidence and actionable recommendations."""
    pattern_title: str = Field(..., description="Short summary of the pattern, e.g., 'Contrarian Hook Reels'")
    metric_evidence: str = Field(..., description="Concrete stats, e.g., '2.8x higher shares-to-reach ratio'")
    why_it_happened: str = Field(..., description="Algorithm/audience psychological reason")
    actionable_recommendation: str = Field(..., description="Concrete direction for the creator's next upload")


class CreatorAuditReport(BaseModel):
    """Comprehensive diagnostic report: What's Working vs. What's Not."""
    creator_handle: str
    health_score: int = Field(..., ge=0, le=100, description="Scale 0-100 reflecting overall audience engagement quality")
    median_engagement_rate: float = Field(..., description="Overall median engagement rate percentage")
    top_performing_format: str = Field(..., description="Best performing media type (e.g., REELS, CAROUSEL_ALBUM)")
    whats_working: List[PostAuditPattern] = Field(default_factory=list, description="Patterns statistically outperforming baseline")
    whats_failing: List[PostAuditPattern] = Field(default_factory=list, description="Patterns dragging down reach or engagement")
    immediate_next_steps: List[str] = Field(default_factory=list, description="Top 3-5 immediate execution steps for creator")
