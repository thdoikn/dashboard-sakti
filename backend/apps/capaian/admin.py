"""
Read-only Django Admin for CapaianRO.
Written by Airflow pipeline; admin is for data inspection only.
"""

from django.contrib import admin

from .models import CapaianRO


@admin.register(CapaianRO)
class CapaianROAdmin(admin.ModelAdmin):
    list_display = [
        "satker",
        "sub_output_kode",
        "kode_periode",
        "anggaran_belanja",
        "realisasi_belanja",
        "total_progress_capaian_ro",
        "synced_at",
    ]
    list_filter = ["satker", "kode_periode"]
    search_fields = ["sub_output_kode", "satker__nama_satker"]
    readonly_fields = [
        "satker", "sub_output_kode", "kode_periode",
        "total_realisasi_sub_output", "total_progress_capaian_ro",
        "anggaran_belanja", "realisasi_belanja", "synced_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
