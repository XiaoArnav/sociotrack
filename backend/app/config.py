"""
Configuration management using Pydantic Settings.
Loads environment variables from .env or process environment.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application runtime settings for Person 1 (Agent) & Person 2 (Backend/Database)."""

    APP_NAME: str = "SocioTrack"
    PROJECT_NAME: str = "SocioTrack Backend"
    APP_ENV: str = "development"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # Database Settings (Supports PostgreSQL & SQLite)
    DATABASE_URL: str = "sqlite+aiosqlite:///./sociotrack.db"
    SYNC_DATABASE_URL: str = "sqlite:///./sociotrack.db"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Vector store & Memory settings
    VECTOR_STORE_PROVIDER: str = "chroma"
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_data"

    # Hindsight Memory System Settings (Vectorize.io)
    HINDSIGHT_API_URL: str = "http://localhost:8888"
    HINDSIGHT_API_KEY: str = ""
    HINDSIGHT_BANK_PREFIX: str = "sociotrack"

    # Model Keys (Groq / OpenAI / Gemini)
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    DEFAULT_MODEL: str = "gemini-1.5-pro"

    # Meta / Instagram Graph API Webhook Settings
    META_VERIFY_TOKEN: str = "sociotrack_meta_verify_token_2026"
    META_APP_SECRET: str = ""

    # Social Engagement Scoring Thresholds
    MIN_COMPOSITE_SCORE_THRESHOLD: float = 5.0
    WEIGHT_SHARES: float = 3.0
    WEIGHT_REPLIES: float = 2.0
    WEIGHT_LIKES: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )


settings = Settings()
