"""
Feature Engineering Module for PM2.5 24-Hour-Ahead Forecasting.
HackInsight 2026 - Member 2: Machine Learning.

Principles:
1. Strict causality: all features use ONLY data available at forecast issue time t.
2. Sensor isolation: lags and rolling statistics are calculated strictly per-sensor
   and never cross sensor boundaries.
3. Time-grid alignment: lags are calculated against an hourly datetime grid, ensuring
   lag_1h is truly (t - 1h) rather than a simple row shift across missing time gaps.
4. Weather exclusion: NASA weather columns are quarantined and excluded from the primary
   model due to unresolved 4-5h timestamp misalignment.
5. Sensor ID exclusion: sensor_id is excluded from predictive features to prevent memorization
   and ensure model generalizability to unseen sensors.
"""

from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd


DEFAULT_LAGS = [1, 3, 6, 12, 24, 48, 72, 168]
DEFAULT_ROLLING_WINDOWS = [6, 12, 24, 72, 168]
DEFAULT_ROLLING_STATS = ["mean", "std", "min", "max"]


def extract_temporal_features(df: pd.DataFrame, time_col: str = "timestamp_utc") -> pd.DataFrame:
    """
    Extract calendar and cyclical time features from UTC timestamps.
    """
    ts = pd.to_datetime(df[time_col], utc=True)
    out = df.copy()

    out["hour"] = ts.dt.hour
    out["dayofweek"] = ts.dt.dayofweek
    out["month"] = ts.dt.month
    out["is_weekend"] = ts.dt.dayofweek.isin([5, 6]).astype(int)

    # Cyclical trigonometric encodings
    out["hour_sin"] = np.sin(2 * np.pi * out["hour"] / 24.0)
    out["hour_cos"] = np.cos(2 * np.pi * out["hour"] / 24.0)
    out["month_sin"] = np.sin(2 * np.pi * out["month"] / 12.0)
    out["month_cos"] = np.cos(2 * np.pi * out["month"] / 12.0)

    # Season mapping: DJF=1 (Winter/Smog), MAM=2 (Spring/Pre-monsoon),
    # JJA=3 (Monsoon), SON=4 (Autumn/Early Smog)
    season_map = {
        12: 1, 1: 1, 2: 1,
        3: 2, 4: 2, 5: 2,
        6: 3, 7: 3, 8: 3,
        9: 4, 10: 4, 11: 4
    }
    out["season"] = out["month"].map(season_map).astype(int)

    # Smog season indicator (Oct - Feb: months 10, 11, 12, 1, 2)
    out["is_smog_season"] = out["month"].isin([10, 11, 12, 1, 2]).astype(int)

    return out


