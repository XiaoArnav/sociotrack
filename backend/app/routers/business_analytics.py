"""
Business Analytics API Router.
Exposes SaaS executive financial health: MRR, ARR, ARPU, churn rate,
paid conversion rates, and gross margin analysis.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.financial_analytics_service import FinancialAnalyticsService

router = APIRouter(prefix="/business-analytics", tags=["SaaS Financial & Business Analytics"])


@router.get("/metrics")
async def get_saas_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns live SaaS financial and operational metrics.
    Adheres to Kleppmann invariant modeling: separates verified data from estimates.
    """
    return await FinancialAnalyticsService.compute_business_metrics(db)
