"""
REST API serializers for all SAKTI-OIKN data models.

Each serializer exposes all model fields plus any computed/related fields
needed by the frontend dashboard.
"""

from rest_framework import serializers

from apps.satker.models import Satker
from apps.anggaran.models import Referensi, Anggaran
from apps.realisasi.models import Realisasi
from apps.capaian.models import CapaianRO
from apps.sync_log.models import SyncLog


class SatkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Satker
        fields = "__all__"


class ReferensiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referensi
        fields = "__all__"


class AnggaranSerializer(serializers.ModelSerializer):
    # Denormalized satker name to avoid a separate lookup in the frontend
    satker_nama = serializers.CharField(source="satker.nama_satker", read_only=True)

    class Meta:
        model = Anggaran
        fields = "__all__"


class RealisasiSerializer(serializers.ModelSerializer):
    satker_nama = serializers.CharField(source="satker.nama_satker", read_only=True)

    class Meta:
        model = Realisasi
        fields = "__all__"


class CapaianROSerializer(serializers.ModelSerializer):
    satker_nama = serializers.CharField(source="satker.nama_satker", read_only=True)

    class Meta:
        model = CapaianRO
        fields = "__all__"


class SyncLogSerializer(serializers.ModelSerializer):
    # satker is nullable (task may not be per-satker), so allow_null is required
    satker_nama = serializers.CharField(
        source="satker.nama_satker", read_only=True, allow_null=True
    )

    class Meta:
        model = SyncLog
        fields = "__all__"
