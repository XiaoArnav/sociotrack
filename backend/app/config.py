"""
Configuration management using Pydantic Settings.
Loads environment variables from .env or process environment.
Enforces strict production configuration validation and secrets hygiene.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


# Insecure placeholder values that must never be used in production
INSECURE_DEFAULT_SECRET_KEYS = {
    "sociotrack_jwt_secret_key_prod_hardening_2026_super_secure",
    "secret",
    "changeme",
    "password",
    "default_secret_key",
    "your_secret_key_here",
}

INSECURE_DEFAULT_META_TOKENS = {
    "sociotrack_meta_verify_token_2026",
    "default_meta_verify_token",
    "your_meta_verify_token_here",
}


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

    # Security & JWT Authentication
    SECRET_KEY: str = "sociotrack_jwt_secret_key_prod_hardening_2026_super_secure"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    BCRYPT_ROUNDS: int = 12
    ENABLE_DEMO_MODE: bool = True

    # Rate Limiting Settings
    AUTH_RATE_LIMIT_LOGIN_MAX: int = 5
    AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 900  # 15 minutes
    AUTH_RATE_LIMIT_REGISTER_MAX: int = 10
    AUTH_RATE_LIMIT_REGISTER_WINDOW_SECONDS: int = 3600  # 1 hour

    # CORS Settings - Strict origins for secure credentialed cookies & sessions
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://frontend-taupe-zeta-84.vercel.app",
        "https://sociotrack.vercel.app",
    ]
    CORS_ORIGIN_REGEX: Optional[str] = r"https://.*\.vercel\.app"

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
    GEMINI_API_KEY: str = ""
    DEFAULT_MODEL: str = "gemini-3-flash-preview"

    # Meta / Instagram Graph API Webhook & Crawler Settings
    META_VERIFY_TOKEN: str = "sociotrack_meta_verify_token_2026"
    META_APP_SECRET: str = ""
    INSTAGRAM_ACCESS_TOKEN: str = ""
    INSTAGRAM_BUSINESS_ACCOUNT_ID: str = ""
    INSTAGRAM_SESSIONID: str = ""
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "instagram-scraper-stable-api.p.rapidapi.com"

    # Social Engagement Scoring Thresholds
    MIN_COMPOSITE_SCORE_THRESHOLD: float = 5.0
    WEIGHT_SHARES: float = 3.0
    WEIGHT_REPLIES: float = 2.0
    WEIGHT_LIKES: float = 1.0

    # Stripe Commercial Billing & Entitlements
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "https://frontend-taupe-zeta-84.vercel.app"
    STRIPE_PRICE_PRO_MONTHLY: str = "price_pro_monthly"
    STRIPE_PRICE_PRO_YEARLY: str = "price_pro_yearly"
    STRIPE_PRICE_TEAM_MONTHLY: str = "price_team_monthly"
    STRIPE_PRICE_TEAM_YEARLY: str = "price_team_yearly"
    STRIPE_PRICE_AGENCY_MONTHLY: str = "price_agency_monthly"
    STRIPE_PRICE_AGENCY_YEARLY: str = "price_agency_yearly"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )


def validate_production_configuration(cfg: Settings) -> None:
    """
    Strict production startup validation gate.
    Ensures that insecure defaults, weak secrets, or development switches
    cannot silently activate in production environments.
    """
    env_norm = (cfg.ENVIRONMENT or cfg.APP_ENV or "").lower().strip()
    is_prod = env_norm in ("production", "prod")

    if not is_prod:
        return

    # 1. DEBUG must be False in production
    if cfg.DEBUG:
        raise RuntimeError("FATAL: Production configuration error: DEBUG must be set to False.")

    # 2. SECRET_KEY validation: must be set, >=32 chars, and not an insecure default
    if not cfg.SECRET_KEY or len(cfg.SECRET_KEY.strip()) < 32:
        raise RuntimeError(
            "FATAL: Production configuration error: SECRET_KEY must be a cryptographically strong secret "
            "of at least 32 characters."
        )
    if cfg.SECRET_KEY.strip() in INSECURE_DEFAULT_SECRET_KEYS:
        raise RuntimeError(
            "FATAL: Production configuration error: Hardcoded/insecure default SECRET_KEY detected in production. "
            "You must supply a unique SECRET_KEY via environment variables."
        )

    # 3. META_VERIFY_TOKEN validation
    if cfg.META_VERIFY_TOKEN and cfg.META_VERIFY_TOKEN.strip() in INSECURE_DEFAULT_META_TOKENS:
        raise RuntimeError(
            "FATAL: Production configuration error: Default META_VERIFY_TOKEN detected. "
            "Provide a unique, secret META_VERIFY_TOKEN for production webhook verification."
        )

    # 4. CORS validation: Wildcards strictly disallowed with credentials
    if "*" in cfg.CORS_ORIGINS:
        raise RuntimeError(
            "FATAL: Production configuration error: Wildcard '*' is strictly prohibited in CORS_ORIGINS "
            "when credentials are supported. Specify explicit trusted domains."
        )


settings = Settings()
