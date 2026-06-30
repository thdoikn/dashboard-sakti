"""
log_activity() — the single entry point for recording an audit event.

Kept deliberately defensive: logging must never break the action it is
auditing, so any failure is swallowed (the audit trail is best-effort).
"""

import logging

from .models import ActivityLog

logger = logging.getLogger(__name__)


def _client_ip(request) -> str | None:
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _actor_snapshot(user) -> dict:
    """Snapshot the actor's identity so the log row stays readable forever."""
    if user is None or not getattr(user, "is_authenticated", False):
        return {
            "user": None,
            "actor_name": "Sistem / Tanpa Login",
            "actor_jabatan": "",
            "actor_unit": "",
            "actor_role": "",
        }
    unit = ""
    if getattr(user, "unit_eselon_ii", None):
        unit = user.unit_eselon_ii.nama
    elif getattr(user, "unit_eselon_i", None):
        unit = user.unit_eselon_i.nama
    return {
        "user": user,
        "actor_name": user.display_name,
        "actor_jabatan": getattr(user, "jabatan", "") or "",
        "actor_unit": unit,
        "actor_role": getattr(user, "role", "") or "",
    }


def log_activity(
    request,
    action: str,
    description: str = "",
    *,
    target_type: str = "",
    target_id: str = "",
    metadata: dict | None = None,
    user=None,
) -> None:
    """
    Record an audit event. Resolves the actor from `user` or `request.user`.

    Never raises — auditing must not interfere with the underlying request.
    """
    try:
        actor = user if user is not None else getattr(request, "user", None)
        snap = _actor_snapshot(actor)
        ActivityLog.objects.create(
            action=action,
            description=description,
            target_type=target_type,
            target_id=str(target_id) if target_id else "",
            metadata=metadata or {},
            ip_address=_client_ip(request),
            **snap,
        )
    except Exception:  # pragma: no cover - best-effort audit trail
        logger.exception("Failed to record activity log for action=%s", action)
