"""
Read-only Django Admin for Anggaran and Referensi.

These models are written by the Airflow pipeline, not by admin users.
Admin is read-only for data inspection and debugging purposes.
"""

from django.contrib import admin

from .models import Anggaran, Referensi


@admin.register(Referensi)
class ReferensiAdmin(admin.ModelAdmin):
    list_display = ["jenis", "kode", "uraian", "updated_at"]
    list_filter = ["jenis"]
    search_fields = ["kode", "uraian"]
    readonly_fields = ["jenis", "kode", "uraian", "updated_at"]
    ordering = ["jenis", "kode"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Anggaran)
class AnggaranAdmin(admin.ModelAdmin):
    list_display = [
        "satker",
        "kode_item",
        "uraian_item",
        "total",
        "tahun_anggaran",
        "kode_sts_history",
        "synced_at",
    ]
    list_filter = ["satker", "tahun_anggaran", "kode_program"]
    search_fields = ["kode_item", "uraian_item", "satker__nama_satker"]
    readonly_fields = [
        "satker", "kode_program", "kode_kegiatan", "kode_output",
        "kode_suboutput", "kode_komponen", "kode_akun", "kode_item",
        "uraian_item", "volume_keg", "sat_keg", "harga_sat", "total",
        "kode_sts_history", "tahun_anggaran", "synced_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
