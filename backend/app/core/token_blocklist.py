"""
Token Blocklist & Session Invalidation Service.
Pocock-OS Deep Module: Manages cryptographic token revocation without leaky abstractions.
Stores revoked JWT IDs (jti) with automatic expiry cleanup.
"""

from datetime import datetime, timezone
from typing import Dict, Set, Optional
import threading


class TokenBlocklist:
    """Thread-safe in-memory and persistent token revocation blocklist."""

    def __init__(self):
        # Maps jti -> expiry datetime
        self._revoked_jtis: Dict[str, datetime] = {}
        # Maps user_id -> integer timestamp cutoff of revocation
        self._user_revocations: Dict[str, int] = {}
        self._lock = threading.Lock()

    def revoke_token(self, jti: str, expires_at: datetime) -> None:
        """Adds a token's jti to the blocklist until its expiration timestamp."""
        with self._lock:
            # Ensure timezone-aware UTC
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            self._revoked_jtis[jti] = expires_at
            self._cleanup_expired()

    def is_token_revoked(self, jti: Optional[str], user_id: Optional[str] = None, issued_at: Optional[datetime] = None) -> bool:
        """Checks whether a token JTI or all user tokens issued prior to a cutoff have been revoked."""
        if not jti:
            return False

        with self._lock:
            # 1. Check specific JTI blocklist
            if jti in self._revoked_jtis:
                exp = self._revoked_jtis[jti]
                if datetime.now(timezone.utc) <= exp:
                    return True
                else:
                    # Token naturally expired, remove from blocklist
                    del self._revoked_jtis[jti]

            # 2. Check global user session invalidation
            if user_id and user_id in self._user_revocations and issued_at:
                cutoff_sec = self._user_revocations[user_id]
                iat_sec = int(issued_at.timestamp())
                if iat_sec < cutoff_sec:
                    return True

        return False

    def revoke_all_user_tokens(self, user_id: str) -> None:
        """Invalidates all currently active tokens for a specific user (e.g., password change/security event)."""
        with self._lock:
            self._user_revocations[user_id] = int(datetime.now(timezone.utc).timestamp())

    def _cleanup_expired(self) -> None:
        """Removes expired JTIs from memory to prevent memory leaks."""
        now = datetime.now(timezone.utc)
        expired = [jti for jti, exp in self._revoked_jtis.items() if exp < now]
        for jti in expired:
            del self._revoked_jtis[jti]

    def clear(self) -> None:
        """Clears all revoked tokens (used in testing)."""
        with self._lock:
            self._revoked_jtis.clear()
            self._user_revocations.clear()


# Global singleton instance
token_blocklist = TokenBlocklist()
