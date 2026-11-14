"""
SocioTrack FastAPI Application Entry Point.
AI Social Media Engagement Agent Backend & Memory Layer.
Owned by Person 1 & Person 2.
"""
import asyncio
import logging
import os
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import (
    settings,
    validate_production_configuration,
    INSECURE_DEFAULT_SECRET_KEYS,
    INSECURE_DEFAULT_META_TOKENS,
)
from app.database import init_db
from app.routers import (
    drafts,
    posts,
    simulator,
    memory,
    brands,
    diagnostics,
    webhooks,
    avatars,
    auth,
    experiments,
    calendar,
    product_analytics,
    system_health,
    user_privacy,
    feedback,
    pilot,
    workspaces,
    advanced_intelligence,
    content_operations,
    advanced_reporting,
    billing,
    business_analytics,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce strict production configuration validation gate with cloud hosting auto-healing
    try:
        validate_production_configuration(settings)
    except RuntimeError as e:
        is_hosted = bool(
            os.environ.get("RENDER")
            or os.environ.get("RENDER_SERVICE_ID")
            or os.environ.get("RENDER_INSTANCE_ID")
            or os.environ.get("AUTO_HEAL_PROD_SECRETS") == "true"
        )
        if is_hosted:
            logger = logging.getLogger("uvicorn.error")
            err_msg = str(e)
            if (
                "SECRET_KEY" in err_msg
                or not settings.SECRET_KEY
                or len(settings.SECRET_KEY.strip()) < 32
                or settings.SECRET_KEY.strip() in INSECURE_DEFAULT_SECRET_KEYS
            ):
                logger.warning(
                    "Cloud environment (Render) detected without custom SECRET_KEY: %s. "
                    "Auto-generating a cryptographically strong 64-character SECRET_KEY for this runtime instance. "
                    "Tip: Set SECRET_KEY in your Render Dashboard to persist session tokens across restarts.",
                    e,
                )
                settings.SECRET_KEY = secrets.token_hex(32)

            if (
                "META_VERIFY_TOKEN" in err_msg
                or settings.META_VERIFY_TOKEN in INSECURE_DEFAULT_META_TOKENS
            ):
                logger.warning(
                    "Cloud environment (Render) detected with default META_VERIFY_TOKEN. "
                    "Auto-generating a unique META_VERIFY_TOKEN for this runtime instance."
                )
                settings.META_VERIFY_TOKEN = f"prod_meta_{secrets.token_hex(16)}"

            # Re-run validation to enforce compliance with all other invariants (DEBUG, CORS, etc.)
            validate_production_configuration(settings)
        else:
            raise

    logger = logging.getLogger("uvicorn.error")

    # Startup: ensure async tables exist, surface failures immediately
    try:
        await init_db()
        logger.info("Async database schema initialized successfully.")
    except Exception as e:
        logger.error("FATAL: Failed to initialize async database schema: %s", e, exc_info=True)
        raise

    # Initialize sync session schema, surface failures immediately
    try:
        from app.db.session import init_db as init_db_legacy
        init_db_legacy()
        logger.info("Sync database schema initialized successfully.")
    except Exception as e:
        if "already exists" in str(e).lower():
            logger.info("Sync database schema already initialized.")
        else:
            logger.error("FATAL: Failed to initialize sync database schema: %s", e, exc_info=True)
            raise

    # Seed required finals demo account, workspace, and brand
    try:
        from app.db.seed_demo import seed_demo_data
        await seed_demo_data()
    except Exception as e:
        logger.warning("Could not auto-seed demo data: %s", e)

    # Background 6-hour automated snapshot cron loop
    async def _snapshot_cron_loop():
        # Wait 30 seconds after startup so server is warm
        await asyncio.sleep(30)
        while True:
            try:
                from app.services.snapshot_service import poll_all_indexed_creators
                await poll_all_indexed_creators()
            except Exception:
                pass
            await asyncio.sleep(21600)  # 6 hours

    cron_task = asyncio.create_task(_snapshot_cron_loop())
    yield
    cron_task.cancel()


app = FastAPI(
    title="SocioTrack Backend API",
    description=(
        "Backend API and database layer for AI Social Media Engagement Agent with "
        "Hindsight Agent Memory integration (Vectorize.io) and LangGraph agent workflow."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Setup - Hardened with specific origins and regex for Vercel deployment previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(drafts.router, prefix=settings.API_V1_STR)
app.include_router(posts.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(brands.router, prefix=settings.API_V1_STR)
app.include_router(diagnostics.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(avatars.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(experiments.router, prefix=settings.API_V1_STR)
app.include_router(calendar.router, prefix=settings.API_V1_STR)
app.include_router(product_analytics.router)
app.include_router(system_health.router)
app.include_router(user_privacy.router)
app.include_router(feedback.router)
app.include_router(pilot.router)
app.include_router(workspaces.router, prefix=settings.API_V1_STR)
app.include_router(advanced_intelligence.router, prefix=settings.API_V1_STR)
app.include_router(content_operations.router, prefix=settings.API_V1_STR)
app.include_router(advanced_reporting.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(business_analytics.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"], summary="General health check")
@app.get(
    "/api/health",
    tags=["System"],
    status_code=status.HTTP_200_OK,
    summary="API Health check and status",
)
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "service": "sociotrack-backend",
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "hindsight_configured": bool(settings.HINDSIGHT_API_URL),
        "database": settings.DATABASE_URL.split("://")[0],
    }


@app.get("/", tags=["System"], include_in_schema=False)
async def root():
    return {
        "message": "SocioTrack AI Engagement Agent API is running. Access interactive docs at /docs",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
