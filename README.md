# BTCUSD MLflow Forecasting Dashboard

BTC-USD forecasting workflow with:

- Django JSON API backend
- React dashboard frontend built with Vite
- MLflow experiment tracking
- Azure VM deployment assets for Gunicorn + Nginx

## Project overview

This project contains:

- BTC-USD hourly data fetch and feature engineering
- dataset validation and EDA helpers
- model training for linear regression and ARIMA
- MLflow logging for runs, params, and metrics
- Django endpoints for prediction, performance, drift checks, and run history
- React dashboard for monitoring model behavior

## Project structure

- `manage.py`: Django entrypoint
- `btc_dashboard/`: Django project settings and URL routing
- `dashboard/`: Django app with API views and management command
- `dashboard_services.py`: shared analytics and MLflow service layer
- `fetch_data.py`: BTC-USD data download and feature engineering
- `clean_data.py`: dataset loading and EDA helpers
- `fit_models.py`: model training and artifact export
- `frontend/`: React + Vite frontend
- `deploy/azure-vm/`: Azure VM deployment scripts and configs
- `models/`: saved model artifacts
- `mlflow.db`: local MLflow tracking database
- `mlruns/`: local MLflow artifact store
- `frontend/package.json`: React frontend scripts
- `frontend/package-lock.json`: locked frontend dependency tree

## Requirements

- Python 3.10+
- Node.js 20+ for the React frontend
- virtual environment recommended for local development

## Backend setup

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py bootstrap_dashboard_assets
```

Run the Django API locally:

```powershell
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

API examples:

- `GET /api/health/`
- `GET /api/dashboard/overview/`
- `GET /api/predict-next/`
- `GET /api/performance/?window=168`
- `GET /api/model-drift/?reference_window=720&current_window=168&rmse_alert_threshold=0.15`
- `GET /api/mlflow/runs/?limit=12`
- `GET /api/series/?points=300`

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`.

Build the production frontend bundle:

```powershell
cd frontend
npm run build
```

Local URLs:

- React UI: `http://127.0.0.1:5173`
- Django API: `http://127.0.0.1:8000/api/health/`

## Data and model bootstrap

Fetch the dataset and train models:

```powershell
.\.venv\Scripts\python.exe fetch_data.py
.\.venv\Scripts\python.exe fit_models.py
```

Or use the Django management command:

```powershell
.\.venv\Scripts\python.exe manage.py bootstrap_dashboard_assets
```

## Azure VM deployment

Deployment assets are in `deploy/azure-vm/`.

Main deployment files:

- `deploy/azure-vm/install.sh`
- `deploy/azure-vm/start_backend.sh`
- `deploy/azure-vm/build_frontend.sh`
- `deploy/azure-vm/bootstrap_data_and_models.sh`
- `deploy/azure-vm/redeploy.sh`
- `deploy/azure-vm/btc-mlflow-dashboard.service`
- `deploy/azure-vm/nginx-btc-mlflow-dashboard.conf`
- `deploy/azure-vm/btc-mlflow-dashboard.env.example`

Recommended VM layout:

- app path: `/opt/btc-mlflow-dashboard`
- Django served by Gunicorn on `127.0.0.1:8000`
- React built to `frontend/dist`
- Nginx exposed on port `80`
- environment file: `/etc/default/btc-mlflow-dashboard`
- MLflow tracking database: `/opt/btc-mlflow-dashboard/mlflow.db`

Typical deployment flow:

```bash
git clone <your-repo-url> /opt/btc-mlflow-dashboard
cd /opt/btc-mlflow-dashboard
chmod +x deploy/azure-vm/*.sh
sudo cp deploy/azure-vm/btc-mlflow-dashboard.env.example /etc/default/btc-mlflow-dashboard
sudo nano /etc/default/btc-mlflow-dashboard
SERVER_NAME=your-domain.example APP_USER=azureuser APP_GROUP=azureuser ./deploy/azure-vm/install.sh
```

Before running `install.sh`, update `/etc/default/btc-mlflow-dashboard` with:

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `MLFLOW_TRACKING_URI` if you want a different backend
- any custom dataset or model paths

Useful post-deploy checks:

```bash
systemctl status btc-mlflow-dashboard
journalctl -u btc-mlflow-dashboard -n 100 --no-pager
curl http://127.0.0.1:8000/api/health/
curl http://your-domain.example/
```

For updates on the VM:

```bash
cd /opt/btc-mlflow-dashboard
./deploy/azure-vm/redeploy.sh
```

## Git ignore notes

Local-only files such as virtual environments, `.env` files, `node_modules`, `frontend/dist`, `db.sqlite3`, MLflow artifacts, generated CSVs, and model artifacts are excluded in `.gitignore`.
