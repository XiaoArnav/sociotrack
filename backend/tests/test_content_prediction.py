"""
Tests for Instagram Crawler & AI Content Prediction Seams.
Follows Matt Pocock Engineering Philosophy (Public-Seam Testing & TDD).
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.schemas import (
    RawPost,
    ContentPredictionReport,
    PredictedContentConcept,
)
from app.services.instagram_crawler import fetch_creator_posts, InstagramCrawlResult
from app.services.content_predictor import predict_winning_content


@pytest.mark.asyncio
async def test_instagram_crawler_public_contract():
    """Verify Instagram crawler fetches posts and returns structured crawl result."""
    result = await fetch_creator_posts(creator_handle="thestevenmellor", max_posts=3)
    assert isinstance(result, InstagramCrawlResult)
    assert result.handle == "thestevenmellor"
    assert len(result.posts) > 0
    assert isinstance(result.posts[0], RawPost)
    assert result.source in [
        "meta_graph_api",
        "rapidapi",
        "rapidapi_live",
        "public_web",
        "benchmark_synthetic",
        "verified_live_telemetry",
        "live_instagram_session",
    ]


@pytest.mark.asyncio
async def test_content_predictor_generates_predictions():
    """Verify prediction engine produces winning concepts and content to kill."""
    sample_posts = [
        RawPost(
            post_id="post_1",
            media_type="REELS",
            caption="Stop using standard loops in Python. 3 faster vector patterns.",
            views_or_reach=50000,
            likes=2500,
            comments=140,
            shares=1800,
            saves=3100,
        ),
        RawPost(
            post_id="post_2",
            media_type="IMAGE",
            caption="Happy Sunday team, make sure you rest before sprint!",
            views_or_reach=2000,
            likes=40,
            comments=2,
            shares=0,
            saves=1,
        ),
    ]

    report = await predict_winning_content(
        creator_handle="thestevenmellor",
        posts=sample_posts,
        niche="Python & AI Engineering",
    )

    assert isinstance(report, ContentPredictionReport)
    assert report.creator_handle == "thestevenmellor"
    assert len(report.predicted_ideas) >= 2
    assert len(report.winning_formats) >= 1
    assert len(report.content_to_kill) >= 1
    first_idea = report.predicted_ideas[0]
    assert isinstance(first_idea, PredictedContentConcept)
    assert len(first_idea.hook_text) > 5
    assert first_idea.predicted_er > 0.0


@pytest.mark.asyncio
async def test_api_predict_content_post_endpoint():
    """Verify POST /api/diagnostics/predict-content endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/diagnostics/predict-content",
            json={
                "creator_handle": "thestevenmellor",
                "niche_or_topic": "AI Agents",
                "max_posts": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["creator_handle"] == "thestevenmellor"
        assert "predicted_ideas" in data
        assert len(data["predicted_ideas"]) > 0
        assert "winning_formats" in data


@pytest.mark.asyncio
async def test_api_predict_content_get_endpoint():
    """Verify GET /api/diagnostics/instagram/{handle}/predict endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/diagnostics/instagram/thestevenmellor/predict?niche=Tech")
        assert response.status_code == 200
        data = response.json()
        assert data["creator_handle"] == "thestevenmellor"
        assert len(data["predicted_ideas"]) > 0
