"""
Diagnostics Router: Handles creator audits and statistical anomaly reports.
Bridges Person 1's AI Diagnostic Brain into Person 2's FastAPI layer.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.models.post import Post
from app.models.analytics import PostAnalytics
try:
    from app.core.schemas import RawPost, CreatorAuditReport
    from app.core.diagnostics_agent import run_creator_audit
except ImportError:
    from backend.app.core.schemas import RawPost, CreatorAuditReport
    from backend.app.core.diagnostics_agent import run_creator_audit

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


@router.post(
    "/audit",
    response_model=CreatorAuditReport,
    status_code=status.HTTP_200_OK,
    summary="Run AI Diagnostic Audit on a creator's posts",
)
async def post_creator_audit(
    creator_handle: str = "creator",
    posts: Optional[List[RawPost]] = None,
):
    if not posts:
        # Default high-signal test dataset
        posts = [
            RawPost(
                post_id="p1",
                media_type="REELS",
                caption="Stop using basic for loops in Python! Here are 3 cleaner ways to write list comprehensions...",
                views_or_reach=45000,
                likes=1800,
                comments=95,
                shares=1200,
                saves=2400,
                posted_hour_utc=14,
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
                posted_hour_utc=4,
            ),
            RawPost(
                post_id="p3",
                media_type="CAROUSEL_ALBUM",
                caption="Full breakdown: How Redis caching actually works under the hood (Diagram slide by slide)",
                views_or_reach=28000,
                likes=950,
                comments=45,
                shares=620,
                saves=1850,
                posted_hour_utc=15,
            ),
        ]
    return run_creator_audit(creator_handle=creator_handle, posts=posts)


@router.get(
    "/audit",
    response_model=CreatorAuditReport,
    status_code=status.HTTP_200_OK,
    summary="Run diagnostic audit on database posts",
)
async def get_creator_audit(
    brand_name: str = "DevRelay",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post, PostAnalytics)
        .join(PostAnalytics, Post.id == PostAnalytics.post_id, isouter=True)
        .limit(10)
    )
    rows = result.all()
    raw_posts = []
    for post, analytics in rows:
        impressions = analytics.impressions if analytics else 10000
        likes = analytics.likes if analytics else 300
        replies = analytics.replies if analytics else 50
        shares = analytics.shares if analytics else 120
        caption_text = post.content or getattr(post, "body", None) or getattr(post, "full_text", None) or post.topic or "Engineering architecture post"
        raw_posts.append(
            RawPost(
                post_id=post.id,
                media_type="REELS" if post.hook_style == "contrarian" else "CAROUSEL_ALBUM",
                caption=caption_text,
                views_or_reach=impressions,
                likes=likes,
                comments=replies,
                shares=shares,
                saves=int(shares * 1.5),
                posted_hour_utc=14,
            )
        )
    if not raw_posts:
        return await post_creator_audit(creator_handle=brand_name)
    return run_creator_audit(creator_handle=brand_name, posts=raw_posts)
