import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("satker", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Referensi",
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
                    "jenis",
                    models.CharField(
                        help_text="Tipe kode: program/kegiatan/output/sub_output/komponen/akun",
                        max_length=50,
                        verbose_name="Jenis Referensi",
                    ),
                ),
                (
                    "kode",
                    models.CharField(max_length=255, verbose_name="Kode"),
                ),
                (
                    "uraian",
                    models.TextField(
                        help_text="Nama/deskripsi lengkap dari kode tersebut",
                        verbose_name="Uraian",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Referensi",
                "verbose_name_plural": "Referensi",
                "db_table": "referensi",
                "ordering": ["jenis", "kode"],
            },
        ),
        migrations.CreateModel(
            name="Anggaran",
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
                        related_name="anggaran_set",
                        to="satker.satker",
                        verbose_name="Satker",
                    ),
                ),
                (
                    "kode_program",
                    models.CharField(max_length=10, verbose_name="Kode Program"),
                ),
                (
                    "kode_kegiatan",
                    models.CharField(max_length=10, verbose_name="Kode Kegiatan"),
                ),
                (
                    "kode_output",
                    models.CharField(max_length=10, verbose_name="Kode Output"),
                ),
                (
                    "kode_suboutput",
                    models.CharField(
                        blank=True, default="", max_length=10, verbose_name="Kode Sub-Output"
                    ),
                ),
                (
                    "kode_komponen",
                    models.CharField(max_length=10, verbose_name="Kode Komponen"),
                ),
                (
                    "kode_akun",
                    models.CharField(max_length=10, verbose_name="Kode Akun"),
                ),
                (
                    "kode_item",
                    models.CharField(
                        help_text="Kode gabungan yang menjadi identifier unik item anggaran",
                        max_length=50,
                        verbose_name="Kode Item",
                    ),
                ),
                (
                    "uraian_item",
                    models.TextField(blank=True, default="", verbose_name="Uraian Item"),
                ),
                (
                    "volume_keg",
                    models.DecimalField(
                        blank=True,
                        decimal_places=4,
                        max_digits=19,
                        null=True,
                        verbose_name="Volume Kegiatan",
                    ),
                ),
                (
                    "sat_keg",
                    models.CharField(
                        blank=True, default="", max_length=20, verbose_name="Satuan Kegiatan"
                    ),
                ),
                (
                    "harga_sat",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=19,
                        null=True,
                        verbose_name="Harga Satuan (Rp)",
                    ),
                ),
                (
                    "total",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=19,
                        verbose_name="Total Anggaran (Rp)",
                    ),
                ),
                (
                    "kode_sts_history",
                    models.CharField(
                        help_text="Status history code from refSts — identifies the revision/version",
                        max_length=20,
                        verbose_name="Kode STS History",
                    ),
                ),
                (
                    "tahun_anggaran",
                    models.IntegerField(verbose_name="Tahun Anggaran"),
                ),
                (
                    "synced_at",
                    models.DateTimeField(
                        help_text="Timestamp ketika data ini terakhir di-sync dari SAKTI",
                        verbose_name="Waktu Sinkronisasi",
                    ),
                ),
            ],
            options={
                "verbose_name": "Anggaran",
                "verbose_name_plural": "Anggaran",
                "db_table": "anggaran",
                "ordering": ["-tahun_anggaran", "satker", "kode_program", "kode_kegiatan"],
            },
        ),
        migrations.AddIndex(
            model_name="referensi",
            index=models.Index(fields=["jenis", "kode"], name="referensi_jenis_kode_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="referensi",
            unique_together={("jenis", "kode")},
        ),
        migrations.AddIndex(
            model_name="anggaran",
            index=models.Index(
                fields=["satker", "tahun_anggaran"], name="anggaran_satker_tahun_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="anggaran",
            index=models.Index(
                fields=["kode_program", "kode_kegiatan", "kode_output"],
                name="anggaran_program_hierarki_idx",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="anggaran",
            unique_together={("satker", "kode_item", "kode_sts_history", "tahun_anggaran")},
        ),
    ]
