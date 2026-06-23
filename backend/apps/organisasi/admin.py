from django.contrib import admin

from .models import EselonI, EselonII


class EselonIIInline(admin.TabularInline):
    model = EselonII
    extra = 0


@admin.register(EselonI)
class EselonIAdmin(admin.ModelAdmin):
    list_display = ["nama", "jenis", "urutan"]
    list_filter = ["jenis"]
    search_fields = ["nama"]
    inlines = [EselonIIInline]


@admin.register(EselonII)
class EselonIIAdmin(admin.ModelAdmin):
    list_display = ["nama", "eselon_i"]
    list_filter = ["eselon_i"]
    search_fields = ["nama"]
