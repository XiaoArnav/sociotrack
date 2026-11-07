"""
API routers package exports.
"""

from backend.app.api.routes_posts import router as posts_router
from backend.app.api.routes_memory import router as memory_router
from backend.app.api.routes_sim import router as sim_router

__all__ = ["posts_router", "memory_router", "sim_router"]
