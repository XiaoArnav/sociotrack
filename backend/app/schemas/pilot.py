"""
Schemas for Pilot Program workflow:
- Historical Content Import with Data Provenance
- Manual Content Export for 3rd-party schedulers
- Idempotent Publishing Contract
- Performance Measurement with Attribution Warnings
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class HistoricalPostImportItem(BaseModel):
    caption: str
    published_at: Optional[datetime] = None
    format: Optional[str] = "single_image"
    likes: int = 0
    comments: int = 0
    shares: int = 0
    impressions: Optional[int] = None
    is_verified: bool = True


class HistoricalImportRequest(BaseModel):
    brand_id: str
    source_provenance: str = Field(
        default="verified_archive",
        description="'meta_graph_api' | 'verified_archive' | 'manual_upload'"
    )
    data_limitations: Optional[str] = None
    posts: List[HistoricalPostImportItem]


class HistoricalImportResponse(BaseModel):
    status: str
    brand_id: str
    posts_imported: int
    data_provenance: str
    limitations_disclaimer: str
    intelligence_profile_updated: bool


class ContentExportRequest(BaseModel):
    brand_id: str
    caption: str
    format: str = "carousel"
    hashtags: List[str] = Field(default_factory=list)
    optimal_utc_time: Optional[str] = None
    target_platform: str = "instagram"
    draft_id: Optional[str] = None
    post_id: Optional[str] = None


class ContentExportResponse(BaseModel):
    export_id: str
    formatted_content: str
    json_payload: Dict[str, Any]
    clipboard_text: str
    exported_at: datetime


class PublishRequest(BaseModel):
    idempotency_key: str = Field(..., description="Unique client key preventing duplicate posts")
    platform: str = "instagram"
    scheduled_time_utc: Optional[datetime] = None
    caption: Optional[str] = None


class PublishResponse(BaseModel):
    status: str = Field(..., description="'published' | 'scheduled' | 'failed' | 'action_required'")
    post_id: str
    idempotency_key: str
    platform_post_id: Optional[str] = None
    published_at: Optional[datetime] = None
    message: str


class PerformanceMeasurementResponse(BaseModel):
    post_id: str
    brand_id: str
    engagement_rate: float
    likes: int
    comments: int
    shares: int
    impressions: int
    attribution_confidence: float
    attribution_caveats: List[str]
    sample_size_adequate: bool
