"""
In-Memory Sliding Window Rate Limiter for Authentication Endpoints.
Protects against credential stuffing, brute force attacks, and spam registrations.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Tuple, Optional
from fastapi import HTTPException, status, Request
import threading


class SlidingWindowRateLimiter:
    """Thread-safe sliding window rate limiter."""

    def __init__(self):
        # Maps key -> list of attempt timestamps (datetime)
        self._attempts: Dict[str, List[datetime]] = {}
        self._lock = threading.Lock()

    def check_rate_limit(
        self,
        key: str,
        max_attempts: int,
        window_seconds: int,
        error_message: str = "Too many requests. Please wait before trying again.",
    ) -> None:
        """
        Asserts that the key has not exceeded max_attempts within window_seconds.
        Raises 429 Too Many Requests if limit is breached.
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=window_seconds)

        with self._lock:
            if key not in self._attempts:
                self._attempts[key] = []

            # Filter out timestamps older than the sliding window cutoff
            self._attempts[key] = [ts for ts in self._attempts[key] if ts > cutoff]

            if len(self._attempts[key]) >= max_attempts:
                retry_after = int((self._attempts[key][0] + timedelta(seconds=window_seconds) - now).total_seconds()) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=error_message,
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            # Record this attempt
            self._attempts[key].append(now)

    def reset(self, key: str) -> None:
        """Resets attempt history for a key upon successful authentication."""
        with self._lock:
            if key in self._attempts:
                del self._attempts[key]

    def clear(self) -> None:
        """Clears all rate limit state (used in testing)."""
        with self._lock:
            self._attempts.clear()


# Global singleton instance
auth_rate_limiter = SlidingWindowRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extracts client IP from proxy headers or direct client connection."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"
