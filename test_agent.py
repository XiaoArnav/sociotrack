"""
Person 1's Self-Testing Script: AI Diagnostic Brain.
Run directly via:
    python test_agent.py
"""

import sys
import os

# Support direct imports as shown in Person 1 spec
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend/app/core")))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from schemas import RawPost
    from diagnostics_agent import run_creator_audit
except ImportError:
    from backend.app.core.schemas import RawPost
    from backend.app.core.diagnostics_agent import run_creator_audit


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
        posted_hour_utc=14
    ),
    RawPost(
        post_id="p2",
        media_type="IMAGE",
        caption="Happy Monday everyone! Remember to drink water and code hard today! #motivation #tech",
        views_or_reach=3200,
        likes=80,
        comments=4,
        shares=1,
        saves=3,
        posted_hour_utc=4
    ),
    RawPost(
        post_id="p3",
        media_type="CAROUSEL_ALBUM",
        caption="Full breakdown: How Redis caching actually works under the hood (Diagram slide by slide)",
        views_or_reach=28000,
        likes=950,
        comments=60,
        shares=400,
        saves=1900,
        posted_hour_utc=15
    )
]

print("Running Diagnostic Audit...")
report = run_creator_audit(creator_handle="@dev_dan", posts=mock_posts)
print(f"\n[AUDIT COMPLETE] Health Score: {report.health_score}/100")
print(f"Top Format: {report.top_performing_format}")
print(f"Median Engagement Rate: {report.median_engagement_rate}%")

print("\n--- WHAT IS WORKING ---")
for w in report.whats_working:
    print(f"+ {w.pattern_title}: {w.metric_evidence}")
    print(f"  Reason: {w.why_it_happened}")
    print(f"  Recommendation: {w.actionable_recommendation}")

print("\n--- WHAT IS FAILING ---")
for f in report.whats_failing:
    print(f"- {f.pattern_title}: {f.metric_evidence}")
    print(f"  Reason: {f.why_it_happened}")
    print(f"  Recommendation: {f.actionable_recommendation}")

print("\n--- IMMEDIATE NEXT STEPS ---")
for step in report.immediate_next_steps:
    print(f"> {step}")
