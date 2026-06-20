import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("satker", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CapaianRO",
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
                        related_name="capaian_set",
                        to="satker.satker",
                        verbose_name="Satker",
                    ),
                ),
                (
                    "sub_output_kode",
                    models.CharField(max_length=50, verbose_name="Kode Sub-Output (RO)"),
                ),
                (
                    "kode_periode",
                    models.CharField(
                        help_text="Format: YYYY-MM (contoh: 2026-01)",
                        max_length=7,
                        verbose_name="Kode Periode",
                    ),
                ),
                (
                    "total_realisasi_sub_output",
                    models.DecimalField(
                        blank=True,
                        decimal_places=4,
                        max_digits=19,
                        null=True,
                        verbose_name="Total Realisasi Sub-Output",
                    ),
                ),
                (
                    "total_progress_capaian_ro",
                    models.FloatField(
                        blank=True,
                        null=True,
                        verbose_name="Total Progress Capaian RO (%)",
                    ),
                ),
                (
                    "anggaran_belanja",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=19,
                        null=True,
                        verbose_name="Anggaran Belanja (Rp)",
                    ),
                ),
                (
                    "realisasi_belanja",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=19,
                        null=True,
                        verbose_name="Realisasi Belanja (Rp)",
                    ),
                ),
                (
                    "synced_at",
                    models.DateTimeField(verbose_name="Waktu Sinkronisasi"),
                ),
            ],
            options={
                "verbose_name": "Capaian RO",
                "verbose_name_plural": "Capaian RO",
                "db_table": "capaian_ro",
                "ordering": ["-kode_periode", "satker", "sub_output_kode"],
            },
        ),
        migrations.AddIndex(
            model_name="capaianro",
            index=models.Index(
                fields=["satker", "kode_periode"], name="capaian_ro_satker_periode_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="capaianro",
            index=models.Index(fields=["kode_periode"], name="capaian_ro_periode_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="capaianro",
            unique_together={("satker", "sub_output_kode", "kode_periode")},
        ),
    ]
