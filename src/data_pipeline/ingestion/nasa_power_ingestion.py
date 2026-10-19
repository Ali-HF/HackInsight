"""
NASA POWER Hourly Meteorological Ingestion Module.
HackInsight 2026 - Member 1: Data Engineering.

Responsibilities:
1. Fetch hourly surface meteorology parameters via NASA POWER REST API.
2. Preserve raw response artifacts (JSON) unchanged in data/raw/nasa_power/.
3. Log request parameters, checksums, and fetch timestamps to manifest.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import urllib.request
import urllib.error
import json
import time


class NASAPowerIngestionManager:
    """Manages NASA POWER hourly meteorological data acquisition and raw preservation."""

    DEFAULT_PARAMETERS = ["T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"]
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point"

    def __init__(self, raw_output_dir: Path):
        """
        Initialize the NASA POWER ingestion manager.

        Args:
            raw_output_dir: Destination path (e.g. data/raw/nasa_power/).
        """
        self.raw_output_dir = Path(raw_output_dir)
        self.raw_output_dir.mkdir(parents=True, exist_ok=True)

    def build_query_url(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        parameters: Optional[List[str]] = None
    ) -> str:
        """
        Construct the NASA POWER REST endpoint URL.
        """
        params = parameters or self.DEFAULT_PARAMETERS
        param_str = ",".join(params)
        url = (
            f"{self.BASE_URL}?parameters={param_str}&community=RE"
            f"&longitude={longitude:.4f}&latitude={latitude:.4f}"
            f"&start={start_date}&end={end_date}&format=JSON"
        )
        return url

    def fetch_and_preserve(
        self,
        city_name: str,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str,
        parameters: Optional[List[str]] = None,
        timeout: int = 45,
        max_retries: int = 3
    ) -> Path:
        """
        Fetch weather data from NASA POWER and save exact raw bytes to disk.
        """
        out_filename = f"nasa_power_hourly_{city_name.lower()}_{start_date}_{end_date}.json"
        out_path = self.raw_output_dir / out_filename

        # If already downloaded and valid, return existing artifact
        if out_path.exists() and out_path.stat().st_size > 1024:
            return out_path

        url = self.build_query_url(latitude, longitude, start_date, end_date, parameters)

        for attempt in range(1, max_retries + 1):
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "HackInsight-DataPipeline/1.0 (Student Team)"}
                )
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    raw_bytes = response.read()

                # Basic validation: ensure it's valid JSON
                data = json.loads(raw_bytes.decode("utf-8"))
                if "properties" not in data or "parameter" not in data["properties"]:
                    raise ValueError(f"Malformed NASA POWER response for {city_name}: missing properties/parameter")

                # Write exact raw bytes to disk
                with open(out_path, "wb") as f:
                    f.write(raw_bytes)

                return out_path
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
                if attempt == max_retries:
                    raise RuntimeError(f"Failed to fetch NASA POWER data for {city_name} after {max_retries} attempts: {e}")
                time.sleep(2 * attempt)

        return out_path
