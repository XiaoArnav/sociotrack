"""
Unit tests for Meta / Instagram Webhook endpoints.
Verifies GET handshake and POST event processing.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings


@pytest.mark.asyncio
async def test_meta_webhook_verification_handshake_success():
    """Test that Meta's verification challenge returns the hub.challenge string."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        challenge = "1158201244"
        response = await client.get(
            "/api/webhooks/instagram",
            params={
                "hub.mode": "subscribe",
                "hub.challenge": challenge,
                "hub.verify_token": settings.META_VERIFY_TOKEN,
            },
        )
        assert response.status_code == 200
        assert response.text == challenge


@pytest.mark.asyncio
async def test_meta_webhook_verification_invalid_token():
    """Test that mismatched verify token is rejected with 403."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/webhooks/instagram",
            params={
                "hub.mode": "subscribe",
                "hub.challenge": "12345",
                "hub.verify_token": "wrong_token",
            },
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_meta_webhook_event_ingestion():
    """Test receiving real-time Instagram comments and events."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "object": "instagram",
            "entry": [
                {
                    "id": "17841400000000000",
                    "time": 1711756800,
                    "changes": [
                        {
                            "field": "comments",
                            "value": {
                                "id": "17900000000000000",
                                "text": "Incredible post! Really loved the tactical breakdown and saving for reference.",
                            },
                        }
                    ],
                }
            ],
        }
        response = await client.post("/api/webhooks/instagram", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "EVENT_RECEIVED"
        assert data["processed_entries"] == 1
        assert data["insights_recorded"] >= 1


@pytest.mark.asyncio
async def test_meta_webhook_simulation_endpoint(auth_headers):
    """Test simulated Meta webhook delivery and memory reinforcement."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "brand_name": "thestevenmellor",
            "topic": "LangGraph Memory Systems",
            "post_caption": "Testing live webhook memory loop",
            "likes": 500,
            "comments": 150,
            "shares": 100,
            "impressions": 5000,
        }
        response = await client.post("/api/webhooks/instagram/simulate", headers=auth_headers, json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SIMULATED_META_WEBHOOK_PROCESSED"
        # Composite score: (100*3 + 150*2 + 500*1) / 5000 * 100 = (300 + 300 + 500) / 5000 * 100 = 1100 / 5000 * 100 = 22.0
        assert data["composite_score"] == 22.0
        assert data["threshold_met"] is True
        assert data["memory_reinforced"] is True
