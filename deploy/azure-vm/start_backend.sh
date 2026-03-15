#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

if [[ -f /etc/default/btc-mlflow-dashboard ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/default/btc-mlflow-dashboard
  set +a
fi

: "${PYTHON_BIN:=${APP_HOME}/.venv/bin/python}"
: "${API_HOST:=127.0.0.1}"
: "${API_PORT:=8000}"
: "${GUNICORN_WORKERS:=3}"
: "${LOG_LEVEL:=info}"
: "${DJANGO_SETTINGS_MODULE:=btc_dashboard.settings}"

export DJANGO_SETTINGS_MODULE

cd "${APP_HOME}"

exec "${PYTHON_BIN}" -m gunicorn btc_dashboard.wsgi:application \
  --bind "${API_HOST}:${API_PORT}" \
  --workers "${GUNICORN_WORKERS}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  --log-level "${LOG_LEVEL}"
