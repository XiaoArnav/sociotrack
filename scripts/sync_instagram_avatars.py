#!/usr/bin/env python3
"""
SocioTrack Automated Creator Profile Picture Sync Script.
Runs on daily schedule via GitHub Actions or locally.
Verifies and refreshes profile pictures for all preset showcase creators.
"""

import os
import hashlib
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_AVATARS_DIR = ROOT_DIR / "frontend" / "public" / "avatars"
BACKEND_AVATARS_DIR = ROOT_DIR / "backend" / "app" / "static" / "avatars"

FRONTEND_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
BACKEND_AVATARS_DIR.mkdir(parents=True, exist_ok=True)

HANDLES = [
    "arnav.patel07",
    "techno_gamerz",
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


def get_file_hash(filepath: Path) -> str:
    if not filepath.exists():
        return ""
    return hashlib.md5(filepath.read_bytes()).hexdigest()


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
                    if len(data) > 1000:
                        return data
        except Exception:
            continue
    return b""


def main():
    print("--- SocioTrack Automated Creator Avatar Sync ---")
    updated_count = 0

    for handle in HANDLES:
        fe_file = FRONTEND_AVATARS_DIR / f"{handle}.png"
        be_file = BACKEND_AVATARS_DIR / f"{handle}.png"

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

    # Also sync arnavpatel07 alias
    src = FRONTEND_AVATARS_DIR / "arnav.patel07.png"
    if src.exists():
        (FRONTEND_AVATARS_DIR / "arnavpatel07.png").write_bytes(src.read_bytes())
        (BACKEND_AVATARS_DIR / "arnavpatel07.png").write_bytes(src.read_bytes())

    print(f"\nCompleted sync. Total updated: {updated_count}")
    return 0


if __name__ == "__main__":
    exit(main())
