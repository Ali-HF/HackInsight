"""
ML Forecast Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Integrates directly with Member 2's predict_pm25_24h() serving function.
Does NOT re-implement model or feature engineering logic.
"""

from typing import Dict, Any, Optional
from pathlib import Path
import pandas as pd
import numpy as np

from src.ml_pipeline.inference import predict_pm25_24h


def get_pm25_forecast(
    city: str,
    sensor_id: Optional[str] = None,
    coverage: float = 0.80,
    model_path: Optional[str] = None,
    history_df: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Generate or retrieve a 24-hour ahead PM2.5 forecast using the certified ML model.

    Args:
        city: Target city ('Lahore' or 'Karachi').
        sensor_id: Optional sensor ID to restrict inference.
        coverage: Uncertainty interval coverage (0.80 or 0.90).
        model_path: Optional path to serialized model artifact.
        history_df: Optional sensor observation history. If omitted, loaded from gold/predictions dataset.

    Returns:
        Dict with status, forecast details (point prediction, intervals, baseline, timestamp), or error explanation.
    """
    normalized_city = city.strip().capitalize() if city else ""
    supported_cities = ["Lahore", "Karachi"]

    if normalized_city not in supported_cities:
        return {
            "status": "unsupported_city",
            "city": city,
            "sensor_id": sensor_id,
            "forecast": None,
            "message": f"City '{city}' is not supported for forecasting. Supported cities: {', '.join(supported_cities)}."
        }

    # Load sensor history if not provided
    if history_df is None or history_df.empty:
        base_dir = Path(__file__).resolve().parent.parent.parent
        candidate_paths = [
            base_dir / "data" / "processed" / "gold_pm25_forecasting.parquet",
            base_dir / "artifacts" / "predictions" / "test_predictions.csv"
        ]
        
        loaded_df: Optional[pd.DataFrame] = None
        for p in candidate_paths:
            if p.is_file():
                try:
                    if str(p).endswith(".parquet"):
                        loaded_df = pd.read_parquet(p)
                    else:
                        loaded_df = pd.read_csv(p)
                    break
                except Exception:
                    continue

        if loaded_df is None or loaded_df.empty:
            return {
                "status": "missing_data",
                "city": normalized_city,
                "sensor_id": sensor_id,
                "forecast": None,
                "message": "Historical sensor observations unavailable to compute forecast features."
            }
        history_df = loaded_df

    # Filter by city
    city_mask = history_df["city"].astype(str).str.strip().str.capitalize() == normalized_city
    df_city = history_df[city_mask].copy()

    if sensor_id:
        df_city = df_city[df_city["sensor_id"].astype(str) == str(sensor_id)]

    if df_city.empty:
        return {
            "status": "not_found",
            "city": normalized_city,
            "sensor_id": sensor_id,
            "forecast": None,
            "message": f"No sensor records found for {normalized_city} to execute forecasting."
        }

    # Format dataframe to satisfy Member 2's REQUIRED_COLUMNS:
    # ["timestamp_utc", "city", "sensor_id", "latitude", "longitude", "pm25"]
    if "pm25" not in df_city.columns and "actual" in df_city.columns:
        df_city["pm25"] = df_city["actual"]

    if "latitude" not in df_city.columns:
        df_city["latitude"] = 31.5204 if normalized_city == "Lahore" else 24.8607
    if "longitude" not in df_city.columns:
        df_city["longitude"] = 74.3587 if normalized_city == "Lahore" else 67.0011

    # Call Member 2's predict_pm25_24h directly
    resolved_model_path = model_path or "artifacts/models/pm25_forecaster.joblib"
    try:
        preds_df = predict_pm25_24h(df_city, model_path=resolved_model_path, coverage=coverage)
    except Exception as exc:
        return {
            "status": "error",
            "city": normalized_city,
            "sensor_id": sensor_id,
            "forecast": None,
            "message": f"Forecasting engine execution failed: {str(exc)}"
        }

    if preds_df.empty:
        return {
            "status": "error",
            "city": normalized_city,
            "sensor_id": sensor_id,
            "forecast": None,
            "message": "No forecast generated."
        }

    # Aggregate or select representative forecast (e.g. centroid or primary sensor)
    cov_key = int(round(coverage * 100))
    lower_col = f"lower_{cov_key}"
    upper_col = f"upper_{cov_key}"

    # Return summary of forecasts across available sensors
    mean_pred = round(float(preds_df["predicted_pm25_24h"].mean()), 2)
    mean_curr = round(float(preds_df["current_pm25"].mean()), 2)
    mean_lower = round(float(preds_df[lower_col].mean()), 2)
    mean_upper = round(float(preds_df[upper_col].mean()), 2)
    mean_baseline = round(float(preds_df["baseline_persistence"].mean()), 2)

    primary_row = preds_df.iloc[0]

    return {
        "status": "success",
        "city": normalized_city,
        "sensor_id": sensor_id or str(primary_row["sensor_id"]),
        "sensors_evaluated": len(preds_df),
        "forecast_issue_time": str(primary_row["forecast_issue_time"]),
        "forecast_target_time": str(primary_row["forecast_target_time"]),
        "current_pm25": mean_curr,
        "predicted_pm25_24h": mean_pred,
        f"lower_{cov_key}": mean_lower,
        f"upper_{cov_key}": mean_upper,
        "baseline_persistence": mean_baseline,
        "coverage": coverage,
        "unit": "ug/m3",
        "message": (
            f"24h forecast for {normalized_city}: {mean_pred} ug/m3 "
            f"(80% CI: [{mean_lower}, {mean_upper}] ug/m3, persistence baseline: {mean_baseline} ug/m3)."
        )
    }
