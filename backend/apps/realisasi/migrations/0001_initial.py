import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("satker", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Realisasi",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "satker",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="realisasi_set",
                        to="satker.satker",
                        verbose_name="Satker",
                    ),
                ),
                (
                    "id_spp",
                    models.BigIntegerField(
                        help_text="ID transaksi SPP dari SAKTI (bukan primary key lokal)",
                        verbose_name="ID SPP",
                    ),
                ),
                (
                    "kd_jns_spp",
                    models.CharField(
                        blank=True, default="", max_length=10, verbose_name="Kode Jenis SPP"
                    ),
                ),
                (
                    "no_spp",
                    models.CharField(
                        blank=True, default="", max_length=50, verbose_name="No. SPP"
                    ),
                ),
                (
                    "no_spm",
                    models.CharField(
                        blank=True, default="", max_length=50, verbose_name="No. SPM"
                    ),
                ),
                (
                    "no_sp2d",
                    models.CharField(
                        blank=True, default="", max_length=50, verbose_name="No. SP2D"
                    ),
                ),
                (
                    "tgl_spp",
                    models.DateField(blank=True, null=True, verbose_name="Tanggal SPP"),
                ),
                (
                    "tgl_spm",
                    models.DateField(blank=True, null=True, verbose_name="Tanggal SPM"),
                ),
                (
                    "tgl_sp2d",
                    models.DateField(blank=True, null=True, verbose_name="Tanggal SP2D"),
                ),
                (
                    "nilai_spm",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=19,
                        null=True,
                        verbose_name="Nilai SPM (Rp)",
                    ),
                ),
                (
                    "nilai_sp2d",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=19,
                        null=True,
                        verbose_name="Nilai SP2D (Rp)",
                    ),
                ),
                (
                    "status_data",
                    models.CharField(
                        blank=True, default="", max_length=20, verbose_name="Status Data"
                    ),
                ),
                (
                    "tahun_anggaran",
                    models.IntegerField(verbose_name="Tahun Anggaran"),
                ),
                (
                    "synced_at",
                    models.DateTimeField(verbose_name="Waktu Sinkronisasi"),
                ),
            ],
            options={
                "verbose_name": "Realisasi",
                "verbose_name_plural": "Realisasi",
                "db_table": "realisasi",
                "ordering": ["-tahun_anggaran", "satker", "-tgl_sp2d"],
            },
        ),
        migrations.AddIndex(
            model_name="realisasi",
            index=models.Index(
                fields=["satker", "tahun_anggaran"], name="realisasi_satker_tahun_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="realisasi",
            index=models.Index(fields=["tgl_sp2d"], name="realisasi_tgl_sp2d_idx"),
        ),
        migrations.AddIndex(
            model_name="realisasi",
            index=models.Index(fields=["tgl_spm"], name="realisasi_tgl_spm_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="realisasi",
            unique_together={("satker", "id_spp", "tahun_anggaran")},
        ),
    ]
