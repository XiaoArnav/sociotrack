"""
Pydantic schemas package exports for SocioTrack.
Unifies Person 1 (Agent / LangGraph) and Person 2 (Backend / Database / API) models.
"""

from app.schemas.brand import BrandCreate, BrandResponse
from app.schemas.post import (
    GenerateDraftsRequest,
    GenerateDraftsResponse,
    PostDraftResponse,
    ApprovePostRequest,
    PostQueueItem,
    PostQueueResponse,
)
from app.schemas.analytics import FeedMetricsRequest, FeedMetricsResponse
from app.schemas.memory import (
    AgentMemoryCreate,
    AgentMemoryResponse,
    MemoryInsightsResponse,
)

# Person 1 Schemas
try:
    from app.schemas.post_schema import (
        PostFormat,
        PostStatus,
        PostVariationSchema,
        BrandVoiceGuidelinesSchema,
        SelectedPostSchema,
        ApprovePostResponse,
        EngagementMetricsSchema,
        SimulatorFeedRequest,
        SimulatorFeedResponse,
    )
    from app.schemas.memory_schema import (
        PastWinningPostSchema,
        AudienceSentimentSchema,
        LearnedLessonSchema,
    )
except ImportError:
    pass

__all__ = [
    "BrandCreate",
    "BrandResponse",
    "GenerateDraftsRequest",
    "GenerateDraftsResponse",
    "PostDraftResponse",
    "ApprovePostRequest",
    "PostQueueItem",
    "PostQueueResponse",
    "FeedMetricsRequest",
    "FeedMetricsResponse",
    "AgentMemoryCreate",
    "AgentMemoryResponse",
    "MemoryInsightsResponse",
]
