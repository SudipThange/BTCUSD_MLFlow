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

: "${REACT_APP_DIR:=${APP_HOME}/frontend}"
: "${VITE_API_BASE_URL:=/api}"

cd "${REACT_APP_DIR}"

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

VITE_API_BASE_URL="${VITE_API_BASE_URL}" npm run build
