"""
Business Analytics API Router.
Exposes SaaS executive financial health: MRR, ARR, ARPU, churn rate,
paid conversion rates, and gross margin analysis.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user, is_admin_user
from app.services.financial_analytics_service import FinancialAnalyticsService
from app.services.authorization_service import get_user_workspace_ids
from app.services.workspace_service import get_member_role, require_role

router = APIRouter(prefix="/business-analytics", tags=["SaaS Financial & Business Analytics"])


@router.get("/metrics")
async def get_saas_metrics(
    workspace_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns live SaaS financial and operational metrics.
    Restricted to platform admins and workspace owner/admins.
    """
    if not is_admin_user(current_user):
        if workspace_id:
            role = await get_member_role(db, workspace_id, current_user.id)
            if not role or not require_role(role, "admin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: SaaS executive business metrics require admin role.",
                )
        else:
            user_ws_ids = await get_user_workspace_ids(db, current_user.id)
            has_admin_role = False
            for ws_id in user_ws_ids:
                r = await get_member_role(db, ws_id, current_user.id)
                if r and require_role(r, "admin"):
                    has_admin_role = True
                    break
            if not has_admin_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Executive business analytics require workspace admin permissions.",
                )

    return await FinancialAnalyticsService.compute_business_metrics(db)
