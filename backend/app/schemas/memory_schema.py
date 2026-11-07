"""
Pydantic contracts for brand memory insights, audience sentiment, and performance lessons.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PastWinningPostSchema(BaseModel):
    id: str
    topic: str
    content: str
    hook: str
    composite_score: float
    impressions: int
    shares: int
    replies: int
    likes: int
    key_takeaway: str


class AudienceSentimentSchema(BaseModel):
    topic: str
    sentiment_label: str
    sentiment_score: float
    summary: str
    keywords: List[str] = Field(default_factory=list)


class LearnedLessonSchema(BaseModel):
    id: str
    topic: str
    key_lesson: str
    composite_score: float
    derived_at: Optional[str] = None


class MemoryInsightsResponse(BaseModel):
    brand_name: str
    total_winning_posts: int
    total_lessons_learned: int
    current_sentiment: AudienceSentimentSchema
    top_winning_posts: List[PastWinningPostSchema]
    learned_lessons: List[LearnedLessonSchema]
