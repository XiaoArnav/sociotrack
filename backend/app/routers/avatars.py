"""
Avatar Streaming Proxy & Background Cache-Warming Router for SocioTrack.
Implements the Stale-While-Revalidate (SWR) hybrid caching pattern:
- Serves avatars in 0ms from disk cache.
- Silently revalidates and refreshes avatars older than 24 hours in the background.
- Eliminates Instagram CDN HMAC token expiration and 403 Forbidden errors.
"""

import os
import io
import time
import hashlib
import asyncio
import httpx
from PIL import Image
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Response
from fastapi.responses import FileResponse, RedirectResponse

router = APIRouter(prefix="/creators", tags=["Avatars"])

# Static storage paths
AVATARS_DIR = Path(__file__).resolve().parent.parent / "static" / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# Cache TTL: 24 hours in seconds
CACHE_TTL_SECONDS = 86400

# Known generic/placeholder image hashes to reject
KNOWN_PLACEHOLDER_HASHES = {
    "772aa709423494dba2e436c8df1fe643",  # Twitter generic silhouette
    "d41d8cd98f00b204e9800998ecf8427e",  # Empty file
}

# Protected presets with authentic crops that should not be replaced by low-res/fallback cards
PRESET_HANDLES = {
    "arnav.patel07",
    "arnavpatel07",
    "techno_gamerz",
    "technogamerz",
    "aviralbhardwaj_ji",
    "aviralbhardwajji",
    "lalalalisa_m",
    "sooyaaa__",
    "thv",
    "mnijungkook",
    "j.m",
    "uarmyhope",
    "chenzheyuanisssme",
    "rkive",
    "itsjvke",
    "tomi.timetraveler",
    "tomitimetraveler",
    "moretomihika",
}


def is_valid_square_avatar(data: bytes, is_preset: bool = False) -> bool:
    """Validates that bytes represent a genuine square avatar, rejecting banners and generic placeholders."""
    if len(data) < 2000:
        return False

    md5 = hashlib.md5(data).hexdigest()
    if md5 in KNOWN_PLACEHOLDER_HASHES:
        return False

    # If it's a protected preset, require higher fidelity (>10KB) to ensure we don't downgrade the authentic crop
    if is_preset and len(data) < 10000:
        return False

    try:
        im = Image.open(io.BytesIO(data))
        w, h = im.size
        # Must be roughly square (within 12%)
        if abs(w - h) > max(w, h) * 0.12:
            return False
        # Reject OpenGraph preview cards (typically 1200x630)
        if w > 1000 and h < 700:
            return False
        return True
    except Exception:
        return False


async def _download_and_save_avatar(handle: str) -> bool:
    """Fetches real-time profile picture directly from Instagram and saves to disk cache."""
    import re
    import html

    clean_handle = handle.lower().strip().lstrip("@")
    target_file = AVATARS_DIR / f"{clean_handle}.png"
    fe_file = (
        Path(__file__).resolve().parent.parent.parent
        / "frontend"
        / "public"
        / "avatars"
        / f"{clean_handle}.png"
    )

    # 1. Primary: Direct Instagram OpenGraph profile picture scraper
    insta_url = f"https://www.instagram.com/{clean_handle}/"
    insta_headers = {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(insta_url, headers=insta_headers)
            if resp.status_code == 200:
                match = re.search(
                    r'<meta\s+property="og:image"\s+content="([^"]+)"', resp.text
                )
                if match:
                    img_url = html.unescape(match.group(1))
                    img_resp = await client.get(
                        img_url, headers={"User-Agent": "Mozilla/5.0"}
                    )
                    if (
                        img_resp.status_code == 200
                        and len(img_resp.content) > 1000
                    ):
                        im = Image.open(io.BytesIO(img_resp.content))
                        im_resized = im.resize(
                            (320, 320), Image.Resampling.LANCZOS
                        )
                        im_resized.save(str(target_file), "PNG")
                        if fe_file.parent.exists():
                            im_resized.save(str(fe_file), "PNG")
                        return True
    except Exception:
        pass

    # 2. Secondary fallback: unavatar
    candidates = [
        f"https://unavatar.io/x/{clean_handle}",
        f"https://unavatar.io/youtube/{clean_handle}",
        f"https://unavatar.io/github/{clean_handle}",
    ]

    async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
        for url in candidates:
            try:
                resp = await client.get(
                    url, headers={"User-Agent": "Mozilla/5.0"}
                )
                if resp.status_code == 200 and is_valid_square_avatar(
                    resp.content, is_preset=False
                ):
                    im = Image.open(io.BytesIO(resp.content))
                    im_resized = im.resize(
                        (320, 320), Image.Resampling.LANCZOS
                    )
                    im_resized.save(str(target_file), "PNG")
                    if fe_file.parent.exists():
                        im_resized.save(str(fe_file), "PNG")
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
