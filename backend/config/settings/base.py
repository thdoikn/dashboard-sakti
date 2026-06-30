"""
Base Django settings for SAKTI-OIKN Integration Platform.

This module contains settings shared across all environments.
Environment-specific overrides live in development.py and production.py.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
# SECURITY WARNING: keep the secret key secret in production!
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-default-key-change-in-production")

# ── Application definition ────────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "mozilla_django_oidc",
]

LOCAL_APPS = [
    "apps.organisasi",
    "apps.accounts",
    "apps.satker",
    "apps.anggaran",
    "apps.realisasi",
    "apps.capaian",
    "apps.sync_log",
    "apps.activity_log",
    "apps.api",
    "apps.export",
    "apps.mock_sakti",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # Must be before CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    # SessionRefresh MUST come after AuthenticationMiddleware (mozilla_django_oidc requirement)
    "mozilla_django_oidc.middleware.SessionRefresh",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────
# Django connects ONLY to sakti_data, never to airflow_metadata.
# Airflow uses a separate connection string configured in airflow/Dockerfile.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("MYSQL_DATA_DB", "sakti_data"),
        "USER": os.environ.get("MYSQL_DATA_USER", "sakti_app"),
        "PASSWORD": os.environ.get("MYSQL_DATA_PASSWORD", ""),
        "HOST": os.environ.get("MYSQL_HOST", "mysql"),
        "PORT": os.environ.get("MYSQL_PORT", "3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# ── Password validation ───────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── Internationalization ──────────────────────────────────────────────────────
LANGUAGE_CODE = "id-ID"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

# ── Static files ──────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── Default primary key ───────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Custom User model ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

# ── Authentication backends ───────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    "apps.accounts.oidc.SaktiOIDCBackend",       # SSO via Keycloak
    "django.contrib.auth.backends.ModelBackend",  # Fallback (Django admin)
]

# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}

# ── Auth toggle (TESTING ONLY) ────────────────────────────────────────────────
# AUTH_DISABLED=true opens the whole API (AllowAny) and makes the frontend
# auto-land on the dashboard with a mock user — for QA without SSO.
# SAFETY: production.py force-disables this, so it can only take effect under a
# non-production settings module (use config.settings.testing for no-auth QA).
AUTH_DISABLED = os.environ.get("AUTH_DISABLED", "false").lower() == "true"

if AUTH_DISABLED:
    REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = [
        "rest_framework.permissions.AllowAny",
    ]

# ── SimpleJWT ─────────────────────────────────────────────────────────────────
from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    # Sessions last at most one day: the SPA has no silent-refresh, so once the
    # access token expires the next request 401s and the user must sign in via
    # SSO again. Keeping the refresh token to the same window avoids a longer-
    # lived credential lingering in the browser.
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
}

# ── SSO / OpenID Connect (Keycloak) ──────────────────────────────────────────
OIDC_RP_CLIENT_ID     = os.environ.get("OIDC_RP_CLIENT_ID", "")
OIDC_RP_CLIENT_SECRET = os.environ.get("OIDC_RP_CLIENT_SECRET", "")

OIDC_OP_AUTHORIZATION_ENDPOINT = os.environ.get("OIDC_OP_AUTHORIZATION_ENDPOINT", "")
OIDC_OP_TOKEN_ENDPOINT         = os.environ.get("OIDC_OP_TOKEN_ENDPOINT", "")
OIDC_OP_USER_ENDPOINT          = os.environ.get("OIDC_OP_USER_ENDPOINT", "")
OIDC_OP_JWKS_ENDPOINT          = os.environ.get("OIDC_OP_JWKS_ENDPOINT", "")

OIDC_RP_SIGN_ALGO       = os.environ.get("OIDC_RP_SIGN_ALGO", "RS256")
OIDC_USE_PKCE           = False   # confidential client uses client_secret
OIDC_STORE_ACCESS_TOKEN = True
OIDC_USERNAME_ALGO      = "apps.accounts.oidc.generate_username"
OIDC_AUTHENTICATION_CALLBACK_URL = "oidc-callback"

# ── SAKTI API Client ──────────────────────────────────────────────────────────
SAKTI_API_BASE_URL = os.environ.get(
    "SAKTI_API_BASE_URL",
    "http://localhost:8000/sitp-monsakti-omspan/webservice",
)
SAKTI_GATEWAY_API_KEY = os.environ.get("SAKTI_GATEWAY_API_KEY", "dummy-key-for-dev")

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "sakti_client": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
