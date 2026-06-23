"""
URL configuration for SAKTI-OIKN Integration Platform.

Routes:
  /admin/           Django Admin
  /api/             REST API (apps.api)
  /health/          Health check endpoint (for Docker healthcheck)
  /sitp-monsakti-omspan/webservice/  Mock SAKTI API server (apps.mock_sakti)
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.utils import timezone


def health_check(request):
    """
    Simple health check endpoint used by Docker and load balancers.
    Returns 200 if the application is up and the database is reachable.
    """
    try:
        from django.db import connection

        connection.ensure_connection()
        db_status = "ok"
    except Exception as e:
        return JsonResponse(
            {"status": "error", "db": str(e), "timestamp": timezone.now().isoformat()},
            status=503,
        )
    return JsonResponse(
        {
            "status": "ok",
            "db": db_status,
            "timestamp": timezone.now().isoformat(),
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.api.urls")),
    path("health/", health_check, name="health_check"),
    # mozilla_django_oidc internal session endpoints (used by SessionRefresh middleware)
    path("oidc/", include("mozilla_django_oidc.urls")),
    # Mock SAKTI API server — mirrors the real SAKTI URL structure.
    # In production, point SAKTI_API_BASE_URL to the real Kemenkeu gateway instead.
    path(
        "sitp-monsakti-omspan/webservice/",
        include("apps.mock_sakti.urls"),
    ),
]
