"""
Django Admin for Satker.

Full CRUD admin — this is the primary interface for the DKB team to manage
OIKN satker records (add/edit/deactivate).
"""

from django.contrib import admin

from .models import Satker


@admin.register(Satker)
class SatkerAdmin(admin.ModelAdmin):
    list_display = [
        "kode_satker",
        "nama_satker",
        "kode_kementerian",
        "kode_kppn",
        "aktif",
        "created_at",
        "updated_at",
    ]
    list_filter = ["aktif", "kode_kementerian", "kode_kppn"]
    search_fields = ["kode_satker", "nama_satker"]
    list_editable = ["aktif"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        (
            "Identitas Satker",
            {
                "fields": [
                    "kode_satker",
                    "nama_satker",
                    "kode_kementerian",
                    "kode_kppn",
                    "aktif",
                ]
            },
        ),
        (
            "Metadata",
            {
                "fields": ["created_at", "updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]
    ordering = ["kode_satker"]
