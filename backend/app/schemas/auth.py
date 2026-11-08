"""
Pydantic contracts for authentication requests and user session responses.
"""

from typing import Optional
from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: str = Field(..., min_length=1, description="Full name of user")
    role: Optional[str] = "Principal Content Architect"


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_demo: bool = False


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
