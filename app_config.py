from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent


def _env_path(name: str, default: Path) -> Path:
    raw_value = os.getenv(name)
    if not raw_value:
        return default

    path = Path(raw_value).expanduser()
    if path.is_absolute():
        return path

    return (ROOT_DIR / path).resolve()


def _env_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: list[str]) -> list[str]:
    raw_value = os.getenv(name)
    if not raw_value:
        return default

    values = [item.strip() for item in raw_value.split(",") if item.strip()]
    return values or default


DATASET_PATH = _env_path("BTC_DATASET_PATH", ROOT_DIR / "btc_usd_2y_1h_data.csv")
MODEL_PATH = _env_path("BTC_MODEL_PATH", ROOT_DIR / "models" / "linear_regression_model.joblib")
ARIMA_MODEL_PATH = _env_path("BTC_ARIMA_MODEL_PATH", ROOT_DIR / "models" / "arima_model.pkl")
FRONTEND_DIR = _env_path("BTC_FRONTEND_DIR", ROOT_DIR / "frontend")

MLFLOW_TRACKING_URI = os.getenv(
    "MLFLOW_TRACKING_URI",
    f"sqlite:///{(ROOT_DIR / 'mlflow.db').as_posix()}",
)
MLFLOW_EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT_NAME", "btc_forecasting_pipeline")

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = _env_bool("API_RELOAD", False)
UVICORN_WORKERS = int(os.getenv("UVICORN_WORKERS", "2"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()

CORS_ALLOW_ORIGINS = _env_list("CORS_ALLOW_ORIGINS", ["*"])

DJANGO_DEBUG = _env_bool("DJANGO_DEBUG", False)
DJANGO_SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-this-before-production",
)
DJANGO_ALLOWED_HOSTS = _env_list(
    "DJANGO_ALLOWED_HOSTS",
    ["127.0.0.1", "localhost", "testserver"],
)
DJANGO_CSRF_TRUSTED_ORIGINS = _env_list("DJANGO_CSRF_TRUSTED_ORIGINS", [])
DJANGO_STATIC_ROOT = _env_path("DJANGO_STATIC_ROOT", ROOT_DIR / "staticfiles")
DJANGO_DB_PATH = _env_path("DJANGO_DB_PATH", ROOT_DIR / "db.sqlite3")
DJANGO_TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "UTC")
GUNICORN_WORKERS = int(os.getenv("GUNICORN_WORKERS", "3"))
REACT_APP_DIR = _env_path("REACT_APP_DIR", ROOT_DIR / "frontend")
REACT_BUILD_DIR = _env_path("REACT_BUILD_DIR", REACT_APP_DIR / "dist")
