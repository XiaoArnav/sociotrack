"""
Billing, Subscription, Usage Metering, and Idempotent Webhook ORM Models.
Enforces multi-tier SaaS commercial boundaries with Kleppmann-grade financial invariants.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan = Column(String(50), nullable=False, default="free", index=True)  # free, pro, team, agency
    status = Column(String(50), nullable=False, default="active", index=True)  # active, trialing, past_due, canceled
    billing_cycle = Column(String(20), nullable=False, default="monthly")  # monthly, yearly
    current_period_start = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class PaymentInvoice(Base):
    __tablename__ = "payment_invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    stripe_invoice_id = Column(String(255), nullable=True, index=True)
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="usd")
    status = Column(String(50), nullable=False, default="paid", index=True)  # paid, open, failed, void
    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)


class UsageMeter(Base):
    __tablename__ = "usage_meters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(50), nullable=False, index=True)  # ai_generation_credits, connected_accounts, workspace_brands
    quantity = Column(Integer, nullable=False, default=0)
    period_start = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    period_end = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class BillingWebhookEvent(Base):
    """
    Idempotent ledger of processed external billing events.
    Guarantees no duplicate credit allocation, double upgrades, or replay attacks.
    """
    __tablename__ = "billing_webhook_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    payload_hash = Column(String(64), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
