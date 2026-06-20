from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies: list = []

    operations = [
        migrations.CreateModel(
            name="Satker",
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
                    "kode_satker",
                    models.CharField(
                        help_text="6-digit SAKTI satker code (e.g. 999001)",
                        max_length=6,
                        unique=True,
                        verbose_name="Kode Satker",
                    ),
                ),
                (
                    "nama_satker",
                    models.CharField(max_length=255, verbose_name="Nama Satker"),
                ),
                (
                    "kode_kementerian",
                    models.CharField(
                        help_text="3-digit K/L code (e.g. 999 for OIKN)",
                        max_length=3,
                        verbose_name="Kode Kementerian/Lembaga",
                    ),
                ),
                (
                    "kode_kppn",
                    models.CharField(
                        help_text="3-digit KPPN (treasury office) code",
                        max_length=3,
                        verbose_name="Kode KPPN",
                    ),
                ),
                (
                    "aktif",
                    models.BooleanField(
                        default=True,
                        help_text="Satker aktif akan disertakan dalam sinkronisasi data SAKTI",
                        verbose_name="Aktif",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Satker",
                "verbose_name_plural": "Satker",
                "db_table": "satker",
                "ordering": ["kode_satker"],
            },
        ),
    ]
