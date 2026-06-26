"""
Production settings for SAKTI-OIKN Integration Platform.

Extends base.py with production-specific overrides:
- DEBUG = False
- CORS restricted to the actual frontend origin (not *)
- Security settings tightened
"""

import os

from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")

# CORS: restrict to the actual React frontend origin only
# Set CORS_ALLOWED_ORIGINS in the production .env to the real frontend URL
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost").split(",")
    if origin.strip()
]

# Security hardening for production — aligned with Acunetix / OWASP scan requirements
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN"

# Tell Django it's behind the nginx reverse proxy
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Session security — TLS is terminated upstream (Cloudflare) and nginx forwards
# X-Forwarded-Proto, so SECURE_PROXY_SSL_HEADER lets Django mark cookies Secure.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# Prevent caching of sensitive API responses
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Use a proper cache backend in production (Redis recommended, falls back to local)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
