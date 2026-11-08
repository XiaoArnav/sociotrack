from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

ExperimentType = Literal["hook", "format", "cta", "structure"]
ExperimentStatus = Literal["active", "completed", "insufficient_data"]


class ExperimentCreate(BaseModel):
    brand_id: Optional[str] = None
    title: str = Field(..., min_length=3, description="Hypothesis title for the test")
    experiment_type: ExperimentType = Field(default="hook")
    variant_a_label: str = Field(default="Variant A: Quantitative Benchmark Hook")
    variant_a_content: str = Field(..., min_length=10)
    variant_b_label: str = Field(default="Variant B: Contrarian Industry Hook")
    variant_b_content: str = Field(..., min_length=10)
    observation_days: int = Field(default=7, ge=1, le=30)
    min_sample_size: int = Field(default=500, ge=100)

    model_config = ConfigDict(extra="allow")


class RecordExperimentResultRequest(BaseModel):
    variant_a_impressions: int = Field(..., ge=0)
    variant_a_engagement_rate: float = Field(..., ge=0.0)
    variant_b_impressions: int = Field(..., ge=0)
    variant_b_engagement_rate: float = Field(..., ge=0.0)


class ExperimentResponse(BaseModel):
    id: str
    brand_id: str
    title: str
    experiment_type: str
    variant_a_label: str
    variant_a_content: str
    variant_a_impressions: int
    variant_a_engagement_rate: float
    variant_b_label: str
    variant_b_content: str
    variant_b_impressions: int
    variant_b_engagement_rate: float
    status: str
    observation_days: int
    min_sample_size: int
    winner_variant: Optional[str] = None
    confidence_score: float
    conclusion_notes: Optional[str] = None
    limitations: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="allow")
