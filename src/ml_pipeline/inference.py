"""
Inference and Serving Module for 24-Hour PM2.5 Forecasting.
HackInsight 2026 - Member 2: Machine Learning.

This module provides a clean, reusable serving interface to generate
leakage-safe, 24-hour-ahead PM2.5 point forecasts and empirical prediction
intervals from incoming sensor history without retraining the model.
"""

from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import numpy as np
import pandas as pd

from src.ml_pipeline.features import build_ml_feature_set
from src.ml_pipeline.model import PM25Forecaster

REQUIRED_COLUMNS = [
    "timestamp_utc",
    "city",
    "sensor_id",
    "latitude",
    "longitude",
    "pm25"
]


def predict_pm25_24h(
    sensor_history_df: pd.DataFrame,
    model_path: Union[str, Path, PM25Forecaster] = "artifacts/models/pm25_forecaster.joblib",
    coverage: float = 0.80,
    as_of: Optional[Union[str, pd.Timestamp]] = None
) -> pd.DataFrame:
    """
    Generate 24-hour-ahead PM2.5 forecasts and prediction intervals for each sensor.

    For each sensor in the input DataFrame, produces the forecast corresponding
    to its latest available observation (or latest observation at or prior to `as_of`).

    Args:
        sensor_history_df: Historical and current observations containing:
            ['timestamp_utc', 'city', 'sensor_id', 'latitude', 'longitude', 'pm25'].
        model_path: Path to serialized PM25Forecaster joblib artifact or pre-loaded instance.
            Defaults to 'artifacts/models/pm25_forecaster.joblib'.
        coverage: Prediction interval coverage (0.80 for 80% interval, 0.90 for 90%).
            Defaults to 0.80.
        as_of: Optional reference cutoff timestamp. If provided, observations strictly
            after this time are excluded to evaluate forecasts as of that moment.

    Returns:
        DataFrame with columns:
        [
            'sensor_id',
            'city',
            'forecast_issue_time',
            'forecast_target_time',
            'current_pm25',
            'predicted_pm25_24h',
            'lower_80', (or lower_90 if coverage=0.90)
            'upper_80', (or upper_90 if coverage=0.90)
            'baseline_persistence'
        ]

    Raises:
        TypeError: If input is not a pandas DataFrame.
        ValueError: If required columns are missing, timestamps are malformed,
            coverage is unsupported, or a sensor has no valid PM2.5 observations.
        FileNotFoundError: If the specified model file does not exist.
    """
    # 1. Input type validation
    if not isinstance(sensor_history_df, pd.DataFrame):
        raise TypeError(f"Input 'sensor_history_df' must be a pandas DataFrame, got {type(sensor_history_df)}.")

    if sensor_history_df.empty:
        raise ValueError("Input 'sensor_history_df' is empty. At least one sensor observation is required.")

    # 2. Required columns validation
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in sensor_history_df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in input DataFrame: {missing_cols}. Expected: {REQUIRED_COLUMNS}")

    # 3. Coverage validation
    if not (np.isclose(coverage, 0.80) or np.isclose(coverage, 0.90)):
        raise ValueError(f"Unsupported coverage: {coverage}. Supported coverage values are 0.80 and 0.90.")

    # 4. Resolve and load model artifact
    if isinstance(model_path, PM25Forecaster):
        forecaster = model_path
    else:
        model_file = Path(model_path)
        if not model_file.is_file():
            # Check relative to repository root
            base_dir = Path(__file__).resolve().parent.parent.parent
            resolved_candidate = base_dir / model_path
            if resolved_candidate.is_file():
                model_file = resolved_candidate
            else:
                raise FileNotFoundError(f"Model artifact not found at '{model_path}' (resolved: '{model_file}').")
        forecaster = PM25Forecaster.load(model_file)

    # 5. Timestamp normalization & validation
    work_df = sensor_history_df.copy()
    try:
        work_df["timestamp_utc"] = pd.to_datetime(work_df["timestamp_utc"], utc=True)
    except Exception as exc:
        raise ValueError(f"Malformed or unparseable timestamps in 'timestamp_utc': {exc}") from exc

    if work_df["timestamp_utc"].isna().any():
        raise ValueError("Null or unparseable timestamps found in 'timestamp_utc'.")

    # 6. Apply optional 'as_of' cutoff for historical point-in-time evaluation
    if as_of is not None:
        try:
            cutoff = pd.to_datetime(as_of, utc=True)
        except Exception as exc:
            raise ValueError(f"Malformed 'as_of' timestamp: {as_of}") from exc
        work_df = work_df[work_df["timestamp_utc"] <= cutoff].copy()
        if work_df.empty:
            raise ValueError(f"No observations remain in 'sensor_history_df' on or before as_of='{as_of}'.")

    # 7. Check for duplicate timestamps within each sensor
    if work_df.duplicated(subset=["sensor_id", "timestamp_utc"]).any():
        raise ValueError("Duplicate (sensor_id, timestamp_utc) pairs found in input DataFrame.")

    # 8. Verify each sensor has at least one valid PM2.5 observation
    sensors = work_df["sensor_id"].unique()
    for sid in sensors:
        s_pm25 = work_df[work_df["sensor_id"] == sid]["pm25"].dropna()
        if s_pm25.empty:
            raise ValueError(f"Sensor '{sid}' has no valid non-null PM2.5 observations.")

    # 9. Sort by sensor_id and timestamp_utc to guarantee deterministic causal ordering
    sorted_df = work_df.sort_values(by=["sensor_id", "timestamp_utc"]).reset_index(drop=True)

    # 10. Construct features using the existing canonical ML feature pipeline
    # drop_lag1_nulls=False preserves all historical observations
    feat_df, feature_cols, _ = build_ml_feature_set(sorted_df, drop_lag1_nulls=False)

    # 11. Extract the latest available observation for each sensor
    latest_rows_idx = sorted_df.groupby("sensor_id")["timestamp_utc"].idxmax()
    latest_feat = feat_df.loc[latest_rows_idx].copy().reset_index(drop=True)

    # Verify current PM2.5 for the latest observation is non-null
    null_current_sensors = latest_feat[latest_feat["pm25"].isna()]["sensor_id"].tolist()
    if null_current_sensors:
        raise ValueError(
            f"Latest observation for sensor(s) {null_current_sensors} has null PM2.5. "
            "A valid current observation is required for autoregressive forecasting."
        )

    # 12. Model inference (features are strictly aligned with model.feature_names)
    X_latest = latest_feat[forecaster.feature_names]
    point_preds, lower_bounds, upper_bounds = forecaster.predict_interval(X_latest, coverage=coverage)

    # 13. Format output contract
    cov_key = int(round(coverage * 100))
    lower_col = f"lower_{cov_key}"
    upper_col = f"upper_{cov_key}"

    issue_times = pd.to_datetime(latest_feat["timestamp_utc"], utc=True)
    target_times = issue_times + pd.to_timedelta(24, unit="h")

    output_df = pd.DataFrame({
        "sensor_id": latest_feat["sensor_id"].values,
        "city": latest_feat["city"].values,
        "forecast_issue_time": issue_times.values,
        "forecast_target_time": target_times.values,
        "current_pm25": latest_feat["pm25"].values.round(2),
        "predicted_pm25_24h": np.round(point_preds, 2),
        lower_col: np.round(lower_bounds, 2),
        upper_col: np.round(upper_bounds, 2),
        "baseline_persistence": latest_feat["pm25"].values.round(2)
    })

    # Sort output consistently by city, sensor_id
    output_df = output_df.sort_values(by=["city", "sensor_id"]).reset_index(drop=True)
    return output_df
