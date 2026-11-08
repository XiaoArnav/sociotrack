#!/usr/bin/env python3
"""
SocioTrack Automated Creator Profile Picture Sync Script.
Runs on daily schedule via GitHub Actions or locally.
Verifies and refreshes profile pictures for all preset showcase creators.
"""

import os
import io
import hashlib
import urllib.request
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_AVATARS_DIR = ROOT_DIR / "frontend" / "public" / "avatars"
BACKEND_AVATARS_DIR = ROOT_DIR / "backend" / "app" / "static" / "avatars"

FRONTEND_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
BACKEND_AVATARS_DIR.mkdir(parents=True, exist_ok=True)

HANDLES = [
    "arnav.patel07",
    "techno_gamerz",
    "aviralbhardwaj_ji",
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
    "moretomihika",
]


# Known generic/placeholder image hashes to reject
KNOWN_PLACEHOLDER_HASHES = {
    "772aa709423494dba2e436c8df1fe643",  # Twitter generic silhouette
    "d41d8cd98f00b204e9800998ecf8427e",  # Empty file
}


def get_file_hash(filepath: Path) -> str:
    if not filepath.exists():
        return ""
    return hashlib.md5(filepath.read_bytes()).hexdigest()


def is_valid_square_avatar(data: bytes, is_preset: bool = True) -> bool:
    """Validates that bytes represent a genuine square avatar, rejecting banners and generic placeholders."""
    if len(data) < 2000:
        return False

    md5 = hashlib.md5(data).hexdigest()
    if md5 in KNOWN_PLACEHOLDER_HASHES:
        return False

    # For presets with authentic crops, require higher fidelity (>10KB) so we don't downgrade
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


def fetch_avatar_bytes(handle: str) -> bytes:
    """Attempts to fetch authentic avatar bytes."""
    clean = handle.lower().strip().lstrip("@")
    urls = [
        f"https://unavatar.io/x/{clean}",
        f"https://unavatar.io/youtube/{clean}",
        f"https://unavatar.io/github/{clean}",
    ]
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.instagram.com/",
    }

    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = resp.read()
                    if is_valid_square_avatar(data, is_preset=True):
                        return data
        except Exception:
            continue
    return b""


import sys

PRESET_HANDLES = set(HANDLES) | {"arnavpatel07"}


def main():
    force_presets = "--force-presets" in sys.argv
    cli_handles = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    target_handles = cli_handles if cli_handles else HANDLES

    print("--- SocioTrack Automated Creator Avatar Sync ---")
    if force_presets:
        print("[MODE] Force presets enabled: authentic showcase PFPs may be overwritten if new remote PFP detected.")
    else:
        print("[MODE] Preset protection active: authentic showcase crops will be preserved.")

    updated_count = 0

    for handle in target_handles:
        fe_file = FRONTEND_AVATARS_DIR / f"{handle}.png"
        be_file = BACKEND_AVATARS_DIR / f"{handle}.png"

        # If it's a preset and already exists, preserve authentic crop unless force requested
        if handle in PRESET_HANDLES and fe_file.exists() and not force_presets:
            print(f"[PRESET PRESERVED] @{handle}: Authentic Instagram showcase crop preserved.")
            continue

        # Check existing hash
        old_hash = get_file_hash(fe_file)

        # Fetch live avatar
        new_bytes = fetch_avatar_bytes(handle)
        if not new_bytes:
            print(f"[SKIP] @{handle}: No remote update found, retaining existing.")
            continue

        new_hash = hashlib.md5(new_bytes).hexdigest()
        if new_hash != old_hash:
            fe_file.write_bytes(new_bytes)
            be_file.write_bytes(new_bytes)
            print(f"[UPDATED] @{handle} -> New PFP saved ({len(new_bytes)} bytes)")
            updated_count += 1
        else:
            print(f"[CURRENT] @{handle} -> PFP is already up to date.")

    # Also sync arnavpatel07 and aviralbhardwajji aliases
    src = FRONTEND_AVATARS_DIR / "arnav.patel07.png"
    if src.exists():
        (FRONTEND_AVATARS_DIR / "arnavpatel07.png").write_bytes(src.read_bytes())
        (BACKEND_AVATARS_DIR / "arnavpatel07.png").write_bytes(src.read_bytes())

    src_aviral = FRONTEND_AVATARS_DIR / "aviralbhardwaj_ji.png"
    if src_aviral.exists():
        (FRONTEND_AVATARS_DIR / "aviralbhardwajji.png").write_bytes(src_aviral.read_bytes())
        (BACKEND_AVATARS_DIR / "aviralbhardwajji.png").write_bytes(src_aviral.read_bytes())

    print(f"\nCompleted sync. Total updated: {updated_count}")
    return 0


if __name__ == "__main__":
    exit(main())
