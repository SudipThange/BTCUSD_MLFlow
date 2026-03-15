from __future__ import annotations

from django.core.management.base import BaseCommand

from app_config import ARIMA_MODEL_PATH, DATASET_PATH, MODEL_PATH
from fetch_data import get_btc_usd_hourly_data
from fit_models import train_and_save_models


class Command(BaseCommand):
    help = "Generate the dataset and trained model artifacts required by the dashboard."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--force-refresh-data",
            action="store_true",
            help="Re-download the BTC dataset even if the CSV already exists.",
        )
        parser.add_argument(
            "--force-retrain-models",
            action="store_true",
            help="Retrain the models even if the saved artifacts already exist.",
        )

    def handle(self, *args, **options) -> None:
        force_refresh_data = options["force_refresh_data"]
        force_retrain_models = options["force_retrain_models"]

        if force_refresh_data or not DATASET_PATH.exists():
            self.stdout.write("Fetching BTC-USD dataset...")
            get_btc_usd_hourly_data(csv_path=DATASET_PATH)
        else:
            self.stdout.write("Dataset already present; skipping fetch.")

        if force_retrain_models or not MODEL_PATH.exists() or not ARIMA_MODEL_PATH.exists():
            self.stdout.write("Training forecast models...")
            train_and_save_models(csv_path=DATASET_PATH)
        else:
            self.stdout.write("Model artifacts already present; skipping training.")

        self.stdout.write(self.style.SUCCESS("Dashboard assets are ready."))
