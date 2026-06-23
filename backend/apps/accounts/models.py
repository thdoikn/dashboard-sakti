"""
Custom User model for SAKTI-OIKN Integration Platform.

Extends AbstractUser to add OIKN-specific profile fields that are synced
from Keycloak on every SSO login. Organisational unit fields link to the
EselonI / EselonII master data models.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model.  Identified by email (case-insensitive) via OIDC;
    username is auto-generated from the email prefix.

    Fields prefixed with 'raw_' hold the original string from Keycloak for
    auditing; the FK fields are the resolved references used for filtering/display.
    """

    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", "Super Admin"
        STAFF = "staff", "Staff"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STAFF,
        verbose_name="Role",
    )

    # ── Employee profile from Keycloak ────────────────────────────────────────
    nip = models.CharField(
        max_length=30, blank=True, default="", verbose_name="NIP"
    )
    jabatan = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Jabatan"
    )

    # Raw strings as received from Keycloak (kept for debugging / fuzzy re-match)
    raw_direktorat = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Direktorat (raw SSO)",
        help_text="Original value from Keycloak unit_kerja claim",
    )
    raw_kedeputian = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Kedeputian (raw SSO)",
        help_text="Original value from Keycloak satuan_kerja claim",
    )

    # Resolved FK references matched from the raw strings above
    unit_eselon_ii = models.ForeignKey(
        "organisasi.EselonII",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pengguna",
        verbose_name="Unit Eselon II (Direktorat/Biro)",
    )
    unit_eselon_i = models.ForeignKey(
        "organisasi.EselonI",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pengguna",
        verbose_name="Unit Eselon I (Kedeputian/Sekretariat)",
    )

    class Meta:
        db_table = "accounts_user"
        verbose_name = "Pengguna"
        verbose_name_plural = "Pengguna"
        ordering = ["role", "-last_login"]

    def __str__(self) -> str:
        return self.get_full_name() or self.username

    @property
    def display_name(self) -> str:
        return self.get_full_name() or self.username
