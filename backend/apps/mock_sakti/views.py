"""
Mock SAKTI API views.

Simulates the real SAKTI (Sistem Aplikasi Keuangan Tingkat Instansi) API:
- Single-use token enforcement: each successful response includes a NEW token.
  The consumed token becomes invalid immediately.
- Token-expired response: {"status": "Token Expired", "data": []} when the
  supplied token has already been used or does not exist.
- resetToken endpoint: returns a fresh token without validating the old one.
- Responses are served from static JSON fixtures for deterministic testing.

NOTE: No Django ORM is used here — this module is pure file I/O + token logic,
so it starts cleanly even when the database is unavailable.
"""

import json
import logging
import os
from typing import Any

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .token_store import consume_token, issue_token

logger = logging.getLogger(__name__)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

# Maps tipeData URL segment to its fixture filename (without .json)
TIPE_DATA_TO_FIXTURE: dict[str, str] = {
    "refSts": "refSts",
    "dataAng": "dataAng",
    "sppHeader": "sppHeader",
    "refAdmin": "refAdmin",
    "refUraian": "refUraian",
    "capaianRO": "capaianRO",
}


def _load_fixture(tipe_data: str) -> list[Any]:
    """Load fixture JSON for the given tipeData segment. Returns empty list on error."""
    fixture_key = TIPE_DATA_TO_FIXTURE.get(tipe_data)
    if not fixture_key:
        logger.warning("No fixture mapping for tipeData=%r", tipe_data)
        return []

    fixture_path = os.path.join(FIXTURES_DIR, f"{fixture_key}.json")
    try:
        with open(fixture_path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        logger.error("Fixture file not found: %s", fixture_path)
        return []
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in fixture %s: %s", fixture_path, exc)
        return []


def _get_bearer_token(request) -> str | None:
    """
    Extract the token from the 'Authorization: Bearer <token>' header.
    Returns None if the header is absent or malformed.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer "):].strip()
    return token if token else None


@method_decorator(csrf_exempt, name="dispatch")
class SaktiApiView(View):
    """
    Handles GET /API/<kelompok_modul>/<tipe_data>/<kode_kl>/[extra segments...]

    Token flow:
    1. Extract Bearer token from Authorization header.
    2. consume_token() — if invalid, return Token Expired response.
    3. Load fixture data for the requested tipeData.
    4. issue_token() — generate a new single-use token.
    5. Return {"status": "Ok", "data": [...], "token": "<new_token>"}.
    """

    def get(self, request, kelompok_modul: str, tipe_data: str, kode_kl: str, **kwargs):
        token = _get_bearer_token(request)

        if not token or not consume_token(token):
            logger.debug(
                "Token Expired or missing for %s/%s/%s (token=%r)",
                kelompok_modul, tipe_data, kode_kl, token,
            )
            return JsonResponse(
                {"status": "Token Expired", "data": []},
                status=200,  # Real SAKTI returns 200 with this body, not 401
            )

        data = _load_fixture(tipe_data)
        new_token = issue_token()

        logger.debug(
            "Mock SAKTI response: kelompok=%s tipe=%s kode_kl=%s records=%d",
            kelompok_modul, tipe_data, kode_kl, len(data),
        )

        return JsonResponse(
            {"status": "Ok", "data": data, "token": new_token},
            safe=False,
        )


@method_decorator(csrf_exempt, name="dispatch")
class ResetTokenView(View):
    """
    Handles GET /resetToken/<kelompok_modul>/<tipe_data>/<kode_kl>/

    Issues a fresh valid token without requiring an existing valid token.
    The client calls this endpoint to bootstrap the token lifecycle.
    """

    def get(self, request, kelompok_modul: str, tipe_data: str, kode_kl: str):
        new_token = issue_token()
        logger.debug(
            "Token reset issued for kelompok=%s tipe=%s kode_kl=%s",
            kelompok_modul, tipe_data, kode_kl,
        )
        return JsonResponse({"status": "Ok", "token": new_token})
