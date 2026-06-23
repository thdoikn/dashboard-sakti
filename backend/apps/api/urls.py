"""
REST API URL configuration for Phase 4.

All endpoints are prefixed with /api/ in the root urlconf.

Router-registered endpoints (auto-generates list/detail/create/update/destroy):
  /api/satker/            — Satker CRUD
  /api/referensi/         — Reference codes (read-only)
  /api/anggaran/          — Budget data (read-only)
  /api/realisasi/         — Disbursement data (read-only)
  /api/capaian-ro/        — Performance data (read-only)
  /api/sync-log/          — Sync audit log (read-only)

Function-based endpoints:
  /api/sync-status/       — Latest sync result for dashboard status badge
  /api/export/excel/      — Download .xlsx file with active filters
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"satker", views.SatkerViewSet, basename="satker")
router.register(r"referensi", views.ReferensiViewSet, basename="referensi")
router.register(r"anggaran", views.AnggaranViewSet, basename="anggaran")
router.register(r"realisasi", views.RealisasiViewSet, basename="realisasi")
router.register(r"capaian-ro", views.CapaianROViewSet, basename="capaian-ro")
router.register(r"sync-log", views.SyncLogViewSet, basename="sync-log")

urlpatterns = [
    path("", include(router.urls)),
    path("sync-status/",  views.sync_status_view,  name="sync-status"),
    path("sync-history/", views.sync_history_view, name="sync-history"),
    path("export/excel/", views.excel_export_view, name="excel-export"),
    path("users/",        views.users_list_view,   name="users-list"),
]
