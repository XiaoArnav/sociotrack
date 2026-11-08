"""
Tests for Data Provenance, Metric Integrity, and CORS Configuration:
- Verifies RawPost metric provenance metadata structure ('Verified', 'Retrieved', 'Demo data').
- Verifies InstagramCrawlResult carries provenance_badge, data_freshness, and collection timestamp.
- Verifies CreatorAuditReport derives correct badge from underlying post sources.
- Verifies CORS settings eliminate insecure wildcard (*) with credentials.
"""
import pytest
from app.config import settings
from app.core.schemas import RawPost, CreatorAuditReport
from app.core.diagnostics_agent import run_creator_audit
from app.services.instagram_crawler import _get_benchmark_fallback


def test_cors_security_configuration():
    """Verify CORS configuration does not allow wildcard (*) with credentials."""
    assert "*" not in settings.CORS_ORIGINS
    assert "https://frontend-taupe-zeta-84.vercel.app" in settings.CORS_ORIGINS
    assert settings.CORS_ORIGIN_REGEX == r"https://.*\.vercel\.app"


def test_benchmark_data_provenance():
    """Verify that benchmark fallback explicitly tags data as Demo data, never masquerading as verified live telemetry."""
    res = _get_benchmark_fallback("arbitrary_creator")
    assert res.provenance_badge == "Demo data"
    assert "Benchmark Baseline" in res.data_freshness
    assert len(res.posts) > 0
    for p in res.posts:
        assert p.provenance["likes"] == "Demo data"
        assert p.provenance["shares"] == "Demo data"
        assert p.provenance["saves"] == "Demo data"


def test_creator_audit_report_provenance():
    """Verify that run_creator_audit reflects the correct provenance badge and data source."""
    # Test with demo posts
    demo_posts = [
        RawPost(
            post_id="p_demo",
            media_type="REELS",
            caption="Demo architectural post",
            views_or_reach=10000,
            likes=400,
            comments=20,
            shares=50,
            saves=120,
            provenance={
                "likes": "Demo data",
                "comments": "Demo data",
                "shares": "Demo data",
                "saves": "Demo data",
                "views_or_reach": "Demo data",
            },
        )
    ]
    report_demo = run_creator_audit(creator_handle="test_demo", posts=demo_posts)
    assert report_demo.provenance_badge == "Demo data"
    assert "Benchmark" in report_demo.data_source

    # Test with verified posts
    verified_posts = [
        RawPost(
            post_id="p_verified",
            media_type="REELS",
            caption="Verified API post",
            views_or_reach=20000,
            likes=800,
            comments=45,
            shares=120,
            saves=250,
            provenance={
                "likes": "Verified",
                "comments": "Verified",
                "shares": "Estimated",
                "saves": "Estimated",
                "views_or_reach": "Estimated",
            },
        )
    ]
    report_verified = run_creator_audit(creator_handle="test_verified", posts=verified_posts)
    assert report_verified.provenance_badge == "Verified"
