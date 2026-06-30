"""Read-only Django Admin for ActivityLog (append-only audit trail)."""

from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "actor_name",
        "actor_jabatan",
        "actor_unit",
        "action",
        "description",
    ]
    list_filter = ["action", "actor_role", "created_at"]
    search_fields = ["actor_name", "actor_jabatan", "actor_unit", "description", "target_id"]
    date_hierarchy = "created_at"
    readonly_fields = [f.name for f in ActivityLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
