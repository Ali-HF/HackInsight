"""
Unit Tests for OpenAQ v3 Delta Ingestion Engine.
HackInsight 2026 - Data Engineering Ingestion Tests.
"""

import unittest
from unittest.mock import patch, MagicMock
import tempfile
import shutil
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

from src.data_pipeline.ingestion.openaq_ingestion import OpenAQIngestionManager


class TestOpenAQDeltaIngestion(unittest.TestCase):
    """Test suite for OpenAQ incremental delta fetching, backoff retries, and PAQI fallback."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.raw_dir = self.test_dir / "raw_openaq"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.manager = OpenAQIngestionManager(raw_output_dir=self.raw_dir)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_get_latest_recorded_timestamp(self):
        """Verify scanner finds latest observation timestamp from stored JSON."""
        station_id = "test_sensor_01"
        recent_iso = "2026-10-21T08:00:00Z"
        older_iso = "2026-10-21T06:00:00Z"

        # Write test JSON
        sample_payload = {
            "results": [
                {"datetime": {"utc": older_iso}},
                {"datetime": {"utc": recent_iso}}
            ]
        }
        test_file = self.raw_dir / f"openaq_{station_id}_20261021.json"
        with open(test_file, "w", encoding="utf-8") as f:
            json.dump(sample_payload, f)

        detected_dt = self.manager.get_latest_recorded_timestamp(station_id)
        self.assertIsNotNone(detected_dt)
        expected_dt = datetime(2026, 10, 21, 8, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(detected_dt, expected_dt)

    def test_up_to_date_skips_download(self):
        """Verify fetch_delta returns status: up_to_date if recent record exists (< 1 hour ago)."""
        station_id = "fresh_station"
        now_utc = datetime.now(timezone.utc)
        recent_ts = (now_utc - timedelta(minutes=20)).strftime("%Y-%m-%dT%H:%M:%SZ")

        sample_payload = {
            "results": [
                {"datetime": {"utc": recent_ts}}
            ]
        }
        with open(self.raw_dir / f"openaq_{station_id}_recent.json", "w", encoding="utf-8") as f:
            json.dump(sample_payload, f)

        res = self.manager.fetch_delta(station_id=station_id)
        self.assertEqual(res["status"], "up_to_date")
        self.assertEqual(res["records_fetched"], 0)
        self.assertEqual(res["source"], "cache")

    @patch("src.data_pipeline.ingestion.openaq_ingestion.requests.get")
    def test_fetch_delta_success_with_backoff(self, mock_get):
        """Verify exponential backoff retries on HTTP 429 and succeeds on next attempt."""
        station_id = "delta_station"

        # Mock first call as 429 (Rate Limit), second call as 200 OK
        resp_429 = MagicMock()
        resp_429.status_code = 429
        resp_429.headers = {"Retry-After": "1"}

        resp_200 = MagicMock()
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "results": [
                {"datetime": {"utc": "2026-10-21T05:00:00Z"}, "value": 78.5}
            ]
        }
        resp_200.content = json.dumps(resp_200.json.return_value).encode("utf-8")

        mock_get.side_effect = [resp_429, resp_200]

        res = self.manager.fetch_delta(station_id=station_id, lookback_hours=5)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["records_fetched"], 1)
        self.assertEqual(mock_get.call_count, 2)
        self.assertTrue(Path(res["raw_file_path"]).exists())

    @patch("src.data_pipeline.ingestion.openaq_ingestion.requests.get")
    def test_fallback_to_paqi_on_openaq_failure(self, mock_get):
        """Verify fallback behavior to PAQI archive when OpenAQ is completely unreachable."""
        mock_get.side_effect = Exception("OpenAQ Connection Refused")

        # Create a dummy PAQI ICARTT file
        dummy_icartt = self.test_dir / "dummy_paqi.ict"
        dummy_content = (
            "37, 1001\n"
            + "\n" * 19
            + "DEVICE LOCATIONS: a1 (31.52, 74.35)\n"
            + "\n" * 16
            + "datetime, a1\n"
            + "2024-01-01 00:00:00, 45.0\n"
        )
        with open(dummy_icartt, "w", encoding="utf-8") as f:
            f.write(dummy_content)

        mgr_with_paqi = OpenAQIngestionManager(
            raw_output_dir=self.raw_dir,
            paqi_fallback_path=dummy_icartt
        )

        res = mgr_with_paqi.fetch_delta(station_id="a1")
        self.assertEqual(res["status"], "fallback_paqi")
        self.assertEqual(res["source"], "paqi_archive")
        self.assertTrue(res["known_in_paqi"])

    def test_fetch_latest_measurements_contract(self):
        """Verify fetch_latest_measurements creates preserved raw artifact."""
        out_path = self.manager.fetch_latest_measurements(city="Lahore")
        self.assertTrue(out_path.exists())
        self.assertTrue(out_path.stat().st_size > 0)


if __name__ == "__main__":
    unittest.main()
