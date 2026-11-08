"""
Avatar Streaming Proxy & Background Cache-Warming Router for SocioTrack.
Implements the Stale-While-Revalidate (SWR) hybrid caching pattern:
- Serves avatars in 0ms from disk cache.
- Silently revalidates and refreshes avatars older than 24 hours in the background.
- Eliminates Instagram CDN HMAC token expiration and 403 Forbidden errors.
"""

import os
import time
import asyncio
import httpx
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Response
from fastapi.responses import FileResponse, RedirectResponse

router = APIRouter(prefix="/creators", tags=["Avatars"])

# Static storage paths
AVATARS_DIR = Path(__file__).resolve().parent.parent / "static" / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# Cache TTL: 24 hours in seconds
CACHE_TTL_SECONDS = 86400


async def _download_and_save_avatar(handle: str) -> bool:
    """Fetches real-time profile picture and saves to disk cache."""
    clean_handle = handle.lower().strip().lstrip("@")
    target_file = AVATARS_DIR / f"{clean_handle}.png"

    # Candidate URLs to resolve live avatar
    candidates = [
        f"https://unavatar.io/x/{clean_handle}",
        f"https://unavatar.io/youtube/{clean_handle}",
        f"https://unavatar.io/github/{clean_handle}",
    ]

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.instagram.com/",
    }

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for url in candidates:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and len(resp.content) > 500:
                    # Valid image bytes received
                    target_file.write_bytes(resp.content)
                    return True
            except Exception:
                continue

    return False


@router.get("/{handle}/avatar", summary="Stream creator avatar with automated SWR background cache warming")
@router.head("/{handle}/avatar", include_in_schema=False)
async def get_creator_avatar(handle: str, background_tasks: BackgroundTasks):
    clean_handle = handle.lower().strip().lstrip("@")
    target_file = AVATARS_DIR / f"{clean_handle}.png"

    # Check for dot variation (e.g. arnavpatel07 vs arnav.patel07)
    if not target_file.exists():
        nodot_file = AVATARS_DIR / f"{clean_handle.replace('.', '')}.png"
        if nodot_file.exists():
            target_file = nodot_file

    if target_file.exists():
        file_age = time.time() - os.path.getmtime(target_file)
        # If cache is older than 24h, trigger background revalidation
        if file_age > CACHE_TTL_SECONDS:
            background_tasks.add_task(_download_and_save_avatar, clean_handle)

        return FileResponse(
            str(target_file),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "X-Avatar-Cache": "HIT" if file_age <= CACHE_TTL_SECONDS else "STALE-REVALIDATING",
            },
        )

    # Cache MISS: attempt to fetch immediately
    success = await _download_and_save_avatar(clean_handle)
    if success and target_file.exists():
        return FileResponse(
            str(target_file),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=86400",
                "X-Avatar-Cache": "MISS-FETCHED",
            },
        )

    # Fallback to initials SVG
    fallback_url = f"https://api.dicebear.com/7.x/initials/svg?seed={clean_handle}"
    return RedirectResponse(url=fallback_url, status_code=307)
