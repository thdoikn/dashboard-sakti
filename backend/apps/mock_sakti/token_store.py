"""
In-memory single-use token store for the mock SAKTI API server.

Each token issued by issue_token() can only be consumed once via consume_token().
After consumption the token is invalid — the client must use the new token
returned in the response body, or call resetToken to get a fresh one.

Thread-safe: uses a threading.Lock to protect the shared set.
"""

import secrets
import threading

_lock = threading.Lock()
_valid_tokens: set[str] = set()


def issue_token() -> str:
    """Issue a fresh single-use token and register it as valid."""
    token = secrets.token_hex(32)
    with _lock:
        _valid_tokens.add(token)
    return token


def consume_token(token: str) -> bool:
    """
    Validate and consume a token.

    Returns True and removes the token if it is valid.
    Returns False if the token is unknown or already consumed.
    """
    with _lock:
        if token in _valid_tokens:
            _valid_tokens.discard(token)
            return True
    return False
