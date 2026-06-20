"""
django-filter FilterSets for the REST API query parameters.

`granularity` (daily/monthly) is intentionally NOT a filter here — it controls
how the view aggregates data, not which rows to include, so it is handled in
the view layer instead.
"""

import django_filters

from apps.anggaran.models import Anggaran
from apps.realisasi.models import Realisasi
from apps.capaian.models import CapaianRO
from apps.sync_log.models import SyncLog


class AnggaranFilter(django_filters.FilterSet):
    """Filter for the Anggaran (budget) endpoint."""

    satker = django_filters.NumberFilter(field_name="satker__id")
    kode_satker = django_filters.CharFilter(field_name="satker__kode_satker")
    tahun_anggaran = django_filters.NumberFilter()

    class Meta:
        model = Anggaran
        fields = ["satker", "kode_satker", "tahun_anggaran"]


class RealisasiFilter(django_filters.FilterSet):
    """Filter for the Realisasi (disbursement) endpoint.

    Date range filtering uses tgl_sp2d_after / tgl_sp2d_before to allow the
    frontend to pass an arbitrary period without needing to know the exact dates
    present in the database.
    """

    satker = django_filters.NumberFilter(field_name="satker__id")
    kode_satker = django_filters.CharFilter(field_name="satker__kode_satker")
    tahun_anggaran = django_filters.NumberFilter()
    tgl_sp2d_after = django_filters.DateFilter(
        field_name="tgl_sp2d", lookup_expr="gte"
    )
    tgl_sp2d_before = django_filters.DateFilter(
        field_name="tgl_sp2d", lookup_expr="lte"
    )

    class Meta:
        model = Realisasi
        fields = ["satker", "kode_satker", "tahun_anggaran"]


class CapaianROFilter(django_filters.FilterSet):
    """Filter for the CapaianRO (performance achievement) endpoint."""

    satker = django_filters.NumberFilter(field_name="satker__id")
    kode_satker = django_filters.CharFilter(field_name="satker__kode_satker")
    kode_periode = django_filters.CharFilter()

    class Meta:
        model = CapaianRO
        fields = ["satker", "kode_satker", "kode_periode"]


class SyncLogFilter(django_filters.FilterSet):
    """Filter for the SyncLog endpoint."""

    status = django_filters.CharFilter()
    dag_run_id = django_filters.CharFilter()

    class Meta:
        model = SyncLog
        fields = ["status", "dag_run_id"]
