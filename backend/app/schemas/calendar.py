from typing import List, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


class CalendarSlotRecommendation(BaseModel):
    id: str
    day: str
    recommended_utc_hour: int = Field(..., ge=0, le=23)
    suggested_topic: str
    content_format: str
    rationale: str
    historical_supporting_score: float
    data_sufficiency: str = Field(default="empirical", description="'empirical' | 'hypothesis'")
    requires_approval: bool = True
    is_approved: bool = False
    scheduled_iso: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class CalendarMixPlanResponse(BaseModel):
    brand_id: str
    brand_name: str
    planning_window: str = "7-Day Continuous Horizon"
    schedule_gaps_detected: int
    recommended_mix: Dict[str, float]
    slots: List[CalendarSlotRecommendation]
    guideline_note: str = "Autonomous posting is disabled by default. All scheduled slots require explicit user approval."

    model_config = ConfigDict(extra="allow")


class ApproveCalendarSlotRequest(BaseModel):
    slot_id: str
    approved_topic: Optional[str] = None
    custom_scheduled_time: Optional[str] = None
