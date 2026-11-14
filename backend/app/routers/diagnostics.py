"""
Diagnostics Router: Handles creator audits and statistical anomaly reports.
Bridges Person 1's AI Diagnostic Brain into Person 2's FastAPI layer.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.models.post import Post
from app.models.analytics import PostAnalytics
from app.routers.auth import get_optional_current_user
from app.schemas.auth import UserResponse
from app.services.authorization_service import sanitize_handle, verify_brand_access
try:
    from app.core.schemas import RawPost, CreatorAuditReport, ContentPredictionReport
    from app.core.diagnostics_agent import run_creator_audit
    from app.services.instagram_crawler import fetch_creator_posts, InstagramCrawlResult
    from app.services.content_predictor import predict_winning_content
except ImportError:
    from backend.app.core.schemas import RawPost, CreatorAuditReport, ContentPredictionReport
    from backend.app.core.diagnostics_agent import run_creator_audit
    from backend.app.services.instagram_crawler import fetch_creator_posts, InstagramCrawlResult
    from backend.app.services.content_predictor import predict_winning_content

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


class PredictContentRequest(BaseModel):
    """Payload to trigger Instagram crawl and AI content prediction."""
    creator_handle: str = Field(default="arnav.patel07", description="Instagram creator @handle")
    niche_or_topic: Optional[str] = Field(default="Tech & AI Architecture", description="Target niche or topic focus")
    max_posts: int = Field(default=10, ge=1, le=50, description="Max posts to crawl from Instagram")
    posts: Optional[List[RawPost]] = Field(default=None, description="Optional verified real posts provided directly")


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
    clean_handle = sanitize_handle(creator_handle) if creator_handle else "creator"
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
    return run_creator_audit(creator_handle=clean_handle, posts=posts)


@router.get(
    "/audit",
    response_model=CreatorAuditReport,
    status_code=status.HTTP_200_OK,
    summary="Run diagnostic audit on database posts",
)
async def get_creator_audit(
    brand_name: str = "DevRelay",
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    clean_brand = sanitize_handle(brand_name) if brand_name else "DevRelay"
    brand_res = await db.execute(select(Brand).where(Brand.name.ilike(clean_brand)))
    brand = brand_res.scalar_one_or_none()

    if brand:
        if brand.user_id or brand.workspace_id:
            await verify_brand_access(db, brand.id, current_user, min_role="viewer")

        result = await db.execute(
            select(Post, PostAnalytics)
            .join(PostAnalytics, Post.id == PostAnalytics.post_id, isouter=True)
            .where(Post.brand_id == brand.id)
            .limit(10)
        )
        rows = result.all()
    else:
        rows = []

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
    creator_display_name = brand.name if brand else clean_brand
    if not raw_posts:
        return await post_creator_audit(creator_handle=creator_display_name)
    return run_creator_audit(creator_handle=creator_display_name, posts=raw_posts)


@router.post(
    "/predict-content",
    response_model=ContentPredictionReport,
    status_code=status.HTTP_200_OK,
    summary="Crawl Instagram creator & predict winning content formats, hooks, and concepts",
)
async def post_predict_content(body: PredictContentRequest):
    """
    Crawls the specified Instagram creator handle (via real session cookie, Meta Graph API,
    RapidAPI, public web probe, or verified posts), calculates algorithmic ratios,
    and runs Gemini 3.8/3.0 Flash to predict winning content.
    """
    clean_handle = sanitize_handle(body.creator_handle)
    if body.posts and len(body.posts) > 0:
        return await predict_winning_content(
            creator_handle=clean_handle,
            posts=body.posts,
            niche=body.niche_or_topic,
            data_source="creator_verified_posts",
        )

    crawl_result = await fetch_creator_posts(
        creator_handle=clean_handle,
        max_posts=body.max_posts,
    )
    return await predict_winning_content(
        creator_handle=crawl_result.handle,
        posts=crawl_result.posts,
        niche=body.niche_or_topic,
        data_source=crawl_result.source,
    )


@router.get(
    "/instagram/{handle}/predict",
    response_model=ContentPredictionReport,
    status_code=status.HTTP_200_OK,
    summary="Crawl Instagram creator by handle & predict winning content",
)
async def get_instagram_predict(
    handle: str,
    niche: Optional[str] = None,
    max_posts: int = 10,
):
    """Convenience GET endpoint to crawl any Instagram handle and predict content."""
    clean_handle = sanitize_handle(handle)
    crawl_result = await fetch_creator_posts(creator_handle=clean_handle, max_posts=max_posts)
    return await predict_winning_content(
        creator_handle=crawl_result.handle,
        posts=crawl_result.posts,
        niche=niche,
        data_source=crawl_result.source,
    )


@router.get(
    "/instagram/{handle}/posts",
    status_code=status.HTTP_200_OK,
    summary="Crawl and retrieve raw posts and metrics for an Instagram handle",
)
async def get_instagram_crawled_posts(
    handle: str,
    max_posts: int = 10,
):
    """Returns raw crawled Instagram profile and post data."""
    clean_handle = sanitize_handle(handle)
    return await fetch_creator_posts(creator_handle=clean_handle, max_posts=max_posts)

