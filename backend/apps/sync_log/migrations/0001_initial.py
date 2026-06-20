import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("satker", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SyncLog",
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
                    "dag_run_id",
                    models.CharField(
                        help_text="Airflow DAG run identifier",
                        max_length=255,
                        verbose_name="DAG Run ID",
                    ),
                ),
                (
                    "task_name",
                    models.CharField(
                        help_text="Airflow task ID (e.g. fetch_data_ang, normalize_and_load)",
                        max_length=255,
                        verbose_name="Nama Task",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("success", "Berhasil"),
                            ("failed", "Gagal"),
                            ("retrying", "Mencoba Ulang"),
                        ],
                        max_length=20,
                        verbose_name="Status",
                    ),
                ),
                (
                    "satker",
                    models.ForeignKey(
                        blank=True,
                        help_text="Diisi jika task ini terkait dengan satker tertentu",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sync_logs",
                        to="satker.satker",
                        verbose_name="Satker",
                    ),
                ),
                (
                    "row_count",
                    models.IntegerField(
                        blank=True,
                        null=True,
                        verbose_name="Jumlah Baris",
                    ),
                ),
                (
                    "error_message",
                    models.TextField(
                        blank=True, null=True, verbose_name="Pesan Error"
                    ),
                ),
                (
                    "started_at",
                    models.DateTimeField(verbose_name="Waktu Mulai"),
                ),
                (
                    "finished_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Waktu Selesai"
                    ),
                ),
            ],
            options={
                "verbose_name": "Sync Log",
                "verbose_name_plural": "Sync Logs",
                "db_table": "sync_log",
                "ordering": ["-started_at"],
            },
        ),
        migrations.AddIndex(
            model_name="synclog",
            index=models.Index(fields=["dag_run_id"], name="sync_log_dag_run_id_idx"),
        ),
        migrations.AddIndex(
            model_name="synclog",
            index=models.Index(fields=["started_at"], name="sync_log_started_at_idx"),
        ),
        migrations.AddIndex(
            model_name="synclog",
            index=models.Index(fields=["status"], name="sync_log_status_idx"),
        ),
    ]
