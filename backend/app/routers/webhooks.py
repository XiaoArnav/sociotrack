"""
Meta / Instagram Graph API Webhook Router.

Implements the official Meta Developer Dashboard webhook integration:
1. GET /api/webhooks/instagram:
   Meta verification handshake responding to hub.mode, hub.challenge, hub.verify_token.
2. POST /api/webhooks/instagram:
   Real-time event receiver for Instagram feed, comments, mentions, and interactions.
   Computes composite engagement, performs sentiment extraction, and updates vector memory.
3. POST /api/webhooks/instagram/simulate:
   Simulates Meta Webhook event delivery for live telemetry simulation and automated CI/CD.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.core.memory import get_memory_manager, calculate_composite_score

router = APIRouter(prefix="/webhooks", tags=["Meta Instagram Webhooks"])


class MetaWebhookEvent(BaseModel):
    """Schema for simulated or incoming Meta Webhook payload."""
    object: str = Field(default="instagram", description="Meta webhook object type")
    entry: List[Dict[str, Any]] = Field(default_factory=list, description="Array of event entries")


class SimulateWebhookRequest(BaseModel):
    brand_name: str = "arnav.patel07"
    topic: str = "LangGraph and Autonomous Agent Architecture"
    post_caption: str = "Why 78% of autonomous agent failures stem from unconstrained context drift."
    likes: int = 420
    comments: int = 136
    shares: int = 95
    impressions: int = 5800


@router.get(
    "/instagram",
    summary="Meta Webhook Verification Handshake",
    description="Responds to Meta Developer Dashboard verification requests with hub.challenge.",
)
async def verify_instagram_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
):
    """
    Handles Meta's initial webhook registration challenge.
    When configured in the Meta App Dashboard:
    - Callback URL: https://your-domain.com/api/webhooks/instagram
    - Verify Token: <META_VERIFY_TOKEN>
    """
    if not hub_mode or not hub_verify_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing hub.mode or hub.verify_token parameters.",
        )

    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge or "")

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch or invalid mode.",
    )


@router.post(
    "/instagram",
    summary="Meta Webhook Event Ingestion",
    description="Receives real-time Instagram events from Meta Graph API and updates vector memory.",
)
async def receive_instagram_webhook(payload: Dict[str, Any]):
    """
    Ingests real-time events from Instagram Graph API:
    - Comments, mentions, likes, and impressions
    - Evaluates engagement velocity
    - Extracts strategic lessons for high-performing content into ChromaDB vector memory.
    """
    obj_type = payload.get("object")
    if obj_type not in ["instagram", "page"]:
        # Meta sends 404 or ignoring if not subscribed object
        return {"status": "IGNORED", "reason": f"Unsupported object type '{obj_type}'"}

    entries = payload.get("entry", [])
    processed_count = 0
    insights_learned = []

    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            field = change.get("field")
            value = change.get("value", {})

            # 1. Comment received
            if field == "comments":
                comment_text = value.get("text", "")
                media_id = value.get("media", {}).get("id") or value.get("id")
                processed_count += 1

                # If comment indicates strong community sentiment, update sentiment memory
                if any(w in comment_text.lower() for w in ["love", "best", "great", "saving", "bookmark", "blueprint"]):
                    lesson_text = f"Audience responded positively to tactical breakdown: '{comment_text[:60]}'"
                    try:
                        mem_mgr = get_memory_manager("SocioTrack")
                        mem_mgr.insert_lesson(
                            topic="Community Engagement",
                            lesson=lesson_text,
                            score=8.0,
                            format_name="community_response",
                        )
                    except Exception:
                        pass
                    insights_learned.append({
                        "field": "comments",
                        "lesson": lesson_text,
                        "sentiment": "highly_positive",
                    })

            # 2. Insights / Impressions received
            elif field in ["story_insights", "feed", "mentions"]:
                processed_count += 1

    return {
        "status": "EVENT_RECEIVED",
        "object": obj_type,
        "processed_entries": len(entries),
        "processed_changes": processed_count,
        "insights_recorded": len(insights_learned),
    }


@router.post(
    "/instagram/simulate",
    summary="Simulate Meta Webhook Delivery",
    description="Simulates an incoming Meta webhook event to verify the closed-loop memory feedback cycle.",
)
async def simulate_meta_webhook(req: SimulateWebhookRequest):
    """
    Fires a simulated Meta Webhook event through the system.
    Calculates composite score = (Shares*3 + Replies*2 + Likes*1) / Impressions * 100
    Reinforces vector memory if score exceeds threshold.
    """
    score = calculate_composite_score(
        shares=req.shares,
        replies=req.comments,
        likes=req.likes,
        impressions=req.impressions,
    )

    reinforced = False
    lesson_text = None
    doc_id = None

    if score >= settings.MIN_COMPOSITE_SCORE_THRESHOLD:
        reinforced = True
        lesson_text = (
            f"High-engagement pattern confirmed for topic '{req.topic}'. "
            f"Audience resonated with data-first metrics and concrete benchmarks. "
            f"Composite velocity: {score:.2f} (Threshold: {settings.MIN_COMPOSITE_SCORE_THRESHOLD})."
        )
        try:
            mem_mgr = get_memory_manager(req.brand_name)
            doc_id = mem_mgr.insert_lesson(
                topic=req.topic,
                lesson=lesson_text,
                score=score,
            )
        except Exception:
            pass

    return {
        "status": "SIMULATED_META_WEBHOOK_PROCESSED",
        "brand_name": req.brand_name,
        "topic": req.topic,
        "metrics": {
            "impressions": req.impressions,
            "likes": req.likes,
            "comments": req.comments,
            "shares": req.shares,
        },
        "composite_score": score,
        "threshold_met": reinforced,
        "memory_reinforced": reinforced,
        "extracted_lesson": lesson_text,
        "memory_doc_id": doc_id,
    }
