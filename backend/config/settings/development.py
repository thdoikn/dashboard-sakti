"""
Development settings for SAKTI-OIKN Integration Platform.

Extends base.py with development-specific overrides:
- DEBUG = True
- Load .env file for local development
- CORS allows all origins (restricted to frontend origin in production)
"""

import os
from pathlib import Path

from dotenv import load_dotenv

from .base import *  # noqa: F401, F403

# Load .env file from the backend directory or project root for local development
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    # Try project root (one level up from backend/)
    _env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)

# Override database settings after loading .env
DATABASES["default"].update(  # noqa: F405
    {
        "NAME": os.environ.get("MYSQL_DATA_DB", "sakti_data"),
        "USER": os.environ.get("MYSQL_DATA_USER", "sakti_app"),
        "PASSWORD": os.environ.get("MYSQL_DATA_PASSWORD", ""),
        "HOST": os.environ.get("MYSQL_HOST", "localhost"),
        "PORT": os.environ.get("MYSQL_PORT", "3306"),
    }
)

DEBUG = True

ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,backend"
).split(",")

# CORS: allow all origins in development so the frontend Vite dev server can connect
CORS_ALLOW_ALL_ORIGINS = True

# Enable Django Debug Toolbar or similar tools here if needed in future

# Use in-memory cache in development to avoid Redis dependency
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
