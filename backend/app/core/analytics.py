"""
Pure statistical analytics and outlier detection engine for Person 1.
Computes true engagement rates, virality indices, utility indices, and cluster groupings.
No LLM calls - pure deterministic math.
"""

from typing import Any, Dict, List
import numpy as np

from .schemas import RawPost


def compute_true_engagement_rate(likes: int, comments: int, shares: int, saves: int, reach: int) -> float:
    """
    True Engagement Rate (ER):
    ER = (Likes + Comments + Shares + Saves) / Reach * 100
    """
    base = max(reach, 1)
    return round(((likes + comments + shares + saves) / base) * 100.0, 2)


def compute_virality_index(shares: int, reach: int) -> float:
    """
    Virality Index (VI):
    VI = Shares / Reach * 100
    """
    base = max(reach, 1)
    return round((shares / base) * 100.0, 2)


def compute_utility_index(saves: int, reach: int) -> float:
    """
    Utility / Value Index (UI):
    UI = Saves / Reach * 100
    """
    base = max(reach, 1)
    return round((saves / base) * 100.0, 2)


def compute_post_statistics(posts: List[RawPost]) -> Dict[str, Any]:
    """
    Step 1 & Step 3: Calculates engagement baselines, identifies statistical outliers,
    and computes cluster aggregates across media types and posting hours.
    """
    if not posts:
        return {
            "median_er": 0.0,
            "median_vi": 0.0,
            "median_ui": 0.0,
            "enriched_posts": [],
            "format_clusters": {},
            "top_performing_format": "REELS",
        }

    engagement_rates: List[float] = []
    shares_ratios: List[float] = []
    saves_ratios: List[float] = []

    for p in posts:
        base = max(p.views_or_reach, 1)
        er = ((p.likes + p.comments + p.shares + p.saves) / base) * 100.0
        vi = (p.shares / base) * 100.0
        ui = (p.saves / base) * 100.0

        engagement_rates.append(er)
        shares_ratios.append(vi)
        saves_ratios.append(ui)

    median_er = float(np.median(engagement_rates))
    median_vi = float(np.median(shares_ratios))
    median_ui = float(np.median(saves_ratios))

    # Top 20% and Bottom 20% thresholds
    p80_er = float(np.percentile(engagement_rates, 80)) if len(engagement_rates) > 1 else engagement_rates[0]
    p20_er = float(np.percentile(engagement_rates, 20)) if len(engagement_rates) > 1 else engagement_rates[0]
    p80_vi = float(np.percentile(shares_ratios, 80)) if len(shares_ratios) > 1 else shares_ratios[0]
    p20_vi = float(np.percentile(shares_ratios, 20)) if len(shares_ratios) > 1 else shares_ratios[0]

    enriched_posts: List[Dict[str, Any]] = []
    format_stats: Dict[str, List[float]] = {}

    for i, p in enumerate(posts):
        er = engagement_rates[i]
        vi = shares_ratios[i]
        ui = saves_ratios[i]

        status = "normal"
        if er >= p80_er or vi >= p80_vi:
            status = "top_performer"
        elif er <= p20_er or vi <= p20_vi:
            status = "underperformer"

        enriched = {
            "post_id": p.post_id,
            "media_type": p.media_type,
            "caption": p.caption[:250],
            "reach": p.views_or_reach,
            "likes": p.likes,
            "comments": p.comments,
            "shares": p.shares,
            "saves": p.saves,
            "engagement_rate": round(er, 2),
            "share_ratio": round(vi, 2),
            "save_ratio": round(ui, 2),
            "status": status,
            "hour": p.posted_hour_utc,
        }
        enriched_posts.append(enriched)

        if p.media_type not in format_stats:
            format_stats[p.media_type] = []
        format_stats[p.media_type].append(er)

    # Calculate format cluster performance
    format_clusters = {}
    top_format = "REELS"
    max_median_format_er = -1.0

    for fmt, ers in format_stats.items():
        med = float(np.median(ers))
        format_clusters[fmt] = {
            "post_count": len(ers),
            "median_er": round(med, 2),
        }
        if med > max_median_format_er:
            max_median_format_er = med
            top_format = fmt

    return {
        "median_er": round(median_er, 2),
        "median_vi": round(median_vi, 2),
        "median_ui": round(median_ui, 2),
        "p80_er": round(p80_er, 2),
        "p20_er": round(p20_er, 2),
        "enriched_posts": enriched_posts,
        "format_clusters": format_clusters,
        "top_performing_format": top_format,
    }
