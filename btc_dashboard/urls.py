from __future__ import annotations

from django.http import JsonResponse
from django.urls import include, path


urlpatterns = [
    path("api/", include("dashboard.urls")),
    path("", lambda request: JsonResponse({"service": "btc-dashboard-api"})),
]
