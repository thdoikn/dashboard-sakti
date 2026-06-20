"""
Realisasi (Disbursement) model.

Stores SPP/SPM/SP2D payment transaction data fetched from SAKTI's sppHeader endpoint.
Each row represents one payment request (SPP) and its progression through the
payment authorization chain (SPP -> SPM -> SP2D).
"""

from django.db import models

from apps.satker.models import Satker


class Realisasi(models.Model):
    """
    Payment transaction (realisasi belanja) from SAKTI's sppHeader endpoint.

    id_spp is SAKTI's own identifier — NOT the local PK.
    Upsert key: (satker, id_spp, tahun_anggaran).
    """

    satker = models.ForeignKey(
        Satker,
        on_delete=models.CASCADE,
        related_name="realisasi_set",
        verbose_name="Satker",
    )
    # SAKTI transaction identifiers
    id_spp = models.BigIntegerField(
        verbose_name="ID SPP",
        help_text="ID transaksi SPP dari SAKTI (bukan primary key lokal)",
    )
    kd_jns_spp = models.CharField(
        max_length=10,
        blank=True,
        default="",
        verbose_name="Kode Jenis SPP",
    )
    no_spp = models.CharField(max_length=50, blank=True, default="", verbose_name="No. SPP")
    no_spm = models.CharField(max_length=50, blank=True, default="", verbose_name="No. SPM")
    no_sp2d = models.CharField(max_length=50, blank=True, default="", verbose_name="No. SP2D")
    # Transaction dates — nullable because not all steps may be completed yet
    tgl_spp = models.DateField(null=True, blank=True, verbose_name="Tanggal SPP")
    tgl_spm = models.DateField(null=True, blank=True, verbose_name="Tanggal SPM")
    tgl_sp2d = models.DateField(null=True, blank=True, verbose_name="Tanggal SP2D")
    # Transaction amounts
    nilai_spm = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Nilai SPM (Rp)",
    )
    nilai_sp2d = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Nilai SP2D (Rp)",
    )
    status_data = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="Status Data",
    )
    tahun_anggaran = models.IntegerField(verbose_name="Tahun Anggaran")
    synced_at = models.DateTimeField(verbose_name="Waktu Sinkronisasi")

    class Meta:
        db_table = "realisasi"
        verbose_name = "Realisasi"
        verbose_name_plural = "Realisasi"
        unique_together = [("satker", "id_spp", "tahun_anggaran")]
        ordering = ["-tahun_anggaran", "satker", "-tgl_sp2d"]
        indexes = [
            models.Index(fields=["satker", "tahun_anggaran"]),
            models.Index(fields=["tgl_sp2d"]),
            models.Index(fields=["tgl_spm"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.satker.kode_satker} / SPP-{self.no_spp} "
            f"({self.tahun_anggaran})"
        )
