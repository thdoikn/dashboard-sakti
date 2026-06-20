"""
Read-only Django Admin for SyncLog.
Written by Airflow pipeline; admin is for monitoring and debugging.
"""

from django.contrib import admin

from .models import SyncLog


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = [
        "dag_run_id",
        "task_name",
        "status",
        "satker",
        "row_count",
        "started_at",
        "finished_at",
    ]
    list_filter = ["status", "satker", "task_name"]
    search_fields = ["dag_run_id", "task_name", "error_message"]
    date_hierarchy = "started_at"
    readonly_fields = [
        "dag_run_id", "task_name", "status", "satker",
        "row_count", "error_message", "started_at", "finished_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
