"""
Current PM2.5 Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Retrieves the latest authoritative observed PM2.5 measurement from
processed/gold data or test evaluation records. Never hallucinates or invents data.
"""

from typing import Dict, Any, Optional
from pathlib import Path
import pandas as pd


def get_current_pm25(
    city: str,
    sensor_id: Optional[str] = None,
    data_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve the latest available PM2.5 observation for a specified city or sensor.

    Args:
        city: Name of the city (e.g. 'Lahore', 'Karachi').
        sensor_id: Optional sensor identifier.
        data_path: Optional override path for processed data / predictions.

    Returns:
        Dict containing:
            - status: 'success' | 'not_found' | 'unsupported_city'
            - city: Normalized city name
            - sensor_id: Sensor identifier
            - timestamp_utc: Observation timestamp
            - pm25: Observed PM2.5 concentration in ug/m3
            - unit: 'ug/m3'
            - source: Source dataset or sensor network
            - message: Descriptive message
    """
    normalized_city = city.strip().capitalize() if city else ""
    supported_cities = ["Lahore", "Karachi"]

    if normalized_city not in supported_cities:
        return {
            "status": "unsupported_city",
            "city": city,
            "sensor_id": sensor_id,
            "timestamp_utc": None,
            "pm25": None,
            "unit": "ug/m3",
            "source": None,
            "message": f"City '{city}' is not currently supported. Supported cities: {', '.join(supported_cities)}."
        }

    # Locate source file
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
            "sensor_id": sensor_id,
            "timestamp_utc": None,
            "pm25": None,
            "unit": "ug/m3",
            "source": None,
            "message": "No observation data available in storage."
        }

    # Filter by city (case-insensitive)
    city_mask = df["city"].astype(str).str.strip().str.capitalize() == normalized_city
    filtered = df[city_mask]

    if sensor_id:
        filtered = filtered[filtered["sensor_id"].astype(str) == str(sensor_id)]

    if filtered.empty:
        return {
            "status": "not_found",
            "city": normalized_city,
            "sensor_id": sensor_id,
            "timestamp_utc": None,
            "pm25": None,
            "unit": "ug/m3",
            "source": source_name,
            "message": f"No observations found for {normalized_city}" + (f" and sensor {sensor_id}" if sensor_id else "") + "."
        }

    # Sort chronologically by timestamp_utc
    filtered = filtered.sort_values(by="timestamp_utc")
    latest_row = filtered.iloc[-1]

    # Column name resolution for pm25 reading
    pm25_val = None
    if "pm25" in latest_row and pd.notna(latest_row["pm25"]):
        pm25_val = float(latest_row["pm25"])
    elif "actual" in latest_row and pd.notna(latest_row["actual"]):
        pm25_val = float(latest_row["actual"])
    elif "baseline" in latest_row and pd.notna(latest_row["baseline"]):
        pm25_val = float(latest_row["baseline"])

    record_id = str(latest_row.get("record_id", ""))
    return {
        "status": "success",
        "city": normalized_city,
        "sensor_id": str(latest_row.get("sensor_id", "")),
        "record_id": record_id,
        "timestamp_utc": str(latest_row.get("timestamp_utc", "")),
        "pm25": round(pm25_val, 2) if pm25_val is not None else None,
        "unit": "ug/m3",
        "source": source_name,
        "message": f"Latest observed PM2.5 in {normalized_city} is {round(pm25_val, 2) if pm25_val is not None else 'N/A'} ug/m3."
    }
