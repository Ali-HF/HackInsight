"""
Deterministic Data Cleaning & Normalization Module.
HackInsight 2026 - Member 1: Data Engineering.

Responsibilities:
1. Reshape wide PAQI matrix (210 columns) to canonical long format.
2. Canonicalize timestamps to UTC (preserving exact moment without loss).
3. Handle sentinels (-9999 -> NaN) without silent target imputation.
4. Filter/flag records according to explicit, auditable rules.
"""

from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import pandas as pd
import numpy as np


class DataCleaner:
    """Executes deterministic cleaning transformations and preserves record provenance."""

    def __init__(self, interim_dir: Path):
        """
        Initialize the DataCleaner.

        Args:
            interim_dir: Destination path for cleaned intermediate artifacts.
        """
        self.interim_dir = Path(interim_dir)
        self.interim_dir.mkdir(parents=True, exist_ok=True)

    def reshape_to_long_format(
        self,
        wide_df: pd.DataFrame,
        sensor_metadata_df: pd.DataFrame,
        time_col: str = "datetime",
        start_year: Optional[int] = 2022,
        end_year: Optional[int] = 2024
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Melt the wide ICARTT matrix into a canonical observation table.
        """
        df = wide_df.copy()
        df[time_col] = pd.to_datetime(df[time_col], utc=True)

        if start_year and end_year:
            df = df[(df[time_col].dt.year >= start_year) & (df[time_col].dt.year <= end_year)].copy()

        sensor_cols = [c for c in df.columns if c != time_col]

        # Melt to long format
        melted = pd.melt(
            df,
            id_vars=[time_col],
            value_vars=sensor_cols,
            var_name="sensor_id",
            value_name="pm25"
        )

        initial_rows = len(melted)

        # Drop rows where pm25 is missing/sentinel (do not impute target)
        melted = melted[melted["pm25"].notna()].copy()
        non_null_rows = len(melted)

        # Merge with sensor metadata to attach city, lat, lon
        merged = pd.merge(melted, sensor_metadata_df, on="sensor_id", how="inner")

        # Standardize column names
        merged = merged.rename(columns={time_col: "timestamp_utc"})

        # Flag negative values and extreme spikes (> 1500 ug/m3)
        neg_count = int((merged["pm25"] < 0).sum())
        extreme_count = int((merged["pm25"] > 1500).sum())

        # Exclude negative readings (sensor optical malfunction)
        cleaned = merged[merged["pm25"] >= 0].copy()

        audit = {
            "initial_melted_rows": initial_rows,
            "valid_pm25_readings": non_null_rows,
            "negative_readings_dropped": neg_count,
            "extreme_readings_flagged": extreme_count,
            "final_cleaned_rows": len(cleaned)
        }

        return cleaned, audit

    @staticmethod
    def apply_hygroscopic_calibration(df: pd.DataFrame, pm_col: str = "pm25", rh_col: str = "RH2M") -> pd.DataFrame:
        """
        US EPA / Barkjohn Nephelometer Relative Humidity Calibration.
        Corrects for aerosol hygroscopic swelling at elevated humidity (RH > 40%),
        eliminating false optical PM2.5 spikes caused by water-droplet light scatter.
        """
        out = df.copy()
        if rh_col not in out.columns or pm_col not in out.columns:
            return out

        rh = out[rh_col].fillna(50.0).clip(0.0, 99.0)
        # Empirical hygroscopic growth factor (EPA Barkjohn calibration)
        swelling_factor = np.where(
            rh > 80.0,
            1.0 + 0.25 * ((rh / 100.0) ** 2) / (1.0 - (rh / 100.0)),
            1.0 + 0.15 * ((rh / 100.0) ** 2)
        )
        out[f"{pm_col}_calibrated"] = (out[pm_col] / swelling_factor).clip(lower=1.0)
        return out

    @staticmethod
    def filter_stuck_sensors(
        df: pd.DataFrame,
        time_col: str = "timestamp_utc",
        sensor_col: str = "sensor_id",
        pm_col: str = "pm25",
        window_hours: int = 6,
        variance_threshold: float = 0.05
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Screen for optical sensor flatlines and stuck reading malfunctions.
        Identifies sensors repeating identical readings for >= window_hours.
        """
        out = df.sort_values(by=[sensor_col, time_col]).copy()
        rolling_std = out.groupby(sensor_col)[pm_col].transform(
            lambda s: s.rolling(window=window_hours, min_periods=window_hours).std()
        )
        is_stuck = (rolling_std < variance_threshold) & (out[pm_col] > 0.0)
        stuck_count = int(is_stuck.sum())

        cleaned = out[~is_stuck].copy().reset_index(drop=True)
        return cleaned, {"stuck_readings_removed": stuck_count, "remaining_rows": len(cleaned)}

    @staticmethod
    def decompose_wind_vectors(
        df: pd.DataFrame,
        speed_col: str = "WS10M",
        dir_col: str = "WD10M"
    ) -> pd.DataFrame:
        """
        Decomposes circular wind angles (0-360) into orthogonal u (East-West) and v (North-South) vectors.
        Resolves the 0/360 boundary discontinuity for decision trees.
        """
        out = df.copy()
        if speed_col in out.columns and dir_col in out.columns:
            rad = np.deg2rad(out[dir_col].fillna(0.0))
            out["wind_u"] = -out[speed_col].fillna(0.0) * np.sin(rad)
            out["wind_v"] = -out[speed_col].fillna(0.0) * np.cos(rad)
        return out

    @staticmethod
    def compute_inversion_indices(
        df: pd.DataFrame,
        temp_col: str = "T2M",
        dew_col: str = "T2MDEW"
    ) -> pd.DataFrame:
        """
        Calculates Dew Point Depression (T - Tdew) as atmospheric stability and fog proxy.
        Shallow depression (T ~ Tdew) signifies near-surface thermal inversion and aerosol trapping.
        """
        out = df.copy()
        if temp_col in out.columns and dew_col in out.columns:
            out["dew_point_depression"] = (out[temp_col] - out[dew_col]).clip(lower=0.0)
        return out

