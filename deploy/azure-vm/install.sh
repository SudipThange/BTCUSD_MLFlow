#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

: "${APP_USER:=${SUDO_USER:-$USER}}"
: "${APP_GROUP:=${APP_USER}}"
: "${SERVER_NAME:=_}"
: "${PYTHON_BIN:=${APP_HOME}/.venv/bin/python}"
: "${API_PORT:=8000}"
: "${DJANGO_SETTINGS_MODULE:=btc_dashboard.settings}"
: "${INSTALL_NGINX:=1}"
: "${BOOTSTRAP_DATA:=1}"

sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip build-essential nginx curl

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

python3 -m venv "${APP_HOME}/.venv"
"${PYTHON_BIN}" -m pip install --upgrade pip wheel
"${PYTHON_BIN}" -m pip install -r "${APP_HOME}/requirements.txt"
export DJANGO_SETTINGS_MODULE
"${PYTHON_BIN}" "${APP_HOME}/manage.py" migrate --noinput
"${PYTHON_BIN}" "${APP_HOME}/manage.py" collectstatic --noinput

if [[ ! -f /etc/default/btc-mlflow-dashboard ]]; then
  TEMP_ENV_FILE="$(mktemp)"
  sed \
    -e "s|/opt/btc-mlflow-dashboard|${APP_HOME}|g" \
    "${APP_HOME}/deploy/azure-vm/btc-mlflow-dashboard.env.example" > "${TEMP_ENV_FILE}"
  sudo cp "${TEMP_ENV_FILE}" /etc/default/btc-mlflow-dashboard
  rm -f "${TEMP_ENV_FILE}"
fi

TEMP_SERVICE_FILE="$(mktemp)"
sed \
  -e "s|__APP_HOME__|${APP_HOME}|g" \
  -e "s|__APP_USER__|${APP_USER}|g" \
  -e "s|__APP_GROUP__|${APP_GROUP}|g" \
  "${APP_HOME}/deploy/azure-vm/btc-mlflow-dashboard.service" > "${TEMP_SERVICE_FILE}"
sudo cp "${TEMP_SERVICE_FILE}" /etc/systemd/system/btc-mlflow-dashboard.service
rm -f "${TEMP_SERVICE_FILE}"

if [[ "${INSTALL_NGINX}" == "1" ]]; then
  TEMP_NGINX_FILE="$(mktemp)"
  sed \
    -e "s|__SERVER_NAME__|${SERVER_NAME}|g" \
    -e "s|__APP_HOME__|${APP_HOME}|g" \
    -e "s|__API_PORT__|${API_PORT}|g" \
    "${APP_HOME}/deploy/azure-vm/nginx-btc-mlflow-dashboard.conf" > "${TEMP_NGINX_FILE}"
  sudo cp "${TEMP_NGINX_FILE}" /etc/nginx/sites-available/btc-mlflow-dashboard.conf
  rm -f "${TEMP_NGINX_FILE}"

  sudo ln -sf /etc/nginx/sites-available/btc-mlflow-dashboard.conf /etc/nginx/sites-enabled/btc-mlflow-dashboard.conf
  if [[ -f /etc/nginx/sites-enabled/default ]]; then
    sudo rm -f /etc/nginx/sites-enabled/default
  fi
  sudo nginx -t
  sudo systemctl enable nginx
  sudo systemctl restart nginx
fi

"${APP_HOME}/deploy/azure-vm/build_frontend.sh"

if [[ "${BOOTSTRAP_DATA}" == "1" ]]; then
  "${APP_HOME}/deploy/azure-vm/bootstrap_data_and_models.sh"
fi

sudo systemctl daemon-reload
sudo systemctl enable btc-mlflow-dashboard
sudo systemctl restart btc-mlflow-dashboard
