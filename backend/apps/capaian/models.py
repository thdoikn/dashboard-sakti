"""
CapaianRO (Performance Achievement - Rincian Output) model.

Stores performance achievement data fetched from SAKTI's capaianRO endpoint.
Tracks budget absorption and output achievement percentages per sub-output per period.
"""

from django.db import models

from apps.satker.models import Satker


class CapaianRO(models.Model):
    """
    Performance achievement per Rincian Output (RO) per period.

    kode_periode format: YYYY-MM (e.g. '2026-01' for January 2026).
    Upsert key: (satker, sub_output_kode, kode_periode).
    """

    satker = models.ForeignKey(
        Satker,
        on_delete=models.CASCADE,
        related_name="capaian_set",
        verbose_name="Satker",
    )
    sub_output_kode = models.CharField(
        max_length=50,
        verbose_name="Kode Sub-Output (RO)",
    )
    kode_periode = models.CharField(
        max_length=7,
        verbose_name="Kode Periode",
        help_text="Format: YYYY-MM (contoh: 2026-01)",
    )
    # Achievement metrics
    total_realisasi_sub_output = models.DecimalField(
        max_digits=19,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name="Total Realisasi Sub-Output",
    )
    total_progress_capaian_ro = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Total Progress Capaian RO (%)",
        help_text="Persentase capaian output (0-100)",
    )
    # Budget vs disbursement for this output
    anggaran_belanja = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Anggaran Belanja (Rp)",
    )
    realisasi_belanja = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Realisasi Belanja (Rp)",
    )
    synced_at = models.DateTimeField(verbose_name="Waktu Sinkronisasi")

    class Meta:
        db_table = "capaian_ro"
        verbose_name = "Capaian RO"
        verbose_name_plural = "Capaian RO"
        unique_together = [("satker", "sub_output_kode", "kode_periode")]
        ordering = ["-kode_periode", "satker", "sub_output_kode"]
        indexes = [
            models.Index(fields=["satker", "kode_periode"]),
            models.Index(fields=["kode_periode"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.satker.kode_satker} / {self.sub_output_kode} "
            f"({self.kode_periode})"
        )
