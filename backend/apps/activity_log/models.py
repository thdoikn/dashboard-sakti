"""
ActivityLog model — an audit trail of user-initiated actions.

Records who did what and when for transparency: Satker CRUD, data exports,
and logins. Actor identity is snapshotted onto each row (name, jabatan, unit)
so the log stays readable even if the user is later renamed or removed.
"""

from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """One user-initiated action. Append-only; never updated in place."""

    class Action(models.TextChoices):
        SATKER_CREATE     = "satker_create",     "Tambah Satker"
        SATKER_UPDATE     = "satker_update",     "Ubah Satker"
        SATKER_DEACTIVATE = "satker_deactivate", "Nonaktifkan Satker"
        SATKER_DELETE     = "satker_delete",     "Hapus Satker"
        EXPORT_EXCEL      = "export_excel",      "Unduh Data (Excel)"
        LOGIN             = "login",             "Login"

    # Nullable so an admin removing a user does not cascade-delete the audit
    # trail. The actor_* snapshot fields below preserve readability either way.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
        verbose_name="Pengguna",
    )

    # ── Actor snapshot (captured at action time) ──────────────────────────────
    actor_name    = models.CharField(max_length=255, blank=True, default="", verbose_name="Nama")
    actor_jabatan = models.CharField(max_length=255, blank=True, default="", verbose_name="Jabatan")
    actor_unit    = models.CharField(max_length=255, blank=True, default="", verbose_name="Unit/Direktorat")
    actor_role    = models.CharField(max_length=30,  blank=True, default="", verbose_name="Role")

    # ── What happened ─────────────────────────────────────────────────────────
    action = models.CharField(
        max_length=40,
        choices=Action.choices,
        db_index=True,
        verbose_name="Aksi",
    )
    description = models.CharField(
        max_length=512,
        blank=True,
        default="",
        verbose_name="Keterangan",
    )
    # Optional reference to the affected object (e.g. "satker" / "999001").
    target_type = models.CharField(max_length=50, blank=True, default="")
    target_id   = models.CharField(max_length=64, blank=True, default="")
    metadata    = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Alamat IP")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Waktu")

    class Meta:
        db_table = "activity_log"
        verbose_name = "Log Aktivitas"
        verbose_name_plural = "Log Aktivitas"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]

    def __str__(self) -> str:
        who = self.actor_name or "Sistem"
        return f"{who} — {self.get_action_display()} ({self.created_at:%Y-%m-%d %H:%M})"
