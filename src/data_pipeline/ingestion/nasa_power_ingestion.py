"""
NASA POWER Hourly Meteorological Ingestion Module.
HackInsight 2026 - Member 1: Data Engineering.

Responsibilities:
1. Fetch hourly surface meteorology parameters via NASA POWER REST API.
2. Preserve raw response artifacts (JSON / CSV) unchanged in data/raw/nasa_power/.
3. Log request parameters, checksums, and fetch timestamps to manifest.
"""

from typing import Dict, Any, List
from pathlib import Path


class NASAPowerIngestionManager:
    """Manages NASA POWER hourly meteorological data acquisition and raw preservation."""

    DEFAULT_PARAMETERS = ["T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"]
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point"

    def __init__(self, raw_output_dir: Path):
        """
        Initialize the NASA POWER ingestion manager.

        Args:
            raw_output_dir: Destination path (e.g., data/raw/nasa_power/).
        """
        # TODO: Store destination directory and ensure it exists
        pass

    def build_query_url(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        parameters: List[str]
    ) -> str:
        """
        Construct the NASA POWER REST endpoint URL.

        Logic:
        1. Validate latitude (-90 to 90) and longitude (-180 to 180).
        2. Format dates as YYYYMMDD string.
        3. Join parameters into comma-separated list.
        4. Return full parameterized URL.
        """
        raise NotImplementedError("Build query URL logic to be implemented by team.")

    def fetch_and_preserve(
        self,
        city_name: str,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        parameters: List[str]
    ) -> Path:
        """
        Fetch weather data from NASA POWER and save exact raw bytes to disk.

        Logic:
        1. Construct query URL using build_query_url().
        2. Execute HTTP GET with appropriate timeout (e.g. 30 seconds).
        3. Check response status == 200; handle network or quota errors gracefully.
        4. Generate deterministic raw filename:
           nasa_power_hourly_{city_name}_{start_date}_{end_date}.json
        5. Write raw byte response directly to raw_output_dir without parsing/altering.
        6. Return absolute path to saved raw artifact.
        """
        raise NotImplementedError("Fetch and preserve logic to be implemented by team.")
