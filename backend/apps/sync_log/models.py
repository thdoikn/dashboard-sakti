"""
SyncLog model.

Records the result of each Airflow DAG task run. Used by the dashboard's
sync status indicator (/api/sync-status/) and for operational monitoring
by the DKB team.
"""

from django.db import models

from apps.satker.models import Satker


class SyncLog(models.Model):
    """
    Audit log of each Airflow task execution for the sakti_daily_sync DAG.

    Written at the end of each DAG run by the log_sync_result task.
    The DKB team uses this to monitor pipeline health and diagnose failures.
    """

    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_RETRYING = "retrying"
    STATUS_CHOICES = [
        (STATUS_SUCCESS, "Berhasil"),
        (STATUS_FAILED, "Gagal"),
        (STATUS_RETRYING, "Mencoba Ulang"),
    ]

    dag_run_id = models.CharField(
        max_length=255,
        verbose_name="DAG Run ID",
        help_text="Airflow DAG run identifier",
    )
    task_name = models.CharField(
        max_length=255,
        verbose_name="Nama Task",
        help_text="Airflow task ID (e.g. fetch_data_ang, normalize_and_load)",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        verbose_name="Status",
    )
    satker = models.ForeignKey(
        Satker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_logs",
        verbose_name="Satker",
        help_text="Diisi jika task ini terkait dengan satker tertentu",
    )
    row_count = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Jumlah Baris",
        help_text="Jumlah baris yang berhasil di-upsert ke database",
    )
    error_message = models.TextField(
        null=True,
        blank=True,
        verbose_name="Pesan Error",
    )
    started_at = models.DateTimeField(verbose_name="Waktu Mulai")
    finished_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Waktu Selesai",
    )

    class Meta:
        db_table = "sync_log"
        verbose_name = "Sync Log"
        verbose_name_plural = "Sync Logs"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["dag_run_id"]),
            models.Index(fields=["started_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.dag_run_id} / {self.task_name} — {self.status}"
