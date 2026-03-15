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
: "${DJANGO_SETTINGS_MODULE:=btc_dashboard.settings}"
: "${RUN_BOOTSTRAP_ON_REDEPLOY:=0}"

cd "${APP_HOME}"

git pull --ff-only
"${PYTHON_BIN}" -m pip install -r "${APP_HOME}/requirements.txt"
export DJANGO_SETTINGS_MODULE
"${PYTHON_BIN}" "${APP_HOME}/manage.py" migrate --noinput
"${PYTHON_BIN}" "${APP_HOME}/manage.py" collectstatic --noinput
"${APP_HOME}/deploy/azure-vm/build_frontend.sh"

if [[ "${RUN_BOOTSTRAP_ON_REDEPLOY}" == "1" ]]; then
  "${APP_HOME}/deploy/azure-vm/bootstrap_data_and_models.sh"
fi

sudo systemctl restart btc-mlflow-dashboard
sudo systemctl reload nginx
