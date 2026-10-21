"""
Strict 18-of-24 Statistical Validity Rule for Daily Aggregations.
HackInsight 2026 - Data Processing Quality Standards.

Calculates certified daily aggregations according to international and national standards:
- PKT midnight-to-midnight (UTC+5) day definition.
- Daily means require at least 18 valid (non-null, non-flagged) hours per 24-hour period.
- Days with < 18 hours are assigned NaN daily mean with validity_flag="insufficient_hours".
- Produces companion dataset: data/processed/daily_station_summary.parquet.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger("processing.daily_validity")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
DEFAULT_DAILY_SUMMARY_PATH = PROCESSED_DIR / "daily_station_summary.parquet"


def compute_daily_validity(
    df: pd.DataFrame,
    min_hours: int = 18,
    save_path: Optional[Path | str] = None,
) -> pd.DataFrame:
    """
    Compute statistically certified daily station aggregations using the 18/24 rule.

    Args:
        df: Input DataFrame containing hourly PM2.5 observations.
            Expected columns: timestamp_utc, pm25, and station identifier (sensor_id or station_id).
        min_hours: Minimum valid hours required to certify a daily aggregate (default: 18).
        save_path: Optional destination to write daily_station_summary.parquet.

    Returns:
        DataFrame of daily station summaries with validity_flag and stats.
    """
    if df.empty:
        empty_cols = [
            "station_id", "city", "pkt_date", "n_total_hours", "n_valid_hours",
            "is_valid_day", "validity_flag", "pm25_mean", "pm25_min", "pm25_max"
        ]
        return pd.DataFrame(columns=empty_cols)

    df_work = df.copy()

    # Identify station column
    station_col = None
    for cand in ["sensor_id", "station_id", "station_slug", "location_id"]:
        if cand in df_work.columns:
            station_col = cand
            break
    if not station_col:
        station_col = "sensor_id"
        df_work[station_col] = "default_station"

    # Identify timestamp column and convert to PKT (UTC + 5 hours)
    if "timestamp_utc" in df_work.columns:
        ts_utc = pd.to_datetime(df_work["timestamp_utc"], utc=True)
    elif "timestamp" in df_work.columns:
        ts_utc = pd.to_datetime(df_work["timestamp"], utc=True)
    else:
        raise ValueError("Input DataFrame missing required timestamp column (timestamp_utc).")

    df_work["timestamp_pkt"] = ts_utc + pd.Timedelta(hours=5)
    df_work["pkt_date"] = df_work["timestamp_pkt"].dt.date.astype(str)

    # Determine validity mask (valid if not null, not negative, and not flagged if flag exists)
    valid_mask = df_work["pm25"].notna() & (df_work["pm25"] >= 0.0)
    if "is_flagged" in df_work.columns:
        valid_mask = valid_mask & (~df_work["is_flagged"].astype(bool))

    df_work["_is_valid_hour"] = valid_mask

    # Weather columns to aggregate if present
    weather_cols = [c for c in ["T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"] if c in df_work.columns]

    daily_records = []
    # Group by station and PKT calendar date
    for (st_id, pkt_d), group in df_work.groupby([station_col, "pkt_date"]):
        n_total = len(group)
        valid_grp = group[group["_is_valid_hour"]]
        n_valid = len(valid_grp)

        is_valid = n_valid >= min_hours
        validity_flag = "valid" if is_valid else "insufficient_hours"

        city = group["city"].iloc[0] if "city" in group.columns else "Unknown"
        lat = group["latitude"].iloc[0] if "latitude" in group.columns else np.nan
        lon = group["longitude"].iloc[0] if "longitude" in group.columns else np.nan

        if is_valid and n_valid > 0:
            pm25_vals = valid_grp["pm25"]
            pm25_mean = float(pm25_vals.mean())
            pm25_min = float(pm25_vals.min())
            pm25_max = float(pm25_vals.max())
            pm25_std = float(pm25_vals.std()) if len(pm25_vals) > 1 else 0.0
        else:
            pm25_mean = np.nan
            pm25_min = np.nan
            pm25_max = np.nan
            pm25_std = np.nan

        row_dict = {
            "station_id": str(st_id),
            "sensor_id": str(st_id),
            "city": city,
            "latitude": lat,
            "longitude": lon,
            "pkt_date": pkt_d,
            "n_total_hours": n_total,
            "n_valid_hours": n_valid,
            "is_valid_day": is_valid,
            "validity_flag": validity_flag,
            "pm25_mean": pm25_mean,
            "pm25_min": pm25_min,
            "pm25_max": pm25_max,
            "pm25_std": pm25_std,
        }

        # Average weather covariates for the day
        for w_col in weather_cols:
            w_vals = group[w_col].dropna()
            row_dict[f"{w_col}_daily_mean"] = float(w_vals.mean()) if len(w_vals) > 0 else np.nan

        daily_records.append(row_dict)

    daily_df = pd.DataFrame(daily_records)
    if not daily_df.empty:
        daily_df = daily_df.sort_values(["station_id", "pkt_date"]).reset_index(drop=True)

    # Export companion dataset if save_path or default specified
    out_path = Path(save_path) if save_path else None
    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        daily_df.to_parquet(out_path, index=False)
        logger.info(f"Saved daily summary ({len(daily_df)} records) to {out_path}")

    return daily_df


def build_and_save_daily_summary(
    gold_path: Optional[Path | str] = None,
    output_path: Path = DEFAULT_DAILY_SUMMARY_PATH,
    min_hours: int = 18,
) -> Path:
    """Build and save daily_station_summary.parquet from gold dataset."""
    gold_file = Path(gold_path) if gold_path else (PROCESSED_DIR / "gold_pm25_forecasting.parquet")
    if not gold_file.exists():
        gold_file = PROCESSED_DIR / "gold.parquet"

    if not gold_file.exists():
        raise FileNotFoundError(f"Gold dataset not found at {gold_file}")

    df_gold = pd.read_parquet(gold_file)
    compute_daily_validity(df_gold, min_hours=min_hours, save_path=output_path)
    return output_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    out = build_and_save_daily_summary()
    print(f"Daily station summary built successfully at {out}")
