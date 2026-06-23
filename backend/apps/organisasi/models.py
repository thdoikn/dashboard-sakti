"""
Struktur organisasi OIKN — Eselon I (Kedeputian) dan Eselon II (Direktorat/Biro).

These models are used by the accounts app to resolve SSO claims (jabatan / unit_kerja)
to structured organisational units, and to link User records to their unit.
"""

from django.db import models


class EselonI(models.Model):
    """
    Unit organisasi tingkat Eselon I: Kedeputian, Sekretariat, dan Unit Kerja Hukum.
    Keycloak sends this level in the 'satuan_kerja' / 'kedeputian' claim.
    """

    class Jenis(models.TextChoices):
        KEDEPUTIAN = "kedeputian", "Kedeputian"
        SEKRETARIAT = "sekretariat", "Sekretariat"
        UNIT_KERJA = "unit_kerja", "Unit Kerja"

    nama = models.CharField(max_length=255, unique=True, verbose_name="Nama")
    jenis = models.CharField(
        max_length=20,
        choices=Jenis.choices,
        default=Jenis.KEDEPUTIAN,
        verbose_name="Jenis",
    )
    urutan = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Urutan tampil",
        help_text="Digunakan untuk mengurutkan tampilan di UI",
    )

    class Meta:
        db_table = "organisasi_eselon_i"
        verbose_name = "Eselon I"
        verbose_name_plural = "Eselon I"
        ordering = ["urutan", "nama"]

    def __str__(self) -> str:
        return self.nama


class EselonII(models.Model):
    """
    Unit organisasi tingkat Eselon II: Direktorat atau Biro.
    Keycloak sends this level in the 'unit_kerja' / 'direktorat' claim.
    """

    nama = models.CharField(max_length=255, unique=True, verbose_name="Nama")
    eselon_i = models.ForeignKey(
        EselonI,
        on_delete=models.PROTECT,
        related_name="unit_eselon_ii",
        verbose_name="Eselon I",
    )

    class Meta:
        db_table = "organisasi_eselon_ii"
        verbose_name = "Eselon II"
        verbose_name_plural = "Eselon II"
        ordering = ["eselon_i__urutan", "nama"]

    def __str__(self) -> str:
        return self.nama
