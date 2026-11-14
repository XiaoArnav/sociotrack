"""
SocioTrack Agent & Memory Standalone Test Runner.
Executes both unit test assertions and live creator diagnostic audit.
Usage:
    python test_agent.py
"""
import sys
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
backend_dir = os.path.join(ROOT_DIR, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.tests.test_agent import TestPerson1Agent
from backend.app.core.schemas import RawPost
from backend.app.core.diagnostics_agent import run_creator_audit

if __name__ == "__main__":
    print("=" * 60)
    print("Running SocioTrack Agent Diagnostic Brain...")
    mock_posts = [
        RawPost(
            post_id="p1",
            media_type="REELS",
            caption="Stop using basic for loops in Python! Here are 3 cleaner ways to write list comprehensions...",
            views_or_reach=45000,
            likes=1800,
            comments=95,
            shares=1200,
            saves=2400,
            posted_hour_utc=15,
        ),
        RawPost(
            post_id="p2",
            media_type="CAROUSEL_ALBUM",
            caption="System Design 101: How to build a high-throughput message queue using Redis streams...",
            views_or_reach=28000,
            likes=950,
            comments=140,
            shares=420,
            saves=1900,
            posted_hour_utc=18,
        ),
        RawPost(
            post_id="p3",
            media_type="IMAGE",
            caption="Happy Monday! Remember to drink water and take breaks while coding today. Let's get it!",
            views_or_reach=12000,
            likes=310,
            comments=12,
            shares=8,
            saves=0,
            posted_hour_utc=9,
        ),
    ]

    report = run_creator_audit(creator_handle="@dev_dan", posts=mock_posts)
    print(f"\n[AUDIT COMPLETE] Health Score: {report.health_score}/100")
    print(f"Top Format: {report.top_performing_format}")
    print(f"Median Engagement Rate: {report.median_engagement_rate:.2f}%\n")
    print("--- WHAT IS WORKING ---")
    for pattern in report.whats_working:
        print(f"+ {pattern.pattern_title}: {pattern.metric_evidence}")
    print("\n--- WHAT IS FAILING ---")
    for pattern in report.whats_failing:
        print(f"- {pattern.pattern_title}: {pattern.metric_evidence}")
    print("=" * 60)
    print("\nRunning Person 1 Test Suite...")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPerson1Agent)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
