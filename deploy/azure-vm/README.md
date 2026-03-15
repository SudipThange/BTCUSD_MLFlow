# Azure VM deployment assets

This folder contains Linux deployment files for an Azure VM running Ubuntu or another `systemd`-based distribution. The deployment shape is:

- Django backend served by Gunicorn
- React frontend built with Vite
- Nginx serving the React build and proxying `/api/` to Django

## Files

- `install.sh`: installs Python, Node.js, Nginx, backend dependencies, React dependencies, builds the frontend, and enables the service.
- `start_backend.sh`: runtime entrypoint used by `systemd` to launch Gunicorn.
- `build_frontend.sh`: installs frontend packages and builds the Vite production bundle.
- `bootstrap_data_and_models.sh`: generates the dataset and trained artifacts when missing.
- `redeploy.sh`: pulls the latest code, refreshes backend/frontend dependencies, rebuilds the frontend, and restarts services.
- `btc-mlflow-dashboard.service`: `systemd` unit template for the Django/Gunicorn app.
- `nginx-btc-mlflow-dashboard.conf`: Nginx config that serves React and proxies `/api/`.
- `btc-mlflow-dashboard.env.example`: environment file template for the VM.

## Expected deployment shape

- App code checked out under `/opt/btc-mlflow-dashboard`
- Django/Gunicorn bound to `127.0.0.1:8000`
- React production build emitted to `/opt/btc-mlflow-dashboard/frontend/dist`
- Nginx exposed on port `80`
- Environment file stored at `/etc/default/btc-mlflow-dashboard`
- MLflow tracking stored in `/opt/btc-mlflow-dashboard/mlflow.db`

## Quick start

1. Clone the repo to `/opt/btc-mlflow-dashboard`.
2. Review and copy `btc-mlflow-dashboard.env.example` to `/etc/default/btc-mlflow-dashboard`.
3. Run:

```bash
cd /opt/btc-mlflow-dashboard
chmod +x deploy/azure-vm/*.sh
SERVER_NAME=your-domain.example APP_USER=azureuser APP_GROUP=azureuser ./deploy/azure-vm/install.sh
```

4. Verify:

```bash
systemctl status btc-mlflow-dashboard
curl http://127.0.0.1:8000/api/health/
curl http://your-domain.example/
sudo nginx -t
```
