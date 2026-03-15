from __future__ import annotations

from pathlib import Path

from app_config import (
    DJANGO_ALLOWED_HOSTS,
    DJANGO_CSRF_TRUSTED_ORIGINS,
    DJANGO_DB_PATH,
    DJANGO_DEBUG,
    DJANGO_SECRET_KEY,
    DJANGO_STATIC_ROOT,
    DJANGO_TIME_ZONE,
)


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = DJANGO_SECRET_KEY
DEBUG = DJANGO_DEBUG
ALLOWED_HOSTS = DJANGO_ALLOWED_HOSTS
CSRF_TRUSTED_ORIGINS = DJANGO_CSRF_TRUSTED_ORIGINS

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "btc_dashboard.urls"

TEMPLATES: list[dict[str, object]] = []

WSGI_APPLICATION = "btc_dashboard.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(DJANGO_DB_PATH),
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = DJANGO_TIME_ZONE
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = str(DJANGO_STATIC_ROOT)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
