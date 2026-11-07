"""
Engagement Scoring Engine & Memory Insight Derivation Service.

Calculates weighted social media engagement metrics and automatically
derives actionable insights for Hindsight agent memory retainment.
"""
from typing import Any, Dict, Optional


def calculate_engagement_score(
    impressions: int,
    likes: int,
    replies: int,
    shares: int,
) -> float:
    """
    Computes a normalized engagement score (as a percentage 0.0 - 100.0+).
    
    Weights reflect intent and virality on developer/professional networks:
    - Likes: 1.0 (lightweight approval)
    - Replies: 2.5 (active discourse, community engagement)
    - Shares: 3.5 (high endorsement, network amplification)
    """
    if impressions <= 0:
        return 0.0

    weighted_engagements = (
        (likes * 1.0) +
        (replies * 2.5) +
        (shares * 3.5)
    )

    score = (weighted_engagements / impressions) * 100.0
    return round(score, 2)


def derive_memory_insight(
    post_info: Dict[str, Any],
    metrics: Dict[str, int],
    engagement_score: float,
) -> Optional[Dict[str, Any]]:
    """
    Evaluates post performance against empirical benchmarks and derives
    structured insights for the brand's Hindsight memory bank.
    
    Categories:
    - 'hook_rule': Actionable guidance on hook syntax and opening structures.
    - 'timing_rule': Performance signals linked to delivery timing or pacing.
    - 'audience_pain_point': Uncovered audience friction or interest topics.
    """
    hook_style = post_info.get("hook_style") or "general"
    topic = post_info.get("topic") or "General"
    likes = metrics.get("likes", 0)
    replies = metrics.get("replies", 0)
    shares = metrics.get("shares", 0)

    # High engagement threshold (> 4.5%)
    if engagement_score >= 4.5:
        confidence = min(0.96, round(0.82 + (engagement_score / 150.0), 3))
        insight_text = (
            f"High-performing hook style '{hook_style}' resonated strongly on topic '{topic}' "
            f"yielding a {engagement_score}% engagement score ({likes} likes, {replies} replies, {shares} shares). "
            f"Audience demonstrated high interest in concrete architecture and real-world results."
        )
        return {
            "category": "hook_rule",
            "confidence_score": confidence,
            "insight_text": insight_text,
        }
    
    # Moderate engagement (2.0% - 4.5%)
    elif engagement_score >= 2.0:
        confidence = 0.80
        insight_text = (
            f"Hook style '{hook_style}' on topic '{topic}' performed at baseline with {engagement_score}% engagement. "
            f"Consider pairing with stronger numerical proof points to increase share volume."
        )
        return {
            "category": "hook_rule",
            "confidence_score": confidence,
            "insight_text": insight_text,
        }

    # Low engagement (< 2.0%)
    else:
        confidence = 0.76
        insight_text = (
            f"Hook style '{hook_style}' on topic '{topic}' underperformed ({engagement_score}% engagement score). "
            f"Audience showed low interaction. Pivot away from passive phrasing toward urgent audience pain points."
        )
        return {
            "category": "audience_pain_point",
            "confidence_score": confidence,
            "insight_text": insight_text,
        }
