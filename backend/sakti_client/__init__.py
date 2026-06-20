"""
SAKTI API Client module.

Provides a reusable Python client for calling the SAKTI API (or the mock server
in development). Handles token lifecycle, retries, and response parsing.

Usage:
    from sakti_client.client import SaktiClient

    client = SaktiClient(kode_kl="999")
    data = client.get_data_ang()

The base URL is controlled via SAKTI_API_BASE_URL environment variable:
  - Dev:  http://backend:8000/sitp-monsakti-omspan/webservice  (mock server)
  - Prod: https://apigateway.kemenkeu.go.id/sitp-monsakti-omspan/webservice

Standalone module — importable from Django (backend) or Airflow tasks by
adding backend/ to PYTHONPATH.

See PRD.md section 7.3 for the full abstraction strategy.
"""
