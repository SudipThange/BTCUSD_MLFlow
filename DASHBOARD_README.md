# BTC Dashboard Stack

## Architecture

- Backend: Django
- Frontend: React with Vite
- Process manager: systemd
- App server: Gunicorn
- Reverse proxy and static serving: Nginx

## Backend local run

```powershell
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

## Frontend local run

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the backend API under `/api/` and Vite proxies that to the local Django server in development.

## Main API endpoints

- `GET /api/health/`
- `GET /api/dashboard/overview/`
- `GET /api/predict-next/`
- `GET /api/performance/?window=168`
- `GET /api/model-drift/?reference_window=720&current_window=168&rmse_alert_threshold=0.15`
- `GET /api/mlflow/runs/?limit=12`
- `GET /api/series/?points=300`

## Azure VM deployment

Deployment assets are available in `deploy/azure-vm/`.

Main files:

- `deploy/azure-vm/install.sh`
- `deploy/azure-vm/start_backend.sh`
- `deploy/azure-vm/build_frontend.sh`
- `deploy/azure-vm/bootstrap_data_and_models.sh`
- `deploy/azure-vm/btc-mlflow-dashboard.service`
- `deploy/azure-vm/nginx-btc-mlflow-dashboard.conf`
- `deploy/azure-vm/btc-mlflow-dashboard.env.example`

Typical VM verification:

- `systemctl status btc-mlflow-dashboard`
- `curl http://127.0.0.1:8000/api/health/`
- `curl http://your-domain.example/`
- `sudo nginx -t`
