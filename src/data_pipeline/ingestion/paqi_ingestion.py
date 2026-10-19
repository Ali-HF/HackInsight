"""
PAQI ICARTT Raw Ingestion and Metadata Parsing Module.
HackInsight 2026 - Member 1: Data Engineering.

Responsibilities:
1. Verify and register the raw NASA ICARTT file.
2. Parse header metadata (Lines 1-37), including sensor geolocation mappings in Line 21.
3. Extract sensor coordinate table (lat, lon, bounding-box assigned city).
"""

from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import re
import pandas as pd


class PAQIIngestionManager:
    """Handles raw PAQI ICARTT dataset ingestion, preservation checks, and header extraction."""

    def __init__(self, raw_icartt_path: Path):
        """
        Initialize the PAQI ingestion manager.

        Args:
            raw_icartt_path: Path to the local raw .ict file.
        """
        self.raw_icartt_path = Path(raw_icartt_path)
        if not self.raw_icartt_path.is_file():
            raise FileNotFoundError(f"Raw ICARTT file not found: {self.raw_icartt_path}")

    def extract_sensor_metadata(self) -> pd.DataFrame:
        """
        Parse ICARTT Header Line 21 to extract geographic coordinates for all sensors.
        """
        device_locations_line = ""
        with open(self.raw_icartt_path, "r", encoding="utf-8", errors="replace") as f:
            for idx, line in enumerate(f, start=1):
                if line.startswith("DEVICE LOCATIONS:"):
                    device_locations_line = line
                    break
                if idx > 37:
                    break

        if not device_locations_line:
            raise ValueError("DEVICE LOCATIONS line not found in ICARTT header!")

        pattern = re.findall(
            r"([0-9a-fA-F]+)\s*\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)",
            device_locations_line
        )

        records = []
        for sensor_id, lat_s, lon_s in pattern:
            lat = float(lat_s)
            lon = float(lon_s)
            city = self._assign_city(lat, lon)
            records.append({
                "sensor_id": sensor_id.strip(),
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "city": city
            })

        return pd.DataFrame(records)

    @staticmethod
    def _assign_city(lat: float, lon: float) -> str:
        """Assign Pakistani city boundary based on geographic coordinates."""
        if 24.7 <= lat <= 25.2 and 66.8 <= lon <= 67.5:
            return "Karachi"
        elif 31.3 <= lat <= 31.7 and 74.1 <= lon <= 74.6:
            return "Lahore"
        elif 33.5 <= lat <= 33.85 and 72.8 <= lon <= 73.3:
            return "Islamabad"
        elif 33.9 <= lat <= 34.15 and 71.4 <= lon <= 71.7:
            return "Peshawar"
        return "Other"

    def load_raw_table(
        self,
        target_cities: Optional[List[str]] = None,
        nrows: Optional[int] = None
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Load the ICARTT table filtered by sensor columns matching target cities.
        Returns: (df_filtered, metadata_df)
        """
        metadata_df = self.extract_sensor_metadata()
        if target_cities:
            metadata_df = metadata_df[metadata_df["city"].isin(target_cities)].copy()

        target_sensors = set(metadata_df["sensor_id"])

        # Read header columns line (Line 38, skiprows=37)
        sample_df = pd.read_csv(self.raw_icartt_path, skiprows=37, nrows=1, on_bad_lines="skip")
        all_cols = [c.strip() for c in sample_df.columns]

        selected_cols = ["datetime"] + [s for s in all_cols if s in target_sensors]

        df = pd.read_csv(
            self.raw_icartt_path,
            skiprows=37,
            usecols=selected_cols,
            na_values=[-9999, -9999.0, "-9999", "-9999.0"],
            nrows=nrows,
            on_bad_lines="skip",
            low_memory=False
        )
        df.columns = [c.strip() for c in df.columns]

        return df, metadata_df
