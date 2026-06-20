"""
Mock SAKTI API URL configuration.

Mirrors the real SAKTI URL structure:
  /sitp-monsakti-omspan/webservice/API/<kelompok>/<tipe>/<kode_kl>/[extra]/
  /sitp-monsakti-omspan/webservice/resetToken/<kelompok>/<tipe>/<kode_kl>/

The prefix /sitp-monsakti-omspan/webservice/ is stripped by config/urls.py
before these patterns are matched.
"""

from django.urls import path, re_path

from .views import ResetTokenView, SaktiApiView

urlpatterns = [
    # Main data endpoint — optional trailing path segments (variable2/3/4) are
    # captured but ignored by the view (fixture data is static per tipeData).
    re_path(
        r"^API/(?P<kelompok_modul>[^/]+)/(?P<tipe_data>[^/]+)/(?P<kode_kl>[^/]+)(?:/.*)?/?$",
        SaktiApiView.as_view(),
        name="mock_sakti_api",
    ),
    # Token reset endpoint — no trailing segments
    path(
        "resetToken/<str:kelompok_modul>/<str:tipe_data>/<str:kode_kl>/",
        ResetTokenView.as_view(),
        name="mock_sakti_reset_token",
    ),
]
