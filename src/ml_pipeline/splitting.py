"""
Chronological Splitting Module for PM2.5 Forecasting.
HackInsight 2026 - Member 2: Machine Learning.

Principles:
1. Strict chronological ordering: split strictly by time to prevent temporal leakage.
2. Temporal buffer gaps: enforce a 24-hour blackout between train/validation and
   validation/test to prevent auto-correlated boundary leakage.
3. Zero random splitting: no k-fold, no shuffled splitting.
4. Entity tracking: explicitly track sensors seen in training vs. sensors emerging
   only in validation or test periods (unseen entities).
5. Untouched test set: test split is preserved for final evaluation only.
"""

from typing import Dict, Any, Tuple, Set
import pandas as pd


def chronological_split(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    buffer_hours: int = 24,
    time_col: str = "timestamp_utc",
    sensor_col: str = "sensor_id"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Split the dataset chronologically into Train, Validation, and Test sets
    with temporal buffer gaps.

    Args:
        df: Input DataFrame containing timestamp and sensor columns.
        train_ratio: Proportion of unique time range for training (default: 0.70).
        val_ratio: Proportion of unique time range for validation (default: 0.15).
        buffer_hours: Hours of temporal buffer to exclude between splits.
        time_col: Name of datetime column (must be tz-aware UTC).
        sensor_col: Name of sensor identifier column.

    Returns:
        Tuple of (train_df, val_df, test_df, split_metadata_dict).
    """
    # Ensure sorted unique timestamps
    unique_ts = pd.Series(df[time_col].drop_duplicates().sort_values().values)
    n_ts = len(unique_ts)

    train_end_idx = int(n_ts * train_ratio)
    val_end_idx = int(n_ts * (train_ratio + val_ratio))

    train_cutoff = pd.to_datetime(unique_ts.iloc[train_end_idx], utc=True)
    val_start = train_cutoff + pd.Timedelta(buffer_hours, unit="h")
    val_cutoff = pd.to_datetime(unique_ts.iloc[val_end_idx], utc=True)
    test_start = val_cutoff + pd.Timedelta(buffer_hours, unit="h")

    # Masks
    train_mask = df[time_col] < train_cutoff
    val_mask = (df[time_col] >= val_start) & (df[time_col] < val_cutoff)
    test_mask = df[time_col] >= test_start

    train_df = df.loc[train_mask].copy().reset_index(drop=True)
    val_df = df.loc[val_mask].copy().reset_index(drop=True)
    test_df = df.loc[test_mask].copy().reset_index(drop=True)

    # Track sensor visibility
    train_sensors: Set[str] = set(train_df[sensor_col].unique())
    val_sensors: Set[str] = set(val_df[sensor_col].unique())
    test_sensors: Set[str] = set(test_df[sensor_col].unique())

    val_seen = val_sensors.intersection(train_sensors)
    val_unseen = val_sensors - train_sensors

    test_seen = test_sensors.intersection(train_sensors)
    test_unseen = test_sensors - train_sensors

    # Flag seen vs unseen in validation and test
    val_df["is_seen_sensor"] = val_df[sensor_col].isin(train_sensors).astype(int)
    test_df["is_seen_sensor"] = test_df[sensor_col].isin(train_sensors).astype(int)

    metadata = {
        "train": {
            "start": str(train_df[time_col].min()),
            "end": str(train_df[time_col].max()),
            "cutoff": str(train_cutoff),
            "rows": len(train_df),
            "sensors": len(train_sensors),
            "cities": train_df["city"].value_counts().to_dict()
        },
        "validation": {
            "start": str(val_df[time_col].min()),
            "end": str(val_df[time_col].max()),
            "cutoff": str(val_cutoff),
            "rows": len(val_df),
            "sensors": len(val_sensors),
            "seen_sensors_count": len(val_seen),
            "unseen_sensors_count": len(val_unseen),
            "seen_rows": int(val_df["is_seen_sensor"].sum()),
            "unseen_rows": int((val_df["is_seen_sensor"] == 0).sum()),
            "cities": val_df["city"].value_counts().to_dict()
        },
        "test": {
            "start": str(test_df[time_col].min()),
            "end": str(test_df[time_col].max()),
            "rows": len(test_df),
            "sensors": len(test_sensors),
            "seen_sensors_count": len(test_seen),
            "unseen_sensors_count": len(test_unseen),
            "seen_rows": int(test_df["is_seen_sensor"].sum()),
            "unseen_rows": int((test_df["is_seen_sensor"] == 0).sum()),
            "cities": test_df["city"].value_counts().to_dict()
        },
        "buffer_hours": buffer_hours,
        "train_buffer_dropped_rows": int(((df[time_col] >= train_cutoff) & (df[time_col] < val_start)).sum()),
        "val_buffer_dropped_rows": int(((df[time_col] >= val_cutoff) & (df[time_col] < test_start)).sum())
    }

    return train_df, val_df, test_df, metadata
