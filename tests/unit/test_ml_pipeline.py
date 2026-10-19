"""
Unit and Integration Tests for Member 2 ML Forecasting Pipeline.
HackInsight 2026 - Member 2 Testing Suite.
"""

import unittest
import tempfile
import shutil
from pathlib import Path
import numpy as np
import pandas as pd

from src.ml_pipeline.features import (
    extract_temporal_features,
    engineer_sensor_features,
    build_ml_feature_set
)
from src.ml_pipeline.splitting import chronological_split
from src.ml_pipeline.model import PM25Forecaster
from src.ml_pipeline.evaluation import calculate_metrics, comprehensive_error_analysis


class TestMLPipeline(unittest.TestCase):
    """Test suite ensuring leakage safety, causality, and model integrity."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())

        # Create a synthetic fixture with 2 sensors and 100 hourly steps
        dates = pd.date_range("2023-01-01 00:00:00", periods=100, freq="1h", tz="UTC")
        records = []
        for s_idx, sid in enumerate(["sensor_A", "sensor_B"]):
            base_val = 50.0 if sid == "sensor_A" else 100.0
            for i, d in enumerate(dates):
                pm = base_val + (i % 24) * 2.0
                records.append({
                    "record_id": f"{sid}_{i:04d}",
                    "timestamp_utc": d,
                    "city": "Lahore" if sid == "sensor_A" else "Karachi",
                    "sensor_id": sid,
                    "latitude": 31.52 if sid == "sensor_A" else 24.86,
                    "longitude": 74.35 if sid == "sensor_A" else 67.01,
                    "pm25": pm,
                    "pm25_baseline_persistence": pm,
                    "pm25_target_24h": pm + 5.0,  # synthetic future target
                    "T2M": 20.0,
                    "RH2M": 50.0,
                    "WS10M": 2.0,
                    "WD10M": 180.0,
                    "PS": 100.0,
                    "PRECTOTCORR": 0.0,
                    "T2MDEW": 10.0
                })

        self.fixture_df = pd.DataFrame(records)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_causality_and_sensor_isolation(self):
        """Verify that lag and rolling features never cross sensor boundaries or use future data."""
        feat_df = engineer_sensor_features(self.fixture_df, lags=[1, 24], rolling_windows=[6])

        # Sensor A and Sensor B base values should not bleed into each other
        sA = feat_df[feat_df["sensor_id"] == "sensor_A"].sort_values("timestamp_utc")
        sB = feat_df[feat_df["sensor_id"] == "sensor_B"].sort_values("timestamp_utc")

        # First row of each sensor must have NaN for lag_1h
        self.assertTrue(np.isnan(sA.iloc[0]["pm25_lag_1h"]))
        self.assertTrue(np.isnan(sB.iloc[0]["pm25_lag_1h"]))

        # Check that lag 1h for sensor B uses sensor B's previous value, not sensor A
        self.assertEqual(sB.iloc[1]["pm25_lag_1h"], sB.iloc[0]["pm25"])
        self.assertNotEqual(sB.iloc[1]["pm25_lag_1h"], sA.iloc[0]["pm25"])

    def test_feature_set_quarantine(self):
        """Verify that target, redundant baseline, and weather columns are strictly excluded."""
        modeling_df, feature_cols, audit = build_ml_feature_set(self.fixture_df, drop_lag1_nulls=False)

        # Forbidden features
        self.assertNotIn("pm25_target_24h", feature_cols)
        self.assertNotIn("pm25_baseline_persistence", feature_cols)
        self.assertNotIn("sensor_id", feature_cols)
        for w_col in ["T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"]:
            self.assertNotIn(w_col, feature_cols)

        # Essential features present
        self.assertIn("pm25", feature_cols)
        self.assertIn("pm25_lag_1h", feature_cols)
        self.assertIn("pm25_lag_24h", feature_cols)
        self.assertIn("city_code", feature_cols)

    def test_chronological_splitting_integrity(self):
        """Verify that splits are chronologically disjoint and maintain buffer gap."""
        train_df, val_df, test_df, meta = chronological_split(
            self.fixture_df,
            train_ratio=0.60,
            val_ratio=0.20,
            buffer_hours=2
        )

        # Check chronological ordering: max(train) < min(val) and max(val) < min(test)
        self.assertLess(train_df["timestamp_utc"].max(), val_df["timestamp_utc"].min())
        self.assertLess(val_df["timestamp_utc"].max(), test_df["timestamp_utc"].min())

        # Check buffer gap
        gap_train_val = (val_df["timestamp_utc"].min() - train_df["timestamp_utc"].max()).total_seconds() / 3600
        self.assertGreaterEqual(gap_train_val, 2.0)

        gap_val_test = (test_df["timestamp_utc"].min() - val_df["timestamp_utc"].max()).total_seconds() / 3600
        self.assertGreaterEqual(gap_val_test, 2.0)

    def test_model_training_and_serialization(self):
        """Verify model fitting, non-negative prediction, uncertainty intervals, and persistence."""
        modeling_df, feature_cols, _ = build_ml_feature_set(self.fixture_df, drop_lag1_nulls=True)
        train_df, val_df, test_df, _ = chronological_split(modeling_df, train_ratio=0.60, val_ratio=0.20, buffer_hours=2)

        forecaster = PM25Forecaster(max_iter=20, random_state=42)
        forecaster.fit(
            train_df[feature_cols],
            train_df["pm25_target_24h"],
            val_df[feature_cols],
            val_df["pm25_target_24h"]
        )

        preds, lower, upper = forecaster.predict_interval(test_df[feature_cols], coverage=0.80)

        # Assert no NaNs or infs
        self.assertEqual(len(preds), len(test_df))
        self.assertFalse(np.isnan(preds).any())
        self.assertFalse(np.isinf(preds).any())
        self.assertTrue((preds >= 1.0).all())
        self.assertTrue((upper >= lower).all())

        # Save and reload
        save_path = self.test_dir / "test_model.joblib"
        forecaster.save(save_path)
        loaded = PM25Forecaster.load(save_path)

        reloaded_preds = loaded.predict(test_df[feature_cols])
        np.testing.assert_allclose(preds, reloaded_preds, rtol=1e-5)

    def test_evaluation_identical_rows(self):
        """Verify baseline and model metrics are evaluated on exactly identical records."""
        eval_df = pd.DataFrame({
            "record_id": ["r1", "r2", "r3"],
            "city": ["Lahore", "Lahore", "Karachi"],
            "season": [1, 1, 2],
            "actual": [50.0, 60.0, 70.0],
            "predicted": [48.0, 62.0, 68.0],
            "baseline": [45.0, 50.0, 60.0],
            "lower_80": [40.0, 52.0, 58.0],
            "upper_80": [56.0, 72.0, 78.0]
        })

        analysis = comprehensive_error_analysis(eval_df)
        overall = analysis["overall"]
        self.assertEqual(overall["n"], 3)
        self.assertAlmostEqual(overall["model_mae"], (2.0 + 2.0 + 2.0) / 3.0, places=2)
        self.assertAlmostEqual(overall["base_mae"], (5.0 + 10.0 + 10.0) / 3.0, places=2)
        self.assertTrue(overall["beats_baseline"])
        self.assertEqual(analysis["uncertainty_80pct"]["empirical_coverage_pct"], 100.0)


if __name__ == "__main__":
    unittest.main()
