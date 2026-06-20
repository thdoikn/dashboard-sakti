"""
Read-only Django Admin for Realisasi.
Written by Airflow pipeline; admin is for data inspection only.
"""

from django.contrib import admin

from .models import Realisasi


@admin.register(Realisasi)
class RealisasiAdmin(admin.ModelAdmin):
    list_display = [
        "satker",
        "no_spp",
        "no_spm",
        "no_sp2d",
        "tgl_sp2d",
        "nilai_sp2d",
        "status_data",
        "tahun_anggaran",
        "synced_at",
    ]
    list_filter = ["satker", "tahun_anggaran", "status_data"]
    search_fields = ["no_spp", "no_spm", "no_sp2d", "satker__nama_satker"]
    date_hierarchy = "tgl_sp2d"
    readonly_fields = [
        "satker", "id_spp", "kd_jns_spp", "no_spp", "no_spm", "no_sp2d",
        "tgl_spp", "tgl_spm", "tgl_sp2d", "nilai_spm", "nilai_sp2d",
        "status_data", "tahun_anggaran", "synced_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
