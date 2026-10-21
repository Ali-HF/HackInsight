"""
Unit Tests for Reusable PM2.5 Inference Interface.
HackInsight 2026 - Member 2: Machine Learning Inference Serving.

Test Coverage:
A. test_inference_from_disk_artifact: loads disk artifact, runs predict_pm25_24h, verifies columns and valid values.
B. test_inference_forecast_horizon: verifies forecast_target_time == forecast_issue_time + 24 hours.
C. test_inference_baseline: verifies baseline_persistence == current_pm25.
D. test_inference_multi_sensor_isolation: verifies multi-sensor independence without cross-sensor bleed.
E. test_inference_missing_required_column: verifies clear failure when required column is missing.
F. test_inference_no_future_leakage: verifies observations after forecast issue time do not alter forecast.
G. test_inference_model_load: verifies disk artifact loads without retraining.
"""

import unittest
from pathlib import Path
import numpy as np
import pandas as pd

from src.ml_pipeline.inference import predict_pm25_24h, REQUIRED_COLUMNS
from src.ml_pipeline.model import PM25Forecaster


class TestMLInference(unittest.TestCase):
    """Test suite ensuring inference contract, causality, and isolation."""

    def setUp(self):
        self.repo_root = Path(__file__).resolve().parent.parent.parent
        self.model_path = self.repo_root / "artifacts" / "models" / "pm25_forecaster.joblib"

        # 48-hour hourly fixture for a single sensor
        dates = pd.date_range("2024-01-01 00:00:00", periods=48, freq="1h", tz="UTC")
        self.single_sensor_df = pd.DataFrame({
            "timestamp_utc": dates,
            "city": ["Lahore"] * 48,
            "sensor_id": ["sensor_lahore_01"] * 48,
            "latitude": [31.52] * 48,
            "longitude": [74.35] * 48,
            "pm25": [50.0 + (i % 24) * 2.0 for i in range(48)]
        })

    def test_a_inference_from_disk_artifact(self):
        """Test A: Load pre-trained disk artifact and verify expected output schema and types."""
        result_df = predict_pm25_24h(self.single_sensor_df, model_path=self.model_path, coverage=0.80)

        expected_cols = [
            "sensor_id",
            "city",
            "forecast_issue_time",
            "forecast_target_time",
            "current_pm25",
            "predicted_pm25_24h",
            "lower_80",
            "upper_80",
            "baseline_persistence"
        ]
        self.assertEqual(list(result_df.columns), expected_cols)
        self.assertEqual(len(result_df), 1)

        row = result_df.iloc[0]
        self.assertEqual(row["sensor_id"], "sensor_lahore_01")
        self.assertEqual(row["city"], "Lahore")
        self.assertTrue(np.isfinite(row["predicted_pm25_24h"]))
        self.assertGreaterEqual(row["predicted_pm25_24h"], 1.0)
        self.assertLessEqual(row["lower_80"], row["predicted_pm25_24h"])
        self.assertGreaterEqual(row["upper_80"], row["predicted_pm25_24h"])

    def test_b_inference_forecast_horizon(self):
        """Test B: Verify target time is exactly 24 hours after forecast issue time."""
        result_df = predict_pm25_24h(self.single_sensor_df, model_path=self.model_path)
        row = result_df.iloc[0]

        issue_t = pd.to_datetime(row["forecast_issue_time"], utc=True)
        target_t = pd.to_datetime(row["forecast_target_time"], utc=True)

        expected_target_t = issue_t + pd.to_timedelta(24, unit="h")
        self.assertEqual(target_t, expected_target_t)
        self.assertEqual(issue_t, pd.to_datetime("2024-01-02 23:00:00", utc=True))

    def test_c_inference_baseline(self):
        """Test C: Verify baseline persistence exactly equals current PM2.5 observation."""
        result_df = predict_pm25_24h(self.single_sensor_df, model_path=self.model_path)
        row = result_df.iloc[0]

        latest_obs_pm25 = self.single_sensor_df.sort_values("timestamp_utc").iloc[-1]["pm25"]
        self.assertAlmostEqual(row["current_pm25"], latest_obs_pm25, places=2)
        self.assertEqual(row["baseline_persistence"], row["current_pm25"])

    def test_d_inference_multi_sensor_isolation(self):
        """Test D: Multiple sensors produce independent predictions with zero cross-sensor bleed."""
        dates = pd.date_range("2024-01-01 00:00:00", periods=24, freq="1h", tz="UTC")
        df_a = pd.DataFrame({
            "timestamp_utc": dates,
            "city": ["Lahore"] * 24,
            "sensor_id": ["sensor_lahore_A"] * 24,
            "latitude": [31.52] * 24,
            "longitude": [74.35] * 24,
            "pm25": [60.0 + i for i in range(24)]
        })
        df_b = pd.DataFrame({
            "timestamp_utc": dates,
            "city": ["Karachi"] * 24,
            "sensor_id": ["sensor_karachi_B"] * 24,
            "latitude": [24.86] * 24,
            "longitude": [67.01] * 24,
            "pm25": [25.0 + i * 0.5 for i in range(24)]
        })
        combined_df = pd.concat([df_a, df_b], ignore_index=True)

        # Predict combined
        combined_results = predict_pm25_24h(combined_df, model_path=self.model_path)
        self.assertEqual(len(combined_results), 2)

        # Predict isolated
        res_a_solo = predict_pm25_24h(df_a, model_path=self.model_path)
        res_b_solo = predict_pm25_24h(df_b, model_path=self.model_path)

        row_a = combined_results[combined_results["sensor_id"] == "sensor_lahore_A"].iloc[0]
        row_b = combined_results[combined_results["sensor_id"] == "sensor_karachi_B"].iloc[0]

        # Verify predictions match exactly whether run in combined batch or isolated
        self.assertAlmostEqual(row_a["predicted_pm25_24h"], res_a_solo.iloc[0]["predicted_pm25_24h"], places=2)
        self.assertAlmostEqual(row_b["predicted_pm25_24h"], res_b_solo.iloc[0]["predicted_pm25_24h"], places=2)

    def test_e_inference_missing_required_column(self):
        """Test E: Fail clearly with ValueError when a required column is missing."""
        invalid_df = self.single_sensor_df.drop(columns=["pm25"])
        with self.assertRaises(ValueError) as ctx:
            predict_pm25_24h(invalid_df, model_path=self.model_path)
        self.assertIn("pm25", str(ctx.exception))

        empty_df = pd.DataFrame(columns=REQUIRED_COLUMNS)
        with self.assertRaises(ValueError) as ctx:
            predict_pm25_24h(empty_df, model_path=self.model_path)
        self.assertIn("empty", str(ctx.exception))

    def test_f_inference_no_future_leakage(self):
        """Test F: Observations strictly after the forecast issue time cannot alter the forecast."""
        # Baseline forecast issued at t=23h
        t23 = self.single_sensor_df["timestamp_utc"].iloc[23]
        res_t23_base = predict_pm25_24h(
            self.single_sensor_df.iloc[:24],
            model_path=self.model_path
        )

        # Now pass a DataFrame that includes t=24h to t=47h, but evaluate with as_of=t23
        res_t23_cutoff = predict_pm25_24h(
            self.single_sensor_df,
            model_path=self.model_path,
            as_of=t23
        )

        # Even with 24 hours of subsequent data present, point forecast and bounds must be identical
        self.assertEqual(res_t23_base.iloc[0]["forecast_issue_time"], res_t23_cutoff.iloc[0]["forecast_issue_time"])
        self.assertEqual(res_t23_base.iloc[0]["predicted_pm25_24h"], res_t23_cutoff.iloc[0]["predicted_pm25_24h"])
        self.assertEqual(res_t23_base.iloc[0]["lower_80"], res_t23_cutoff.iloc[0]["lower_80"])
        self.assertEqual(res_t23_base.iloc[0]["upper_80"], res_t23_cutoff.iloc[0]["upper_80"])

    def test_g_inference_model_load(self):
        """Test G: Model artifact loads directly from disk without retraining."""
        forecaster = PM25Forecaster.load(self.model_path)
        self.assertTrue(forecaster.is_fitted)
        self.assertEqual(len(forecaster.feature_names), 40)
        self.assertIn("q10_log", forecaster.residual_quantiles)
        self.assertIn("q90_log", forecaster.residual_quantiles)
        self.assertIsNotNone(forecaster.tier_threshold)
        self.assertEqual(forecaster.tier_multiplier, 1.5)


if __name__ == "__main__":
    unittest.main()
