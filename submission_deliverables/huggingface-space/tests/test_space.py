"""
Comprehensive Test Suite for HackInsight Hugging Face Space.
Verifies all 10 core requirements from Competition Testing Plan:
1. The application starts successfully.
2. The dashboard renders with valid data.
3. Missing API credentials are handled gracefully.
4. An unavailable backend produces a clear status.
5. Stale data is identified correctly.
6. Missing metrics are not misrepresented as zero.
7. Failed pipeline runs are displayed accurately.
8. Invalid or malformed API responses do not crash the dashboard.
9. Secrets are not exposed in logs or UI output.
10. The application works without access to developer-local files.
"""

import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import tempfile
import shutil
import json

SPACE_DIR = Path(__file__).resolve().parent.parent
if str(SPACE_DIR) not in sys.path:
    sys.path.insert(0, str(SPACE_DIR))

from data_provider import TelemetryDataProvider, scrub_secrets
import app


class TestHuggingFaceSpace(unittest.TestCase):
    """Test suite verifying operational telemetry, resilience, and security."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.snapshot_file = self.test_dir / "test_snapshot.json"
        self.sample_snapshot = {
            "project_name": "HackInsight",
            "data_source_name": "PAQI Ground Network",
            "freshness_threshold_hours": 24.0,
            "pipeline_status": {
                "status": "HEALTHY",
                "total_recorded_runs": 5,
                "schedule": "0 * * * *",
                "timezone": "Asia/Karachi",
                "last_run": {
                    "run_id": "RUN-20261021-01",
                    "timestamp_utc": "2026-10-21T08:00:00Z",
                    "status": "SUCCESS",
                    "duration_seconds": 9.2,
                    "records_checked": 176392,
                    "agent_grounding_passed": True,
                    "error": None
                }
            },
            "latest_forecast": {
                "run_id": "RUN-20261021-01",
                "timestamp_utc": "2026-10-21T08:00:00Z",
                "forecast_data": {
                    "issue_timestamp": "2026-10-21T08:00:00Z",
                    "horizon_hours": 24,
                    "cities": {
                        "Lahore": {
                            "city": "Lahore",
                            "predicted_pm25_24h": 118.26,
                            "lower_80": 58.13,
                            "upper_80": 199.83
                        },
                        "Karachi": {
                            "city": "Karachi",
                            "predicted_pm25_24h": 114.41,
                            "lower_80": 56.22,
                            "upper_80": 193.36
                        }
                    }
                },
                "validation": {
                    "status": "PASS",
                    "latest_timestamp": "2026-10-21T07:00:00Z"
                }
            },
            "latest_quality": {
                "quality_assessment": {
                    "overall_status": "WARN",
                    "total_records_checked": 176392,
                    "checks_run": 13,
                    "actions_summary": {"NO_ACTION": 10, "FLAG": 3, "FILL": 0, "FIX": 0},
                    "decisions": [
                        {"check_id": "target_missingness_pm25", "records_affected": 0},
                        {"check_id": "uniqueness_record_id", "records_affected": 0},
                        {"check_id": "schema_completeness", "action": "NO_ACTION"}
                    ]
                }
            },
            "model_metrics": {
                "model_name": "HistGradientBoostingRegressor",
                "model_version": "1.0.0",
                "feature_count": 40,
                "test_metrics": {
                    "model_mae": 40.602,
                    "base_mae": 42.347,
                    "mae_pct_improvement": 4.12
                },
                "test_uncertainty_80pct": {
                    "empirical_coverage_pct": 82.43
                }
            },
            "run_history": [
                {
                    "run_id": "RUN-20261021-01",
                    "timestamp_utc": "2026-10-21T08:00:00Z",
                    "status": "SUCCESS",
                    "duration_seconds": 9.2,
                    "records_checked": 176392,
                    "error": None
                },
                {
                    "run_id": "RUN-20261021-00",
                    "timestamp_utc": "2026-10-21T07:00:00Z",
                    "status": "FAILED",
                    "duration_seconds": 2.1,
                    "records_checked": 0,
                    "error": "ConnectionError to sensor cluster"
                }
            ]
        }
        with open(self.snapshot_file, "w", encoding="utf-8") as f:
            json.dump(self.sample_snapshot, f)

        self.provider = TelemetryDataProvider(workspace_root=None, snapshot_path=self.snapshot_file)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_01_application_starts_successfully(self):
        """1. Verify Gradio Blocks instance initializes and title is correct."""
        self.assertIsNotNone(app.demo)
        self.assertEqual(app.demo.title, "HackInsight — Pipeline Monitoring")

    def test_02_dashboard_renders_with_valid_data(self):
        """2. Verify refresh_dashboard extracts all 11 component view targets."""
        with patch.object(app, "provider", self.provider):
            outputs = app.refresh_dashboard()
            self.assertEqual(len(outputs), 11)
            header, cards_html, freshness_html, lahore_md, karachi_md, dq_md, dq_df, model_df, hist_kpi, chart, hist_df = outputs
            self.assertIn("HackInsight", header)
            self.assertIn("Data Pipeline", cards_html)
            self.assertIn("118.26", lahore_md)
            self.assertIn("114.41", karachi_md)
            self.assertEqual(len(hist_df), 2)

    def test_03_missing_api_credentials_handled_gracefully(self):
        """3. Missing API keys do not raise exceptions and fall back to snapshot."""
        with patch.dict("os.environ", {"BACKEND_API_URL": "", "OPENAQ_API_KEY": ""}, clear=False):
            prov = TelemetryDataProvider(workspace_root=None, snapshot_path=self.snapshot_file)
            data = prov.get_telemetry()
            self.assertEqual(data["_data_source_mode"], "Bundled Operational Snapshot")
            self.assertIn("pipeline_status", data)

    def test_04_unavailable_backend_produces_clear_status(self):
        """4. Remote endpoint failure reports explicit failure status rather than crashing."""
        with patch("data_provider.requests.get") as mock_get:
            mock_get.side_effect = Exception("Connection Timeout 5000ms")
            prov = TelemetryDataProvider(workspace_root=None, snapshot_path=Path("non_existent_file.json"))
            data = prov.fetch_remote_telemetry("https://api.example.com/status")
            self.assertIsNone(data)

            # When all sources fail
            fallback_data = prov.get_telemetry()
            self.assertEqual(fallback_data["_data_source_mode"], "Unavailable")
            self.assertIn("Unable to verify the latest system status.", fallback_data["error"])

    def test_05_stale_data_identified_correctly(self):
        """5. Data older than freshness threshold is explicitly flagged STALE."""
        stale_snapshot = dict(self.sample_snapshot)
        # 10 days old observation
        stale_snapshot["latest_forecast"]["validation"]["latest_timestamp"] = "2020-01-01T00:00:00Z"
        stale_file = self.test_dir / "stale.json"
        with open(stale_file, "w", encoding="utf-8") as f:
            json.dump(stale_snapshot, f)

        prov = TelemetryDataProvider(snapshot_path=stale_file)
        telemetry = prov.get_telemetry()
        freshness = prov.evaluate_data_freshness(telemetry)
        self.assertFalse(freshness["is_fresh"])

        cards = prov.evaluate_system_cards(telemetry)
        pipe_card = [c for c in cards if c["name"] == "Data Pipeline & Ingestion"][0]
        self.assertEqual(pipe_card["status"], "STALE")

    def test_06_missing_metrics_not_misrepresented_as_zero(self):
        """6. Unavailable metrics render as 'Not available', never 0."""
        empty_quality_telemetry = {"latest_quality": {}}
        dq = self.provider.evaluate_quality_metrics(empty_quality_telemetry)
        self.assertEqual(dq["records_checked"], "Not available")
        self.assertEqual(dq["overall_status"], "Not available")
        self.assertEqual(dq["target_nulls"], "Not available")

    def test_07_failed_pipeline_runs_displayed_accurately(self):
        """7. Failed runs are displayed with error messages and red indicators."""
        telemetry = self.provider.get_telemetry()
        df = self.provider.get_execution_history_df(telemetry)
        failed_row = df[df["Status"] == "FAILED"].iloc[0]
        self.assertEqual(failed_row["Status"], "FAILED")
        self.assertIn("ConnectionError", failed_row["Error Summary"])

    def test_08_invalid_or_malformed_api_responses_do_not_crash_dashboard(self):
        """8. Non-dict or malformed JSON payloads from API return None safely."""
        with patch("data_provider.requests.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = ["malformed", "list", "instead", "of", "dict"]
            mock_get.return_value = mock_resp

            prov = TelemetryDataProvider(workspace_root=None, snapshot_path=self.snapshot_file)
            res = prov.fetch_remote_telemetry("https://api.example.com/status")
            self.assertIsNone(res)

    def test_09_secrets_not_exposed_in_logs_or_ui(self):
        """9. Accidental secrets (API tokens, auth keys) are masked before display."""
        dirty_error = "Error: Invalid token AIzaSyD98765432101234567890123456789012 with Bearer pnu_secret_prefect_key_12345"
        clean = scrub_secrets(dirty_error)
        self.assertNotIn("AIza", clean)
        self.assertNotIn("pnu_secret", clean)
        self.assertIn("[REDACTED_CREDENTIAL]", clean)

    def test_10_works_without_developer_local_files(self):
        """10. Space initializes in isolated container without access to c:/HIS filesystem."""
        isolated_prov = TelemetryDataProvider(
            workspace_root=Path("/isolated/virtual/non_existent_path"),
            snapshot_path=self.snapshot_file
        )
        telemetry = isolated_prov.get_telemetry()
        self.assertEqual(telemetry["_data_source_mode"], "Bundled Operational Snapshot")
        self.assertEqual(telemetry["project_name"], "HackInsight")
        cards = isolated_prov.evaluate_system_cards(telemetry)
        self.assertEqual(len(cards), 5)


if __name__ == "__main__":
    unittest.main()
