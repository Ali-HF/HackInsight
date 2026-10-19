"""
Historical PM2.5 Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Retrieves actual historical PM2.5 observations across a time window.
Enforces zero lookahead hallucination.
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
import pandas as pd


def get_historical_pm25(
    city: str,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    sensor_id: Optional[str] = None,
    limit: int = 50,
    data_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve historical PM2.5 measurements for a city within a specified time range.

    Args:
        city: City name (e.g., 'Lahore', 'Karachi').
        start_time: ISO-formatted start timestamp (optional).
        end_time: ISO-formatted end timestamp (optional).
        sensor_id: Optional sensor ID to restrict query.
        limit: Maximum number of records to return (default 50).
        data_path: Optional custom file path.

    Returns:
        Dict with status, city, records count, observations list, and summary stats.
    """
    normalized_city = city.strip().capitalize() if city else ""
    supported_cities = ["Lahore", "Karachi"]

    if normalized_city not in supported_cities:
        return {
            "status": "unsupported_city",
            "city": city,
            "count": 0,
            "observations": [],
            "summary": {},
            "message": f"City '{city}' is not supported. Supported cities: {', '.join(supported_cities)}."
        }

    base_dir = Path(__file__).resolve().parent.parent.parent
    candidate_paths = [
        Path(data_path) if data_path else None,
        base_dir / "data" / "processed" / "gold_pm25_forecasting.parquet",
        base_dir / "artifacts" / "predictions" / "test_predictions.csv",
    ]

    df: Optional[pd.DataFrame] = None
    source_name = ""

    for path in candidate_paths:
        if path and path.is_file():
            try:
                if str(path).endswith(".parquet"):
                    df = pd.read_parquet(path)
                    source_name = f"gold_dataset ({path.name})"
                else:
                    df = pd.read_csv(path)
                    source_name = f"evaluated_observations ({path.name})"
                break
            except Exception:
                continue

    if df is None or df.empty:
        return {
            "status": "not_found",
            "city": normalized_city,
            "count": 0,
            "observations": [],
            "summary": {},
            "message": "No observation data available in storage."
        }

    # Filter city
    city_mask = df["city"].astype(str).str.strip().str.capitalize() == normalized_city
    filtered = df[city_mask].copy()

    if sensor_id:
        filtered = filtered[filtered["sensor_id"].astype(str) == str(sensor_id)]

    # Time filtering
    if "timestamp_utc" in filtered.columns:
        filtered["dt_parsed"] = pd.to_datetime(filtered["timestamp_utc"], errors="coerce")
        filtered = filtered.dropna(subset=["dt_parsed"])

        if start_time:
            st = pd.to_datetime(start_time, errors="coerce")
            if pd.notna(st):
                if st.tz is None and filtered["dt_parsed"].dt.tz is not None:
                    st = st.tz_localize("UTC")
                filtered = filtered[filtered["dt_parsed"] >= st]

        if end_time:
            et = pd.to_datetime(end_time, errors="coerce")
            if pd.notna(et):
                if et.tz is None and filtered["dt_parsed"].dt.tz is not None:
                    et = et.tz_localize("UTC")
                filtered = filtered[filtered["dt_parsed"] <= et]

        filtered = filtered.sort_values(by="dt_parsed")

    if filtered.empty:
        return {
            "status": "empty",
            "city": normalized_city,
            "count": 0,
            "observations": [],
            "summary": {},
            "message": f"No historical records found for {normalized_city} matching the criteria."
        }

    # Determine pm25 column
    pm_col = "pm25" if "pm25" in filtered.columns else ("actual" if "actual" in filtered.columns else "baseline")
    
    # Slice to limit
    sliced = filtered.tail(limit)

    observations = []
    for _, row in sliced.iterrows():
        val = row.get(pm_col)
        observations.append({
            "record_id": str(row.get("record_id", "")),
            "timestamp_utc": str(row.get("timestamp_utc", "")),
            "sensor_id": str(row.get("sensor_id", "")),
            "pm25": round(float(val), 2) if pd.notna(val) else None,
            "unit": "ug/m3"
        })

    valid_vals = [o["pm25"] for o in observations if o["pm25"] is not None]
    summary = {
        "mean_pm25": round(float(sum(valid_vals) / len(valid_vals)), 2) if valid_vals else None,
        "min_pm25": min(valid_vals) if valid_vals else None,
        "max_pm25": max(valid_vals) if valid_vals else None,
        "source": source_name,
        "sample_size": len(valid_vals)
    }

    return {
        "status": "success",
        "city": normalized_city,
        "count": len(observations),
        "observations": observations,
        "summary": summary,
        "message": f"Retrieved {len(observations)} historical records for {normalized_city}."
    }