def engineer_sensor_features(
    df: pd.DataFrame,
    lags: List[int] = DEFAULT_LAGS,
    rolling_windows: List[int] = DEFAULT_ROLLING_WINDOWS,
    rolling_stats: List[str] = DEFAULT_ROLLING_STATS
) -> pd.DataFrame:
    """
    Compute causal lags and rolling statistics independently for each sensor.
    Uses an hourly reindexed grid to prevent gap contamination.
    """
    dfs = []
    sensors = df["sensor_id"].unique()

    for sensor_id in sensors:
        sdf = df[df["sensor_id"] == sensor_id].sort_values("timestamp_utc").copy()
        min_t = sdf["timestamp_utc"].min()
        max_t = sdf["timestamp_utc"].max()

        # Build full hourly index from start to end for this sensor
        full_idx = pd.date_range(min_t, max_t, freq="1h", tz="UTC")
        s_series = sdf.set_index("timestamp_utc")["pm25"].reindex(full_idx)

        # Causal lags: value observed exactly L hours prior to t
        for l in lags:
            col_name = f"pm25_lag_{l}h"
            lagged_vals = s_series.shift(l).reindex(sdf["timestamp_utc"]).values
            sdf[col_name] = lagged_vals

        # Causal rolling windows: statistics computed over windows ending at t (closed='right')
        for w in rolling_windows:
            min_p = max(1, w // 4)
            r = s_series.rolling(window=w, min_periods=min_p)

            if "mean" in rolling_stats:
                sdf[f"pm25_roll_mean_{w}h"] = r.mean().reindex(sdf["timestamp_utc"]).values
            if "std" in rolling_stats:
                sdf[f"pm25_roll_std_{w}h"] = r.std().reindex(sdf["timestamp_utc"]).values
            if "min" in rolling_stats:
                sdf[f"pm25_roll_min_{w}h"] = r.min().reindex(sdf["timestamp_utc"]).values
            if "max" in rolling_stats:
                sdf[f"pm25_roll_max_{w}h"] = r.max().reindex(sdf["timestamp_utc"]).values

        dfs.append(sdf)

    res_df = pd.concat(dfs, ignore_index=True)
    return res_df


def build_ml_feature_set(
    df: pd.DataFrame,
    drop_lag1_nulls: bool = True
) -> Tuple[pd.DataFrame, List[str], Dict[str, Any]]:
    """
    Build the complete ML feature table from the raw Gold dataset.

    Args:
        df: Input Gold dataset (16 columns).
        drop_lag1_nulls: If True, drop rows where the immediate 1h lag is missing
            (e.g., initial sensor startup hours). HistGradientBoosting natively
            handles NaNs in longer lags.

    Returns:
        Tuple of (feature_df, feature_names_list, audit_metadata_dict).
    """
    initial_rows = len(df)

    # 1. Verification of keys and ordering
    if df.duplicated(subset=["sensor_id", "timestamp_utc"]).any():
        raise ValueError("Duplicate (sensor_id, timestamp_utc) pairs found in input dataset!")

    sorted_df = df.sort_values(by=["sensor_id", "timestamp_utc"]).reset_index(drop=True)

    # 2. Sensor-isolated lag and rolling statistics
    feat_df = engineer_sensor_features(sorted_df)

    # 3. Calendar and cyclical temporal features
    feat_df = extract_temporal_features(feat_df)

    # 4. Location encoding (binary city indicator: Lahore=0, Karachi=1)
    feat_df["city_code"] = (feat_df["city"] == "Karachi").astype(int)

    # 5. Define strictly safe feature list
    # Notice: Excludes sensor_id (prevent memorization)
    # Notice: Excludes NASA weather (quarantined due to time-standard issue)
    # Notice: Excludes pm25_target_24h (future value)
    # Notice: Excludes pm25_baseline_persistence (redundant with current pm25)
    base_features = [
        "pm25",
        "city_code",
        "latitude",
        "longitude",
        "hour_sin",
        "hour_cos",
        "month_sin",
        "month_cos",
        "dayofweek",
        "season",
        "is_weekend",
        "is_smog_season"
    ]

    lag_features = [f"pm25_lag_{l}h" for l in DEFAULT_LAGS]
    roll_features = [
        f"pm25_roll_{stat}_{w}h"
        for w in DEFAULT_ROLLING_WINDOWS
        for stat in DEFAULT_ROLLING_STATS
    ]

    feature_cols = base_features + lag_features + roll_features

    # 6. Row filtering audit
    rows_before_filter = len(feat_df)
    if drop_lag1_nulls:
        # Require immediate 1-hour lag to ensure active sensor autoregressive state
        valid_mask = feat_df["pm25_lag_1h"].notna()
        modeling_df = feat_df[valid_mask].copy().reset_index(drop=True)
        rows_dropped = rows_before_filter - len(modeling_df)
        drop_reason = "Missing immediate 1-hour lag (sensor initialization or post-outage startup)"
    else:
        modeling_df = feat_df.copy()
        rows_dropped = 0
        drop_reason = "None (all rows retained)"

    audit = {
        "initial_gold_rows": initial_rows,
        "modeling_rows": len(modeling_df),
        "rows_removed": rows_dropped,
        "removal_reason": drop_reason,
        "feature_count": len(feature_cols),
        "feature_names": feature_cols,
        "excluded_columns": [
            "pm25_target_24h (future target)",
            "pm25_baseline_persistence (redundant with pm25)",
            "sensor_id (prevent overfitting to seen entities)",
            "T2M, RH2M, WS10M, WD10M, PS, PRECTOTCORR, T2MDEW (quarantined weather)"
        ]
    }

    return modeling_df, feature_cols, audit
