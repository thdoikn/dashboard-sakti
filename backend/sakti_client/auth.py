"""
Token management for SAKTI API authentication.

Kept separate from client.py so it can be unit-tested independently.

SAKTI uses single-use tokens:
  1. The client calls resetToken to get an initial token.
  2. Every successful API response body contains a NEW token.
  3. The client stores that new token and uses it for the next request.
  4. A token that has already been used returns {"status": "Token Expired"}.
"""

import logging
import threading
from typing import Optional

import requests

logger = logging.getLogger(__name__)


class TokenManager:
    """
    Thread-safe holder for the current SAKTI single-use token.

    Stores at most one token at a time. When the API returns a new token
    in its response body, call set_token() to update the stored value.
    """

    def __init__(self) -> None:
        self._token: Optional[str] = None
        self._lock = threading.Lock()

    def set_token(self, token: str) -> None:
        """Store a new token, replacing any previously held token."""
        with self._lock:
            self._token = token

    def get_token(self) -> Optional[str]:
        """Return the currently stored token, or None if no token is held."""
        with self._lock:
            return self._token

    def clear_token(self) -> None:
        """Remove the stored token (e.g. after a fatal auth failure)."""
        with self._lock:
            self._token = None

    def reset_token(self, reset_url: str, api_key: str) -> Optional[str]:
        """
        Call the SAKTI resetToken endpoint and store the returned token.

        Returns the new token string on success, or None if the call fails.
        The caller should treat None as a fatal error (no retry here — that
        responsibility belongs to the calling code or the tenacity decorator
        in client.py).
        """
        try:
            resp = requests.get(
                reset_url,
                headers={"x-Gateway-APIKey": api_key},
                timeout=30,
            )
            resp.raise_for_status()
            payload = resp.json()
            new_token: Optional[str] = payload.get("token")
            if new_token:
                self.set_token(new_token)
                logger.info("Token reset successfully via %s", reset_url)
            else:
                logger.error(
                    "resetToken response missing 'token' field: %r", payload
                )
            return new_token
        except requests.RequestException as exc:
            logger.error("Token reset request failed (%s): %s", reset_url, exc)
            return None
        except Exception as exc:  # noqa: BLE001
            logger.error("Unexpected error during token reset: %s", exc)
            return None
