"""
Testing / QA settings for SAKTI-OIKN.

Inherits ALL production hardening (security headers, secure cookies, restricted
CORS, etc.) but RE-ENABLES the AUTH_DISABLED toggle that production.py
force-disables — so QA can run the dashboard without SSO.

Use ONLY for testing. On the VM:
    DJANGO_SETTINGS_MODULE=config.settings.testing
    AUTH_DISABLED=true
Flip back to config.settings.production to restore SSO.

NEVER use this module for the real production deployment.
"""

import os

from .production import *  # noqa: F401,F403

# Re-honor the env flag that production.py force-disables.
AUTH_DISABLED = os.environ.get("AUTH_DISABLED", "false").lower() == "true"

if AUTH_DISABLED:
    REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = [  # noqa: F405
        "rest_framework.permissions.AllowAny",
    ]
