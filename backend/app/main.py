"""
SocioTrack FastAPI Application Entry Point.
AI Social Media Engagement Agent Backend & Memory Layer.
Owned by Person 1 & Person 2.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import drafts, posts, simulator, memory, brands


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    await init_db()
    # Initialize sync sqlite session if present for legacy routes
    try:
        from app.db.session import init_db as init_db_legacy
        init_db_legacy()
    except Exception:
        pass
    yield
    # Shutdown logic if needed


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

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
