"""
Satker (Satuan Kerja / Operational Unit) model.

Represents one of OIKN's 6 active operational units that budget and disbursement
data is tracked for. The kode_satker is used as the identifier when calling
SAKTI API endpoints.
"""

from django.db import models


class Satker(models.Model):
    """
    Represents an OIKN Satuan Kerja (operational unit).

    OIKN has 6 active satker. This list is managed here — never hardcoded
    in Airflow DAG tasks. Always query aktif=True to get the active set.
    """

    kode_satker = models.CharField(
        max_length=6,
        unique=True,
        verbose_name="Kode Satker",
        help_text="6-digit SAKTI satker code (e.g. 999001)",
    )
    nama_satker = models.CharField(
        max_length=255,
        verbose_name="Nama Satker",
    )
    kode_kementerian = models.CharField(
        max_length=3,
        verbose_name="Kode Kementerian/Lembaga",
        help_text="3-digit K/L code (e.g. 999 for OIKN)",
    )
    kode_kppn = models.CharField(
        max_length=3,
        verbose_name="Kode KPPN",
        help_text="3-digit KPPN (treasury office) code",
    )
    aktif = models.BooleanField(
        default=True,
        verbose_name="Aktif",
        help_text="Satker aktif akan disertakan dalam sinkronisasi data SAKTI",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "satker"
        verbose_name = "Satker"
        verbose_name_plural = "Satker"
        ordering = ["kode_satker"]

    def __str__(self) -> str:
        return f"{self.kode_satker} — {self.nama_satker}"
