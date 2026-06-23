from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "username", "email", "get_full_name", "role",
        "unit_eselon_ii", "unit_eselon_i", "last_login", "is_active",
    ]
    list_filter = ["role", "unit_eselon_i", "is_active", "is_staff"]
    search_fields = ["username", "email", "first_name", "last_name", "nip"]
    ordering = ["role", "-last_login"]
    readonly_fields = ["last_login", "date_joined"]

    fieldsets = BaseUserAdmin.fieldsets + (  # type: ignore[operator]
        ("Profil OIKN", {
            "fields": (
                "role", "nip", "jabatan",
                "unit_eselon_i", "unit_eselon_ii",
                "raw_direktorat", "raw_kedeputian",
            ),
        }),
    )
