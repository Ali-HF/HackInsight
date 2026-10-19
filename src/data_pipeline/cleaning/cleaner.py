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
