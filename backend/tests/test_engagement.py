"""
Unit tests for the Engagement Scoring Engine and Memory Insight Generator.
Following strict TDD discipline.
"""
import pytest
from app.services.engagement import (
    calculate_engagement_score,
    derive_memory_insight,
)


def test_engagement_score_normal_case():
    # 1000 impressions, 50 likes, 10 replies, 5 shares
    # engagements = (50 * 1.0) + (10 * 2.5) + (5 * 3.5) = 50 + 25 + 17.5 = 92.5
    # score = (92.5 / 1000) * 100 = 9.25
    score = calculate_engagement_score(
        impressions=1000,
        likes=50,
        replies=10,
        shares=5,
    )
    assert score == 9.25


def test_engagement_score_zero_impressions():
    # Edge case: zero impressions must return 0.0 without ZeroDivisionError
    score = calculate_engagement_score(
        impressions=0,
        likes=10,
        replies=2,
        shares=1,
    )
    assert score == 0.0


def test_engagement_score_zero_interactions():
    score = calculate_engagement_score(
        impressions=5000,
        likes=0,
        replies=0,
        shares=0,
    )
    assert score == 0.0


def test_derive_memory_insight_high_performance():
    post_info = {
        "id": "post-123",
        "topic": "Agent Memory Architecture",
        "hook_style": "contrarian",
    }
    metrics = {
        "impressions": 10000,
        "likes": 500,
        "replies": 80,
        "shares": 60,
    }
    # (500*1 + 80*2.5 + 60*3.5)/10000 * 100 = (500 + 200 + 210)/10000 * 100 = 9.1%
    score = 9.10

    insight = derive_memory_insight(post_info, metrics, score)
    assert insight is not None
    assert insight["category"] == "hook_rule"
    assert insight["confidence_score"] >= 0.85
    assert "contrarian" in insight["insight_text"]
    assert "Agent Memory Architecture" in insight["insight_text"]


def test_derive_memory_insight_low_performance():
    post_info = {
        "id": "post-456",
        "topic": "Vague Predictions",
        "hook_style": "passive_question",
    }
    metrics = {
        "impressions": 10000,
        "likes": 10,
        "replies": 1,
        "shares": 0,
    }
    score = 0.13

    insight = derive_memory_insight(post_info, metrics, score)
    assert insight is not None
    assert insight["category"] in ("timing_rule", "audience_pain_point", "hook_rule")
    assert "passive_question" in insight["insight_text"]
    assert insight["confidence_score"] >= 0.70
