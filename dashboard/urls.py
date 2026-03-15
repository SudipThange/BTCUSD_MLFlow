from __future__ import annotations

from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health_view, name="health"),
    path("series/", views.series_view, name="series"),
    path("mlflow/runs/", views.mlflow_runs_view, name="mlflow-runs"),
    path("predict-next/", views.predict_next_view, name="predict-next"),
    path("performance/", views.performance_view, name="performance"),
    path("model-drift/", views.model_drift_view, name="model-drift"),
    path("dashboard/overview/", views.dashboard_overview_view, name="dashboard-overview"),
]
