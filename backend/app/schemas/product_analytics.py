"""
Schemas for Product Usage Analytics and User Privacy.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProductEventCreate(BaseModel):
    event_name: str = Field(..., description="Name of the product lifecycle event")
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    brand_id: Optional[str] = None
    step_name: Optional[str] = None
    duration_seconds: Optional[float] = None
    metadata_json: Optional[str] = None


class ProductEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str
    user_id: Optional[str] = None
    step_name: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime


class ProductMetricsSummary(BaseModel):
    total_events: int
    onboarding_funnel: Dict[str, int]
    time_to_first_insight_avg_sec: float
    recommendation_acceptance_rate: float
    recommendation_rejection_rate: float
    weekly_active_users: int
    top_abandonment_steps: List[Dict[str, Any]]
    total_exports: int
    total_publishes: int


class UserConsentRequest(BaseModel):
    telemetry_opt_in: bool = True
    ai_training_opt_out: bool = True


class UserConsentResponse(BaseModel):
    user_id: str
    telemetry_opt_in: bool
    ai_training_opt_out: bool
    consent_updated_at: Optional[datetime] = None


class UserDataExport(BaseModel):
    user: Dict[str, Any]
    brands: List[Dict[str, Any]]
    posts: List[Dict[str, Any]]
    memories: List[Dict[str, Any]]
    exported_at: datetime
