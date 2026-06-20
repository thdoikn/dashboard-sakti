"""
Reusable SAKTI API client with token lifecycle management and retry logic.

Design:
  - One method per SAKTI endpoint group (get_ref_sts, get_data_ang, etc.).
  - Token lifecycle is handled transparently: missing token → auto-reset,
    expired token → reset and retry once.
  - Network errors (Timeout, ConnectionError) are retried automatically with
    exponential backoff via tenacity (max 3 attempts).
  - The x-Gateway-APIKey header is set on every request via a shared Session.

Environment variables:
  SAKTI_API_BASE_URL   — base URL for the API (default: localhost mock server)
  SAKTI_GATEWAY_API_KEY — gateway API key header value
  SAKTI_KODE_KL        — 3-digit Kementerian/Lembaga code (default: "999")
"""

import logging
import os
from typing import Any, Optional

import requests
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from .auth import TokenManager
from .endpoints import build_reset_url, build_url

logger = logging.getLogger(__name__)

GATEWAY_API_KEY: str = os.environ.get("SAKTI_GATEWAY_API_KEY", "dummy-key-for-dev")
KODE_KL: str = os.environ.get("SAKTI_KODE_KL", "999")
MAX_RETRIES: int = 3

# Tenacity retry decorator shared across all public methods.
# Only retries on network-level errors (timeout/connection). Token expiry is
# handled inside _get() and does NOT trigger a tenacity retry.
_network_retry = retry(
    retry=retry_if_exception_type((requests.Timeout, requests.ConnectionError)),
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)


class TokenExpiredError(Exception):
    """Raised when the token cannot be refreshed after expiry."""


class SaktiClient:
    """
    Client for the SAKTI API (or mock server in development).

    Instantiate once per Airflow task / Django request — do not share across
    threads (each thread should have its own TokenManager state).

    Example:
        client = SaktiClient(kode_kl="999")
        result = client.get_data_ang(kode_sts_history="SH001")
        records = result["data"]
    """

    def __init__(self, kode_kl: str = KODE_KL) -> None:
        self.kode_kl = kode_kl
        self.token_manager = TokenManager()
        self._session = requests.Session()
        self._session.headers.update({
            "x-Gateway-APIKey": GATEWAY_API_KEY,
            "Content-Type": "application/json",
        })

    def _get(self, endpoint_key: str, *extra_segments: str) -> dict[str, Any]:
        """
        Make a GET request with full token handling.

        Steps:
          1. If no token is stored, call resetToken first.
          2. Send the request with the current token in the Authorization header.
          3. If the response body signals token expiry, reset and retry once.
          4. Store the new token returned in the response body.
          5. Return the full response dict (callers use result["data"]).
        """
        token = self.token_manager.get_token()
        if not token:
            # No token yet — bootstrap via resetToken before the first call.
            reset_url = build_reset_url(endpoint_key, self.kode_kl)
            token = self.token_manager.reset_token(reset_url, GATEWAY_API_KEY)
            if not token:
                raise TokenExpiredError(
                    f"Could not obtain initial token from {reset_url}"
                )

        url = build_url(endpoint_key, self.kode_kl, *extra_segments)
        response_data = self._send_request(url, token)

        if response_data.get("status") == "Token Expired":
            # Token was already consumed — reset and retry once.
            logger.warning(
                "Token expired for %s, resetting and retrying...", url
            )
            reset_url = build_reset_url(endpoint_key, self.kode_kl)
            new_token = self.token_manager.reset_token(reset_url, GATEWAY_API_KEY)
            if not new_token:
                raise TokenExpiredError(
                    f"Could not reset token for {endpoint_key} after expiry"
                )
            response_data = self._send_request(url, new_token)

        # Store the fresh single-use token returned in this response for the
        # next request. If absent (shouldn't happen with the real API), keep
        # the existing token — it may already be invalid, so clear it.
        if fresh_token := response_data.get("token"):
            self.token_manager.set_token(fresh_token)
        else:
            logger.warning(
                "Response from %s did not include a new token; clearing stored token.",
                url,
            )
            self.token_manager.clear_token()

        return response_data

    def _send_request(self, url: str, token: str) -> dict[str, Any]:
        """Send a single GET request and return the parsed JSON body."""
        resp = self._session.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # Public API methods — one per SAKTI endpoint group.
    # Each is decorated with _network_retry for automatic backoff on
    # transient network failures.
    # ------------------------------------------------------------------

    @_network_retry
    def get_ref_sts(self, kode_sts_history: str = "") -> dict[str, Any]:
        """
        Fetch status history (refSts).

        kode_sts_history: optional — pass to filter by a specific STS history code.
        """
        if kode_sts_history:
            return self._get("ref_sts", kode_sts_history)
        return self._get("ref_sts")

    @_network_retry
    def get_data_ang(
        self,
        kode_sts_history: str = "000000",
        kode_kanal: str = "B00",
    ) -> dict[str, Any]:
        """
        Fetch budget allocation data (dataAng).

        kode_sts_history: STS history code from refSts (default "000000" = latest).
        kode_kanal: channel code (default "B00" = DIPA).
        """
        return self._get("data_ang", kode_sts_history, kode_kanal)

    @_network_retry
    def get_spp_header(self, periode: str = "") -> dict[str, Any]:
        """
        Fetch SPP/SPM/SP2D payment headers (sppHeader).

        periode: optional — YYYY-MM format to filter by period.
        """
        if periode:
            return self._get("spp_header", periode)
        return self._get("spp_header")

    @_network_retry
    def get_ref_admin(self) -> dict[str, Any]:
        """Fetch satker reference/administrative data (refAdmin)."""
        return self._get("ref_admin")

    @_network_retry
    def get_ref_uraian(self) -> dict[str, Any]:
        """Fetch code-to-name reference mapping (refUraian)."""
        return self._get("ref_uraian")

    @_network_retry
    def get_capaian_ro(self, kode_periode: str = "") -> dict[str, Any]:
        """
        Fetch performance achievement data (capaianRO).

        kode_periode: optional — YYYY-MM format to filter by period.
        """
        if kode_periode:
            return self._get("capaian_ro", kode_periode)
        return self._get("capaian_ro")
