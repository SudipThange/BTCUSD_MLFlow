from __future__ import annotations

from typing import Any, Callable

from django.http import JsonResponse
from django.views.decorators.http import require_GET

from dashboard_services import (
    DashboardServiceError,
    ValidationError,
    dashboard_overview_payload,
    health_payload,
    mlflow_runs_payload,
    model_drift_payload,
    performance_payload,
    predict_next_payload,
    series_payload,
)


def _json_error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"detail": message}, status=status)


def _parse_int(raw_value: str | None, default: int, *, minimum: int, maximum: int) -> int:
    if raw_value in (None, ""):
        return default

    try:
        value = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise ValidationError("Invalid integer query parameter.") from exc

    if value < minimum or value > maximum:
        raise ValidationError(f"Value must be between {minimum} and {maximum}.")
    return value


def _parse_float(
    raw_value: str | None,
    default: float,
    *,
    minimum: float,
    maximum: float,
) -> float:
    if raw_value in (None, ""):
        return default

    try:
        value = float(raw_value)
    except (TypeError, ValueError) as exc:
        raise ValidationError("Invalid numeric query parameter.") from exc

    if value < minimum or value > maximum:
        raise ValidationError(f"Value must be between {minimum} and {maximum}.")
    return value


def _handle_service_call(handler: Callable[[], dict[str, Any]]) -> JsonResponse:
    try:
        return JsonResponse(handler())
    except DashboardServiceError as exc:
        return _json_error(str(exc), exc.status_code)
    except Exception:
        return _json_error("Unexpected server error.", 500)


@require_GET
def health_view(request) -> JsonResponse:
    return _handle_service_call(health_payload)


@require_GET
def series_view(request) -> JsonResponse:
    def handler() -> dict[str, Any]:
        points = _parse_int(request.GET.get("points"), 300, minimum=50, maximum=2000)
        return series_payload(points=points)

    return _handle_service_call(handler)


@require_GET
def mlflow_runs_view(request) -> JsonResponse:
    def handler() -> dict[str, Any]:
        limit = _parse_int(request.GET.get("limit"), 12, minimum=1, maximum=50)
        return mlflow_runs_payload(limit=limit)

    return _handle_service_call(handler)


@require_GET
def predict_next_view(request) -> JsonResponse:
    return _handle_service_call(predict_next_payload)


@require_GET
def performance_view(request) -> JsonResponse:
    def handler() -> dict[str, Any]:
        window = _parse_int(request.GET.get("window"), 168, minimum=24, maximum=2000)
        return performance_payload(window=window)

    return _handle_service_call(handler)


@require_GET
def model_drift_view(request) -> JsonResponse:
    def handler() -> dict[str, Any]:
        reference_window = _parse_int(
            request.GET.get("reference_window"),
            720,
            minimum=120,
            maximum=5000,
        )
        current_window = _parse_int(
            request.GET.get("current_window"),
            168,
            minimum=24,
            maximum=1000,
        )
        rmse_alert_threshold = _parse_float(
            request.GET.get("rmse_alert_threshold"),
            0.15,
            minimum=0.01,
            maximum=1.0,
        )
        return model_drift_payload(
            reference_window=reference_window,
            current_window=current_window,
            rmse_alert_threshold=rmse_alert_threshold,
        )

    return _handle_service_call(handler)


@require_GET
def dashboard_overview_view(request) -> JsonResponse:
    return _handle_service_call(dashboard_overview_payload)
