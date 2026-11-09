"""
Commercial Billing and Subscription API Router.
Provides pricing plans, checkout session creation, self-serve billing portal,
verified Stripe webhook receiver, invoice history, and credit usage enforcement.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.billing import Subscription, PaymentInvoice
from app.routers.auth import get_current_user
from app.services.billing_service import BillingService, PLAN_TIERS

router = APIRouter(prefix="/billing", tags=["Commercial Billing & Subscriptions"])


# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------

class CheckoutSessionRequest(BaseModel):
    workspace_id: str
    plan: str = Field(..., pattern="^(pro|team|agency)$")
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class PortalSessionRequest(BaseModel):
    workspace_id: str
    return_url: Optional[str] = None


class ConsumeCreditsRequest(BaseModel):
    workspace_id: str
    credits: int = Field(default=1, ge=1, le=100)


# ---------------------------------------------------------
# Public Pricing Matrix
# ---------------------------------------------------------

@router.get("/plans")
async def get_plans_catalog():
    """Returns available subscription tiers, pricing, and quota allowances."""
    return {"plans": BillingService.get_plan_catalog()}


# ---------------------------------------------------------
# Workspace Subscription & Usage
# ---------------------------------------------------------

@router.get("/subscription")
async def get_workspace_subscription(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves active subscription, renewal date, and usage meters for a workspace."""
    # Ensure baseline subscription exists
    await BillingService.get_or_create_subscription(db, workspace_id, current_user.id)
    usage_data = await BillingService.get_workspace_usage(db, workspace_id)
    return usage_data


# ---------------------------------------------------------
# Checkout Session Creation
# ---------------------------------------------------------

@router.post("/checkout-session")
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiates a secure Stripe Checkout Session for plan upgrades.
    Redirects to Stripe Hosted Checkout or Sandbox simulator in dev.
    """
    if payload.plan not in PLAN_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan.")

    tier = PLAN_TIERS[payload.plan]
    amount = tier["price_yearly_usd"] if payload.billing_cycle == "yearly" else tier["price_monthly_usd"]

    success_url = payload.success_url or f"{settings.FRONTEND_URL}/?billing_status=success"
    cancel_url = payload.cancel_url or f"{settings.FRONTEND_URL}/?billing_status=canceled"

    # If Stripe secret is set, call official Stripe API
    if settings.STRIPE_SECRET_KEY:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        price_lookup_key = getattr(
            settings,
            f"STRIPE_PRICE_{payload.plan.upper()}_{payload.billing_cycle.upper()}",
            None,
        )
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                customer_email=current_user.email,
                client_reference_id=payload.workspace_id,
                metadata={
                    "workspace_id": payload.workspace_id,
                    "plan": payload.plan,
                    "billing_cycle": payload.billing_cycle,
                    "user_id": current_user.id,
                },
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": f"SocioTrack {tier['name']} ({payload.billing_cycle.capitalize()})",
                                "description": tier["description"],
                            },
                            "unit_amount": amount * 100,
                            "recurring": {
                                "interval": "year" if payload.billing_cycle == "yearly" else "month"
                            },
                        },
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return {
                "session_id": session.id,
                "checkout_url": session.url,
                "mode": "live_stripe",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    # Secure test checkout simulator
    test_session_id = f"cs_test_mock_{payload.workspace_id[:8]}_{payload.plan}"
    test_checkout_url = (
        f"{success_url}&session_id={test_session_id}&plan={payload.plan}&cycle={payload.billing_cycle}"
    )

    return {
        "session_id": test_session_id,
        "checkout_url": test_checkout_url,
        "mode": "test_sandbox",
        "plan": payload.plan,
        "amount_usd": amount,
    }


# ---------------------------------------------------------
# Customer Portal Session (Self-Serve Cancellation / Card Update)
# ---------------------------------------------------------

@router.post("/portal-session")
async def create_portal_session(
    payload: PortalSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Issues self-serve Stripe customer portal URL for card updates and cancellation."""
    stmt = select(Subscription).where(Subscription.workspace_id == payload.workspace_id)
    res = await db.execute(stmt)
    sub = res.scalars().first()

    return_url = payload.return_url or settings.FRONTEND_URL

    if settings.STRIPE_SECRET_KEY and sub and sub.stripe_customer_id:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        portal_session = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=return_url,
        )
        return {"portal_url": portal_session.url}

    return {
        "portal_url": f"{return_url}?portal_mode=simulated",
        "notice": "Self-serve customer portal link issued.",
    }


# ---------------------------------------------------------
# Stripe Webhook Endpoint (Cryptographically Verified & Idempotent)
# ---------------------------------------------------------

@router.post("/webhooks/stripe")
async def stripe_webhook_receiver(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives external Stripe webhook events.
    Verifies HMAC signature, enforces idempotency, and mutates entitlements.
    """
    payload_bytes = await request.body()
    try:
        result = await BillingService.process_stripe_webhook_event(
            db=db,
            payload_bytes=payload_bytes,
            stripe_signature=stripe_signature,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")


# ---------------------------------------------------------
# Invoice History
# ---------------------------------------------------------

@router.get("/invoices")
async def list_workspace_invoices(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists past payment invoices, status, amount, and receipt URLs."""
    stmt = (
        select(PaymentInvoice)
        .where(PaymentInvoice.workspace_id == workspace_id)
        .order_by(desc(PaymentInvoice.created_at))
    )
    res = await db.execute(stmt)
    invoices = [
        {
            "id": inv.id,
            "stripe_invoice_id": inv.stripe_invoice_id,
            "amount_usd": round(inv.amount_cents / 100, 2),
            "currency": inv.currency.upper(),
            "status": inv.status,
            "pdf_url": inv.pdf_url,
            "date": inv.created_at.isoformat(),
        }
        for inv in res.scalars().all()
    ]
    return {"workspace_id": workspace_id, "invoices": invoices}


# ---------------------------------------------------------
# Usage Metering Enforcement Endpoint
# ---------------------------------------------------------

@router.post("/credits/consume")
async def consume_credits_endpoint(
    payload: ConsumeCreditsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Atomic credit deduction. Returns 402 Payment Required if plan quota is exceeded.
    """
    granted = await BillingService.check_and_deduct_credits(
        db=db,
        workspace_id=payload.workspace_id,
        credits=payload.credits,
    )
    if not granted:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="AI generation quota exceeded for current billing cycle. Upgrade your plan to continue.",
        )

    return {"status": "granted", "credits_deducted": payload.credits}
