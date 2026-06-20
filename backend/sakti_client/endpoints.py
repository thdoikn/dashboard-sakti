"""
URL pattern constants for SAKTI API endpoints.

Builds the request URLs for each supported endpoint based on the SAKTI URL structure:
  {BASE_URL}/API/{kelompokModul}/{tipeData}/{kodeKL}/[extra segments]
  {BASE_URL}/resetToken/{kelompokModul}/{tipeData}/{kodeKL}

BASE_URL is read from the SAKTI_API_BASE_URL environment variable so the
same client code works against both the mock server (dev) and the real
Kemenkeu API gateway (prod) without code changes.
"""

import os

BASE_URL: str = os.environ.get(
    "SAKTI_API_BASE_URL",
    "http://localhost:8000/sitp-monsakti-omspan/webservice",
)

# kelompokModul (module group) per endpoint key
KELOMPOK: dict[str, str] = {
    "ref_sts": "ANG",
    "data_ang": "ANG",
    "spp_header": "SPP",
    "ref_admin": "ADM",
    "ref_uraian": "ADM",
    "capaian_ro": "KOM",
}

# tipeData URL segment per endpoint key
TIPE: dict[str, str] = {
    "ref_sts": "refSts",
    "data_ang": "dataAng",
    "spp_header": "sppHeader",
    "ref_admin": "refAdmin",
    "ref_uraian": "refUraian",
    "capaian_ro": "capaianRO",
}


def build_url(endpoint_key: str, kode_kl: str, *extra_segments: str) -> str:
    """
    Build the full data-request URL for a given endpoint.

    Example:
        build_url("data_ang", "999", "SH001", "B00")
        → "{BASE_URL}/API/ANG/dataAng/999/SH001/B00"
    """
    kelompok = KELOMPOK[endpoint_key]
    tipe = TIPE[endpoint_key]
    parts = [BASE_URL.rstrip("/"), "API", kelompok, tipe, kode_kl] + list(extra_segments)
    return "/".join(parts)


def build_reset_url(endpoint_key: str, kode_kl: str) -> str:
    """
    Build the resetToken URL for a given endpoint.

    Example:
        build_reset_url("data_ang", "999")
        → "{BASE_URL}/resetToken/ANG/dataAng/999"
    """
    kelompok = KELOMPOK[endpoint_key]
    tipe = TIPE[endpoint_key]
    return f"{BASE_URL.rstrip('/')}/resetToken/{kelompok}/{tipe}/{kode_kl}"
