"""
FastAPI application entry point for SocioTrack Backend.
Owned by Person 1 & Person 2.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.db.session import init_db
from backend.app.api.routes_posts import router as posts_router
from backend.app.api.routes_memory import router as memory_router
from backend.app.api.routes_sim import router as sim_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables
    init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Agentic Core and API for Autonomous Social Media Engagement and Reinforcement Learning.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(posts_router)
app.include_router(memory_router)
app.include_router(sim_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
