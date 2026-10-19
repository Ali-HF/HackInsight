"""
Gold Dataset Processing & Alignment Module.
HackInsight 2026 - Member 1 to Member 2 Handoff Interface.

Responsibilities:
1. Temporally and spatially align PM2.5 ground observations with NASA POWER meteorology.
2. Prevent lookahead leakage (future weather/PM2.5 strictly separated from forecast features).
3. Construct stable unique observation IDs (record_id).
4. Build canonical Gold parquet tables for ML training and baseline validation.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import json
import hashlib
import pandas as pd
import numpy as np


class GoldDatasetBuilder:
    """Constructs the canonical, leakage-safe Gold dataset for forecasting."""

    def __init__(self, processed_dir: Path):
        """
        Initialize the GoldDatasetBuilder.

        Args:
            processed_dir: Destination path (e.g. data/processed/).
        """
        self.processed_dir = Path(processed_dir)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def parse_nasa_power_json(self, json_file_path: Path, city_name: str) -> pd.DataFrame:
        """
        Parse raw NASA POWER JSON response into hourly weather DataFrame.
        """
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        params = data["properties"]["parameter"]
        timestamps = sorted(list(next(iter(params.values())).keys()))

        records = []
        for ts_str in timestamps:
            # Format: YYYYMMDDHH -> ISO UTC datetime
            # ts_str is e.g. '2023010100'
            dt = pd.to_datetime(ts_str, format="%Y%m%d%H", utc=True)
            row = {
                "timestamp_utc": dt,
                "city": city_name
            }
            for param_name, values in params.items():
                val = values.get(ts_str, np.nan)
                # NASA POWER sentinel for missing is -999.0
                row[param_name] = np.nan if val in [-999.0, -999] else val

            records.append(row)

        return pd.DataFrame(records)

    def load_all_nasa_power(self, raw_power_dir: Path) -> pd.DataFrame:
        """
        Load and concatenate all raw NASA POWER JSON files.
        """
        dfs = []
        for p in Path(raw_power_dir).glob("nasa_power_hourly_*.json"):
            # Filename convention: nasa_power_hourly_{city}_{start}_{end}.json
            parts = p.stem.split("_")
            city = parts[3].capitalize()
            dfs.append(self.parse_nasa_power_json(p, city))

        if not dfs:
            raise FileNotFoundError(f"No NASA POWER JSON files found in {raw_power_dir}")

        weather_df = pd.concat(dfs, ignore_index=True)
        weather_df = weather_df.drop_duplicates(subset=["timestamp_utc", "city"]).sort_values(
            by=["city", "timestamp_utc"]
        )
        return weather_df

    def align_weather_and_pollution(
        self,
        cleaned_pm25_df: pd.DataFrame,
        weather_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Merge cleaned hourly PM2.5 observations with NASA POWER hourly weather covariates.
        """
        df = pd.merge(
            cleaned_pm25_df,
            weather_df,
            on=["timestamp_utc", "city"],
            how="inner"
        )
        return df

    def construct_forecasting_target(
        self,
        df: pd.DataFrame,
        horizon_hours: int = 24
    ) -> pd.DataFrame:
        """
        Create 24h-ahead forecasting target and persistence baseline without future leakage.
        """
        # Ensure timestamp is datetime UTC
        df = df.copy()
        df["timestamp_utc"] = pd.to_datetime(df["timestamp_utc"], utc=True)

        # Baseline persistence: predicted PM2.5 for t+24 is current PM2.5 at t
        df["pm25_baseline_persistence"] = df["pm25"]

        # To find exact ground target at t + 24 hours, create a lookup of (city, sensor_id, timestamp_utc)
        target_lookup = df[["city", "sensor_id", "timestamp_utc", "pm25"]].copy()
        target_lookup["lookup_time"] = target_lookup["timestamp_utc"] - pd.Timedelta(hours=horizon_hours)
        target_lookup = target_lookup.rename(columns={"pm25": "pm25_target_24h"})

        # Join so that row at time t matches target from time t + 24h
        gold_df = pd.merge(
            df,
            target_lookup[["city", "sensor_id", "lookup_time", "pm25_target_24h"]],
            left_on=["city", "sensor_id", "timestamp_utc"],
            right_on=["city", "sensor_id", "lookup_time"],
            how="inner"
        ).drop(columns=["lookup_time"])

        # Stable unique observation identifier: SHA256(city_sensor_timestamp)[:16]
        def make_record_id(row):
            key = f"{row['city']}_{row['sensor_id']}_{row['timestamp_utc'].isoformat()}"
            return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]

        gold_df["record_id"] = gold_df.apply(make_record_id, axis=1)

        # Reorder columns logically
        lead_cols = ["record_id", "timestamp_utc", "city", "sensor_id", "latitude", "longitude", "pm25", "pm25_baseline_persistence", "pm25_target_24h"]
        weather_cols = [c for c in gold_df.columns if c not in lead_cols]
        gold_df = gold_df[lead_cols + weather_cols].sort_values(by=["city", "sensor_id", "timestamp_utc"]).reset_index(drop=True)

        return gold_df

    def export_gold_parquet(
        self,
        gold_df: pd.DataFrame,
        filename: str = "gold_pm25_forecasting.parquet"
    ) -> Path:
        """
        Export final Gold table to Parquet.
        """
        out_path = self.processed_dir / filename
        gold_df.to_parquet(out_path, index=False, engine="pyarrow")
        return out_path
