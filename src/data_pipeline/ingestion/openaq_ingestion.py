"""
OpenAQ Real-Time & Incremental PM2.5 Ingestion Module (v3).
HackInsight 2026 - Data Engineering & Live Ingestion.

Features:
1. Incremental delta fetching: Checks latest recorded timestamp in raw storage per station,
   fetching only newly elapsed hours up to datetime.now(timezone.utc).
2. Skip redundant downloads when station data is already up-to-date (status: "up_to_date").
3. Exponential backoff HTTP retries for rate limits (HTTP 429) and server errors (HTTP 500/502/503/504).
4. Secure API token handling via environment (OPENAQ_API_KEY) or constructor argument.
5. Graceful fallback to existing PAQI archive if OpenAQ API is unreachable or exhausted.
6. Backward-compatible interface for fetch_latest_measurements.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime, timezone, timedelta
import os
import json
import time
import logging
import requests

from src.data_pipeline.ingestion.paqi_ingestion import PAQIIngestionManager

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class OpenAQIngestionManager:
    """Manages real-time and incremental delta PM2.5 ingestion from OpenAQ v3 API."""

    BASE_URL = "https://api.openaq.org/v3"
    LEGACY_BASE_URL = "https://api.openaq.org/v2/measurements"

    def __init__(
        self,
        raw_output_dir: Path,
        api_key: Optional[str] = None,
        paqi_fallback_path: Optional[Path] = None
    ):
        """
        Initialize the OpenAQ ingestion manager.

        Args:
            raw_output_dir: Destination path (e.g. data/raw/openaq/).
            api_key: Optional OpenAQ API key. Falls back to OPENAQ_API_KEY env var.
            paqi_fallback_path: Optional path to raw PAQI .ict file for archive fallback.
        """
        self.raw_output_dir = Path(raw_output_dir)
        self.raw_output_dir.mkdir(parents=True, exist_ok=True)
        self.api_key = api_key or os.getenv("OPENAQ_API_KEY")

        # Fallback to standard project location if not explicitly given
        if paqi_fallback_path:
            self.paqi_fallback_path = Path(paqi_fallback_path)
        else:
            default_paqi = Path("Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227") / (
                "Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict"
            )
            self.paqi_fallback_path = default_paqi if default_paqi.exists() else None

    def get_latest_recorded_timestamp(self, station_id: str) -> Optional[datetime]:
        """
        Scan raw storage to locate the latest recorded timestamp for a given station.

        Args:
            station_id: Unique station identifier or slug.

        Returns:
            Timezone-aware datetime in UTC or None if no prior data is found.
        """
        latest_dt: Optional[datetime] = None

        # Search for station files in raw_output_dir (station directory or flat)
        search_patterns = [
            f"{station_id}*.json",
            f"*{station_id}*.json",
            "openaq_*.json"
        ]

        matched_files: List[Path] = []
        for pat in search_patterns:
            matched_files.extend(self.raw_output_dir.glob(pat))

        # Check subdirectories if partitioned by station
        station_subdir = self.raw_output_dir / station_id
        if station_subdir.is_dir():
            matched_files.extend(station_subdir.glob("*.json"))

        for fpath in set(matched_files):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    payload = json.load(f)

                # Format A: OpenAQ v3 results list [{"datetime": {"utc": ...}}]
                results = payload.get("results", []) if isinstance(payload, dict) else payload
                if isinstance(results, list):
                    for item in results:
                        dt_str = None
                        if isinstance(item, dict):
                            dt_val = item.get("datetime")
                            if isinstance(dt_val, dict):
                                dt_str = dt_val.get("utc")
                            elif isinstance(dt_val, str):
                                dt_str = dt_val
                            elif "date" in item and isinstance(item["date"], dict):
                                dt_str = item["date"].get("utc")
                            elif "timestamp" in item:
                                dt_str = item["timestamp"]

                        if dt_str:
                            try:
                                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                                if latest_dt is None or dt > latest_dt:
                                    latest_dt = dt
                            except (ValueError, TypeError):
                                pass

                # Format B: Metadata header with latest_timestamp
                if isinstance(payload, dict) and "latest_timestamp" in payload:
                    try:
                        dt = datetime.fromisoformat(payload["latest_timestamp"].replace("Z", "+00:00"))
                        if latest_dt is None or dt > latest_dt:
                            latest_dt = dt
                    except (ValueError, TypeError):
                        pass

            except Exception as e:
                logger.debug(f"Could not parse timestamp from {fpath.name}: {e}")

        return latest_dt

    def _request_with_backoff(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        max_retries: int = 4,
        base_delay: float = 1.0,
        timeout: int = 30
    ) -> requests.Response:
        """
        Execute HTTP GET request with exponential backoff on HTTP 429 and 500-level errors.

        Args:
            url: Request URL.
            params: Query parameters.
            headers: HTTP headers.
            max_retries: Maximum attempt count.
            base_delay: Initial retry delay in seconds.
            timeout: Socket timeout.

        Returns:
            Successful requests.Response.
        """
        req_headers = {
            "User-Agent": "HackInsight-PM25-Pakistan/2.0 (OpenAQ v3 Delta Ingestor)"
        }
        if self.api_key:
            req_headers["X-API-Key"] = self.api_key
        if headers:
            req_headers.update(headers)

        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(url, params=params, headers=req_headers, timeout=timeout)

                # HTTP 429: Rate Limit Exceeded
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    delay = float(retry_after) if retry_after and retry_after.isdigit() else base_delay * (2 ** (attempt - 1))
                    logger.warning(
                        f"OpenAQ Rate Limit (429) hit. Backing off for {delay:.2f}s (attempt {attempt}/{max_retries})."
                    )
                    time.sleep(delay)
                    continue

                # HTTP 500/502/503/504: Server Errors
                if 500 <= response.status_code < 600:
                    delay = base_delay * (2 ** (attempt - 1))
                    logger.warning(
                        f"OpenAQ Server Error ({response.status_code}). Backing off for {delay:.2f}s (attempt {attempt}/{max_retries})."
                    )
                    time.sleep(delay)
                    continue

                response.raise_for_status()
                return response

            except (requests.RequestException, TimeoutError) as e:
                last_error = e
                if attempt == max_retries:
                    break
                delay = base_delay * (2 ** (attempt - 1))
                logger.warning(
                    f"HTTP request failed: {e}. Retrying in {delay:.2f}s (attempt {attempt}/{max_retries})..."
                )
                time.sleep(delay)

        raise RuntimeError(f"OpenAQ request failed after {max_retries} retries: {last_error}")

    def fetch_delta(
        self,
        station_id: str,
        sensor_id: Optional[int] = None,
        city: Optional[str] = None,
        lookback_hours: int = 24,
        fallback_on_error: bool = True
    ) -> Dict[str, Any]:
        """
        Perform intelligent incremental delta fetching for a station.

        Logic:
        1. Query latest recorded timestamp in raw storage for station_id.
        2. If data is fresh (elapsed < 1 hour), skip download and return status: 'up_to_date'.
        3. If elapsed hours exist, fetch newly elapsed window [last_timestamp, now_utc].
        4. Save unedited response JSON to raw storage.
        5. If OpenAQ is unreachable, seamlessly fall back to the PAQI archive.

        Args:
            station_id: Target station identifier.
            sensor_id: Optional OpenAQ v3 sensor ID.
            city: Optional city name for fallback routing.
            lookback_hours: Fallback lookback window if station has no previous history.
            fallback_on_error: Whether to fall back to PAQI archive on OpenAQ failure.

        Returns:
            Dict containing status, station_id, timestamps, records count, and artifact path.
        """
        now_utc = datetime.now(timezone.utc)
        last_dt = self.get_latest_recorded_timestamp(station_id)

        # Check if already up-to-date (less than 1 hour since last observation)
        if last_dt is not None:
            elapsed = (now_utc - last_dt).total_seconds()
            if elapsed < 3600:
                logger.info(
                    f"Station '{station_id}' is already up-to-date (last recorded: {last_dt.isoformat()}). Skipping download."
                )
                return {
                    "status": "up_to_date",
                    "station_id": station_id,
                    "last_timestamp": last_dt.isoformat(),
                    "now_utc": now_utc.isoformat(),
                    "records_fetched": 0,
                    "source": "cache"
                }
            start_dt = last_dt
        else:
            start_dt = now_utc - timedelta(hours=lookback_hours)

        start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        end_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Attempt OpenAQ API fetch
        try:
            if sensor_id is not None:
                endpoint = f"{self.BASE_URL}/sensors/{sensor_id}/measurements"
                params = {"datetime_from": start_iso, "datetime_to": end_iso, "limit": 1000}
            else:
                endpoint = f"{self.BASE_URL}/locations/{station_id}/measurements"
                params = {"datetime_from": start_iso, "datetime_to": end_iso, "limit": 1000}

            response = self._request_with_backoff(endpoint, params=params)
            payload = response.json()
            raw_bytes = response.content

            # Save raw payload
            ts_str = now_utc.strftime("%Y%m%d_%H%M%S")
            out_filename = f"openaq_{station_id}_{ts_str}.json"
            out_path = self.raw_output_dir / out_filename
            with open(out_path, "wb") as f:
                f.write(raw_bytes)

            results_count = len(payload.get("results", [])) if isinstance(payload, dict) else len(payload)
            logger.info(
                f"Successfully ingested {results_count} OpenAQ records for '{station_id}' from {start_iso} to {end_iso}."
            )

            return {
                "status": "success",
                "station_id": station_id,
                "start_timestamp": start_iso,
                "end_timestamp": end_iso,
                "records_fetched": results_count,
                "raw_file_path": str(out_path),
                "source": "openaq_v3"
            }

        except Exception as e:
            logger.warning(f"OpenAQ delta ingestion failed for '{station_id}': {e}")

            # Fallback to PAQI archive if enabled
            if fallback_on_error and self.paqi_fallback_path and self.paqi_fallback_path.exists():
                logger.info(f"Triggering PAQI archive fallback for '{station_id}'...")
                try:
                    paqi_mgr = PAQIIngestionManager(self.paqi_fallback_path)
                    # Verify station existence in PAQI metadata
                    meta_df = paqi_mgr.extract_sensor_metadata()
                    station_match = meta_df[meta_df["sensor_id"] == station_id]
                    records_count = len(station_match)

                    return {
                        "status": "fallback_paqi",
                        "station_id": station_id,
                        "fallback_source": "PAQI_ICARTT",
                        "fallback_path": str(self.paqi_fallback_path),
                        "known_in_paqi": records_count > 0,
                        "reason": str(e),
                        "source": "paqi_archive"
                    }
                except Exception as fb_err:
                    logger.error(f"PAQI fallback also encountered an error: {fb_err}")

            return {
                "status": "error",
                "station_id": station_id,
                "error": str(e),
                "source": "unreachable"
            }

    def fetch_latest_measurements(
        self,
        city: str,
        parameter: str = "pm25",
        limit: int = 100
    ) -> Path:
        """
        Fetch current PM2.5 measurements for a city and save raw response.
        Maintains backward compatibility with original pipeline design.

        Args:
            city: City name (e.g. 'Lahore' or 'Karachi').
            parameter: Air quality pollutant parameter (default: 'pm25').
            limit: Maximum record count.

        Returns:
            Path to saved raw JSON artifact.
        """
        now_ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        out_filename = f"openaq_{city.lower()}_{parameter}_{now_ts}.json"
        out_path = self.raw_output_dir / out_filename

        # Try live query via OpenAQ
        try:
            url = self.LEGACY_BASE_URL
            params = {
                "city": city,
                "parameter": parameter,
                "limit": limit,
                "order_by": "datetime",
                "sort": "desc"
            }
            res = self._request_with_backoff(url, params=params, timeout=15)
            with open(out_path, "wb") as f:
                f.write(res.content)
            return out_path

        except Exception as e:
            logger.warning(f"Live OpenAQ fetch for {city} failed: {e}. Writing preserved fallback payload.")
            # Graceful fallback: synthesize a preserved raw JSON wrapper with archive provenance
            fallback_payload = {
                "city": city,
                "parameter": parameter,
                "status": "fallback_paqi",
                "reason": str(e),
                "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                "results": []
            }
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(fallback_payload, f, indent=2)
            return out_path
