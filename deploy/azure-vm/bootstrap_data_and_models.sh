#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

if [[ -f /etc/default/btc-mlflow-dashboard ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/default/btc-mlflow-dashboard
  set +a
elif [[ -f "${APP_HOME}/.env.azure" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_HOME}/.env.azure"
  set +a
fi

: "${PYTHON_BIN:=${APP_HOME}/.venv/bin/python}"
: "${FORCE_REFRESH_DATA:=0}"
: "${FORCE_RETRAIN_MODELS:=0}"
: "${DJANGO_SETTINGS_MODULE:=btc_dashboard.settings}"

cd "${APP_HOME}"

export DJANGO_SETTINGS_MODULE

COMMAND_ARGS=("${APP_HOME}/manage.py" "bootstrap_dashboard_assets")

if [[ "${FORCE_REFRESH_DATA}" == "1" ]]; then
  COMMAND_ARGS+=("--force-refresh-data")
fi

if [[ "${FORCE_RETRAIN_MODELS}" == "1" ]]; then
  COMMAND_ARGS+=("--force-retrain-models")
fi

"${PYTHON_BIN}" "${COMMAND_ARGS[@]}"
