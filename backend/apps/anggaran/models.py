"""
Anggaran (Budget) and Referensi (Reference) models.

Anggaran stores budget allocation data fetched from SAKTI's dataAng endpoint,
structured per program/activity/output/component/account hierarchy.

Referensi is a denormalized lookup table combining refAdmin + refUraian response
data — it maps codes (program, activity, output, etc.) to their Indonesian names.
"""

from django.db import models

from apps.satker.models import Satker


class Referensi(models.Model):
    """
    Denormalized reference table: maps SAKTI codes to their human-readable uraian.

    Populated by refAdmin and refUraian SAKTI endpoints.
    jenis values: 'program', 'kegiatan', 'output', 'sub_output', 'komponen', 'akun'
    """

    jenis = models.CharField(
        max_length=50,
        verbose_name="Jenis Referensi",
        help_text="Tipe kode: program/kegiatan/output/sub_output/komponen/akun",
    )
    kode = models.CharField(
        max_length=255,
        verbose_name="Kode",
    )
    uraian = models.TextField(
        verbose_name="Uraian",
        help_text="Nama/deskripsi lengkap dari kode tersebut",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "referensi"
        verbose_name = "Referensi"
        verbose_name_plural = "Referensi"
        unique_together = [("jenis", "kode")]
        ordering = ["jenis", "kode"]
        indexes = [
            models.Index(fields=["jenis", "kode"]),
        ]

    def __str__(self) -> str:
        return f"[{self.jenis}] {self.kode} — {self.uraian[:60]}"


class Anggaran(models.Model):
    """
    Budget allocation record per program/activity/output/component/account.

    Synced from SAKTI's dataAng endpoint. Uses kode_item + kode_sts_history +
    tahun_anggaran as the upsert key — never blind-insert (see CLAUDE.md).
    """

    satker = models.ForeignKey(
        Satker,
        on_delete=models.CASCADE,
        related_name="anggaran_set",
        verbose_name="Satker",
    )
    # Program hierarchy codes (from SAKTI dataAng response)
    kode_program = models.CharField(max_length=20, verbose_name="Kode Program")
    kode_kegiatan = models.CharField(max_length=20, verbose_name="Kode Kegiatan")
    kode_output = models.CharField(max_length=20, verbose_name="Kode Output")
    kode_suboutput = models.CharField(
        max_length=20, blank=True, default="", verbose_name="Kode Sub-Output"
    )
    kode_komponen = models.CharField(max_length=20, verbose_name="Kode Komponen")
    kode_akun = models.CharField(max_length=20, verbose_name="Kode Akun")
    kode_item = models.CharField(
        max_length=50,
        verbose_name="Kode Item",
        help_text="Kode gabungan yang menjadi identifier unik item anggaran",
    )
    uraian_item = models.TextField(
        verbose_name="Uraian Item",
        blank=True,
        default="",
    )
    # Budget amounts
    volume_keg = models.DecimalField(
        max_digits=19,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name="Volume Kegiatan",
    )
    sat_keg = models.CharField(
        max_length=20,
        blank=True,
        default="",
        verbose_name="Satuan Kegiatan",
    )
    harga_sat = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Harga Satuan (Rp)",
    )
    total = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        verbose_name="Total Anggaran (Rp)",
    )
    # SAKTI metadata
    kode_sts_history = models.CharField(
        max_length=20,
        verbose_name="Kode STS History",
        help_text="Status history code from refSts — identifies the revision/version",
    )
    tahun_anggaran = models.IntegerField(verbose_name="Tahun Anggaran")
    synced_at = models.DateTimeField(
        verbose_name="Waktu Sinkronisasi",
        help_text="Timestamp ketika data ini terakhir di-sync dari SAKTI",
    )

    class Meta:
        db_table = "anggaran"
        verbose_name = "Anggaran"
        verbose_name_plural = "Anggaran"
        unique_together = [("satker", "kode_item", "kode_sts_history", "tahun_anggaran")]
        ordering = ["-tahun_anggaran", "satker", "kode_program", "kode_kegiatan"]
        indexes = [
            models.Index(fields=["satker", "tahun_anggaran"]),
            models.Index(fields=["kode_program", "kode_kegiatan", "kode_output"]),
        ]

    def __str__(self) -> str:
        return f"{self.satker.kode_satker} / {self.kode_item} ({self.tahun_anggaran})"
