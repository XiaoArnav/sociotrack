from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BrandBase(BaseModel):
    name: str = Field(..., description="Brand or organization name", min_length=2, max_length=255)
    voice_description: Optional[str] = Field(None, description="Tone, voice guidelines, persona instructions")
    target_audience: Optional[str] = Field(None, description="Target demographic, personas, community pain points")


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
